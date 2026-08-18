# Plan — Completar prerrequisitos multi-SO en Labs 4, 5 y Alt-4

## Diagnóstico exacto (estado actual)

Después de revisar los archivos reales, el estado es **mucho mejor** de lo que describía el audit-plan original.

### Lo que YA está resuelto (no tocar)
- El overview tiene las OS cards completas: macOS + Linux (SDKMAN!) + Windows (winget) ✅
- Labs 4, 5 y Alt-4 ya tienen un callout en la parte superior que dice "Sigue la guía de setup del overview" con link ✅
- Lab 4 troubleshooting: ya tiene `sdk use java 21.0.7-zulu` para macOS/Linux + nota de Windows ✅
- Lab 5 troubleshooting: ya tiene `sdk use java 21.0.7-zulu` para macOS/Linux + nota de Windows ✅

### Lo que falta (una sola cosa)
**Lab Alt-4 (`lab-alt4-tdd.html`) no tiene el bloque de troubleshooting "La terminal de Bob muestra la versión incorrecta de Java".**

Su sección `<details class="lab-troubleshooting-full">` cubre 5 escenarios de error pero ninguno es el de la versión de Java incorrecta. Es el único lab donde un usuario en Linux no tiene instrucción de recuperación cuando `java -version` no devuelve Java 21.

---

## Sub-Tarea 1 — Añadir troubleshooting de Java version a Lab Alt-4

**Intent:** Lab Alt-4 es el único lab sin el escenario de troubleshooting "La terminal de Bob muestra la versión incorrecta de Java". Labs 3, 4 y 5 ya lo tienen con el mismo patrón (`sdk use java 21.0.7-zulu` + nota Windows). Añadirlo cierra la brecha.

**Expected Outcome:**
- La sección `<details class="lab-troubleshooting-full">` de `lab-alt4-tdd.html` incluye el escenario de versión incorrecta de Java
- El bloque es idéntico en estructura y texto a los de Labs 4 y 5 (mismo patrón)

**Localización exacta:**
- Archivo: `docs/content/premium/java-modernization-v2/lab-alt4-tdd.html`
- Insertar después del bloque "Problemas de cálculo de fechas" (~línea 513), antes del cierre `</section>` de troubleshooting
- Patrón de referencia: `lab4-unit-tests.html` líneas 418–424

**Bloque a insertar:**
```html
    <h3 class="cds--productive-heading-02" style="margin-top:var(--cds-spacing-05,1rem)">La terminal de Bob muestra la versión incorrecta de Java</h3>
    <p class="cds--body-01"><code>sdk use</code> es por sesión de shell — no se aplica entre pestañas ni a la terminal que Bob abre por su cuenta. Ejecútalo en la terminal de Bob (macOS/Linux):</p>
    <div class="code-block">
      <button type="button" class="copy-button">Copiar</button>
      <pre><code>sdk use java 21.0.7-zulu</code></pre>
    </div>
    <p class="cds--body-01" style="margin-top:0.75rem">En Windows (PowerShell), asegúrate de que <code>JAVA_HOME</code> apunte a la instalación de Temurin 21 y reinicia la terminal.</p>
```

**Status:** [x] done

---

## Resumen final

| Archivo | Qué falta | Acción |
|---|---|---|
| `lab4-unit-tests.html` | Nada — prereq callout + troubleshooting completos | ✅ Sin cambios |
| `lab5-security.html` | Nada — prereq callout + troubleshooting completos | ✅ Sin cambios |
| `lab-alt4-tdd.html` | Falta bloque troubleshooting "versión incorrecta de Java" | ➕ Insertar 8 líneas |

> El plan anterior (`java-modernization-audit-plan.md` Sub-Tarea 2) describía añadir instrucciones de instalación completas a los 3 labs. Eso ya fue implementado en el overview con las OS cards + callouts de referencia. El único gap que queda es el bloque de troubleshooting de Alt-4.
