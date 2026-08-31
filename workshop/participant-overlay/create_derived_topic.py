#!/usr/bin/env python3
"""Create participant-scoped ksqlDB JSON_SR stream and table."""
import os
import sys

import requests
from dotenv import load_dotenv


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
            sku VARCHAR, branch VARCHAR, quantity INT, transaction_type VARCHAR,
            timestamp VARCHAR, source VARCHAR, reference VARCHAR
        ) WITH (
            KAFKA_TOPIC='{source_topic}', KEY_FORMAT='KAFKA', VALUE_FORMAT='JSON_SR'
        );"""
    )
    submit(
        f"""CREATE TABLE IF NOT EXISTS {table} WITH (
            KAFKA_TOPIC='{derived_topic}', KEY_FORMAT='JSON', VALUE_FORMAT='JSON_SR',
            PARTITIONS=1, REPLICAS={replicas}
        ) AS SELECT sku, branch, SUM(quantity) AS available_quantity
        FROM {stream} GROUP BY sku, branch EMIT CHANGES;"""
    )
    print(f"Derived table ready: {table}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
