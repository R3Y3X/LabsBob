# Imágenes — De agentes aislados a una fuerza de trabajo inteligente (watsonx Orchestrate)

Carpeta: `docs/assets/images/labs/agentic-retail-wxo/`

Estilo común: captura **real y recortada** de la interfaz de IBM watsonx Orchestrate. Encuadre del panel de chat del agente o del diálogo relevante — no el navegador entero a 4K, sin barra de pestañas ni marcadores. Relación ~16:9 o 3:2. Exportar PNG y sustituir el archivo con el nombre exacto de esta lista.

**Preferible: captura real.** Estas imágenes existen para que el participante compare contra lo que ve en su propia instancia. Una UI generada por IA que no coincida con la real es peor que el placeholder.

Mientras el PNG no exista, el sitio muestra automáticamente un `carbon-image-placeholder` con la ruta visible ([app.js](../../../../js/app.js) → `carbon-image-placeholder`). No se rompe nada; la página simplemente indica qué captura falta.

**No** sustituyas ningún `.code-block` copiable por una imagen.

## Antes de capturar — anonimiza

Cada captura sale de una instancia real. Antes de exportar:

- Recorta o difumina el **nombre de la instancia**, el correo del usuario y el avatar de la esquina superior derecha.
- Nunca captures la pantalla de API keys ni una terminal con `ORCHESTRATE_API_KEY` visible.
- El banner `banner_bob.png` ya existe y no se regenera.

---

## Paso 5 — Disponibilidad MCP

### `sku-availability-chat.png`

Chat de prueba del agente `SKU_Availability_Agent` en watsonx Orchestrate. Se ve la pregunta del usuario "¿Cuánto stock hay de LAPTOP-DELL-XPS-15 en DOT Shopping?" y la respuesta del agente con una **cantidad concreta** y el nombre de la sucursal **DOT Shopping**. Si la UI permite expandir el detalle de la ejecución, incluye visible la llamada a la tool `get_sku_availability`. Recorte al panel de chat.

---

## Paso 8 — Sustitutos RAG

### `substitute-finder-chat.png`

Chat de prueba del agente `Substitute_Finder_Agent`. Pregunta: "LAPTOP-DELL-XPS-15 no está disponible. Sugiere una laptop similar usando el catálogo de productos." La respuesta lista **una o más laptops alternativas** justificadas con atributos del catálogo (procesador, memoria, pantalla, rango de precio). Si la UI muestra la cita a la fuente `enterprise_documents`, que quede visible — es lo que prueba que el RAG funcionó.

---

## Paso 11 — Supervisor

### `store-associate-chat.png`

Chat de prueba del agente `Store_Associate_Agent`. Pregunta: "¿Tienes LAPTOP-MACBOOK-PRO-16 en Unicenter?" La respuesta debe mostrar el caso interesante: **sin stock → alternativas del catálogo**, resuelto en un solo turno. Lo ideal es capturar también el rastro de delegación a los dos agentes colaboradores si la UI lo expone. La respuesta visible no debe mencionar Kafka ni MCP.

---

## Paso 14 — Asistente cliente

### `customer-shopping-chat.png`

Chat de prueba del agente `Customer_Shopping_Assistant`. Pregunta: "Busco una laptop para trabajo y edición de fotos en Unicenter. ¿Qué me recomiendas con stock?" La respuesta combina **recomendación desde el catálogo** y **confirmación de disponibilidad en Unicenter**, con tono de cara al cliente. Recorte al panel de chat.

---

## Paso 15 — Canal embebido

### `wxo-embedded-channel.png`

Pantalla **Channels → Embedded agent → pestaña Live** del `Customer_Shopping_Assistant`. Se ve la sección "Embed on your website" con el bloque de snippet HTML/JS y su botón de copiar. **Difumina el ID de instancia y cualquier token dentro del snippet** antes de exportar.

---

## Paso 16 — Estado final

### `wxo-agents-list.png`

Vista **Agents** de watsonx Orchestrate con los cuatro agentes del laboratorio visibles en la lista — `SKU_Availability_Agent`, `Substitute_Finder_Agent`, `Store_Associate_Agent`, `Customer_Shopping_Assistant` — todos con estado desplegado. Recorta la lista; oculta el resto de agentes de la instancia si hubiera otros de laboratorios distintos.
