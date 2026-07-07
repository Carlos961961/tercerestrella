import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN_TEST;
const BASE_URL = 'https://www.tercerestrella.com.ar';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>';

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const PRODUCTOS = {
  'tailandesa-premium': { title: 'Camiseta Tailandesa Premium', unit_price: 50000 },
  'nacional-adulto':    { title: 'Camiseta Nacional Adulto',    unit_price: 35000 },
  'nacional-nino':      { title: 'Camiseta Nacional Niño',      unit_price: 30000 }
};

const DESCUENTOS_VALIDOS = [5, 10, 15];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const { items, descuento, nombre, email, whatsapp } = body || {};

  if (!items || !Array.isArray(items) || items.length === 0 || !nombre || !email || !whatsapp) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (items.length > 20) {
    return res.status(400).json({ error: 'Máximo 20 items' });
  }

  // Validate discount matches item count
  const pct = DESCUENTOS_VALIDOS.includes(descuento) ? descuento / 100 : 0;

  // Build MP items
  const mpItems = [];
  const itemDescriptions = [];
  for (const item of items) {
    const prod = PRODUCTOS[item.id];
    if (!prod) return res.status(400).json({ error: `Producto inválido: ${item.id}` });
    mpItems.push({
      title: `${prod.title} — Talle ${item.talle}`,
      quantity: 1,
      unit_price: Math.round(prod.unit_price * (1 - pct)),
      currency_id: 'ARS'
    });
    itemDescriptions.push(`${prod.title} (T${item.talle})`);
  }

  // Save lead
  try {
    await supabase.from('leads').insert([{
      nombre, email, whatsapp,
      producto: items.map(i => i.id).join(', '),
      talle: items.map(i => i.talle).join(', '),
      convertido: false
    }]);
  } catch (_) {}

  // Notify admin
  if (process.env.RESEND_API_KEY) {
    resend.emails.send({
      from: EMAIL_FROM,
      to: [ADMIN_EMAIL],
      subject: `🛒 Carrito: ${nombre} — ${items.length} items${pct ? ` (${descuento}% OFF)` : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;">
        <h2 style="color:#0A3D7C;">Nuevo carrito en TercerEstrella</h2>
        <p><strong>${esc(nombre)}</strong> · ${esc(email)} · <a href="https://wa.me/${whatsapp.replace(/\D/g,'')}">WhatsApp</a></p>
        <ul>${itemDescriptions.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
        ${pct ? `<p style="color:#15803d;font-weight:600;">Descuento: ${descuento}% OFF</p>` : ''}
      </div>`
    }).catch(() => {});
  }

  const externalRef = `carrito-${Date.now()}`;

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: mpItems,
        payer: { name: nombre, email },
        external_reference: externalRef,
        metadata: { nombre, email, whatsapp, items: JSON.stringify(items), descuento },
        back_urls: {
          success: `${BASE_URL}/gracias.html`,
          failure: `${BASE_URL}/`,
          pending: `${BASE_URL}/gracias.html`
        },
        auto_return: 'approved',
        notification_url: `${BASE_URL}/api/webhook-mp`
      })
    });

    const data = await response.json();
    if (!data.id) return res.status(500).json({ error: 'Error al crear preferencia' });
    return res.status(200).json({ init_point: data.init_point, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' });
  }
}
