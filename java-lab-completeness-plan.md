# Java Modernization Lab — Plan de completitud

## Resumen

El lab de Java Modernization v2 tiene el contenido textual completo (prompts, fases, troubleshooting) pero tiene tres brechas concretas que lo impiden calificar como "listo para producción":

1. **Imágenes rotas (crítico):** Las HTMLs solo referencian imágenes de alto valor, pero 4 de las imágenes referenciadas no existen en disco → el portal muestra broken images en Labs 4, 5 y Alt-4.
2. **Prerrequisitos solo macOS (crítico):** Labs 4, 5 y Alt-4 tienen instrucciones de instalación solo para macOS (`brew install`). Labs 1, 2, 3 ya tienen el patrón completo de 3 SO.
3. **IMAGES.md desincronizado (cosmético):** El archivo de guía de capturas lista 19 imágenes siguiendo el plan viejo. Las HTMLs quedaron en 10 (después de la limpieza de `<figure>` ya realizada). El doc de guía no refleja el estado actual.

El redesign plan (reducción de carga cognitiva, OS cards en overview, etc.) está en un plan separado (`java-modernization-redesign-plan.md`) y es trabajo independiente de calidad, no de completitud.

---

## Estado actual de imágenes

### Imágenes referenciadas en HTML vs. existencia en disco

| Imagen referenciada en HTML | Existe en disco | Status |
|---|---|---|
| `hero_bob.png` | ✅ Sí | OK |
| `lab1-phase1-analysis.png` | ✅ Sí | OK |
| `lab1-phase3-build-success.png` | ✅ Sí | OK |
| `lab2-phase1-analysis.png` | ✅ Sí | OK |
| `lab2-phase2-javax-jakarta.png` | ✅ Sí | OK |
| `lab2-phase3-build-success.png` | ✅ Sí | OK |
| `lab3-phase3-react-app.png` | ✅ Sí | OK |
| `lab4-phase4-mvn-test.png` | ❌ No existe | **Broken** |
| `lab5-phase3-build-success.png` | ❌ No existe | **Broken** |
| `lab-alt4-phase3-green.png` | ❌ No existe | **Broken** |

> Nota: `lab1-phase2-changes.png` existe en disco pero ya NO está referenciado en ningún HTML (fue eliminado correctamente en la limpieza previa). Se puede borrar opcionalmente del disco.

---

## Sub-Tarea 1 — Añadir prerrequisitos Linux y Windows a Labs 4, 5 y Alt-4

**Intent:** Labs 4, 5 y Alt-4 tienen instrucciones de Java 21 + Maven solo para macOS (`brew install --cask zulu@21`). Un participante en Linux o Windows se queda bloqueado. Los Labs 1, 2 y 3 ya tienen el patrón de 3 SO correcto.

**Expected Outcomes:**
- `lab4-unit-tests.html`: sección "2. Java 21 y Maven" y "3. Configura JAVA_HOME" expandidas con macOS/Linux (SDKMAN!) y Windows (winget). La sección de troubleshooting "La terminal de Bob muestra la versión incorrecta de Java" añade `sdk use java 21.0.11-zulu` como alternativa.
- `lab5-security.html`: mismo patrón.
- `lab-alt4-tdd.html`: mismo patrón.

**Todo List:**
1. Abrir `lab4-unit-tests.html` y localizar las subsecciones "2. Java 21 y Maven" y "3. Configura JAVA_HOME"
2. Reemplazar el bloque `brew install --cask zulu@21 && brew install maven && export JAVA_HOME=$(/usr/libexec/java_home -v 21)` con las tres subsecciones del patrón de referencia (ver abajo)
3. En la sección de troubleshooting de Lab 4, añadir `sdk use java 21.0.11-zulu` junto al export de macOS
4. Repetir pasos 1–3 para `lab5-security.html`
5. Repetir pasos 1–2 para `lab-alt4-tdd.html`

**Patrón de referencia** (tomado de `lab2-java-upgrade.html` líneas 56–84):
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

**Relevant Context:**
- Patrón completo de 3 SO: `lab2-java-upgrade.html` líneas 56–84 y `lab1-replatforming.html` líneas 110–152
- Archivos afectados: `docs/content/premium/java-modernization-v2/lab4-unit-tests.html`, `lab5-security.html`, `lab-alt4-tdd.html`

**Status:** [ ] pending

---

## Sub-Tarea 2 — Capturar las 3 imágenes faltantes (broken images)

**Intent:** Las HTMLs de Labs 4, 5 y Alt-4 referencian imágenes que no existen en disco. El portal muestra broken image placeholders. Estas capturas son screenshots de la validación final del lab — el momento más didáctico y el cierre visual de cada fase.

**Expected Outcomes:**
- 3 archivos PNG en `docs/assets/images/labs/java-modernization-v2/` con ancho mínimo 1400px
- El portal no muestra imágenes rotas en ningún lab
- Cada captura es una screenshot real (no generada) del resultado de ejecución del lab

**Todo List (manual — requiere ejecutar los labs):**

| Imagen a capturar | Lab | Qué debe mostrar | Cuándo capturar |
|---|---|---|---|
| `lab4-phase4-mvn-test.png` | Lab 4 | Terminal: `mvn test` → BUILD SUCCESS, 0 failures, 0 errors | Fase 4, tras generar los 3 lotes de tests |
| `lab5-phase3-build-success.png` | Lab 5 | Terminal: `mvn clean compile` → BUILD SUCCESS tras remediar las 3 CVEs | Fase 3, tras aprobar las 3 remediaciones |
| `lab-alt4-phase3-green.png` | Alt-4 | Terminal: `mvn test` → todos pasan, estado GREEN | Ejercicio 4, tras implementar PrescriptionResource |

**Instrucciones de captura (macOS):**
```bash
# Cmd+Shift+4 → barra espaciadora → clic en la ventana de Bob (PNG Retina)
cp ~/Desktop/Captura\ de\ pantalla*.png docs/assets/images/labs/java-modernization-v2/lab4-phase4-mvn-test.png
# O usar el script de validación:
./docs/assets/images/labs/java-modernization-v2/import-screenshot.sh lab4-phase4-mvn-test.png ~/Desktop/mi-captura.png
```

**Relevant Context:**
- Script de importación con validación de ancho mínimo: `docs/assets/images/labs/java-modernization-v2/import-screenshot.sh`
- Guía de capturas: `docs/assets/images/labs/java-modernization-v2/IMAGES.md`
- Formato: PNG sin pasar por chat ni WhatsApp (comprimen a JPEG)
- **No capturar** paneles de workflows automáticos de Bob — solo el chat en Agent Mode y la terminal

**Status:** [ ] pending

---

## Sub-Tarea 3 — Actualizar IMAGES.md para reflejar el estado actual

**Intent:** `IMAGES.md` todavía documenta el plan viejo de 19 imágenes distribuidas en 6 labs. El HTML quedó con solo 10 referencias (7 existentes + 3 faltantes) después de la limpieza de figuras ya realizada. El doc de guía engaña a quien quiera colaborar capturando capturas nuevas.

**Expected Outcomes:**
- `IMAGES.md` lista exactamente las 10 imágenes que los HTMLs referencian (tabla actualizada)
- La sección "Regla: 1 captura por fase clave" refleja el inventario final (no el plan intermedio)
- Las imágenes huérfanas en disco (`lab1-phase2-changes.png`) están identificadas como "para eliminar" o eliminadas

**Todo List:**
1. En `IMAGES.md`, reemplazar la tabla "Regla: 1 captura por fase clave" con el inventario actual de 10 imágenes (7 existentes + 3 faltantes)
2. Actualizar la tabla por lab (LAB 1, LAB 2, etc.) para que solo liste las imágenes que el HTML realmente referencia
3. Eliminar de la documentación las imágenes que fueron quitadas de los HTMLs (las 9 de la limpieza previa)
4. Añadir una nota sobre `lab1-phase2-changes.png` como archivo huérfano en disco (existe pero no es referenciado)

**Relevant Context:**
- Archivo a actualizar: `docs/assets/images/labs/java-modernization-v2/IMAGES.md`
- Imágenes referenciadas actualmente en HTML: ver tabla de "Estado actual de imágenes" al inicio de este plan
- Imagen huérfana en disco: `lab1-phase2-changes.png` (existe en disco, no referenciada en ningún HTML)

**Status:** [ ] pending

---

## Resumen de lo que falta

| # | Área | Impacto | Quién lo hace |
|---|---|---|---|
| 1 | Prerrequisitos Linux/Windows en Labs 4, 5, Alt-4 | Bloqueante para usuarios no-macOS | Agent Mode (editar HTML) |
| 2 | 3 imágenes faltantes (broken images en portal) | Visual — broken placeholder visible | Manual (ejecutar labs + screenshot) |
| 3 | IMAGES.md desincronizado | Confunde a colaboradores | Agent Mode (editar doc) |

**Lo que YA está completo:**
- Todo el contenido textual (prompts, fases, checkpoints, troubleshooting)
- 7 de 10 imágenes referenciadas existen en disco
- La limpieza de `<figure>` innecesarios ya fue aplicada en los HTMLs
- Labs 1, 2, 3 tienen prerrequisitos completos de 3 SO
