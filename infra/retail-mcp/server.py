#!/usr/bin/env python3
"""Participant-scoped inventory MCP — Kafka consumer for watsonx Orchestrate."""
from __future__ import annotations

import json
import os
import re
import time
from typing import Any

import requests
from confluent_kafka import Consumer, KafkaError, KafkaException, TopicPartition
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse


TABLE_NUMBER = int(os.getenv("WORKSHOP_TABLE", "1"))
if TABLE_NUMBER not in (1, 2, 3):
    raise RuntimeError("WORKSHOP_TABLE debe ser 1, 2 o 3")

BOOTSTRAP = os.getenv("BOOTSTRAP_SERVERS_EXTERNAL") or os.getenv("BOOTSTRAP_SERVERS", "")
KAFKA_USER = os.getenv("KAFKA_SASL_USERNAME", "")
KAFKA_PASSWORD = os.getenv("KAFKA_SASL_PASSWORD", "")
SECURITY_PROTOCOL = os.getenv("KAFKA_SECURITY_PROTOCOL", "SASL_SSL")
SASL_MECHANISM = os.getenv("KAFKA_SASL_MECHANISM", "PLAIN")
SR_URL = os.getenv("SCHEMA_REGISTRY_URL", "").rstrip("/")
SR_USER = os.getenv("SCHEMA_REGISTRY_USERNAME", "")
SR_PASSWORD = os.getenv("SCHEMA_REGISTRY_PASSWORD", "")
TLS_VERIFY = os.getenv("TLS_VERIFY", "false").lower() == "true"
READ_TIMEOUT_SECONDS = int(os.getenv("WORKSHOP_READ_TIMEOUT_SECONDS", "25"))

ALLOWED_SKUS = {
    "LAPTOP-DELL-XPS-15",
    "LAPTOP-MACBOOK-PRO-16",
    "LAPTOP-HP-SPECTRE-X360",
    "MOBILE-IPHONE-17-PRO-MAX",
    "MOBILE-SAMSUNG-S24-ULTRA",
    "MOBILE-GOOGLE-PIXEL-8-PRO",
}
CANONICAL_BRANCHES = {
    "dot shopping": "Dot Shopping",
    "dot": "Dot Shopping",
    "el dot": "Dot Shopping",
    "la sucursal dot": "Dot Shopping",
    "unicenter": "Unicenter",
    "el unicenter": "Unicenter",
    "uni": "Unicenter",
}

mcp = FastMCP("Voltia Retail Availability")
_consumer_counter = 0


def _parse_int(value: str, lo: int, hi: int) -> int | None:
    raw = str(value or "").strip()
    if not re.fullmatch(r"\d+", raw):
        return None
    number = int(raw)
    if not lo <= number <= hi:
        return None
    return number


def _topic_name(table_number: str, participant_number: str) -> str | None:
    table = _parse_int(table_number, 1, 3)
    participant = _parse_int(participant_number, 1, 100)
    if table is None or participant is None:
        return None
    return f"inventory.availability.tz{table}_p{participant:03d}"


def _normalize_branch(branch: str) -> str | None:
    raw = (branch or "").strip()
    if not raw:
        return None
    return CANONICAL_BRANCHES.get(raw.casefold(), raw if raw in {"Dot Shopping", "Unicenter"} else None)


def _field(record: dict[str, Any], *names: str) -> Any:
    lower = {str(key).casefold(): value for key, value in record.items()}
    for name in names:
        if name.casefold() in lower:
            return lower[name.casefold()]
    return None


def _as_int(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _kafka_config() -> dict[str, Any]:
    if not BOOTSTRAP:
        raise RuntimeError("BOOTSTRAP_SERVERS_EXTERNAL no está configurado")
    config: dict[str, Any] = {
        "bootstrap.servers": BOOTSTRAP,
        "enable.auto.commit": False,
        "session.timeout.ms": 10000,
        "enable.ssl.certificate.verification": TLS_VERIFY,
        "ssl.endpoint.identification.algorithm": "https" if TLS_VERIFY else "none",
    }
    if KAFKA_USER and KAFKA_PASSWORD:
        config.update(
            {
                "security.protocol": SECURITY_PROTOCOL,
                "sasl.mechanism": SASL_MECHANISM,
                "sasl.username": KAFKA_USER,
                "sasl.password": KAFKA_PASSWORD,
            }
        )
    return config


def _new_consumer(topic: str) -> Consumer:
    global _consumer_counter
    _consumer_counter += 1
    config = _kafka_config()
    config["group.id"] = f"retail-mcp-{topic}-{int(time.time())}-{_consumer_counter}"
    config["auto.offset.reset"] = "earliest"
    return Consumer(config)


def _decode_json_sr(raw: bytes | None) -> dict[str, Any] | None:
    if not raw:
        return None
    payload = raw
    if len(raw) >= 6 and raw[0] == 0:
        payload = raw[5:]
        if payload[:1] in (b"{", b"["):
            pass
        elif len(raw) >= 7:
            # JSON Schema wire format may insert a one-byte index count.
            payload = raw[6:]
    try:
        value = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _record_from_message(raw_value: bytes | None, raw_key: bytes | None) -> dict[str, Any] | None:
    value = _decode_json_sr(raw_value)
    if value is None:
        return None
    key = _decode_json_sr(raw_key) if raw_key else None
    sku = _field(value, "sku") or (_field(key, "sku") if key else None)
    branch = _field(value, "branch") or (_field(key, "branch") if key else None)
    quantity = _field(value, "available_quantity", "AVAILABLE_QUANTITY")
    if sku is None or branch is None:
        return None
    return {
        "sku": str(sku),
        "branch": str(branch),
        "available_quantity": _as_int(quantity),
    }


def _consume_availability(topic: str) -> tuple[dict[tuple[str, str], int], dict[str, Any]]:
    diagnostic: dict[str, Any] = {
        "topic": topic,
        "total_read": 0,
        "decode_errors": 0,
        "complete": False,
        "error": None,
    }
    latest: dict[tuple[str, str], int] = {}
    consumer = _new_consumer(topic)
    try:
        metadata = consumer.list_topics(topic, timeout=10)
        if topic not in metadata.topics or metadata.topics[topic].error:
            diagnostic["error"] = f"Topic no disponible: {topic}"
            return latest, diagnostic

        assignments: list[TopicPartition] = []
        high_offsets: dict[int, int] = {}
        for partition in metadata.topics[topic].partitions:
            low, high = consumer.get_watermark_offsets(TopicPartition(topic, partition), timeout=5)
            if high <= low:
                continue
            assignments.append(TopicPartition(topic, partition, low))
            high_offsets[partition] = high
        if not assignments:
            diagnostic["complete"] = True
            return latest, diagnostic

        consumer.assign(assignments)
        pending = set(high_offsets)
        positions = {item.partition: item.offset for item in assignments}
        deadline = time.time() + READ_TIMEOUT_SECONDS
        while pending and time.time() < deadline:
            message = consumer.poll(0.5)
            if message is None:
                continue
            if message.error():
                if message.error().code() != KafkaError._PARTITION_EOF:
                    diagnostic["error"] = str(message.error())
                continue
            partition = message.partition()
            positions[partition] = message.offset() + 1
            if positions[partition] >= high_offsets.get(partition, 0):
                pending.discard(partition)
            decoded = _record_from_message(message.value(), message.key())
            if decoded is None:
                if message.value():
                    diagnostic["decode_errors"] += 1
                continue
            diagnostic["total_read"] += 1
            quantity = decoded["available_quantity"]
            if quantity is None:
                continue
            canonical = _normalize_branch(decoded["branch"]) or decoded["branch"]
            latest[(decoded["sku"], canonical)] = quantity
        diagnostic["complete"] = not pending
    except KafkaException as error:
        diagnostic["error"] = str(error)
    except Exception as error:
        diagnostic["error"] = str(error)
    finally:
        consumer.close()
    return latest, diagnostic


@mcp.tool
def get_sku_availability(
    table_number: str,
    participant_number: str,
    sku: str,
    branch: str,
) -> dict[str, Any]:
    """Return current stock for one SKU and branch in the participant Kafka topic."""
    canonical_branch = _normalize_branch(branch)
    result: dict[str, Any] = {
        "table_number": str(table_number).strip(),
        "participant_number": str(participant_number).strip(),
        "sku": sku,
        "branch": canonical_branch or branch,
        "found": False,
    }
    topic = _topic_name(table_number, participant_number)
    if topic is None:
        result["error"] = "table_number debe ser 1-3 y participant_number 1-100"
        return result
    if _parse_int(table_number, 1, 3) != TABLE_NUMBER:
        result["error"] = "table_number no corresponde a la TechZone de este servidor"
        return result
    if sku not in ALLOWED_SKUS or canonical_branch is None:
        result["error"] = "SKU o sucursal no reconocidos"
        return result
    latest, diagnostic = _consume_availability(topic)
    result["diagnostico"] = diagnostic
    quantity = latest.get((sku, canonical_branch))
    if quantity is not None:
        result.update({"available_quantity": quantity, "found": True})
    elif diagnostic.get("error"):
        result["error"] = diagnostic["error"]
    return result


@mcp.custom_route("/health", methods=["GET"])
async def health(_: Request) -> JSONResponse:
    sr_ok = None
    if SR_URL:
        try:
            response = requests.get(
                f"{SR_URL}/subjects",
                auth=(SR_USER, SR_PASSWORD) if SR_USER and SR_PASSWORD else None,
                verify=TLS_VERIFY,
                timeout=5,
            )
            sr_ok = response.ok
        except requests.RequestException:
            sr_ok = False
    return JSONResponse(
        {
            "status": "ok",
            "workshop_table": TABLE_NUMBER,
            "topic_pattern": f"inventory.availability.tz{TABLE_NUMBER}_p%03d",
            "schema_registry": sr_ok,
        }
    )


if __name__ == "__main__":
    mcp.run(
        transport=os.getenv("MCP_TRANSPORT", "http"),
        host=os.getenv("MCP_HOST", "127.0.0.1"),
        port=int(os.getenv("MCP_PORT", "8000")),
        path=os.getenv("MCP_PATH", "/mcp"),
    )
