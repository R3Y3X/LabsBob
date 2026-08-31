#!/usr/bin/env python3
"""Create the participant-scoped source topic."""
import os
import sys

from confluent_kafka.admin import AdminClient, NewTopic
from dotenv import load_dotenv


def main() -> None:
    load_dotenv()
    topic = os.environ["TOPIC_NAME"]
    config = {"bootstrap.servers": os.environ["BOOTSTRAP_SERVERS"]}
    user = os.getenv("KAFKA_SASL_USERNAME")
    password = os.getenv("KAFKA_SASL_PASSWORD")
    if user and password:
        config.update(
            {
                "security.protocol": os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL"),
                "sasl.mechanism": os.getenv("KAFKA_SASL_MECHANISM", "PLAIN"),
                "sasl.username": user,
                "sasl.password": password,
                "ssl.endpoint.identification.algorithm": "none",
            }
        )
    admin = AdminClient(config)
    if topic in admin.list_topics(timeout=15).topics:
        print(f"Topic already exists: {topic}")
        return
    future = admin.create_topics(
        [
            NewTopic(
                topic,
                num_partitions=int(os.getenv("TOPIC_PARTITIONS", "1")),
                replication_factor=int(os.getenv("TOPIC_REPLICATION_FACTOR", "1")),
                config={"retention.ms": os.getenv("TOPIC_RETENTION_MS", "-1")},
            )
        ]
    )[topic]
    future.result()
    print(f"Created topic: {topic}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
