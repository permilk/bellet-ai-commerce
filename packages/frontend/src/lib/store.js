// In-memory data store for serverless deployment (no database file needed)
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory store
const store = {
  users: [], categories: [], products: [], customers: [],
  orders: [], order_items: [], conversations: [], messages: [],
  campaigns: [], automations: [], interactions: [], documents: [], analytics: []
};

let seeded = false;

function seedData() {
  if (seeded) return;
  seeded = true;

  const adminId = uuidv4(), agentId = uuidv4(), wholesaleId = uuidv4();
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  store.users.push(
    { id: adminId, email: 'admin@cosmeticosbellet.com', password: hash('admin123'), role: 'admin', first_name: 'Admin', last_name: 'Bellet', company_name: null, phone: null, is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: agentId, email: 'agente@cosmeticosbellet.com', password: hash('agent123'), role: 'agent', first_name: 'Agente', last_name: 'Ventas', company_name: null, phone: null, is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: wholesaleId, email: 'mayorista@demo.com', password: hash('mayoreo123'), role: 'wholesale', first_name: 'Demo', last_name: 'Mayorista', company_name: 'Distribuidora Demo', phone: '55 1234 5678', is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  );

  const cats = [
    { id: uuidv4(), name: 'Ceras', slug: 'ceras' },
    { id: uuidv4(), name: 'Aquacolor', slug: 'aquacolor' },
    { id: uuidv4(), name: 'FX', slug: 'fx' },
    { id: uuidv4(), name: 'Pastas', slug: 'pastas' },
    { id: uuidv4(), name: 'Skincare', slug: 'skincare' },
    { id: uuidv4(), name: 'Catrinas', slug: 'catrinas' },
    { id: uuidv4(), name: 'Cursos', slug: 'cursos' }
  ];
  store.categories.push(...cats);

  const productData = [
    { cat: 0, name: 'Cera Moldeable Profesional 50g', price: 189, stock: 45, sku: 'CER-001' },
    { cat: 0, name: 'Cera Moldeable Profesional 100g', price: 299, stock: 30, sku: 'CER-002' },
    { cat: 0, name: 'Cera para Cejas 25g', price: 129, stock: 60, sku: 'CER-003' },
    { cat: 1, name: 'Aquacolor Blanco 30ml', price: 159, stock: 80, sku: 'AQC-001' },
    { cat: 1, name: 'Aquacolor Negro 30ml', price: 159, stock: 75, sku: 'AQC-002' },
    { cat: 1, name: 'Paleta Aquacolor 12 Colores', price: 549, stock: 25, sku: 'AQC-003' },
    { cat: 1, name: 'Aquacolor Rojo 30ml', price: 159, stock: 70, sku: 'AQC-004' },
    { cat: 2, name: 'Sangre Artificial 120ml', price: 189, stock: 55, sku: 'FX-001' },
    { cat: 2, name: 'Látex Líquido 60ml', price: 219, stock: 40, sku: 'FX-002' },
    { cat: 2, name: 'Kit de Heridas FX', price: 399, stock: 20, sku: 'FX-003' },
    { cat: 2, name: 'Gelatin FX Pro', price: 249, stock: 35, sku: 'FX-004' },
    { cat: 3, name: 'Pasta para Modelar 3D 100g', price: 279, stock: 30, sku: 'PAS-001' },
    { cat: 3, name: 'Pasta Cicatriz Rápida', price: 199, stock: 45, sku: 'PAS-002' },
    { cat: 4, name: 'Mascarilla Capilar Keratina', price: 349, stock: 40, sku: 'SK-001' },
    { cat: 4, name: 'Tratamiento Aceite de Coco y Argán', price: 249, stock: 50, sku: 'SK-002' },
    { cat: 4, name: 'Sérum Ácido Hialurónico', price: 299, stock: 30, sku: 'SK-003' },
    { cat: 5, name: 'Kit Catrina Profesional', price: 899, stock: 15, sku: 'CAT-001' },
    { cat: 5, name: 'Paleta Catrina 6 Colores', price: 449, stock: 25, sku: 'CAT-002' },
    { cat: 5, name: 'Diamantina Facial Catrina', price: 89, stock: 100, sku: 'CAT-003' },
    { cat: 6, name: 'Combo Máster Bellet', price: 1999, stock: 999, sku: 'CUR-001' },
    { cat: 6, name: 'Taller del Terror', price: 799, stock: 999, sku: 'CUR-002' },
    { cat: 6, name: 'Taller Cráneo Artístico', price: 699, stock: 999, sku: 'CUR-003' },
    { cat: 6, name: 'Clase Body Paint Básico', price: 499, stock: 999, sku: 'CUR-004' }
  ];
  productData.forEach(p => {
    store.products.push({
      id: uuidv4(), name: p.name, slug: p.name.toLowerCase().replace(/\s+/g,'-'), description: '',
      price: p.price, wholesale_price: Math.round(p.price * 0.7), category_id: cats[p.cat].id,
      sku: p.sku, stock: p.stock, image_url: null, is_active: 1, external_id: null, external_url: null,
      tags: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      category_name: cats[p.cat].name
    });
  });

  const segments = ['lead','prospect','customer','vip','wholesale'];
  const sources = ['website','whatsapp','email','social','referral'];
  for (let i = 0; i < 10; i++) {
    store.customers.push({
      id: uuidv4(), name: `Cliente ${i+1}`, email: `cliente${i+1}@email.com`, phone: `55${Math.floor(10000000+Math.random()*90000000)}`,
      segment: segments[i % 5], source: sources[i % 5], lead_score: Math.floor(Math.random()*100),
      city: 'CDMX', notes: '', tags: null, user_id: i===9?wholesaleId:null, last_interaction: new Date().toISOString(),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
  }

  const statuses = ['pending','confirmed','processing','shipped','delivered'];
  const channels = ['website','whatsapp','b2b'];
  for (let i = 0; i < 15; i++) {
    const cust = store.customers[i % 10];
    store.orders.push({
      id: uuidv4(), order_number: `BEL-${String(2000+i).padStart(4,'0')}`,
      customer_id: cust.id, customer_name: cust.name, user_id: null,
      status: statuses[i % 5], channel: channels[i % 3],
      subtotal: Math.floor(200+Math.random()*2000), tax: 0, total: Math.floor(200+Math.random()*2000),
      payment_status: i%3===0?'paid':'pending', payment_method: 'card',
      notes: '', created_at: new Date(Date.now() - i*86400000).toISOString(), updated_at: new Date().toISOString()
    });
  }

  store.automations.push(
    { id: uuidv4(), name: 'Seguimiento de lead (24h)', trigger_type: 'lead_no_response', action_type: 'send_email', config: '{}', is_active: 1, execution_count: 47, created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Carrito abandonado', trigger_type: 'cart_abandoned', action_type: 'send_email', config: '{}', is_active: 1, execution_count: 125, created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Recordatorio de compra', trigger_type: 'last_purchase_30d', action_type: 'send_email', config: '{}', is_active: 1, execution_count: 89, created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Bienvenida nuevo cliente', trigger_type: 'new_customer', action_type: 'send_email', config: '{}', is_active: 1, execution_count: 234, created_at: new Date().toISOString() },
    { id: uuidv4(), name: 'Promoción VIP', trigger_type: 'customer_vip', action_type: 'send_whatsapp', config: '{}', is_active: 0, execution_count: 12, created_at: new Date().toISOString() }
  );

  for (let i = 0; i < 4; i++) {
    const cId = uuidv4();
    const cust = store.customers[i];
    store.conversations.push({
      id: cId, customer_id: cust.id, customer_name: cust.name, channel: sources[i],
      subject: 'Consulta', status: i<2?'active':'closed', assigned_to: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    store.messages.push(
      { id: uuidv4(), conversation_id: cId, role: 'customer', content: 'Hola, quisiera información', created_at: new Date().toISOString() },
      { id: uuidv4(), conversation_id: cId, role: 'ai', content: '¡Hola! Con gusto te ayudo. ¿Qué producto buscas?', created_at: new Date().toISOString() }
    );
  }
}

function getStore() { seedData(); return store; }

module.exports = { getStore };
