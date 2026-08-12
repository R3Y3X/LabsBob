const express = require('express');
const app = express();

app.use(express.json());

// Rutas principales
const paymentRoutes = require('./routes/payment');
const couponRoutes  = require('./routes/coupon');

app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/coupons',  couponRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-api', version: '1.0.0' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
