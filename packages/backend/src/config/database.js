const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'bellet.db');
const dataDir = path.dirname(DB_PATH);

let db = null;
let dbReady = null;

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function saveDb() {
  if (db) {
    ensureDir();
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function getDb() {
  if (db) return db;
  if (dbReady) return dbReady;
  dbReady = (async () => {
    const SQL = await initSqlJs();
    ensureDir();
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA journal_mode = WAL');
    db.run('PRAGMA foreign_keys = ON');

    // Auto-save every 30 seconds
    setInterval(() => saveDb(), 30000);
    process.on('exit', () => saveDb());
    process.on('SIGINT', () => { saveDb(); process.exit(); });

    return db;
  })();
  return dbReady;
}

async function initializeDatabase() {
  const database = await getDb();

  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'wholesale',
      first_name TEXT,
      last_name TEXT,
      company_name TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      wholesale_price REAL,
      category_id TEXT,
      sku TEXT UNIQUE,
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      external_id TEXT,
      external_url TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      segment TEXT DEFAULT 'lead',
      lead_score INTEGER DEFAULT 0,
      source TEXT DEFAULT 'website',
      tags TEXT,
      notes TEXT,
      city TEXT,
      state TEXT,
      last_interaction TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      user_id TEXT,
      status TEXT DEFAULT 'pending',
      total REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      channel TEXT DEFAULT 'website',
      notes TEXT,
      shipping_address TEXT,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      channel TEXT DEFAULT 'website',
      status TEXT DEFAULT 'active',
      assigned_to TEXT,
      subject TEXT,
      last_message_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'email',
      subject TEXT,
      content TEXT,
      segment TEXT,
      status TEXT DEFAULT 'draft',
      scheduled_at TEXT,
      sent_at TEXT,
      recipients_count INTEGER DEFAULT 0,
      open_count INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_config TEXT,
      action_type TEXT NOT NULL,
      action_config TEXT,
      is_active INTEGER DEFAULT 1,
      executions_count INTEGER DEFAULT 0,
      last_executed TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      type TEXT NOT NULL,
      channel TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      doc_type TEXT DEFAULT 'faq',
      embedding TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS analytics_daily (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      leads_count INTEGER DEFAULT 0,
      orders_count INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      conversations_count INTEGER DEFAULT 0,
      messages_count INTEGER DEFAULT 0,
      channel_stats TEXT,
      product_stats TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)',
    'CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment)',
    'CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source)',
    'CREATE INDEX IF NOT EXISTS idx_interactions_customer ON interactions(customer_id)'
  ];
  for (const idx of indexes) {
    database.run(idx);
  }

  saveDb();
  return database;
}

// Helper: convert sql.js result to array of objects
function queryAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runSql(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDb();
}

function getCount(sql, params = []) {
  const result = queryOne(sql, params);
  return result ? Object.values(result)[0] : 0;
}

module.exports = { getDb, initializeDatabase, queryAll, queryOne, runSql, getCount, saveDb };
