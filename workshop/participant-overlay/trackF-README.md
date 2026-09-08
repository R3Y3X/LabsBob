# Track F — Agentes retail con watsonx Orchestrate

El Track F usa un MCP remoto compartido que expone la tool `get_sku_availability`.
El MCP lee el tópico Kafka del participante (`inventory.availability.tzN_pXXX`)
en la VM del Track D (la de `SSH_HOST`); no instales ni ejecutes un servidor MCP local.

`table_number` es 1–3 según la TechZone del hub (TZ1–TZ3), **no** el número de mesa.
La instancia de watsonx Orchestrate es la de tu cuenta TechZone; no tiene que
coincidir con la etiqueta de la VM.

El toolkit se registra por **HTTP** (`http://<IP>/retail-mcp/mcp`, transporte
`streamable_http`). watsonx Orchestrate rechaza el certificado de la VM.

## Participante

**No escribes comandos.** Abre la carpeta raíz `RoadShowBobStreamingIntegration`
en IBM Bob (File → Open Folder), pon a Bob en **Agent Mode** y pégale los prompts
del lab en orden, todos en la misma conversación. Usa la misma TechZone y número
que en el Track D. El `.venv` de Orchestrate se crea dentro de
`trackF/confluent_agents`; no abras solo esa subcarpeta.

### 1. Preparar la CLI

Desde `trackF/confluent_agents`, crea `.venv` con **Python 3.11, 3.12 o 3.13** (`python3 --version`;
en macOS `python3` suele ser 3.9: usa `python3.12`). Si `.venv` viene de Windows y no tiene
`bin/activate`, bórralo y recréalo. Activa, actualiza pip e instala `ibm-watsonx-orchestrate`.

### 2. Preparar la configuración

Ejecuta `./participant-bootstrap.sh check` desde la raíz. Eso personaliza los
YAML con `table_number` (1–3) y `participant_number`. Completa
`ORCHESTRATE_URL` y `ORCHESTRATE_API_KEY` en `participant-config.env` desde
IBM Cloud → cuenta `itz-saas-*` → instancia watsonx Orchestrate → **Gestionar** →
**Credenciales** (URL + clave de API). No uses la Service ID API Key del output
de TechZone. Ignora `KSQLDB_API_KEY` / `KSQLDB_API_SECRET` si están vacíos.
Kafka y ksqlDB ya se resolvieron en el Track D.

Si `RETAIL_MCP_URL` aún tiene `<IP…>` o usa `https://`:

```
IP="${SSH_HOST#root@}"
RETAIL_MCP_URL="http://${IP}/retail-mcp/mcp"
curl -sS "http://${IP}/retail-mcp/health"
```

### 3. Activar el ambiente y verificar el toolkit

```
source participant-config.env
source trackF/confluent_agents/.venv/bin/activate
orchestrate env add --name workshop --url "$ORCHESTRATE_URL" --type ibm_iam
orchestrate env activate workshop --api-key "$ORCHESTRATE_API_KEY"
orchestrate toolkits list
```

Si `env add` avisa `mcsp_v2`, ignóralo: esta URL contiene `.cloud.ibm.com` y
el ADK usa `ibm_iam`. Debe aparecer `retail_availability_mcp` con
`get_sku_availability`. Si no aparece, detente y avisa al facilitador: **no**
ejecutes `orchestrate toolkits add`.

### 4. Importar los agentes, uno por fase

El bootstrap ya sufijó los nombres (`SKU_Availability_Agent_TZ1_P001`, etc.).
Importa desde `trackF/confluent_agents` en este orden: disponibilidad →
sustitutos → supervisor → asistente.

## Facilitador

El toolkit debe apuntar al MCP de **la VM donde están los tópicos** (HTTP
`streamable_http`), no a “la VM del BP”. Completa
`participant-config.env` / `workshop-config.env` con esa URL y ejecuta una sola
vez por instancia Orchestrate:

```bash
./register_shared_toolkit.sh
```

El script registra `retail_availability_mcp` con transporte `streamable_http`
y la tool `get_sku_availability`.
