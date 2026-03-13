const { initializeDatabase, queryOne, runSql } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding database...');
  await initializeDatabase();

  // Check if already seeded
  const existing = queryOne('SELECT COUNT(*) as count FROM categories');
  if (existing && existing.count > 0) {
    console.log('⚠️  Database already seeded. Dropping and re-seeding...');
    const tables = ['messages', 'conversations', 'interactions', 'order_items', 'orders', 'customers', 'products', 'categories', 'users', 'documents', 'campaigns', 'automations', 'analytics_daily'];
    for (const t of tables) { runSql(`DELETE FROM ${t}`); }
  }

  // ============ USERS ============
  const adminHash = await bcrypt.hash('admin123', 12);
  const adminId = uuidv4();
  runSql('INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
    [adminId, 'admin@cosmeticosbellet.com', adminHash, 'admin', 'Admin', 'Bellet']);

  const agentHash = await bcrypt.hash('agent123', 12);
  runSql('INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), 'agente@cosmeticosbellet.com', agentHash, 'agent', 'Agente', 'Ventas']);

  const wholesaleHash = await bcrypt.hash('mayoreo123', 12);
  runSql('INSERT INTO users (id, email, password_hash, role, first_name, last_name, company_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [uuidv4(), 'mayorista@demo.com', wholesaleHash, 'wholesale', 'María', 'García', 'Distribuidora MG Beauty', '55 1234 5678']);
  console.log('✅ Users created');

  // ============ CATEGORIES ============
  const categories = [
    { name: 'Ceras', slug: 'ceras', description: 'Ceras para moldeo y efectos especiales', sort: 1 },
    { name: 'Aquacolor', slug: 'aquacolor', description: 'Maquillaje profesional en base agua', sort: 2 },
    { name: 'FX', slug: 'fx', description: 'Efectos especiales y maquillaje artístico', sort: 3 },
    { name: 'Pastas', slug: 'pastas', description: 'Pastas para modelado y efectos', sort: 4 },
    { name: 'Skincare', slug: 'skincare', description: 'Cuidado de la piel y tratamientos capilares', sort: 5 },
    { name: 'Catrinas', slug: 'catrinas', description: 'Productos especiales para maquillaje de Catrina', sort: 6 },
    { name: 'Cursos', slug: 'cursos', description: 'Cursos y talleres de maquillaje artístico', sort: 7 },
  ];
  const catIds = {};
  for (const cat of categories) {
    const id = uuidv4();
    catIds[cat.slug] = id;
    runSql('INSERT INTO categories (id, name, slug, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, cat.name, cat.slug, cat.description, cat.sort]);
  }
  console.log('✅ Categories created');

  // ============ PRODUCTS ============
  const products = [
    { name: 'Cera Moldeable Profesional 50g', price: 189, wp: 142, cat: 'ceras', sku: 'CER-001', stock: 45, desc: 'Cera moldeable de alta calidad para efectos especiales.' },
    { name: 'Cera Moldeable Profesional 100g', price: 299, wp: 224, cat: 'ceras', sku: 'CER-002', stock: 30, desc: 'Presentación grande de cera moldeable profesional.' },
    { name: 'Cera para Cejas 25g', price: 129, wp: 97, cat: 'ceras', sku: 'CER-003', stock: 60, desc: 'Cera especial para cubrir y moldear cejas.' },
    { name: 'Kit de Ceras Profesional', price: 549, wp: 412, cat: 'ceras', sku: 'CER-004', stock: 15, desc: 'Kit completo con 5 tipos de ceras para efectos especiales.' },
    { name: 'Aquacolor Paleta 12 Colores', price: 450, wp: 338, cat: 'aquacolor', sku: 'AQU-001', stock: 35, desc: 'Paleta de 12 colores vibrantes en base agua.' },
    { name: 'Aquacolor Individual 30ml', price: 89, wp: 67, cat: 'aquacolor', sku: 'AQU-002', stock: 80, desc: 'Maquillaje en base agua individual.' },
    { name: 'Aquacolor Metalizado 30ml', price: 119, wp: 89, cat: 'aquacolor', sku: 'AQU-003', stock: 50, desc: 'Aquacolor con acabado metalizado.' },
    { name: 'Aquacolor Negro Intenso 45ml', price: 129, wp: 97, cat: 'aquacolor', sku: 'AQU-004', stock: 65, desc: 'Negro ultra pigmentado para body paint.' },
    { name: 'Sangre Artificial 120ml', price: 159, wp: 119, cat: 'fx', sku: 'FX-001', stock: 55, desc: 'Sangre artificial ultra realista y lavable.' },
    { name: 'Latex Líquido 250ml', price: 289, wp: 217, cat: 'fx', sku: 'FX-002', stock: 25, desc: 'Látex líquido profesional para texturas y prótesis.' },
    { name: 'Kit de Heridas FX', price: 399, wp: 299, cat: 'fx', sku: 'FX-003', stock: 20, desc: 'Kit completo para heridas, cicatrices y trauma.' },
    { name: 'Gelatin FX Pro', price: 249, wp: 187, cat: 'fx', sku: 'FX-004', stock: 30, desc: 'Gelatina profesional para efectos especiales.' },
    { name: 'Pasta de Moldeo 200g', price: 219, wp: 164, cat: 'pastas', sku: 'PAS-001', stock: 40, desc: 'Pasta profesional para efectos 3D.' },
    { name: 'Pasta Cicatriz 100g', price: 179, wp: 134, cat: 'pastas', sku: 'PAS-002', stock: 35, desc: 'Pasta para cicatrices y heridas realistas.' },
    { name: 'Tratamiento con Ácido Hialurónico', price: 259, wp: 194, cat: 'skincare', sku: 'SKC-001', stock: 40, desc: 'Tratamiento capilar con ácido hialurónico.', extUrl: 'https://cosmeticosbellet.com/tienda/producto/119/tratamiento-con-enjuague-acido-hialuronico' },
    { name: 'Tratamiento Aceite de Coco y Argán', price: 249, wp: 187, cat: 'skincare', sku: 'SKC-002', stock: 35, desc: 'Tratamiento libre de enjuague con aceites naturales.', extUrl: 'https://cosmeticosbellet.com/tienda/producto/118/tratamiento-libre-de-enjuague-con-aceite-de-coco-argan-y-macadamia' },
    { name: 'Mascarilla Capilar Keratina', price: 279, wp: 209, cat: 'skincare', sku: 'SKC-004', stock: 25, desc: 'Mascarilla intensiva con keratina.', extUrl: 'https://cosmeticosbellet.com/tienda/producto/115/mascarilla-capilar-keratina' },
    { name: 'Kit Catrina Profesional', price: 599, wp: 449, cat: 'catrinas', sku: 'CAT-001', stock: 20, desc: 'Kit completo para Catrina profesional.' },
    { name: 'Paleta Catrina 8 Colores', price: 349, wp: 262, cat: 'catrinas', sku: 'CAT-002', stock: 40, desc: 'Paleta diseñada para maquillaje de Catrina.' },
    { name: 'Diamantina Facial Catrina', price: 89, wp: 67, cat: 'catrinas', sku: 'CAT-003', stock: 70, desc: 'Diamantina segura para uso facial.' },
    { name: 'Combo Máster Bellet – Formación Completa', price: 1999, wp: 1499, cat: 'cursos', sku: 'CUR-001', stock: 999, desc: 'Formación completa en maquillaje artístico.', extUrl: 'https://cosmeticosbellet.com/tienda/producto/114' },
    { name: 'Taller del Terror – Master Erika Aris', price: 799, wp: 599, cat: 'cursos', sku: 'CUR-002', stock: 999, desc: 'Taller de maquillaje de terror.', extUrl: 'https://cosmeticosbellet.com/tienda/producto/113' },
    { name: 'Taller Cráneo Artístico – Master Isabel', price: 699, wp: 524, cat: 'cursos', sku: 'CUR-003', stock: 999, desc: 'Taller online de cráneo artístico.', extUrl: 'https://cosmeticosbellet.com/tienda/producto/112' },
  ];

  const productIds = [];
  for (const p of products) {
    const id = uuidv4();
    productIds.push(id);
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    runSql('INSERT INTO products (id, name, slug, description, price, wholesale_price, category_id, sku, stock, external_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [id, p.name, slug, p.desc, p.price, p.wp, catIds[p.cat], p.sku, p.stock, p.extUrl || null]);
  }
  console.log(`✅ ${products.length} Products created`);

  // ============ CUSTOMERS ============
  const customers = [
    { name: 'Ana López', email: 'ana.lopez@email.com', phone: '55 9876 5432', segment: 'customer', score: 75, source: 'website', city: 'CDMX', state: 'CDMX' },
    { name: 'Carlos Mendoza', email: 'carlos.m@email.com', phone: '55 1111 2222', segment: 'vip', score: 95, source: 'whatsapp', city: 'Guadalajara', state: 'Jalisco' },
    { name: 'Laura Martínez', email: 'laura.mtz@email.com', phone: '55 3333 4444', segment: 'prospect', score: 45, source: 'social', city: 'Monterrey', state: 'Nuevo León' },
    { name: 'Roberto Silva', email: 'r.silva@distribuidora.com', phone: '55 5555 6666', segment: 'wholesale', score: 90, source: 'referral', city: 'Puebla', state: 'Puebla' },
    { name: 'Daniela Flores', email: 'dani.flores@email.com', phone: '55 7777 8888', segment: 'lead', score: 20, source: 'website', city: 'Querétaro', state: 'Querétaro' },
    { name: 'Sofía Ramírez', email: 'sofia.r@email.com', phone: '55 2222 3333', segment: 'lead', score: 15, source: 'social', city: 'León', state: 'Guanajuato' },
    { name: 'Alejandro Torres', email: 'alex.torres@email.com', phone: '55 4444 5555', segment: 'prospect', score: 55, source: 'email', city: 'Mérida', state: 'Yucatán' },
    { name: 'Valentina Cruz', email: 'val.cruz@academia.com', phone: '55 6666 7777', segment: 'customer', score: 80, source: 'website', city: 'CDMX', state: 'CDMX' },
    { name: 'Distribuidora Belleza Total', email: 'compras@bellezatotal.com', phone: '55 8888 9999', segment: 'wholesale', score: 85, source: 'referral', city: 'Toluca', state: 'Estado de México' },
    { name: 'Isabella Moreno', email: 'isa.moreno@email.com', phone: '55 0000 1111', segment: 'lead', score: 10, source: 'whatsapp', city: 'Cancún', state: 'Quintana Roo' },
  ];
  const customerIds = [];
  for (const c of customers) {
    const id = uuidv4();
    customerIds.push(id);
    runSql('INSERT INTO customers (id, name, email, phone, segment, lead_score, source, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, c.name, c.email, c.phone, c.segment, c.score, c.source, c.city, c.state]);
  }
  console.log(`✅ ${customers.length} Customers created`);

  // ============ ORDERS ============
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const channels = ['website', 'whatsapp', 'b2b'];
  for (let i = 0; i < 15; i++) {
    const orderId = uuidv4();
    const custIdx = Math.floor(Math.random() * customerIds.length);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const numItems = 1 + Math.floor(Math.random() * 3);
    let subtotal = 0;
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString().replace('T', ' ').replace('Z', '');

    const orderItems = [];
    for (let j = 0; j < numItems; j++) {
      const prodIdx = Math.floor(Math.random() * productIds.length);
      const qty = 1 + Math.floor(Math.random() * 3);
      const price = products[prodIdx].price;
      subtotal += price * qty;
      orderItems.push({ productId: productIds[prodIdx], qty, price });
    }
    const tax = Math.round(subtotal * 0.16);
    const shipping = subtotal > 500 ? 0 : 99;
    const total = subtotal + tax + shipping;
    const paymentStatus = ['delivered', 'shipped'].includes(status) ? 'paid' : 'pending';

    runSql('INSERT INTO orders (id, order_number, customer_id, status, total, subtotal, tax, shipping, channel, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, `BEL-${1000 + i}`, customerIds[custIdx], status, total, subtotal, tax, shipping, channel, paymentStatus, createdAt]);
    for (const item of orderItems) {
      runSql('INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), orderId, item.productId, item.qty, item.price, item.qty * item.price]);
    }
  }
  console.log('✅ 15 Orders created');

  // ============ CONVERSATIONS ============
  const convos = [
    { subject: 'Consulta Kit Catrina', msgs: [
      { role: 'customer', content: 'Hola, ¿tienen disponible el Kit Catrina Profesional?' },
      { role: 'ai', content: '¡Hola! 👋 Sí, tenemos el Kit Catrina Profesional por $599 MXN. ¿Te gustaría hacer un pedido?' },
    ]},
    { subject: 'Problema con pedido', msgs: [
      { role: 'customer', content: 'Mi pedido BEL-1005 llegó incompleto' },
      { role: 'ai', content: 'Lamento lo sucedido. Te conecto con un asesor humano para resolver esto.' },
    ]},
    { subject: 'Interés en mayoreo', msgs: [
      { role: 'customer', content: 'Me interesa comprar al mayoreo. ¿Tienen precios especiales?' },
      { role: 'ai', content: '🏢 Sí, tenemos portal B2B con precios exclusivos. Contacta ventas@cosmeticosbellet.com' },
    ]},
    { subject: 'Consulta skincare', msgs: [
      { role: 'customer', content: '¿Qué tratamiento me recomiendan para cabello seco?' },
      { role: 'ai', content: 'Te recomiendo el Tratamiento con Aceite de Coco, Argán y Macadamia ($249 MXN) ✨' },
    ]},
  ];
  const convChannels = ['website', 'whatsapp', 'email', 'social'];
  for (let i = 0; i < convos.length; i++) {
    const convId = uuidv4();
    const custIdx = Math.floor(Math.random() * customerIds.length);
    const status = i === 1 ? 'escalated' : 'active';
    runSql('INSERT INTO conversations (id, customer_id, channel, status, subject) VALUES (?, ?, ?, ?, ?)',
      [convId, customerIds[custIdx], convChannels[i], status, convos[i].subject]);
    for (const msg of convos[i].msgs) {
      runSql('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
        [uuidv4(), convId, msg.role, msg.content]);
    }
  }
  console.log(`✅ ${convos.length} Conversations created`);

  // ============ DOCUMENTS (RAG) ============
  const documents = [
    { title: 'FAQ - Métodos de Pago', content: 'Aceptamos Visa, Mastercard, Amex, PayPal y transferencias bancarias.', type: 'faq' },
    { title: 'FAQ - Tiempo de Entrega', content: 'Procesamiento: 1-3 días hábiles. Envío: 3-7 días hábiles adicionales.', type: 'faq' },
    { title: 'FAQ - Envío Internacional', content: 'Sí realizamos envíos internacionales. Pueden aplicarse aranceles.', type: 'faq' },
    { title: 'Info Contacto', content: 'México, Estado de México. Tel: 56 2045 6394. Email: ventas@cosmeticosbellet.com', type: 'other' },
    { title: 'Sobre Bellet', content: 'Tienda online de maquillaje artístico y body paint. Categorías: Ceras, Aquacolor, FX, Pastas, Skincare, Catrinas. Cursos y talleres disponibles.', type: 'other' },
    { title: 'Política Mayoreo', content: 'Portal B2B con precios especiales, pedidos automáticos e historial. Contactar ventas@cosmeticosbellet.com', type: 'policy' },
  ];
  for (const doc of documents) {
    runSql('INSERT INTO documents (id, title, content, doc_type, source) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), doc.title, doc.content, doc.type, 'website']);
  }
  console.log(`✅ ${documents.length} Documents created`);

  // ============ AUTOMATIONS ============
  const automations = [
    { name: 'Seguimiento Lead (24h)', trigger: 'lead_no_response', action: 'send_email' },
    { name: 'Carrito abandonado', trigger: 'cart_abandoned', action: 'send_email' },
    { name: 'Recordatorio compra mensual', trigger: 'last_purchase_30d', action: 'send_email' },
    { name: 'Bienvenida nuevo cliente', trigger: 'new_customer', action: 'send_email' },
    { name: 'Promoción VIP', trigger: 'customer_vip', action: 'send_whatsapp' },
  ];
  for (const a of automations) {
    runSql('INSERT INTO automations (id, name, trigger_type, action_type, is_active) VALUES (?, ?, ?, ?, 1)',
      [uuidv4(), a.name, a.trigger, a.action]);
  }
  console.log(`✅ ${automations.length} Automations created`);

  const { saveDb: save } = require('../config/database');
  save();

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:     admin@cosmeticosbellet.com / admin123');
  console.log('  Agente:    agente@cosmeticosbellet.com / agent123');
  console.log('  Mayorista: mayorista@demo.com / mayoreo123');
}

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
