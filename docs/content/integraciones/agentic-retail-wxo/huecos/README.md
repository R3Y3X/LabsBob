# Huecos Track F — dry-run TZ1-P099 (2026-09-08)

Notas de facilitador / agente. **No** se renderizan en el hub (`data.js` no las lista). Cero secretos.

Dry-run contra TechZone TZ1, participante **99** (`tz1_p099`), IP `163.66.83.162`. Hub local `python3 -m http.server 8000`. Bundle: ZIP base + `participant-config.env` del diálogo TZ1-99. Mismo PEM/workspace scratch que el Track D (`scratch/tz1_p099/…`).

**Esta pasada no parchea producto.** El otro agente debe leer cada sección “Cómo debe quedar” e implementar HTML / overlay / briefing / ZIP. No hay instancia de watsonx Orchestrate ni API key: CLI, import, Deploy, Knowledge y chat quedan **BLOQUEADO (falta instancia)** con el procedimiento exacto.

| Lab del hub | Página | Resultado en el dry-run |
|---|---|---|
| Introducción | [overview.html](../overview.html) | Workspace ambiguo; `personalizeContent` rompe el tópico MCP en pantalla |
| Disponibilidad MCP | [create.html](../create.html) | Workspace `confluent_agents/` vs prompts de raíz; MCP HTTP ok en VM; toolkit no se pudo listar |
| Interfaz WxO | [ui-access.html](../ui-access.html) | UI Cloud documentada; chat **fallaría hoy**: disponibilidad p099 vacía; falta captura de chat |
| Sustitutos RAG | [rag.html](../rag.html) | KB sufijada en el hub; catálogo del ZIP no cubre todos los SKU Kafka; PNG 404 |
| Supervisor | [integration.html](../integration.html) | Colaboradores sí se sufijan en YAML; pregunta de prueba usa un SKU ausente del catálogo; PNG 404 |
| Asistente cliente | [shopping.html](../shopping.html) | YAML sin Knowledge; snippet/PNG 404; Orchestrate no probado |

---

## Resumen ejecutivo (qué arreglar primero)

Prioridad para el agente que implemente:

1. **P0 — Stock de p099.** El MCP está sano. `inventory.transactions.tz1_p099` tiene **20** mensajes. `inventory.availability.tz1_p099` tiene **0**. La tabla ksql `INVENTORY_AVAILABILITY_TZ1_P099` existe y su CTAS está `RUNNING`, pero `SELECT *` no devuelve filas. El chat “¿Cuánto stock hay de LAPTOP-DELL-XPS-15…?” devolverá `found: false` hasta materializar el changelog. Flink `inventory.availability.flink.tz1_p099` también está en 0 (el MCP **no** lee Flink).
2. **P0 — Workspace.** Track D y `trackF/README.md` (dentro del ZIP) piden la **raíz** `RoadShowBobStreamingIntegration`. Overview F dice “abre `trackF/confluent_agents` o la raíz”. `create.html` obliga `File → Open Folder` a `confluent_agents/` y afirma que `participant-config.env` se ve ahí. Ese archivo vive en la raíz; el bootstrap copia `workshop-config.env` dentro de `confluent_agents`. El prompt del Paso 2 corre `./participant-bootstrap.sh` desde la raíz. Misma trampa que abrir solo `inventory-pipeline`.
3. **P0 — Briefing desactualizado.** [`BRIEFING_AGENTE_TRACK_D_F.md`](../../../../../BRIEFING_AGENTE_TRACK_D_F.md) §8 dice `RETAIL_MCP_URL=https://…` y tool con `workshop_id`. El código y el hub dicen HTTP + `table_number` / `participant_number`. Un agente que obedezca el briefing registra mal el toolkit.
4. **P1 — MCP en el lab del alumno.** En TZ1 el servicio **ya está bien**. Falta que el hub lo deje obvio: un `curl` de health, una sola regla HTTP, y un recuadro de facilitador (el alumno no registra el toolkit).
5. **P1 — Catálogo vs Kafka.** `product-catalog.docx` del ZIP no lista `LAPTOP-MACBOOK-PRO-16` ni ningún `MOBILE-*`. La pregunta del supervisor usa ese MacBook. RAG puede responder “SKU no encontrado en el catálogo”.
6. **P1 — Capturas 404** (el hub muestra placeholder Carbon; no rompe el lab).
7. **P2 — `personalizeContent`** convierte `inventory.availability.tzN_pXXX` en `inventory.availability.tz1_p099.tzN_pXXX`.
8. **P2 — Voseo** en los YAML (`Sos`, `respondé`) vs hub en tú; `ejecutá` en el prompt del Paso 2.

---

## MCP configuración (facilitador + alumno)

Esta es la verificación que pediste: ¿quedó clara y sencilla? **En la VM TZ1, sí. En el hub, no del todo.**

### Qué hay HOY en TZ1 (comprobado)

| Chequeo | Resultado |
|---|---|
| SSH `root@163.66.83.162` | `ok` |
| `systemctl is-active retail-mcp` | `active` (desde 2026-09-07 22:03 UTC, python `/opt/retail-mcp/server.py`, listen `127.0.0.1:8000`) |
| HTTP `GET http://163.66.83.162/retail-mcp/health` | `200` `{"status":"ok","workshop_table":1,"topic_pattern":"inventory.availability.tz1_p%03d","schema_registry":true}` |
| HTTPS el mismo path | `200` mismo JSON (el toolkit **no** debe usar HTTPS: Orchestrate rechaza el cert; en esta VM hay Let’s Encrypt, pero el contrato del lab es HTTP) |
| `http://163.66.83.162/` | `301` → HTTPS (Control Center). **No** aplica a `/retail-mcp/` |
| nginx `:80` `location /retail-mcp/` | proxy a `127.0.0.1:8000/`; el `return 301` está **solo** en `location /` |
| nginx `:443` `location /retail-mcp/` | igual, presente |
| `/etc/retail-mcp/retail-mcp.env` | `WORKSHOP_TABLE=1`, `BOOTSTRAP_SERVERS_EXTERNAL` set (len 58), `SASL_SSL`/`PLAIN`/`kafka-admin`, passwords len 26, `TLS_VERIFY=false`, `MCP_TRANSPORT=http`, `MCP_HOST=127.0.0.1`, `MCP_PORT=8000`, `MCP_PATH=/mcp` |
| Tool MCP | `get_sku_availability(table_number, participant_number, sku, branch)` — **no** hay `workshop_id` |
| Llamada real p099 Dell + `DOT Shopping` | alias OK (`branch` canónico `Dot Shopping`); `found: false`; `topic=inventory.availability.tz1_p099`; `total_read=0`; `complete=true` |
| Llamada p001 mismo SKU | `found: true`, `available_quantity=47` → Kafka + decode JSON_SR **funcionan** |
| `table_number=2` contra esta VM | `table_number no corresponde a la TechZone de este servidor` |
| Watermarks p099 | transacciones **20**; availability ksql **0**; Flink **0** |
| ksql | stream + table `INVENTORY_*_TZ1_P099` existen; CTAS `RUNNING`; `SELECT *` de la tabla = solo header, cero filas |

Contrato que el producto ya cumple en código ([`infra/retail-mcp/server.py`](../../../../../infra/retail-mcp/server.py)):

- Tópico: `inventory.availability.tz{n}_p{xxx}` (ksql `DERIVED_TOPIC_NAME`), **no** el tópico Flink.
- Sucursales canónicas: `Dot Shopping` / `Unicenter`. Alias `dot` / `DOT` / `DOT Shopping` / `el dot` / `unicenter` / `uni` OK.
- Campo cantidad: `available_quantity` o `AVAILABLE_QUANTITY`.
- Health: `GET /health` detrás de nginx = `http://<IP>/retail-mcp/health`.
- Streamable HTTP: `POST http://<IP>/retail-mcp/mcp` (sin session → `400 Missing session ID`, esperado). Initialize OK: serverInfo `Voltia Retail Availability` v4.

El `participant-config.env` del scratch p099 ya tiene `RETAIL_MCP_URL=http://163.66.83.162/retail-mcp/mcp` (Paso 0 del Track D sustituyó el placeholder). `ORCHESTRATE_URL` sigue vacío.

### Qué NO es sencillo en el hub

- El alumno **no** instala el MCP (correcto) pero **tampoco** tiene un paso “comprueba que vive” antes de importar agentes. Si el toolkit falta o el tópico está vacío, se entera en el chat.
- No hay página/callout de **facilitador** en Overview F. El runbook está en [`infra/retail-mcp/README.md`](../../../../../infra/retail-mcp/README.md) (repo) y en `trackF/README.md` (ZIP). Quien solo mira el hub no ve `deploy_vm.sh` ni `register_shared_toolkit.sh` con contexto.
- `create.html` pide revisar que `RETAIL_MCP_URL` use `http://`, pero no dice “si ves `<IP_PUBLICA_VM_TZ1>` todavía, `source` se rompe por los `<>`” (mismo bug que `ORCHESTRATE_URL=<...>` en Track D).
- [`register_shared_toolkit.sh`](../../../../../workshop/participant-overlay/register_shared_toolkit.sh) por defecto hace `source workshop-config.env` **en** `confluent_agents/`. El bootstrap copia `participant-config.env` → `trackF/confluent_agents/workshop-config.env`. Si el facilitador corre el script sin bootstrap, falla. El hub personaliza `workshop-config.env` → `participant-config.env` en el HTML, así que la doc visible y el default del script no coinciden.

### Checklist para copiar al Overview / create (alumno)

Dejar esto en un callout, sin pedir passwords:

1. Mismo bundle, misma TechZone y número que Track D. Workspace Bob = **raíz** `RoadShowBobStreamingIntegration` (no abras solo `confluent_agents`).
2. En `participant-config.env`: `WORKSHOP_ID=tz1_p099` (ejemplo), `RETAIL_MCP_URL=http://<IP>/retail-mcp/mcp` **sin** `<` `>` ni `https://`.
3. Pedile a Bob: `curl -sS http://<IP>/retail-mcp/health` — esperado `status=ok` y `workshop_table` = tu TZ (1/2/3).
4. Completá solo `ORCHESTRATE_URL` y `ORCHESTRATE_API_KEY`. No pidas Kafka/ksql/SR. No ejecutes `orchestrate toolkits add`.
5. `orchestrate toolkits list` debe mostrar `retail_availability_mcp` / `get_sku_availability`. Si no, avisá al facilitador y **parate**.

### Checklist facilitador (una vez por VM + una vez por instancia Orchestrate)

No está en el hub; el otro agente debería subirlo a Overview F (bloque “Solo facilitador”) o a un cheatsheet F.

1. En la VM: `sudo ./install.sh` o `./deploy_vm.sh root@<IP> <pem> <1|2|3> ./tzN-retail-mcp.env` desde [`infra/retail-mcp/`](../../../../../infra/retail-mcp/).
2. Nginx: `location /retail-mcp/` en **`:80` y `:443`**. El `return 301` a HTTPS va en `location /`, nunca a nivel `server` del `:80`. Verificar: `curl -sS http://<IP>/retail-mcp/health` queda en HTTP (no 301).
3. `WORKSHOP_TABLE` del env del MCP = número de esa VM. Credenciales Kafka SASL + SR de **esa** VM en `/etc/retail-mcp/retail-mcp.env` (nunca al git).
4. Prueba de aislamiento: tool con `table_number` de otra TZ debe rechazar; con la TZ correcta + un asiento que **tenga** filas en `inventory.availability.tzN_pXXX` debe devolver `found: true` y una cantidad.
5. Por instancia watsonx Orchestrate, **una vez**:

```bash
cd trackF/confluent_agents
# workshop-config.env lo crea participant-bootstrap.sh (copia del participant-config.env de la raíz)
# RETAIL_MCP_URL ya tiene que ser http://<IP>/retail-mcp/mcp
./register_shared_toolkit.sh
```

Transporte `streamable_http`. Nunca `sse`. Nunca HTTPS. Nunca registrar el toolkit desde la laptop de cada alumno.

6. Antes del evento, un asiento canario (p001 en esta VM ya tiene 1 mensaje y el MCP respondió 47). p099 **no** sirve de canario hasta materializar ksql.

### Cómo debe quedar el health en el prompt de Bob (Paso 2 o 3 de create.html)

```
Sigue en la misma terminal, desde la raíz RoadShowBobStreamingIntegration.

1. source participant-config.env
2. Ejecuta: curl -sS "$RETAIL_MCP_URL/../health"   # o curl -sS http://$IP/retail-mcp/health
   Dime solo si status=ok y workshop_table coincide con WORKSHOP_TABLE. No inventes la IP.
3. Si RETAIL_MCP_URL contiene "<" o "https://", detente y avísame: hay que dejarla en http://<IP>/retail-mcp/mcp.
```

Mejor aún: no uses `../health` (frágil). Prompt explícito:

```
IP="${SSH_HOST#root@}"
curl -sS "http://${IP}/retail-mcp/health"
```

---

## Lab 0 — Introducción (`overview.html`)

### Qué pide el lab

- No descargar un bundle nuevo; reutilizar el del Track D, misma TZ y número.
- Abrir `RoadShowBobStreamingIntegration/trackF/confluent_agents` **o** mantener la raíz.
- Arquitectura: MCP HTTP Streamable HTTP, toolkit `retail_availability_mcp` lo registra el facilitador, YAML por participante, credenciales Orchestrate aparte.
- Orden del recorrido (4 ítems): Disponibilidad MCP → Sustitutos RAG → Supervisor → Asistente cliente. **No nombra** el lab “Interfaz WxO” aunque está en el menú.

### Qué falta o está mal

#### Workspace doble (P0)

Tres textos distintos:

| Fuente | File → Open Folder |
|---|---|
| Track D overview | raíz `RoadShowBobStreamingIntegration` |
| `trackF/README.md` (ZIP) | raíz |
| Overview F | `…/trackF/confluent_agents` **o** raíz |
| `create.html` | `confluent_agents/` y checklist con `participant-config.env` en el explorador |

`participant-config.env`, `participant-bootstrap.sh` y `.env` están en la **raíz**. En `confluent_agents/` el alumno ve los cuatro YAML, el docx, `personalize_agents.py`, `register_shared_toolkit.sh` y (tras bootstrap) `workshop-config.env`.

#### `personalizeContent` parte el tópico (P2, visible con TZ1-P099)

HTML fuente: `inventory.availability.tzN_pXXX`.  
[`participant.js`](../../../../js/participant.js) reemplaza `inventory.availability` → `inventory.availability.tz1_p099`.  
Pantalla: `inventory.availability.tz1_p099.tzN_pXXX`.

Arreglo: en el HTML usar un placeholder que no contenga el prefijo (`inventory.availability.*` o `DERIVED_TOPIC_NAME`), o proteger `tzN_pXXX` como se protegen los nombres de archivo YAML.

#### Orden del recorrido (P2)

Añadir el lab Interfaz WxO entre Disponibilidad MCP y Sustitutos (es donde se hace Deploy + chat del primer agente).

### Cómo debe quedar (copy de workspace, Overview + create)

Un solo recuadro en Overview y create, calcado del Track D:

```
File → Open Folder
RoadShowBobStreamingIntegration
```

Prosa: “No abras solo `trackF/confluent_agents`. El `.venv` se crea *dentro* de `trackF/confluent_agents`; los prompts que hacen `source participant-config.env` y `./participant-bootstrap.sh` son desde la raíz. Bob puede `cd trackF/confluent_agents` para pip/import.”

---

## Lab 1 — Disponibilidad MCP (`create.html`)

### Qué pide el lab

1. Workspace `confluent_agents/`, Agent Mode, una sola conversación.
2. Prompt CLI: venv `.venv`, pip, `ibm-watsonx-orchestrate`, `orchestrate --version`.
3. Prompt config: desde la **raíz**, `./participant-bootstrap.sh check`, `python3 trackF/confluent_agents/personalize_agents.py --config participant-config.env`, listar variables de ejemplo. Completar solo Orchestrate. No pedir Kafka.
4. Prompt env: `source participant-config.env`, `orchestrate env add/activate`, `orchestrate toolkits list`. Si no está `retail_availability_mcp`, parar. **Prohibido** `toolkits add`.
5. Import: `orchestrate agents import --file SKU_Availability_Agent.yaml` y listar. En el hub personalizado el checkpoint pide `SKU_Availability_Agent_TZ1_P099` (el filename YAML **no** se sufija; `personalizeContent` protege `*.yaml`).

### Evidencia personalize (local, overlay)

`personalize_agents.py --config` con TZ1-99:

- `name: SKU_Availability_Agent_TZ1_P099`
- Instrucciones: `table_number="1"` `participant_number="99"`; “No uses workshop_id.”
- Supervisor: `collaborators: SKU_Availability_Agent_TZ1_P099`, `Substitute_Finder_Agent_TZ1_P099`
- Substitute YAML: **no** tiene bloque `knowledge:` (la KB se crea en la UI)
- `llm: groq/openai/gpt-oss-120b` en los cuatro YAML — **BLOQUEADO** validar si la instancia lo tiene

El prompt del Paso 2 usa voseo (`Luego ejecutá python3…`). El resto del hub está en tú.

### Qué falta o está mal

#### El Paso 2/3 se cae si Bob abrió `confluent_agents/` (P0)

`./participant-bootstrap.sh` y `source participant-config.env` no existen en ese cwd. Accordion del Paso 1 sí asume `confluent_agents` (correcto para venv). Hay que decir en el prompt: “cwd raíz para config; cwd `trackF/confluent_agents` con `.venv` activo para orchestrate”.

#### No hay curl de health (P1)

Documentado arriba. Sin Orchestrate igual se puede (y se pudo) validar el MCP.

#### Criterios de éxito no incluyen “el agente responde stock” (OK)

Eso está en ui-access. Pero ui-access **fallaría** con p099 vacío: no es un bug del prompt de import.

### Cómo debe quedar el prompt de CLI (Paso 1)

Se puede dejar casi igual. Añadir: “El workspace de Bob es la raíz del bundle. Crea `.venv` en `trackF/confluent_agents`.”

### Cómo debe quedar el prompt de config (Paso 2)

```
Sigue en la misma conversación. El workspace es la raíz RoadShowBobStreamingIntegration.

1. Ejecuta ./participant-bootstrap.sh check y confirma WORKSHOP_ID (ejemplo tz1_p099).
2. python3 trackF/confluent_agents/personalize_agents.py --config participant-config.env
3. Abre participant-config.env y listá SOLO los nombres de variables que sigan vacías o con <...>. Nunca imprimas secretos.
4. Kafka/ksql/SR ya están. No las pidas.
5. Completá ORCHESTRATE_URL y ORCHESTRATE_API_KEY cuando yo las ponga. RETAIL_MCP_URL debe ser http://<IP>/retail-mcp/mcp (no https, sin <placeholders>).
6. IP="${SSH_HOST#root@}"; curl -sS "http://${IP}/retail-mcp/health" — esperá status=ok y workshop_table igual a WORKSHOP_TABLE.
```

### Cómo debe quedar el prompt de toolkit (Paso 3)

Igual que ahora, más: cwd raíz para `source participant-config.env`, luego `cd trackF/confluent_agents` y `source .venv/bin/activate` si hace falta. Confirmar nombres **con sufijo** `SKU_Availability_Agent_TZ{N}_P{xxx}` después del import (el archivo sigue llamándose `SKU_Availability_Agent.yaml`).

### BLOQUEADO (falta instancia)

- `orchestrate --version` / pip
- `env add` / `activate` / `toolkits list`
- `agents import`

Cuando haya URL+key: no pegar la key en el chat; usar `"$ORCHESTRATE_API_KEY"`. Si `toolkits list` está vacío, **no** improvisar `toolkits add` con credenciales locales.

---

## Lab 2 — Interfaz WxO (`ui-access.html`)

### Qué pide el lab

IBM Cloud → notificaciones Join now → Lista de recursos → Iniciar watsonx Orchestrate → Build. Buscar `SKU_Availability_Agent` (en pantalla TZ1-99: `SKU_Availability_Agent_TZ1_P099`). Toolset `retail_availability_mcp:get_sku_availability`. Deploy. Chat:

```
¿Cuánto stock hay de LAPTOP-DELL-XPS-15 en DOT Shopping?
```

Esperado: cantidad concreta + sucursal; traza de la tool.

Capturas Cloud (`notificaciones.png` … `deploy_resumen.png`): **200** en el hub local.

### Qué falta o está mal

#### El chat de p099 no puede cumplir el checkpoint (P0, datos)

Llamada MCP 2026-09-08:

```
found=false
topic=inventory.availability.tz1_p099
total_read=0
```

El productor del Track D **sí** dejó 20 JSON_SR en `inventory.transactions.tz1_p099`. ksql no volcó el changelog. El otro agente / facilitador tiene que **recrear o empujar** la CTAS con `ksql.streams.auto.offset.reset=earliest` (el DDL ya está en `create_derived_topic.py`) hasta que:

```
curl/MCP get_sku_availability table=1 participant=99 sku=LAPTOP-DELL-XPS-15 branch=Dot Shopping
```

devuelva `found: true` y una cantidad (p001 de referencia: 47).

No hace falta que el alumno toque ksql en Track F; es prerequisito. El lab F debería decir: “Si el agente dice que no hay datos, el tópico `inventory.availability.<WORKSHOP_ID>` está vacío: volvé al Track D (publicar + tabla ksql) antes de seguir.”

#### Pregunta de prueba “DOT Shopping” (P2)

El MCP normaliza a `Dot Shopping`. Mejor pegar el canónico en el prompt de chat para no depender del alias, o dejar DOT y documentar que el YAML ya enseña el canónico.

#### Captura de chat ausente (P1)

`sku-availability-chat.png` está en IMAGES.md y **no** está en el HTML ni en disco (`404`). Las otras páginas sí ponen `<img>` que 404.

Join now / campana: no se pudo verificar contra IBM Cloud. Dejar como riesgo de UI desactualizada (**BLOQUEADO**).

### Cómo debe quedar el checkpoint de chat

- Agente listado con sufijo TechZone+número.
- Toolset con `get_sku_availability`.
- Respuesta con cantidad **y** sucursal `Dot Shopping`.
- Si `found` es false: no avanzar; avisar facilitador (tópico vacío o toolkit mal apuntado).

---

## Lab 3 — Sustitutos RAG (`rag.html`)

### Qué pide el lab

Misma conversación. Import `Substitute_Finder_Agent.yaml`. En UI: Knowledge → Upload `product-catalog.docx`, nombrar la KB. Deploy. Chat de alternativas para Dell XPS 15.

Con TZ1-P099 el hub personaliza `enterprise_documents` → `enterprise_documents_tz1_p099` (coincide con `KNOWLEDGE_BASE_NAME` del `.env`). Eso está **bien** para aislamiento, siempre que create/rag/shopping usen el **mismo** nombre. Los YAML **no** declaran la KB: el alumno la crea a mano. `personalize_agents.py` imprime `knowledge base: enterprise_documents_tz1_p099` aunque no haya string que reemplazar en el YAML.

### Qué falta o está mal

#### Catálogo del ZIP vs SKUs Kafka (P1)

Texto extraído de `trackF/confluent_agents/product-catalog.docx` (17 586 bytes en el ZIP; **no** está en git/overlay):

| SKU en Kafka (`produce_messages.py`) | ¿En el docx? |
|---|---|
| `LAPTOP-DELL-XPS-15` | sí (`DELL-XPS-15`) |
| `LAPTOP-HP-SPECTRE-X360` | sí |
| `LAPTOP-MACBOOK-PRO-16` | **no** (hay `LAPTOP-MACBOOK-AIR-M2`) |
| `MOBILE-IPHONE-17-PRO-MAX` | **no** (el docx cortado en el dry-run solo lista laptops Dell/HP/Lenovo/ASUS/Air) |
| `MOBILE-SAMSUNG-S24-ULTRA` | **no** |
| `MOBILE-GOOGLE-PIXEL-8-PRO` | **no** |

El YAML del Substitute, si no encuentra el SKU, debe responder exactamente: `SKU <sku> no encontrado en el catálogo…`. La pregunta del supervisor usa `LAPTOP-MACBOOK-PRO-16` → RAG de sustitutos se rompe cuando no hay stock.

El docx **no** entra en `build_agentic_bundle.py`. Un ZIP nuevo desde un base vacío lo pierde. Hay que versionarlo en overlay o copiarlo en el builder.

#### PNG 404 (P1)

`substitute-finder-chat.png` — placeholder Carbon.

### BLOQUEADO

Indexación Knowledge, chat RAG, cita a `enterprise_documents_*`.

### Cómo debe quedar

- Una sola regla de nombre de KB: o `enterprise_documents` para todos (más simple en UI) o `enterprise_documents_tzN_pXXX` en HTML **y** en instrucciones. Hoy el hub ya sufija; la UI debe decir “el nombre exacto que ves en esta página”.
- Alinear docx con los 6 SKU del productor (y con MacBook Pro 16 si sigue en la pregunta del supervisor).
- Añadir el docx al overlay/builder.

---

## Lab 4 — Supervisor (`integration.html`)

### Qué pide el lab

`orchestrate agents list` debe mostrar los dos colaboradores; import `Store_Associate_Agent.yaml`; en UI colaboradores + Deploy; chat:

```
¿Tienes LAPTOP-MACBOOK-PRO-16 en Unicenter?
```

Esperado: consulta stock y, si 0, delega a sustitutos **sin** mencionar Kafka/MCP/nombres internos.

YAML personalizado: colaboradores ya van con sufijo. El import **falla** si se importa el supervisor antes que los otros (el lab lo dice bien).

### Qué falta o está mal

- Pregunta de prueba = SKU **ausente del catálogo** (P1, arriba). Si p099 sigue sin availability, cantidad 0 → delegación → “SKU no encontrado”.
- En Unicenter el productor **sí** pone MacBook Pro 16 con stock 40 **cuando ksql materializa**. Entonces el supervisor no debería pedir sustitutos. El lab dice “si no hay stock, delega”: el caso feliz de esta pregunta es **con** stock. Elegir un SKU/sucursal que en los 20 eventos quede en 0, **o** decir explícitamente “esperá stock > 0 de MacBook Pro 16 en Unicenter”.
- PNG `store-associate-chat.png` 404.
- Callout “colaboradores deben estar desplegados”: correcto; no se pudo probar.

### BLOQUEADO

Import, Deploy, traza de delegación.

---

## Lab 5 — Asistente cliente (`shopping.html`)

### Qué pide el lab

Import `Customer_Shopping_Assistant.yaml`; en UI vincular KB existente + tool MCP; Deploy; chat vago (laptop trabajo/fotos en Unicenter); Channels → Embedded agent → copiar snippet para Voltia.

YAML: `table_number`/`participant_number` fijos; tool MCP; **sin** `knowledge:` (se vincula en UI). Instrucción: no usar la palabra SKU de cara al cliente.

### Qué falta o está mal

- PNG `customer-shopping-chat.png` y `wxo-embedded-channel.png` 404. `wxo-agents-list.png` está en IMAGES.md y no se usa en el HTML.
- Criterios piden los cuatro agentes en `orchestrate agents list` con nombres sufijados (el source HTML sin personalizar dice nombres cortos; el hub con participante sí sufija).
- Snippet: no verificar sin instancia.

### BLOQUEADO

Import, Knowledge link, chat, snippet. Para Voltia: si no hay snippet, el Track Voltia ya tiene Opción B (asistente provisto).

---

## Bundle vs repo (para no perder archivos)

ZIP `docs/downloads/agentic-retail-workshop.zip` → `RoadShowBobStreamingIntegration/trackF/`:

| Ruta | En ZIP | En `workshop/participant-overlay` | Lo copia `build_agentic_bundle.py` |
|---|---|---|---|
| 4 YAML | sí | sí | sí |
| `personalize_agents.py` | sí | sí | sí |
| `register_shared_toolkit.sh` | sí | sí | sí |
| `workshop-config.env.example` | sí | sí | sí |
| `trackF/README.md` | sí (desde `trackF-README.md`) | sí | sí |
| `product-catalog.docx` | sí (17 586 B) | **no** | **no** |

Hub `participant.js` inyecta en la descarga: `participant-config.env`, `participant-bootstrap.sh`, `participant-info.json`. El ZIP crudo **no** los trae (igual que Track D).

Nombres de agente en `participant-info.json`: `SKU_Availability_Agent_TZ1_P099`, etc. Coherente con `personalize_agents.py`.

---

## Briefing que el otro agente debe corregir (no en esta pasada)

[`BRIEFING_AGENTE_TRACK_D_F.md`](../../../../../BRIEFING_AGENTE_TRACK_D_F.md) §7–§8 todavía dice:

- MCP rechaza `workshop_id` / usar `tz1_p042` como **workshop_id**
- `RETAIL_MCP_URL` → `https://<IP>/retail-mcp/mcp`

Reemplazar por:

- Tool: `get_sku_availability(table_number, participant_number, sku, branch)`
- `table_number` = `WORKSHOP_TABLE` de la VM (`1` en TZ1); `participant_number` = `99` no `099` (el MCP hace `int` y formatea `%03d` en el tópico)
- `RETAIL_MCP_URL=http://<IP>/retail-mcp/mcp` + `streamable_http`
- No registrar el toolkit el alumno

[`analisitrackorchestrate.md`](../../../../../analisitrackorchestrate.md) es un prompt de implementación viejo (`m01_pXXX`, ksql en el MCP). No usarlo como fuente de verdad.

---

## Modelo LLM (riesgo de import)

Los cuatro YAML traen `llm: groq/openai/gpt-oss-120b`. Si la instancia Orchestrate del workshop no tiene ese modelo, `agents import` falla. El otro agente debe confirmar el `llm` que sí existe en esa instancia y dejarlo en el overlay **antes** del evento. **BLOQUEADO** aquí.

---

## Qué no se pudo probar (Orchestrate)

Marcar hecho solo cuando exista `ORCHESTRATE_URL` + API key en `participant-config.env` (sin pegarlas al chat):

1. `python3 -m venv` + `pip install ibm-watsonx-orchestrate` + `orchestrate --version` desde `trackF/confluent_agents`.
2. `orchestrate env add/activate workshop` y `orchestrate toolkits list` → `retail_availability_mcp` / `get_sku_availability`.
3. Import en orden: SKU → Substitute → Store Associate → Customer (archivos sin sufijo; nombres listados **con** `_TZ1_P099`).
4. Deploy de cada uno; Toolset MCP; Knowledge `enterprise_documents_tz1_p099`.
5. Las cuatro preguntas de prueba **después** de que MCP p099 devuelva `found: true`.
6. Channels / snippet (anonimizar IDs).
7. Join now / campana de IBM Cloud (¿sigue existiendo ese flujo?).

---

## Prompt corto para el agente que parchee (pegar al inicio)

> Track F huecos: `docs/content/integraciones/agentic-retail-wxo/huecos/README.md`. No toques Java/RPG. Workspace del alumno = raíz del ZIP. MCP ya está en TZ1 (`http://163.66.83.162/retail-mcp/health` ok, table=1, HTTP sin 301). Tool = `table_number`+`participant_number`, no `workshop_id`, no HTTPS en el toolkit. Arreglá Overview/create para que no abran solo `confluent_agents`. Protegé `personalizeContent` para que no duplique el tópico. Alineá `product-catalog.docx` con los 6 SKU y versionalo en el builder. Actualizá BRIEFING §8 a HTTP. Capturas listadas en `docs/assets/images/labs/agentic-retail-wxo/IMAGES.md` (404 hoy). Antes de demo p099: materializar `inventory.availability.tz1_p099` (hay 20 msgs en transacciones y 0 en availability). No registres el toolkit por alumno. No imprimas API keys.

---

## Comandos de evidencia (repetibles, sin secretos)

Health:

```bash
curl -sS http://163.66.83.162/retail-mcp/health
```

Watermarks (en la VM, usuario `retail-mcp`, no imprimir el `.env`):

```
inventory.transactions.tz1_p099          messages=20
inventory.availability.tz1_p099          messages=0
inventory.availability.flink.tz1_p099    messages=0
inventory.availability.tz1_p001          messages=1
```

Hub imágenes chat/snippet (local :8000): `sku-availability-chat.png`, `substitute-finder-chat.png`, `store-associate-chat.png`, `customer-shopping-chat.png`, `wxo-embedded-channel.png`, `wxo-agents-list.png` → **404**. IBM Cloud UI PNGs → **200**.
