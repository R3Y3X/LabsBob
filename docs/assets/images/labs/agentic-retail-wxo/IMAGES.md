# Imágenes — De agentes aislados a una fuerza de trabajo inteligente (watsonx Orchestrate)

Carpeta: `docs/assets/images/labs/agentic-retail-wxo/`

Todas las capturas del track están tomadas de una instancia real y **anotadas con un recuadro rojo** sobre el elemento que el participante tiene que encontrar. La anotación se genera con [`scripts/annotate_wxo_screenshots.py`](../../../../../scripts/annotate_wxo_screenshots.py): color `#EA4025`, grosor 5 px, coordenadas en fracciones del ancho/alto.

Para rehacer una captura: reemplaza el origen en `~/Documents`, ajusta su caja en el diccionario `IMAGES` del script y vuelve a correrlo.

**Preferible: captura real.** Estas imágenes existen para que el participante compare contra lo que ve en su propia instancia. Una UI generada por IA que no coincida con la real es peor que el placeholder.

Mientras un PNG no exista, el sitio muestra automáticamente un `carbon-image-placeholder` con la ruta visible ([app.js](../../../../js/app.js) → `replaceMissingImage`). No se rompe nada; la página simplemente indica qué captura falta.

**No** sustituyas ningún `.code-block` copiable por una imagen.

## Antes de capturar

- La **Clave de API nunca puede quedar legible**. La ficha de Credenciales de IBM Cloud ya la enmascara con puntos: captura esa vista, no la de "Mostrar credenciales".
- Nunca captures una terminal con `ORCHESTRATE_API_KEY` visible.
- El nombre de cuenta (`itz-saas-*`) y el de instancia (`wxo-…`) sí pueden verse: son instancias TechZone desechables y ayudan a que el participante reconozca su propia pantalla.
- El banner `banner_bob.png` ya existe y no se regenera.

---

## Lab 1 — Disponibilidad MCP (credenciales de la CLI)

### `wxo-ibmcloud-account.png`

Barra superior de IBM Cloud. **Recuadro** sobre el selector de cuenta, que debe mostrar una cuenta `itz-saas-*` y no la corporativa.

### `wxo-resource-instance.png`

**Lista de recursos**, grupo *IA / Aprendizaje automático*. **Recuadro** sobre la fila cuyo producto es **watsonx Orchestrate** (nombre `wxo-…`).

### `wxo-manage-credentials.png`

Página **Manage** de la instancia. **Recuadro** sobre la tarjeta **Credenciales** completa: *Clave de API* (enmascarada) y *URL*, con sus botones de copiar. De ahí salen `ORCHESTRATE_API_KEY` y `ORCHESTRATE_URL`.

---

## Lab 2 — Interfaz watsonx Orchestrate

### `launch_wxo.png`

Página **Manage** en IBM Cloud con **recuadro** sobre el botón **Iniciar watsonx Orchestrate**.

### `wxo_ui.png`

Menú lateral de la plataforma con **recuadro** sobre **Crear** (en instancias en inglés, **Build**).

### `seleccionar_agente.png`

Lista de agentes con **recuadro** sobre la tarjeta del `SKU_Availability_Agent`.

### `wxo-tools-tab.png`

Agent Builder del `SKU_Availability_Agent` en modo **Build**, pestaña **Tools**. **Recuadro** sobre la tarjeta `retail_availability_mcp: get_sku_availability`, donde se lee `Type MCP`. Es la única verificación del paso.

### `sku-availability-chat.png`

Mismo Agent Builder, panel **Draft Preview** de la derecha. **Recuadro** sobre la conversación: la pregunta "¿Cuánto stock hay de LAPTOP-DELL-XPS-15 en DOT Shopping?" y la respuesta con la **cantidad concreta** y el nombre de la sucursal. Demuestra que se prueba sin desplegar.

---

## Lab 3 — Sustitutos RAG

Las tres primeras son las pantallas consecutivas del asistente **Choose knowledge source**.

### `wxo-knowledge-select-source.png`

Paso *Select knowledge source*. **Recuadro** sobre la tarjeta **Upload files**, marcada `Selected`.

### `wxo-knowledge-upload-file.png`

Paso *Add knowledge*. **Recuadro** sobre `product-catalog.docx` ya listado bajo la zona de arrastre.

### `wxo-knowledge-details.png`

Paso *Knowledge details*. **Recuadro** sobre los campos **Name** y **Description**, ambos rellenos. La descripción visible debe ser la misma que el bloque copiable del lab.

### `substitute-finder-chat.png`

Panel **Draft Preview** del `Substitute_Finder_Agent`. **Recuadro** sobre el bloque **Productos sustitutos**, con alternativas justificadas por atributos del catálogo (procesador, memoria, pantalla).

---

## Lab 4 — Supervisor

### `store-associate-chat.png`

Panel **Draft Preview** del `Store_Associate_Agent`. **Recuadro** sobre la pregunta "¿Tienes LAPTOP-MACBOOK-PRO-16 en Unicenter?" y su respuesta con la cantidad en la sucursal. La respuesta visible no menciona Kafka ni MCP.

---

## Lab 5 — Asistente cliente

### `customer-shopping-chat.png`

Panel **Draft Preview** del asistente de compra: tabla de laptops recomendadas desde el catálogo. **Recuadro** sobre la línea que informa del stock real en **Unicenter** — es la prueba de que consultó el inventario antes de responder.

---

## Capturas sin uso

`desplegar_agente.png` y `deploy_resumen.png` quedaron sin referenciar cuando el track dejó de pedir **Deploy** (la UI nueva exige *Create version* y el chat **Draft Preview** ya permite probar el borrador). Se conservan por si vuelven a hacer falta.
