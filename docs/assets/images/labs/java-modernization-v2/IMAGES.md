# Imágenes — Java Modernization v2 (Agent Mode)

Carpeta: `docs/assets/images/labs/java-modernization-v2/`

Las capturas deben mostrar:

- Chat de Bob en **Agent Mode** con el prompt pegado / respuesta de análisis
- Diffs o archivos propuestos **antes** de aprobar con `"ok"` (Bob debe parar en cada cambio)
- Terminal con `mvn clean compile` / `mvn test`

**No** captures paneles de workflows automáticos (`▶ Workflows`, `Java Modernization`, `Analyze Java Project`, ni selectores de sub-tipo Liberty/Upgrade/UI).

Si Bob aplica varios cambios de golpe, usa el prompt de recuperación del overview y reinicia Fase 2 con chat nuevo (o `git checkout .` en la carpeta snap*).

## ⚠️ Cómo subir capturas (importante — calidad)

**No pegues screenshots en el chat de Cursor.** El chat las comprime a ~1024 px en JPEG (~65 KB) y el texto del IDE se ve borroso o pixelado en el portal.

**Sí: guarda el archivo directamente en esta carpeta** (Finder → arrastrar, o terminal):

```bash
# Desde macOS — captura la ventana de Bob (Retina 2x, PNG sin compresión):
#   Cmd+Shift+4 → barra espaciadora → clic en la ventana de IBM Bob
# Luego copia al nombre exacto del lab:
cp ~/Desktop/Captura\ de\ pantalla*.png docs/assets/images/labs/java-modernization-v2/lab1-phase1-analysis.png

# O usa el script de importación (valida ancho mínimo):
./docs/assets/images/labs/java-modernization-v2/import-screenshot.sh lab1-phase1-analysis.png ~/Desktop/mi-captura.png
```

| Requisito | Valor |
|---|---|
| Formato | **PNG** (sin pasar por chat ni WhatsApp) |
| Ancho mínimo | **1400 px** (ideal **1920–2560 px** en pantallas Retina) |
| Nombres | Exactamente como en la tabla de abajo |

Formato: PNG, ancho mínimo **1400 px** (ideal 1920+ en Retina).
Nombres: **exactamente** como abajo (coinciden con el HTML).

---

## Overview (ya existen)

| Archivo | Uso |
|---|---|
| `hero_bob.png` | Hero del overview |
| `banner_bob.png` | Card del home (opcional actualizar con el mismo arte del hero) |

---

## Regla: 1 captura por fase clave

Patrón por lab: **Análisis → Cambio → Validación** (+ 1 extra solo si hay UI o resultado distinto).

| Lab | # | Archivos |
|---|---|---|
| Lab 1 — Liberty | **3** | analysis, changes, build-success |
| Lab 2 — Java 21 | **3** | analysis, javax-jakarta, build-success |
| Lab 3 — React UI | **4** | mapping, jaxrs, react-app, integration |
| Lab 4 — Unit tests | **3** | inventory, mockito-tests, mvn-test |
| Lab Alt-4 — TDD | **3** | red, implementation, green |
| Lab 5 — Security | **3** | cve-report, pom-fixes, build-success |
| **Total sublabs** | **19** | |

Quitamos respecto al listado viejo (27):

- 6× `lab*-banner.png` (el overview ya tiene hero; los sublabs no muestran banner)
- 1× `lab4-batch1-model-tests.png` (redundant con mockito; basta inventario + un batch + terminal)
- 1× `lab5-phase4-remediation-report.png` (el informe CVE + BUILD SUCCESS bastan)

---

## LAB 1 — Liberty Replatforming (3)

| Archivo | Qué capturar |
|---|---|
| `lab1-phase1-analysis.png` | Chat Agent: Bob lista findings Critical/Warning del migration plan ZIP |
| `lab1-phase2-changes.png` | Diff del `pom.xml` (liberty-maven-plugin / deps) antes del `"ok"` |
| `lab1-phase3-build-success.png` | Terminal: `mvn clean compile` → BUILD SUCCESS (Java 1.8) |

## LAB 2 — Java 8 → 21 (3)

| Archivo | Qué capturar |
|---|---|
| `lab2-phase1-analysis.png` | Chat: lista de `javax.*` / taglibs a migrar |
| `lab2-phase2-javax-jakarta.png` | Diff `javax.*` → `jakarta.*` en un archivo |
| `lab2-phase3-build-success.png` | Terminal: BUILD SUCCESS con Java 21 |

## LAB 3 — Struts → React (4)

| Archivo | Qué capturar |
|---|---|
| `lab3-phase1-mapping.png` | Chat: tabla Action → REST → componente React |
| `lab3-phase2-jaxrs.png` | Recursos JAX-RS creados + compile OK |
| `lab3-phase3-react-app.png` | Browser `localhost:5173` con la UI |
| `lab3-phase4-integration.png` | Liberty `:9081` + React `:5173` juntos |

## LAB 4 — Unit tests (3)

| Archivo | Qué capturar |
|---|---|
| `lab4-phase1-inventory.png` | Chat: inventario de clases + estrategia por capa |
| `lab4-batch3-mockito-tests.png` | Tests JAX-RS con `@Mock` (el batch más representativo) |
| `lab4-phase4-mvn-test.png` | Terminal: `mvn test` → 0 failures |

## LAB Alt-4 — TDD (3)

| Archivo | Qué capturar |
|---|---|
| `lab-alt4-phase1-red.png` | Terminal: `mvn test` fallando (RED) |
| `lab-alt4-phase2-implementation.png` | Chat/diff: Bob implementando `PrescriptionResource` |
| `lab-alt4-phase3-green.png` | Terminal: tests en verde (GREEN) |

## LAB 5 — Security (3)

| Archivo | Qué capturar |
|---|---|
| `lab5-phase1-cve-report.png` | Chat: tabla CVE (severidad + versión segura) |
| `lab5-phase2-pom-fixes.png` | Diff del `pom.xml` con bumps de versión |
| `lab5-phase3-build-success.png` | Terminal: BUILD SUCCESS post-remediación |

---

## Cómo obtenerlas

1. Corre cada lab con **Agent Mode** y los prompts del portal.
2. Screenshot en el momento del `figcaption` del HTML.
3. Guarda con el nombre exacto en esta carpeta.
