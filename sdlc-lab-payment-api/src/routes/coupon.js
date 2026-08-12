const express = require('express');
const router  = express.Router();
const db      = require('../database');

// ─────────────────────────────────────────────────────────────────────────────
// TAREA DEL LAB: Implementar este endpoint completo.
//
// POST /api/v1/coupons/apply
// Body: { "code": "IBMBOB20", "originalAmount": 100 }
//
// Lógica esperada:
//  1. Buscar el cupón por `code` en la tabla `coupons`
//  2. Verificar que el cupón existe y que `active === 1`
//  3. Calcular: finalAmount = originalAmount * (1 - discount_percent / 100)
//  4. Responder con 200 y el objeto de resultado
//  5. Responder con 400 si el cupón no existe o está inactivo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/coupons/apply
 * Aplica un cupón de descuento a un monto original.
 */
router.post('/apply', (req, res) => {
  const { code, originalAmount } = req.body;

  // TODO: Validar que `code` y `originalAmount` están presentes en el body
  // Pista: si falta alguno, responde con 400 Bad Request

  // TODO: Buscar el cupón en la base de datos usando `code`
  // Pista: usa db.prepare(...).get(code) con consulta parametrizada

  // TODO: Verificar que el cupón existe y está activo (active === 1)
  // Pista: si no existe o está inactivo, responde con 400 y un mensaje descriptivo

  // TODO: Calcular el monto final con el descuento
  // Fórmula: finalAmount = originalAmount * (1 - discount_percent / 100)

  // TODO: Responder con 200 y el siguiente objeto:
  // {
  //   "coupon": { code, discount_percent },
  //   "originalAmount": <número>,
  //   "finalAmount": <número con 2 decimales>,
  //   "savings": <número con 2 decimales>
  // }

  // Placeholder — eliminar cuando implementes la lógica real
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Este endpoint está pendiente de implementación. Sigue las instrucciones del lab.'
  });
});

/**
 * GET /api/v1/coupons
 * Lista todos los cupones activos (útil para explorar los datos seed).
 */
router.get('/', (req, res) => {
  const coupons = db.prepare('SELECT id, code, discount_percent, active FROM coupons').all();
  res.json({ data: coupons });
});

module.exports = router;
