#!/usr/bin/env python3
"""Register the JSON Schema used by the participant source topic."""
import json
import os
import sys

import requests
from dotenv import load_dotenv


SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "InventoryTransaction",
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


def main() -> None:
    load_dotenv()
    base = os.environ["SCHEMA_REGISTRY_URL"].rstrip("/")
    subject = f'{os.environ["TOPIC_NAME"]}-value'
    auth = None
    if os.getenv("SCHEMA_REGISTRY_USERNAME") and os.getenv("SCHEMA_REGISTRY_PASSWORD"):
        auth = (os.environ["SCHEMA_REGISTRY_USERNAME"], os.environ["SCHEMA_REGISTRY_PASSWORD"])
    verify = os.getenv("TLS_VERIFY", "false").lower() == "true"
    response = requests.post(
        f"{base}/subjects/{requests.utils.quote(subject, safe='')}/versions",
        headers={
            "Content-Type": "application/vnd.schemaregistry.v1+json",
            "Accept": "application/vnd.schemaregistry.v1+json",
        },
        auth=auth,
        verify=verify,
        timeout=30,
        json={"schemaType": "JSON", "schema": json.dumps(SCHEMA, separators=(",", ":"))},
    )
    if response.status_code not in (200, 201, 409):
        raise RuntimeError(f"Schema Registry error {response.status_code}: {response.text[:500]}")
    print(f"JSON schema ready: {subject}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
