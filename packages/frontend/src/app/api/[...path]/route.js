import { NextResponse } from 'next/server';
import { getStore } from '../../../lib/store';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'bellet-commerce-jwt-secret-2026-production';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

function auth(req) {
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), JWT_SECRET); } catch { return null; }
}

async function geminiChat(message, products) {
  if (!GEMINI_KEY) return null;
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    let prompt = `Eres Bella, asistente virtual de Cosméticos Bellet (cosmeticosbellet.com). Tienda mexicana de maquillaje artístico profesional. Responde siempre en español, tono cálido y profesional. Máximo 1-2 emojis. Teléfono: 56 2045 6394. Email: ventas@cosmeticosbellet.com.`;
    if (products.length > 0) {
      prompt += '\n\nProductos relevantes:\n';
      products.forEach(p => { prompt += `- ${p.name} | $${p.price} MXN | ${p.category_name}\n`; });
    }
    prompt += `\n\nCliente: ${message}\nBella:`;
    const r = await model.generateContent(prompt);
    return r.response.text();
  } catch (e) { console.error('Gemini error:', e.message); return null; }
}

export async function GET(req, { params }) {
  const { path } = await params;
  const p = path.join('/');
  const store = getStore();
  const user = auth(req);
  const url = new URL(req.url);

  if (p === 'health') return NextResponse.json({ status: 'ok', service: 'Bellet AI Commerce API' });

  if (p === 'auth/me') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const u = store.users.find(u => u.id === user.id);
    if (!u) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const { password, ...safe } = u;
    return NextResponse.json(safe);
  }

  if (p === 'products/categories') return NextResponse.json(store.categories);

  if (p === 'products') {
    const search = url.searchParams.get('search')?.toLowerCase();
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    let prods = store.products.filter(p => p.is_active);
    if (search) prods = prods.filter(p => p.name.toLowerCase().includes(search) || (p.category_name||'').toLowerCase().includes(search));
    return NextResponse.json(prods.slice(0, limit));
  }

  if (p === 'customers') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    return NextResponse.json(store.customers);
  }

  if (p === 'orders') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    let orders = store.orders;
    if (user.role === 'wholesale') orders = orders.filter(o => o.user_id === user.id);
    return NextResponse.json(orders);
  }

  if (p === 'conversations') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    return NextResponse.json(store.conversations);
  }

  if (p.startsWith('conversations/') && p.endsWith('/messages')) {
    const cId = p.split('/')[1];
    return NextResponse.json(store.messages.filter(m => m.conversation_id === cId));
  }

  if (p === 'automations') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    return NextResponse.json(store.automations);
  }

  if (p === 'analytics/dashboard') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const s = store;
    const channelStats = Object.entries(s.customers.reduce((a,c) => { a[c.source]=(a[c.source]||0)+1; return a; }, {})).map(([source,count]) => ({source,count}));
    const segmentStats = Object.entries(s.customers.reduce((a,c) => { a[c.segment]=(a[c.segment]||0)+1; return a; }, {})).map(([segment,count]) => ({segment,count}));
    return NextResponse.json({
      totals: { customers: s.customers.length, leads: s.customers.filter(c=>c.segment==='lead').length, orders: s.orders.length, revenue: s.orders.reduce((a,o)=>a+o.total,0), activeConversations: s.conversations.filter(c=>c.status==='active').length, products: s.products.length },
      recentOrders: s.orders.slice(0, 5), channelStats, segmentStats,
      topProducts: s.products.slice(0,5).map(p => ({name:p.name,order_count:Math.floor(Math.random()*10),revenue:p.price*Math.floor(Math.random()*10)}))
    });
  }

  if (p === 'analytics/leads') {
    const s = store;
    return NextResponse.json({
      bySource: Object.entries(s.customers.reduce((a,c)=>{a[c.source]=(a[c.source]||0)+1;return a;},{})).map(([source,count])=>({source,count})),
      bySegment: Object.entries(s.customers.reduce((a,c)=>{a[c.segment]=(a[c.segment]||0)+1;return a;},{})).map(([segment,count])=>({segment,count}))
    });
  }

  if (p === 'analytics/sales') {
    const s = store;
    return NextResponse.json({
      byChannel: Object.entries(s.orders.reduce((a,o)=>{if(!a[o.channel])a[o.channel]={count:0,revenue:0};a[o.channel].count++;a[o.channel].revenue+=o.total;return a;},{})).map(([channel,d])=>({channel,...d})),
      byStatus: Object.entries(s.orders.reduce((a,o)=>{a[o.status]=(a[o.status]||0)+1;return a;},{})).map(([status,count])=>({status,count}))
    });
  }

  if (p === 'analytics/campaigns') return NextResponse.json(store.campaigns);

  return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
}

export async function POST(req, { params }) {
  const { path } = await params;
  const p = path.join('/');
  const store = getStore();
  const body = await req.json().catch(() => ({}));
  const user = auth(req);

  if (p === 'auth/login') {
    const u = store.users.find(u => u.email === body.email);
    if (!u || !bcrypt.compareSync(body.password, u.password)) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password, ...safe } = u;
    return NextResponse.json({ user: safe, token });
  }

  if (p === 'auth/register') {
    if (store.users.find(u => u.email === body.email)) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 });
    const newUser = { id: uuidv4(), email: body.email, password: bcrypt.hashSync(body.password, 10), role: 'wholesale', first_name: body.first_name||'', last_name: body.last_name||'', company_name: body.company_name||null, phone: body.phone||null, is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    store.users.push(newUser);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password, ...safe } = newUser;
    return NextResponse.json({ user: safe, token });
  }

  if (p === 'customers') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const c = { id: uuidv4(), ...body, lead_score: body.lead_score||0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    store.customers.push(c);
    return NextResponse.json(c, { status: 201 });
  }

  if (p === 'orders') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const o = { id: uuidv4(), order_number: `BEL-${String(3000+store.orders.length).padStart(4,'0')}`, customer_id: user.id, customer_name: user.first_name, user_id: user.id, status: 'pending', channel: 'b2b', ...body, payment_status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    store.orders.push(o);
    return NextResponse.json(o, { status: 201 });
  }

  if (p === 'conversations/chat') {
    const msg = body.message;
    if (!msg) return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    const lower = msg.toLowerCase();
    const search = store.products.filter(p => lower.split(' ').some(w => w.length>3 && p.name.toLowerCase().includes(w))).slice(0,5);
    let response = await geminiChat(msg, search);
    if (!response) {
      if (/^(hola|hey|hi|buenos)/i.test(lower)) response = '¡Hola! Soy Bella, tu asistente virtual de Cosméticos Bellet. ¿En qué puedo ayudarte hoy?';
      else if (search.length>0) { response = 'Te recomiendo:\n\n'; search.slice(0,3).forEach(p=>{response+=`• ${p.name} — $${p.price} MXN\n`;}); response+='\n¿Te gustaría más información?'; }
      else response = 'Soy Bella de Cosméticos Bellet. Puedo ayudarte con productos, precios, pedidos, compras al mayoreo y cursos de maquillaje. ¿En qué te asisto?';
    }
    const cId = body.conversation_id || uuidv4();
    return NextResponse.json({ conversation_id: cId, response, metadata: { model: GEMINI_KEY ? 'gemini-2.0-flash' : 'fallback', geminiEnabled: !!GEMINI_KEY } });
  }

  if (p.endsWith('/messages') && p.startsWith('conversations/')) {
    const cId = p.split('/')[1];
    const m = { id: uuidv4(), conversation_id: cId, role: 'agent', content: body.content, created_at: new Date().toISOString() };
    store.messages.push(m);
    return NextResponse.json(m, { status: 201 });
  }

  if (p === 'automations') {
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const a = { id: uuidv4(), ...body, is_active: body.is_active !== false ? 1 : 0, execution_count: 0, created_at: new Date().toISOString() };
    store.automations.push(a);
    return NextResponse.json(a, { status: 201 });
  }

  if (p === 'analytics/campaigns') {
    const c = { id: uuidv4(), ...body, status: 'draft', recipients_count: 0, open_count: 0, click_count: 0, created_at: new Date().toISOString() };
    store.campaigns.push(c);
    return NextResponse.json(c, { status: 201 });
  }

  return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
}

export async function PUT(req, { params }) {
  const { path } = await params;
  const p = path.join('/');
  const store = getStore();
  const body = await req.json().catch(() => ({}));
  const user = auth(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (p.startsWith('automations/')) {
    const id = p.split('/')[1];
    const idx = store.automations.findIndex(a => a.id === id);
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    store.automations[idx] = { ...store.automations[idx], ...body, is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : store.automations[idx].is_active };
    return NextResponse.json(store.automations[idx]);
  }

  return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
}

export async function DELETE(req, { params }) {
  const { path } = await params;
  const p = path.join('/');
  const store = getStore();
  const user = auth(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (p.startsWith('customers/')) {
    const id = p.split('/')[1];
    const idx = store.customers.findIndex(c => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    store.customers.splice(idx, 1);
    return NextResponse.json({ message: 'Eliminado' });
  }

  if (p.startsWith('automations/')) {
    const id = p.split('/')[1];
    const idx = store.automations.findIndex(a => a.id === id);
    if (idx === -1) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    store.automations.splice(idx, 1);
    return NextResponse.json({ message: 'Eliminado' });
  }

  return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
}
