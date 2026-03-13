const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { queryAll, queryOne, runSql } = require('../config/database');

const router = express.Router();

// Obtener todas las automatizaciones
router.get('/', authMiddleware, (req, res) => {
  try {
    const automations = queryAll('SELECT * FROM automations ORDER BY created_at DESC');
    res.json(automations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Obtener una automatización por ID
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const auto = queryOne('SELECT * FROM automations WHERE id = ?', [req.params.id]);
    if (!auto) return res.status(404).json({ error: 'Automatización no encontrada' });
    res.json(auto);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Crear automatización
router.post('/', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const { name, trigger_type, action_type, config, is_active } = req.body;
    if (!name || !trigger_type || !action_type) return res.status(400).json({ error: 'Nombre, trigger y acción son requeridos' });
    const id = uuidv4();
    runSql('INSERT INTO automations (id, name, trigger_type, action_type, config, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, trigger_type, action_type, config || '{}', is_active !== false ? 1 : 0]);
    const auto = queryOne('SELECT * FROM automations WHERE id = ?', [id]);
    res.status(201).json(auto);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Actualizar automatización
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM automations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Automatización no encontrada' });
    const { name, trigger_type, action_type, config, is_active } = req.body;
    runSql("UPDATE automations SET name = ?, trigger_type = ?, action_type = ?, config = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?",
      [name || existing.name, trigger_type || existing.trigger_type, action_type || existing.action_type, config || existing.config, is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active, req.params.id]);
    const updated = queryOne('SELECT * FROM automations WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Eliminar automatización
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM automations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Automatización no encontrada' });
    runSql('DELETE FROM automations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Automatización eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
