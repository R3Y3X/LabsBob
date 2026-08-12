const express  = require('express');
const router   = express.Router();
const db       = require('../database');

// ─────────────────────────────────────────────────────────────────────────────
// ADVERTENCIA PARA EL LAB: Este archivo contiene vulnerabilidades INTENCIONALES
// que el estudiante debe detectar y corregir durante la fase de Código.
//
// Vulnerabilidad 1 — Secreto en duro (línea ~18)
// Vulnerabilidad 2 — Inyección SQL (línea ~30)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware de autenticación por API Key
 * TODO (Lab): ¿Ves el problema de seguridad aquí? Pista: ¿dónde está el secreto?
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  // 🔴 VULNERABILIDAD 1: Secreto hardcoded — nunca hagas esto en producción
  if (apiKey !== "SECRET_API_KEY_12345") {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API Key' });
  }
  next();
}

/**
 * GET /api/v1/payments/:userId
 * Obtiene todos los pagos de un usuario.
 * TODO (Lab): ¿Ves el problema de seguridad en la consulta SQL?
 */
router.get('/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  // 🔴 VULNERABILIDAD 2: Inyección SQL — el userId se interpola directamente
  const payments = db.prepare(
    `SELECT * FROM payments WHERE user_id = '${userId}'`
  ).all();

  res.json({ data: payments, count: payments.length });
});

/**
 * GET /api/v1/payments/detail/:id
 * Obtiene el detalle de un pago específico por su ID.
 */
router.get('/detail/:id', authenticate, (req, res) => {
  const { id } = req.params;

  // 🔴 VULNERABILIDAD 2 (también aquí): misma inyección SQL
  const payment = db.prepare(
    `SELECT * FROM payments WHERE id = '${id}'`
  ).get();

  if (!payment) {
    return res.status(404).json({ error: 'Not Found', message: `Pago ${id} no encontrado` });
  }
  res.json({ data: payment });
});

module.exports = router;
