# Imágenes — Java Modernization v2 (Agent Mode)

Carpeta: `docs/assets/images/labs/java-modernization-v2/`

Inventario final: **10 PNG** referenciados en los HTML. En disco hoy: **10 listos**.

Las capturas deben mostrar:

- Chat de Bob en **Agent Mode** con el prompt pegado / respuesta de análisis
- Diffs o archivos propuestos **antes** de aprobar con `"ok"` (Bob debe parar en cada cambio)
- Resultados de `mvn clean compile` / `mvn test` (en el panel de Bob o en la terminal)
- Lab 3: el dashboard React en el navegador (`localhost:3000`)

**No** captures paneles de workflows automáticos (`▶ Workflows`, `Java Modernization`, `Analyze Java Project`, ni selectores de sub-tipo Liberty/Upgrade/UI).

Si Bob aplica varios cambios de golpe, usa el prompt de recuperación del overview y reinicia Fase 2 con chat nuevo (o `git checkout .` en la carpeta snap*).

## Cómo subir capturas (calidad)

**No pegues screenshots en el chat de Cursor.** El chat las comprime a ~1024 px en JPEG y el texto del IDE se ve borroso en el portal.

**Sí: guarda el archivo directamente en esta carpeta** (Finder → arrastrar, o terminal):

```bash
# macOS — captura la ventana de Bob (Retina 2x, PNG sin compresión):
#   Cmd+Shift+4 → barra espaciadora → clic en la ventana de IBM Bob
cp ~/Desktop/Captura\ de\ pantalla*.png docs/assets/images/labs/java-modernization-v2/lab4-phase4-mvn-test.png

# O usa el script de importación (valida ancho mínimo):
./docs/assets/images/labs/java-modernization-v2/import-screenshot.sh lab4-phase4-mvn-test.png ~/Desktop/mi-captura.png
```

| Requisito | Valor |
|---|---|
| Formato | **PNG** (sin pasar por chat ni WhatsApp) |
| Ancho mínimo | **1400 px** (ideal **1920–2560 px** en pantallas Retina) |
| Nombres | Exactamente como en la tabla de abajo |

---

## Inventario (10)

| Archivo | Dónde se usa | Estado | Qué capturar |
|---|---|---|---|
| `hero_bob.png` | Overview | En disco | Hero del workshop |
| `lab1-phase1-analysis.png` | Lab 1 | En disco | Chat Agent: Bob lista findings Critical/Warning del migration plan ZIP |
| `lab1-phase3-build-success.png` | Lab 1 | En disco | Bob Fase 3: `mvn clean compile` → BUILD SUCCESS (Java 1.8) |
| `lab2-phase1-analysis.png` | Lab 2 | En disco | Chat: inventario de `javax.*` / Struts / taglibs a migrar |
| `lab2-phase2-javax-jakarta.png` | Lab 2 | En disco | Diff Cambio 3: `javax.*` → `jakarta.*` en `pom.xml` |
| `lab2-phase3-build-success.png` | Lab 2 | En disco | Bob Fase 3: BUILD SUCCESS con Java 21 |
| `lab3-phase3-react-app.png` | Lab 3 | En disco (sin cambiar) | Browser `localhost:3000` con la UI React y datos reales |
| `lab4-phase4-mvn-test.png` | Lab 4 | En disco | Bob Fase 4: `mvn test` → 0 failures, cobertura JaCoCo |
| `lab-alt4-phase3-green.png` | Alt-4 | En disco | Terminal: tests en verde (GREEN) |
| `lab5-phase3-build-success.png` | Lab 5 | En disco | Bob: BUILD SUCCESS post-remediación de las 3 CVE |

Card del home: `banner_bob.png` (existe en disco; no cuenta en las 10 del HTML de labs).

### En disco pero ya no van en el HTML

`lab1-phase2-changes.png` — huérfano, se puede borrar.

No capturar (nunca se tomaron o se quitaron del HTML): `lab3-phase1-mapping.png`, `lab3-phase2-jaxrs.png`, `lab3-phase4-integration.png`, `lab4-phase1-inventory.png`, `lab4-batch3-mockito-tests.png`, `lab-alt4-phase1-red.png`, `lab-alt4-phase2-implementation.png`, `lab5-phase1-cve-report.png`, `lab5-phase2-pom-fixes.png`.
