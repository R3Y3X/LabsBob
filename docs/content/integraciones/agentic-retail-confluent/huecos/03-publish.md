# Lab 3 — Publicar eventos (`publish.html`) + cheatsheet

## Qué pide el lab

Prompt Step 3: `cd trackD/inventory-pipeline && ./setup.sh -s 3`.

Éxito declarado:

```
Delivered: 20/20 (failed: 0)
OK: produce_messages
```

Step 4a: Bob publica **5** eventos extra (ADDITION / SALE / ADJUSTMENT, 2 SKUs, 2 sucursales) **sin** script dedicado.

Opcional: `curl` a ksqlDB externo con `admin:<KSQLDB_PASSWORD>`.

## Qué falta o está mal

### `-s 3` falla con el ZIP / overlay actuales

`run_in_cluster_remote.sh` hace:

```bash
pip install --quiet --no-input confluent-kafka python-dotenv requests
```

El `confluent-kafka` **sin pin** (2026) tira de Schema Registry async y exige `httpx`, `authlib`, `jsonschema`. Error 1:

```
ModuleNotFoundError: No module named 'httpx'
```

Con extras `[schemaregistry,json]` el código choca con la API nueva. Error 2:

```
ValueError: to_dict must be callable with the signature to_dict(object, SerializationContext)->dict
```

Causa: `produce_messages.py` pasa el `conf` como **tercer** argumento posicional. En esta API el tercero es `to_dict`, no `conf`.

Error 3 (schema del productor):

```
ValueError: Missing required JSON schema annotation title
```

`register_schema.py` **sí** tiene `"title": "InventoryTransaction"`. El `SCHEMA` embebido en `produce_messages.py` **no**.

Error 4 (flujo del lab 1): produce usa `use.latest.version: True` y `auto.register.schemas: False`, pero `-s 1` **no** llama a `register_schema.py`.

Error 5 (URL): el script lee `SCHEMA_REGISTRY_URL` (`https://IP/sr`, nginx). El Job corre **dentro** del cluster; hay que usar `SCHEMA_REGISTRY_URL_INTERNAL` (`http://schemaregistry.confluent.svc.cluster.local:8081`).

### Qué sí funcionó en el dry-run (solo en `scratch/`, no en el overlay del repo)

1. `pip install 'confluent-kafka==2.6.1' jsonschema python-dotenv requests`
2. `JSONSerializer(SCHEMA, client, lambda obj, ctx: obj, conf)`
3. Añadir `"title": "InventoryTransaction"` al schema del productor
4. `SCHEMA_REGISTRY_URL_INTERNAL` en el cliente SR
5. `./run_in_cluster.sh register_schema` **antes** de `-s 3`

Output real (no coincide con el prompt):

```
Published 20 JSON_SR transactions to inventory.transactions.tz1_p099
OK: produce_messages (tz1_p099)
```

No existe la línea `Delivered: 20/20 (failed: 0)`. Bob / el alumno pueden creer que falló.

### Step 4a no tiene script

No hay `setup.sh -s 4` de productor ni `produce_test_events.py`. Bob tiene que clonar `produce_messages.py` o producir a mano. En una VM compartida eso suele terminar en JSON plano (sin schema) o en otro tópico.

El checkpoint pide offsets. El productor actual no imprime offsets, solo el recuento.

### Cheatsheet contradice el Paso 0

[`cheatsheet.html`](../cheatsheet.html):

- `ADMIN_PW` / `KAFKA_PW` desde `/var/lib/confluent-access/credentials.json`
- `ssh … 'sudo jq … credentials.json'`
- cliente externo con `ssl.endpoint.identification.algorithm=https` y CA en disco

Track D real: Jobs internos SASL_SSL + `enable.ssl.certificate.verification=false`; passwords desde Secrets. El cheatsheet empuja a Bob a pedir `ADMIN_PW` otra vez.

CMF en el cheatsheet: `curl -sk -u admin:$ADMIN_PW https://$HOST/cmf/api/v1/…`. Útil para un humano en el browser; el agente en la VM usó el NodePort **sin** Basic Auth. No está documentado.

## Cómo se llega a 20 mensajes el día del evento (mientras no se parchee el overlay)

Orden:

1. Paso 0 completo (tres `.env`).
2. `-s 1` (tópico) **y** `./run_in_cluster.sh register_schema` (subject `inventory.transactions.tz1_p099-value`).
3. `-s 2` (tabla ksql; puede ir antes o después del schema, pero el productor no).
4. Parche mínimo de producto (recomendado en segunda pasada, no aplicado al overlay en este dry-run):
   - pin + extras en `run_in_cluster_remote.sh`
   - `to_dict` + `title` + URL interna en `produce_messages.py`
   - `-s 1` debe incluir `register_schema`
5. `-s 3` → esperar `Published 20 JSON_SR…` / actualizar el prompt a esa cadena.

Cómo ver que ksqlDB agregó (sin pegar el password en el chat; Bob ya lo tiene en `.env`):

```bash
# desde la VM, endpoint interno
curl -s -u "admin:${KSQLDB_PASSWORD}" \
  http://ksqldb.confluent.svc.cluster.local:8088/query \
  -H "Content-Type: application/vnd.ksql.v1+json" \
  -d '{"ksql":"SELECT * FROM INVENTORY_AVAILABILITY_TZ1_P099 LIMIT 5;","streamsProperties":{}}'
```

Nombre de tabla = `KSQL_TABLE_NAME` del `.env`, no `INVENTORY_AVAILABILITY` genérico (el hub sí personaliza el HTML).

## Impacto el día del evento

- Con el ZIP actual, **ningún** alumno completa el checkpoint `20/20` si Bob no parchea pip + serializer + schema + URL. Eso es peor que Flink: es el pipeline principal.
- El prompt de éxito no coincide con stdout → falsos negativos.
- Step 4a es ruido el día del evento (5 eventos extra sin herramienta).
- Arreglo de overlay (segunda pasada): `pip install 'confluent-kafka==2.6.1' jsonschema python-dotenv requests`; `to_dict`; `title`; SR interno; `-s 1` corre `register_schema`; alinear el texto `Published 20…`.
