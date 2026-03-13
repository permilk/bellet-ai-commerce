const express = require('express');
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth');
const dataService = require('../services/data.service');

const router = express.Router();

// GET /api/products — Public
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, limit, offset } = req.query;
    const products = dataService.getAllProducts({
      category, search,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    // If wholesale user, include wholesale prices
    if (req.user && req.user.role === 'wholesale') {
      res.json(products);
    } else {
      // Hide wholesale prices for public
      res.json(products.map(p => { const { wholesale_price, ...rest } = p; return rest; }));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  try {
    const categories = dataService.getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const product = dataService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    if (!req.user || req.user.role !== 'wholesale') {
      const { wholesale_price, ...rest } = product;
      return res.json(rest);
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — Admin only
router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const product = dataService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — Admin only
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const product = dataService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
