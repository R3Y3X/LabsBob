#!/usr/bin/env python3
"""Delete only the topics and ksqlDB objects in this participant workspace."""
import os
import time

import requests
from confluent_kafka.admin import AdminClient
from dotenv import load_dotenv


def main() -> None:
    load_dotenv()
    endpoint = os.environ["KSQLDB_ENDPOINT"].rstrip("/")
    auth = None
    if os.getenv("KSQLDB_USERNAME") and os.getenv("KSQLDB_PASSWORD"):
        auth = (os.environ["KSQLDB_USERNAME"], os.environ["KSQLDB_PASSWORD"])
    for kind, name in (("TABLE", os.environ["KSQL_TABLE_NAME"]), ("STREAM", os.environ["KSQL_STREAM_NAME"])):
        response = requests.post(
            f"{endpoint}/ksql",
            headers={"Content-Type": "application/vnd.ksql.v1+json"},
            auth=auth,
            timeout=30,
            json={"ksql": f"DROP {kind} IF EXISTS {name} DELETE TOPIC;"},
        )
        print(f"drop {kind} {name}: {response.status_code}")
        time.sleep(2)
    config = {"bootstrap.servers": os.environ["BOOTSTRAP_SERVERS"]}
    if os.getenv("KAFKA_SASL_USERNAME") and os.getenv("KAFKA_SASL_PASSWORD"):
        config.update(
            {
                "security.protocol": os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL"),
                "sasl.mechanism": os.getenv("KAFKA_SASL_MECHANISM", "PLAIN"),
                "sasl.username": os.environ["KAFKA_SASL_USERNAME"],
                "sasl.password": os.environ["KAFKA_SASL_PASSWORD"],
                "ssl.endpoint.identification.algorithm": "none",
            }
        )
    admin = AdminClient(config)
    existing = admin.list_topics(timeout=15).topics
    topics = [name for name in (os.environ["TOPIC_NAME"], os.environ["DERIVED_TOPIC_NAME"]) if name in existing]
    for name, future in admin.delete_topics(topics, operation_timeout=30).items():
        future.result()
        print(f"deleted {name}")


if __name__ == "__main__":
    main()
