# 🎨 Bellet AI Commerce Platform

**Sistema de automatización comercial con inteligencia artificial para Cosméticos Bellet**

Plataforma integral que automatiza ventas, atención al cliente, seguimiento de leads y procesos internos mediante IA (Gemini 2.0 Flash), integrando múltiples canales de comunicación.

---

## Características

### Asistente Virtual IA (Bella)
- Respuestas inteligentes con Google Gemini 2.0 Flash
- Detección de intenciones y análisis de sentimiento
- Recomendación de productos del catálogo real con precios
- Clasificación y scoring automático de leads
- Escalamiento inteligente a agentes humanos
- Contexto RAG con base de conocimiento de la empresa

### Dashboard Administrativo
- 6 KPIs en tiempo real (clientes, leads, pedidos, ingresos, conversaciones, productos)
- Pipeline de leads tipo Kanban (Lead → Prospecto → Cliente → VIP → Mayorista)
- CRM integrado con búsqueda y filtros
- Inbox de conversaciones multicanal
- Gestión de pedidos con tabs por estado
- Catálogo de productos con filtro por categoría
- Campañas de marketing (crear y gestionar)
- Automatizaciones CRUD (crear, editar, activar/pausar, eliminar)
- Analíticas con gráficos de barras

### Portal B2B Mayorista
- Catálogo exclusivo con precios de mayoreo
- Carrito de compras con cálculo de IVA
- Historial de pedidos
- Gestión de cuenta

### Diseño
- Paleta de colores de marca Cosméticos Bellet
- Tema claro profesional con acentos rosa magenta (#d63384)
- 28 íconos SVG profesionales (cero emojis)
- Totalmente en español
- Diseño responsivo

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Frontend | Next.js 16 (App Router) |
| Backend | Node.js + Express |
| Base de datos | SQLite (sql.js) — portable a PostgreSQL |
| IA | Google Gemini 2.0 Flash |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |

---

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/permilk/bellet-ai-commerce.git
cd bellet-ai-commerce

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY

# Poblar base de datos con datos demo
cd packages/backend && npm run seed && cd ../..

# Iniciar desarrollo
npm run dev
```

**Backend**: http://localhost:4000  
**Frontend**: http://localhost:3001

---

## Credenciales Demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cosmeticosbellet.com | admin123 |
| Agente | agente@cosmeticosbellet.com | agent123 |
| Mayorista | mayorista@demo.com | mayoreo123 |

---

## Estructura del Proyecto

```
bellet-ai-commerce/
├── packages/
│   ├── backend/
│   │   └── src/
│   │       ├── ai/chat-agent.js       # Motor IA con Gemini
│   │       ├── config/database.js      # Esquema SQLite (12 tablas)
│   │       ├── middleware/auth.js       # JWT + roles
│   │       ├── routes/                 # 7 grupos de API
│   │       ├── services/data.service.js
│   │       ├── seed/index.js           # Datos demo
│   │       └── server.js
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── globals.css         # Sistema de diseño Bellet
│           │   ├── layout.js
│           │   └── page.js             # Aplicación completa
│           └── lib/
│               ├── api.js              # Cliente HTTP
│               └── icons.js            # 28 íconos SVG
├── .env.example
└── package.json
```

---

## API Endpoints

| Grupo | Ruta | Descripción |
|-------|------|-------------|
| Auth | `/api/auth/*` | Login, registro, perfil |
| Productos | `/api/products/*` | CRUD productos y categorías |
| Clientes | `/api/customers/*` | CRUD clientes y leads |
| Pedidos | `/api/orders/*` | Gestión de pedidos |
| Conversaciones | `/api/conversations/*` | Chat IA y mensajes |
| Automatizaciones | `/api/automations/*` | CRUD automatizaciones |
| Analíticas | `/api/analytics/*` | Dashboard, leads, ventas |

---

## Licencia

Proyecto privado — Cosméticos Bellet © 2026
