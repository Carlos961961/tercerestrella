import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN_TEST;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>';

function generarCodigo() {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `TE-${num}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;
  if (type !== 'payment') return res.status(200).json({ ok: true });

  const paymentId = data?.id;
  if (!paymentId) return res.status(200).json({ ok: true });

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
  });
  const payment = await mpRes.json();

  if (payment.status !== 'approved') return res.status(200).json({ ok: true });

  const { nombre, email, whatsapp, producto, talle } = payment.metadata || {};
  if (!email) return res.status(200).json({ ok: true });

  // Marcar lead como convertido
  await supabase.from('leads').update({ convertido: true }).eq('email', email).eq('producto', producto);

  // Generar código único
  let codigo;
  let intentos = 0;
  do {
    codigo = generarCodigo();
    const { data: existing } = await supabase.from('codigos').select('id').eq('codigo', codigo).single();
    if (!existing) break;
    intentos++;
  } while (intentos < 10);

  await supabase.from('codigos').insert([{
    codigo, nombre, email, whatsapp, producto, talle, usado: false, payment_id: String(paymentId)
  }]);

  // Email al comprador
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: EMAIL_FROM,
      reply_to: ADMIN_EMAIL,
      to: [email],
      subject: '¡Tu compra fue confirmada! Aquí está tu código del sorteo 🎁',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#C0A24A;font-size:28px;margin-bottom:8px;">¡Gracias por tu compra, ${nombre || 'hincha'}!</h1>
          <p style="color:#ccc;font-size:16px;">Tu pago fue confirmado. En breve recibís tu camiseta.</p>
          <div style="background:#0A3D7C;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 8px;color:#74ACDF;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Tu código del sorteo</p>
            <p style="font-size:36px;font-weight:bold;letter-spacing:0.15em;color:#C0A24A;margin:0;">${codigo}</p>
          </div>
          <p style="color:#ccc;font-size:15px;">Con este código podés inscribirte al sorteo y dejar tu opinión.</p>
          <div style="margin-top:24px;text-align:center;">
            <a href="https://tercerestrella.vercel.app/#sorteo" style="background:#C0A24A;color:#1A1A2E;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">INSCRIBIRME AL SORTEO</a>
          </div>
          <hr style="border:none;border-top:1px solid #333;margin:32px 0;" />
          <p style="color:#666;font-size:12px;text-align:center;">TercerEstrella · <a href="mailto:${ADMIN_EMAIL}" style="color:#666;">${ADMIN_EMAIL}</a></p>
        </div>
      `
    }).catch(() => {});

    // Notificación al admin
    await resend.emails.send({
      from: EMAIL_FROM,
      reply_to: email,
      to: [ADMIN_EMAIL],
      subject: `Nueva venta: ${nombre} — ${producto} Talle ${talle}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;">
          <h2>Nueva venta confirmada por MercadoPago</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Nombre</td><td><strong>${nombre}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td>${email}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">WhatsApp</td><td>${whatsapp}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Producto</td><td>${producto} — Talle ${talle}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Código generado</td><td><strong>${codigo}</strong></td></tr>
          </table>
        </div>
      `
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
