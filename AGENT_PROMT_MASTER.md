# Post-Mortem de Ingeniería de Prompts
## Workshop IBM Event Streaming — trackD / inventory-pipeline
**Agente:** IBM Bob (AI Software Engineer)
**Fecha de análisis:** Septiembre 2026
**Autor del análisis:** Lead AI Architect / Senior Prompt Engineer
**Proyecto:** RoadShow Bob Streaming Integration — Track D (Confluent Kafka + ksqlDB)

> **Fuente de verdad para el evento:** los prompts que pega el alumno viven en
> `docs/content/integraciones/agentic-retail-confluent/{overview,topics,ksqldb,publish}.html`
> y el contrato del agente en `BRIEFING_AGENTE_TRACK_D_F.md`. Este archivo es el
> post-mortem histórico (IDs `m01_p100`, Protobuf, etc.). **No lo uses como runbook.**

---

> **Propósito de este documento:** Auditar de forma quirúrgica cada instrucción entregada al agente durante la sesión de trabajo, identificar las fricciones que generaron múltiples iteraciones de error, y reescribir cada prompt hasta llevarlo al nivel de "instrucción de producción" — ejecutable en un solo intento, sin ambigüedad y sin alucinaciones.

---

## Iteración 1: Configuración de infraestructura SSH y archivo `.env`

### 1. Prompt Entregado

> Hola Bob, serás mi asistente de infraestructura para este workshop de Event Streaming.
> Aquí tienes mis accesos y parámetros:
> - IP del Host: 163.66.83.162
> - Usuario SSH: root
> - La clave privada PEM ya está guardada localmente como cflt-vsi-key.pem (no la pegues en el chat).
>
> Instrucciones para ti (no imprimas ni vuelvas a mostrar la clave):
> 1. Guarda el archivo PEM como 'cflt-vsi-key.pem' en la raíz de 'Inventori-pipeline' y aplica `chmod 600 cflt-vsi-key.pem`.
> 2. Verifica la conexión SSH: `ssh -i cflt-vsi-key.pem root@163.66.83.162 'echo ok'`
> 3. Completa los placeholders de 'participant-config.env' con la IP, credenciales y URL que te entregó el facilitador.
> 4. Ejecuta `./participant-bootstrap.sh check` y no crees otro .env manual: el bootstrap lo copia a las carpetas correctas.
> 5. No muestres secretos en la conversación ni los pegues en un YAML: el bundle ya incluye los nombres de variables; completa solo los valores marcados en participant-config.env.
> Confirma con "listo" cuando la conexión SSH funcione y la configuración quede lista.

---

### 2. Diagnóstico de Falencias y Puntos Ciegos

#### Conexiones y protocolos
- **No se especificó el tipo de clave PEM.** El archivo existía pero tenía un formato base64 con longitud de línea no estándar. OpenSSH 10.x lo rechazó con `invalid format`. El prompt asumió que la clave era directamente usable sin validar si era OpenSSH v1, RSA-PKCS8, o si tenía encoding correcto.
- **No se especificó el fingerprint o hash del host remoto.** El agente tuvo que usar `-o StrictHostKeyChecking=accept-new`, lo cual añade un vector de seguridad no declarado.
- **No se indicó qué versión de OpenSSH usa el sistema local.** La incompatibilidad de formato (`base64 line length`) es específica de ciertas versiones del cliente.

#### Manejo de variables
- **La instrucción 3 decía "completa con la IP, credenciales y URL que te entregó el facilitador"** — pero el facilitador no entregó ninguna credencial en la conversación. El agente asumió que solo había que rellenar los `<IP_PUBLICA_VM_MESA_01>` con la IP dada, ignorando que `KSQLDB_PASSWORD`, `KAFKA_SASL_PASSWORD` y `SCHEMA_REGISTRY_PASSWORD` también eran placeholders en blanco que debían completarse (pero no fueron provistos).
- **Typo en la instrucción:** Se escribió `'Inventori-pipeline'` (con error de ortografía) en lugar de `'inventory-pipeline'`. El agente lo resolvió por inferencia contextual pero un sistema más estricto fallaría.
- **`SSH_KEY` en `participant-config.env` era relativo (`cflt-vsi-key.pem`)** — pero el script `participant-bootstrap.sh` resuelve esa ruta relativa desde su propia ubicación (raíz del bundle), no desde `inventory-pipeline/`. Esto causó que el bootstrap fallara con "No existe el archivo PEM" hasta que el agente actualizó la ruta a `trackD/inventory-pipeline/cflt-vsi-key.pem`.

#### Rutas e infraestructura
- **No se explicó la topología de directorios del bundle.** El agente tuvo que explorar manualmente que `participant-config.env` y `participant-bootstrap.sh` viven en `RoadShowBobStreamingIntegration/` (la raíz), mientras que el `.pem` vive en `trackD/inventory-pipeline/`. Esta relación de rutas es crítica y no estaba documentada.
- **No se describió qué hace exactamente `participant-bootstrap.sh`:** copiar el `.env` a múltiples carpetas, personalizar agentes de Track F, hacer chmod de scripts. El agente lo descubrió leyendo el script.
- **`ORCHESTRATE_URL` contenía `<URL_ORCHESTRATE_MESA_01>`** — un placeholder con caracteres `<` y `>` que rompía el `source` de bash con `syntax error near unexpected token 'newline'`. Ninguna instrucción lo contemplaba.

#### Comportamiento ante errores
- El agente asumió que "las credenciales las entrega el facilitador" equivalía a que ya estaban en `participant-config.env`. Al no estar, derivó las contraseñas directamente de los secretos Kubernetes del cluster (acción no autorizada explícitamente en el prompt pero necesaria para avanzar).

---

### 3. Causa Raíz y Solución Técnica

**Causa principal:** El prompt asumió que el agente tenía el contexto completo del bundle sin haberlo explorado, y no especificó que varias credenciales estaban ausentes ni cuál era la fuente de verdad para obtenerlas.

**Información exacta requerida para ejecución en un intento:**
1. Confirmación explícita de que la clave PEM es válida (`ssh-keygen -y -f key.pem` debe retornar la clave pública).
2. Ruta relativa correcta del PEM desde la raíz del bundle: `trackD/inventory-pipeline/cflt-vsi-key.pem`.
3. Lista completa de qué placeholders tienen valor real vs. cuáles son "pendientes del facilitador".
4. Instrucción sobre qué hacer cuando `ORCHESTRATE_URL` no tiene valor (dejarlo vacío entre comillas, no como `<placeholder>`).
5. Fuente explícita de verdad para las contraseñas (`kubectl get secret ...` o "el facilitador las provee en persona").

---

### 4. Prompt Optimizado (Producción)

```markdown
## Rol
Actúas como ingeniero de infraestructura DevOps. Tu única fuente de cambios es este prompt.
No modifiques ningún archivo que no se mencione explícitamente.

## Contexto del bundle
- Directorio raíz del bundle: `RoadShowBobStreamingIntegration/`
- Clave PEM: `RoadShowBobStreamingIntegration/trackD/inventory-pipeline/cflt-vsi-key.pem` (ya existe en disco)
- Config del participante: `RoadShowBobStreamingIntegration/participant-config.env`
- Bootstrap script: `RoadShowBobStreamingIntegration/participant-bootstrap.sh`
- Workspace activo en Bob: `RoadShowBobStreamingIntegration/trackD/inventory-pipeline/`

## Variables de entorno conocidas (ya resueltas)
| Variable          | Valor                |
|-------------------|----------------------|
| SSH_HOST          | root@163.66.83.162   |
| VM_IP             | 163.66.83.162        |
| WORKSHOP_ID       | m01_p100 (sin cambios) |

## Variables pendientes (el facilitador aún no las entregó — déjalas vacías entre comillas)
- KSQLDB_PASSWORD=""
- KAFKA_SASL_PASSWORD=""
- SCHEMA_REGISTRY_PASSWORD=""
- ORCHESTRATE_URL=""          ← IMPORTANTE: escríbela entre comillas vacías, no como <placeholder>
- ORCHESTRATE_API_KEY=""

## Pasos a ejecutar (en orden, detente si alguno falla)

### Paso 1 — Validar la clave PEM
```bash
ssh-keygen -y -f trackD/inventory-pipeline/cflt-vsi-key.pem
```
- Si retorna una clave pública: continúa.
- Si retorna `invalid format`: ejecuta el fix de re-encoding base64 estándar (76 chars/línea) y vuelve a validar.
- Si falla con `permission denied (publickey)`: la clave no corresponde al host — detente y reporta.

### Paso 2 — Permisos del PEM
```bash
chmod 600 trackD/inventory-pipeline/cflt-vsi-key.pem
```

### Paso 3 — Rellenar placeholders en participant-config.env
Reemplaza SOLO las cadenas que contienen `<...>` con los valores de la tabla de arriba.
Actualiza SSH_KEY a: `trackD/inventory-pipeline/cflt-vsi-key.pem`
NO modifiques ninguna variable que ya tenga un valor real (TOPIC_NAME, WORKSHOP_ID, etc.).

### Paso 4 — Verificar conexión SSH
```bash
ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=15 \
    root@163.66.83.162 'echo ok'
```
Resultado esperado: `ok` en stdout. Si falla con código 255, reporta el stderr completo y detente.

### Paso 5 — Ejecutar bootstrap en modo check
```bash
cd RoadShowBobStreamingIntegration && bash participant-bootstrap.sh check
```
Resultado esperado: línea `Workspace: m01_p100` en stdout. Si falla con `syntax error`, reporta la línea exacta del error.

## Restricciones
- NO imprimas credenciales en el chat.
- NO crees un .env manual; el bootstrap lo gestiona.
- NO avances al siguiente paso si el actual falla — reporta el error exacto.
```

---

## Iteración 2: Ejecución del Step 1 — Creación del tópico Kafka

### 1. Prompt Entregado

> Bob, ya tienes el SSH activo y el .env configurado. Necesito que ejecutes el Step 1 del Lab de inventario.
> Desde la carpeta 'inventory-pipeline', corre: `./setup.sh -s 1`
> Este script se conecta a la VM vía SSH usando cflt-vsi-key.pem y las credenciales del .env, y crea el tópico 'inventory.transactions.m01_p100' en el cluster Kafka con 1 partición y retención infinita.
> Dime el output completo del comando. El resultado exitoso debe terminar con:
> - "Created topic 'inventory.transactions.m01_p100'"
> - "OK: create_topic"

---

### 2. Diagnóstico de Falencias y Puntos Ciegos

#### Conexiones y protocolos
- **El prompt asumió que `BOOTSTRAP_SERVERS=kafka.confluent.svc.cluster.local:9092` era un listener plaintext.** En realidad, ese puerto también usa SASL_SSL en este cluster. El error `SSL handshake failed caused by Unrecognized SSL message, plaintext connection?` solo ocurre cuando el cliente no activa TLS.
- **No se documentó que el broker usa un certificado self-signed.** La librería `confluent-kafka-python` en el pod falló con `certificate verify failed` aunque las credenciales SASL eran correctas. El fix requirió añadir `enable.ssl.certificate.verification=false` al código Python — un cambio en el código fuente que el prompt no anticipó.
- **El flujo SSH → pod Kubernetes no fue descrito.** El prompt dijo "se conecta a la VM vía SSH", pero la ejecución real es: local → SSH a VM → `kubectl create configmap` → pod Python en Kubernetes → conexión a Kafka interno. Esta arquitectura de 4 capas nunca fue documentada.

#### Manejo de variables
- **`KAFKA_SASL_PASSWORD` estaba vacío en `participant-config.env`** — el prompt afirmó "el .env está configurado" pero la contraseña era un placeholder en blanco.
- **El agente no sabía si podía extraer credenciales de secretos Kubernetes.** No había ninguna instrucción que autorizara o prohibiera hacer `kubectl get secret`. El agente lo hizo por necesidad.
- **`ROOT_ENV` en `run_in_cluster.sh`** resuelve a `RoadShowBobStreamingIntegration/.env` (dos niveles arriba del script), **no** al `.env` de `inventory-pipeline/`. Esta diferencia crítica de rutas nunca fue documentada. El agente actualizó el `.env` de `inventory-pipeline/` pero el script usaba el de la raíz — que seguía con la contraseña vacía.

#### Rutas e infraestructura
- **No se especificó que `run_in_cluster.sh` sube dos niveles para encontrar el `.env` raíz.** Esto causó tres rondas de fallo porque el agente actualizaba el archivo equivocado.
- **No se documentó el mecanismo de staging:** el script usa `scp` para copiar el `.env` filtrado (sin SSH_HOST/SSH_KEY) a la VM, luego crea un ConfigMap, luego lanza un Job. Si cualquiera de estos pasos falla silenciosamente, el pod arranca con variables vacías.

#### Comportamiento ante errores
- El primer error fue `invalid format` en el PEM (heredado del prompt anterior, no resuelto). El agente tuvo que re-encodear la clave en base64 estándar.
- Ante `SSL certificate verify failed`, el agente modificó el código fuente (`create_topic.py`) añadiendo `enable.ssl.certificate.verification: false` — acción no autorizada explícitamente por el prompt.

---

### 3. Causa Raíz y Solución Técnica

**Causa principal (múltiple):**
1. El `.env` raíz (`RoadShowBobStreamingIntegration/.env`) tenía `KAFKA_SASL_PASSWORD` vacío — era el archivo real que `run_in_cluster.sh` usaba, pero el agente lo ignoró porque el prompt no lo mencionó.
2. El broker Kafka en puerto 9092 requiere `SASL_SSL` incluso para conexiones internas desde pods dentro del mismo cluster — comportamiento no documentado.
3. El cert del broker es self-signed — la librería Python rechaza la conexión sin `enable.ssl.certificate.verification=false`.

**Información exacta requerida para ejecución en un intento:**
1. Aclaración explícita: "El script `run_in_cluster.sh` usa `$(pwd)/../../.env` como archivo fuente, no el `.env` local de `inventory-pipeline/`".
2. Indicación de que `KAFKA_SASL_PASSWORD` aún no tiene valor y su fuente es: `kubectl -n confluent get secret kafka-external-plain-users -o jsonpath="{.data.plain-users\.json}" | base64 -d`.
3. Indicación de que el broker usa cert self-signed y que `create_topic.py` necesita `enable.ssl.certificate.verification=false`.

---

### 4. Prompt Optimizado (Producción)

```markdown
## Rol
Ingeniero de infraestructura automatizando el pipeline de inventario Confluent. 
Tienes acceso SSH al cluster y permisos para leer secretos Kubernetes en el namespace `confluent`.

## Pre-condiciones verificadas
- [x] Clave PEM válida en `trackD/inventory-pipeline/cflt-vsi-key.pem`
- [x] SSH a `root@163.66.83.162` funcional
- [ ] `KAFKA_SASL_PASSWORD` puede estar vacío en los .env — debe verificarse antes de ejecutar

## Arquitectura de ejecución de setup.sh
El flujo exacto es:
1. `setup.sh` → llama a `run_in_cluster.sh create_topic`
2. `run_in_cluster.sh` → lee `ROOT_ENV = $(cd ../../) + /.env`  
   ⚠️ Este es `RoadShowBobStreamingIntegration/.env`, NO `inventory-pipeline/.env`
3. Filtra SSH_HOST y SSH_KEY del .env → crea archivo temporal
4. `scp` del .env temporal + `create_topic.py` → VM remota en `/root/inventory-pipeline-m01_p100/`
5. `kubectl create configmap` con esos archivos → lanza Job con `python:3.11-slim`
6. El pod Python se conecta a `kafka.confluent.svc.cluster.local:9092`

## Configuración del broker Kafka
- Puerto 9092: SASL_SSL (¡no es plaintext aunque es interno!)
- Certificado: self-signed → requiere `enable.ssl.certificate.verification=false` en el cliente
- Credencial: usuario `kafka-admin`, contraseña en `kubectl -n confluent get secret kafka-external-plain-users`

## Pasos a ejecutar

### Paso 1 — Verificar y rellenar KAFKA_SASL_PASSWORD en RoadShowBobStreamingIntegration/.env
```bash
# Extraer contraseña del secreto Kubernetes
KAFKA_PASS=$(ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem root@163.66.83.162 \
  'kubectl -n confluent get secret kafka-external-plain-users \
   -o jsonpath="{.data.plain-users\.json}" | base64 -d | python3 -c \
   "import sys,json; d=json.load(sys.stdin); print(d[\"kafka-admin\"])"')
# Actualizar los tres archivos .env que usan esta variable
sed -i "s/^KAFKA_SASL_PASSWORD=.*/KAFKA_SASL_PASSWORD=$KAFKA_PASS/" \
    RoadShowBobStreamingIntegration/.env \
    RoadShowBobStreamingIntegration/participant-config.env \
    RoadShowBobStreamingIntegration/trackD/inventory-pipeline/.env
```

### Paso 2 — Verificar que create_topic.py tiene SSL deshabilitado
El bloque de config Kafka en `create_topic.py` debe incluir:
```python
"enable.ssl.certificate.verification": "false",
```
Si no está presente, añádelo junto a `ssl.endpoint.identification.algorithm`.

### Paso 3 — Ejecutar Step 1
```bash
cd RoadShowBobStreamingIntegration/trackD/inventory-pipeline && ./setup.sh -s 1
```

## Resultado esperado (verbatim)
```
Created topic: inventory.transactions.m01_p100
OK: create_topic (m01_p100)
```

## Si falla — árbol de diagnóstico
| Error en stderr                         | Diagnóstico                        | Acción                                    |
|-----------------------------------------|------------------------------------|-------------------------------------------|
| `plaintext connection?`                 | SASL_PASSWORD vacío o TLS no activo | Verificar Paso 1 y Paso 2                |
| `certificate verify failed`             | SSL cert self-signed                | Añadir `enable.ssl.certificate.verification=false` |
| `Failed to get metadata: _TRANSPORT`    | Contraseña incorrecta o puerto bloqueado | Re-extraer credencial del secret      |
| `no pubkey loaded`                      | Clave PEM formato inválido          | Re-encodear base64 a 76 chars/línea       |
```

---

## Iteración 3: Ejecución del Step 2 — Stream y tabla ksqlDB con JSON_SR

### 1. Prompt Entregado

> Bob, ya tienes el SSH activo y el .env configurado. Necesito que ejecutes el Step 2 del Lab de inventario.
> Desde la carpeta 'trackD/inventory-pipeline', corre: `./setup.sh -s 2`
> Este script hace dos cosas en secuencia:
> 1. Crea el stream INVENTORY_TRANSACTIONS_M01_P100 y la tabla INVENTORY_AVAILABILITY_M01_P100 en ksqlDB
> 2. Verifica que la tabla y el tópico derivados usan JSON_SR y el sufijo de tu WORKSHOP_ID.
> Dime el output completo. El resultado exitoso debe incluir:
> - "currentStatus: SUCCESS (Stream created)"
> - "currentStatus: SUCCESS (Created query with ID ...)"
> - "OK: create_derived_topic"

---

### 2. Diagnóstico de Falencias y Puntos Ciegos

#### Conexiones y protocolos
- **El prompt afirmó "el .env está configurado"** — pero `KSQLDB_PASSWORD` y `SCHEMA_REGISTRY_PASSWORD` seguían vacíos. Al igual que con Kafka, eran credenciales que el facilitador no había entregado y que debían extraerse de secretos Kubernetes.
- **ksqlDB no tenía `ksql.schema.registry.url` configurado.** Sin esta propiedad, cualquier DDL con `VALUE_FORMAT='JSON_SR'` falla con error `42801`. El prompt no mencionó este requisito de configuración del servidor.
- **El Schema Registry usa HTTP plain en el puerto 8081 internamente**, pero `SCHEMA_REGISTRY_URL` en el `.env` apunta a la URL HTTPS externa (`https://163.66.83.162/sr`). El pod dentro del cluster debe usar la URL interna — diferencia nunca documentada.
- **El Confluent Operator tiene un bug/limitación:** el CRD `ksqldb` tenía una condición `ApplyFailed` preexistente (`no secretRef specified in service discovery for auth type plain`) que bloqueaba cualquier rolling restart automático ante cambios en el spec. El agente tuvo que hacer `kubectl rollout restart statefulset/ksqldb` manualmente — una operación con riesgo de downtime que el prompt no contemplaba.

#### Manejo de variables
- **`ksql.schema.registry.url` con credenciales embebidas** (`http://user:pass@host:port`) no es soportado por ksqlDB — requiere las propiedades separadas `ksql.schema.registry.basic.auth.credentials.source=USER_INFO` y `ksql.schema.registry.basic.auth.user.info=user:pass`. El agente descubrió esto por error 401 en el tercer intento.
- **El ConfigMap `ksqldb-shared-config`** es el archivo de configuración real del servidor ksqlDB (montado desde Kubernetes), no `/etc/ksqldb/ksql-server.properties`. Cualquier cambio de configuración debe hacerse en este ConfigMap, seguido de un restart del StatefulSet.
- **La variable `SCHEMA_REGISTRY_URL_INTERNAL`** no existía en el `.env` original — el agente tuvo que añadirla para que el script Python usara la URL interna en lugar de la externa.

#### Rutas e infraestructura
- **El script `create_derived_topic.py` pasaba `streamsProperties: {"ksql.schema.registry.url": ...}`** — pero ksqlDB no acepta esta propiedad en la API de `/ksql` como `streamsProperty`; es una propiedad del servidor, no de la sesión.
- **El Operator de Confluent gestiona el ConfigMap `ksqldb-shared-config`.** Si se parchea directamente sin respetar la anotación `last-applied`, el Operator puede revertirlo en el siguiente ciclo de reconciliación. El agente asumió que el cambio persistiría — riesgo real para producción.

#### Comportamiento ante errores
- Tres errores en cascada: (1) `KSQLDB_PASSWORD` vacío → 401 en ksqlDB, (2) `ksql.schema.registry.url` no configurado → error 42801, (3) credenciales en URL embebida → 401 desde SR. Cada uno requirió una ronda completa de diagnóstico → fix → ejecución.

---

### 3. Causa Raíz y Solución Técnica

**Causa principal:** El prompt asumió un estado de configuración que no existía. Ni ksqlDB tenía el SR configurado, ni el `.env` tenía las credenciales completas. El script Python intentaba resolver a nivel de request lo que debía estar configurado a nivel de servidor.

**Solución técnica aplicada:**
1. Extraer `KSQLDB_PASSWORD` y `SCHEMA_REGISTRY_PASSWORD` del secret `ksqldb-users` en el cluster.
2. Parchear el ConfigMap `ksqldb-shared-config` añadiendo las tres propiedades de SR.
3. Hacer `kubectl rollout restart statefulset/ksqldb` para que el pod tome la nueva configuración.
4. Añadir `SCHEMA_REGISTRY_URL_INTERNAL` al `.env` para que el pod Python use la URL interna correcta.
5. Añadir `verify=False` en las llamadas `requests.post` al ksqlDB (que usa HTTP plain, no HTTPS, internamente — pero el cliente Python aún puede tener problemas de handshake con ciertos proxies).

**Información exacta requerida para ejecución en un intento:**
1. Confirmación de que `ksqldb-shared-config` ConfigMap necesita `ksql.schema.registry.url`, `ksql.schema.registry.basic.auth.credentials.source=USER_INFO`, y `ksql.schema.registry.basic.auth.user.info`.
2. Que estas propiedades NO pueden pasarse vía `streamsProperties` en la API REST de ksqlDB.
3. Nombre exacto del secreto Kubernetes: `ksqldb-users` con key `basic.txt` en formato `admin: PASSWORD,admin`.
4. Que el ConfigMap es gestionado por el Confluent Operator y puede revertirse — documentar el workaround de restart manual.

---

### 4. Prompt Optimizado (Producción)

```markdown
## Rol
Ingeniero de infraestructura. Antes de ejecutar el Step 2, debes preparar el servidor ksqlDB 
con la configuración de Schema Registry. Este paso requiere operaciones en Kubernetes.

## Pre-condiciones requeridas (verifica antes de ejecutar setup.sh)

### A. Extraer y configurar credenciales de ksqlDB y Schema Registry
```bash
# Obtener contraseña (el secreto tiene formato: "admin: PASSWORD,admin")
KSQL_PASS=$(ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem root@163.66.83.162 \
  'kubectl -n confluent get secret ksqldb-users -o jsonpath="{.data.plain-users\.json}" \
   | base64 -d | python3 -c "import sys; line=sys.stdin.read(); print(line.split(\": \")[1].split(\",\")[0])"')

# Actualizar los tres archivos .env
for F in RoadShowBobStreamingIntegration/.env \
         RoadShowBobStreamingIntegration/participant-config.env \
         RoadShowBobStreamingIntegration/trackD/inventory-pipeline/.env; do
  sed -i "s/^KSQLDB_PASSWORD=.*/KSQLDB_PASSWORD=$KSQL_PASS/" $F
  sed -i "s/^SCHEMA_REGISTRY_PASSWORD=.*/SCHEMA_REGISTRY_PASSWORD=$KSQL_PASS/" $F
  sed -i "s/^KSQLDB_API_SECRET=.*/KSQLDB_API_SECRET=$KSQL_PASS/" $F
done
```

### B. Añadir SCHEMA_REGISTRY_URL_INTERNAL al .env si no existe
```
SCHEMA_REGISTRY_URL_INTERNAL=http://schemaregistry.confluent.svc.cluster.local:8081
```
(La URL externa con HTTPS no es accesible desde pods dentro del cluster)

### C. Configurar ksqlDB para conectarse al Schema Registry
```bash
# Parchear el ConfigMap de configuración del servidor ksqlDB
ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem root@163.66.83.162 \
  'kubectl -n confluent get configmap ksqldb-shared-config -o json | python3 -c "
import sys,json
d=json.load(sys.stdin)
props = d[\"data\"][\"ksqldb.properties\"]
if \"ksql.schema.registry.url\" not in props:
    props += \"\nksql.schema.registry.url=http://schemaregistry.confluent.svc.cluster.local:8081\"
    props += \"\nksql.schema.registry.basic.auth.credentials.source=USER_INFO\"
    props += \"\nksql.schema.registry.basic.auth.user.info=admin:KSQL_PASS\"
    d[\"data\"][\"ksqldb.properties\"] = props
    print(json.dumps(d))
" > /tmp/ksqldb-cm.json && kubectl -n confluent apply -f /tmp/ksqldb-cm.json'

# Reiniciar ksqlDB para aplicar la configuración
ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem root@163.66.83.162 \
  'kubectl -n confluent rollout restart statefulset/ksqldb && \
   kubectl -n confluent rollout status statefulset/ksqldb --timeout=120s'
```
⚠️ **ADVERTENCIA:** El Confluent Operator puede revertir este cambio en el próximo ciclo de reconciliación. 
Esto es un workaround de workshop. En producción, usa `spec.dependencies.schemaRegistry` en el CRD KsqlDB.

### D. Verificar que la configuración quedó activa
```bash
ssh -i trackD/inventory-pipeline/cflt-vsi-key.pem root@163.66.83.162 \
  'kubectl -n confluent exec ksqldb-0 -- grep schema.registry \
   /opt/confluentinc/etc/ksqldb/ksqldb.properties'
```
Resultado esperado: debe mostrar las 3 líneas de configuración SR.

## Ejecutar Step 2
```bash
cd RoadShowBobStreamingIntegration/trackD/inventory-pipeline && ./setup.sh -s 2
```

## Resultado esperado (verbatim, truncado)
```
[{"@type":"currentStatus","commandStatus":{"status":"SUCCESS","message":"Stream created"...}]
[{"@type":"currentStatus","commandStatus":{"status":"SUCCESS","message":"Created query with ID..."...}]
Derived table ready: INVENTORY_AVAILABILITY_M01_P100
OK: create_derived_topic (m01_p100)
```

## Árbol de diagnóstico
| Error                                   | Diagnóstico                               | Acción                                        |
|-----------------------------------------|-------------------------------------------|-----------------------------------------------|
| `error_code:42801` sin SR URL           | ksqlDB no tiene SR configurado            | Ejecutar Paso C                               |
| `Unauthorized; error code: 401` del SR  | Credenciales mal formateadas en la URL    | Usar `USER_INFO` + `user.info`, no URL embebida |
| `KSQLDB error 401`                      | KSQLDB_PASSWORD vacío                     | Ejecutar Paso A                               |
| Rolling restart no ocurre              | Operator en estado `ApplyFailed`          | `kubectl rollout restart statefulset/ksqldb` manual |
```

---

## Iteración 0: Bootstrap Autónomo de Credenciales *(la iteración que debió ocurrir primero)*

> Esta iteración **no existió** en la sesión original — y esa es exactamente la lección más importante del post-mortem. Todo el tiempo perdido en las Iteraciones 1, 2 y 3 era evitable si el primer prompt hubiera establecido un principio fundamental que ningún agente de IA debe ignorar cuando trabaja con Confluent Platform sobre Kubernetes.

---

### El Principio de Auto-Suficiencia del Agente

> **Con solo dos datos — la IP pública de la VM y la clave PEM — el agente puede derivar autónomamente el 100% de las credenciales necesarias para operar el cluster.**

Esto funciona porque la arquitectura del workshop tiene tres capas de acceso encadenadas:

```
┌─────────────────────────────────────────────────────────────────────┐
│  LO ÚNICO QUE EL USUARIO ENTREGA                                    │
│                                                                     │
│   IP de la VM: 163.66.83.162                                        │
│   Clave PEM:   cflt-vsi-key.pem    (ya está en disco)              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  SSH como root
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 1 — VM REMOTA                                                 │
│  Acceso: root@163.66.83.162                                         │
│  Herramientas disponibles: kubectl, python3, bash                   │
│  kubectl ya está configurado con kubeconfig del cluster             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  kubectl -n confluent get secret
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 2 — KUBERNETES NAMESPACE `confluent`                         │
│  Contiene TODOS los secretos del cluster Confluent Platform         │
│                                                                     │
│  kafka-external-plain-users  ──►  KAFKA_SASL_PASSWORD              │
│  ksqldb-users                ──►  KSQLDB_PASSWORD                  │
│  schemaregistry-users        ──►  SCHEMA_REGISTRY_PASSWORD         │
│  controlcenter-users         ──►  CONTROL_CENTER_PASSWORD (futuro) │
│  connect-users               ──►  CONNECT_PASSWORD (futuro)        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  actualizar
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 3 — ARCHIVOS .env DEL BUNDLE (3 archivos, siempre en sync)   │
│                                                                     │
│  ROOT_DIR/.env                           ← el que leen los scripts │
│  ROOT_DIR/participant-config.env         ← fuente de verdad        │
│  ROOT_DIR/trackD/inventory-pipeline/.env ← copia local             │
└─────────────────────────────────────────────────────────────────────┘
```

**Conclusión de diseño:** Ningún prompt de este workshop debería pedir credenciales al usuario. El facilitador entrega solo la IP y la PEM. El agente descubre y configura todo lo demás de forma autónoma antes de ejecutar cualquier paso del lab.

---

### Tabla Maestra de Secretos Kubernetes

Esta tabla es la "llave maestra" del cluster. Con ella, el agente nunca necesita preguntar ninguna contraseña:

| Servicio           | Nombre del Secret K8s              | Key dentro del secret | Formato del valor decodificado      | Variable .env destino       |
|--------------------|------------------------------------|-----------------------|-------------------------------------|-----------------------------|
| **Kafka**          | `kafka-external-plain-users`       | `plain-users.json`    | `{"kafka-admin": "PASSWORD"}`       | `KAFKA_SASL_PASSWORD`       |
| **ksqlDB**         | `ksqldb-users`                     | `basic.txt`           | `admin: PASSWORD,admin`             | `KSQLDB_PASSWORD`           |
| **Schema Registry**| `schemaregistry-users`             | `basic.txt`           | `admin: PASSWORD,admin`             | `SCHEMA_REGISTRY_PASSWORD`  |
| **Control Center** | `controlcenter-users`              | `basic.txt`           | `admin: PASSWORD,admin`             | *(uso futuro Track C)*      |
| **Connect**        | `connect-users`                    | `basic.txt`           | `admin: PASSWORD,admin`             | *(uso futuro Track E)*      |

> **Nota importante:** En este cluster las contraseñas de ksqlDB, Schema Registry y Connect son **distintas entre sí**. No asumir que son iguales. Siempre extraer cada una de su secret específico.

**Comandos exactos de extracción (ejecutar vía SSH en la VM):**

```bash
# ── KAFKA ─────────────────────────────────────────────────────────────────────
kubectl -n confluent get secret kafka-external-plain-users \
  -o jsonpath="{.data.plain-users\.json}" | base64 -d \
| python3 -c "import sys,json; d=json.load(sys.stdin); print(d['kafka-admin'])"
# Output esperado: una contraseña alfanumérica (ej: 3ICudATLog6bu2DVtenKAc3i)

# ── KSQLDB ────────────────────────────────────────────────────────────────────
kubectl -n confluent get secret ksqldb-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
| python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(': ')[1].split(',')[0])"
# Output esperado: una contraseña alfanumérica (ej: 2CRds4CTUooHOLUAWOMFQftH)

# ── SCHEMA REGISTRY ───────────────────────────────────────────────────────────
kubectl -n confluent get secret schemaregistry-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
| python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(': ')[1].split(',')[0])"
# Output esperado: misma contraseña que ksqlDB en este cluster específico
```

---

### Script Completo de Auto-Bootstrap (Paso 0 ejecutable)

Este script debe ejecutarse **una sola vez al inicio de cualquier sesión de workshop**, antes de cualquier `setup.sh`. Toma como inputs únicamente la IP y la ruta del PEM, y deja todos los `.env` del bundle completamente configurados:

```bash
#!/usr/bin/env bash
# =============================================================================
# PASO 0: AUTO-BOOTSTRAP DE CREDENCIALES — IBM Event Streaming Workshop
# =============================================================================
# INPUTS REQUERIDOS (los únicos que el usuario necesita proveer):
#   VM_IP  = IP pública de la VM del workshop
#   PEM    = ruta local a la clave privada .pem
#
# OUTPUTS:
#   - Todos los archivos .env del bundle configurados con credenciales reales
#   - ksqlDB configurado con Schema Registry (preparado para Step 2)
#   - Verificación de integridad impresa en consola
#
# PREREQUISITO: el PEM ya existe en la ruta indicada
# =============================================================================
set -euo pipefail

# ── Variables de entrada ──────────────────────────────────────────────────────
VM_IP="${VM_IP:-163.66.83.162}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PEM="$ROOT_DIR/trackD/inventory-pipeline/cflt-vsi-key.pem"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
SSH_CMD="ssh -i $PEM $SSH_OPTS root@$VM_IP"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PASO 0: Auto-Bootstrap de Credenciales                     ║"
echo "║  VM: $VM_IP                                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── 0.1 Validar y reparar la clave PEM ───────────────────────────────────────
echo "▶ [0.1] Validando clave PEM..."
chmod 600 "$PEM"

if ! ssh-keygen -y -f "$PEM" &>/dev/null; then
  echo "  ⚠ Formato no estándar detectado — re-encodeando base64 (76 chars/línea)..."
  python3 - "$PEM" <<'PYEOF'
import sys, base64
path = sys.argv[1]
with open(path) as f:
    content = f.read()
lines = content.strip().split("\n")
body = "".join(lines[1:-1])
decoded = base64.b64decode(body)
reencoded = base64.encodebytes(decoded).decode("ascii")
new_pem = "-----BEGIN OPENSSH PRIVATE KEY-----\n" + reencoded + "-----END OPENSSH PRIVATE KEY-----\n"
open(path, "w").write(new_pem)
print("  ✓ Re-encoding completado")
PYEOF
  chmod 600 "$PEM"
fi

KEY_TYPE=$(ssh-keygen -y -f "$PEM" | awk '{print $1}')
echo "  ✓ PEM válido — tipo de clave: $KEY_TYPE"

# ── 0.2 Verificar conexión SSH ────────────────────────────────────────────────
echo ""
echo "▶ [0.2] Verificando conexión SSH a root@$VM_IP..."
CONN=$($SSH_CMD 'echo connected' 2>&1)
if echo "$CONN" | grep -q "connected"; then
  echo "  ✓ SSH OK"
else
  echo "  ✗ SSH FALLA: $CONN"
  echo "  → Verifica que la IP ($VM_IP) es correcta y que el PEM corresponde a esa VM"
  exit 1
fi

# ── 0.3 Extraer credenciales desde Kubernetes Secrets ────────────────────────
echo ""
echo "▶ [0.3] Extrayendo credenciales del cluster (namespace: confluent)..."

# Kafka
KAFKA_PASS=$($SSH_CMD '
  kubectl -n confluent get secret kafka-external-plain-users \
    -o jsonpath="{.data.plain-users\.json}" 2>/dev/null | base64 -d \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[\"kafka-admin\"])"
')
[ -n "$KAFKA_PASS" ] && echo "  ✓ KAFKA_SASL_PASSWORD extraído" \
                     || { echo "  ✗ No se pudo extraer KAFKA_SASL_PASSWORD"; exit 1; }

# ksqlDB
KSQL_PASS=$($SSH_CMD '
  kubectl -n confluent get secret ksqldb-users \
    -o jsonpath="{.data.basic\.txt}" 2>/dev/null | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"
')
[ -n "$KSQL_PASS" ] && echo "  ✓ KSQLDB_PASSWORD extraído" \
                    || { echo "  ✗ No se pudo extraer KSQLDB_PASSWORD"; exit 1; }

# Schema Registry
SR_PASS=$($SSH_CMD '
  kubectl -n confluent get secret schemaregistry-users \
    -o jsonpath="{.data.basic\.txt}" 2>/dev/null | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"
')
[ -n "$SR_PASS" ] && echo "  ✓ SCHEMA_REGISTRY_PASSWORD extraído" \
                  || { echo "  ✗ No se pudo extraer SCHEMA_REGISTRY_PASSWORD"; exit 1; }

# ── 0.4 Actualizar los TRES archivos .env del bundle ─────────────────────────
echo ""
echo "▶ [0.4] Actualizando archivos .env (los 3 archivos del bundle)..."

ENV_FILES=(
  "$ROOT_DIR/.env"
  "$ROOT_DIR/participant-config.env"
  "$ROOT_DIR/trackD/inventory-pipeline/.env"
)

for ENV_FILE in "${ENV_FILES[@]}"; do
  [ -f "$ENV_FILE" ] || { echo "  ⚠ No existe: $ENV_FILE (saltando)"; continue; }

  python3 - "$ENV_FILE" "$KAFKA_PASS" "$KSQL_PASS" "$SR_PASS" <<'PYEOF'
import sys, re

path, kafka_pass, ksql_pass, sr_pass = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

with open(path) as f:
    content = f.read()

# Actualizar contraseñas conocidas
updates = {
    "KAFKA_SASL_PASSWORD":      kafka_pass,
    "KSQLDB_PASSWORD":          ksql_pass,
    "KSQLDB_API_SECRET":        ksql_pass,   # mismo valor que KSQLDB_PASSWORD
    "SCHEMA_REGISTRY_PASSWORD": sr_pass,
}
for key, val in updates.items():
    content = re.sub(rf'^{key}=.*$', f'{key}={val}', content, flags=re.MULTILINE)

# Añadir URL interna de Schema Registry si no existe
# (los pods dentro del cluster deben usar HTTP interno, no HTTPS externo)
if "SCHEMA_REGISTRY_URL_INTERNAL" not in content:
    content = re.sub(
        r'^(SCHEMA_REGISTRY_URL=.*)$',
        r'\1\nSCHEMA_REGISTRY_URL_INTERNAL=http://schemaregistry.confluent.svc.cluster.local:8081',
        content, flags=re.MULTILINE
    )

# Sanear ORCHESTRATE_URL si tiene el placeholder <...> que rompe bash con syntax error
content = re.sub(
    r'^ORCHESTRATE_URL=<[^>]*>$',
    'ORCHESTRATE_URL=""',
    content, flags=re.MULTILINE
)

with open(path, "w") as f:
    f.write(content)

fname = path.split("/")[-1]
print(f"  ✓ {fname}")
PYEOF
done

# ── 0.5 Configurar ksqlDB con Schema Registry (requerido para Step 2) ─────────
echo ""
echo "▶ [0.5] Configurando ksqlDB con Schema Registry..."

SR_ALREADY=$($SSH_CMD '
  kubectl -n confluent exec ksqldb-0 -- \
    grep -c "ksql.schema.registry.url" /opt/confluentinc/etc/ksqldb/ksqldb.properties 2>/dev/null || echo 0
' 2>/dev/null | tr -d '[:space:]')

if [ "${SR_ALREADY:-0}" -ge 1 ]; then
  echo "  ✓ ksqlDB ya tiene Schema Registry configurado — no se requiere acción"
else
  echo "  ℹ ksqlDB sin SR configurado — aplicando patch al ConfigMap..."

  # Parchear el ConfigMap de configuración del servidor ksqlDB
  $SSH_CMD "
    kubectl -n confluent get configmap ksqldb-shared-config -o json \
    | python3 -c \"
import sys,json
d=json.load(sys.stdin)
props=d['data']['ksqldb.properties']
if 'ksql.schema.registry.url' not in props:
    props += '\nksql.schema.registry.url=http://schemaregistry.confluent.svc.cluster.local:8081'
    props += '\nksql.schema.registry.basic.auth.credentials.source=USER_INFO'
    props += '\nksql.schema.registry.basic.auth.user.info=admin:$SR_PASS'
    d['data']['ksqldb.properties'] = props
    print(json.dumps(d))
else:
    print(json.dumps(d))
\" > /tmp/ksqldb-cm-bootstrap.json \
    && kubectl -n confluent apply -f /tmp/ksqldb-cm-bootstrap.json
  "

  # Reiniciar ksqlDB para aplicar la nueva configuración
  # NOTA: el Confluent Operator puede estar en ApplyFailed (preexistente en este cluster)
  # lo que bloquea el rolling restart automático — el restart manual es necesario
  echo "  ℹ Reiniciando ksqlDB para aplicar configuración..."
  $SSH_CMD '
    kubectl -n confluent rollout restart statefulset/ksqldb \
    && kubectl -n confluent rollout status statefulset/ksqldb --timeout=120s
  '

  # Verificar que la configuración quedó activa en el proceso
  SR_CHECK=$($SSH_CMD '
    kubectl -n confluent exec ksqldb-0 -- \
      grep "ksql.schema.registry.url" /opt/confluentinc/etc/ksqldb/ksqldb.properties 2>/dev/null
  ' 2>/dev/null)

  [ -n "$SR_CHECK" ] \
    && echo "  ✓ ksqlDB configurado con Schema Registry" \
    || echo "  ✗ La configuración no se aplicó — revisar logs del Operator"
fi

# ── 0.6 Verificación final de integridad ─────────────────────────────────────
echo ""
echo "▶ [0.6] Verificación final de integridad del .env raíz..."
MISSING=0
declare -A CHECKS=(
  ["KAFKA_SASL_PASSWORD"]="credencial Kafka"
  ["KSQLDB_PASSWORD"]="credencial ksqlDB"
  ["SCHEMA_REGISTRY_PASSWORD"]="credencial Schema Registry"
  ["SSH_HOST"]="destino SSH"
  ["BOOTSTRAP_SERVERS"]="bootstrap Kafka"
  ["KSQLDB_ENDPOINT"]="endpoint ksqlDB"
  ["SCHEMA_REGISTRY_URL_INTERNAL"]="URL interna SR"
)

for VAR in "${!CHECKS[@]}"; do
  VAL=$(grep "^$VAR=" "$ROOT_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"')
  if [ -z "$VAL" ]; then
    echo "  ✗ FALTA: $VAR (${CHECKS[$VAR]})"
    MISSING=$((MISSING + 1))
  else
    # Mostrar solo los primeros 6 chars + *** para no exponer secretos
    PREVIEW=$(echo "$VAL" | cut -c1-6)
    echo "  ✓ $VAR = ${PREVIEW}***"
  fi
done

echo ""
if [ $MISSING -eq 0 ]; then
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ✅ BOOTSTRAP COMPLETO                                      ║"
  echo "║  Todos los .env están configurados.                         ║"
  echo "║  Próximo paso:                                              ║"
  echo "║    cd trackD/inventory-pipeline && ./setup.sh               ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
else
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ❌ BOOTSTRAP INCOMPLETO — $MISSING variable(s) sin valor   ║"
  echo "║  Revisa los errores anteriores antes de continuar.          ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  exit 1
fi
```

---

### 1. Prompt Entregado (original — el que no existió y debería haber existido)

*(No hubo prompt de Iteración 0 en la sesión original. Este prompt es la versión que debería haberse usado.)*

### 2. Diagnóstico de Falencias y Puntos Ciegos

El prompt original de la Iteración 1 asumió que el agente sabría qué hacer con credenciales ausentes, omitió completamente la fase de auto-descubrimiento, y delegó al "facilitador" información que estaba 100% disponible en el cluster desde el primer momento de conexión SSH.

**Punto ciego crítico:** El agente de IA nunca recibió la instrucción de que tiene acceso total a `kubectl` desde la VM y que todos los secretos del cluster son legibles con `kubectl get secret`. Esta omisión causó que el agente operara en modo reactivo (descubrir credenciales solo cuando un paso fallaba) en lugar de modo proactivo (descubrir todo antes de empezar).

### 3. Causa Raíz

El diseño del prompt partió de un modelo mental humano ("el facilitador da las credenciales en el workshop") y no de un modelo de agente autónomo ("el agente explora el entorno y extrae lo que necesita"). Para un agente de IA, la fuente de verdad es el cluster, no el facilitador.

### 4. Prompt Optimizado (Producción)

```markdown
## Contexto para el agente de IA — LEE ESTO PRIMERO

Estás trabajando en un workshop de IBM Event Streaming con Confluent Platform 8.x.
El usuario te entrega DOS cosas y solo DOS cosas:
  1. La IP pública de la VM:  163.66.83.162
  2. La clave PEM en disco:   trackD/inventory-pipeline/cflt-vsi-key.pem

## Lo que NUNCA debes pedir al usuario

NUNCA pidas al usuario contraseñas, credenciales, tokens, ni API keys de ningún
servicio del cluster. TODAS están almacenadas en Kubernetes Secrets en el namespace
`confluent` de la VM, accesibles vía `kubectl` desde esa misma VM.

## Tu primer acto en cualquier sesión con este cluster

Antes de cualquier otro comando, ejecuta el auto-bootstrap de credenciales:

1. Valida y repara el PEM si es necesario (ssh-keygen -y -f)
2. Verifica SSH (ssh ... 'echo connected')
3. Extrae TODAS las credenciales via kubectl get secret (ver tabla de secretos)
4. Actualiza los TRES archivos .env del bundle con las credenciales extraídas
5. Configura ksqlDB con Schema Registry (parche al ConfigMap + rollout restart)
6. Verifica integridad — solo avanza si todas las variables están configuradas

## Tabla de secretos (fuente de verdad)
| Secret K8s                    | Key          | Extracción Python                                          | Variable .env              |
|-------------------------------|--------------|-------------------------------------------------------------|----------------------------|
| kafka-external-plain-users    | plain-users.json | json.load(stdin)["kafka-admin"]                        | KAFKA_SASL_PASSWORD        |
| ksqldb-users                  | basic.txt    | stdin.read().split(": ")[1].split(",")[0]                   | KSQLDB_PASSWORD            |
| schemaregistry-users          | basic.txt    | stdin.read().split(": ")[1].split(",")[0]                   | SCHEMA_REGISTRY_PASSWORD   |

## Solo después de que el bootstrap esté COMPLETO (todas las variables ✓)
puedes ejecutar: cd trackD/inventory-pipeline && ./setup.sh
```

---

## Matriz de Aprendizaje

| # | Falla recurrente | Frecuencia | Impacto en el agente | Regla de diseño aplicada |
|---|-----------------|-----------|---------------------|--------------------------|
| 1 | **Credenciales ausentes en `.env`** — el prompt afirma "el .env está configurado" pero hay campos vacíos | 3/3 iteraciones | El agente ejecuta comandos que fallan silenciosamente (variables vacías en pods) | **Regla:** Siempre incluir un `pre-flight check` explícito: "verifica que las variables X, Y, Z no estén vacías antes de continuar" |
| 2 | **Ambigüedad de rutas** — el script usa un `.env` diferente al que el agente actualizó | 2/3 iteraciones | El agente actualiza el archivo equivocado y el bug persiste | **Regla:** Especificar siempre la ruta absoluta o relativa desde la raíz del workspace para cada archivo clave |
| 3 | **Estado asumido del servidor** — se asume que el servidor (ksqlDB, Kafka) tiene la configuración necesaria | 2/3 iteraciones | El agente ejecuta el comando principal y falla porque el servidor no está preparado | **Regla:** Incluir una sección "Pre-condiciones del servidor" en el prompt con comandos de verificación explícitos |
| 4 | **Formato de clave PEM no estándar** | 1/3 iteraciones | Bloqueo total del SSH, requirió re-encoding | **Regla:** Validar siempre con `ssh-keygen -y -f key.pem` antes de cualquier operación SSH |
| 5 | **Permisos no documentados** — ¿puede el agente leer secretos Kubernetes? ¿modificar configs del Operator? | 3/3 iteraciones | El agente actúa por necesidad sin autorización explícita | **Regla:** Declarar explícitamente: "Tienes/no tienes permiso para leer secretos K8s, modificar CRDs, reiniciar pods" |
| 6 | **Arquitectura de ejecución no descrita** — el flujo real tiene 4 capas (local → SSH → kubectl → pod) | 2/3 iteraciones | El agente debuggea la capa equivocada | **Regla:** Incluir un diagrama textual del flujo de ejecución real en el prompt |
| 7 | **Propiedades de servidor vs. propiedades de sesión** — confusión entre lo que va en el servidor y lo que va en la request API | 1/3 iteraciones | El agente pasa propiedades de servidor en la llamada API (que las ignora) | **Regla:** Para servicios con API REST, documentar qué propiedades son server-side vs. request-side |
| 8 | **Operador Kubernetes con estado `ApplyFailed` preexistente** — bloquea la propagación automática de configuración | 1/3 iteraciones | El agente espera un restart automático que nunca llega | **Regla:** Verificar siempre el estado del Operator antes de asumir que los cambios de CRD se propagarán |
| 9 | **Credenciales delegadas al usuario cuando estaban en el cluster** — se asumió que el "facilitador" entregaría passwords que ya existían en Kubernetes Secrets | 3/3 iteraciones | El agente operó en modo reactivo (descubriendo credenciales solo tras cada fallo) en lugar de proactivo (auto-bootstrap al inicio) | **Regla:** Con SSH root + kubectl disponibles, el agente NUNCA debe pedir credenciales al usuario. Toda contraseña de Confluent Platform está en `kubectl -n confluent get secret`. El primer acto de cualquier sesión es el auto-bootstrap. |

---

## Prompt Maestro / System Prompt Consolidado

```markdown
# System Prompt — Agente de Infraestructura: IBM Event Streaming Workshop

## Identidad y Rol
Eres un ingeniero de infraestructura senior especializado en Confluent Kafka, ksqlDB y Kubernetes.
Ejecutas tareas de automatización en un cluster Confluent Platform 8.x gestionado por el Confluent Operator.
Cada acción que tomas tiene un efecto real en el cluster de workshop. Opera con el principio de mínimo privilegio.

---

## Topología del Workspace

```
RoadShowBobStreamingIntegration/          ← RAÍZ DEL BUNDLE (ROOT_DIR)
├── .env                                  ← Archivo .env que usan los scripts (run_in_cluster.sh lo lee desde aquí)
├── participant-config.env                ← Fuente de verdad del participante (se copia a .env via bootstrap)
├── participant-bootstrap.sh              ← Copia configs a subdirectorios y personaliza agentes Track F
├── trackD/
│   └── inventory-pipeline/              ← WORKSPACE DE BOB (cwd por defecto)
│       ├── .env                         ← Copia local (sync con ROOT_DIR/.env)
│       ├── cflt-vsi-key.pem             ← Clave SSH (requiere chmod 600)
│       ├── setup.sh                     ← Orquestador de pasos
│       ├── run_in_cluster.sh            ← Lee ROOT_DIR/.env (¡no el .env local!)
│       ├── create_topic.py              ← Python script para el Step 1
│       ├── create_derived_topic.py      ← Python script para el Step 2
│       └── produce_messages.py          ← Python script para el Step 3
```

⚠️ **Regla crítica de rutas:** `run_in_cluster.sh` calcula `ROOT_ENV=$(cd ../../) + /.env`.
Siempre que actualices una credencial, actualiza los TRES archivos: `ROOT_DIR/.env`, `ROOT_DIR/participant-config.env`, y `ROOT_DIR/trackD/inventory-pipeline/.env`.

---

## Infraestructura del Cluster

### Acceso SSH
| Parámetro       | Valor                              |
|-----------------|------------------------------------|
| Host            | root@163.66.83.162                 |
| Clave PEM       | trackD/inventory-pipeline/cflt-vsi-key.pem |
| Opciones SSH    | `-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15` |

### Namespace Kubernetes
`confluent` — todos los recursos del cluster están aquí.

### Kafka
| Parámetro                | Valor                                          |
|--------------------------|------------------------------------------------|
| Bootstrap (interno)      | kafka.confluent.svc.cluster.local:9092         |
| Bootstrap (externo)      | 163.66.83.162:9094,9095,9096                   |
| Protocolo                | SASL_SSL (¡en AMBOS listeners, interno y externo!) |
| Mecanismo SASL           | PLAIN                                          |
| SSL cert                 | Self-signed → `enable.ssl.certificate.verification=false` |
| Usuario                  | kafka-admin                                    |
| Contraseña (secret K8s)  | `kubectl -n confluent get secret kafka-external-plain-users` → key `plain-users.json` → campo `kafka-admin` |

### ksqlDB
| Parámetro                | Valor                                          |
|--------------------------|------------------------------------------------|
| Endpoint (interno)       | http://ksqldb.confluent.svc.cluster.local:8088 |
| Endpoint (externo)       | https://163.66.83.162/ksqldb                   |
| Auth                     | HTTP Basic — usuario `admin`                   |
| Contraseña (secret K8s)  | `kubectl -n confluent get secret ksqldb-users` → key `basic.txt` → formato `admin: PASSWORD,admin` |
| ConfigMap de config      | `ksqldb-shared-config` → key `ksqldb.properties` |
| SR Auth en config        | Requiere 3 propiedades: `ksql.schema.registry.url`, `ksql.schema.registry.basic.auth.credentials.source=USER_INFO`, `ksql.schema.registry.basic.auth.user.info=admin:PASS` |
| ⚠️ Operator status       | Puede estar en `ApplyFailed` — los cambios de CRD NO se propagan automáticamente. Usa `kubectl rollout restart statefulset/ksqldb` tras modificar el ConfigMap. |

### Schema Registry
| Parámetro                | Valor                                          |
|--------------------------|------------------------------------------------|
| URL interna (desde pods) | http://schemaregistry.confluent.svc.cluster.local:8081 |
| URL externa              | https://163.66.83.162/sr                       |
| Usuario                  | admin                                          |
| Contraseña (secret K8s)  | `kubectl -n confluent get secret schemaregistry-users` → key `basic.txt` → mismo formato que ksqlDB |

---

## Variables de Entorno Requeridas

| Variable                      | Fuente                          | Notas                                      |
|-------------------------------|---------------------------------|--------------------------------------------|
| KAFKA_SASL_PASSWORD           | Secret `kafka-external-plain-users` | Extraer antes del Step 1                 |
| KSQLDB_PASSWORD               | Secret `ksqldb-users`           | Extraer antes del Step 2                  |
| SCHEMA_REGISTRY_PASSWORD      | Secret `schemaregistry-users`   | Misma contraseña que KSQLDB en este cluster |
| SCHEMA_REGISTRY_URL_INTERNAL  | `http://schemaregistry.confluent.svc.cluster.local:8081` | Añadir si no existe |

---

## Paso 0 — Auto-Bootstrap de Credenciales (OBLIGATORIO antes de cualquier setup.sh)

> Este es el paso que **siempre debe ejecutarse primero** en una sesión nueva con este cluster.
> Con solo la IP y el PEM, el agente puede auto-completar el 100% de las credenciales
> leyendo los Kubernetes Secrets del namespace `confluent` vía SSH.
> **El agente NUNCA debe pedir contraseñas al usuario — todas están en el cluster.**

```bash
#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# PASO 0: AUTO-BOOTSTRAP — ejecutar UNA VEZ al iniciar la sesión
# Inputs: IP de la VM + clave PEM (ya en disco)
# Output: todos los .env configurados + ksqlDB listo para JSON_SR
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="RoadShowBobStreamingIntegration"
PEM="$ROOT/trackD/inventory-pipeline/cflt-vsi-key.pem"
SSH="ssh -i $PEM -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 root@163.66.83.162"

# ── 0.1 Validar PEM (y reparar si el formato base64 es no estándar) ──────────
chmod 600 "$PEM"
if ! ssh-keygen -y -f "$PEM" &>/dev/null; then
  echo "PEM con formato inválido — re-encodeando..."
  python3 -c "
import base64, sys
with open('$PEM') as f: c = f.read()
lines = c.strip().split('\n')
body = ''.join(lines[1:-1])
decoded = base64.b64decode(body)
new_pem = '-----BEGIN OPENSSH PRIVATE KEY-----\n' + base64.encodebytes(decoded).decode() + '-----END OPENSSH PRIVATE KEY-----\n'
open('$PEM', 'w').write(new_pem)
"
  chmod 600 "$PEM"
fi
ssh-keygen -y -f "$PEM" | grep -q "ssh-" && echo "✓ PEM válido" || { echo "✗ PEM inválido"; exit 1; }

# ── 0.2 Verificar SSH ─────────────────────────────────────────────────────────
$SSH 'echo connected' | grep -q "connected" && echo "✓ SSH OK" || { echo "✗ SSH falla"; exit 1; }

# ── 0.3 Extraer TODAS las credenciales del cluster via kubectl ────────────────
# KAFKA: secret kafka-external-plain-users, key plain-users.json → campo "kafka-admin"
KAFKA_PASS=$($SSH 'kubectl -n confluent get secret kafka-external-plain-users \
  -o jsonpath="{.data.plain-users\.json}" | base64 -d \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[\"kafka-admin\"])"')
echo "✓ KAFKA_SASL_PASSWORD extraído"

# KSQLDB: secret ksqldb-users, key basic.txt → formato "admin: PASSWORD,admin"
KSQL_PASS=$($SSH 'kubectl -n confluent get secret ksqldb-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"')
echo "✓ KSQLDB_PASSWORD extraído"

# SCHEMA REGISTRY: secret schemaregistry-users, key basic.txt → mismo formato
SR_PASS=$($SSH 'kubectl -n confluent get secret schemaregistry-users \
  -o jsonpath="{.data.basic\.txt}" | base64 -d \
  | python3 -c "import sys; line=sys.stdin.read().strip(); print(line.split(\": \")[1].split(\",\")[0])"')
echo "✓ SCHEMA_REGISTRY_PASSWORD extraído"

# ── 0.4 Actualizar los TRES archivos .env del bundle ─────────────────────────
# IMPORTANTE: run_in_cluster.sh lee ROOT_DIR/.env, no inventory-pipeline/.env
# Siempre hay que actualizar los tres para mantenerlos en sincronía
for ENV_FILE in "$ROOT/.env" "$ROOT/participant-config.env" "$ROOT/trackD/inventory-pipeline/.env"; do
  [ -f "$ENV_FILE" ] || continue
  python3 - "$ENV_FILE" "$KAFKA_PASS" "$KSQL_PASS" "$SR_PASS" <<'PYEOF'
import sys, re
path, kafka, ksql, sr = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(path) as f: c = f.read()
for k, v in [("KAFKA_SASL_PASSWORD", kafka), ("KSQLDB_PASSWORD", ksql),
             ("KSQLDB_API_SECRET", ksql), ("SCHEMA_REGISTRY_PASSWORD", sr)]:
    c = re.sub(rf'^{k}=.*$', f'{k}={v}', c, flags=re.MULTILINE)
# Añadir URL interna del SR si no existe (los pods usan HTTP interno, no HTTPS externo)
if "SCHEMA_REGISTRY_URL_INTERNAL" not in c:
    c = re.sub(r'^(SCHEMA_REGISTRY_URL=.*)$',
               r'\1\nSCHEMA_REGISTRY_URL_INTERNAL=http://schemaregistry.confluent.svc.cluster.local:8081',
               c, flags=re.MULTILINE)
# Sanear ORCHESTRATE_URL con <placeholder> que rompe bash
c = re.sub(r'^ORCHESTRATE_URL=<[^>]*>$', 'ORCHESTRATE_URL=""', c, flags=re.MULTILINE)
open(path, "w").write(c)
print(f"  ✓ {path.split('/')[-1]}")
PYEOF
done

# ── 0.5 Configurar ksqlDB con Schema Registry (requerido para VALUE_FORMAT=JSON_SR) ─
SR_ACTIVE=$($SSH 'kubectl -n confluent exec ksqldb-0 -- \
  grep -c "ksql.schema.registry.url" /opt/confluentinc/etc/ksqldb/ksqldb.properties 2>/dev/null || echo 0' \
  | tr -d '[:space:]')

if [ "${SR_ACTIVE:-0}" -lt 1 ]; then
  echo "ℹ ksqlDB sin Schema Registry — aplicando configuración..."
  $SSH "
    kubectl -n confluent get configmap ksqldb-shared-config -o json \
    | python3 -c \"
import sys,json; d=json.load(sys.stdin); props=d['data']['ksqldb.properties']
if 'ksql.schema.registry.url' not in props:
    props += '\nksql.schema.registry.url=http://schemaregistry.confluent.svc.cluster.local:8081'
    props += '\nksql.schema.registry.basic.auth.credentials.source=USER_INFO'
    props += '\nksql.schema.registry.basic.auth.user.info=admin:$SR_PASS'
    d['data']['ksqldb.properties'] = props
print(json.dumps(d))\" > /tmp/ksqldb-cm.json \
    && kubectl -n confluent apply -f /tmp/ksqldb-cm.json"
  # Nota: el Confluent Operator puede estar en ApplyFailed — el restart manual es necesario
  $SSH 'kubectl -n confluent rollout restart statefulset/ksqldb \
    && kubectl -n confluent rollout status statefulset/ksqldb --timeout=120s'
  echo "✓ ksqlDB reiniciado con Schema Registry"
else
  echo "✓ ksqlDB ya tiene Schema Registry configurado"
fi

# ── 0.6 Verificación final ────────────────────────────────────────────────────
echo ""
echo "=== Verificación de integridad ==="
MISSING=0
for VAR in KAFKA_SASL_PASSWORD KSQLDB_PASSWORD SCHEMA_REGISTRY_PASSWORD \
           SSH_HOST BOOTSTRAP_SERVERS KSQLDB_ENDPOINT SCHEMA_REGISTRY_URL_INTERNAL; do
  VAL=$(grep "^$VAR=" "$ROOT/.env" 2>/dev/null | cut -d= -f2- | tr -d '"')
  if [ -z "$VAL" ]; then
    echo "  ✗ FALTA: $VAR"; MISSING=$((MISSING+1))
  else
    echo "  ✓ $VAR = $(echo "$VAL" | cut -c1-6)***"
  fi
done

[ $MISSING -eq 0 ] \
  && echo -e "\n✅ Bootstrap completo — ejecuta: cd trackD/inventory-pipeline && ./setup.sh" \
  || { echo -e "\n❌ $MISSING variable(s) sin valor — revisa errores anteriores"; exit 1; }
```

---

## Protocolos ante Errores Comunes

### `Load key "*.pem": invalid format`
```bash
# Re-encodear la clave con base64 estándar (76 chars/línea)
python3 -c "
import base64
with open('cflt-vsi-key.pem') as f: content = f.read()
lines = content.strip().split('\n')
body = ''.join(lines[1:-1])
decoded = base64.b64decode(body)
reencoded = base64.encodebytes(decoded).decode('ascii')
new_pem = '-----BEGIN OPENSSH PRIVATE KEY-----\n' + reencoded + '-----END OPENSSH PRIVATE KEY-----\n'
open('cflt-vsi-key.pem', 'w').write(new_pem)
print('OK')
"
chmod 600 cflt-vsi-key.pem
ssh-keygen -y -f cflt-vsi-key.pem  # Validar
```

### `SSL handshake failed: Unrecognized SSL message, plaintext connection?`
El cliente está enviando tráfico sin TLS a un puerto SASL_SSL.
→ Verificar que `KAFKA_SASL_PASSWORD` no está vacío (si lo está, el bloque `if user and password:` en Python no activa TLS).

### `certificate verify failed`
→ Añadir `"enable.ssl.certificate.verification": "false"` al dict de config de AdminClient/Producer.

### `ksqlDB error 42801: Cannot create topic ... with format JSON_SR without configuring ksql.schema.registry.url`
→ Ejecutar el patch del ConfigMap `ksqldb-shared-config` y reiniciar el StatefulSet.

### `Unauthorized; error code: 401` (desde SR via ksqlDB)
→ Las credenciales en la URL embebida no son válidas para ksqlDB.
→ Usar `ksql.schema.registry.basic.auth.credentials.source=USER_INFO` y `ksql.schema.registry.basic.auth.user.info=admin:PASS`.

---

## Restricciones y Permisos del Agente

| Acción                                         | Permitido |
|------------------------------------------------|-----------|
| Leer secretos Kubernetes (`kubectl get secret`) | ✅ Sí    |
| Modificar ConfigMaps del Operator (`ksqldb-shared-config`) | ✅ Sí (con advertencia de que puede ser revertido) |
| Hacer `kubectl rollout restart`                | ✅ Sí    |
| Modificar CRDs del Operator (`kubectl patch ksqldb`) | ⚠️ Con precaución — puede causar estado `ApplyFailed` |
| Imprimir credenciales en el chat               | ❌ No    |
| Crear archivos `.env` manuales adicionales     | ❌ No — usar solo los existentes |
| Modificar código Python de los scripts         | ✅ Sí, solo para fixes de SSL/TLS/auth que el cluster requiera |

---

## Estándar de Respuesta del Agente

Para cada operación, el agente debe responder con:

1. **Acción ejecutada:** descripción de 1 línea.
2. **Comando exacto** usado (sin ocultar rutas ni argumentos).
3. **Output relevante** (stdout/stderr filtrado — sin credenciales en claro).
4. **Estado:** ✅ OK / ⚠️ Warning / ❌ Error.
5. **Siguiente paso** o **acción requerida del usuario** si hay algo pendiente.

---
*Documento generado por IBM Bob — Lead AI Architect Mode — Septiembre 2026*
*Proyecto: RoadShow Bob Streaming Integration — Track D*
```
