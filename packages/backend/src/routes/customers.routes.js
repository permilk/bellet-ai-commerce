const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const dataService = require('../services/data.service');

const router = express.Router();

// GET /api/customers
router.get('/', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const { segment, source, search, limit, offset } = req.query;
    const customers = dataService.getAllCustomers({
      segment, source, search,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const customer = dataService.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers
router.post('/', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const customer = dataService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const customer = dataService.updateCustomer(req.params.id, req.body);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { runSql } = require('../config/database');
    const existing = dataService.getCustomerById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
    runSql('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
