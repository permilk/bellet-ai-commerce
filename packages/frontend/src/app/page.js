'use client';
import { useState, useEffect, useRef } from 'react';
import { api, login as apiLogin, register as apiRegister, logout, getUser, getToken } from '../lib/api';
import { Icons, channelIcon, statusBadge, segmentBadge, statusLabel, segmentLabel, channelLabel, formatDate, formatMoney } from '../lib/icons';

export default function BelletApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const s = getUser(); const t = getToken(); if (s && t) setUser(s); setLoading(false); }, []);
  if (loading) return <div className="loading-spinner"><div className="spinner"></div>Cargando...</div>;
  if (!user) return <LoginPage onLogin={setUser} />;
  if (user.role === 'wholesale') return <B2BPortal user={user} />;
  return <AdminDashboard user={user} />;
}

/* ========== LOGIN ========== */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isReg, setIsReg] = useState(false);
  const [reg, setReg] = useState({ first_name: '', last_name: '', company_name: '', phone: '' });

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const data = isReg ? await apiRegister({ email, password, ...reg }) : await apiLogin(email, password);
      onLogin(data.user);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{textAlign:'center',marginBottom:20}}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#d63384"/><path d="M14 32c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><circle cx="24" cy="16" r="5" stroke="#fff" strokeWidth="2.5"/></svg>
        </div>
        <div className="login-title">Cosméticos Bellet</div>
        <div className="login-subtitle">{isReg ? 'Registro de cliente mayorista' : 'Sistema de gestión comercial con IA'}</div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={submit}>
          {isReg && <>
            <div className="input-group"><label>Nombre</label><input className="input" value={reg.first_name} onChange={e => setReg({...reg, first_name: e.target.value})} placeholder="Tu nombre" /></div>
            <div className="input-group"><label>Apellido</label><input className="input" value={reg.last_name} onChange={e => setReg({...reg, last_name: e.target.value})} placeholder="Tu apellido" /></div>
            <div className="input-group"><label>Empresa</label><input className="input" value={reg.company_name} onChange={e => setReg({...reg, company_name: e.target.value})} placeholder="Nombre de tu empresa" /></div>
            <div className="input-group"><label>Teléfono</label><input className="input" value={reg.phone} onChange={e => setReg({...reg, phone: e.target.value})} placeholder="55 1234 5678" /></div>
          </>}
          <div className="input-group"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required /></div>
          <div className="input-group"><label>Contraseña</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <button type="submit" className="btn btn-primary login-btn">{isReg ? 'Registrarse' : 'Iniciar sesión'}</button>
        </form>
        <div className="login-footer"><button className="btn btn-ghost" onClick={() => setIsReg(!isReg)}>{isReg ? '← Volver al inicio de sesión' : '¿Mayorista? Regístrate aquí'}</button></div>
        {!isReg && <div className="login-demo">Demo: admin@cosmeticosbellet.com / admin123</div>}
      </div>
    </div>
  );
}

/* ========== ADMIN DASHBOARD SHELL ========== */
function AdminDashboard({ user }) {
  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => { api('/analytics/dashboard').then(setStats).catch(console.error); }, []);

  const navItems = [
    { id: 'dashboard', icon: Icons.dashboard, label: 'Dashboard', section: 'Principal' },
    { id: 'leads', icon: Icons.leads, label: 'Leads', section: 'CRM' },
    { id: 'customers', icon: Icons.users, label: 'Clientes', section: 'CRM' },
    { id: 'conversations', icon: Icons.chat, label: 'Conversaciones', section: 'CRM', badge: stats?.totals?.activeConversations },
    { id: 'orders', icon: Icons.cart, label: 'Pedidos', section: 'Ventas' },
    { id: 'products', icon: Icons.box, label: 'Productos', section: 'Ventas' },
    { id: 'campaigns', icon: Icons.megaphone, label: 'Campañas', section: 'Marketing' },
    { id: 'automations', icon: Icons.zap, label: 'Automatizaciones', section: 'Marketing' },
    { id: 'analytics', icon: Icons.chart, label: 'Analíticas', section: 'Reportes' },
  ];
  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#d63384"/><path d="M8 19c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/><circle cx="14" cy="9.5" r="3" stroke="#fff" strokeWidth="1.8"/></svg>
            Bellet AI
          </div>
          <div className="sidebar-subtitle">Plataforma Comercial</div>
        </div>
        <nav className="sidebar-nav">
          {sections.map(sec => (
            <div key={sec}>
              <div className="nav-section-title">{sec}</div>
              {navItems.filter(i => i.section === sec).map(item => (
                <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
                  {item.icon({ size: 17 })}
                  {item.label}
                  {item.badge > 0 && <span className="nav-item-badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user.first_name||'A')[0]}</div>
            <div><div className="user-name">{user.first_name} {user.last_name}</div><div className="user-role">{user.role === 'admin' ? 'Administrador' : 'Agente'}</div></div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{marginTop:8,width:'100%',color:'rgba(255,255,255,0.5)'}} onClick={logout}><Icons.logout size={14}/> Cerrar sesión</button>
        </div>
      </aside>
      <main className="main-content">
        {view === 'dashboard' && <DashboardView stats={stats} />}
        {view === 'leads' && <LeadsView />}
        {view === 'customers' && <CustomersView />}
        {view === 'conversations' && <ConversationsView />}
        {view === 'orders' && <OrdersView />}
        {view === 'products' && <ProductsView />}
        {view === 'campaigns' && <CampaignsView />}
        {view === 'automations' && <AutomationsView />}
        {view === 'analytics' && <AnalyticsView />}
      </main>
      <ChatWidget />
    </div>
  );
}

/* ========== DASHBOARD VIEW ========== */
function DashboardView({ stats }) {
  if (!stats) return <div className="loading-spinner"><div className="spinner"></div>Cargando dashboard...</div>;
  const { totals, recentOrders, channelStats, segmentStats, topProducts } = stats;
  const statCards = [
    { label: 'Clientes totales', value: totals.customers, icon: 'pink', change: '+12%' },
    { label: 'Leads activos', value: totals.leads, icon: 'blue', change: '+8%' },
    { label: 'Pedidos', value: totals.orders, icon: 'yellow', change: '+15%' },
    { label: 'Ingresos', value: formatMoney(totals.revenue), icon: 'green', change: 'MXN' },
    { label: 'Conversaciones', value: totals.activeConversations, icon: 'pink', change: 'activas' },
    { label: 'Productos', value: totals.products, icon: 'blue', change: 'en catálogo' },
  ];
  const iconMap = { pink: Icons.users, blue: Icons.leads, yellow: Icons.cart, green: Icons.dollar };
  return (
    <>
      <div className="page-header"><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Resumen general del sistema comercial</p></div>
      <div className="page-body">
        <div className="stats-grid">
          {statCards.map((c, i) => { const Ic = iconMap[c.icon]; return (
            <div key={i} className="card">
              <div className={`stat-icon ${c.icon}`}><Ic size={20}/></div>
              <div className="card-title">{c.label}</div>
              <div className="card-value">{c.value}</div>
              <div className={`card-change ${c.change.startsWith('+') ? 'positive' : ''}`}>{c.change}</div>
            </div>
          );})}
        </div>
        <div className="grid-2">
          <div className="table-container">
            <div className="table-header"><span className="table-title">Leads por canal</span></div>
            <table><thead><tr><th>Canal</th><th>Cantidad</th><th>Porcentaje</th></tr></thead>
            <tbody>{channelStats?.map((ch, i) => <tr key={i}><td style={{display:'flex',alignItems:'center',gap:8}}>{channelIcon(ch.source)} {channelLabel(ch.source)}</td><td><strong>{ch.count}</strong></td><td>{Math.round(ch.count / totals.customers * 100)}%</td></tr>)}</tbody></table>
          </div>
          <div className="table-container">
            <div className="table-header"><span className="table-title">Segmentación de clientes</span></div>
            <table><thead><tr><th>Segmento</th><th>Cantidad</th><th>Porcentaje</th></tr></thead>
            <tbody>{segmentStats?.map((s, i) => <tr key={i}><td><span className={`badge ${segmentBadge(s.segment)}`}>{segmentLabel(s.segment)}</span></td><td><strong>{s.count}</strong></td><td>{Math.round(s.count / totals.customers * 100)}%</td></tr>)}</tbody></table>
          </div>
        </div>
        <div className="grid-2" style={{marginTop:20}}>
          <div className="table-container">
            <div className="table-header"><span className="table-title">Pedidos recientes</span></div>
            <table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>{recentOrders?.map((o, i) => <tr key={i}><td><strong>{o.order_number}</strong></td><td>{o.customer_name || '—'}</td><td>{formatMoney(o.total)}</td><td><span className={`badge ${statusBadge(o.status)}`}>{statusLabel(o.status)}</span></td></tr>)}</tbody></table>
          </div>
          <div className="table-container">
            <div className="table-header"><span className="table-title">Productos más vendidos</span></div>
            <table><thead><tr><th>Producto</th><th>Pedidos</th><th>Ingresos</th></tr></thead>
            <tbody>{topProducts?.length > 0 ? topProducts.map((p, i) => <tr key={i}><td>{p.name}</td><td><strong>{p.order_count}</strong></td><td>{formatMoney(p.revenue)}</td></tr>) : <tr><td colSpan="3" style={{textAlign:'center',color:'var(--text-muted)'}}>Sin datos aún</td></tr>}</tbody></table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ========== LEADS ========== */
function LeadsView() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api('/customers').then(setCustomers).catch(console.error); }, []);
  const stages = [
    { id: 'lead', title: 'Leads', color: 'var(--info)' },
    { id: 'prospect', title: 'Prospectos', color: 'var(--warning)' },
    { id: 'customer', title: 'Clientes', color: 'var(--success)' },
    { id: 'vip', title: 'VIP', color: 'var(--accent)' },
    { id: 'wholesale', title: 'Mayoristas', color: 'var(--text-secondary)' },
  ];
  return (
    <>
      <div className="page-header"><h1 className="page-title">Pipeline de leads</h1><p className="page-subtitle">Gestión y seguimiento de leads por etapa</p></div>
      <div className="page-body">
        <div className="pipeline">
          {stages.map(st => { const items = customers.filter(c => c.segment === st.id); return (
            <div key={st.id} className="pipeline-column">
              <div className="pipeline-column-header">
                <span className="pipeline-column-title"><span style={{width:8,height:8,borderRadius:'50%',background:st.color,display:'inline-block',marginRight:6}}></span>{st.title}</span>
                <span className="pipeline-column-count">{items.length}</span>
              </div>
              <div className="pipeline-column-body">
                {items.map(c => (
                  <div key={c.id} className="pipeline-card">
                    <div className="pipeline-card-name">{c.name || 'Sin nombre'}</div>
                    <div className="pipeline-card-email">{c.email || c.phone || '—'}</div>
                    <div className="pipeline-card-footer">
                      <span className="pipeline-card-score" style={{background: c.lead_score > 60 ? 'var(--success-bg)' : c.lead_score > 30 ? 'var(--warning-bg)' : 'var(--info-bg)', color: c.lead_score > 60 ? 'var(--success)' : c.lead_score > 30 ? 'var(--warning)' : 'var(--info)'}}>Score: {c.lead_score}</span>
                      <span style={{fontSize:10,color:'var(--text-muted)'}}>{channelLabel(c.source)}</span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:20}}>Sin registros</div>}
              </div>
            </div>
          );})}
        </div>
      </div>
    </>
  );
}

/* ========== CUSTOMERS ========== */
function CustomersView() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', segment: 'lead', source: 'website' });
  useEffect(() => { loadCustomers(); }, []);
  const loadCustomers = () => api('/customers').then(setList).catch(console.error);
  const filtered = list.filter(c => !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.email||'').toLowerCase().includes(search.toLowerCase()));

  const addCustomer = async () => {
    try { await api('/customers', { method: 'POST', body: JSON.stringify(form) }); setShowAdd(false); setForm({ name:'', email:'', phone:'', segment:'lead', source:'website' }); loadCustomers(); } catch(e) { alert(e.message); }
  };
  const deleteCustomer = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await api(`/customers/${id}`, { method: 'DELETE' }); loadCustomers(); } catch(e) { alert(e.message); }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1 className="page-title">Clientes</h1><p className="page-subtitle">Base de datos de clientes y leads</p></div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Icons.plus size={15}/> Nuevo cliente</button>
        </div>
      </div>
      <div className="page-body">
        <div style={{marginBottom:16,position:'relative',maxWidth:360}}>
          <Icons.search size={15} />
          <input className="input" placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft:34}} />
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Segmento</th><th>Score</th><th>Fuente</th><th>Ciudad</th><th></th></tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id}><td><strong>{c.name||'—'}</strong></td><td>{c.email||'—'}</td><td>{c.phone||'—'}</td><td><span className={`badge ${segmentBadge(c.segment)}`}>{segmentLabel(c.segment)}</span></td><td><strong>{c.lead_score}</strong></td><td style={{display:'flex',alignItems:'center',gap:6}}>{channelIcon(c.source)} {channelLabel(c.source)}</td><td>{c.city||'—'}</td><td><button className="btn btn-ghost btn-sm" onClick={() => deleteCustomer(c.id)}><Icons.trash size={14}/></button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {showAdd && <Modal title="Nuevo cliente" onClose={() => setShowAdd(false)} onSave={addCustomer}>
        <div className="input-group"><label>Nombre</label><input className="input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} /></div>
        <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></div>
        <div className="input-group"><label>Teléfono</label><input className="input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></div>
        <div className="input-group"><label>Segmento</label><select value={form.segment} onChange={e => setForm({...form,segment:e.target.value})}><option value="lead">Lead</option><option value="prospect">Prospecto</option><option value="customer">Cliente</option><option value="vip">VIP</option><option value="wholesale">Mayorista</option></select></div>
        <div className="input-group"><label>Fuente</label><select value={form.source} onChange={e => setForm({...form,source:e.target.value})}><option value="website">Sitio web</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="social">Redes sociales</option><option value="referral">Referido</option></select></div>
      </Modal>}
    </>
  );
}

/* ========== CONVERSATIONS ========== */
function ConversationsView() {
  const [convos, setConvos] = useState([]);
  const [sel, setSel] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [reply, setReply] = useState('');
  useEffect(() => { api('/conversations').then(setConvos).catch(console.error); }, []);
  const select = async (c) => { setSel(c); try { setMsgs(await api(`/conversations/${c.id}/messages`)); } catch(e) { console.error(e); } };
  const sendReply = async () => {
    if (!reply.trim() || !sel) return;
    try { await api(`/conversations/${sel.id}/messages`, { method:'POST', body: JSON.stringify({ content: reply }) }); setMsgs([...msgs, { role:'agent', content:reply, created_at: new Date().toISOString() }]); setReply(''); } catch(e) { console.error(e); }
  };
  return (
    <>
      <div className="page-header"><h1 className="page-title">Conversaciones</h1><p className="page-subtitle">Inbox de mensajes multicanal</p></div>
      <div className="inbox-layout">
        <div className="inbox-list">
          {convos.map(c => (
            <div key={c.id} className={`inbox-item ${sel?.id===c.id?'active':''}`} onClick={() => select(c)}>
              <div className="inbox-item-avatar">{channelIcon(c.channel)}</div>
              <div className="inbox-item-content"><div className="inbox-item-name">{c.customer_name||'Visitante'}</div><div className="inbox-item-preview">{c.subject||'...'}</div></div>
              <span className={`badge ${c.status==='escalated'?'badge-danger':c.status==='active'?'badge-success':'badge-neutral'}`} style={{fontSize:10}}>{c.status==='escalated'?'Escalado':c.status==='active'?'Activo':'Cerrado'}</span>
            </div>
          ))}
          {convos.length===0 && <div className="empty-state"><Icons.chat size={40}/><div className="empty-state-title">Sin conversaciones</div></div>}
        </div>
        <div className="inbox-detail">
          {sel ? (<>
            <div className="inbox-detail-header"><div><strong>{sel.customer_name||'Visitante'}</strong> <span className={`badge ${segmentBadge(sel.channel)}`} style={{marginLeft:8}}>{channelLabel(sel.channel)}</span></div></div>
            <div className="inbox-messages">{msgs.map((m,i) => <div key={i} className={`chat-message ${m.role}`}><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:3}}>{m.role==='customer'?'Cliente':m.role==='ai'?'Bella IA':'Agente'}</div>{m.content}</div>)}</div>
            <div className="chat-input-area"><input value={reply} onChange={e => setReply(e.target.value)} placeholder="Escribe una respuesta..." onKeyDown={e => e.key==='Enter' && sendReply()} /><button className="chat-send" onClick={sendReply}><Icons.send size={16}/></button></div>
          </>) : <div className="empty-state" style={{margin:'auto'}}><Icons.chat size={40}/><div className="empty-state-title">Selecciona una conversación</div></div>}
        </div>
      </div>
    </>
  );
}

/* ========== ORDERS ========== */
function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { api('/orders').then(setOrders).catch(console.error); }, []);
  const filtered = filter ? orders.filter(o => o.status === filter) : orders;
  const tabs = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'processing', label: 'Procesando' },
    { value: 'shipped', label: 'Enviados' },
    { value: 'delivered', label: 'Entregados' },
  ];
  return (
    <>
      <div className="page-header"><h1 className="page-title">Pedidos</h1><p className="page-subtitle">Gestión de pedidos y envíos</p></div>
      <div className="page-body">
        <div className="tabs">{tabs.map(t => <button key={t.value} className={`tab ${filter===t.value?'active':''}`} onClick={() => setFilter(t.value)}>{t.label} {t.value && `(${orders.filter(o=>o.status===t.value).length})`}</button>)}</div>
        <div className="table-container">
          <table><thead><tr><th>Pedido</th><th>Cliente</th><th>Canal</th><th>Total</th><th>Pago</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>{filtered.map(o => <tr key={o.id}><td><strong>{o.order_number}</strong></td><td>{o.customer_name||'—'}</td><td style={{display:'flex',alignItems:'center',gap:6}}>{channelIcon(o.channel)} {channelLabel(o.channel)}</td><td><strong>{formatMoney(o.total)}</strong></td><td><span className={`badge ${o.payment_status==='paid'?'badge-success':'badge-warning'}`}>{o.payment_status==='paid'?'Pagado':'Pendiente'}</span></td><td><span className={`badge ${statusBadge(o.status)}`}>{statusLabel(o.status)}</span></td><td>{formatDate(o.created_at)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ========== PRODUCTS ========== */
function ProductsView() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [catF, setCatF] = useState('');
  useEffect(() => { api('/products').then(setProducts).catch(console.error); api('/products/categories').then(setCats).catch(console.error); }, []);
  const filtered = catF ? products.filter(p => p.category_id === catF) : products;
  return (
    <>
      <div className="page-header"><h1 className="page-title">Catálogo de productos</h1><p className="page-subtitle">{products.length} productos activos</p></div>
      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${!catF?'active':''}`} onClick={() => setCatF('')}>Todos</button>
          {cats.map(c => <button key={c.id} className={`tab ${catF===c.id?'active':''}`} onClick={() => setCatF(c.id)}>{c.name}</button>)}
        </div>
        <div className="products-grid">{filtered.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-image"><Icons.box size={48}/></div>
            <div className="product-info">
              <div className="product-name">{p.name}</div>
              <div className="product-category">{p.category_name||'General'}</div>
              <div className="product-prices"><span className="product-price">{formatMoney(p.price)} MXN</span>{p.wholesale_price && <span className="product-wholesale-price">Mayoreo: {formatMoney(p.wholesale_price)}</span>}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span className={`badge ${p.stock>20?'badge-success':p.stock>0?'badge-warning':'badge-danger'}`}>Stock: {p.stock}</span><span style={{fontSize:11,color:'var(--text-muted)'}}>{p.sku}</span></div>
            </div>
          </div>
        ))}</div>
      </div>
    </>
  );
}

/* ========== CAMPAIGNS ========== */
function CampaignsView() {
  const [campaigns, setCampaigns] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', type:'email', segment:'all', subject:'', content:'' });
  useEffect(() => { loadCampaigns(); }, []);
  const loadCampaigns = () => api('/analytics/campaigns').then(setCampaigns).catch(console.error);
  const createCampaign = async () => {
    try { await api('/analytics/campaigns', { method:'POST', body: JSON.stringify(form) }); setShowAdd(false); setForm({ name:'', type:'email', segment:'all', subject:'', content:'' }); loadCampaigns(); } catch(e) { alert(e.message); }
  };
  return (
    <>
      <div className="page-header"><div className="page-header-row"><div><h1 className="page-title">Campañas</h1><p className="page-subtitle">Campañas de marketing multicanal</p></div><button className="btn btn-primary" onClick={() => setShowAdd(true)}><Icons.plus size={15}/> Nueva campaña</button></div></div>
      <div className="page-body">
        {campaigns.length===0 ? <div className="empty-state"><Icons.megaphone size={48}/><div className="empty-state-title">Sin campañas aún</div><p style={{color:'var(--text-muted)',marginTop:6}}>Crea tu primera campaña de marketing</p><button className="btn btn-primary" style={{marginTop:16}} onClick={() => setShowAdd(true)}><Icons.plus size={15}/> Crear campaña</button></div> : (
          <div className="table-container"><table><thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Destinatarios</th><th>Aperturas</th><th>Clics</th></tr></thead>
          <tbody>{campaigns.map(c => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.type==='email'?'Email':'WhatsApp'}</td><td><span className={`badge ${c.status==='sent'?'badge-success':c.status==='draft'?'badge-neutral':'badge-warning'}`}>{c.status==='sent'?'Enviada':c.status==='draft'?'Borrador':'Programada'}</span></td><td>{c.recipients_count||0}</td><td>{c.open_count||0}</td><td>{c.click_count||0}</td></tr>)}</tbody></table></div>
        )}
      </div>
      {showAdd && <Modal title="Nueva campaña" onClose={() => setShowAdd(false)} onSave={createCampaign}>
        <div className="input-group"><label>Nombre de la campaña</label><input className="input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Promoción de verano" /></div>
        <div className="input-group"><label>Tipo</label><select value={form.type} onChange={e => setForm({...form,type:e.target.value})}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></div>
        <div className="input-group"><label>Segmento objetivo</label><select value={form.segment} onChange={e => setForm({...form,segment:e.target.value})}><option value="all">Todos</option><option value="lead">Leads</option><option value="prospect">Prospectos</option><option value="customer">Clientes</option><option value="vip">VIP</option><option value="wholesale">Mayoristas</option></select></div>
        <div className="input-group"><label>Asunto</label><input className="input" value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} placeholder="Línea de asunto" /></div>
        <div className="input-group"><label>Contenido</label><textarea rows={4} value={form.content} onChange={e => setForm({...form,content:e.target.value})} placeholder="Contenido del mensaje..." /></div>
      </Modal>}
    </>
  );
}

/* ========== AUTOMATIONS (FULL CRUD) ========== */
function AutomationsView() {
  const [autos, setAutos] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name:'', trigger_type:'new_customer', action_type:'send_email', config:'{}', is_active: true });
  useEffect(() => { loadAutos(); }, []);
  const loadAutos = () => api('/automations').then(setAutos).catch(() => {
    setAutos([
      { id:'1', name:'Seguimiento de lead (24h)', trigger_type:'lead_no_response', action_type:'send_email', is_active:1, execution_count:47 },
      { id:'2', name:'Carrito abandonado', trigger_type:'cart_abandoned', action_type:'send_email', is_active:1, execution_count:125 },
      { id:'3', name:'Recordatorio de compra', trigger_type:'last_purchase_30d', action_type:'send_email', is_active:1, execution_count:89 },
      { id:'4', name:'Bienvenida nuevo cliente', trigger_type:'new_customer', action_type:'send_email', is_active:1, execution_count:234 },
      { id:'5', name:'Promoción VIP', trigger_type:'customer_vip', action_type:'send_whatsapp', is_active:0, execution_count:12 },
    ]);
  });

  const triggerLabels = { lead_no_response:'Lead sin respuesta 24h', cart_abandoned:'Carrito abandonado 2h', last_purchase_30d:'Sin compra hace 30 días', new_customer:'Nuevo registro', customer_vip:'Cliente calificado como VIP', order_delivered:'Pedido entregado', lead_high_score:'Lead con score > 60' };
  const actionLabels = { send_email:'Enviar email', send_whatsapp:'Enviar WhatsApp', assign_agent:'Asignar agente', create_task:'Crear tarea', update_segment:'Actualizar segmento' };

  const saveAuto = async () => {
    try {
      if (editItem) { await api(`/automations/${editItem.id}`, { method:'PUT', body: JSON.stringify(form) }); }
      else { await api('/automations', { method:'POST', body: JSON.stringify(form) }); }
      setShowAdd(false); setEditItem(null); setForm({ name:'', trigger_type:'new_customer', action_type:'send_email', config:'{}', is_active:true }); loadAutos();
    } catch(e) { alert(e.message); }
  };

  const toggleAuto = async (a) => {
    try { await api(`/automations/${a.id}`, { method: 'PUT', body: JSON.stringify({ ...a, is_active: a.is_active ? 0 : 1 }) }); loadAutos(); } catch(e) { /* update local */ setAutos(autos.map(x => x.id===a.id ? {...x, is_active: x.is_active?0:1} : x)); }
  };

  const deleteAuto = async (id) => {
    if (!confirm('¿Eliminar esta automatización?')) return;
    try { await api(`/automations/${id}`, { method: 'DELETE' }); loadAutos(); } catch(e) { setAutos(autos.filter(x => x.id !== id)); }
  };

  const openEdit = (a) => { setEditItem(a); setForm({ name: a.name, trigger_type: a.trigger_type, action_type: a.action_type, config: a.config || '{}', is_active: !!a.is_active }); setShowAdd(true); };

  return (
    <>
      <div className="page-header"><div className="page-header-row"><div><h1 className="page-title">Automatizaciones</h1><p className="page-subtitle">Workflows automáticos de marketing y seguimiento</p></div><button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name:'', trigger_type:'new_customer', action_type:'send_email', config:'{}', is_active:true }); setShowAdd(true); }}><Icons.plus size={15}/> Nueva automatización</button></div></div>
      <div className="page-body">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {autos.map(a => (
            <div key={a.id} className="auto-card">
              <div className="auto-card-icon" style={{background: a.is_active ? 'var(--success-bg)' : 'var(--bg-input)', color: a.is_active ? 'var(--success)' : 'var(--text-muted)'}}><Icons.zap size={22}/></div>
              <div className="auto-card-content">
                <div className="auto-card-title">{a.name}</div>
                <div className="auto-card-desc">Trigger: {triggerLabels[a.trigger_type]||a.trigger_type} → Acción: {actionLabels[a.action_type]||a.action_type}</div>
                <div className="auto-card-meta"><span>{a.execution_count||0} ejecuciones</span><span>{a.is_active ? 'Activa' : 'Pausada'}</span></div>
              </div>
              <div className="auto-card-actions">
                <button className={`toggle ${a.is_active ? 'on' : 'off'}`} onClick={() => toggleAuto(a)}></button>
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(a)}><Icons.edit size={14}/></button>
                <button className="btn btn-ghost btn-icon" onClick={() => deleteAuto(a.id)}><Icons.trash size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showAdd && <Modal title={editItem ? 'Editar automatización' : 'Nueva automatización'} onClose={() => { setShowAdd(false); setEditItem(null); }} onSave={saveAuto}>
        <div className="input-group"><label>Nombre</label><input className="input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Ej: Seguimiento de lead" /></div>
        <div className="input-group"><label>Evento disparador</label><select value={form.trigger_type} onChange={e => setForm({...form,trigger_type:e.target.value})}>{Object.entries(triggerLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="input-group"><label>Acción</label><select value={form.action_type} onChange={e => setForm({...form,action_type:e.target.value})}>{Object.entries(actionLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      </Modal>}
    </>
  );
}

/* ========== ANALYTICS ========== */
function AnalyticsView() {
  const [ld, setLd] = useState(null);
  const [sd, setSd] = useState(null);
  useEffect(() => { api('/analytics/leads').then(setLd).catch(console.error); api('/analytics/sales').then(setSd).catch(console.error); }, []);
  const maxCount = (arr) => Math.max(...(arr||[]).map(i => i.count||0), 1);
  return (
    <>
      <div className="page-header"><h1 className="page-title">Analíticas</h1><p className="page-subtitle">Reportes y métricas del negocio</p></div>
      <div className="page-body">
        <div className="grid-2">
          <div className="card"><div className="card-title">Leads por fuente</div>{ld?.bySource?.map((s,i) => <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border-light)'}}><span style={{display:'flex',alignItems:'center',gap:8}}>{channelIcon(s.source)} {channelLabel(s.source)}</span><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:100,height:5,background:'var(--bg-input)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${(s.count/maxCount(ld.bySource))*100}%`,height:'100%',background:'var(--gradient-primary)',borderRadius:3}}></div></div><strong>{s.count}</strong></div></div>)}</div>
          <div className="card"><div className="card-title">Ventas por canal</div>{sd?.byChannel?.map((s,i) => <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border-light)'}}><span style={{display:'flex',alignItems:'center',gap:8}}>{channelIcon(s.channel)} {channelLabel(s.channel)}</span><div><strong>{s.count}</strong> pedidos — <strong>{formatMoney(s.revenue)}</strong></div></div>)}</div>
        </div>
        <div className="grid-2" style={{marginTop:20}}>
          <div className="card"><div className="card-title">Pedidos por estado</div>{sd?.byStatus?.map((s,i) => <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}><span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span><strong>{s.count}</strong></div>)}</div>
          <div className="card"><div className="card-title">Clientes por segmento</div>{ld?.bySegment?.map((s,i) => <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0'}}><span className={`badge ${segmentBadge(s.segment)}`}>{segmentLabel(s.segment)}</span><strong>{s.count}</strong></div>)}</div>
        </div>
      </div>
    </>
  );
}

/* ========== B2B PORTAL ========== */
function B2BPortal({ user }) {
  const [view, setView] = useState('catalog');
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catF, setCatF] = useState('');
  useEffect(() => { api('/products').then(setProducts).catch(console.error); api('/products/categories').then(setCats).catch(console.error); api('/orders').then(setOrders).catch(console.error); }, []);

  const addToCart = (p) => { const ex = cart.find(i => i.product_id===p.id); if (ex) setCart(cart.map(i => i.product_id===p.id ? {...i, quantity:i.quantity+1} : i)); else setCart([...cart, { product_id:p.id, name:p.name, unit_price:p.wholesale_price||p.price, quantity:1 }]); };
  const removeFromCart = (pid) => setCart(cart.filter(i => i.product_id!==pid));
  const updateQty = (pid, qty) => { if (qty < 1) return removeFromCart(pid); setCart(cart.map(i => i.product_id===pid ? {...i,quantity:qty} : i)); };
  const cartTotal = cart.reduce((s,i) => s + i.unit_price * i.quantity, 0);

  const placeOrder = async () => {
    if (!cart.length) return;
    try { await api('/orders', { method:'POST', body: JSON.stringify({ items: cart, total: cartTotal + Math.round(cartTotal*0.16), subtotal: cartTotal, tax: Math.round(cartTotal*0.16) }) }); setCart([]); alert('Pedido enviado exitosamente'); api('/orders').then(setOrders); } catch(e) { alert(e.message); }
  };

  const filtered = catF ? products.filter(p => p.category_id===catF) : products;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header"><div className="sidebar-logo"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#d63384"/><rect x="7" y="8" width="14" height="12" rx="2" stroke="#fff" strokeWidth="1.8"/><path d="M7 12h14" stroke="#fff" strokeWidth="1.8"/></svg> Bellet B2B</div><div className="sidebar-subtitle">Portal mayorista</div></div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Portal</div>
          <button className={`nav-item ${view==='catalog'?'active':''}`} onClick={() => setView('catalog')}><Icons.box size={17}/> Catálogo</button>
          <button className={`nav-item ${view==='cart'?'active':''}`} onClick={() => setView('cart')}><Icons.cart size={17}/> Carrito {cart.length>0 && <span className="nav-item-badge">{cart.length}</span>}</button>
          <button className={`nav-item ${view==='orders'?'active':''}`} onClick={() => setView('orders')}><Icons.clock size={17}/> Mis pedidos</button>
          <button className={`nav-item ${view==='account'?'active':''}`} onClick={() => setView('account')}><Icons.user size={17}/> Mi cuenta</button>
        </nav>
        <div className="sidebar-footer"><div className="user-info"><div className="user-avatar">{(user.first_name||'M')[0]}</div><div><div className="user-name">{user.first_name} {user.last_name}</div><div className="user-role">{user.company_name||'Mayorista'}</div></div></div><button className="btn btn-ghost btn-sm" style={{marginTop:8,width:'100%',color:'rgba(255,255,255,0.5)'}} onClick={logout}><Icons.logout size={14}/> Cerrar sesión</button></div>
      </aside>
      <main className="main-content">
        {view==='catalog' && (<>
          <div className="page-header"><h1 className="page-title">Catálogo mayoreo</h1><p className="page-subtitle">Precios exclusivos para mayoristas</p></div>
          <div className="page-body">
            <div className="tabs"><button className={`tab ${!catF?'active':''}`} onClick={() => setCatF('')}>Todos</button>{cats.map(c => <button key={c.id} className={`tab ${catF===c.id?'active':''}`} onClick={() => setCatF(c.id)}>{c.name}</button>)}</div>
            <div className="products-grid">{filtered.map(p => <div key={p.id} className="product-card"><div className="product-image"><Icons.box size={48}/></div><div className="product-info"><div className="product-name">{p.name}</div><div className="product-category">{p.category_name}</div><div className="product-prices"><span className="product-price">{formatMoney(p.wholesale_price||p.price)} MXN</span>{p.wholesale_price && <span className="product-original-price">{formatMoney(p.price)}</span>}</div><button className="btn btn-primary btn-sm" style={{width:'100%'}} onClick={() => addToCart(p)}>Agregar al carrito</button></div></div>)}</div>
          </div>
        </>)}
        {view==='cart' && (<>
          <div className="page-header"><h1 className="page-title">Carrito de compras</h1><p className="page-subtitle">{cart.length} productos</p></div>
          <div className="page-body">
            {!cart.length ? <div className="empty-state"><Icons.cart size={48}/><div className="empty-state-title">Tu carrito está vacío</div></div> : <>
              <div className="table-container"><table><thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Total</th><th></th></tr></thead>
              <tbody>{cart.map(i => <tr key={i.product_id}><td><strong>{i.name}</strong></td><td>{formatMoney(i.unit_price)}</td><td><div style={{display:'flex',alignItems:'center',gap:6}}><button className="btn btn-secondary btn-sm" onClick={() => updateQty(i.product_id, i.quantity-1)}>−</button><span>{i.quantity}</span><button className="btn btn-secondary btn-sm" onClick={() => updateQty(i.product_id, i.quantity+1)}>+</button></div></td><td><strong>{formatMoney(i.unit_price*i.quantity)}</strong></td><td><button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(i.product_id)}><Icons.trash size={14}/></button></td></tr>)}</tbody></table></div>
              <div className="card" style={{marginTop:16,maxWidth:400,marginLeft:'auto'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Subtotal</span><strong>{formatMoney(cartTotal)}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>IVA (16%)</span><strong>{formatMoney(Math.round(cartTotal*0.16))}</strong></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:18,paddingTop:8,borderTop:'1px solid var(--border)'}}><span>Total</span><strong style={{color:'var(--accent)'}}>{formatMoney(cartTotal+Math.round(cartTotal*0.16))} MXN</strong></div>
                <button className="btn btn-primary" style={{width:'100%',marginTop:16}} onClick={placeOrder}>Enviar pedido</button>
              </div>
            </>}
          </div>
        </>)}
        {view==='orders' && (<>
          <div className="page-header"><h1 className="page-title">Mis pedidos</h1><p className="page-subtitle">Historial de compras</p></div>
          <div className="page-body"><div className="table-container"><table><thead><tr><th>Pedido</th><th>Total</th><th>Estado</th><th>Pago</th><th>Fecha</th></tr></thead>
          <tbody>{orders.map(o => <tr key={o.id}><td><strong>{o.order_number}</strong></td><td><strong>{formatMoney(o.total)}</strong></td><td><span className={`badge ${statusBadge(o.status)}`}>{statusLabel(o.status)}</span></td><td><span className={`badge ${o.payment_status==='paid'?'badge-success':'badge-warning'}`}>{o.payment_status==='paid'?'Pagado':'Pendiente'}</span></td><td>{formatDate(o.created_at)}</td></tr>)}{!orders.length && <tr><td colSpan="5" style={{textAlign:'center',color:'var(--text-muted)'}}>Sin pedidos aún</td></tr>}</tbody></table></div></div>
        </>)}
        {view==='account' && (<>
          <div className="page-header"><h1 className="page-title">Mi cuenta</h1></div>
          <div className="page-body"><div className="card" style={{maxWidth:480}}>
            <div className="input-group"><label>Nombre</label><input className="input" value={`${user.first_name||''} ${user.last_name||''}`} readOnly /></div>
            <div className="input-group"><label>Email</label><input className="input" value={user.email} readOnly /></div>
            <div className="input-group"><label>Empresa</label><input className="input" value={user.company_name||''} readOnly /></div>
            <div className="input-group"><label>Teléfono</label><input className="input" value={user.phone||''} readOnly /></div>
          </div></div>
        </>)}
      </main>
      <ChatWidget />
    </div>
  );
}

/* ========== CHAT WIDGET ========== */
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role:'ai', content:'¡Hola! Soy Bella, tu asistente virtual de Cosméticos Bellet. ¿En qué puedo ayudarte?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim()||loading) return;
    const msg = input.trim(); setInput(''); setMsgs(p => [...p, { role:'customer', content:msg }]); setLoading(true);
    try {
      const res = await api('/conversations/chat', { method:'POST', body: JSON.stringify({ message:msg, conversation_id:convId }) });
      setConvId(res.conversation_id); setMsgs(p => [...p, { role:'ai', content:res.response }]);
    } catch { setMsgs(p => [...p, { role:'ai', content:'Disculpa, hubo un error. Intenta de nuevo.' }]); }
    setLoading(false);
  };

  return (<>
    <button className="chat-widget-button" onClick={() => setOpen(!open)}>{open ? <Icons.close size={22}/> : <Icons.chat size={22}/>}</button>
    {open && <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-avatar"><Icons.user size={20}/></div>
        <div style={{flex:1}}><div className="chat-header-name">Bella — Asistente IA</div><div className="chat-header-status"><span className="dot"></span> En línea</div></div>
        <button className="chat-close" onClick={() => setOpen(false)}><Icons.close size={18}/></button>
      </div>
      <div className="chat-messages">{msgs.map((m,i) => <div key={i} className={`chat-message ${m.role}`}>{m.content}</div>)}{loading && <div className="chat-message ai" style={{opacity:0.5}}>Escribiendo...</div>}<div ref={endRef}/></div>
      <div className="chat-input-area"><input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu mensaje..." onKeyDown={e => e.key==='Enter' && send()} disabled={loading} /><button className="chat-send" onClick={send} disabled={loading}><Icons.send size={15}/></button></div>
    </div>}
  </>);
}

/* ========== MODAL ========== */
function Modal({ title, children, onClose, onSave }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">{title}</span><button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.close size={18}/></button></div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={onSave}>Guardar</button></div>
      </div>
    </div>
  );
}
