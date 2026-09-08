# Lab 0 — Introducción / Paso 0 (SSH + `.env`)

## Qué pide el lab

El prompt de [`overview.html`](../overview.html) pide a Bob:

1. Workspace = raíz `RoadShowBobStreamingIntegration` (no solo `inventory-pipeline`).
2. Reparar `trackD/inventory-pipeline/cflt-vsi-key.pem` (`repair_cflt_pem.sh` / `.ps1`).
3. SSH `root@[IP_PUBLICA_VM]` con `IdentitiesOnly=yes`.
4. Extraer tres passwords con `kubectl -n confluent get secret` y escribirlas en **los tres** `.env`.
5. Sustituir `<IP_PUBLICA_VM_TZ*>` en `SSH_HOST` y URLs. No tocar `WORKSHOP_ID` ni `TOPIC_NAME`.
6. `ORCHESTRATE_URL=""`. Confirmar con `listo`.

El humano entrega **solo** IP + PEM en disco. No passwords.

## Qué falta o está mal

### Bundle base vs bundle del diálogo

`docs/downloads/agentic-retail-workshop.zip` **no** trae `participant-config.env`, `participant-bootstrap.sh` ni `participant-info.json`. Eso lo inyecta el navegador al elegir TechZone+número. Si alguien descomprime solo el ZIP, no hay `.env` namespaced y `bash participant-bootstrap.sh check` no existe.

### Tabla de variables del `.env` generado por el hub

Fuente: `docs/js/participant.js` → `configText()`. Valores de ejemplo para TZ1-P099.

| Variable | Viene en el bundle | Cómo se obtiene | Notas |
|---|---|---|---|
| `WORKSHOP_TABLE` | sí (`1`) | Diálogo TechZone | No cambiar |
| `PARTICIPANT_NUMBER` | sí (`99`) | Diálogo 1–100 | No cambiar |
| `WORKSHOP_ID` | sí (`tz1_p099`) | `tz{1-3}_pNNN` | MCP Track F usa esto, no `m01_…` |
| `TOPIC_NAME` | sí | `inventory.transactions.{WORKSHOP_ID}` | No inventar `inventory.transactions` sin sufijo |
| `TOPIC_PARTITIONS` | sí (`1`) | fijo | |
| `TOPIC_REPLICATION_FACTOR` | sí (`3`) | fijo (3 brokers) | |
| `TOPIC_RETENTION_MS` | sí (`-1`) | fijo | |
| `DERIVED_TOPIC_NAME` | sí | `inventory.availability.{WORKSHOP_ID}` | ksqlDB sink |
| `FLINK_TOPIC_NAME` | sí | `inventory.availability.flink.{WORKSHOP_ID}` | sink Flink; **no hay más vars CMF** |
| `KSQL_STREAM_NAME` | sí | `INVENTORY_TRANSACTIONS_TZ1_P099` | |
| `KSQL_TABLE_NAME` | sí | `INVENTORY_AVAILABILITY_TZ1_P099` | |
| `SSH_HOST` | placeholder `root@<IP_PUBLICA_VM_TZ1>` | IP pública TechZone, **4 octetos** | Truncar `163.66.83.16` en vez de `.162` = timeout. No es VPN. |
| `SSH_KEY` | sí, ruta desde la **raíz** | `trackD/inventory-pipeline/cflt-vsi-key.pem` | El PEM lo crea el alumno; no va en el ZIP |
| `BOOTSTRAP_SERVERS` | sí | `kafka.confluent.svc.cluster.local:9092` | Interno, SASL_SSL |
| `BOOTSTRAP_SERVERS_EXTERNAL` | placeholder IP | `{IP}:9094,9095,9096` | No lo usan los Jobs |
| `KSQLDB_ENDPOINT` | sí | HTTP interno `:8088` | Lo usa `create_derived_topic.py` |
| `KSQLDB_ENDPOINT_EXTERNAL` | placeholder IP | `https://{IP}/ksqldb` | UI / curl desde el laptop |
| `KSQLDB_USERNAME` | sí (`admin`) | fijo | |
| `KSQLDB_PASSWORD` | **vacío** | secret `ksqldb-users` key `basic.txt` (`admin: PASSWORD,admin`) | Paso 0 |
| `KSQLDB_API_KEY` | vacío | no hace falta en Track D | |
| `KSQLDB_API_SECRET` | vacío | copiar el mismo valor que `KSQLDB_PASSWORD` si existe la clave | |
| `KAFKA_SASL_USERNAME` | sí (`kafka-admin`) | fijo | |
| `KAFKA_SASL_PASSWORD` | **vacío** | secret `kafka-external-plain-users` key `plain-users.json` campo `kafka-admin` | Paso 0 |
| `SCHEMA_REGISTRY_URL` | placeholder IP | `https://{IP}/sr` | **Externa**. Los pods deben usar la interna (lab 3) |
| `SCHEMA_REGISTRY_USERNAME` | sí (`admin`) | fijo | |
| `SCHEMA_REGISTRY_PASSWORD` | **vacío** | secret `schemaregistry-users` key `basic.txt` (mismo formato) | Paso 0 |
| `SCHEMA_REGISTRY_URL_INTERNAL` | sí | `http://schemaregistry.confluent.svc.cluster.local:8081` | HTTP, no HTTPS |
| `ORCHESTRATE_URL` | `""` | dejar vacío en Track D | Nunca `<URL_…>` (rompe `source` en bash) |
| `ORCHESTRATE_API_KEY` | vacío | Track F | |
| `RETAIL_MCP_URL` | placeholder IP | Track F | |
| `RETAIL_MCP_TOOLKIT_NAME` | sí | Track F | |
| `KNOWLEDGE_BASE_NAME` | sí | Track F | |
| `FLINK_ENV` / `FLINK_COMPUTE_POOL` / `FLINK_CATALOG` / `FLINK_DATABASE` / `CMF_URL` | **no existen** | fijos en la VM (ver lab 2) | El prompt Flink no puede “reutilizar el .env” para CMF |

### Tres archivos, uno que cuenta

`run_in_cluster.sh` lee `$(cd ../../ && pwd)/.env` = **raíz**. Si Bob solo llena `trackD/inventory-pipeline/.env`, el Job arranca con passwords vacías.

### Cheatsheet vs Paso 0

[`cheatsheet.html`](../cheatsheet.html) sigue pidiendo `ADMIN_PW` / `KAFKA_PW` desde `/var/lib/confluent-access/credentials.json`. El Paso 0 **prohíbe** pedir passwords al facilitador y autoriza `kubectl get secret`. Dos fuentes de verdad.

## Cómo extraer las tres passwords (sin imprimirlas)

Desde la raíz del bundle, sustituye `PEM` e `IP`:

```bash
PEM=trackD/inventory-pipeline/cflt-vsi-key.pem
SSH="ssh -i $PEM -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 root@IP"

# Kafka
$SSH 'kubectl -n confluent get secret kafka-external-plain-users \
  -o jsonpath="{.data.plain-users\.json}" | base64 -d \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[\"kafka-admin\"])"'

# ksqlDB
$SSH 'kubectl -n confluent get secret ksqldb-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"'

# Schema Registry (mismo parseo que ksqlDB)
$SSH 'kubectl -n confluent get secret schemaregistry-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"'
```

Escribir el valor en **los tres** archivos: raíz `.env`, `participant-config.env`, `trackD/inventory-pipeline/.env`.

## Impacto el día del evento

- Si el alumno abre solo `inventory-pipeline` en Bob, las rutas `SSH_KEY` y `../../.env` fallan.
- Si no repara el PEM (`invalid format`), nunca hay SSH.
- Si deja un solo `.env` actualizado, `-s 1` da `plaintext connection?` / 401.
- `participant-bootstrap.sh check` solo existe si descargó el ZIP **desde el diálogo** del hub.
- El Paso 0 está bien para Kafka/ksql/SR. **No prepara Flink.**

Dry-run p099: SSH `ok`, tres passwords no vacías (longitud 24), `ORCHESTRATE_URL=""`, `SCHEMA_REGISTRY_URL_INTERNAL` correcto.
