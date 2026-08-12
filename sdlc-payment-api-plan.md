# Plan: Rediseño del Lab SDLC — SaaS Payment & Billing API

> **Decisiones confirmadas:**
> - Proyecto base incluye datos seed en SQLite (pagos y cupones de ejemplo listos para usar)
> - `walkthrough.html` se expande a 5–6 pasos para cubrir el caso completo
> - Las respuestas esperadas pueden mostrarse en los callouts del lab

## Resumen

Reemplazar el contenido genérico del lab "Ciclo de vida del software" por un caso real y técnicamente rico basado en una **SaaS Payment & Billing API** (Node.js + Express + SQLite). El estudiante descarga un proyecto base con deuda técnica intencional (secretos hardcoded, inyección SQL, tests faltantes) y lo lleva a producción pasando por las 6 fases del SDLC usando IBM Bob.

**Scope:**
- 8 archivos HTML del lab (overview, plan, design, code, test, deploy, maintain, walkthrough)
- Entrada en `docs/js/data.js` para este lab
- Código base del proyecto (`sdlc-lab-payment-api.zip`) con estructura Node.js completa
- El zip se copia a `docs/downloads/sdlc-lab-payment-api.zip`

**No está en scope:**
- Cambios a CSS, componentes de Carbon, router o estructura de navegación
- Otros labs no relacionados

---

## Sub-Tarea 1 — Crear el proyecto Node.js base

**Intent:** Construir la estructura completa del proyecto `sdlc-lab-payment-api/` con deuda técnica intencional según las instrucciones del lab. Este código es lo que los clientes descargarán.

**Expected Outcomes:**
- Directorio `sdlc-lab-payment-api/` con toda la estructura de archivos
- `src/routes/payment.js` con secreto hardcoded y consulta SQL con inyección
- `src/routes/coupon.js` con implementación vacía/skeleton (TODO comments)
- Tests en Jest con cobertura incompleta (algunos failing intencionalmente)
- `Dockerfile`, `.github/workflows/deploy.yml`, `openapi.yaml` presentes
- `.env.example` con la variable `API_SECRET_KEY` documentada
- `README.md` en español explicando la estructura del proyecto
- Todo comprimido en `docs/downloads/sdlc-lab-payment-api.zip`

**Todo List:**
1. Crear `sdlc-lab-payment-api/package.json` con dependencias: express, better-sqlite3, dotenv; devDependencies: jest, supertest
2. Crear `sdlc-lab-payment-api/src/app.js` — setup Express con middlewares básicos
3. Crear `sdlc-lab-payment-api/src/database.js` — inicialización SQLite con tablas `payments`, `coupons`; insertar datos seed
4. Crear `sdlc-lab-payment-api/src/routes/payment.js` — con vulnerabilidades intencionales:
   - `apiKey !== "SECRET_API_KEY_12345"` hardcoded
   - Query `WHERE id = '${userId}'` (inyección SQL)
5. Crear `sdlc-lab-payment-api/src/routes/coupon.js` — skeleton vacío con TODO comments
6. Crear `sdlc-lab-payment-api/src/index.js` — entry point del servidor
7. Crear `sdlc-lab-payment-api/openapi.yaml` — spec de los endpoints (GET /api/v1/payments/:id, POST /api/v1/coupons/apply)
8. Crear `sdlc-lab-payment-api/__tests__/payment.test.js` — tests parciales con algunos failing
9. Crear `sdlc-lab-payment-api/Dockerfile` — imagen Node.js básica (mejorable a alpine)
10. Crear `sdlc-lab-payment-api/.github/workflows/deploy.yml` — pipeline CI/CD con etapas lint/test/deploy
11. Crear `sdlc-lab-payment-api/.env.example` con `API_SECRET_KEY=your_secret_here`
12. Crear `sdlc-lab-payment-api/.gitignore`
13. Crear `sdlc-lab-payment-api/README.md` en español
14. Comprimir todo en `docs/downloads/sdlc-lab-payment-api.zip`

**Relevant Context:**
- Instrucciones del lab: `instruccionesSDLC.md` (vulnerabilidades exactas a replicar)
- Destino del zip: `docs/downloads/` (misma carpeta que `simple-pharmacy-workshop-v2.zip`)

**Status:** [ ] pending

---

## Sub-Tarea 2 — Actualizar overview.html

**Intent:** Reemplazar la introducción genérica por la narrativa del caso Payment API. El overview es la primera impresión del lab y debe comunicar el problema real, el valor y motivar al cliente.

**Expected Outcomes:**
- Banner actualizado: título, tags y métricas alineados al nuevo caso
- Sección de descarga apuntando a `sdlc-lab-payment-api.zip`
- Value strip reflejando los 3 pilares del nuevo caso (Seguridad, Feature, Calidad)
- Ciclo SDLC y tabla de herramientas se mantienen (son correctos)
- Timeline actualizado con las actividades concretas del nuevo caso
- Prerrequisitos actualizados (Node.js, npm, Git en lugar de Python)

**Todo List:**
1. Cambiar título del banner a: "SaaS Payment API: de deuda técnica a producción"
2. Actualizar tags: mantener `Habilitación Core`, cambiar tiempo a `~90 min`, modos `Plan · Agent · Ask`
3. Actualizar métricas: 6 fases, ~90 min, 30–50 BobCoins, 3 vulnerabilidades
4. Actualizar sección de descarga: href a `./downloads/sdlc-lab-payment-api.zip`, nombre del zip correcto, explicar qué contiene
5. Rediseñar value strip: tile 1 = Seguridad (secretos + SQL injection), tile 2 = Feature completa (/coupons/apply), tile 3 = CI/CD + monitoreo
6. Actualizar timeline con actividades específicas (identificar deuda técnica, modelar API spec, corregir vulnerabilidades, tests Jest, Docker + GH Actions, alertas Sentry/Datadog)
7. Actualizar prerrequisitos: Node.js 18+, npm, Git, cuenta diagrams.net
8. Mantener los 6 hub-lab-cards de navegación (links no cambian)

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/overview.html`
- Patrón de botón de descarga: mismo que `docs/content/integraciones/agentic-retail-confluent/overview.html` línea 50

**Status:** [ ] pending

---

## Sub-Tarea 3 — Actualizar plan.html

**Intent:** Reemplazar el contenido genérico con el escenario concreto de la Payment API donde el estudiante actúa como PM e identifica la deuda técnica en el backlog.

**Expected Outcomes:**
- Paso 1: Activar Plan Mode (sin cambio estructural, actualizar contexto)
- Paso 2: Prompt específico pidiendo a Bob que analice el backlog de la Payment API con las 3 tareas clave (Bug/Security, Feature, Quality)
- Paso 3: Criterio de aprobación con checklist concreto: clasificar ítems como Critical Bug, New Feature, Technical Debt
- Callout de gate actualizado para la siguiente fase

**Todo List:**
1. Actualizar descripción del lab en el banner y perfil (PM trabajando en Payment API)
2. Reescribir el prompt del Paso 2 usando el contexto de la Payment API (backlog con 3 tareas específicas)
3. Actualizar el expected output (callout tip) mostrando un ejemplo de clasificación correcta
4. Actualizar la validación/gate: los 3 ítems deben estar clasificados correctamente antes de avanzar

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/plan.html`
- Las 3 tareas del backlog vienen de `instruccionesSDLC.md` sección `/Plan`

**Status:** [ ] pending

---

## Sub-Tarea 4 — Actualizar design.html

**Intent:** Centrar la fase de diseño en el modelado del contrato de la API (`openapi.yaml`) y el diagrama de secuencia del endpoint `POST /api/v1/coupons/apply`.

**Expected Outcomes:**
- Paso 1: Prompt para que Bob analice el `openapi.yaml` del proyecto y explique los contratos
- Paso 2: Guía para crear el diagrama de secuencia en draw.io (Cliente → API Gateway → Express Router → SQLite)
- Paso 3: Validación con preguntas concretas (parámetros del body, código HTTP para cupón inválido)

**Todo List:**
1. Actualizar banner y perfil (Arquitecto revisando openapi.yaml de la Payment API)
2. Reescribir Paso 1: prompt para Ask Mode analizando el contrato OpenAPI del proyecto
3. Reescribir Paso 2: instrucciones para el diagrama de secuencia en draw.io con los 4 actores del caso
4. Reescribir Paso 3: checklist de validación con preguntas concretas del flujo de cupones

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/design.html`
- `instruccionesSDLC.md` sección `/Diseño` define el flujo de secuencia esperado

**Status:** [ ] pending

---

## Sub-Tarea 5 — Actualizar code.html

**Intent:** Guiar al estudiante para detectar y corregir las vulnerabilidades reales en el código base y luego implementar el endpoint `/coupons/apply`.

**Expected Outcomes:**
- Paso 1: Prompt para que Bob detecte el secreto hardcoded en `src/routes/payment.js`
- Paso 2: Prompt para corregir la inyección SQL con consulta parametrizada
- Paso 3: Prompt para implementar `src/routes/coupon.js` completo
- Comandos de smoke check con curl actualizados al contexto de la Payment API

**Todo List:**
1. Actualizar banner y perfil (Developer en Agent Mode trabajando en la Payment API)
2. Reescribir Paso 1: detectar y corregir secreto hardcoded → `process.env.API_SECRET_KEY`
3. Reescribir Paso 2: detectar y corregir inyección SQL → query parametrizada con `?`
4. Reescribir Paso 3: implementar endpoint `/coupons/apply` con lógica de descuento
5. Actualizar comandos curl para los endpoints reales de la Payment API

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/code.html`
- Vulnerabilidades exactas en `instruccionesSDLC.md` sección `/Código`

**Status:** [ ] pending

---

## Sub-Tarea 6 — Actualizar test.html

**Intent:** Guiar al estudiante para ejecutar el scanner SAST simulado y los tests de Jest, entendiendo por qué fallaban antes y cómo las correcciones los hacen pasar.

**Expected Outcomes:**
- Paso 1: Interpretar reporte SAST simulado (SonarQube) con los 2 hallazgos del caso
- Paso 2: Ejecutar `npm test` y ver los tests pasar tras las correcciones
- Paso 3: Checklist de criterios de salida con métricas concretas (cobertura mínima, 0 vulnerabilidades críticas)

**Todo List:**
1. Actualizar banner y perfil (QA / DevSecOps en Agent Mode con Jest y SAST)
2. Reescribir Paso 1: prompt para que Bob simule el reporte de SonarQube con los 2 hallazgos críticos
3. Reescribir Paso 2: guía para ejecutar `npm test` y analizar los resultados
4. Actualizar el checklist de salida con los criterios del caso Payment API

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/test.html`
- Hallazgos SAST en `instruccionesSDLC.md` sección `/Test`

**Status:** [ ] pending

---

## Sub-Tarea 7 — Actualizar deploy.html

**Intent:** Guiar al estudiante en la optimización del Dockerfile y el análisis del pipeline de GitHub Actions del proyecto base.

**Expected Outcomes:**
- Paso 1: Optimizar `Dockerfile` de imagen pesada a `node:18-alpine` con buenas prácticas
- Paso 2: Revisar y explicar `.github/workflows/deploy.yml` (etapas lint/test/deploy)
- Paso 3: Checklist de PR antes de merge (tests verdes, secretos en env vars, imagen construida)

**Todo List:**
1. Actualizar banner y perfil (DevOps en Agent Mode con Docker y GitHub Actions)
2. Reescribir Paso 1: prompt para optimizar el Dockerfile del proyecto base
3. Reescribir Paso 2: prompt para revisar y documentar el pipeline CI/CD
4. Agregar Paso 3: checklist de gobernanza de PR específico para la Payment API

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/deploy.html`
- `instruccionesSDLC.md` sección `/Deploy` define los artefactos esperados

**Status:** [ ] pending

---

## Sub-Tarea 8 — Actualizar maintain.html

**Intent:** Simular logs reales de Sentry/Datadog del caso y enseñar al estudiante a configurar alertas de producción y documentar el ciclo cerrado.

**Expected Outcomes:**
- Paso 1: Simular y analizar los 2 eventos de log del caso (SQLITE_BUSY, 401 Unauthorized)
- Paso 2: Configurar regla de alerta en PagerDuty (errores 5xx > 3% en 5 min)
- Paso 3: Checklist de cierre de ciclo con los 4 criterios de finalización del lab

**Todo List:**
1. Actualizar banner y perfil (Seguridad + Ops con Sentry, Datadog, PagerDuty)
2. Reescribir Paso 1: prompt de Ask Mode para interpretar los logs simulados del caso
3. Reescribir Paso 2: guía para configurar alerta en PagerDuty con umbral del caso
4. Reescribir Paso 3: checklist final con los 4 criterios de finalización del `instruccionesSDLC.md`

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/maintain.html`
- Logs y criterios en `instruccionesSDLC.md` secciones `/Mantener` y `Criterios de Finalización`

**Status:** [ ] pending

---

## Sub-Tarea 9 — Actualizar walkthrough.html

**Intent:** Adaptar el recorrido rápido al nuevo caso de la Payment API para quien quiera completar el ciclo en una sola sesión.

**Expected Outcomes:**
- Los 4 pasos del walkthrough reflejan el flujo de la Payment API
- Prompts actualizados mencionando archivos concretos del proyecto (`payment.js`, `coupon.js`)
- El caso de negocio (corregir vulnerabilidades + implementar feature) está presente en el resumen

**Todo List:**
1. Actualizar banner y contexto del walkthrough (Payment API)
2. Reescribir los 4 prompts de los pasos para el nuevo caso
3. Actualizar expected outputs para cada paso

**Relevant Context:**
- Archivo: `docs/content/basic/software-development-lifecycle/walkthrough.html`

**Status:** [ ] pending

---

## Sub-Tarea 10 — Actualizar data.js

**Intent:** Actualizar la entrada del lab en el objeto de datos central para reflejar el nuevo caso, duración y materiales.

**Expected Outcomes:**
- Campo `outcome` describe la Payment API como caso de estudio
- `requirements` incluye Node.js 18+, npm, Git (reemplaza Python)
- `materials` menciona el nuevo zip `sdlc-lab-payment-api.zip`
- `learning` refleja los 3 pilares: seguridad, feature completa, CI/CD

**Todo List:**
1. Localizar la entrada `'software-development-lifecycle'` en `docs/js/data.js`
2. Actualizar todos los campos del objeto según el nuevo caso

**Relevant Context:**
- Archivo: `docs/js/data.js`
- Entrada actual documentada en la exploración del sub-agente

**Status:** [ ] pending
