# Plan — Mejorar claridad paso a paso del Lab 1 (y patrón para todos los labs)

## Problema raíz: qué confunde al usuario

El usuario dice: *"le pegué el primer prompt, después no me queda claro si decir adelante, pegarle el siguiente prompt, etc."*

El Lab 1 actual tiene **dos objetos mezclados** en el Paso 2 (Fase 1):
1. El prompt completo de Fase 1 (con las reglas de trabajo embebidas)
2. La instrucción implícita de que después del análisis hay que decir **"adelante"**

Y el Paso 3 (Fase 2) tiene el prompt completo ya listo — pero el usuario no sabe que tiene que:
a) Esperar la respuesta de Fase 1
b) Decir **"adelante"** (en el chat)
c) Luego pegar el prompt de Fase 2 en el chat

Esta secuencia de 3 micro-acciones no está señalizada visualmente como una secuencia.

### Lo que hace mejor el sitio de referencia (Workshop Hub)

El sitio de referencia (`workshop-hub.2akfv5yaq586.us-south.codeengine.appdomain.cloud`) usa **Bob's Java Modernization workflow** — el usuario solo hace clic en "Start the lab" y el IDE guía el flujo con un panel de workflow. Sus labs son inherentemente más lineales porque Bob dirige, no el usuario.

Nosotros usamos **Agent Mode + prompts manuales**, lo cual es más flexible y educativo (el usuario ve cada cambio), pero requiere que el portal sea más explícito sobre la secuencia de acciones del usuario. El sitio de referencia no tiene este problema porque el workflow lo resuelve en el IDE.

La solución no es copiar el modelo del sitio de referencia — es hacer nuestro modelo de Agent Mode más legible añadiendo señales visuales claras de "haz esto ahora".

---

## Qué añadir: patrón de señales de acción del usuario

### El patrón de 3 momentos en cada fase:

```
┌─────────────────────────────────┐
│  [Fase N] Título                │
│  Objetivo: qué busca esta fase  │
│                                 │
│  ① PEGA ESTO en el chat ──────▶ │  ← callout "Acción" con fondo azul
│    [bloque de código / prompt]  │
│                                 │
│  ② ESPERA la respuesta de Bob   │  ← callout "Esperar" (gris)
│    Qué esperar ver              │
│                                 │
│  ③ LUEGO di "adelante" ────────▶│  ← callout "Siguiente" (verde)
│    o pega el prompt de Fase N+1 │
└─────────────────────────────────┘
```

Este patrón ya existe parcialmente — el texto lo describe — pero no está diferenciado visualmente. El usuario lee el bloque de código del prompt y luego salta al siguiente bloque de código del siguiente prompt sin ver que hay una acción de espera y transición entre ellos.

---

## Sub-Tarea 1 — Añadir señales de acción en Lab 1 (patrón piloto)

**Intent:** Hacer explícita la secuencia de 3 micro-acciones por fase con callouts diferenciados. Esto es un cambio de presentación puro — el contenido y los prompts no cambian.

**Expected Outcomes:**
- Antes de cada prompt hay un callout tipo "Tu acción — pega esto en el chat"
- Después del prompt de Fase 1 hay un callout claro: "Espera la respuesta → luego di **'adelante'** para pasar a Fase 2"
- Antes del prompt de Fase 2 hay una nota: "Solo pega esto **después** de decir 'adelante'"
- Al final de Fase 2 hay: "Cuando Bob confirme el Cambio 6, pega el prompt de Fase 3"
- El flujo completo se puede leer de arriba a abajo sin necesidad de interpretar los prompts para saber qué hacer

**Todo List:**

1. En `lab1-replatforming.html`, en la sección FASE 1 (línea ~83):
   - Añadir un `<div class="callout" data-tone="note">` encima del code-block del prompt que diga:
     `"Tu acción — pega todo el bloque de abajo en el chat de Bob (Agent Mode). Incluye las reglas y el prompt de Fase 1."`
   - Después de la `<figure>` de análisis, añadir callout `data-tone="tip"`:
     `"Bob termina su análisis. Léelo. Cuando estés listo para los cambios, escribe **adelante** en el chat — eso activa Fase 2."`

2. En la sección FASE 2 (línea ~134):
   - Al inicio, añadir un callout `data-tone="note"` antes del code-block:
     `"Tu acción — **después de decir 'adelante'**, pega el prompt de Fase 2 en el chat. No lo pegues al mismo tiempo que 'adelante'."`
   - Cambiar el texto introductorio actual para que sea más directo:
     De: "Di **"adelante"** en el chat de Agent Mode y luego pega **solo** el prompt de Fase 2 (mensaje aparte)."
     A: un `<ol>` con 3 pasos numerados: (1) Di "adelante", (2) espera que Bob confirme que está listo para Fase 2, (3) pega el prompt.

3. En la sección FASE 3 (línea ~235):
   - Antes del code-block añadir callout `data-tone="note"`:
     `"Tu acción — cuando Bob confirme que aplicó el Cambio 6, pega este prompt. No esperes que Bob lo pida."`

**Archivos afectados:** `docs/content/premium/java-modernization-v2/lab1-replatforming.html`

**Relevant Context:**
- Sección FASE 1: líneas 83–132
- Sección FASE 2: líneas 134–232
- Sección FASE 3: líneas 235–262
- Clases de callout disponibles: `data-tone="note"` (azul), `data-tone="tip"` (verde), `data-tone="warning"` (amarillo)

**Status:** [ ] pending

---

## Sub-Tarea 2 — Extraer las reglas de trabajo del prompt de Fase 1 a un callout separado

**Intent:** El prompt de Fase 1 actual mezcla dos cosas: (a) las reglas de comportamiento de Bob (protocolo, fases, restricciones) y (b) el análisis de Fase 1 propiamente dicho. El usuario copia todo sin entender qué es qué. Separar las reglas en un callout visible encima del prompt hace que el usuario sepa lo que está estableciendo antes de copiar-pegar.

**Expected Outcomes:**
- Un callout `data-tone="note"` encima del code-block de Fase 1 titulado "Qué hacen estas reglas" con una lista de 4 puntos en prosa corta (no el código técnico):
  1. Bob no toca archivos hasta que digas "adelante"
  2. En Fase 2, Bob muestra un cambio a la vez y pregunta "¿Aplico el Cambio N?" — tú dices "ok"
  3. Bob nunca encadena cambios ni salta a la siguiente fase sin tu permiso
  4. En Fase 3, Bob ejecuta mvn y muestra el output completo
- El code-block del prompt sigue igual (completo, para copiar) — solo se añade la explicación previa
- El usuario entiende el contrato antes de pegarlo, no después de leer el bloque de código

**Todo List:**
1. En `lab1-replatforming.html` línea ~93, antes del `<div class="code-block">` del prompt de Fase 1:
   - Añadir el callout explicativo de las 4 reglas en prosa

**Archivos afectados:** `docs/content/premium/java-modernization-v2/lab1-replatforming.html`

**Status:** [ ] pending

---

## Sub-Tarea 3 — Aplicar el mismo patrón a Labs 2, 3, 4, Alt-4 y 5

**Intent:** Una vez que Lab 1 sirva como piloto validado, aplicar el mismo patrón de señales de acción a los demás labs. Los labs más complejos (Lab 3 con 6 fases, Lab 4 con 3 lotes) se benefician más.

**Expected Outcomes:**
- Todos los labs tienen callouts de "Tu acción" antes de cada prompt principal
- Las transiciones entre fases tienen un callout de "Cuándo continuar"
- El usuario nunca tiene que leer dentro de un bloque de código para saber cuándo pasar a la siguiente sección

**Todo List:**
1. Validar con el usuario que el patrón de Lab 1 (Sub-Tarea 1 + 2) resuelve el problema antes de aplicar a otros labs
2. Aplicar el mismo patrón a `lab2-java-upgrade.html` (3 fases, 8 cambios)
3. Aplicar a `lab3-ui-modernization.html` (6 fases — especialmente la transición Fase 2 backend → Fase 3 frontend que es la más confusa)
4. Aplicar a `lab4-unit-tests.html` (4 fases, 3 lotes — señalizar claramente el momento de cada lote)
5. Aplicar a `lab-alt4-tdd.html` (5 ejercicios — señalizar el ciclo Red→Green→Refactor)
6. Aplicar a `lab5-security.html` (4 fases — señalizar la diferencia entre escaneo vs. remediación vs. re-escaneo)

**Archivos afectados:** Los 5 HTMLs de lab (no overview)

**Status:** [ ] pending — esperar validación de Lab 1 primero

---

## Diseño de los callouts nuevos

### Callout "Tu acción — pega esto ahora"
```html
<div class="callout" data-tone="note" style="margin-bottom:var(--cds-spacing-04,0.75rem)">
  <p class="callout__title">Tu acción — pega esto en el chat</p>
  <p>Copia el bloque completo de abajo y pégalo en el chat de Bob (Agent Mode). Incluye todas las líneas — las reglas y el prompt de análisis van juntos en un mismo mensaje.</p>
</div>
```

### Callout "Espera y luego continúa"
```html
<div class="callout" data-tone="tip" style="margin-top:var(--cds-spacing-05,1rem)">
  <p class="callout__title">Espera la respuesta de Bob → luego di "adelante"</p>
  <p>Bob presenta su análisis completo. Léelo — es el mapa de lo que va a cambiar. Cuando estés listo, escribe <strong>adelante</strong> en el chat (un mensaje solo con esa palabra). Eso activa la Fase 2.</p>
</div>
```

### Callout "Tu acción — cuando Bob termine"
```html
<div class="callout" data-tone="note" style="margin-bottom:var(--cds-spacing-04,0.75rem)">
  <p class="callout__title">Tu acción — cuando Bob confirme el último cambio</p>
  <p>Cuando Bob confirme que aplicó el Cambio 6 y escriba "Listo para Fase 3" (o similar), pega el prompt de abajo. No esperes que Bob lo solicite.</p>
</div>
```

---

## Cambios exactos para Sub-Tarea 1 en Lab 1

### En FASE 1 (línea ~93) — antes del code-block del prompt

**Añadir encima del `<div class="code-block">`:**
```html
<div class="callout" data-tone="note" style="margin-bottom:var(--cds-spacing-04,0.75rem)">
  <p class="callout__title">Tu acción — pega todo esto en el chat de Bob</p>
  <p>Copia el bloque completo y pégalo en el chat en <strong>Agent Mode</strong>. El bloque incluye las reglas de trabajo (cómo debe comportarse Bob durante todo el lab) y el análisis de Fase 1. Van en un solo mensaje.</p>
</div>
```

**Añadir después de la `<figure>` de análisis (~línea 131):**
```html
<div class="callout" data-tone="tip" style="margin-top:var(--cds-spacing-05,1rem)">
  <p class="callout__title">Bob terminó el análisis → di "adelante" para continuar</p>
  <p>Lee el inventario de findings que te presentó Bob. Cuando estés listo, escribe <strong>adelante</strong> en el chat (un mensaje solo con esa palabra). Eso le indica a Bob que puede pasar a proponer los cambios de Fase 2.</p>
</div>
```

### En FASE 2 (línea ~142) — reemplazar el párrafo introductorio

**De (actual):**
```html
<p class="cds--body-01">Di <strong>"adelante"</strong> en el chat de <strong>Agent Mode</strong> y luego pega <strong>solo</strong> el prompt de Fase 2 (mensaje aparte). Bob debe presentar <strong>un cambio con diff</strong> y parar hasta tu <strong>"ok"</strong>:</p>
```

**A:**
```html
<p class="cds--body-01">Una vez dicho "adelante", pega el prompt de Fase 2 como <strong>mensaje separado</strong>. El flujo de aprobación es:</p>
<ol class="cds--list--ordered" style="margin:var(--cds-spacing-04,0.75rem) 0">
  <li class="cds--list__item">Bob propone el <strong>Cambio 1</strong> con un diff completo y pregunta "¿Aplico el Cambio 1?"</li>
  <li class="cds--list__item">Tú respondes <strong>ok</strong> (o das instrucciones distintas)</li>
  <li class="cds--list__item">Bob aplica el cambio y propone el <strong>Cambio 2</strong> — repite hasta el Cambio 6</li>
</ol>
```

**Añadir después del code-block del prompt de Fase 2 (~línea 185):**
```html
<div class="callout" data-tone="tip" style="margin-top:var(--cds-spacing-05,1rem)">
  <p class="callout__title">Cuando Bob confirme el Cambio 6 → pega el prompt de Fase 3</p>
  <p>Tras tu "ok" en el último cambio, Bob confirma y se detiene. Ese es el momento de pegar el prompt de Fase 3 de abajo — no esperes que Bob lo pida ni que ejecute mvn por su cuenta.</p>
</div>
```

### En FASE 3 (línea ~244) — antes del code-block

**Añadir encima del `<div class="code-block">`:**
```html
<div class="callout" data-tone="note" style="margin-bottom:var(--cds-spacing-04,0.75rem)">
  <p class="callout__title">Tu acción — pega esto cuando termines el Cambio 6</p>
  <p>Pega el prompt de abajo en el chat. Bob ejecutará <code>mvn clean compile</code> y te mostrará el output completo. Si falla, te muestra el error antes de proponer ningún fix.</p>
</div>
```

---

## Resumen de cambios por subtarea

| Sub-Tarea | Archivos | Tipo de cambio | Impacto |
|---|---|---|---|
| 1 | `lab1-replatforming.html` | +5 callouts de acción/transición | Alto — resuelve el problema inmediato |
| 2 | `lab1-replatforming.html` | +1 callout explicativo de reglas | Medio — reduce confusión sobre el prompt |
| 3 | 5 labs restantes | Mismo patrón replicado | Alto — consistencia de experiencia |

**Nota:** Sub-Tarea 3 depende de validación de Sub-Tareas 1+2 con el usuario.
