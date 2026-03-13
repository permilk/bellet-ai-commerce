const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql, getCount } = require('../config/database');

// ============ PRODUCTS ============
function getAllProducts({ category, search, active = true, limit = 50, offset = 0 }) {
  let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];

  if (active) { query += ' AND p.is_active = 1'; }
  if (category) { query += ' AND p.category_id = ?'; params.push(category); }
  if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return queryAll(query, params);
}

function getProductById(id) {
  return queryOne('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
}

function createProduct(data) {
  const id = uuidv4();
  runSql(`INSERT INTO products (id, name, slug, description, price, wholesale_price, category_id, sku, stock, image_url, external_id, external_url, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.slug, data.description, data.price, data.wholesale_price,
    data.category_id, data.sku, data.stock || 0, data.image_url, data.external_id, data.external_url, data.tags]
  );
  return getProductById(id);
}

function updateProduct(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  runSql(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  return getProductById(id);
}

// ============ CATEGORIES ============
function getAllCategories() {
  return queryAll('SELECT * FROM categories ORDER BY sort_order');
}

function getCategoryById(id) {
  return queryOne('SELECT * FROM categories WHERE id = ?', [id]);
}

// ============ CUSTOMERS ============
function getAllCustomers({ segment, source, search, limit = 50, offset = 0 }) {
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (segment) { query += ' AND segment = ?'; params.push(segment); }
  if (source) { query += ' AND source = ?'; params.push(source); }
  if (search) { query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return queryAll(query, params);
}

function getCustomerById(id) {
  return queryOne('SELECT * FROM customers WHERE id = ?', [id]);
}

function createCustomer(data) {
  const id = uuidv4();
  runSql(`INSERT INTO customers (id, name, email, phone, segment, lead_score, source, tags, notes, city, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.email, data.phone, data.segment || 'lead',
    data.lead_score || 0, data.source || 'website', data.tags, data.notes, data.city, data.state]
  );
  return getCustomerById(id);
}

function updateCustomer(id, data) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  runSql(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
  return getCustomerById(id);
}

function findOrCreateCustomer({ name, email, phone, source }) {
  let customer = null;
  if (email) customer = queryOne('SELECT * FROM customers WHERE email = ?', [email]);
  if (!customer && phone) customer = queryOne('SELECT * FROM customers WHERE phone = ?', [phone]);
  if (!customer) {
    customer = createCustomer({ name, email, phone, source, segment: 'lead' });
  }
  return customer;
}

// ============ ORDERS ============
function getAllOrders({ status, customer_id, limit = 50, offset = 0 }) {
  let query = 'SELECT o.*, c.name as customer_name, c.email as customer_email FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE 1=1';
  const params = [];

  if (status) { query += ' AND o.status = ?'; params.push(status); }
  if (customer_id) { query += ' AND o.customer_id = ?'; params.push(customer_id); }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return queryAll(query, params);
}

function getOrderById(id) {
  const order = queryOne('SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?', [id]);
  if (order) {
    order.items = queryAll('SELECT oi.*, p.name as product_name, p.image_url FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);
  }
  return order;
}

function createOrder(data) {
  const id = uuidv4();
  const orderNumber = 'BEL-' + Date.now().toString(36).toUpperCase();

  runSql(`INSERT INTO orders (id, order_number, customer_id, user_id, status, total, subtotal, tax, shipping, channel, notes, shipping_address, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, orderNumber, data.customer_id, data.user_id, data.status || 'pending',
    data.total || 0, data.subtotal || 0, data.tax || 0, data.shipping || 0,
    data.channel || 'website', data.notes, data.shipping_address, data.payment_method]
  );

  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      runSql(`INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
  }

  return getOrderById(id);
}

function updateOrderStatus(id, status) {
  runSql("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);
  return getOrderById(id);
}

// ============ CONVERSATIONS ============
function getAllConversations({ status, channel, customer_id, limit = 50, offset = 0 }) {
  let query = `SELECT conv.*, c.name as customer_name, c.email as customer_email FROM conversations conv LEFT JOIN customers c ON conv.customer_id = c.id WHERE 1=1`;
  const params = [];

  if (status) { query += ' AND conv.status = ?'; params.push(status); }
  if (channel) { query += ' AND conv.channel = ?'; params.push(channel); }
  if (customer_id) { query += ' AND conv.customer_id = ?'; params.push(customer_id); }

  query += ' ORDER BY conv.last_message_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return queryAll(query, params);
}

function getConversationById(id) {
  return queryOne('SELECT conv.*, c.name as customer_name FROM conversations conv LEFT JOIN customers c ON conv.customer_id = c.id WHERE conv.id = ?', [id]);
}

function getConversationMessages(conversationId) {
  return queryAll('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [conversationId]);
}

function createConversation(data) {
  const id = uuidv4();
  runSql(`INSERT INTO conversations (id, customer_id, channel, status, subject) VALUES (?, ?, ?, ?, ?)`,
    [id, data.customer_id, data.channel || 'website', 'active', data.subject]
  );
  return getConversationById(id);
}

function addMessage(conversationId, role, content, metadata) {
  const id = uuidv4();
  runSql(`INSERT INTO messages (id, conversation_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)`,
    [id, conversationId, role, content, metadata ? JSON.stringify(metadata) : null]
  );
  runSql("UPDATE conversations SET last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [conversationId]);
  return queryOne('SELECT * FROM messages WHERE id = ?', [id]);
}

// ============ CAMPAIGNS ============
function getAllCampaigns({ status, type, limit = 50, offset = 0 }) {
  let query = 'SELECT * FROM campaigns WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return queryAll(query, params);
}

function createCampaign(data) {
  const id = uuidv4();
  runSql(`INSERT INTO campaigns (id, name, type, subject, content, segment, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.type || 'email', data.subject, data.content, data.segment, data.status || 'draft', data.scheduled_at]
  );
  return queryOne('SELECT * FROM campaigns WHERE id = ?', [id]);
}

// ============ ANALYTICS ============
function getDashboardStats() {
  const totalCustomers = getCount('SELECT COUNT(*) as count FROM customers');
  const totalLeads = getCount("SELECT COUNT(*) as count FROM customers WHERE segment = 'lead'");
  const totalOrders = getCount('SELECT COUNT(*) as count FROM orders');
  const totalRevenue = queryOne("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE payment_status = 'paid'");
  const activeConversations = getCount("SELECT COUNT(*) as count FROM conversations WHERE status = 'active'");
  const totalProducts = getCount('SELECT COUNT(*) as count FROM products WHERE is_active = 1');

  const recentLeads = queryAll("SELECT * FROM customers WHERE segment = 'lead' ORDER BY created_at DESC LIMIT 5");
  const recentOrders = queryAll('SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 5');

  const channelStats = queryAll('SELECT source, COUNT(*) as count FROM customers GROUP BY source');
  const segmentStats = queryAll('SELECT segment, COUNT(*) as count FROM customers GROUP BY segment');
  const ordersByStatus = queryAll('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
  const topProducts = queryAll(`SELECT p.name, COUNT(oi.id) as order_count, SUM(oi.total) as revenue
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    GROUP BY p.id ORDER BY order_count DESC LIMIT 10`);

  return {
    totals: {
      customers: totalCustomers,
      leads: totalLeads,
      orders: totalOrders,
      revenue: totalRevenue ? totalRevenue.total : 0,
      activeConversations,
      products: totalProducts
    },
    recentLeads,
    recentOrders,
    channelStats,
    segmentStats,
    ordersByStatus,
    topProducts
  };
}

// ============ DOCUMENTS (RAG) ============
function getAllDocuments() {
  return queryAll('SELECT id, title, source, doc_type, created_at FROM documents ORDER BY created_at DESC');
}

function getDocumentsByType(docType) {
  return queryAll('SELECT * FROM documents WHERE doc_type = ?', [docType]);
}

function searchDocuments(query) {
  return queryAll('SELECT * FROM documents WHERE content LIKE ? OR title LIKE ? LIMIT 10', [`%${query}%`, `%${query}%`]);
}

module.exports = {
  getAllProducts, getProductById, createProduct, updateProduct,
  getAllCategories, getCategoryById,
  getAllCustomers, getCustomerById, createCustomer, updateCustomer, findOrCreateCustomer,
  getAllOrders, getOrderById, createOrder, updateOrderStatus,
  getAllConversations, getConversationById, getConversationMessages, createConversation, addMessage,
  getAllCampaigns, createCampaign,
  getDashboardStats,
  getAllDocuments, getDocumentsByType, searchDocuments
};
