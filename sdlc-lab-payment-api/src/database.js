const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'payments.db');

// Crear carpeta data si no existe
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Habilitar WAL mode para mejor concurrencia
db.pragma('journal_mode = WAL');

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    amount      REAL NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'USD',
    status      TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id               TEXT PRIMARY KEY,
    code             TEXT UNIQUE NOT NULL,
    discount_percent REAL NOT NULL,
    active           INTEGER NOT NULL DEFAULT 1,
    expires_at       TEXT
  );
`);

// Datos seed — se insertan solo si la tabla está vacía
const paymentCount = db.prepare('SELECT COUNT(*) as cnt FROM payments').get();
if (paymentCount.cnt === 0) {
  const insertPayment = db.prepare(`
    INSERT INTO payments (id, user_id, amount, currency, status, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPayment.run('pay_001', 'user_123', 99.99,  'USD', 'completed', 'Suscripción mensual Pro');
  insertPayment.run('pay_002', 'user_456', 249.00, 'USD', 'pending',   'Suscripción anual Enterprise');
  insertPayment.run('pay_003', 'user_789', 19.99,  'USD', 'failed',    'Suscripción mensual Starter');
  insertPayment.run('pay_004', 'user_123', 49.99,  'USD', 'completed', 'Add-on: Storage extra 100 GB');
  console.log('[DB] Seed de payments insertado.');
}

const couponCount = db.prepare('SELECT COUNT(*) as cnt FROM coupons').get();
if (couponCount.cnt === 0) {
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, discount_percent, active, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertCoupon.run('coup_001', 'IBMBOB20',   20, 1, '2025-12-31');
  insertCoupon.run('coup_002', 'LAUNCH50',   50, 1, '2025-06-30');
  insertCoupon.run('coup_003', 'EXPIRED10',  10, 0, '2023-01-01'); // cupón inactivo — para testing
  insertCoupon.run('coup_004', 'DEVFEST15',  15, 1, null);
  console.log('[DB] Seed de coupons insertado.');
}

module.exports = db;
