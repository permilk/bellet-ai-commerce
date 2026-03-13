const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const dataService = require('../services/data.service');
const { queryAll } = require('../config/database');

const router = express.Router();

router.get('/dashboard', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try { res.json(dataService.getDashboardStats()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/leads', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const bySource = queryAll('SELECT source, COUNT(*) as count FROM customers GROUP BY source');
    const bySegment = queryAll('SELECT segment, COUNT(*) as count FROM customers GROUP BY segment');
    const recent = queryAll('SELECT * FROM customers ORDER BY created_at DESC LIMIT 20');
    const leadsOverTime = queryAll("SELECT date(created_at) as date, COUNT(*) as count FROM customers WHERE created_at >= datetime('now', '-30 days') GROUP BY date(created_at) ORDER BY date");
    res.json({ bySource, bySegment, recent, leadsOverTime });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sales', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const byStatus = queryAll('SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders GROUP BY status');
    const byChannel = queryAll('SELECT channel, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders GROUP BY channel');
    const salesOverTime = queryAll("SELECT date(created_at) as date, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE created_at >= datetime('now', '-30 days') GROUP BY date(created_at) ORDER BY date");
    res.json({ byStatus, byChannel, salesOverTime });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/campaigns', authMiddleware, requireRole('admin'), (req, res) => {
  try { res.json(dataService.getAllCampaigns(req.query)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/campaigns', authMiddleware, requireRole('admin'), (req, res) => {
  try { res.status(201).json(dataService.createCampaign(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
