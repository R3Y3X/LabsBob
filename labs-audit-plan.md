# Plan: Auditoría completa de labs — UI/UX, consistencia y accesibilidad

## Resumen

Revisión sistemática de todos los labs del Workshop Hub aplicando criterios de
Carbon Design System, Web Interface Guidelines y UX best practices. Los hallazgos
están organizados por severidad: críticos primero, luego por tipo de impacto.

---

## Subtarea A — [CRÍTICO] YouTube overlay z-index oculto detrás del header

**Intent:** El overlay de YouTube (`#yt-overlay`) tiene `z-index: 10`, que queda
completamente por debajo del header (`z-index: 9100`) y la subnav (`z-index: 8000`).
El overlay nunca es visible cuando se abre.

**Expected Outcomes:**
- El overlay de YouTube aparece sobre todo el contenido, incluyendo header y subnav.

**Todo List:**
1. En `docs/css/components.css`, buscar `.yt-overlay` (línea ~1875) y cambiar `z-index: 10` → `z-index: 9200`.

**Relevant Context:**
- `docs/css/components.css` línea ~1875: `.yt-overlay { position: fixed; z-index: 10; }`
- Header: z-index 9100. Subnav: z-index 8000.

**Status:** [ ] pending

---

## Subtarea B — Ocultar scrollbar en subnav horizontal

**Intent:** La subnav de pasos usa `overflow-x: auto` pero no oculta la scrollbar.
En Chrome/Safari/Firefox aparece una barra de scroll que empuja el contenido hacia abajo.

**Expected Outcomes:**
- La subnav horizontal es scrollable en mobile pero sin scrollbar visible.

**Todo List:**
1. En `docs/css/carbon-overrides.css`, dentro del bloque de `.hub-subnav .cds--tabs__nav`
   (línea ~709), agregar:
   ```css
   scrollbar-width: none;          /* Firefox */
   -ms-overflow-style: none;       /* IE/Edge */
   ```
2. Agregar también:
   ```css
   .hub-subnav .cds--tabs__nav::-webkit-scrollbar { display: none; }
   ```

**Relevant Context:**
- `docs/css/carbon-overrides.css` línea ~709: `.hub-subnav .cds--tabs__nav { overflow-x: auto; overflow-y: hidden; }`

**Status:** [ ] pending

---

## Subtarea C — Corrección de "Inicio" → "Introducción" en contenido de labs Voltia

**Intent:** En `deploy.html` y `build.html` del lab Voltia hay referencias al texto
"Inicio / storefront" que deberían decir "Introducción / storefront" para ser consistentes
con el renombre del subnav hecho en la Subtarea 1 anterior.

**Expected Outcomes:**
- No quedan referencias al texto "Inicio" como nombre de pestaña en ningún lab.

**Todo List:**
1. Buscar en `docs/content/integraciones/agentic-retail-voltia/deploy.html` el texto `"Inicio"` y reemplazar por `"Introducción"` en el contexto de pestaña/mockup label.
2. Hacer lo mismo en `docs/content/integraciones/agentic-retail-voltia/build.html`.

**Relevant Context:**
- Ambos archivos, línea ~206.

**Status:** [ ] pending

---

## Subtarea D — Inconsistencia de numeración en labs (Lab 3 vs Lab 4)

**Intent:** Hay inconsistencias de numeración entre el título del lab y sus IDs internos:
- `lab4-modo-personalizado.html` tiene el título "Lab 3 — Modo personalizado" (correcto en el flujo, ya que en el subnav aparece como `lab3`) pero los IDs internos usan `lab3-*` inconsistentemente.
- `lab3-mcp-tavily.html` tiene título "Lab 4 — MCP" pero IDs internos `lab3-*`.

**Expected Outcomes:**
- Los títulos visibles de cada lab son consistentes con su posición en el subnav.
- Los IDs internos son coherentes con el slug que usa el lab.

**Todo List:**
1. En `docs/content/basic/hands-on-inicial/lab4-modo-personalizado.html`:
   - El título visible dice "Lab 3 — Modo personalizado" → es correcto (es el 3er lab del track). No cambiar el `h1`.
   - Verificar que los IDs internos (`lab3-obj`, `lab3-que`, etc.) tengan sus `aria-labelledby` correspondientes en los `section` elements (líneas 36, 49, 62, 209 reportadas como faltantes).
2. En `docs/content/basic/entendiendo-bob/lab3-mcp-tavily.html`:
   - El título dice "Lab 4 — MCP" pero es el 4º lab del track `hands-on-inicial`. Verificar que el h1 sea "Lab 4 — MCP" y los IDs internos sean coherentes (actualmente usan `lab3-*` porque el archivo se llama `lab3-`).
   - Si los IDs ya están bien enlazados via `aria-labelledby`, dejarlos como están. Solo hay que asegurarse de que no haya secciones sin `aria-labelledby`.

**Relevant Context:**
- `docs/content/basic/hands-on-inicial/lab4-modo-personalizado.html` líneas 36, 49, 62, 209.
- `docs/content/basic/entendiendo-bob/lab3-mcp-tavily.html` línea 9.

**Status:** [ ] pending

---

## Subtarea E — Agregar aria-labelledby faltantes en labs de integraciones y SDLC

**Intent:** Múltiples `<section class="lab-section">` en los labs de integraciones y SDLC
no tienen `aria-labelledby`, lo que rompe la semántica para lectores de pantalla y
viola WCAG 2.2 AA (criterio 1.3.1 Info and Relationships).

**Expected Outcomes:**
- Todas las secciones `lab-section` tienen `aria-labelledby` apuntando al `id` de su `h2`.

**Todo List:**
Agregar `aria-labelledby` a cada `lab-section` que tenga un `h2` con `id` pero el `section`
no tenga el atributo. Archivos y líneas aproximadas:

1. `docs/content/basic/software-development-lifecycle/lab5-animations.html` línea ~150
2. `docs/content/basic/software-development-lifecycle/lab6-review.html` línea ~140
3. `docs/content/basic/software-development-lifecycle/lab7-docs.html` línea ~213
4. `docs/content/integraciones/agentic-retail-confluent/overview.html` líneas ~36, ~53
5. `docs/content/integraciones/agentic-retail-confluent/topics.html` línea ~12
6. `docs/content/integraciones/agentic-retail-confluent/ksqldb.html` línea ~12
7. `docs/content/integraciones/agentic-retail-confluent/publish.html` líneas ~12, ~25, ~45
8. `docs/content/integraciones/agentic-retail-wxo/overview.html` línea ~36
9. `docs/content/integraciones/agentic-retail-wxo/create.html` línea ~12
10. `docs/content/integraciones/agentic-retail-wxo/rag.html` línea ~12
11. `docs/content/integraciones/agentic-retail-wxo/integration.html` línea ~12
12. `docs/content/integraciones/agentic-retail-wxo/shopping.html` línea ~12
13. `docs/content/integraciones/agentic-retail-voltia/overview.html` línea ~36
14. `docs/content/integraciones/agentic-retail-voltia/embed.html` línea ~12
15. `docs/content/integraciones/agentic-retail-voltia/polish.html` línea ~12
16. `docs/content/basic/hands-on-inicial/lab4-modo-personalizado.html` líneas ~36, ~49, ~62, ~209
17. `docs/content/basic/entendiendo-bob/overview.html` línea ~37
18. `docs/content/basic/software-development-lifecycle/overview.html` línea ~38

**Approach:** Leer cada archivo, identificar el `id` del `h2` de cada sección afectada,
y agregar `aria-labelledby="<ese-id>"` al `<section>` padre.

**Relevant Context:**
- Patrón existente correcto: `<section class="lab-section" aria-labelledby="lab1-obj">`

**Status:** [ ] pending

---

## Subtarea F — Transición faltante en botón de workshop-step-card

**Intent:** El `workshop-step-card__btn` no tiene `transition` en su estado base,
por lo que el cambio de color en hover (`background: #0043ce`) ocurre instantáneamente
sin animación, sintiéndose brusco.

**Expected Outcomes:**
- El color de fondo del botón en las step-cards transiciona suavemente en hover.

**Todo List:**
1. En `docs/css/carbon-overrides.css`, en el selector `.workshop-step-card__btn`
   (línea ~1492), agregar `transition: background-color 0.2s ease, color 0.2s ease`.

**Relevant Context:**
- `docs/css/carbon-overrides.css` línea ~1492.

**Status:** [ ] pending

---

## Subtarea G — Duración de transición inconsistente en hub-lab-card

**Intent:** La transición de `background` en `.hub-lab-card` usa `0.15s` mientras que
`transform` y `box-shadow` usan `0.25s`, creando una animación de hover que se siente
desincronizada (el fondo cambia antes que la sombra y el movimiento).

**Expected Outcomes:**
- Todas las propiedades animadas en `.hub-lab-card:hover` tienen la misma duración (`0.25s`).

**Todo List:**
1. En `docs/css/main.css`, en la regla `transition` de `.hub-lab-card` (línea ~468),
   cambiar `background 0.15s` → `background 0.25s cubic-bezier(0.4, 0, 0.2, 1)`.

**Relevant Context:**
- `docs/css/main.css` línea ~468.

**Status:** [ ] pending

---

## Notas de implementación

- Ejecutar subtareas **en orden A → G**.
- La subtarea A (z-index del overlay) es la más crítica — bloquea una funcionalidad visible.
- La subtarea E (aria-labelledby) es la más extensa — requiere leer y editar ~18 archivos.
- No hay build step: cambios son visibles al recargar el browser.
- Las subtareas B, F, G son cambios de 1-3 líneas cada una.
