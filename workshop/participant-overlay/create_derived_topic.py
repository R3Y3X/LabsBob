#!/usr/bin/env python3
"""Create participant-scoped ksqlDB JSON_SR stream and table.

Binds the stream to the Schema Registry id of TOPIC_NAME-value and keeps
JSON field names quoted (`sku`, `branch`, …). Unquoted identifiers become
SKU/BRANCH and ksql JSON_SR then projects nulls, so the CTAS stays RUNNING,
consumes every offset, and never writes inventory.availability.* (Track F).
"""
import json
import os
import sys

import requests
from dotenv import load_dotenv


def _schema_registry_url() -> str:
    return (os.getenv("SCHEMA_REGISTRY_URL_INTERNAL") or os.environ["SCHEMA_REGISTRY_URL"]).rstrip("/")


def _sr_auth():
    if os.getenv("SCHEMA_REGISTRY_USERNAME") and os.getenv("SCHEMA_REGISTRY_PASSWORD"):
        return (os.environ["SCHEMA_REGISTRY_USERNAME"], os.environ["SCHEMA_REGISTRY_PASSWORD"])
    return None


def latest_value_schema_id(topic: str) -> int | None:
    """Id of {topic}-value so CREATE STREAM can set VALUE_SCHEMA_ID."""
    subject = f"{topic}-value"
    verify = os.getenv("TLS_VERIFY", "false").lower() == "true"
    try:
        response = requests.get(
            f"{_schema_registry_url()}/subjects/{requests.utils.quote(subject, safe='')}/versions/latest",
            auth=_sr_auth(),
            verify=verify,
            timeout=20,
        )
    except requests.RequestException as exc:
        print(f"Schema id lookup skipped: {exc}")
        return None
    if response.status_code != 200:
        print(f"Schema id lookup skipped: HTTP {response.status_code}")
        return None
    schema_id = response.json().get("id")
    return int(schema_id) if schema_id is not None else None


def main() -> None:
    load_dotenv()
    endpoint = os.environ["KSQLDB_ENDPOINT"].rstrip("/")
    source_topic = os.environ["TOPIC_NAME"]
    derived_topic = os.environ["DERIVED_TOPIC_NAME"]
    stream = os.environ["KSQL_STREAM_NAME"]
    table = os.environ["KSQL_TABLE_NAME"]
    replicas = int(os.getenv("TOPIC_REPLICATION_FACTOR", "1"))
    auth = None
    if os.getenv("KSQLDB_USERNAME") and os.getenv("KSQLDB_PASSWORD"):
        auth = (os.environ["KSQLDB_USERNAME"], os.environ["KSQLDB_PASSWORD"])
    schema_id = latest_value_schema_id(source_topic)
    extra_with = ""
    if schema_id is not None:
        extra_with = f",\n            VALUE_SCHEMA_ID={schema_id}"
        print(f"Binding stream to JSON Schema id={schema_id} ({source_topic}-value)")

    def submit(statement: str) -> None:
        response = requests.post(
            f"{endpoint}/ksql",
            headers={
                "Accept": "application/vnd.ksql.v1+json",
                "Content-Type": "application/vnd.ksql.v1+json",
            },
            auth=auth,
            timeout=60,
            json={
                "ksql": statement,
                "streamsProperties": {"ksql.streams.auto.offset.reset": "earliest"},
            },
        )
        if response.status_code != 200 and "already exists" not in response.text.lower():
            raise RuntimeError(f"ksqlDB error {response.status_code}: {response.text[:500]}")
        print(response.text[:500])

    submit(
        f"""CREATE STREAM IF NOT EXISTS {stream} (
            `sku` VARCHAR,
            `branch` VARCHAR,
            `quantity` INT,
            `transaction_type` VARCHAR,
            `timestamp` VARCHAR,
            `source` VARCHAR,
            `reference` VARCHAR
        ) WITH (
            KAFKA_TOPIC='{source_topic}',
            KEY_FORMAT='KAFKA',
            VALUE_FORMAT='JSON_SR',
            WRAP_SINGLE_VALUE='false'{extra_with}
        );"""
    )
    submit(
        f"""CREATE TABLE IF NOT EXISTS {table} WITH (
            KAFKA_TOPIC='{derived_topic}',
            KEY_FORMAT='JSON',
            VALUE_FORMAT='JSON_SR',
            PARTITIONS=1,
            REPLICAS={replicas}
        ) AS SELECT `sku`, `branch`, SUM(`quantity`) AS `available_quantity`
        FROM {stream}
        GROUP BY `sku`, `branch`
        EMIT CHANGES;"""
    )
    print(f"Derived table ready: {table} -> {derived_topic}")
    print(
        "If this CTAS stays RUNNING but the sink stays empty after produce, "
        "setup.sh -s 3 runs materialize_availability.py (ksql fallback only; not Flink)."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
