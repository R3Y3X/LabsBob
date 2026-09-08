# Lab 2 — ksqlDB visual + Flink con Bob (`ksqldb.html`)

Prioridad del dry-run. ksqlDB en Control Center está bien encaminado (Flow + Persistent queries). **Flink no se puede completar con el prompt actual.**

## Qué pide el lab

1. Ver en Control Center el stream/tabla **del asiento** (Flow y Persistent queries). El SQL de la página es “mensaje esperado”, no para pegar en Bob.
2. Prompt Flink (~15 líneas): misma agregación sobre el tópico de transacciones; escribir en `inventory.availability.flink`; “Usa el Flink Compute Pool del CMF”; mostrar SQL; confirmar job **RUNNING**.
3. Checkpoints: SQL visible, job RUNNING en CMF, tópico Flink con mensajes.
4. Imágenes: `flinkJobRunning.png` y `flinkSqlEditor.png`.

## Qué falta o está mal

### Capturas rotas y UI incompleta

Esos dos PNG **no existen** en `docs/assets/images/labs/agentic-retail-confluent/` (404 en el hub). ksqlDB sí tiene Flow y Persistent queries. CMF en esta VM tiene más superficies que el lab no enseña:

| Superficie CMF | Para qué sirve en este workshop |
|---|---|
| Environment `flink-env` | único environment |
| Compute pool `flink-compute-pool` (SHARED, RUNNING) | dónde corre el statement |
| Catalog `flink-catalog` / database `flink-database` | los tópicos Kafka **ya son tablas** |
| Tables | `inventory.transactions.tz1_pNNN`, `inventory.availability.tz1_pNNN` (auto); el sink Flink hay que **crearlo** |
| SQL workspace | `CREATE TABLE` / `INSERT INTO` |
| Statements | estado COMPLETED / PENDING / FAILED / RUNNING |

Sin guía de catálogo, Bob trata CMF como Flink OSS (`connector=kafka`, `properties.bootstrap.servers`, JAAS). Eso es exactamente lo que hizo la sesión p100 (~2000 líneas) y se volvió a demostrar en p099.

### El `.env` no tiene CMF

`FLINK_TOPIC_NAME` existe. No hay `FLINK_ENV`, `FLINK_COMPUTE_POOL`, `FLINK_CATALOG`, `FLINK_DATABASE`, `CMF_URL`. El prompt dice “reutiliza el .env del Paso 0”: no alcanza.

Valores fijos de la VM (no son secretos):

| Concepto | Valor | Cómo se saca |
|---|---|---|
| CMF desde **dentro** de la VM | `http://$(minikube ip):30022` → `http://192.168.49.2:30022` | `kubectl get svc -n confluent cmf-nodeport` (NodePort 30022) |
| CMF desde el **navegador** | `https://[IP]/cmf` | nginx + Basic Auth (`htpasswd-cmf`). El CLI `confluent flink --url https://IP/cmf` **no** es lo que funcionó |
| Environment | `flink-env` | `confluent flink environment list --url $CMF` |
| Compute pool | `flink-compute-pool` | `confluent flink compute-pool list --environment flink-env --url $CMF` |
| Catalog / database | `flink-catalog` / `flink-database` | `SHOW CATALOGS` / `SHOW DATABASES IN \`flink-catalog\`` |
| Source table | `` `flink-catalog`.`flink-database`.`inventory.transactions.tz1_p099` `` | `SHOW TABLES IN \`flink-catalog\`.\`flink-database\`` **después** de `-s 1` |
| Sink table | `` …`inventory.availability.flink.tz1_p099` `` | no existe hasta el `CREATE TABLE` |
| Columnas del source | `SKU`, `BRANCH`, `QUANTITY` (mayúsculas, JSON Schema) | `DESCRIBE` de la tabla de catálogo |
| Auth SR del catálogo | `admin` + `SCHEMA_REGISTRY_PASSWORD` | el mismo secret del Paso 0; hay que **actualizar el catálogo** o DESCRIBE no lee el schema |
| Connector permitido | solo `'connector' = 'confluent'` | error si usas `kafka` |

### El prompt induce el conector equivocado

El prompt pide “Job Flink SQL que lea sku STRING…” (minúsculas, tipos OSS) y no menciona:

- `confluent flink statement create` en la VM
- `--url` al NodePort, no a `/cmf`
- un statement por sentencia (no un script de tres DDL)
- no usar `$ENV` (choca con bash)
- no `kafka` / `upsert-kafka` / `'kafka.topic'`
- columnas en mayúsculas
- `changelog.mode = upsert` + `PRIMARY KEY … NOT ENFORCED` en el sink
- `--catalog flink-catalog --database flink-database`

Error real al seguir el modelo mental OSS (p099):

```
Invalid value for option 'connector'. Supported values are: [confluent].
```

Error si pasas `'kafka.topic'` con `confluent`:

```
Unsupported options: kafka.topic
Supported options: changelog.mode connector … kafka.retention.time key.format value.format scan.startup.mode …
```

El bootstrap Kafka/SASL/SR **no** va en el `WITH`: vive en el catálogo.

### SQL que sí compila en esta plataforma

Mostrado antes de ejecutarlo (como pide el lab). Nombres p099; sustituir el sufijo por `$WORKSHOP_ID`.

```sql
CREATE TABLE `flink-catalog`.`flink-database`.`inventory.availability.flink.tz1_p099` (
  SKU STRING,
  BRANCH STRING,
  AVAILABLE_QUANTITY BIGINT,
  PRIMARY KEY (SKU, BRANCH) NOT ENFORCED
) WITH (
  'connector' = 'confluent',
  'kafka.retention.time' = '0',
  'key.format' = 'json-registry',
  'value.format' = 'json-registry',
  'changelog.mode' = 'upsert'
);

INSERT INTO `flink-catalog`.`flink-database`.`inventory.availability.flink.tz1_p099`
SELECT SKU, BRANCH, SUM(CAST(QUANTITY AS BIGINT)) AS AVAILABLE_QUANTITY
FROM `flink-catalog`.`flink-database`.`inventory.transactions.tz1_p099`
GROUP BY SKU, BRANCH;
```

Cómo enviarlo (desde la VM, **un** statement a la vez):

```bash
CMF=http://192.168.49.2:30022
confluent flink statement create p099-sink-ddl \
  --sql "$CREATE_SQL" \
  --environment flink-env --compute-pool flink-compute-pool \
  --catalog flink-catalog --database flink-database \
  --url "$CMF" --wait

confluent flink statement create p099-agg \
  --sql "$INSERT_SQL" \
  --environment flink-env --compute-pool flink-compute-pool \
  --catalog flink-catalog --database flink-database \
  --url "$CMF"
```

DDL sink: `COMPLETED`. INSERT: CMF deja `phase=PENDING` con schema correcto (`SKU`, `BRANCH`, `AVAILABLE_QUANTITY`, `sqlKind=INSERT_INTO`). En el JobManager el job **sí arranca** y luego entra en crash-loop.

### Bloqueo: `transaction.max.timeout.ms`

Log del TaskManager / JobManager (p099, igual que p100):

```
KafkaException: Unexpected error in InitProducerIdResponse;
The transaction timeout is larger than the maximum value allowed by the broker
(as configured by transaction.max.timeout.ms).
```

El sink `confluent` + `changelog.mode=upsert` abre productor transaccional. Flink pide un `transaction.timeout.ms` mayor que el máximo del broker (default típico 900000 ms; Flink exactly-once usa ~1 h).

Probado y **no** basta:

- `'sink.delivery-guarantee' = 'at-least-once'` → opción no soportada por el conector `confluent`
- `--flink-configuration` con `execution.checkpointing.mode=AT_LEAST_ONCE` + interval 10s + timeout 30s → el Writer sigue haciendo `InitProducerId` y vuelve a fallar

El plan de dry-run pedía no parchear el broker a ciegas. Conclusión: **Bob no puede cerrar RUNNING solo con SQL/prompt**. Hace falta un cambio de plataforma **o** un script de overlay que deje la config correcta.

Cómo comprobar el valor del broker (facilitador, no alumno):

```bash
kubectl exec kafka-0 -n confluent -c kafka -- \
  kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type brokers --entity-name 0 --all --describe 2>/dev/null \
  | grep transaction.max.timeout
```

Arreglo de plataforma (recomendado para el evento): `transaction.max.timeout.ms` ≥ `3600000` en los 3 brokers, **o** inyectar en el statement un `flinkConfiguration` que baje el timeout del productor **si** CMF lo expone (hoy no lo vimos en las opciones del conector).

### Contraste ksqlDB vs Flink en el lab

ksqlDB: Bob ejecuta `setup.sh -s 2` (script cerrado) y el alumno **mira** Flow / Persistent queries.

Flink: no hay `setup.sh -s 4`; el alumno no mira catálogo/tablas; Bob improvisa contra un dialecto distinto.

Por eso “vale la pena ajustar Flink en Platform”: misma pedagogía (ver objetos → contrastar SQL) + prompt tipo Paso 0.

## Cómo se obtiene cada pieza que el prompt no nombra

1. NodePort CMF: `kubectl get svc -n confluent cmf-nodeport` + `minikube ip`.
2. Environment / pool: `confluent flink environment list` / `compute-pool list`.
3. Tablas: `SHOW TABLES IN \`flink-catalog\`.\`flink-database\`` (después de crear el tópico Kafka).
4. Columnas: `DESCRIBE \`flink-catalog\`.\`flink-database\`.\`inventory.transactions.tz1_p099\`` — si falla el schema, actualizar el catálogo con `confluent flink catalog update` y `basic.auth.user.info=admin:<SCHEMA_REGISTRY_PASSWORD>` (mismo password del Paso 0; no imprimir).
5. Password Kafka: **no** hace falta en el SQL si el catálogo ya tiene el cluster Kafka. No poner JAAS en el chat.

## Impacto el día del evento

- Un alumno que pegue el prompt actual **no** termina el checkpoint RUNNING.
- Varios Bobs explorando CMF a la vez saturan el compute pool SHARED (un TM) y dejan statements `PENDING` ajenos.
- Las imágenes 404 rompen la guía visual.
- Recomendación de producto (segunda pasada, no hecha aquí):
  1. Reescribir el prompt Flink con el contrato de esta página (estilo Paso 0).
  2. Guía visual CMF: Catalogs → Tables → SQL → Statements; capturar PNG reales.
  3. Añadir al `.env` del hub: `FLINK_ENV`, `FLINK_COMPUTE_POOL`, `FLINK_CATALOG`, `FLINK_DATABASE`.
  4. Sección Flink en `BRIEFING_AGENTE_TRACK_D_F.md` (hoy no existe).
  5. Plan B si el broker no se toca: `setup.sh -s 4` + overlay Python, y el prompt solo ejecuta el script.
  6. Plan A de plataforma: subir `transaction.max.timeout.ms` **antes** del evento.

Dry-run p099: sink DDL `COMPLETED`; INSERT compilado; CMF `PENDING`; JobManager `RUNNING → RESTARTING` por transaction timeout. Jobs INSERT borrados al terminar para no dejar el pool en crash-loop.
