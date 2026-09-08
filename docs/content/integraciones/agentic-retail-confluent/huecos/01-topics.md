# Lab 1 — Tópico Kafka (`topics.html`)

## Qué pide el lab

Tras el Paso 0, dos prompts:

1. `cd trackD/inventory-pipeline && ./setup.sh -s 1` — crear `TOPIC_NAME`.
2. `./setup.sh -s 2` — stream + tabla ksqlDB (`create_derived_topic.py`).

Éxito declarado:

- Step 1: `Created topic: inventory.transactions` y `OK: create_topic`
- Step 1b (prosa): el Step 1 también registra `inventory.transactions-value` vía `register_schema.py`
- Step 2: `SUCCESS` / `Derived table ready` / `OK: create_derived_topic`

El hub personaliza en pantalla los nombres genéricos a `…tz1_p099`.

## Qué falta o está mal

### Variables que **deben** estar llenas antes de `-s 1`

Si falta cualquiera, el Job de Kubernetes falla de forma opaca:

| Variable | Dónde se usa | Si está vacía |
|---|---|---|
| `SSH_HOST` / `SSH_KEY` | `run_in_cluster.sh` en el laptop | no hay scp/ssh |
| `WORKSHOP_ID` | nombre del Job y directorio remoto `/root/inventory-pipeline-$WORKSHOP_ID` | aborta |
| `TOPIC_NAME` | `create_topic.py` | KeyError |
| `KAFKA_SASL_USERNAME` / `KAFKA_SASL_PASSWORD` | cliente Kafka SASL_SSL | `plaintext connection?` o `_TRANSPORT` |
| `BOOTSTRAP_SERVERS` | broker interno `:9092` | no conecta |
| `TOPIC_PARTITIONS` / `TOPIC_REPLICATION_FACTOR` / `TOPIC_RETENTION_MS` | create topic | defaults peligrosos (RF=1) |

Antes de `-s 2` además:

| Variable | Dónde se usa |
|---|---|
| `KSQLDB_ENDPOINT` | POST interno `:8088` |
| `KSQLDB_USERNAME` / `KSQLDB_PASSWORD` | Basic Auth ksqlDB |
| `KSQL_STREAM_NAME` / `KSQL_TABLE_NAME` / `DERIVED_TOPIC_NAME` | DDL |
| `SCHEMA_REGISTRY_URL_INTERNAL` | ksqlDB servidor (no va en `streamsProperties`) |

Cómo se obtienen las vacías: ver [00-overview-paso0.md](00-overview-paso0.md).

### `-s 1` no registra el schema

`setup.sh -s 1` solo corre `create_topic`. `register_schema.py` está en el case `all`, no en `-s 1`.

El texto del lab dice lo contrario: “El Step 1 crea el tópico y `register_schema.py` registra el subject”.

En el dry-run: `Created topic: inventory.transactions.tz1_p099` **sin** `JSON schema ready`. ksqlDB `-s 2` igual creó el stream `JSON_SR` (el servidor ksql habla con SR). El productor del lab 3 **sí** exige el subject (`use.latest.version: True`).

Cómo registrarlo hoy (no está en el prompt):

```bash
cd trackD/inventory-pipeline && ./run_in_cluster.sh register_schema
```

`register_schema.py` usa `SCHEMA_REGISTRY_URL` (HTTPS público). Desde el pod eso es hairpin. Debe usar `SCHEMA_REGISTRY_URL_INTERNAL`. En el dry-run, con interna: `JSON schema ready: inventory.transactions.tz1_p099-value`.

### Checkpoint vs output real

El prompt pide `Created topic: inventory.transactions` (sin sufijo). El script imprime `Created topic: inventory.transactions.tz1_p099`. Con personalización del hub el alumno ve el nombre namespaced; Bob que lea el ZIP crudo no.

Step 2 imprime JSON truncado de ksqlDB + `Derived table ready` + `OK: create_derived_topic (tz1_p099)`. Coincide en espíritu; el `commandId` se corta en el log.

### SQL del lab vs Control Center

El HTML de referencia usa `KEY_FORMAT='KAFKA'` en el stream. Flow/Persistent queries muestran `KEY_FORMAT='JSON'` en la tabla (correcto: `create_derived_topic.py` pone JSON en la tabla y KAFKA en el stream). No es un fallo de ejecución; sí confunde si alguien pega el SQL “esperado” otra vez.

## Impacto el día del evento

- `-s 1` y `-s 2` **funcionan** si el Paso 0 sincronizó los tres `.env` (probado p099).
- El schema del tópico fuente **no** queda registrado con el prompt de Step 1. El lab 3 revienta después.
- Bob no tiene instrucción de correr `register_schema`. El briefing de ksqlDB dice “no pases SR en streamsProperties” (correcto) pero no dice “corre register_schema antes de producir”.
