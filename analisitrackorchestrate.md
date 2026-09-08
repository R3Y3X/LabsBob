Trabajá en el repo https://github.com/R3Y3X/LabsBob (IBM Workshop Hub).
Cloná `origin/main` limpio. NO vas a tener los archivos sucios de la otra laptop: hay que implementar de nuevo la versión real y llevarla a producción.
Objetivo: que el Track F (watsonx Orchestrate + MCP retail) en producción deje de usar el MCP viejo de ksqlDB/HTTPS, y pase a la versión real (Kafka por participante + HTTP :80), coherente de punta a punta: MCP en la VM, toolkit de Orchestrate, YAML de agentes, bundle que descarga el hub, y textos del lab. Después rama + PR a main.
No toques la rama `fix/java-lab-prereqs` ni los labs Java. Eso es otro trabajo ya pusheado.
---
## 1. Qué hay HOY en producción (main / GitHub Pages)
El HUB está bien. Eso se queda:
- Modal “Configura tu track”: Mesa 1–3 + número 1–100 → descarga `agentic-retail-workshop.zip` personalizado.
- Labs Track F: Introducción, Disponibilidad MCP, Interfaz WxO, Sustitutos RAG, Supervisor, Asistente cliente.
- Un toolkit compartido por instancia Orchestrate (`retail_availability_mcp`). El facilitador lo registra una vez. El participante NO registra el MCP; solo importa YAML con Bob.
- Cuatro agentes: SKU_Availability, Substitute_Finder, Store_Associate, Customer_Shopping_Assistant.
- SKUs: laptops Dell/Mac/HP y mobiles iPhone/Samsung/Pixel. Sucursales: Dot Shopping y Unicenter.
- El aislamiento por mesa/asiento YA existe en Confluent (tópicos `inventory.availability.mXX_pXXX` y tablas ksql `INVENTORY_AVAILABILITY_Mxx_Pxxx`). El hub ya genera `WORKSHOP_ID=m01_p001`, etc.
Lo que está MAL / viejo en producción es el CONTRATO del MCP y lo que el bundle le dice a Orchestrate:
- `infra/retail-mcp/server.py` consulta ksqlDB.
- Tool: `get_sku_availability(workshop_id, sku, branch)`.
- `participant.js` escribe `RETAIL_MCP_URL=https://<IP>/retail-mcp/mcp`.
- Overview del Track F dice HTTPS + tabla ksql + `workshop_id`.
- Los YAML del zip llaman la tool solo con sku/sucursal; no pasan mesa ni asiento.
- `personalize_agents.py` solo sufija nombres de agente con `WORKSHOP_ID` e inyecta un marker de `workshop_id`.
Eso es lo que hay que reemplazar. El resto del track (prompts de Bob, labs, modal, BobCoins) se conserva.
---
## 2. Qué hay SOLO en local de Pedro (no está en GitHub)
Una implementación casi completa de la versión real, SIN commit y SIN rama. Si no te pasan un patch, reconstruila vos. La idea ya está definida:
Por qué se cambió:
- watsonx Orchestrate en IBM Cloud rechaza el certificado self-signed de la VM → el toolkit TIENE que pegarle por HTTP :80, no HTTPS.
- Cada participante tiene su propio tópico Kafka `inventory.availability.m{mesa}_p{participante}`. El MCP debe leer ESE tópico, no una query ksql con `workshop_id`.
- La tool debe recibir `table_number` y `participant_number` en CADA llamada (vienen fijos en el YAML personalizado, el alumno no los tipea).
Archivos que existían en esa laptop (mapa de trabajo):
Infra MCP:
- Reescribir `infra/retail-mcp/server.py` → consumer Kafka JSON/Schema Registry (`confluent-kafka`), no ksql.
- `requirements.txt`: `fastmcp>=2.12,<5`, `confluent-kafka>=2.6,<3`, requests, python-dotenv.
- `.env.example` con Kafka SASL + Schema Registry + `WORKSHOP_TABLE` (no passwords reales).
- `install.sh`, `deploy_vm.sh`, `deploy_all.sh` (3 mesas), `patch_nginx.py`.
- `nginx-retail-mcp.conf` incluido en server blocks :80 y :443. Si el :80 tiene `return 301` a HTTPS a nivel server, hay que moverlo a `location /` para que `/retail-mcp/` se quede en HTTP.
- `nginx-retail-mcp-http.conf` por si la VM no escucha :80.
Agentes:
- Carpeta nueva `workshop/orchestrate/` con los 4 YAML + `product-catalog.docx` + scripts (`personalize_agents.py`, `generate_reference.py`, `register_shared_toolkit.sh`, `register_all.sh`).
- YAML template usa placeholders `{T}` y `{P}`. `personalize_agents.py` los reemplaza con mesa y asiento, y sufija nombres de agente / knowledge base.
- El builder `scripts/build_agentic_bundle.py` mete esos YAML + docx + README Track F en el zip.
- Regenerar `docs/downloads/agentic-retail-workshop.zip`.
Hub:
- `docs/js/participant.js`: `RETAIL_MCP_URL=http://<IP>/retail-mcp/mcp` (no https).
- Overview + create del Track F: HTTP + tópico Kafka del participante, no HTTPS/ksql/`workshop_id`.
- `.gitignore`: `mesa-*-retail-mcp.env`, `mesa-hosts.env`, keys, `workshop/orchestrate/personalized/`. Permitir `!.env.example`.
No copiar `premium-mode-toggle-plan.md`. El toggle premium ya está en producción.
---
## 3. Cómo DEBE quedar la versión real (esto es lo que va a producción)
Arquitectura:
VM mesa N (MCP localhost:8000, nginx /retail-mcp/ en HTTP :80) consume inventory.availability.m0N_pXXX (Kafka + Schema Registry de esa VM) ↑ toolkit retail_availability_mcp (una vez por instancia Orchestrate de esa mesa) ↑ YAML del alumno SKU_Availability_Agent_M0N_Pxxx en cada tool call: table_number=N, participant_number=xxx

Contrato de la tool (obligatorio):
get_sku_availability( table_number: str, # "1"|"2"|"3", debe coincidir con WORKSHOP_TABLE de la VM participant_number: str, # "1"–"100" sku: str, branch: str # canónico: "Dot Shopping" | "Unicenter" (aceptar alias Dot/DOT/el Dot/uni) ) -> { found, available_quantity?, error? }

Tópico: `inventory.availability.m{table:02d}_p{participant:03d}`.
El MCP rechaza si `table_number` no es la mesa de esa VM.
Health: `GET http://<vm>/retail-mcp/health`.
YAML SKU (idea, no copies ksql):
- Instrucciones en español.
- Bloque fijo: “Tu mesa es SIEMPRE {T} y tu participante es SIEMPRE {P}. En CADA llamada pasá table_number y participant_number. No se lo preguntes al usuario.”
- tools: `retail_availability_mcp:get_sku_availability`
- Sucursal canónica “Dot Shopping” (no “DOT Shopping” si el tópico trae “Dot Shopping”).
- Los otros 3 agentes siguen el mismo aislamiento donde usen la tool; Substitute Finder sigue siendo RAG sobre `product-catalog.docx` (knowledge `enterprise_documents` personalizado).
Bundle que genera el hub:
- `participant-config.env` con `WORKSHOP_TABLE`, `PARTICIPANT_NUMBER`, `WORKSHOP_ID`, `RETAIL_MCP_URL=http://<IP>/retail-mcp/mcp`.
- YAML ya personalizados o script de personalize que inyecte {T}/{P} al importar.
- El facilitador registra el toolkit con URL HTTP streamable_http.
UX del lab: no volver a terminal-first. Sigue IBM Bob en Agent Mode (prompts). Solo cambia la verdad técnica del MCP.
Deploy (cuando haya IPs/PEM; no inventes credenciales):
- Una VM por mesa, `WORKSHOP_TABLE=1|2|3`.
- Credenciales Kafka SASL + Schema Registry de ESA vm en `/etc/retail-mcp/retail-mcp.env` (nunca al git).
- Nginx: `/retail-mcp/` vivo en HTTP aunque el resto del sitio redirija a HTTPS.
---
## 4. Qué hacer vos
1. Branch nueva desde `main`, tipo `fix/retail-mcp-kafka-http`.
2. Implementá el mapa de la sección 2 hasta que main+branch queden coherentes (MCP, nginx, overlay, orchestrate YAMLs, builder, zip, participant.js, docs Track F, gitignore).
3. No commitees secretos, `.pem`, ni env con passwords.
4. Push + PR a `main`.
5. En el PR: qué cambió el contrato de la tool, por qué HTTP, y checklist de prueba.
Checklist antes de merge:
- [ ] `git show origin/main:infra/retail-mcp/server.py` ya no es la fuente; el PR no habla de ksql en la tool.
- [ ] Zip interno `trackF/confluent_agents/SKU_Availability_Agent.yaml` menciona `table_number` / `participant_number`.
- [ ] `participant.js` genera `RETAIL_MCP_URL=http://…`
- [ ] Overview Track F dice HTTP + tópico Kafka, no HTTPS + ksql + workshop_id.
- [ ] Docs, zip y MCP dicen lo mismo (no mix ksql/Kafka).
- [ ] Hub: el modal de mesa/número sigue igual.
- [ ] Java / `fix/java-lab-prereqs` no entra en este PR.
Probar (si hay VM): `curl -sS http://<IP>/retail-mcp/health` y una llamada de stock de `LAPTOP-DELL-XPS-15` en Dot Shopping para un `p001` que tenga datos en el tópico.
---
## 5. Entrega
Empezá implementando. Al final: URL del PR, resumen de 5 líneas, y qué queda pendiente de las VMs (IPs, registrar toolkit) porque eso no se mergea en el HTML.