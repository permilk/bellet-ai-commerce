require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const { initializeDatabase } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Demasiadas solicitudes' } });
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Bellet AI Commerce API' });
});

// Initialize database then mount routes
async function startServer() {
  await initializeDatabase();
  console.log('✅ Database initialized');

  app.use('/api/auth', require('./routes/auth.routes'));
  app.use('/api/products', require('./routes/products.routes'));
  app.use('/api/customers', require('./routes/customers.routes'));
  app.use('/api/orders', require('./routes/orders.routes'));
  app.use('/api/conversations', require('./routes/conversations.routes'));
  app.use('/api/analytics', require('./routes/analytics.routes'));
  app.use('/api/automations', require('./routes/automations.routes'));

  // Socket.io
  io.on('connection', (socket) => {
    console.log('💬 Client connected:', socket.id);
    socket.on('join_conversation', (id) => socket.join(`conv_${id}`));
    socket.on('new_message', (data) => {
      io.to(`conv_${data.conversation_id}`).emit('message_received', { ...data, timestamp: new Date().toISOString() });
    });
    socket.on('disconnect', () => console.log('👋 Client disconnected:', socket.id));
  });

  // Error handling
  app.use((err, req, res, _next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
  });
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  const PORT = process.env.BACKEND_PORT || 4000;
  server.listen(PORT, () => {
    console.log(`\n🚀 Bellet AI Commerce API`);
    console.log(`   Server: http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

startServer().catch(err => { console.error('Failed to start server:', err); process.exit(1); });

module.exports = { app, server, io };
