#!/usr/bin/env python3
"""Fill inventory.availability.* only when the ksql CTAS did not emit rows.

Track F / MCP reads DERIVED_TOPIC_NAME (ksql sink), never FLINK_TOPIC_NAME.
Flink can show stock in inventory.availability.flink.* while the ksql topic
is empty: the persistent query consumes JSON_SR offsets and writes nothing.

This script is that case only. It aggregates TOPIC_NAME (same SUM as ksql/Flink)
and writes {sku, branch, available_quantity} into the ksql sink so get_sku_availability
can read it. It does not write to the Flink topic and does not change the MCP.
"""
from __future__ import annotations

import json
import os
import sys
import time
from collections import defaultdict

from confluent_kafka import Consumer, Producer, TopicPartition
from dotenv import load_dotenv


def _kafka_config(*, consumer: bool = False) -> dict:
    config = {"bootstrap.servers": os.environ["BOOTSTRAP_SERVERS"]}
    if consumer:
        config["enable.auto.commit"] = False
    if os.getenv("KAFKA_SASL_USERNAME") and os.getenv("KAFKA_SASL_PASSWORD"):
        config.update(
            {
                "security.protocol": os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL"),
                "sasl.mechanism": os.getenv("KAFKA_SASL_MECHANISM", "PLAIN"),
                "sasl.username": os.environ["KAFKA_SASL_USERNAME"],
                "sasl.password": os.environ["KAFKA_SASL_PASSWORD"],
                "ssl.endpoint.identification.algorithm": "none",
                "enable.ssl.certificate.verification": "false",
            }
        )
    return config


def _message_count(consumer: Consumer, topic: str) -> int:
    metadata = consumer.list_topics(topic, timeout=15)
    if topic not in metadata.topics or metadata.topics[topic].error:
        return 0
    total = 0
    for partition in metadata.topics[topic].partitions:
        low, high = consumer.get_watermark_offsets(TopicPartition(topic, partition), timeout=8)
        total += max(0, high - low)
    return total


def _decode_json_sr(raw: bytes | None) -> dict | None:
    if not raw:
        return None
    payload = raw
    if len(raw) >= 6 and raw[0] == 0:
        payload = raw[5:]
        if payload[:1] not in (b"{", b"[") and len(raw) >= 7:
            payload = raw[6:]
    try:
        value = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _field(record: dict, *names: str):
    lower = {str(key).casefold(): value for key, value in record.items()}
    for name in names:
        if name.casefold() in lower:
            return lower[name.casefold()]
    return None


def _consume_totals(consumer: Consumer, topic: str) -> dict[tuple[str, str], int]:
    metadata = consumer.list_topics(topic, timeout=15)
    if topic not in metadata.topics or metadata.topics[topic].error:
        return {}
    assignments = []
    expected = 0
    for partition in metadata.topics[topic].partitions:
        low, high = consumer.get_watermark_offsets(TopicPartition(topic, partition), timeout=8)
        if high <= low:
            continue
        assignments.append(TopicPartition(topic, partition, low))
        expected += high - low
    if not assignments:
        return {}
    consumer.assign(assignments)
    totals: dict[tuple[str, str], int] = defaultdict(int)
    read = 0
    deadline = time.time() + 25
    while read < expected and time.time() < deadline:
        message = consumer.poll(0.4)
        if message is None or message.error():
            continue
        read += 1
        value = _decode_json_sr(message.value())
        if not value:
            continue
        sku = _field(value, "sku")
        branch = _field(value, "branch")
        quantity = _field(value, "quantity")
        if sku is None or branch is None or quantity is None:
            continue
        try:
            totals[(str(sku), str(branch))] += int(quantity)
        except (TypeError, ValueError):
            continue
    consumer.unassign()
    return dict(totals)


def main() -> None:
    load_dotenv()
    source = os.environ["TOPIC_NAME"]
    derived = os.environ["DERIVED_TOPIC_NAME"]
    flink = os.getenv("FLINK_TOPIC_NAME", "")
    wait_s = int(os.getenv("KSQL_MATERIALIZE_WAIT_SECONDS", "5"))
    if wait_s > 0:
        print(f"Waiting {wait_s}s for the ksql CTAS to emit into {derived}...")
        time.sleep(wait_s)

    consumer = Consumer({**_kafka_config(consumer=True), "group.id": f"ksql-fallback-{int(time.time())}"})
    try:
        source_count = _message_count(consumer, source)
        derived_count = _message_count(consumer, derived)
        print(f"transactions {source}: {source_count} messages")
        print(f"ksql sink {derived}: {derived_count} messages")
        if flink:
            print(f"flink sink {flink}: not used by Track F / MCP")

        if derived_count > 0:
            print(
                f"ksql sink already has {derived_count} messages; "
                "no fallback. Track F reads this topic (not Flink)."
            )
            return
        if source_count == 0:
            print(f"No transactions on {source} yet; nothing to materialize.")
            return

        print(
            "KSQL_FALLBACK: the CTAS can be RUNNING and still write zero rows "
            f"to {derived} (JSON_SR consume-without-emit)."
        )
        print(
            "KSQL_FALLBACK: this runs ONLY in that case. "
            f"Aggregating {source} -> {derived} for Track F / MCP."
        )
        print("KSQL_FALLBACK: not writing to inventory.availability.flink.*")
        totals = _consume_totals(consumer, source)
    finally:
        consumer.close()

    if not totals:
        raise RuntimeError(
            f"KSQL_FALLBACK failed: decoded 0 sku/branch totals from {source} "
            f"({source_count} raw messages)"
        )

    producer = Producer({**_kafka_config(), "acks": "all"})
    failures: list[str] = []

    def on_delivery(error, _message) -> None:
        if error:
            failures.append(str(error))

    for (sku, branch), quantity in sorted(totals.items()):
        key = json.dumps({"sku": sku, "branch": branch}, separators=(",", ":")).encode()
        value = json.dumps(
            {"sku": sku, "branch": branch, "available_quantity": quantity},
            separators=(",", ":"),
        ).encode()
        producer.produce(derived, key=key, value=value, on_delivery=on_delivery)
        producer.poll(0)
    producer.flush(30)
    if failures:
        raise RuntimeError("; ".join(failures))
    print(
        f"KSQL_FALLBACK: produced {len(totals)} rows into {derived} "
        "(sku, branch, available_quantity). MCP can read this topic now."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
