const { GoogleGenerativeAI } = require('@google/generative-ai');
const dataService = require('../services/data.service');
const { queryAll, runSql } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI = null;
let model = null;

function initGemini() {
  if (!GEMINI_API_KEY) return false;
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return true;
  } catch (e) {
    console.error('Error initializing Gemini:', e.message);
    return false;
  }
}

// Initialize on load
const geminiReady = initGemini();

const SYSTEM_PROMPT = `Eres Bella, la asistente virtual de Cosméticos Bellet, una tienda online mexicana especializada en maquillaje artístico profesional y body paint.

PERSONALIDAD:
- Amable, profesional y entusiasta sobre cosméticos y maquillaje artístico
- Conoces todos los productos de Bellet: Ceras, Aquacolor, FX, Pastas, Skincare, y productos para Catrinas
- Siempre recomiendas productos relevantes cuando es apropiado
- Compartes links directos de compra del sitio cosmeticosbellet.com
- Capturas datos de contacto de los clientes de forma natural

INFORMACIÓN DE LA EMPRESA:
- Nombre: Cosméticos Bellet
- Sitio web: https://cosmeticosbellet.com
- Ubicación: México, Estado de México
- Teléfono: 56 2045 6394
- Email: ventas@cosmeticosbellet.com
- Métodos de pago: Tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal, Transferencias bancarias
- Envío: Procesamiento 1-3 días hábiles, entrega 3-7 días hábiles adicionales
- Envíos internacionales disponibles (pueden aplicar aranceles)
- Seguimiento de pedidos disponible desde el perfil en el sitio web
- Ofrecen cursos y talleres de maquillaje artístico profesional
- Tienen catálogo descargable en PDF en el sitio web
- Portal B2B para clientes mayoristas con precios exclusivos

CATEGORÍAS DE PRODUCTOS:
- Ceras: Ceras para moldeo y efectos especiales
- Aquacolor: Maquillaje profesional en base agua
- FX: Efectos especiales, sangre artificial, látex, gelatina
- Pastas: Pastas para modelado 3D
- Skincare: Tratamientos capilares con ácido hialurónico, keratina, aceites naturales
- Catrinas: Kits y paletas especiales para maquillaje de Catrina

REGLAS:
1. SIEMPRE responde en español
2. Si el cliente pregunta por un producto, recomienda del catálogo y comparte el link
3. Si detectas intención de compra mayorista, ofrece información del portal B2B
4. Si el cliente tiene una queja grave o pide hablar con alguien, indica que lo conectarás con un asesor
5. Captura nombre, email o teléfono si el cliente los comparte naturalmente
6. Sé concisa pero completa en tus respuestas
7. NO uses emojis excesivos, máximo 1-2 por respuesta
8. Mantén un tono profesional y cálido`;

function detectIntent(message) {
  const lower = message.toLowerCase();
  return {
    greeting: /^(hola|buenos?\s*(días|tardes|noches)|hey|hi|qué tal|saludos)/i.test(lower),
    product_inquiry: /(producto|precio|cuánto cuesta|tienen|busco|quiero|necesito|catálogo)/i.test(lower),
    order_status: /(pedido|orden|envío|seguimiento|rastreo|tracking|dónde está)/i.test(lower),
    complaint: /(queja|problema|dañado|incorrecto|devoluci|reclam|molest)/i.test(lower),
    wholesale: /(mayoreo|mayorista|distribui|volumen|precio especial|b2b|al por mayor)/i.test(lower),
    payment: /(pago|tarjeta|paypal|transferencia|método.*pago|cómo pag)/i.test(lower),
    shipping: /(envío|enviar|entrega|cuánto tarda|llega|costo.*envío)/i.test(lower),
    human: /(hablar.*persona|agente|humano|asesor|encargado|gerente|supervisor)/i.test(lower),
    course: /(curso|taller|clase|capacitación|formación|aprender)/i.test(lower),
    skincare: /(skincare|tratamiento|capilar|keratina|hialurónico|mascarilla)/i.test(lower),
    fx: /(fx|efecto.*especial|herida|cicatriz|body.*paint|maquillaje.*artístico)/i.test(lower),
    catrina: /(catrina|día.*muerto|cráneo|calaver)/i.test(lower)
  };
}

function getLeadScore(intents, messageCount) {
  let score = 10;
  if (intents.product_inquiry) score += 20;
  if (intents.wholesale) score += 30;
  if (intents.payment) score += 25;
  if (intents.course) score += 15;
  score += Math.min(messageCount * 5, 25);
  return Math.min(score, 100);
}

function buildProductContext(products) {
  if (!products || products.length === 0) return '';
  let ctx = '\n\nPRODUCTOS DISPONIBLES RELEVANTES:\n';
  products.forEach(p => {
    ctx += `- ${p.name} | Precio: $${p.price} MXN | Categoría: ${p.category_name || 'General'}`;
    if (p.external_url) ctx += ` | Link: ${p.external_url}`;
    ctx += '\n';
  });
  return ctx;
}

function buildDocContext(documents) {
  if (!documents || documents.length === 0) return '';
  let ctx = '\n\nINFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO:\n';
  documents.forEach(d => { ctx += `[${d.title}]: ${d.content}\n`; });
  return ctx;
}

async function generateGeminiResponse(message, productCtx, docCtx, chatHistory) {
  if (!model) return null;

  const contextPrompt = SYSTEM_PROMPT + productCtx + docCtx;

  const contents = [];

  // Add chat history
  if (chatHistory && chatHistory.length > 0) {
    for (const msg of chatHistory.slice(-10)) { // Last 10 messages for context
      contents.push({
        role: msg.role === 'customer' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
  }

  // Add current message
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const chat = model.startChat({
      history: contents.slice(0, -1),
      systemInstruction: contextPrompt,
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();
    return response;
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return null;
  }
}

function generateFallbackResponse(message, intents, products) {
  if (intents.greeting) return '¡Hola! Soy Bella, tu asistente virtual de Cosméticos Bellet. ¿En qué puedo ayudarte hoy? Tenemos productos de maquillaje artístico profesional, skincare y mucho más.';
  if (intents.human || intents.complaint) return 'Entiendo tu situación. Voy a conectarte con uno de nuestros asesores para brindarte la mejor atención. También puedes contactarnos directamente en ventas@cosmeticosbellet.com o al 56 2045 6394.';
  if (intents.wholesale) return 'Contamos con un portal exclusivo para mayoristas con precios especiales, pedidos automáticos e historial de compras. Para obtener acceso, contacta a ventas@cosmeticosbellet.com y con gusto te ayudamos con el registro.';
  if (intents.payment) return 'Aceptamos diversas formas de pago: tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal y transferencias bancarias. Todas las transacciones son 100% seguras.';
  if (intents.shipping) return 'Nuestros tiempos de entrega son: procesamiento de 1-3 días hábiles y envío de 3-7 días hábiles adicionales. También realizamos envíos internacionales. Puedes dar seguimiento a tu pedido desde tu perfil en cosmeticosbellet.com.';
  if (intents.order_status) return 'Para darle seguimiento a tu pedido, inicia sesión en cosmeticosbellet.com y ve al apartado de tu perfil. Si necesitas ayuda adicional, envíanos tu número de pedido a ventas@cosmeticosbellet.com.';
  if (intents.course) return 'Ofrecemos cursos y talleres profesionales: el Combo Máster Bellet (Formación Completa, $1,999 MXN), el Taller del Terror con Master Erika Aris ($799 MXN), y el Taller de Cráneo Artístico con Master Isabel ($699 MXN). Visita cosmeticosbellet.com/tienda para más detalles.';

  if (products && products.length > 0) {
    let r = 'Te recomiendo estos productos:\n\n';
    products.slice(0, 3).forEach(p => {
      r += `• ${p.name} — $${p.price} MXN\n  ${p.external_url || 'cosmeticosbellet.com/tienda'}\n\n`;
    });
    return r + '¿Te gustaría más información sobre alguno?';
  }

  if (intents.product_inquiry) return 'Con gusto te ayudo a encontrar el producto perfecto. Nuestras categorías principales son: Ceras, Aquacolor, FX (efectos especiales), Pastas, Skincare y Catrinas. ¿Qué tipo de producto necesitas? Visita nuestra tienda en cosmeticosbellet.com/tienda';

  return 'Gracias por tu mensaje. Soy Bella de Cosméticos Bellet. Puedo ayudarte con información de productos, precios, estado de pedidos, compras al mayoreo y cursos de maquillaje artístico. ¿En qué te puedo asistir?';
}

async function processMessage(message, conversationId, customerId) {
  const intents = detectIntent(message);

  // Search for relevant products
  let relevantProducts = [];
  try {
    if (intents.skincare) relevantProducts = dataService.getAllProducts({ search: 'tratamiento', limit: 5 });
    else if (intents.fx) relevantProducts = dataService.getAllProducts({ search: 'fx', limit: 5 });
    else if (intents.catrina) relevantProducts = dataService.getAllProducts({ search: 'catrina', limit: 5 });
    else if (intents.course) relevantProducts = dataService.getAllProducts({ search: 'taller', limit: 5 });
    else if (intents.product_inquiry) {
      const keywords = message.split(' ').filter(w => w.length > 3).slice(0, 3);
      for (const kw of keywords) {
        const results = dataService.getAllProducts({ search: kw, limit: 3 });
        relevantProducts = [...relevantProducts, ...results];
      }
    }
  } catch (e) { /* ok */ }

  // Search relevant documents for RAG
  let relevantDocs = [];
  try { relevantDocs = dataService.searchDocuments(message.substring(0, 100)); } catch (e) { /* ok */ }

  const shouldEscalate = intents.complaint || intents.human;

  // Get chat history for context
  let chatHistory = [];
  if (conversationId) {
    try { chatHistory = dataService.getConversationMessages(conversationId); } catch (e) { /* ok */ }
  }

  // Try Gemini first, fallback to rule-based
  let response;
  let aiModel = 'fallback-rules-v1';

  if (geminiReady && model) {
    const productCtx = buildProductContext(relevantProducts);
    const docCtx = buildDocContext(relevantDocs);
    const geminiResponse = await generateGeminiResponse(message, productCtx, docCtx, chatHistory);

    if (geminiResponse) {
      response = geminiResponse;
      aiModel = 'gemini-2.0-flash';
    } else {
      response = generateFallbackResponse(message, intents, relevantProducts);
    }
  } else {
    response = generateFallbackResponse(message, intents, relevantProducts);
  }

  // Calculate lead score
  const messages = conversationId ? chatHistory : [];
  const leadScore = getLeadScore(intents, messages.length);

  // Update customer
  if (customerId) {
    try {
      const segment = leadScore > 60 ? 'prospect' : 'lead';
      dataService.updateCustomer(customerId, { lead_score: leadScore, segment, last_interaction: new Date().toISOString() });
    } catch (e) { /* ok */ }
    try {
      runSql("INSERT INTO interactions (id, customer_id, type, channel, metadata, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
        [uuidv4(), customerId, 'chat_message', 'website', JSON.stringify({ intents, leadScore })]);
    } catch (e) { /* ok */ }
  }

  return {
    response,
    intents,
    leadScore,
    shouldEscalate,
    relevantProducts: relevantProducts.slice(0, 3),
    metadata: {
      model: aiModel,
      ragDocuments: relevantDocs.length,
      productsFound: relevantProducts.length,
      geminiEnabled: geminiReady
    }
  };
}

module.exports = { processMessage, detectIntent, SYSTEM_PROMPT, initGemini };
