const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { queryOne, runSql } = require('../config/database');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, company_name, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'El email ya está registrado' });

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    runSql('INSERT INTO users (id, email, password_hash, role, first_name, last_name, company_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email, password_hash, 'wholesale', first_name, last_name, company_name, phone]);

    const user = queryOne('SELECT id, email, role, first_name, last_name, company_name FROM users WHERE id = ?', [id]);
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!user.is_active) return res.status(403).json({ error: 'Cuenta desactivada' });

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = queryOne('SELECT id, email, role, first_name, last_name, company_name, phone, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

module.exports = router;
