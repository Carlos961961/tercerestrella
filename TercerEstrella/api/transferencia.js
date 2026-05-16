import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { nombre, email, whatsapp, producto, talle, monto } = req.body;
  if (!nombre || !email || !whatsapp || !producto || !talle || !monto) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const productosValidos = ['tailandesa-premium', 'nacional-adulto', 'nacional-nino'];
  if (!productosValidos.includes(producto)) return res.status(400).json({ error: 'Producto inválido' });

  await supabase.from('transferencias').insert([{ nombre, email, whatsapp, producto, talle, monto, estado: 'pendiente' }]);

  await supabase.from('leads').insert([{ nombre, email, whatsapp, producto, talle, convertido: false }]).select();

  if (process.env.RESEND_API_KEY) {
    resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: `Recibimos tu pedido, ${nombre} — TercerEstrella`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#C0A24A;font-size:24px;margin-bottom:16px;">Ya casi es tuya.</h1>
          <p style="color:#ccc;font-size:15px;line-height:1.6;">Recibimos tu solicitud. En cuanto confirmemos que el pago llegó a nuestra cuenta, te mandamos tu código de seguimiento y el número del sorteo por email.</p>
          <div style="background:#0A3D7C;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 6px;color:#74ACDF;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Resumen de tu pedido</p>
            <p style="margin:4px 0;color:#fff;font-size:14px;"><strong>Producto:</strong> ${producto}</p>
            <p style="margin:4px 0;color:#fff;font-size:14px;"><strong>Talle:</strong> ${talle}</p>
            <p style="margin:4px 0;color:#fff;font-size:14px;"><strong>Monto transferido:</strong> $${monto.toLocaleString('es-AR')}</p>
            <p style="margin:4px 0;color:#fff;font-size:14px;"><strong>Alias:</strong> tercerestrella.mp</p>
          </div>
          <p style="color:#aaa;font-size:13px;">Confirmamos en menos de 24 horas. Cualquier consulta respondemos por WhatsApp.</p>
          <p style="color:#444;font-size:12px;text-align:center;margin-top:24px;">TercerEstrella</p>
        </div>
      `
    }).catch(() => {});

    resend.emails.send({
      from: EMAIL_FROM,
      to: [ADMIN_EMAIL],
      subject: `💸 Nueva transferencia pendiente: ${nombre} — ${producto} T${talle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;">
          <h2 style="color:#0A3D7C;">Transferencia pendiente de confirmación</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Nombre</td><td><strong>${nombre}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td>${email}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">WhatsApp</td><td><a href="https://wa.me/${whatsapp.replace(/\D/g,'')}">+${whatsapp}</a></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Producto</td><td>${producto} — Talle ${talle}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Monto</td><td><strong>$${monto.toLocaleString('es-AR')}</strong></td></tr>
          </table>
          <p style="margin-top:16px;color:#666;font-size:13px;">Verificá que llegó el pago en tu cuenta de MercadoPago y confirmá desde el panel admin.</p>
        </div>
      `
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
