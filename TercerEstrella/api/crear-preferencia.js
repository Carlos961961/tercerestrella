import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN_TEST;
const BASE_URL = 'https://www.tercerestrella.com.ar';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>';

const PRODUCTOS = {
  'tailandesa-premium': { title: 'Camiseta Tailandesa Premium', unit_price: 55000 },
  'nacional-adulto':    { title: 'Camiseta Nacional Adulto',    unit_price: 35000 },
  'nacional-nino':      { title: 'Camiseta Nacional Niño',      unit_price: 30000 }
};

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  try {
    if (redis) {
      const key = `rl:preferencia:${ip}`;
      const hits = await redis.incr(key);
      if (hits === 1) await redis.expire(key, 600);
      if (hits > 10) return res.status(429).json({ error: 'Demasiadas solicitudes. Intentá en unos minutos.' });
    }
  } catch (_) {}

  const { producto, talle, nombre, email, whatsapp, cupon } = req.body;

  if (!producto || !talle || !nombre || !email || !whatsapp) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const CUPONES = { 'HINCHA10': 0.10 };
  let descuento = 0;

  if (cupon && CUPONES[cupon.toUpperCase()]) {
    const cuponKey = cupon.toUpperCase();

    // Verificar que es cliente que ya compró
    const { data: compras } = await supabase
      .from('codigos')
      .select('cupon_descuento')
      .eq('email', email);

    if (!compras || compras.length === 0) {
      return res.status(400).json({ error: 'Código de descuento inválido.' });
    }

    // Verificar que no usó este cupón antes
    if (compras.some(c => c.cupon_descuento === cuponKey)) {
      return res.status(400).json({ error: 'Código de descuento inválido.' });
    }

    descuento = CUPONES[cuponKey];
  }

  // Validar formato de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Limitar longitud de campos para prevenir abuso
  if (nombre.length > 100 || whatsapp.length > 20 || email.length > 200) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const item = PRODUCTOS[producto];
  if (!item) return res.status(400).json({ error: 'Producto inválido' });

  // Guardar lead de carrito (para recupero de abandono)
  await supabase.from('leads').insert([{
    nombre, email, whatsapp, producto, talle, convertido: false
  }]).select();

  // Notificación inmediata al admin
  if (process.env.RESEND_API_KEY) {
    resend.emails.send({
      from: EMAIL_FROM,
      to: [ADMIN_EMAIL],
      subject: `🛒 Nuevo lead: ${nombre} — ${producto} T${talle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;">
          <h2 style="color:#0A3D7C;">Nuevo lead en TercerEstrella</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Nombre</td><td style="padding:6px 0;"><strong>${esc(nombre)}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${esc(email)}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">WhatsApp</td><td style="padding:6px 0;"><a href="https://wa.me/${whatsapp.replace(/\D/g,'')}">+${esc(whatsapp)}</a></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Producto</td><td style="padding:6px 0;">${esc(producto)} — Talle ${esc(talle)}</td></tr>
          </table>
        </div>
      `
    }).catch(() => {});
  }

  const externalRef = `${producto}-${Date.now()}`;

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{
        title: `${item.title} — Talle ${talle}${descuento ? ` (${descuento*100}% OFF)` : ''}`,
        quantity: 1,
        unit_price: Math.round(item.unit_price * (1 - descuento)),
        currency_id: 'ARS'
      }],
      payer: { name: nombre, email },
      external_reference: externalRef,
      metadata: { nombre, email, whatsapp, producto, talle, cupon: cupon ? cupon.toUpperCase() : null },
      back_urls: {
        success: `${BASE_URL}/gracias.html`,
        failure: `${BASE_URL}/${producto}.html`,
        pending: `${BASE_URL}/gracias.html`
      },
      auto_return: 'approved',
      notification_url: `${BASE_URL}/api/webhook-mp`
    })
  });

  const data = await response.json();
  if (!data.id) return res.status(500).json({ error: 'Error al crear preferencia' });

  return res.status(200).json({ init_point: data.init_point, id: data.id });
}
