require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Payment API corriendo en http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Pagos:        http://localhost:${PORT}/api/v1/payments/:userId`);
  console.log(`   Cupones:      http://localhost:${PORT}/api/v1/coupons/apply`);
});
