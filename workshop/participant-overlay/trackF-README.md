# Track F — Agentes retail con watsonx Orchestrate

El Track F usa un MCP remoto compartido que expone la tool `get_sku_availability`.
El MCP lee el tópico Kafka del participante (`inventory.availability.tzN_pXXX`)
en la VM del workshop; no instales ni ejecutes un servidor MCP local.

El toolkit se registra por **HTTP** (`http://<IP>/retail-mcp/mcp`, transporte
`streamable_http`). watsonx Orchestrate rechaza el certificado de la VM.

## Participante

**No escribes comandos.** Abre la carpeta raíz `RoadShowBobStreamingIntegration`
en IBM Bob (File → Open Folder), pon a Bob en **Agent Mode** y pégale los prompts
del lab en orden, todos en la misma conversación. Usa la misma TechZone y número
que en el Track D.

### 1. Preparar la CLI

Desde `trackF/confluent_agents`, crea `.venv`, activa, actualiza pip e instala
`ibm-watsonx-orchestrate`.

### 2. Preparar la configuración

Ejecuta `./participant-bootstrap.sh` desde la raíz (o `check` si ya corriste el
Track D). Eso personaliza los YAML con `table_number` y `participant_number`.
Completa solo `ORCHESTRATE_URL` y `ORCHESTRATE_API_KEY` en
`participant-config.env`. Kafka y ksqlDB ya se resolvieron en el Track D.
`RETAIL_MCP_URL` debe ser `http://<IP>/retail-mcp/mcp`.

### 3. Activar el ambiente y verificar el toolkit

```
source participant-config.env
orchestrate env add --name workshop --url "$ORCHESTRATE_URL"
orchestrate env activate workshop --api-key "$ORCHESTRATE_API_KEY"
orchestrate toolkits list
```

Debe aparecer `retail_availability_mcp` con `get_sku_availability`. Si no
aparece, detente y avisá al facilitador: **no** ejecutes `orchestrate toolkits add`.

### 4. Importar los agentes, uno por fase

El bootstrap ya sufijó los nombres (`SKU_Availability_Agent_TZ1_P001`, etc.).
Importá en este orden: disponibilidad → sustitutos → supervisor → asistente.

## Facilitador

Completa `participant-config.env` / `workshop-config.env` con la URL **HTTP**
del MCP y ejecuta una sola vez por instancia Orchestrate:

```bash
./register_shared_toolkit.sh
```

El script registra `retail_availability_mcp` con transporte `streamable_http`
y la tool `get_sku_availability`.
