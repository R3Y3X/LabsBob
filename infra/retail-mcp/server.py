#!/usr/bin/env python3
"""Participant-scoped inventory MCP server for watsonx Orchestrate."""
from __future__ import annotations

import json
import os
import re
from typing import Any

import requests
from fastmcp import FastMCP
from starlette.requests import Request
from starlette.responses import JSONResponse


TABLE_NUMBER = int(os.getenv("WORKSHOP_TABLE", "1"))
if TABLE_NUMBER not in (1, 2, 3):
    raise RuntimeError("WORKSHOP_TABLE debe ser 1, 2 o 3")
KSQL_ENDPOINT = os.environ.get("KSQLDB_ENDPOINT_EXTERNAL", os.environ.get("KSQLDB_ENDPOINT", "")).rstrip("/")
KSQL_USER = os.getenv("KSQLDB_USERNAME")
KSQL_PASSWORD = os.getenv("KSQLDB_PASSWORD")
TLS_VERIFY = os.getenv("TLS_VERIFY", "false").lower() == "true"
WORKSPACE_RE = re.compile(r"^m(?P<table>[0-9]{2})_p(?P<number>[0-9]{3})$")
ALLOWED_BRANCHES = {"Dot Shopping", "Unicenter"}
ALLOWED_SKUS = {
    "LAPTOP-DELL-XPS-15",
    "LAPTOP-MACBOOK-PRO-16",
    "LAPTOP-HP-SPECTRE-X360",
    "MOBILE-IPHONE-17-PRO-MAX",
    "MOBILE-SAMSUNG-S24-ULTRA",
    "MOBILE-GOOGLE-PIXEL-8-PRO",
}

mcp = FastMCP("Voltia Retail Availability")


def _workspace_is_valid(workshop_id: str) -> bool:
    match = WORKSPACE_RE.fullmatch(workshop_id or "")
    return bool(match and int(match.group("table")) == TABLE_NUMBER and 1 <= int(match.group("number")) <= 100)


def _table_for_workspace(workshop_id: str) -> str:
    match = WORKSPACE_RE.fullmatch(workshop_id)
    if not match:
        raise ValueError("invalid workshop_id")
    return f"INVENTORY_AVAILABILITY_M{match.group('table')}_P{match.group('number')}"


def _sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _iter_json_lines(response: requests.Response) -> list[dict[str, Any]]:
    """Parse both ksqlDB's JSON array and its line-delimited response."""
    try:
        parsed = response.json()
        if isinstance(parsed, list):
            return [item for item in parsed if isinstance(item, dict)]
        if isinstance(parsed, dict):
            return [parsed]
    except ValueError:
        pass
    items: list[dict[str, Any]] = []
    for line in response.iter_lines(decode_unicode=True):
        if not line:
            continue
        try:
            item = json.loads(line)
        except (TypeError, ValueError):
            continue
        if isinstance(item, dict):
            items.append(item)
    return items


def _query_inventory(workshop_id: str, sku: str, branch: str) -> int | None:
    if not KSQL_ENDPOINT:
        raise RuntimeError("KSQLDB_ENDPOINT_EXTERNAL no está configurado")
    table_name = _table_for_workspace(workshop_id)
    statement = (
        f"SELECT SKU, BRANCH, AVAILABLE_QUANTITY FROM {table_name} "
        f"WHERE SKU={_sql_literal(sku)} AND BRANCH={_sql_literal(branch)};"
    )
    response = requests.post(
        f"{KSQL_ENDPOINT}/query",
        headers={"Accept": "application/vnd.ksql.v1+json", "Content-Type": "application/vnd.ksql.v1+json"},
        auth=(KSQL_USER, KSQL_PASSWORD) if KSQL_USER and KSQL_PASSWORD else None,
        verify=TLS_VERIFY,
        timeout=30,
        json={"ksql": statement, "streamsProperties": {"ksql.query.pull.table.scan.enabled": "true"}},
    )
    response.raise_for_status()
    for item in _iter_json_lines(response):
        row = item.get("row")
        if not isinstance(row, dict):
            continue
        columns = row.get("columns", [])
        if len(columns) >= 3:
            try:
                return int(columns[2])
            except (TypeError, ValueError):
                return None
    return None


@mcp.tool
def get_sku_availability(workshop_id: str, sku: str, branch: str) -> dict[str, Any]:
    """Return current stock for one SKU and branch in this workspace."""
    result: dict[str, Any] = {"workshop_id": workshop_id, "sku": sku, "branch": branch, "found": False}
    if not _workspace_is_valid(workshop_id):
        result["error"] = "workshop_id no corresponde a la mesa de este servidor"
        return result
    if sku not in ALLOWED_SKUS or branch not in ALLOWED_BRANCHES:
        result["error"] = "SKU o sucursal no reconocidos"
        return result
    quantity = _query_inventory(workshop_id, sku, branch)
    if quantity is not None:
        result.update({"available_quantity": quantity, "found": True})
    return result


@mcp.custom_route("/health", methods=["GET"])
async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "workshop_table": TABLE_NUMBER, "table_pattern": f"INVENTORY_AVAILABILITY_M{TABLE_NUMBER:02d}_P%03d"})


if __name__ == "__main__":
    mcp.run(
        transport=os.getenv("MCP_TRANSPORT", "http"),
        host=os.getenv("MCP_HOST", "127.0.0.1"),
        port=int(os.getenv("MCP_PORT", "8000")),
        path=os.getenv("MCP_PATH", "/mcp"),
    )
