#!/usr/bin/env python3
"""Publish deterministic inventory transactions using JSON Schema serialization."""
import json
import os
import sys

from confluent_kafka import Producer
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.json_schema import JSONSerializer
from confluent_kafka.serialization import MessageField, SerializationContext
from dotenv import load_dotenv


SCHEMA = json.dumps(
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "sku": {"type": "string"},
            "branch": {"type": "string"},
            "quantity": {"type": "integer"},
            "transaction_type": {"type": "string"},
            "timestamp": {"type": "string"},
            "source": {"type": "string"},
            "reference": {"type": "string"},
        },
        "required": [
            "sku",
            "branch",
            "quantity",
            "transaction_type",
            "timestamp",
            "source",
            "reference",
        ],
    }
)


def transactions():
    stock = [
        ("LAPTOP-DELL-XPS-15", "Dot Shopping", 50),
        ("LAPTOP-MACBOOK-PRO-16", "Unicenter", 40),
        ("LAPTOP-HP-SPECTRE-X360", "Dot Shopping", 45),
        ("MOBILE-IPHONE-17-PRO-MAX", "Unicenter", 80),
        ("MOBILE-SAMSUNG-S24-ULTRA", "Dot Shopping", 70),
        ("MOBILE-GOOGLE-PIXEL-8-PRO", "Unicenter", 60),
    ]
    result = []
    for index, (sku, branch, quantity) in enumerate(stock, 1):
        result.append(
            {
                "sku": sku,
                "branch": branch,
                "quantity": quantity,
                "transaction_type": "ADDITION",
                "timestamp": f"2025-12-29T08:{index:02d}:00Z",
                "source": "inventory_manager",
                "reference": f"PO-2025-{index:03d}",
            }
        )
    for index in range(7, 21):
        sku, branch, _ = stock[(index - 7) % len(stock)]
        result.append(
            {
                "sku": sku,
                "branch": branch,
                "quantity": -((index * 3) % 17 + 1),
                "transaction_type": "SALE",
                "timestamp": f"2025-12-29T{10 + index // 6:02d}:{(index * 7) % 60:02d}:00Z",
                "source": "pos_system",
                "reference": f"SALE-2025-{index:03d}",
            }
        )
    return result


def main() -> None:
    load_dotenv()
    topic = os.environ["TOPIC_NAME"]
    sr_config = {"url": os.environ["SCHEMA_REGISTRY_URL"]}
    if os.getenv("SCHEMA_REGISTRY_USERNAME") and os.getenv("SCHEMA_REGISTRY_PASSWORD"):
        sr_config["basic.auth.user.info"] = (
            os.environ["SCHEMA_REGISTRY_USERNAME"]
            + ":"
            + os.environ["SCHEMA_REGISTRY_PASSWORD"]
        )
    serializer = JSONSerializer(
        SCHEMA,
        SchemaRegistryClient(sr_config),
        {"auto.register.schemas": False, "use.latest.version": True},
    )
    producer_config = {"bootstrap.servers": os.environ["BOOTSTRAP_SERVERS"]}
    if os.getenv("KAFKA_SASL_USERNAME") and os.getenv("KAFKA_SASL_PASSWORD"):
        producer_config.update(
            {
                "security.protocol": os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL"),
                "sasl.mechanism": os.getenv("KAFKA_SASL_MECHANISM", "PLAIN"),
                "sasl.username": os.environ["KAFKA_SASL_USERNAME"],
                "sasl.password": os.environ["KAFKA_SASL_PASSWORD"],
                "ssl.endpoint.identification.algorithm": "none",
            }
        )
    producer = Producer(producer_config)
    failures = []

    def on_delivery(error, message):
        if error:
            failures.append(str(error))

    items = transactions()
    for item in items:
        producer.produce(
            topic,
            key=item["sku"].encode(),
            value=serializer(item, SerializationContext(topic, MessageField.VALUE)),
            on_delivery=on_delivery,
        )
        producer.poll(0)
    producer.flush(60)
    if failures:
        raise RuntimeError("; ".join(failures))
    print(f"Published {len(items)} JSON_SR transactions to {topic}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
