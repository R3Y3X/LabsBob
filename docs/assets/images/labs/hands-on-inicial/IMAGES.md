# Imágenes — Primeros Pasos (modos + MCP)

Carpeta: `docs/assets/images/labs/hands-on-inicial/`

Estilo común: captura **recortada** de IBM Bob IDE, tema oscuro Carbon. Encuadre del panel de Bob o del diálogo relevante — no el IDE entero a 4K. Relación ~16:9 o 3:2. Paleta: fondo `#161616` / `#262626`, acento IBM Blue `#0f62fe`, mascota Bob (robot azul con casco blanco). Sin mockup genérico, texto borroso ni watermark.

Preferible: **captura real** de IBM Bob. Si usas IA, genera a 1920×1080, recorta el panel útil, exporta PNG y sustituye el archivo con el nombre exacto.

**No** sustituyas ningún `.code-block` copiable por una imagen.

Los banners hero (`banner_bob.png`, `lab1_bob.png`, `lab2_bob.png`, `lab4_bob.png`, `lab5_bob.png`) no se regeneran en este lote.

## No generar — capturas oficiales IBM

Estas cinco ya son producto real. Déjalas:

- `ibm-custom-mode-settings.png`
- `ibm-add-mode.png`
- `ibm-custom-mode-filled.png`
- `ibm-custom-modes-yaml.png`
- `ibm-product-manager-mode.png`

## Ya no es imagen

`Codigo_Tavily.png` se sustituyó por el bloque JSON copiable del Lab 4 (MCP).

---

## Lab 1 — Ask Mode

### `lab1-activate-ask.png`

Screenshot of IBM Bob IDE dark theme. Close crop of the mode selector dropdown at the bottom of the IBM Bob chat panel. The list shows Ask, Plan, Agent. Ask Mode is selected with a blue highlight. Small IBM Bob robot avatar visible. No full VS Code window, no taskbar, no extra panels. Photorealistic product UI, IBM Carbon, 16:9.

### `lab1-architecture-analysis.png`

IBM Bob chat panel, dark Carbon theme. Ask Mode badge visible. Bob’s reply explains an e-commerce MVC architecture in Spanish: Model, View, Controller, with a small mermaid-style flow between User, Product, authController and productController. Left: faint file tree of lab-1-ask-mode. Cropped to the chat, not the whole IDE. Photorealistic, readable Spanish UI chrome (Enviar, Ask Mode).

### `lab1-analisis-profundo.png`

IBM Bob Ask Mode analyzing `authController.js` in a dark IDE. Chat shows Spanish findings: missing input validation, weak error handling, security issues. Code editor peek of JavaScript auth controller on the left, chat on the right. Cropped 16:9, IBM Carbon, Bob robot small in the header.

### `lab1-documentation.png`

IBM Bob Ask Mode after generating README.md. Center: markdown preview with headings Descripción, Arquitectura, Instalación, API, and a mermaid authentication flowchart. Dark theme, IBM Plex, cropped to editor + Bob panel, 16:9.

### `lab1-diagramaaltonivel.png`

Clean mermaid sequence diagram on a dark `#161616` canvas, IBM Plex Mono labels in Spanish, IBM blue arrows. High-level login flow client → server → JWT. No IDE chrome, no Bob mascot, no 3D. Flat technical diagram, 16:9.

### `lab1-diagramaresumen.png`

Same style as `lab1-diagramaaltonivel.png`. Condensed summary of the login flow. Flat technical diagram, 16:9.

### `lab1-diagramadetallado.png`

Same style as `lab1-diagramaaltonivel.png`. Detailed JWT login steps including validation and token return. Flat technical diagram, 16:9.

---

## Lab 2 — Plan y Agent

### `lab2-plan-mode.png`

Close crop of IBM Bob mode selector, dark theme. Plan Mode selected in blue. Other rows: Ask, Agent. Bob chat empty/idle. Photorealistic Carbon UI, 16:9.

### `lab2-plan-output.png`

IBM Bob Plan Mode reply in Spanish: shopping cart design with data model, endpoints, mermaid data-flow, security notes. Banner or hint that no files were created. Dark chat panel crop, 16:9.

### `lab2-agent-mode.png`

IBM Bob Agent Mode selected. Chat shows file diffs for `src/models/Cart.js` and `src/controllers/cartController.js` with an Approve/Reject bar (IBM blue). Dark IDE crop, 16:9.

### `lab2-ask-mode.png`

IBM Bob Ask Mode after the cart was built. Spanish explanation of `calculateTotal()` and `addToCart` validations. Read-only, no diffs. Dark chat crop, 16:9.

---

## Lab 4 — MCP

### `MCP_Ajustes.png`

IBM Bob Settings, tab “MCP Servers” selected. Dark Carbon. Empty or Tavily row not yet connected. Close crop of the settings page, 16:9.

### `Tavily_Activado.png`

Same MCP Servers tab with Tavily enabled, green/active status, tools listed. Dark Carbon, 16:9.

### `lab5-tavily-signup.png`

tavily.com signup page, browser chrome only, light product UI. Not IBM Bob. 16:9, realistic web UI.

### `lab5-tavily-apikey.png`

Tavily dashboard showing an API key field with a copy button, key partially masked. Not IBM Bob. 16:9, realistic web UI.
