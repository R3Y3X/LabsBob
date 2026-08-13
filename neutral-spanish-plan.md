# Plan: Neutralización de español argentino a español neutro

## Top-Level Overview

The site currently contains Argentine Spanish throughout several lab HTML files. The main issue is **voseo** — the Argentine 2nd person singular conjugation (e.g., `hacé`, `abrí`, `podés`, `tenés`, `conseguí`) instead of the neutral Spanish forms (`haz`, `abre`, `puedes`, `tienes`, `consigue`). There are also Argentine-style sentences and expressions that need to be updated.

**Scope:** 10 HTML files across three lab sections. No JS, CSS, or structural changes — text content only.  
**Non-goals:** Technical terms, English words (e.g. `starter`, `snippet`, `deploy`, `bundle`, `workshop`, `mockup`, `prompt`, `tokens`, `badge`, `toast`, `checkout`, `request`) stay as-is. Code inside `<code>` and `<pre>` blocks are NOT changed (they are prompts sent to Bob or shell commands and must remain intact). Only visible prose and instructions are changed.

**Important distinction:** Some Argentine voseo verbs appear **inside `<pre><code>` blocks** as part of prompts that users copy-paste into Bob. Those prompts ARE part of the lab content visible to users and SHOULD also be converted to neutral Spanish, since they are instructional text — just formatted as code blocks.

---

## Sub-Tasks

---

### Sub-Task 1 — SDLC Labs (software-development-lifecycle): lab2 through lab7

**Intent:** Fix all Argentine voseo and expressions in the 6 SDLC lab files.

**Expected Outcomes:** No Argentine verb forms remain in `docs/content/basic/software-development-lifecycle/lab2-storefront.html` through `lab7-docs.html`.

**Todo List:**
1. Edit `lab2-storefront.html`:
   - `Implementá` → `Implementa`
   - `Mostrá` → `Muestra`
   - `Envolvé` → `Envuelve`
   - `Usá` → `Usa`
   - `Escribí` → `Escribe`
   - `Traé` → `Trae`
   - `"Usá imageUrl()` → `"Usa imageUrl()`
2. Edit `lab3-product.html`:
   - `Implementá` → `Implementa`
   - `Traé` → `Trae`
   - `Mostrá` → `Muestra`
   - `Usá` → `Usa`
   - `Escribí` → `Escribe`
   - `Asegurate` → `Asegúrate`
3. Edit `lab4-cart.html`:
   - `Implementá` → `Implementa`
   - `Ítems` → `Elementos` (or `Artículos`) — **Note:** "Ítems" is used as a UI section label here; keep as `Artículos` for neutral Spanish
   - `mostrá` → `muestra`
   - `Usá` → `Usa`
   - `Importá` → `Importa`
   - `Escribí` → `Escribe`
   - `Hacé` → `Haz`
   - `deshabilitá` → `deshabilita`
   - `mostrá` → `muestra`
   - `volvé` → `vuelve`
4. Edit `lab5-animations.html`:
   - `envolvé` → `envuelve`
   - `Hacé` → `Haz` (all occurrences)
   - `hacé` → `haz` (all occurrences)
   - `Agregá` → `Agrega`
   - `agregá` → `agrega`
   - `Usá` → `Usa`
5. Edit `lab6-review.html`:
   - `Recorré` → `Recorre`
   - `acabás de producir` → `acabas de producir`
   - `aplicá` → `aplica`
   - `Hacé` → `Haz`
   - `contame` → `dime`
   - `Asegurate` → `Asegúrate`
   - `Hacé` → `Haz`
6. Edit `lab7-docs.html`:
   - `Usá` → `Usa` (all occurrences)
   - `Escribí` → `Escribe` (all occurrences)
   - `Creá` → `Crea`
   - `Copiá` → `Copia`
   - `agregá` → `agrega`
   - `asegurate` → `asegúrate`
   - `referenciá` → `referencia`

**Relevant Context:** `docs/content/basic/software-development-lifecycle/lab2-storefront.html` through `lab7-docs.html`

**Status:** [ ] pending

---

### Sub-Task 2 — Integraciones: agentic-retail-voltia (overview + deploy)

**Intent:** Fix all Argentine voseo and expressions in the Voltia lab files — the most heavily affected files.

**Expected Outcomes:** No Argentine verb forms remain in `overview.html` or `deploy.html` for the Voltia lab.

**Todo List:**
1. Edit `overview.html`:
   - `Conseguí el código base` (heading) → `Obtén el código base`
   - `No empezás de cero, partís de` → `No empiezas de cero, partes de`
   - `Descargá` → `Descarga`
   - `¿No tenés el snippet del Lab 2?` → `¿No tienes el snippet del Lab 2?`
   - `podés hacer` → `puedes hacer`
2. Edit `deploy.html` (most affected file — ~30+ instances):
   - `Qué hacés` → `Qué haces`
   - `verificá` → `verifica` (×2)
   - `si tenés el` → `si tienes el`
   - `vas a poder embeber` → `vas a poder embeber` *(already neutral — keep)*
   - `¿No tenés el snippet` → `¿No tienes el snippet`
   - `podés hacer el lab completo` → `puedes hacer el lab completo` (×2)
   - `elegís: usar` → `eliges: usar`
   - `Conseguí el starter` (heading) → `Obtén el starter`
   - `Descargá` → `Descarga` (×2)
   - `descomprimilo` → `descomprímelo`
   - `entrá en` → `entra en`
   - `abrí la carpeta` → `abre la carpeta` (×2)
   - `descomprimí` → `descomprime`
   - `Conseguí el starter y abrilo en Bob` (heading) → `Obtén el starter y ábrelo en Bob`
   - `Corré el starter` (heading) → `Corre el starter` / `Ejecuta el starter`
   - `Mirá los mockups` (heading) → `Mira los mockups`
   - `adjuntá el mockup` → `adjunta el mockup` (×multiple)
   - `adjuntá esa imagen` → `adjunta esa imagen`
   - `hacé clic en el botón` → `haz clic en el botón`
   - `navegá hasta la carpeta` → `navega hasta la carpeta`
   - `elegí home.png` → `elige home.png`
   - `abrís la imagen dentro de Bob` → `abres la imagen dentro de Bob` (×2)
   - `tocás el botón` → `tocas el botón`
   - `tocá cualquier producto` → `toca cualquier producto`
   - `cambiala` → `cámbiala`
   - `mirá cómo` → `mira cómo`
   - `Implementá` → `Implementa` (in code blocks / prompts)
   - `Mostrá` → `Muestra` (in code blocks / prompts)
   - `Envolvé` → `Envuelve` (in code blocks / prompts)
   - `Usá` → `Usa` (in code blocks / prompts)
   - `Corré y verificá` (heading) → `Ejecuta y verifica`
   - `abrí http://localhost` → `abre http://localhost`
   - `Adjuntá mockups/product.png` → `Adjunta mockups/product.png`
   - `Adjuntá mockups/cart.png` → `Adjunta mockups/cart.png`
   - `Tenés dos opciones — elegí una` → `Tienes dos opciones — elige una`
   - `En la raíz del proyecto abrí` → `En la raíz del proyecto abre`

**Relevant Context:** `docs/content/integraciones/agentic-retail-voltia/overview.html`, `docs/content/integraciones/agentic-retail-voltia/deploy.html`

**Status:** [ ] pending

---

### Sub-Task 3 — Integraciones: agentic-retail-wxo (create + integration)

**Intent:** Fix all Argentine voseo and expressions in the watsonx Orchestrate lab files.

**Expected Outcomes:** No Argentine verb forms remain in `create.html` or `integration.html` for the wxo lab.

**Todo List:**
1. Edit `create.html`:
   - `ejecutá` → `ejecuta` (×3)
   - `Ingresá a la interfaz` → `Ingresa a la interfaz`
   - `dirigite a` → `dirígete a`
   - `Buscá` → `Busca`
   - `hacé clic en Deploy y confirmá` → `haz clic en Deploy y confirma`
   - `abrí el agente` → `abre el agente`
   - `hacé clic en Deploy` → `haz clic en Deploy`
   - `ingresá a la sección Knowledge` → `ingresa a la sección Knowledge`
   - `hacé clic en Add source` → `haz clic en Add source`
   - `Seleccioná la opción` → `Selecciona la opción` (×2)
   - `subí product-catalog.docx` → `sube product-catalog.docx`
   - `Usá el nombre` → `Usa el nombre`
   - `guardá` → `guarda`
   - `Esperá hasta que` → `Espera hasta que`
   - `Probá una recomendación` → `Prueba una recomendación`
2. Edit `integration.html`:
   - `ejecutá` → `ejecuta` (×2)
   - `abrí el agente Store_Associate_Agent` → `abre el agente Store_Associate_Agent`
   - `hacé clic en Deploy` → `haz clic en Deploy` (×2)
   - `Probá una consulta` → `Prueba una consulta`
   - `¿Tenés LAPTOP-MACBOOK-PRO-16` → `¿Tienes LAPTOP-MACBOOK-PRO-16`
   - `Abrí el agente Customer_Shopping_Assistant` → `Abre el agente Customer_Shopping_Assistant`
   - `ingresá a Knowledge` → `ingresa a Knowledge`
   - `seleccioná la fuente` → `selecciona la fuente`
   - `ingresá a Toolset` → `ingresa a Toolset`
   - `asegurate de que` → `asegúrate de que`
   - `Si no lo está, agregala` → `Si no lo está, agrégala`
   - `Volvé a la vista principal` → `Vuelve a la vista principal`
   - `ingresá a Channels` → `ingresa a Channels`
   - `Abrí la pestaña Live` → `Abre la pestaña Live`
   - `copiá el snippet` → `copia el snippet`
   - `Asegurate de haber configurado` → `Asegúrate de haber configurado`

**Relevant Context:** `docs/content/integraciones/agentic-retail-wxo/create.html`, `docs/content/integraciones/agentic-retail-wxo/integration.html`

**Status:** [ ] pending

---

### Sub-Task 4 — Premium labs: ibm-i-rpg-development and java-modernization-v2

**Intent:** Fix the few Argentine expressions found in the premium lab files.

**Expected Outcomes:** No Argentine verb forms remain in the premium lab files.

**Todo List:**
1. Edit `ibm-i-rpg-development/overview.html`, `lab1-fixed-to-free.html`, `lab2-react-carbon-ui.html`, `lab3-rla-to-sql.html`:
   - `Qué vas a construir` (headings) → `Qué vas a construir` *(already neutral "vas a" future — keep as-is)*
   - `Qué vas a aprender` → *(already neutral — keep)*
2. Edit `java-modernization-v2/overview.html`:
   - `Qué vas a aprender` → *(already neutral — keep)*
3. Edit `java-modernization-v2/lab4-unit-tests.html`:
   - `vas a añadir` → *(already neutral — keep)*

**Note:** After investigation, the premium labs contain only `vas a + infinitive` constructions which are already neutral Spanish (not voseo). **No changes needed** in the premium labs.

**Relevant Context:** `docs/content/premium/`

**Status:** [ ] pending

---

## Summary of Files to Change

| File | # of changes |
|------|-------------|
| `docs/content/basic/software-development-lifecycle/lab2-storefront.html` | ~8 |
| `docs/content/basic/software-development-lifecycle/lab3-product.html` | ~6 |
| `docs/content/basic/software-development-lifecycle/lab4-cart.html` | ~9 |
| `docs/content/basic/software-development-lifecycle/lab5-animations.html` | ~8 |
| `docs/content/basic/software-development-lifecycle/lab6-review.html` | ~6 |
| `docs/content/basic/software-development-lifecycle/lab7-docs.html` | ~8 |
| `docs/content/integraciones/agentic-retail-voltia/overview.html` | ~5 |
| `docs/content/integraciones/agentic-retail-voltia/deploy.html` | ~35 |
| `docs/content/integraciones/agentic-retail-wxo/create.html` | ~15 |
| `docs/content/integraciones/agentic-retail-wxo/integration.html` | ~16 |

**Premium labs:** No changes needed (forms are already neutral Spanish).
