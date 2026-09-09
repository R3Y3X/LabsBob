#!/usr/bin/env python3
"""Idempotent: ksqlDB server must have Schema Registry before JSON_SR DDL.

Runs on the TechZone VM host (kubectl), not in the python:3.11-slim Job.
If ksql.schema.registry.url is already live, prints KSQL_SR_OK and exits.
Otherwise patches ConfigMap ksqldb-shared-config and restarts statefulset/ksqldb.

Never prints passwords. Never embeds user:pass in the SR URL.
Do not pass ksql.schema.registry.url in /ksql streamsProperties — that is ignored.
"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
from pathlib import Path


NS = "confluent"
SR_URL = "http://schemaregistry.confluent.svc.cluster.local:8081"
LIVE_PROPS = "/opt/confluentinc/etc/ksqldb/ksqldb.properties"


def load_env(path: str) -> dict[str, str]:
    data: dict[str, str] = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key] = value.strip().strip('"')
    return data


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print("CMD FAIL:", " ".join(cmd[:8]), file=sys.stderr)
        print((result.stderr or result.stdout or "")[:400], file=sys.stderr)
        sys.exit(1)
    return result


def live_has_sr_url() -> bool:
    result = run(
        [
            "kubectl",
            "-n",
            NS,
            "exec",
            "ksqldb-0",
            "--",
            "grep",
            "-E",
            "^ksql.schema.registry.url=",
            LIVE_PROPS,
        ],
        check=False,
    )
    return result.returncode == 0 and "ksql.schema.registry.url=" in (result.stdout or "")


def sr_password() -> str:
    raw = run(
        [
            "kubectl",
            "-n",
            NS,
            "get",
            "secret",
            "schemaregistry-users",
            "-o",
            "jsonpath={.data.basic\\.txt}",
        ]
    ).stdout.strip()
    line = base64.b64decode(raw).decode().strip()
    return line.split(": ", 1)[1].split(",", 1)[0]


def patch_configmap(userinfo: str) -> bool:
    cm = json.loads(run(["kubectl", "-n", NS, "get", "configmap", "ksqldb-shared-config", "-o", "json"]).stdout)
    props = (cm.get("data") or {}).get("ksqldb.properties") or ""
    changed = False
    if "ksql.schema.registry.url=" not in props:
        props += f"\nksql.schema.registry.url={SR_URL}"
        changed = True
    if "ksql.schema.registry.basic.auth.credentials.source=" not in props:
        props += "\nksql.schema.registry.basic.auth.credentials.source=USER_INFO"
        changed = True
    if "ksql.schema.registry.basic.auth.user.info=" not in props:
        props += f"\nksql.schema.registry.basic.auth.user.info={userinfo}"
        changed = True
    if not changed:
        print("KSQL_SR_CM_ALREADY_SET")
        return False
    cm["data"]["ksqldb.properties"] = props
    cm.pop("status", None)
    meta = cm.get("metadata") or {}
    for key in ("managedFields", "resourceVersion", "uid", "creationTimestamp", "generation"):
        meta.pop(key, None)
    applied = subprocess.run(
        ["kubectl", "-n", NS, "apply", "-f", "-"],
        input=json.dumps(cm),
        text=True,
        capture_output=True,
    )
    if applied.returncode != 0:
        print((applied.stderr or applied.stdout or "")[:400], file=sys.stderr)
        sys.exit(1)
    print("KSQL_SR_CM_PATCHED")
    return True


def restart_ksql() -> None:
    print("KSQL_SR_RESTART statefulset/ksqldb")
    run(["kubectl", "-n", NS, "rollout", "restart", "statefulset/ksqldb"])
    run(["kubectl", "-n", NS, "rollout", "status", "statefulset/ksqldb", "--timeout=180s"])


def main() -> None:
    env_path = os.environ.get("ENV_FILE", str(Path(__file__).resolve().parent / ".env"))
    if Path(env_path).is_file():
        load_env(env_path)
    if live_has_sr_url():
        print("KSQL_SR_OK ksql already has ksql.schema.registry.url — no restart")
        return
    print("KSQL_SR_MISSING live ksql has no schema.registry.url — patching ConfigMap")
    userinfo = f"admin:{sr_password()}"
    patch_configmap(userinfo)
    restart_ksql()
    if not live_has_sr_url():
        print("KSQL_SR_FAIL live properties still missing ksql.schema.registry.url", file=sys.stderr)
        sys.exit(1)
    print("KSQL_SR_OK ksql now has ksql.schema.registry.url")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
