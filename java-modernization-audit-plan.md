# Java Modernization Lab — Plan de correcciones pendientes

## Resumen

Auditoría del portal de laboratorios de Java Modernization v2. Tres áreas de trabajo:

1. **Imágenes** — de 19 referencias, eliminar 12 `<figure>` innecesarios de los HTMLs y dejar solo 7 imágenes que aportan valor real.
2. **Prerrequisitos incompletos** — Labs 4, 5 y Alt-4 solo tienen instrucciones de instalación para macOS. Añadir Linux y Windows igual que Labs 1–3.
3. **Capturas pendientes** — 4 imágenes nuevas que sí hay que tomar (las que cierran cada lab visualmente).

---

## Sub-Tarea 1 — Limpiar los `<figure>` innecesarios de los HTMLs

**Intent:** Eliminar las etiquetas `<figure>/<img>` de imágenes que duplican lo que el texto ya explica o que capturan output genérico sin valor didáctico añadido. El resultado es un portal más limpio, sin imágenes rotas, y donde cada foto que queda tiene un motivo claro.

**Expected Outcomes:**
- Los 10 `<figure>` eliminados desaparecen del HTML sin dejar huecos en el flujo de lectura
- Las 3 imágenes existentes y buenas se mantienen intactas
- Los archivos PNG huérfanos pueden borrarse de `docs/assets/images/labs/java-modernization-v2/` opcionalmente

**Criterio aplicado:** una imagen vale si muestra algo que el texto no puede describir — resultado visual único (UI en browser, BUILD SUCCESS como cierre de lab) o diff que contextualiza el momento. No vale si repite contenido que ya está en el prompt, en una tabla o en un callout.

**Todo List:**

Eliminar estos `<figure>` de los HTMLs indicados:

| Archivo HTML | Imagen a eliminar | Motivo |
|---|---|---|
| `lab1-replatforming.html` | `lab1-phase2-changes.png` | Los callouts de OGNL/javassist explican el diff mejor que una captura |
| `lab3-ui-modernization.html` | `lab3-phase1-mapping.png` | El mapa es texto — ya está en el prompt como tabla |
| `lab3-ui-modernization.html` | `lab3-phase2-jaxrs.png` | Código JAX-RS genérico; el checkpoint callout lo cubre |
| `lab3-ui-modernization.html` | `lab3-phase4-integration.png` | Dos terminales corriendo — difícil de capturar bien, bajo valor |
| `lab4-unit-tests.html` | `lab4-phase1-inventory.png` | Inventario de clases es texto; ya está descrito en el prompt |
| `lab4-unit-tests.html` | `lab4-batch3-mockito-tests.png` | Código Java con `@Mock` genérico; el texto lo explica |
| `lab5-security.html` | `lab5-phase1-cve-report.png` | La tabla CVE ya está literal en el HTML del lab |
| `lab5-security.html` | `lab5-phase2-pom-fixes.png` | La tabla "Antes → Después" del callout lo cubre |
| `lab-alt4-tdd.html` | `lab-alt4-phase1-red.png` | El estado RED se explica perfectamente con texto |
| `lab-alt4-tdd.html` | `lab-alt4-phase2-implementation.png` | Bob escribiendo código — genérico |

Imágenes que se **mantienen** intactas (no tocar):

| Imagen | Lab | Por qué vale |
|---|---|---|
| `lab1-phase1-analysis.png` | Lab 1 | Muestra findings reales Critical/Warning — ancla el análisis |
| `lab2-phase2-javax-jakarta.png` | Lab 2 | El diff javax→jakarta es el momento más didáctico del workshop |
| `lab3-phase3-react-app.png` | Lab 3 | La UI React en el browser es insustituible — resultado visual único |

**Relevant Context:**
- Archivos afectados: `lab1-replatforming.html`, `lab3-ui-modernization.html`, `lab4-unit-tests.html`, `lab5-security.html`, `lab-alt4-tdd.html`
- Carpeta de imágenes: `docs/assets/images/labs/java-modernization-v2/`
- Cada `<figure>` tiene la estructura: `<figure class="lab-figure"><img .../><figcaption .../></figure>` — eliminar el bloque completo incluyendo el `<figure>` y su `</figure>`

**Status:** [ ] pending

---

## Sub-Tarea 2 — Añadir prerrequisitos Linux y Windows a Labs 4, 5 y Alt-4

**Intent:** Los Labs 4, 5 y Alt-4 tienen secciones de prerrequisitos que solo cubren macOS (`brew install`, `/usr/libexec/java_home`). Los Labs 1, 2 y 3 ya tienen instrucciones completas para los tres sistemas operativos. Aplicar el mismo patrón a los labs que faltan.

**Expected Outcomes:**
- Las secciones "Java 21 y Maven" en Lab 4, Lab 5 y Alt-4 tienen subsecciones para macOS/Linux (SDKMAN!) y Windows (winget)
- El comando `/usr/libexec/java_home -v 21` (solo macOS) se reemplaza con alternativas cross-platform
- La sección de troubleshooting "La terminal de Bob muestra la versión incorrecta de Java" en Lab 4 también se actualiza

**Todo List:**

1. En `lab4-unit-tests.html`:
   - Reemplazar sección "2. Java 21 y Maven" (solo `brew`) con tres subsecciones: macOS/Linux (SDKMAN!), Windows (winget)
   - Reemplazar "3. Configura JAVA_HOME para Java 21" con alternativas cross-platform
   - En troubleshooting "La terminal de Bob muestra la versión incorrecta de Java": añadir `sdk use java 21.0.11-zulu` además del export macOS

2. En `lab5-security.html`:
   - Mismos cambios que Lab 4 en las secciones "2. Java 21 y Maven" y "3. Configura JAVA_HOME"
   - En troubleshooting "La terminal de Bob muestra la versión incorrecta de Java": añadir SDKMAN! alternativa

3. En `lab-alt4-tdd.html`:
   - Mismos cambios en "2. Java 21 y Maven" y "3. Configura JAVA_HOME"

**Patrón de referencia** (correcto, tomado de `lab2-java-upgrade.html`):

```html
<h4 class="cds--productive-heading-01">macOS / Linux — SDKMAN!</h4>
<div class="code-block">
  <pre><code>sdk install java 21.0.11-zulu
sdk use java 21.0.11-zulu
sdk install maven   # omite si ya está instalado</code></pre>
</div>

<h4 class="cds--productive-heading-01">Windows</h4>
<p><strong>Opción A — winget</strong> (PowerShell):</p>
<div class="code-block">
  <pre><code>winget install EclipseAdoptium.Temurin.21.JDK
winget install Apache.Maven</code></pre>
</div>
<p>Cierra y reabre PowerShell. Apunta JAVA_HOME a Temurin 21.</p>
<p><strong>Opción B — SDKMAN! en Git Bash o WSL</strong>: mismos comandos de macOS/Linux.</p>
```

**Reemplazo para `JAVA_HOME` cross-platform:**
- macOS: `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` (mantener)
- Linux: `export JAVA_HOME=$(sdk home java 21.0.11-zulu)` o `export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`
- Windows: `set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21...` (indicar como variable del sistema)

**Relevant Context:**
- Archivos afectados: `lab4-unit-tests.html`, `lab5-security.html`, `lab-alt4-tdd.html`
- Patrón correcto de referencia: `lab1-replatforming.html` líneas 110–152 y `lab2-java-upgrade.html` líneas 56–84
- Los Labs 4/5/Alt-4 actualmente tienen solo:
  ```
  brew install --cask zulu@21
  brew install maven
  export JAVA_HOME=$(/usr/libexec/java_home -v 21)
  ```

**Status:** [ ] pending

---

## Sub-Tarea 3 — Capturar las 4 imágenes nuevas necesarias

**Intent:** Después de limpiar los `<figure>` innecesarios, quedan 4 imágenes que sí aportan valor como cierre visual de cada lab pero todavía no existen. Estas hay que capturarlas ejecutando el lab real.

**Expected Outcomes:**
- 4 archivos PNG en `docs/assets/images/labs/java-modernization-v2/` con ancho mínimo 1400px
- Los `<figure>` correspondientes en los HTMLs apuntan a imágenes que existen
- Cada captura muestra el estado de validación final del lab (no de un paso intermedio)

**Todo List (manual — requiere ejecutar los labs):**

| Imagen a capturar | Lab | Qué debe mostrar | En qué momento capturar |
|---|---|---|---|
| `lab2-phase3-build-success.png` | Lab 2 | Terminal: `mvn clean compile` → BUILD SUCCESS con Java 21 en el output | Fase 3, tras aprobar todos los cambios |
| `lab4-phase4-mvn-test.png` | Lab 4 | Terminal: `mvn test` → 0 failures, 0 errors | Fase 4, tras generar los 3 lotes de tests |
| `lab5-phase3-build-success.png` | Lab 5 | Terminal: `mvn clean compile` → BUILD SUCCESS tras remediar las 3 CVEs | Fase 3, tras aprobar las 3 remediaciones |
| `lab-alt4-phase3-green.png` | Alt-4 | Terminal: `mvn test` → todos los tests pasan — GREEN confirmado | Ejercicio 4, tras implementar PrescriptionResource |

> **Nota:** `lab2-phase3-build-success.png` ya existe en disco. Verificar que la captura actual es de calidad (≥1400px, texto legible). Si lo es, este lab ya está completo.

**Cómo capturar (macOS):**
```bash
# Cmd+Shift+4 → barra espaciadora → clic en la ventana de Bob
cp ~/Desktop/Captura\ de\ pantalla*.png docs/assets/images/labs/java-modernization-v2/lab4-phase4-mvn-test.png
# O usar el script de importación:
./docs/assets/images/labs/java-modernization-v2/import-screenshot.sh lab4-phase4-mvn-test.png ~/Desktop/mi-captura.png
```

**Relevant Context:**
- Script de importación con validación de ancho: `docs/assets/images/labs/java-modernization-v2/import-screenshot.sh`
- Guía de capturas: `docs/assets/images/labs/java-modernization-v2/IMAGES.md`
- Formato: PNG, sin pasar por chat ni WhatsApp (comprimen a JPEG)

**Status:** [ ] pending
