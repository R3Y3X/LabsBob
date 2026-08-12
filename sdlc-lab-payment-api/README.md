# SaaS Payment & Billing API — Proyecto Base del Lab SDLC

Proyecto base para el laboratorio **"SaaS Payment API: de deuda técnica a producción"** con IBM Bob.

Este repositorio contiene una API REST de pagos y cupones con **vulnerabilidades intencionales** que deberás detectar y corregir durante el laboratorio, guiado por IBM Bob a lo largo de las 6 fases del ciclo de vida del software.

---

## 🗂️ Estructura del proyecto

```
sdlc-lab-payment-api/
├── src/
│   ├── app.js              # Configuración de Express y rutas
│   ├── index.js            # Entry point del servidor
│   ├── database.js         # Inicialización de SQLite y datos seed
│   └── routes/
│       ├── payment.js      # ⚠️  Contiene vulnerabilidades intencionales
│       └── coupon.js       # 🚧  Pendiente de implementación (tu tarea)
├── __tests__/
│   └── payment.test.js     # Suite de pruebas Jest (algunos tests fallan a propósito)
├── openapi.yaml            # Contrato de la API (fuente de verdad del diseño)
├── Dockerfile              # Imagen Docker (mejorable)
├── .github/
│   └── workflows/
│       └── deploy.yml      # Pipeline CI/CD con GitHub Actions
├── .env.example            # Variables de entorno requeridas
└── README.md               # Este archivo
```

---

## 🚀 Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env y define API_SECRET_KEY con un valor seguro
```

### 3. Iniciar el servidor

```bash
npm start
# Servidor en http://localhost:3000
```

### 4. Verificar que funciona

```bash
curl http://localhost:3000/health
```

---

## 🧪 Ejecutar pruebas

```bash
npm test
```

> **Nota del lab:** Al ejecutar las pruebas por primera vez, varios tests **fallarán intencionalmente**. Es parte del ejercicio — tu misión es corregir el código hasta que todos pasen.

---

## 🔌 Endpoints disponibles

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/health` | Health check | No |
| GET | `/api/v1/payments/:userId` | Pagos de un usuario | Sí |
| GET | `/api/v1/payments/detail/:id` | Detalle de un pago | Sí |
| POST | `/api/v1/coupons/apply` | Aplicar cupón de descuento | No |
| GET | `/api/v1/coupons` | Listar cupones disponibles | No |

### Autenticación

Los endpoints de Payments requieren el header `x-api-key`.

```bash
curl -H "x-api-key: <tu_api_key>" http://localhost:3000/api/v1/payments/user_123
```

### Ejemplos con datos seed

```bash
# Listar pagos del usuario de prueba
curl -H "x-api-key: <tu_api_key>" http://localhost:3000/api/v1/payments/user_123

# Ver cupones disponibles
curl http://localhost:3000/api/v1/coupons

# Aplicar cupón (después de implementarlo)
curl -X POST http://localhost:3000/api/v1/coupons/apply \
  -H "Content-Type: application/json" \
  -d '{"code": "IBMBOB20", "originalAmount": 249}'
```

---

## 🔴 Vulnerabilidades a corregir (fases del lab)

Durante el laboratorio, IBM Bob te guiará para detectar y corregir:

1. **`src/routes/payment.js` línea ~21** — Secreto hardcoded en el middleware de autenticación
2. **`src/routes/payment.js` línea ~32** — Inyección SQL en las consultas a la base de datos

Y para implementar:

3. **`src/routes/coupon.js`** — Endpoint `POST /api/v1/coupons/apply` completo

---

## 📋 Datos seed disponibles

La base de datos se inicializa automáticamente con datos de ejemplo:

**Pagos:**
- `user_123` → 2 pagos (completed, completed)
- `user_456` → 1 pago (pending)
- `user_789` → 1 pago (failed)

**Cupones:**
- `IBMBOB20` → 20% de descuento (activo)
- `LAUNCH50` → 50% de descuento (activo)
- `EXPIRED10` → 10% de descuento (inactivo — para probar el caso de error)
- `DEVFEST15` → 15% de descuento (activo)

---

## 🧰 Stack tecnológico

| Tecnología | Uso |
|------------|-----|
| Node.js 18 | Runtime |
| Express 4 | Framework web |
| better-sqlite3 | Base de datos embebida |
| dotenv | Gestión de variables de entorno |
| Jest + Supertest | Pruebas unitarias e integración |
| Docker | Contenedorización |
| GitHub Actions | CI/CD |

---

*Proyecto creado para el laboratorio SDLC con IBM Bob — IBM Technology Expert Labs*
