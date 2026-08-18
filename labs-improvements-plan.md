# Plan: Mejoras generales a todos los labs del Workshop Hub

## Resumen

Correcciones de UX, contenido e interacción que afectan a **todos los labs** del sitio.
Los cambios van de lo más transversal (CSS, JS, datos) a lo más específico (contenido de lab1).
Cada subtarea es independiente y enfocada para facilitar revisión.

---

## Subtarea 1 — Renombrar el tab "Inicio" del subnav de cada lab a "Introducción"

**Intent:** En el subnav de cada lab hay un tab llamado "Inicio" (el slug `overview`) que colisiona
visualmente con el link "Inicio" de la navbar global. Renombrarlo a "Introducción" elimina la ambigüedad.
Solo se cambia en la **subnavegación del lab** (los subnav tabs), **no** en la navbar principal.

**Expected Outcomes:**
- El tab de overview en todos los labs dice "Introducción" en lugar de "Inicio".
- La navbar global sigue diciendo "Inicio".
- No hay cambio en URLs ni en slugs.

**Todo List:**
1. En `docs/js/data.js`, cambiar `label: 'Inicio'` → `label: 'Introducción'` en el array `steps` de **todos** los labs (9 labs × 1 overview cada uno).
   Afecta líneas: 33, 49, 63, 92, 106, 120, 148, 166.

**Relevant Context:**
- `docs/js/data.js` → propiedad `steps[0].label` en cada lab.
- El subnav se renderiza en `docs/js/app.js` → `renderSubnav()` línea 1057, que usa directamente `link.label`.

**Status:** [x] done

---

## Subtarea 2 — Aviso de variabilidad de resultados en las tarjetas de lab

**Intent:** Los participantes pueden esperar que sus resultados de IA coincidan exactamente con las capturas.
Agregar un aviso sutil ("Los resultados de IA pueden variar") en las tarjetas de labs en la página principal
setea expectativas correctas.

**Expected Outcomes:**
- Cada card de lab en la home muestra un texto tipo `⚠ Los resultados de IA pueden variar` o una línea breve bajo la descripción.
- El estilo es sutil (texto secundario, tamaño pequeño), no invasivo.
- Aplica a **todos** los labs de todas las secciones.

**Todo List:**
1. En `docs/js/app.js` → función `buildLabCard()` (línea 397), agregar un elemento `<p>` con clase nueva
   `.hub-lab-card__disclaimer` dentro de `.hub-lab-card__body`, después de `.hub-lab-card__description`.
2. En `docs/css/main.css` agregar estilos para `.hub-lab-card__disclaimer`:
   - `font-size: 0.75rem`, `color: var(--cds-text-helper, #6f6f6f)`, icono ⚠ via content o inline.

**Relevant Context:**
- `docs/js/app.js` línea 440 (zona de descripción en buildLabCard).
- `docs/css/main.css` línea ~540 (zona de estilos de lab card).

**Status:** [x] done

---

## Subtarea 3 — Corregir el enlace de descarga del ZIP en el Lab 1 (Ask Mode)

**Intent:** El Lab 1 menciona `LabHandsOnBob.zip` en un callout pero **no muestra el botón de descarga**.
El ZIP sí está disponible y el botón de descarga ya existe en `overview.html`. El callout del lab debe
referenciar correctamente al overview y no crear confusión sobre dónde descargar.
La instrucción `cd <carpeta>` seguida de `ls -la` también es problemática en cualquier lab: si el usuario ya abrió
la carpeta en el IDE, ejecutar `cd <nombre-carpeta>` falla porque ya está dentro. Este patrón debe corregirse
**en todos los labs que lo tengan**, no solo el Lab 1.
Adicionalmente, los bloques `code-block--tree` muestran la etiqueta genérica `'estructura'` en lugar del nombre real de la carpeta.

**Expected Outcomes:**
- Los callouts de tipo "Workspace" o "Preparación" en **todos los labs** explican claramente que:
  (a) el ZIP se descarga desde la pestaña "Introducción" y (b) si ya se abrió la carpeta en el IDE,
  **no es necesario ejecutar `cd <carpeta>`**.
- Los bloques de terminal que combinan `cd <carpeta>` + `ls -la` se corrigen para que el `cd` esté
  marcado como opcional o se reemplace por un comentario explicativo.
- Los `code-block--tree` muestran el nombre real de la carpeta como etiqueta (vía `--code-label`).

**Todo List:**
1. En `docs/content/basic/hands-on-inicial/lab1-ask-mode.html`:
   - Línea 98: reescribir el callout "Workspace" para aclarar que el ZIP está en la pestaña Introducción
     y que abrir la carpeta en el IDE equivale a hacer `File → Open Folder`.
   - Líneas 100–105: marcar el `cd lab-1-ask-mode` como opcional (solo si no abriste desde el IDE),
     añadir comentario explicativo.
   - Línea 107: cambiar el label del `code-block--tree` a `'lab-1-ask-mode'` via `style="--code-label: 'lab-1-ask-mode'"`.
2. Revisar **todos los demás labs** (`lab2-modos.html`, `lab4-modo-personalizado.html`, `lab3-mcp-tavily.html`,
   labs de `entendiendo-bob/`, `software-development-lifecycle/`, `premium/`) buscando el mismo patrón
   `cd <carpeta> && ls` o `cd <carpeta>` seguido de `ls -la` en el primer paso, y aplicar la misma corrección.
3. En todos los `code-block--tree` que muestren `'estructura'` como label, reemplazar por el nombre real de la carpeta.

**Relevant Context:**
- `docs/content/basic/hands-on-inicial/lab1-ask-mode.html` líneas 96–120.
- El patrón de label custom via CSS custom property `--code-label` está en `docs/css/components.css` línea ~510 (`.code-block::before { content: var(--code-label, 'terminal'); }`).
- Otros labs a revisar: todos los archivos en `docs/content/` que tengan un "Paso 1" con instrucciones de directorio.

**Status:** [x] done

---

## Subtarea 4 — Corregir doble cursor pointer en elementos interactivos

**Intent:** En algunos elementos se apila el cursor pointer por dos rutas (elemento padre ya es `<a>`/`<button>`
que tiene `cursor: pointer` nativo del browser + regla CSS explícita adicional), causando visualmente
un "doble puntero" (cambio de cursor en zonas donde no debería cambiar). El fix es revisar qué elementos
tienen `cursor: pointer` explícito y eliminar los casos redundantes.

**Expected Outcomes:**
- No hay elementos que muestren el cursor como pointer cuando no son clickeables.
- Los elementos interactivos reales (`<a>`, `<button>`, cards clickeables) siguen teniendo cursor pointer.

**Todo List:**
1. Revisar en `docs/css/main.css` y `docs/css/components.css` todos los selectores con `cursor: pointer`.
2. Casos identificados a evaluar:
   - `.hub-lab-card { cursor: pointer }` — la card es un `<a>`, el browser ya aplica pointer: **eliminar**.
   - `.hub-resource-card { cursor: pointer }` — es `<a>` o `<button>`, **eliminar**.
   - `.hub-audience-btn { cursor: pointer }` — es `<button>`, **eliminar**.
   - `.copy-button { cursor: pointer }` — es `<button>`, **eliminar**.
   - `.os-setup-card__body details summary { cursor: pointer }` — `<summary>` no tiene pointer nativo: **mantener**.
   - `.lab-troubleshooting-full > summary { cursor: pointer }` — `<summary>`, **mantener**.

**Relevant Context:**
- `docs/css/main.css` líneas 461, 319.
- `docs/css/components.css` líneas 567, 1092, 1195, 1305.

**Status:** [x] done

---

## Subtarea 5 — Alinear correctamente las secciones de info en todos los labs

**Intent:** Las cajas de info mode (`.lab-mode-card`) muestran el contenido de texto desalineado respecto
al ícono (imagen de la derecha propuesta en las capturas). El ícono (círculo `ⓘ`) y el body del texto deben
estar alineados al top. La lista dentro del card tiene `margin-left` que la desalinea con el párrafo de arriba.

**Expected Outcomes:**
- El ícono y el body del `.lab-mode-card` están alineados en la parte superior (`align-items: flex-start`).
- El texto y la lista dentro del body tienen la misma sangría (cero extra padding izquierdo en la lista).
- Aplica a todos los labs que usen `.lab-mode-card`.

**Todo List:**
1. En `docs/css/main.css` o `docs/css/components.css`, buscar estilos de `.lab-mode-card`.
2. Asegurar que `.lab-mode-card` tenga `align-items: flex-start` (no `center`).
3. Remover o ajustar cualquier `margin-left` o `padding-left` extra en la lista interna que cause desalineación.
4. Verificar que el estilo aplique también en labs de otras secciones (entendiendo-bob, SDLC, premium).

**Relevant Context:**
- `docs/css/components.css` (buscar `.lab-mode-card`).
- HTML en `docs/content/basic/hands-on-inicial/lab1-ask-mode.html` líneas 58–73 como referencia.

**Status:** [x] done

---

## Subtarea 6 — Ask Mode: aclarar que sí puede escribir si el usuario lo autoriza (modo a Agent)

**Intent:** El Lab 1 dice "No modifica ningún archivo" y el paso 5 dice "Ask Mode no escribe archivos hasta que lo apruebes". Esto es incompleto: Ask Mode puede pedir al usuario permiso para cambiar a Agent Mode y entonces sí escribe. Hay que agregar una nota explicando este flujo: si Bob necesita escribir un archivo, te pedirá permiso para cambiar a Agent Mode; si aceptas, lo hace en Agent Mode.

**Expected Outcomes:**
- En la descripción de Ask Mode (`.lab-mode-card` del Lab 1), se agrega una bullet o nota aclarando:
  "Si necesita escribir, Bob te pedirá permiso para cambiar a Agent Mode".
- En el Paso 5 del ejercicio, el callout o texto existente actualiza su descripción para incluir este matiz.

**Todo List:**
1. En `docs/content/basic/hands-on-inicial/lab1-ask-mode.html`:
   - Línea 69: ajustar el bullet "Las lecturas se aprueban automáticamente — solo escrituras requieren confirmación"
     para añadir que Bob **pedirá cambiar a Agent Mode** si necesita escribir.
   - Línea 194: en el Paso 5, la frase "Ask Mode no escribe archivos hasta que lo apruebes" debe ampliarse
     con la aclaración del flujo de cambio a Agent Mode.

**Relevant Context:**
- `docs/content/basic/hands-on-inicial/lab1-ask-mode.html` líneas 64–71, 194.

**Status:** [x] done

---

## Subtarea 7 — Actualizar estimación de BobCoins del Lab 1 (Ask Mode) a 1–2 BobCoins

**Intent:** El Lab 1 actualmente muestra `2–4 BobCoins` en el banner del lab y en la card de la home.
Según el feedback, el lab realmente usa aproximadamente **1 BobCoin**, con un pequeño margen.
Hay que actualizar el rango en `data.js` (que alimenta la card) y en el banner de `lab1-ask-mode.html`.

**Expected Outcomes:**
- La card del lab 1 en la home muestra `1–2 BobCoins`.
- El banner metric del Lab 1 muestra `1–2` en el valor de BobCoins.
- El total acumulado del overview de `hands-on-inicial` se actualiza: card de la home se recalcula sola vía `getWorkshopStats()`; el metric manual del banner del overview se actualiza a mano.

**Todo List:**
1. En `docs/js/data.js` línea 34: cambiar `bobcoinCost: { min: 2, max: 4 }` → `bobcoinCost: { min: 1, max: 2 }`.
2. En `docs/content/basic/hands-on-inicial/lab1-ask-mode.html` línea 27: cambiar el metric value de `2–4` → `1–2`.
3. En `docs/content/basic/hands-on-inicial/overview.html` línea 29: el metric `11–23` se calcula a mano en el HTML; con el cambio de lab1 (min: 2→1, max: 4→2), el nuevo rango es `10–21` → actualizar ese valor.

**Relevant Context:**
- `docs/js/data.js` línea 34.
- `docs/content/basic/hands-on-inicial/lab1-ask-mode.html` línea 27.
- `docs/content/basic/hands-on-inicial/overview.html` línea 29 (metric manual del banner).
- `docs/js/app.js` línea 335 → `getWorkshopStats()` suma automáticamente los costos de los steps: la card de la home se actualiza sola.

**Status:** [x] done

---

## Notas de implementación

- Ejecutar las subtareas **en orden** (1 → 7).
- Después de cada subtarea, verificar visualmente en el browser antes de avanzar.
- Las subtareas 2, 4 y 5 son las más transversales (afectan todos los labs); las demás son más focalizadas.
- No hay build step: el sitio es HTML/CSS/JS estático, los cambios son visibles al recargar.
