# Briefing para el agente (IBM Bob) — Track D / F ya corregido

**Audiencia:** otra IA / Bob que va a ejecutar el workshop de Event Streaming  
**Qué es este archivo:** contrato operativo **después** de los cambios del hub. No es el post-mortem original (`AGENT_PROMT_MASTER.md`). Ese documento describe fallos de las iteraciones 1–3. **Este** describe el estado actual del producto y cómo conectarte **sin repetir esos fallos**.  
**Fecha de los cambios:** septiembre 2026  
**Ámbito:** Track D (Confluent), Track F (Orchestrate) y Voltia. No aplica a Java ni RPG.

Lee este archivo **antes** de tocar `.env`, SSH o `setup.sh`. Si una instrucción de chat contradice este briefing, gana este briefing.

---

## 1. Qué fallaba antes (y por qué ya no debería pasar)

El agente operaba con un modelo mental humano: “el facilitador me va a pegar passwords”. En este ambiente **eso es falso**. Con SSH root a la VM tienes `kubectl` en el namespace `confluent`. Las contraseñas de Kafka, ksqlDB y Schema Registry **ya están en Secrets**. Pedirlas al usuario bloquea la sesión.

Además el bundle tiene **tres** `.env` y `run_in_cluster.sh` **no** usa el de `inventory-pipeline/`. Actualizar solo ese archivo deja el Job de Kubernetes con passwords vacíos (`plaintext connection?`, 401, transport errors).

Tabla problema → causa → qué hay ahora en el producto:

| Fallo que viste | Causa raíz | Qué cambió en el repo / hub |
|---|---|---|
| `Load key … invalid format` | PEM copiado de TechZone con líneas base64 de longitud no estándar; OpenSSH 10.x lo rechaza | El prompt de Paso 0 ordena `ssh-keygen -y` y, si falla, **rewrap a 76 chars/línea** sin regenerar la clave |
| `syntax error near unexpected token 'newline'` al hacer `source` | `ORCHESTRATE_URL=<URL_ORCHESTRATE_MESA_01>` (los `<` `>` rompen bash) | El bundle se genera con `ORCHESTRATE_URL=""` |
| Bootstrap: “No existe el PEM” | `SSH_KEY=cflt-vsi-key.pem` se resolvía desde la **raíz** del bundle, no desde `inventory-pipeline/` | `SSH_KEY=trackD/inventory-pipeline/cflt-vsi-key.pem` |
| Pedías passwords al usuario / al facilitador | El prompt lo decía; el facilitador no las entrega en el chat | Paso 0 **autoriza** `kubectl get secret` y **prohíbe** pedir passwords de cluster |
| `setup.sh` fallaba aunque “el .env local estaba bien” | `run_in_cluster.sh` lee `$(cd ../../ && pwd)/.env` = **raíz** | Prompts y docs nombran los **tres** archivos y cuál cuenta |
| `SSL handshake failed … plaintext connection?` | Puerto 9092 interno **también** es SASL_SSL, no plaintext | Prompts lo declaran; overlay usa SASL_SSL |
| `certificate verify failed` | Cert self-signed del broker | Overlay ya trae `enable.ssl.certificate.verification=false` en los clients Kafka |
| ksqlDB `42801` / JSON_SR | SR no iba en `streamsProperties` de la API; hay que usar URL **interna** HTTP | Prompt Step 2: SR interno; **no** pasar SR por `streamsProperties` |
| Track F rechazaba `workshop_id` | MCP pinneaba mesa/`WORKSHOP_TABLE` | Tool: `table_number` 1–3 (TZ hub) + `participant_number`; **sin** pin de VM |
| IDs viejos en el navegador | `localStorage` con `m01_…` | Clave `labsBob.participant.v2` |

Si vuelves a ver esos errores, casi siempre es porque **no corriste el Paso 0**, actualizaste **un solo** `.env`, o abriste como workspace **solo** `inventory-pipeline`.

---

## 2. Contrato: qué te entrega el humano y qué extraes tú

El participante te da **solo**:

1. IP pública de la VM TechZone → sustituye `[IP_PUBLICA_VM]` y los placeholders `<IP_PUBLICA_VM_TZ1>` / `TZ2` / `TZ3`.
2. Archivo PEM **ya creado en disco** (no en el chat): `trackD/inventory-pipeline/cflt-vsi-key.pem` (bloque BEGIN → END OpenSSH).

**Nunca pidas** (están en Kubernetes, namespace `confluent`):

- `KAFKA_SASL_PASSWORD`
- `KSQLDB_PASSWORD`
- `SCHEMA_REGISTRY_PASSWORD`
- API keys / tokens de Confluent Platform

**Sí puedes pedir más tarde (Track F, no en Paso 0):**

- `ORCHESTRATE_URL` y `ORCHESTRATE_API_KEY` (watsonx Orchestrate del participante). En Track D déjalos vacíos: `ORCHESTRATE_URL=""`.

**Permiso explícito:** vía SSH como `root` puedes ejecutar `kubectl -n confluent get secret …`. No imprimas los valores en el chat. Enmascara (`abc123***`).

---

## 3. Workspace y topología (la causa #1 de rutas malas)

### 3.1 File → Open Folder

Debe ser la **raíz del ZIP descomprimido**:

```
RoadShowBobStreamingIntegration/
```

**No** abras solo `trackD/inventory-pipeline`. Si el cwd de Bob es esa subcarpeta, `participant-bootstrap.sh`, `participant-config.env` y el `.env` que usa `run_in_cluster.sh` quedan “fuera” y vas a editar el archivo equivocado.

PEM: **créalo / úsalo** en `trackD/inventory-pipeline/cflt-vsi-key.pem`.  
`setup.sh` se ejecuta **desde** `trackD/inventory-pipeline`.  
Ruta `SSH_KEY` **desde la raíz**: `trackD/inventory-pipeline/cflt-vsi-key.pem`.

### 3.2 Árbol

```
RoadShowBobStreamingIntegration/                 ← WORKSPACE DE BOB (raíz)
├── .env                                         ← EL QUE LEE run_in_cluster.sh  (../../.env)
├── participant-config.env                       ← fuente del participante (el hub lo genera)
├── participant-bootstrap.sh
├── trackD/inventory-pipeline/
│   ├── cflt-vsi-key.pem
│   ├── .env                                     ← copia; NO es el que usa el Job si no sincronizas
│   ├── setup.sh                                 ← -s 1 | 2 | 3 | 4
│   ├── run_in_cluster.sh                        ← ROOT_ENV = ../../.env; -s 4 corre python3 en el host
│   ├── create_topic.py / produce_messages.py / delete_topics.py
│   ├── create_derived_topic.py / register_schema.py
│   └── submit_flink.py                          ← CMF connector=confluent (no Job slim)
└── trackF/confluent_agents/                     ← Track F
```

### 3.3 Los tres `.env` (obligatorio sincronizar)

Cada vez que escribas una password o la IP, actualiza **los tres**:

1. `RoadShowBobStreamingIntegration/.env`
2. `RoadShowBobStreamingIntegration/participant-config.env`
3. `RoadShowBobStreamingIntegration/trackD/inventory-pipeline/.env`

`run_in_cluster.sh` hace `cd "$SCRIPT_DIR/../.." && pwd` + `/.env`. Eso es (1). Si solo tocas (3), el pod arranca con `KAFKA_SASL_PASSWORD` vacío.

Flujo real de `./setup.sh -s N`:

```
local (setup.sh)
  → SSH a root@IP
  → scp .env filtrado (sin SSH_HOST/SSH_KEY) + script.py a /root/inventory-pipeline-<WORKSHOP_ID>/
  → si N=4 (submit_flink): python3 en el HOST de la VM (CLI confluent flink). No usa el Job slim.
  → si N=1|2|3: kubectl Job python:3.11-slim en namespace confluent
  → el pod habla con kafka.confluent.svc.cluster.local:9092  (SASL_SSL, cert self-signed)
```

---

## 4. Identificadores TechZone (ya no existe “mesa”)

El hub y el MCP **dejaron de usar** `m01_p042`.

| Concepto | Valor (ejemplo TZ1, número 42) |
|---|---|
| TechZone | TZ1 / TZ2 / TZ3 (`WORKSHOP_TABLE` sigue siendo `1`, `2` o `3`) |
| Número participante | 1–100, pad 3 dígitos |
| `WORKSHOP_ID` | `tz1_p042` |
| Tópico fuente | `inventory.transactions.tz1_p042` |
| Tópico derivado | `inventory.availability.tz1_p042` |
| Flink | `inventory.availability.flink.tz1_p042` |
| Stream ksqlDB | `INVENTORY_TRANSACTIONS_TZ1_P042` |
| Tabla ksqlDB | `INVENTORY_AVAILABILITY_TZ1_P042` |
| Agentes Track F | sufijo `_TZ1_P042` |
| Placeholder IP en config | `<IP_PUBLICA_VM_TZ1>` (no `_MESA_01`) |

MCP (`infra/retail-mcp/server.py`): `get_sku_availability(table_number, participant_number, sku, branch)`.  
`table_number` es **1–3** (TechZone del hub, no mesa 4–6). El proceso **no** exige que coincida con `WORKSHOP_TABLE` de la VM. El tópico es `inventory.availability.tz{n}_p{xxx}` en el Kafka **de esa VM**. Si envías mesa 4–6, el MCP responde error de rango, no “TechZone de este servidor”.

No inventes nombres genéricos `inventory.transactions` en Kafka: el `.env` ya trae `TOPIC_NAME` namespaced. El hub personaliza los prompts en pantalla; en disco manda `TOPIC_NAME` / `KSQL_*`.

---

## 5. Paso 0 — hazlo siempre primero (una vez por sesión)

Orden fijo. Si un paso falla, **detente** y reporta stderr. No lances `setup.sh`.

### 5.1 PEM

```bash
chmod 600 trackD/inventory-pipeline/cflt-vsi-key.pem
ssh-keygen -y -f trackD/inventory-pipeline/cflt-vsi-key.pem
```

Si `invalid format`: **no regeneres** la clave y **no pidas otra**. Reenvuelve solo el cuerpo base64 a 76 columnas; deja intactos `BEGIN` / `END`; `chmod 600`; vuelve a `ssh-keygen -y`.

### 5.2 SSH

```bash
ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=15 \
    root@[IP_PUBLICA_VM] 'echo ok'
```

Esperado: `ok`.

### 5.3 Extraer secretos (fuente de verdad)

Sustituye `PEM` e `IP`. No pegues el output de passwords en el chat.

```bash
PEM=trackD/inventory-pipeline/cflt-vsi-key.pem
SSH="ssh -i $PEM -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 root@[IP_PUBLICA_VM]"

# Kafka — secret kafka-external-plain-users, key plain-users.json, campo "kafka-admin"
KAFKA_PASS=$($SSH 'kubectl -n confluent get secret kafka-external-plain-users \
  -o jsonpath="{.data.plain-users\.json}" | base64 -d \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[\"kafka-admin\"])"')

# ksqlDB — secret ksqldb-users, key basic.txt, formato "admin: PASSWORD,admin"
KSQL_PASS=$($SSH 'kubectl -n confluent get secret ksqldb-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"')

# Schema Registry — secret schemaregistry-users, mismo formato
SR_PASS=$($SSH 'kubectl -n confluent get secret schemaregistry-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"')
```

Escribe esas tres en **los tres** `.env`:

- `KAFKA_SASL_PASSWORD`
- `KSQLDB_PASSWORD` (y `KSQLDB_API_SECRET` con el mismo valor si existe la clave)
- `SCHEMA_REGISTRY_PASSWORD`

### 5.4 Resto de placeholders

- Sustituye `<IP_PUBLICA_VM_TZ*>` en `SSH_HOST` y URLs por la IP real. **No** toques `WORKSHOP_ID`, `TOPIC_NAME`, `KSQL_STREAM_NAME`, `KSQL_TABLE_NAME`.
- Asegura  
  `SCHEMA_REGISTRY_URL_INTERNAL=http://schemaregistry.confluent.svc.cluster.local:8081`
- Deja `ORCHESTRATE_URL=""` (comillas vacías). **Nunca** `ORCHESTRATE_URL=<algo>`.
- Endpoints internos (los que usan los pods):
  - Kafka: `kafka.confluent.svc.cluster.local:9092` — **SASL_SSL + PLAIN**, usuario `kafka-admin`
  - ksqlDB: `http://ksqldb.confluent.svc.cluster.local:8088`
  - Schema Registry: `http://schemaregistry.confluent.svc.cluster.local:8081` (HTTP, no el `https://IP/sr` externo)

### 5.5 Check

Desde la **raíz**:

```bash
bash participant-bootstrap.sh check
```

Esperado: `Workspace: tz1_p042` (o el id del participante).  
Confirma al usuario con **`listo`** solo si: SSH ok, PEM válido, tres passwords en los tres `.env`, `ORCHESTRATE_URL=""`.

---

## 6. Labs D — comandos (después del Paso 0)

Siempre desde la raíz del bundle. El `.env` que cuenta sigue siendo el de la raíz.

```bash
cd trackD/inventory-pipeline && ./setup.sh -s 1   # tópico + JSON schema
cd trackD/inventory-pipeline && ./setup.sh -s 2   # ensure ksql SR (si falta) + stream/tabla JSON_SR
cd trackD/inventory-pipeline && ./setup.sh -s 4   # Flink CMF (catálogo confluent)
cd trackD/inventory-pipeline && ./setup.sh -s 3   # 20 eventos
```

**No** ejecutes `bash run_in_cluster.sh produce_messages` “desde `~/inventory-pipeline` en la VM”. El orquestador local es `setup.sh`.

### Step 1 — éxito

```
Created topic: inventory.transactions.tz1_p042
OK: create_topic
JSON schema ready: inventory.transactions.tz1_p042-value
OK: register_schema
```

(o `Topic already exists: …` si ya estaba). El nombre exacto es `$TOPIC_NAME`. `-s 1` corre **create_topic y register_schema**. Schema Registry desde el pod: `SCHEMA_REGISTRY_URL_INTERNAL`.

Kafka del overlay **ya incluye** (no hace falta parchear a ciegas):

```python
"ssl.endpoint.identification.algorithm": "none",
"enable.ssl.certificate.verification": "false",
```

en `create_topic.py`, `produce_messages.py` y `delete_topics.py`. Si en un checkout viejo falta la segunda clave, añádela; no pidas passwords.

### Step 2 — ksqlDB

- `-s 2` corre **primero** `ensure_ksql_sr.py` en el host (kubectl). Si el pod no tiene `ksql.schema.registry.url`, parchea `ksqldb-shared-config` (`USER_INFO`, URL interna `:8081`) y reinicia ksql. Si ya está: `KSQL_SR_OK` y no restart. **Único** parche de cluster autorizado en este step.
- Usa SR **interno** (`SCHEMA_REGISTRY_URL_INTERNAL`).
- **No** pases `ksql.schema.registry.url` ni user/pass de SR en `streamsProperties` del POST `/ksql`. ksql 8.2 las ignora. **No** cambies a `VALUE_FORMAT=JSON` para esquivar SR.
- `VALUE_FORMAT='JSON_SR'`. Sin `VALUE_SCHEMA_ID` y sin `WRAP_SINGLE_VALUE` (8.2 los rechaza). Nombres = `KSQL_STREAM_NAME` / `KSQL_TABLE_NAME`.

Éxito: `KSQL_SR_OK` (o `KSQL_SR_CM_PATCHED` + restart), `SUCCESS` o `already exists`, y `Derived table ready` / `OK: create_derived_topic`.

### Step 3 — publicar

Éxito:

```
Delivered: 20/20 (failed: 0)
Published 20 JSON_SR transactions to inventory.transactions.tz1_p042
OK: produce_messages
```

El Job pinnea `confluent-kafka==2.6.1` + `jsonschema`. El productor usa `to_dict` y `SCHEMA_REGISTRY_URL_INTERNAL`.

### Step 4 — Flink CMF (`./setup.sh -s 4`)

No improvises Flink OSS. Corre el script del bundle. Contrato:

- CLI en la VM: `confluent flink --url http://$(minikube ip):30022` (nunca `https://IP/cmf` para el agente).
- `FLINK_ENV=flink-env`, `FLINK_COMPUTE_POOL=flink-compute-pool`, `FLINK_CATALOG=flink-catalog`, `FLINK_DATABASE=flink-database`.
- Connector solo `confluent`. Source = tabla de catálogo de `TOPIC_NAME`. Sink = `FLINK_TOPIC_NAME`.
- El catálogo lee JSON Schema en minúsculas. El INSERT usa `sku`/`branch`/`quantity` (alias `AS SKU` si el sink es mayúsculas). No `SKU`/`QUANTITY` en el FROM.
- El script sube `transaction.max.timeout.ms=3600000` en el CR Kafka (`spec.configOverrides.server`). No es dinámico: hay rolling restart. El primer `-s 4` del día puede tardar varios minutos; el resto sale al toque.

Éxito: `phase=RUNNING`, `OK: submit_flink`, `Flink aggregation job RUNNING`.

---

## 7. Árbol de diagnóstico (si algo falla igual)

| stderr | Qué mirar | Qué hacer |
|---|---|---|
| `invalid format` / `no pubkey loaded` | PEM | Rewrap 76 cols; no regenerar |
| `syntax error near unexpected token` | `ORCHESTRATE_URL` con `<...>` | `ORCHESTRATE_URL=""` en los tres archivos |
| `plaintext connection?` | Password Kafka vacía o cliente sin TLS | Paso 0 sobre **`.env` raíz**; SASL_SSL |
| `certificate verify failed` | Self-signed | `enable.ssl.certificate.verification=false` |
| `_TRANSPORT` / metadata | Password mala o secret mal parseado | Re-extraer `kafka-external-plain-users` |
| ksqlDB 401 | `KSQLDB_PASSWORD` vacío o desincronizado | Extraer `ksqldb-users` → tres `.env` |
| ksqlDB 42801 / JSON_SR | Servidor ksql sin `ksql.schema.registry.url` (Operator no aplica el CR) | `./setup.sh -s 2` → `ensure_ksql_sr.py`. No SR en `streamsProperties` |
| ksqlDB 40001 VALUE_SCHEMA_ID / WRAP_SINGLE_VALUE | ZIP viejo vs ksql 8.2 | Re-descargar bundle; no editar DDL |
| Flink `Column 'SKU' not found … sku` | Catálogo JSON Schema minúsculas | ZIP nuevo: INSERT con `sku`/`quantity` |
| `No module named 'httpx'` / `to_dict must be callable` | ZIP viejo sin pin de confluent-kafka | Regenerar bundle; overlay pin 2.6.1 + jsonschema |
| Flink `Supported values are: [confluent]` | Bob usó connector kafka | `./setup.sh -s 4`; no inventar WITH kafka |
| Flink `transaction timeout is larger than the maximum` | broker max 15 min vs Flink 1 h; no es dinámico | `submit_flink.py` parchea `spec.configOverrides.server` (rolling restart). En TZ1 ya quedó en 3600000. |
| Flink `Column 'SKU' is NOT NULL` | tombstones / filas nulas en el source | El INSERT filtra `SKU IS NOT NULL AND BRANCH IS NOT NULL` y `not-null-enforcer=DROP` |
| MCP `table_number` fuera de 1–3 | Mesa física (4–6) o pin viejo de VM | Usar TZ del hub (1–3). El MCP ya no pinnea `WORKSHOP_TABLE` |

---

## 8. Track F (Orchestrate) — qué ya está resuelto

- Mismo bundle, workspace = **raíz** `RoadShowBobStreamingIntegration` (no abras solo `confluent_agents`). Misma TechZone + número (`tz1_p042`) que Track D: eso nombra tópicos, **no** la cuenta Orchestrate del BP.
- Kafka / ksql / SR **ya** vinieron del Paso 0 de Track D. **No** pidas esas contraseñas otra vez.
- Completa `ORCHESTRATE_URL` y `ORCHESTRATE_API_KEY` desde IBM Cloud → instancia wxo (`itz-saas-*`) → **Credenciales** del servicio. No uses la Service ID API Key del output de TechZone como `ORCHESTRATE_API_KEY`. No las inventes ni las imprimas.
- Auth CLI: `orchestrate env add --name workshop --url "$ORCHESTRATE_URL" --type ibm_iam` y `activate --api-key "$ORCHESTRATE_API_KEY"`. El aviso `mcsp_v2` es ruido si la URL contiene `.cloud.ibm.com`.
- `RETAIL_MCP_URL` = `http://<IP de SSH_HOST>/retail-mcp/mcp` (**HTTP**, sin `<>`, sin HTTPS). El toolkit lo registra el facilitador hacia **esa** VM (tópicos); el alumno **no** hace `toolkits add`.
- Tool: `get_sku_availability(table_number, participant_number, sku, branch)`. `table_number` 1–3 = TZ del hub, no mesa. **No** hay `workshop_id`. **No** hay pin de VM/`WORKSHOP_TABLE`.
- Si `found=false`, el tópico `inventory.availability.tzN_pXXX` de **esa** VM está vacío (o el toolkit apunta a otra IP). Arreglo: Track D `./setup.sh -s 3` (`KSQL_FALLBACK`). No “corrijas” cruzando etiquetas TZ ni apuntando el toolkit a Flink. ksql no está caído.

---

## 9. Qué no hacer

- No pedir passwords de Confluent al usuario.
- No imprimir secretos, PEM ni API keys en el chat.
- No crear un `.env` “nuevo” a mano en un path inventado; sincroniza los tres del árbol.
- No usar placeholders `<URL_…>` ni `<IP_…>` en valores que se hacen `source` en bash (salvo mientras aún no sustituyes la IP: entonces el bootstrap `check` puede avisar; el `source` completo exige IP ya sustituida y `ORCHESTRATE_URL=""`).
- No abrir solo `inventory-pipeline` como carpeta de Bob.
- No asumir listener 9092 plaintext.
- No registrar schema Protobuf a mano con `[PASSWORD_ADMIN]` (hay un bloque HTML **oculto** legado en `topics.html`; el flujo real es JSON Schema vía `register_schema.py` / pipeline). Formato de valor: **JSON_SR**, no Protobuf.
- No reescribir `AGENT_PROMT_MASTER.md`; es auditoría histórica.

---

## 10. Dónde está cada cambio en el repo (por si verificas)

| Pieza | Archivo |
|---|---|
| IDs TZ, `ORCHESTRATE_URL=""`, `SSH_KEY` con path de raíz, diálogo TechZone, `labsBob.participant.v2` | `docs/js/participant.js` |
| Cache-bust del hub | `docs/js/app.js` (`participant.js?v=4`) |
| Prompts Paso 0 / labs | `docs/content/integraciones/agentic-retail-confluent/{overview,topics,ksqldb,publish}.html` |
| Copy TechZone D/F/Voltia | overviews + `create.html` + `ui-access.html` + `cheatsheet.html` |
| SSL Kafka + produce JSON_SR | `workshop/participant-overlay/{create_topic,produce_messages,delete_topics,register_schema,run_in_cluster_remote}.py/.sh` |
| Flink CMF | `workshop/participant-overlay/submit_flink.py`, `setup.sh -s 4` |
| ksql SR ensure | `workshop/participant-overlay/ensure_ksql_sr.py`, `setup.sh -s 2` |
| ZIP que descarga el alumno | `docs/downloads/agentic-retail-workshop.zip` (regenerado con `scripts/build_agentic_bundle.py`) |
| MCP HTTP, `table_number`/`participant_number`, sin pin VM | `infra/retail-mcp/server.py` |

---

## 11. Mensaje corto para pegarte a ti mismo al arrancar

> Workspace = `RoadShowBobStreamingIntegration`. PEM = `trackD/inventory-pipeline/cflt-vsi-key.pem`. El humano solo me da la IP. Extraigo las 3 passwords con kubectl en `confluent`, las escribo en los 3 `.env`, `ORCHESTRATE_URL=""`, SSH `accept-new`. `run_in_cluster.sh` lee `../../.env`. Kafka interno = SASL_SSL + verify false (ya en overlay). IDs = `tzN_pXXX`, nunca `m01_`. Paso 0 → `listo` → `setup.sh -s 1|2|4|3`. Flink = `-s 4` (conector `confluent`, catálogo, no OSS). No pido passwords. No las imprimo.

Si cumples ese párrafo, la conexión deja de ser un laberinto de iteraciones: es un bootstrap + tres steps.
)
