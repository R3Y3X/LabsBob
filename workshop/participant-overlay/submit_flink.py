#!/usr/bin/env python3
"""Submit the participant Flink SQL aggregation via CMF on the VM host.

Runs on the TechZone VM (python3 + confluent CLI), not in the python:3.11-slim Job.
Never prints passwords or JAAS.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

from pathlib import Path


def load_env(path: str) -> dict[str, str]:
    data: dict[str, str] = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key] = value.strip().strip('"')
    return data


def redact(text: str) -> str:
    import re

    return re.sub(r"admin:[^\s\"']+", "admin:***", text or "")


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print("CMD FAIL:", " ".join(cmd[:6]), file=sys.stderr)
        print(redact((result.stdout or "")[:500]), file=sys.stderr)
        print(redact((result.stderr or "")[:500]), file=sys.stderr)
        sys.exit(1)
    return result


def cmf_url(env: dict[str, str]) -> str:
    explicit = env.get("CMF_URL", "").strip()
    if explicit:
        return explicit.rstrip("/")
    ip = run(["minikube", "ip"], check=False).stdout.strip() or "192.168.49.2"
    return f"http://{ip}:30022"


def statement_name(prefix: str, workshop_id: str) -> str:
    safe = workshop_id.replace("_", "-").replace(".", "-").lower()
    return f"{prefix}-{safe}"[:64]


def delete_statement(cmf: str, environment: str, name: str) -> None:
    subprocess.run(
        ["curl", "-s", "-X", "DELETE", f"{cmf}/cmf/api/v1/environments/{environment}/statements/{name}"],
        capture_output=True,
        check=False,
    )


def get_statement(cmf: str, environment: str, name: str) -> dict:
    req = urllib.request.Request(f"{cmf}/cmf/api/v1/environments/{environment}/statements/{name}")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def describe_broker_timeout(pod: str, broker_id: str) -> str:
    result = subprocess.run(
        [
            "kubectl",
            "exec",
            "-n",
            "confluent",
            pod,
            "-c",
            "kafka",
            "--",
            "kafka-configs",
            "--bootstrap-server",
            f"{pod}.kafka.confluent.svc.cluster.local:9071",
            "--entity-type",
            "brokers",
            "--entity-name",
            broker_id,
            "--all",
            "--describe",
        ],
        capture_output=True,
        text=True,
    )
    return result.stdout or ""


def bump_transaction_timeout(env: dict[str, str]) -> None:
    """Static broker config: CFK configOverrides.server + wait for rolling restart.

    transaction.max.timeout.ms is NOT dynamically alterable on this cluster.
    """
    wanted = "transaction.max.timeout.ms=3600000"
    cr = run(["kubectl", "-n", "confluent", "get", "kafka", "kafka", "-o", "json"], check=False)
    if cr.returncode != 0 or not cr.stdout:
        print("WARN: could not read Kafka CR kafka/confluent", file=sys.stderr)
        return
    try:
        doc = json.loads(cr.stdout)
    except json.JSONDecodeError:
        print("WARN: Kafka CR JSON parse failed", file=sys.stderr)
        return
    overrides = doc.get("spec", {}).get("configOverrides") or {}
    if not isinstance(overrides, dict):
        overrides = {}
    server = list(overrides.get("server") or [])
    if not any("transaction.max.timeout.ms" in str(item) for item in server):
        server.append(wanted)
        patch = json.dumps({"spec": {"configOverrides": {"server": server}}})
        patched = subprocess.run(
            ["kubectl", "-n", "confluent", "patch", "kafka", "kafka", "--type", "merge", "-p", patch],
            capture_output=True,
            text=True,
        )
        if patched.returncode != 0:
            print("WARN: Kafka CR patch failed", file=sys.stderr)
            print((patched.stderr or "")[:300], file=sys.stderr)
        else:
            print("Kafka CR configOverrides.server += transaction.max.timeout.ms=3600000 (rolling restart)")
    else:
        print("Kafka CR already has transaction.max.timeout.ms")

    print("Waiting for brokers to apply transaction.max.timeout.ms=3600000 ...")
    ready = {"0": False, "1": False, "2": False}
    for elapsed in range(0, 601, 10):
        for bid in list(ready):
            if ready[bid]:
                continue
            for pod in ("kafka-0", "kafka-1", "kafka-2"):
                text = describe_broker_timeout(pod, bid)
                if "transaction.max.timeout.ms=3600000" in text:
                    ready[bid] = True
                    print(f"Broker {bid} transaction.max.timeout.ms=3600000")
                    break
        if all(ready.values()):
            print("All brokers ready for Flink upsert sink")
            return
        if elapsed and elapsed % 30 == 0:
            print(f"... still waiting ({elapsed}s) ready={ready}")
        time.sleep(10)
    print("WARN: brokers did not all show 3600000; INSERT may crash-loop", file=sys.stderr)


def update_catalog(cmf: str, sr_password: str) -> None:
    yaml_text = (
        "apiVersion: cmf.confluent.io/v1\n"
        "kind: KafkaCatalog\n"
        "metadata:\n"
        "  name: flink-catalog\n"
        "spec:\n"
        "  srInstance:\n"
        "    connectionConfig:\n"
        '      schema.registry.url: "http://schemaregistry.confluent.svc.cluster.local:8081"\n'
        '      basic.auth.credentials.source: "USER_INFO"\n'
        f'      basic.auth.user.info: "admin:{sr_password}"\n'
        "  kafkaClusters: []\n"
    )
    Path("/tmp/flink_catalog.yaml").write_text(yaml_text)
    result = run(["confluent", "flink", "catalog", "update", "/tmp/flink_catalog.yaml", "--url", cmf], check=False)
    if result.returncode != 0:
        print("WARN: catalog update rc=", result.returncode, file=sys.stderr)
        print((result.stderr or "")[:300], file=sys.stderr)
    else:
        print("Catalog flink-catalog: Schema Registry auth updated")


def create_statement(
    cmf: str,
    environment: str,
    pool: str,
    catalog: str,
    database: str,
    name: str,
    sql: str,
    wait: bool,
    flink_cfg: str | None = None,
) -> dict | None:
    cmd = [
        "confluent",
        "flink",
        "statement",
        "create",
        name,
        "--sql",
        sql,
        "--environment",
        environment,
        "--compute-pool",
        pool,
        "--catalog",
        catalog,
        "--database",
        database,
        "--url",
        cmf,
        "--output",
        "json",
    ]
    if wait:
        cmd.append("--wait")
    if flink_cfg:
        cmd.extend(["--flink-configuration", flink_cfg])
    result = run(cmd, check=False)
    out = (result.stdout or "").strip()
    try:
        payload = json.loads(out)
    except json.JSONDecodeError:
        print(f"[{name}] parse error rc={result.returncode}")
        print((result.stdout or "")[:400])
        print((result.stderr or "")[:400], file=sys.stderr)
        return None
    phase = payload.get("status", {}).get("phase", "")
    detail = (payload.get("status", {}).get("detail") or "")[:240]
    print(f"[{name}] phase={phase} detail={detail}")
    return payload


def flink_jm_pod() -> str | None:
    result = subprocess.run(
        ["kubectl", "-n", "confluent", "get", "pods", "-o", "jsonpath={.items[*].metadata.name}"],
        capture_output=True,
        text=True,
    )
    for name in (result.stdout or "").split():
        if name.startswith("flink-compute-pool-") and "taskmanager" not in name:
            return name
    return None


def jm_recent_logs(tail: int = 250) -> str:
    pod = flink_jm_pod()
    if not pod:
        return ""
    result = subprocess.run(
        ["kubectl", "-n", "confluent", "logs", pod, f"--tail={tail}"],
        capture_output=True,
        text=True,
    )
    return result.stdout or ""


def job_last_state(job: str, logs: str) -> str:
    marker = f"Job {job} "
    states = []
    for line in logs.splitlines():
        if marker in line and "switched from state" in line:
            states.append(line)
    if not states:
        return ""
    last = states[-1]
    if "to FAILED" in last or "to FAILING" in last:
        return "FAILED"
    if "to CANCELED" in last or "to CANCELLING" in last:
        return "CANCELED"
    if "to RESTARTING" in last:
        return "RESTARTING"
    if "to RUNNING" in last:
        return "RUNNING"
    return ""


def wait_running(cmf: str, environment: str, name: str, timeout: int = 180) -> str:
    last = ""
    stable = 0
    for elapsed in range(timeout):
        try:
            payload = get_statement(cmf, environment, name)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            time.sleep(1)
            continue
        phase = payload.get("status", {}).get("phase", "")
        detail = (payload.get("status", {}).get("detail") or "")[:240]
        jm_state = job_last_state(name, jm_recent_logs())
        if phase != last:
            print(f"[{name}] t={elapsed}s phase={phase} jm={jm_state or '-'} detail={detail}")
            last = phase
        if phase in ("COMPLETED", "FAILED"):
            return phase
        if phase == "RUNNING" or jm_state == "RUNNING":
            stable += 1
        else:
            stable = 0
        if stable >= 12:
            return "RUNNING"
        time.sleep(1)
    return last or "TIMEOUT"


def main() -> None:
    env_path = os.environ.get("ENV_FILE", str(Path(__file__).resolve().parent / ".env"))
    env = load_env(env_path)
    workshop_id = env["WORKSHOP_ID"]
    source_topic = env["TOPIC_NAME"]
    sink_topic = env.get("FLINK_TOPIC_NAME") or f"inventory.availability.flink.{workshop_id}"
    sr_password = env.get("SCHEMA_REGISTRY_PASSWORD", "")
    environment = env.get("FLINK_ENV") or "flink-env"
    pool = env.get("FLINK_COMPUTE_POOL") or "flink-compute-pool"
    catalog = env.get("FLINK_CATALOG") or "flink-catalog"
    database = env.get("FLINK_DATABASE") or "flink-database"
    cmf = cmf_url(env)

    source_table = f"`{catalog}`.`{database}`.`{source_topic}`"
    sink_table = f"`{catalog}`.`{database}`.`{sink_topic}`"

    sink_sql = (
        f"CREATE TABLE IF NOT EXISTS {sink_table} ("
        " SKU STRING, BRANCH STRING, AVAILABLE_QUANTITY BIGINT,"
        " PRIMARY KEY (SKU, BRANCH) NOT ENFORCED"
        ") WITH ("
        " 'connector' = 'confluent',"
        " 'kafka.retention.time' = '0',"
        " 'key.format' = 'json-registry',"
        " 'value.format' = 'json-registry',"
        " 'changelog.mode' = 'upsert',"
        " 'scan.startup.mode' = 'earliest-offset'"
        ")"
    )
    job_sql = (
        f"INSERT INTO {sink_table} "
        "SELECT SKU, BRANCH, SUM(CAST(QUANTITY AS BIGINT)) AS AVAILABLE_QUANTITY "
        f"FROM {source_table} "
        "WHERE SKU IS NOT NULL AND BRANCH IS NOT NULL "
        "GROUP BY SKU, BRANCH"
    )

    print("=== Flink SQL (CMF catalog, connector=confluent) ===")
    print(sink_sql)
    print(job_sql)
    print(f"CMF={cmf} env={environment} pool={pool} catalog={catalog}.{database}")

    bump_transaction_timeout(env)
    if sr_password:
        update_catalog(cmf, sr_password)
    else:
        print("WARN: SCHEMA_REGISTRY_PASSWORD empty; DESCRIBE/schema may fail", file=sys.stderr)

    sink_name = statement_name("flink-sink", workshop_id)
    job_name = statement_name("flink-agg", workshop_id)
    drop_name = statement_name("flink-drop", workshop_id)
    for name in (job_name, sink_name, drop_name):
        delete_statement(cmf, environment, name)
        time.sleep(1)

    create_statement(
        cmf, environment, pool, catalog, database, drop_name,
        f"DROP TABLE IF EXISTS {sink_table}", wait=True,
    )
    created = create_statement(
        cmf, environment, pool, catalog, database, sink_name, sink_sql, wait=True,
    )
    if created and created.get("status", {}).get("phase") == "FAILED":
        print("Sink DDL failed; retrying without scan.startup.mode", file=sys.stderr)
        delete_statement(cmf, environment, sink_name)
        sink_sql_min = sink_sql.replace(", 'scan.startup.mode' = 'earliest-offset'", "")
        created = create_statement(
            cmf, environment, pool, catalog, database, sink_name, sink_sql_min, wait=True,
        )
        if created and created.get("status", {}).get("phase") == "FAILED":
            sys.exit(1)

    cfg_path = "/tmp/flink-cfg-p.json"
    Path(cfg_path).write_text(
        json.dumps(
            {
                "execution.checkpointing.interval": "10s",
                "execution.checkpointing.timeout": "60s",
                "table.exec.sink.not-null-enforcer": "DROP",
            }
        )
    )
    create_statement(
        cmf, environment, pool, catalog, database, job_name, job_sql,
        wait=False, flink_cfg=cfg_path,
    )
    phase = wait_running(cmf, environment, job_name, timeout=240)
    print(f"OK: submit_flink ({workshop_id}) phase={phase} sink={sink_topic}")
    if phase != "RUNNING":
        delete_statement(cmf, environment, job_name)
        print(
            "Flink statement did not stay RUNNING; deleted INSERT to free the shared pool. "
            "Check TaskManager logs for transaction.max.timeout.ms.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"Flink aggregation job RUNNING on {sink_topic}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise
