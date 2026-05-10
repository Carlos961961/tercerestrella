import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN_PROD || process.env.MP_ACCESS_TOKEN_TEST;

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

  // Obtener detalles del pago desde MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
  });
  const payment = await mpRes.json();

  if (payment.status !== 'approved') return res.status(200).json({ ok: true });

  const { nombre, email, whatsapp, producto, talle } = payment.metadata || {};

  if (!email) return res.status(200).json({ ok: true });

  // Generar código único
  let codigo;
  let intentos = 0;
  do {
    codigo = generarCodigo();
    const { data: existing } = await supabase.from('codigos').select('id').eq('codigo', codigo).single();
    if (!existing) break;
    intentos++;
  } while (intentos < 10);

  // Guardar código en la base de datos
  await supabase.from('codigos').insert([{
    codigo,
    nombre,
    email,
    whatsapp,
    producto,
    talle,
    usado: false,
    payment_id: String(paymentId)
  }]);

  // Enviar email con el código
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>',
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

        <p style="color:#ccc;font-size:15px;">Con este código podés:</p>
        <ul style="color:#ccc;font-size:15px;">
          <li>Inscribirte al sorteo de la Tailandesa Premium</li>
          <li>Dejar tu opinión y aparecer en el sitio</li>
        </ul>

        <div style="margin-top:24px;text-align:center;">
          <a href="https://tercerestrella.vercel.app/#sorteo" style="background:#C0A24A;color:#1A1A2E;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;letter-spacing:0.05em;">INSCRIBIRME AL SORTEO</a>
        </div>

        <hr style="border:none;border-top:1px solid #333;margin:32px 0;" />
        <p style="color:#666;font-size:12px;text-align:center;">TercerEstrella · WhatsApp: +54 9 11 3465-2868</p>
      </div>
    `
  });

  return res.status(200).json({ ok: true });
}
