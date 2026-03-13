const express = require('express');
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth');
const dataService = require('../services/data.service');
const chatAgent = require('../ai/chat-agent');
const { queryOne, runSql } = require('../config/database');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const { status, channel, customer_id, limit, offset } = req.query;
    const conversations = dataService.getAllConversations({ status, channel, customer_id, limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 });
    res.json(conversations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const conversation = dataService.getConversationById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversación no encontrada' });
    res.json(conversation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/messages', authMiddleware, (req, res) => {
  try { res.json(dataService.getConversationMessages(req.params.id)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try { res.status(201).json(dataService.addMessage(req.params.id, 'agent', req.body.content)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authMiddleware, requireRole('admin', 'agent'), (req, res) => {
  try {
    const { status, assigned_to } = req.body;
    const fields = []; const values = [];
    if (status) { fields.push('status = ?'); values.push(status); }
    if (assigned_to) { fields.push('assigned_to = ?'); values.push(assigned_to); }
    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);
    runSql(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json(dataService.getConversationById(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public AI chat endpoint
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, conversation_id, customer_name, customer_email, customer_phone } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

    let customer = null;
    if (customer_email || customer_phone) {
      customer = dataService.findOrCreateCustomer({ name: customer_name, email: customer_email, phone: customer_phone, source: 'website' });
    }

    let convId = conversation_id;
    if (!convId) {
      const conversation = dataService.createConversation({ customer_id: customer ? customer.id : null, channel: 'website', subject: message.substring(0, 100) });
      convId = conversation.id;
    }

    dataService.addMessage(convId, 'customer', message);
    const result = await chatAgent.processMessage(message, convId, customer ? customer.id : null);
    dataService.addMessage(convId, 'ai', result.response, result.metadata);

    if (result.shouldEscalate) {
      runSql("UPDATE conversations SET status = 'escalated', updated_at = datetime('now') WHERE id = ?", [convId]);
    }

    res.json({ conversation_id: convId, response: result.response, shouldEscalate: result.shouldEscalate, metadata: result.metadata });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
