require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

let dbInitialized = false;

app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Bellet AI Commerce API' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/conversations', require('./routes/conversations.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/automations', require('./routes/automations.routes'));

app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

module.exports = app;
