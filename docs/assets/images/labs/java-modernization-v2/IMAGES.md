# Imágenes requeridas — Java Modernization v2

Carpeta: `docs/assets/images/labs/java-modernization-v2/`

Coloca cada imagen en esta carpeta con **exactamente** el nombre indicado.
Formato recomendado: PNG, ancho mínimo 1200 px.

---

## LAB 1 — Java Liberty Replatforming

| Nombre de archivo | Dónde aparece | Descripción sugerida |
|---|---|---|
| `lab1-banner.png` | Encabezado del lab | Banner o captura del lab 1 en Bob con el proyecto snapA abierto |
| `lab1-phase1-analysis.png` | Fase 1 — Análisis | Bob leyendo el pom.xml y el ZIP del migration plan; lista de findings Critical/Warning |
| `lab1-phase2-changes.png` | Fase 2 — Cambios | Diff del pom.xml con el `liberty-maven-plugin` y las dependencias añadidas |
| `lab1-phase3-build-success.png` | Fase 3 — Validación | Terminal con `mvn clean compile` → `BUILD SUCCESS` con Java 1.8 |

---

## LAB 2 — Java 8 → Java 21 Upgrade

| Nombre de archivo | Dónde aparece | Descripción sugerida |
|---|---|---|
| `lab2-banner.png` | Encabezado del lab | Banner del lab 2 en Bob con el proyecto snapB |
| `lab2-phase1-analysis.png` | Fase 1 — Análisis | Bob listando los imports `javax.*` y taglib URIs del proyecto |
| `lab2-phase2-javax-jakarta.png` | Fase 2 — Cambios | Diff de la migración `javax.*` → `jakarta.*` en archivos Java y JSP |
| `lab2-phase3-build-success.png` | Fase 3 — Validación | Terminal con `mvn clean compile` → `BUILD SUCCESS` con Java 21 |

---

## LAB 3 — UI Modernization (Struts → React)

| Nombre de archivo | Dónde aparece | Descripción sugerida |
|---|---|---|
| `lab3-banner.png` | Encabezado del lab | Banner del lab 3 mostrando la arquitectura Struts → React |
| `lab3-phase1-mapping.png` | Fase 1 — Mapa de conversión | Bob mostrando la tabla Struts Action → REST endpoint → componente React |
| `lab3-phase2-jaxrs.png` | Fase 2 — Backend JAX-RS | Bob creando los recursos JAX-RS + terminal con `BUILD SUCCESS` |
| `lab3-phase3-react-app.png` | Fase 3 — Frontend React | Frontend React corriendo en `localhost:5173` con datos del backend |
| `lab3-phase4-integration.png` | Fase 4 — Validación | Liberty en 9081 y React en 5173 respondiendo `curl` y mostrando datos |

---

## LAB 4 — Unit Test Generation

| Nombre de archivo | Dónde aparece | Descripción sugerida |
|---|---|---|
| `lab4-banner.png` | Encabezado del lab | Banner del lab 4 con JUnit/Mockito |
| `lab4-phase1-inventory.png` | Fase 1 — Inventario | Bob mostrando el inventario de clases y la estrategia de testing propuesta |
| `lab4-batch1-model-tests.png` | Batch 1 — Tests de modelos | Código de los tests de modelos con grupos `@Nested` |
| `lab4-batch3-mockito-tests.png` | Batch 3 — Tests JAX-RS | Tests de resources JAX-RS con mocks de Mockito |
| `lab4-phase4-mvn-test.png` | Fase 4 — Validación | Terminal con `mvn test` → `BUILD SUCCESS, 0 failures, 0 errors` |

---

## LAB 5 — Security Vulnerability Remediation

| Nombre de archivo | Dónde aparece | Descripción sugerida |
|---|---|---|
| `lab5-banner.png` | Encabezado del lab | Banner del lab 5 con iconos de seguridad/CVE |
| `lab5-phase1-cve-report.png` | Fase 1 — Informe CVE | Bob generando la tabla de vulnerabilidades con severidad y versiones seguras |
| `lab5-phase2-pom-fixes.png` | Fase 2 — Remediación | Diff del `pom.xml` con las 3 versiones corregidas |
| `lab5-phase3-build-success.png` | Fase 3 — Validación | Terminal con `mvn clean compile` → `BUILD SUCCESS` post-remediación |
| `lab5-phase4-remediation-report.png` | Fase 4 — Informe final | Bob mostrando la tabla de remediación con los 3 CVEs marcados como ✅ Resuelto |

---

## LAB Alt-4 — Test-Driven Development (TDD)

| Nombre de archivo | Dónde aparece | Descripción sugerida |
|---|---|---|
| `lab-alt4-banner.png` | Encabezado del lab | Banner TDD con ciclo Red → Green → Refactor |
| `lab-alt4-phase1-red.png` | Fase 1 — RED | Terminal con `mvn test` fallando — estado RED confirmado |
| `lab-alt4-phase2-implementation.png` | Fase 2 — GREEN | Bob implementando `PrescriptionResource.java` con los 4 endpoints |
| `lab-alt4-phase3-green.png` | Fase 3 — GREEN verificación | Terminal con `mvn test` → todos los tests pasando — estado GREEN |

---

## Resumen de todos los archivos

| # | Nombre de archivo | Lab |
|---|---|---|
| 1 | `lab1-banner.png` | Lab 1 |
| 2 | `lab1-phase1-analysis.png` | Lab 1 |
| 3 | `lab1-phase2-changes.png` | Lab 1 |
| 4 | `lab1-phase3-build-success.png` | Lab 1 |
| 5 | `lab2-banner.png` | Lab 2 |
| 6 | `lab2-phase1-analysis.png` | Lab 2 |
| 7 | `lab2-phase2-javax-jakarta.png` | Lab 2 |
| 8 | `lab2-phase3-build-success.png` | Lab 2 |
| 9 | `lab3-banner.png` | Lab 3 |
| 10 | `lab3-phase1-mapping.png` | Lab 3 |
| 11 | `lab3-phase2-jaxrs.png` | Lab 3 |
| 12 | `lab3-phase3-react-app.png` | Lab 3 |
| 13 | `lab3-phase4-integration.png` | Lab 3 |
| 14 | `lab4-banner.png` | Lab 4 |
| 15 | `lab4-phase1-inventory.png` | Lab 4 |
| 16 | `lab4-batch1-model-tests.png` | Lab 4 |
| 17 | `lab4-batch3-mockito-tests.png` | Lab 4 |
| 18 | `lab4-phase4-mvn-test.png` | Lab 4 |
| 19 | `lab5-banner.png` | Lab 5 |
| 20 | `lab5-phase1-cve-report.png` | Lab 5 |
| 21 | `lab5-phase2-pom-fixes.png` | Lab 5 |
| 22 | `lab5-phase3-build-success.png` | Lab 5 |
| 23 | `lab5-phase4-remediation-report.png` | Lab 5 |
| 24 | `lab-alt4-banner.png` | Alt-Lab 4 |
| 25 | `lab-alt4-phase1-red.png` | Alt-Lab 4 |
| 26 | `lab-alt4-phase2-implementation.png` | Alt-Lab 4 |
| 27 | `lab-alt4-phase3-green.png` | Alt-Lab 4 |

**Total: 27 imágenes**
