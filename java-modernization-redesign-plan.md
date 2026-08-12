# Java Modernization Lab — Redesign Plan

## Overview

**Goal:** Reducir la densidad cognitiva de los labs de java-modernization-v2 adoptando el estilo visual minimalista de los labs core de IBM Bob. El problema no es el contenido en sí sino la jerarquía: hoy un participante recibe 8 secciones de contexto/setup antes de ver el primer prompt del lab. La intervención redistribuye información entre overview y labs, colapsa lo secundario y convierte listas de texto en componentes visuales.

**Archivos afectados:**
- `docs/content/premium/java-modernization-v2/overview.html`
- `docs/content/premium/java-modernization-v2/lab1-replatforming.html`
- `docs/content/premium/java-modernization-v2/lab2-java-upgrade.html`
- `docs/content/premium/java-modernization-v2/lab3-ui-modernization.html`
- `docs/content/premium/java-modernization-v2/lab4-unit-tests.html`
- `docs/content/premium/java-modernization-v2/lab5-security.html`
- `docs/content/premium/java-modernization-v2/lab-alt4-tdd.html`
- `docs/css/components.css` (nuevas clases para OS cards y detalles colapsables)

**Principios rectores:**
1. El overview es la puerta de entrada — todo el setup y contexto general vive ahí
2. Cada lab empieza en el primer prompt — sin preámbulo extenso
3. Lo secundario (troubleshooting, OS setup) está presente pero colapsado
4. Texto en prosa → componente visual cuando el contenido lo permite

---

## Sub-Tasks

---

### Tarea 1 — Mover prerrequisitos de setup al overview

**Status:** [ ] pending

**Intent:**
Los labs 1-5 repiten individualmente ~400 líneas de instrucciones de instalación de Java/Maven para macOS, Linux y Windows. Esa información pertenece al overview (se lee una vez antes de empezar). En cada lab quedará solo un callout de referencia mínima.

**Expected Outcomes:**
- `overview.html` tiene una nueva sección "Setup del entorno" con OS cards visuales (macOS / Linux / Windows), cada una con ícono de plataforma y el bloque de comandos colapsado en un `<details>` interno
- Los labs 1-5 tienen el bloque completo de prerrequisitos eliminado y reemplazado por un `callout[data-tone="note"]` de 2-3 líneas que dice "Sigue la guía de setup del overview antes de empezar" con enlace al overview
- Los 2-3 callouts de advertencia sobre JAVA_HOME/reiniciar Bob/Apple Silicon se incorporan dentro de las OS cards correspondientes en el overview

**Todo List:**
1. En `overview.html`, añadir sección `<section class="lab-section" aria-labelledby="ov-setup">` con id `ov-setup`, después de la sección de materiales
2. Crear 3 OS cards usando la clase `.os-setup-card` (nueva, ver Tarea 7) para macOS, Linux y Windows; cada card tiene: ícono SVG de plataforma, título del OS, y un `<details>` con los code blocks de comandos
3. Incluir el gotcha de Apple Silicon dentro del `<details>` de la card macOS
4. Incluir la nota de JAVA_HOME/winget dentro del `<details>` de la card Windows
5. En `lab1-replatforming.html`, eliminar toda la sección `aria-labelledby="lab1-prereq"` y reemplazarla por un callout de referencia
6. Repetir el paso 5 para lab2, lab3, lab4, lab5 y lab-alt4

**Relevant Context:**
- Sección a eliminar: `lab1-replatforming.html` líneas ~88-182 (`aria-labelledby="lab1-prereq"`)
- Secciones equivalentes en los otros labs (buscar `aria-labelledby="labN-prereq"`)
- Nuevo CSS: clase `.os-setup-card` y `.os-setup-grid` a añadir en `components.css`

---

### Tarea 2 — Eliminar secciones redundantes de contexto en cada lab

**Status:** [ ] pending

**Intent:**
Cada lab tiene 2-3 secciones que explican conceptos generales ya cubiertos en el overview: "Vale la pena vigilar", "Agent Mode en tres fases" / "Controlar los permisos de Bob", y "Contexto del lab". Un participante que llegó al lab ya pasó por el overview — repetir esta información alarga el preámbulo sin añadir valor.

**Expected Outcomes:**
- Eliminadas de `lab1-replatforming.html`: secciones `lab1-watch`, `lab1-agent`, `lab1-contexto`
- Eliminadas de labs 2-5 y alt4: sus equivalentes de "Vale la pena vigilar", "Agent Mode", "Contexto"
- Ningún lab pierde información que no esté en el overview

**Todo List:**
1. En `lab1-replatforming.html`, localizar y eliminar las secciones `aria-labelledby="lab1-watch"`, `aria-labelledby="lab1-agent"`, y `aria-labelledby="lab1-contexto"`
2. Revisar lab2 y eliminar secciones equivalentes (buscar secciones entre el bloque de descarga y el primer prompt que sean de orientación general)
3. Repetir para lab3, lab4, lab5, lab-alt4
4. Verificar que cada lab conserva: banner → referencia a setup (de Tarea 1) → "Qué lograrás" → workspace setup box → prompts de fases → troubleshooting colapsado → criterios de éxito → conclusiones

**Relevant Context:**
- `lab1-replatforming.html` líneas ~184-252: secciones watch, agent, contexto a eliminar
- El "Contexto del lab" (callout note con "¿Qué cambia en este lab?") puede conservarse si es específico del lab — solo eliminar si repite info del overview

---

### Tarea 3 — Colapsar troubleshooting en `<details>` en todos los labs

**Status:** [ ] pending

**Intent:**
La sección "Solución de problemas" (~300 líneas, 8-12 escenarios de error) es valiosa cuando algo falla pero domina el scroll en la lectura normal. Ocultarla en un `<details>` la mantiene accesible sin interrumpir el flujo principal.

**Expected Outcomes:**
- En todos los labs, la sección `<section class="lab-section" aria-labelledby="labN-troubleshooting">` (o equivalente) está envuelta en un `<details class="lab-troubleshooting-full">` con un `<summary>` que dice "Solución de problemas — errores frecuentes"
- La sección está cerrada por defecto (`<details>` sin el atributo `open`)
- El CSS de `.lab-troubleshooting-full` es consistente con el estilo existente de `.lab-troubleshooting` (ya usado en el closure de JS)

**Todo List:**
1. En `lab1-replatforming.html`, localizar la sección de troubleshooting y la sección "Obtener ayuda durante el lab" que la sigue; envolverlas juntas en `<details class="lab-troubleshooting-full"><summary>Solución de problemas y ayuda</summary>...</details>`
2. Repetir para lab2, lab3, lab4, lab5, lab-alt4
3. Añadir estilos para `.lab-troubleshooting-full` en `components.css` — usar como referencia los estilos existentes de `.lab-troubleshooting`

**Relevant Context:**
- `lab1-replatforming.html`: sección de troubleshooting empieza aproximadamente donde están los escenarios de errores de Maven/JDK; sección de ayuda la sigue
- Patrón existente ya en uso: `buildStepClosure()` en `app.js` línea 1304 genera un `<details class="lab-troubleshooting">` más pequeño — el nuevo es el hermano mayor para la sección completa del HTML

---

### Tarea 4 — Rediseñar la sección "Caso de uso" en cada lab como componente visual

**Status:** [ ] pending

**Intent:**
La sección "Caso de uso" (en lab1: dos listas bulleted con "corre actualmente en:" / "la migrarás a:") describe el estado legacy → objetivo con texto plano. El overview ya tiene el `stack-compare` global. En cada lab esto debería ser un componente compacto tipo badge-row que muestre solo los cambios específicos de ese lab — más visual y más corto.

**Expected Outcomes:**
- Cada lab tiene un bloque compacto `.lab-delta` (nueva clase) que muestra los cambios del lab como una fila de badges: "Java 8 → Java 21" / "TWas → Liberty" / etc.
- El componente usa los colores de estado existentes del sistema (gris para "sin cambio", verde para "nuevo")
- El texto explicativo tipo "Por qué importa" se recorta a máximo 2 líneas o se elimina si ya está en el overview

**Todo List:**
1. Diseñar el marcado HTML del componente `.lab-delta` con una fila de items que usan iconos de check/arrow de Carbon
2. Añadir estilos `.lab-delta`, `.lab-delta__item`, `.lab-delta__item--changed`, `.lab-delta__item--same` en `components.css`
3. Reemplazar la sección `aria-labelledby="lab1-usecase"` en lab1 por el componente `.lab-delta` con los 3 cambios del Lab 1
4. Crear el componente equivalente para lab2, lab3, lab4, lab5 con sus cambios específicos
5. Verificar que la subsección "Por qué importa" se elimina o se reduce a 1 frase inline

**Relevant Context:**
- `lab1-replatforming.html` líneas ~63-86: sección usecase a reemplazar
- Clases de referencia visual: `.stack-compare`, `.stack-compare__item`, `.stack-compare__item--new` en `overview.html` — el `.lab-delta` debe ser un hermano compacto (1 fila horizontal, no 2 columnas)

---

### Tarea 5 — Consolidar las secciones "Qué lograrás" y workspace setup en cada lab

**Status:** [ ] pending

**Intent:**
Actualmente cada lab tiene: "Qué lograrás" (1 párrafo) + bloque de descarga (callout + code) + workspace setup (box dedicado). La descarga ya está en el overview. En los labs individuales, "Qué lograrás" y workspace setup pueden fusionarse en un bloque de orientación único y compacto al inicio: qué hace este lab + dónde abrir el snapshot. Eso deja el participante listo para el primer prompt en 3 scroll-steps.

**Expected Outcomes:**
- Cada lab tiene un único bloque de orientación inicial con: (1) párrafo de qué lograrás, (2) la ruta/snapshot a abrir presentada como el workspace setup box actual, (3) sin el callout de "Materiales necesarios" (la descarga ya está en el overview)
- El bloque de descarga/materiales desaparece de los labs individuales (ya vive en el overview)
- Tras ese bloque de orientación, el siguiente elemento visible es el primer prompt de FASE 1

**Todo List:**
1. En `lab1-replatforming.html`, eliminar la sección `aria-labelledby="lab1-downloads"` (el callout de descarga y el code block de ruta)
2. Fusionar el contenido de `aria-labelledby="lab1-intro"` con el `lab-workspace-setup__box` — el box ya existe, añadir el párrafo de "Qué lograrás" como subtítulo dentro del box o justo encima como prose mínima
3. Repetir para labs 2-5 y alt4

**Relevant Context:**
- `lab1-replatforming.html` líneas ~22-61: secciones intro y downloads a consolidar
- El `lab-workspace-setup__box` ya tiene badge + título + path + checks + nota — es el componente correcto para conservar como ancla del inicio del lab

---

### Tarea 6 — Actualizar la sección de setup del overview con OS cards

**Status:** [ ] pending

**Intent:**
Complemento de Tarea 1: una vez que los prerrequisitos viven solo en el overview, la presentación de esa sección debe ser visual y compacta. Las instrucciones por OS deben sentirse como tabs/cards, no como un muro de texto. Cada OS card tiene su ícono, sus comandos colapsados, y sus gotchas específicos.

**Expected Outcomes:**
- El overview tiene un grid de 3 OS cards (macOS / Linux / Windows) con iconos SVG de plataforma, usando la clase `.os-setup-grid` y `.os-setup-card`
- Cada card tiene un `<details>` con los code blocks de comandos colapsado por defecto
- Los gotchas específicos de cada OS (Apple Silicon, JAVA_HOME en Windows) están como callouts dentro del `<details>` correspondiente
- La sección completa de setup no excede 15-20 líneas visibles cuando todo está colapsado

**Todo List:**
1. En `components.css`, añadir `.os-setup-grid` (grid de 3 columnas, responsive) y `.os-setup-card` (card con border, padding, icono en header)
2. En `overview.html`, añadir la nueva sección `ov-setup` con el grid de 3 OS cards después de la sección de materiales
3. Mover el contenido de prereqs de lab1 a las cards correspondientes del overview
4. Asegurar que la sección queda bien colapsada por defecto y el participante solo ve las 3 cards sin necesidad de scroll

**Relevant Context:**
- `overview.html` líneas ~55-83: sección de materiales — la nueva sección de setup va después de esta
- CSS de referencia para cards: `.prereq-item`, `.prereq-item__icon`, `.prereq-item__body` ya existen — `.os-setup-card` puede extender ese patrón

---

### Tarea 7 — Añadir estilos CSS necesarios en components.css

**Status:** [ ] pending

**Intent:**
Las tareas anteriores introducen 3 nuevos componentes CSS que no existen todavía: `.os-setup-grid`/`.os-setup-card` (OS cards), `.lab-delta` (badges de cambio por lab) y `.lab-troubleshooting-full` (wrapper de troubleshooting colapsable). Todos deben ser consistentes con el sistema visual existente.

**Expected Outcomes:**
- `components.css` tiene los 3 bloques de estilos nuevos
- Los nuevos componentes son responsive (mobile-first, grid a 1 columna en móvil)
- Los colores usan las variables CSS de Carbon (`--cds-support-success`, `--cds-text-helper`, etc.) en lugar de valores hardcoded

**Todo List:**
1. Añadir `.os-setup-grid` y `.os-setup-card` — grid de 3 cols, card con border `1px solid var(--cds-border-subtle)`, header con icon + title, body con `<details>` estilado
2. Añadir `.lab-delta` y sus modificadores — fila flex, items con icon + texto, colores de estado reutilizando las variables de `.stack-compare__item--new`
3. Añadir `.lab-troubleshooting-full` — `border: 1px solid var(--cds-border-subtle)`, padding, `summary` cursor pointer con icono chevron, consistente con el `.lab-troubleshooting` de los closures JS
4. Verificar que los `<details>` de todo el redesign tienen animación de apertura consistente si ya existe una en el CSS

**Relevant Context:**
- `docs/css/components.css`: buscar secciones de `.prereq-item` (patrón de card existente), `.stack-compare__item--new` (colores verde/check), `.lab-troubleshooting` (patrón details existente) para usar como referencia directa

---

## Resultado Esperado Final

Después de todas las tareas, la secuencia de lectura de un lab queda así:

```
Banner (título, tags, BobCoins)
└── "Qué lograrás" + workspace setup (fusionado — ~5 líneas + box)
    [callout mínimo → "Setup de entorno en el overview si aún no lo hiciste"]
    [badge row con cambios específicos del lab — .lab-delta]
└── FASE 1: Análisis (prompt expandido + figure)
└── FASE 2: Cambios (prompt expandido + figures)
└── FASE 3: Validación (prompt expandido)
└── <details> Solución de problemas (colapsado)
└── Criterios de éxito
└── Conclusiones clave
[JS inyecta: Cierre de la etapa + botón siguiente]
```

Vs. la secuencia actual (~8 secciones antes del primer prompt):

```
Banner → Qué lograrás → Descarga → Caso de uso → Prerrequisitos (~400 líneas)
→ Vale la pena vigilar → Agent Mode en tres fases → Workspace setup → Contexto del lab
→ FASE 1 ...
```
