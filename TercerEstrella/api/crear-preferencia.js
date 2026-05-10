import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN_TEST;
const BASE_URL = 'https://tercerestrella.vercel.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';

const PRODUCTOS = {
  'tailandesa-premium': { title: 'Camiseta Tailandesa Premium', unit_price: 56000 },
  'nacional-adulto':    { title: 'Camiseta Nacional Adulto',    unit_price: 28500 },
  'nacional-nino':      { title: 'Camiseta Nacional Niño',      unit_price: 23000 }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { producto, talle, nombre, email, whatsapp } = req.body;

  if (!producto || !talle || !nombre || !email || !whatsapp) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const item = PRODUCTOS[producto];
  if (!item) return res.status(400).json({ error: 'Producto inválido' });

  // Guardar lead de carrito (para recupero de abandono)
  await supabase.from('leads').insert([{
    nombre, email, whatsapp, producto, talle, convertido: false
  }]).select();

  const externalRef = `${producto}-${Date.now()}`;

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{
        title: `${item.title} — Talle ${talle}`,
        quantity: 1,
        unit_price: item.unit_price,
        currency_id: 'ARS'
      }],
      payer: { name: nombre, email },
      external_reference: externalRef,
      metadata: { nombre, email, whatsapp, producto, talle },
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
