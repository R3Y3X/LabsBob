const request = require('supertest');
const app     = require('../src/app');

// ─────────────────────────────────────────────────────────────────────────────
// Suite de pruebas para la Payment & Billing API
//
// ESTADO INICIAL DEL LAB:
//   - Los tests de autenticación PASAN (revelan el secreto hardcoded)
//   - Los tests de SQL injection FALLAN por diseño hasta que se corrija el código
//   - Los tests de /coupons/apply FALLAN porque el endpoint no está implementado
//
// Después de completar la fase de Código, TODOS los tests deben pasar.
// ─────────────────────────────────────────────────────────────────────────────

const VALID_KEY   = 'SECRET_API_KEY_12345'; // 🔴 Esto no debería estar aquí en producción
const INVALID_KEY = 'wrong_key';

// ─── Payments ─────────────────────────────────────────────────────────────────

describe('GET /api/v1/payments/:userId', () => {
  test('devuelve 401 si no se envía API Key', async () => {
    const res = await request(app).get('/api/v1/payments/user_123');
    expect(res.status).toBe(401);
  });

  test('devuelve 401 con API Key inválida', async () => {
    const res = await request(app)
      .get('/api/v1/payments/user_123')
      .set('x-api-key', INVALID_KEY);
    expect(res.status).toBe(401);
  });

  test('devuelve 200 con pagos del usuario usando key válida', async () => {
    const res = await request(app)
      .get('/api/v1/payments/user_123')
      .set('x-api-key', VALID_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('devuelve lista vacía para usuario sin pagos', async () => {
    const res = await request(app)
      .get('/api/v1/payments/user_inexistente')
      .set('x-api-key', VALID_KEY);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  // 🔴 TEST DE SEGURIDAD: Este test verifica que la inyección SQL está bloqueada.
  // FALLARÁ hasta que corrijas la consulta en src/routes/payment.js.
  test('SEGURIDAD: resiste inyección SQL en userId', async () => {
    const sqlInjection = "' OR '1'='1";
    const res = await request(app)
      .get(`/api/v1/payments/${encodeURIComponent(sqlInjection)}`)
      .set('x-api-key', VALID_KEY);
    // La respuesta debe ser una lista vacía, NO todos los registros de la tabla
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0); // Con inyección SQL, devolvería > 0
  });
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/coupons/apply', () => {
  // 🔴 Estos tests FALLARÁN hasta que implementes src/routes/coupon.js

  test('aplica descuento correctamente con cupón válido', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/apply')
      .send({ code: 'IBMBOB20', originalAmount: 100 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('finalAmount');
    expect(res.body.finalAmount).toBeCloseTo(80.00, 2);
    expect(res.body).toHaveProperty('savings');
    expect(res.body.savings).toBeCloseTo(20.00, 2);
  });

  test('aplica descuento del 50% con cupón LAUNCH50', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/apply')
      .send({ code: 'LAUNCH50', originalAmount: 249 });

    expect(res.status).toBe(200);
    expect(res.body.finalAmount).toBeCloseTo(124.50, 2);
  });

  test('devuelve 400 para cupón inexistente', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/apply')
      .send({ code: 'NOEXISTE', originalAmount: 100 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('devuelve 400 para cupón inactivo (EXPIRED10)', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/apply')
      .send({ code: 'EXPIRED10', originalAmount: 100 });

    expect(res.status).toBe(400);
  });

  test('devuelve 400 si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/v1/coupons/apply')
      .send({ code: 'IBMBOB20' }); // falta originalAmount

    expect(res.status).toBe(400);
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

describe('GET /health', () => {
  test('responde 200 con status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
