const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const dataService = require('../services/data.service');
const { queryOne } = require('../config/database');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { status, customer_id, limit, offset } = req.query;
    let orders;
    if (req.user.role === 'wholesale') {
      const customer = queryOne('SELECT id FROM customers WHERE email = ?', [req.user.email]);
      orders = customer ? dataService.getAllOrders({ status, customer_id: customer.id, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 }) : [];
    } else {
      orders = dataService.getAllOrders({ status, customer_id, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 });
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const order = dataService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const orderData = { ...req.body };
    if (req.user.role === 'wholesale') { orderData.user_id = req.user.id; orderData.channel = 'b2b'; }
    res.status(201).json(dataService.createOrder(orderData));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try { res.json(dataService.updateOrderStatus(req.params.id, req.body.status)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
