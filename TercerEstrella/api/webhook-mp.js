import crypto from 'crypto';
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
  const num = (crypto.randomBytes(3).readUIntBE(0, 3) % 900000) + 100000;
  return `TE-${num}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (process.env.MP_WEBHOOK_SECRET) {
    const sig = req.headers['x-signature'] || '';
    const reqId = req.headers['x-request-id'] || '';
    const dataId = (req.query || {})['data.id'] || req.body?.data?.id || '';
    const m = sig.match(/ts=(\d+),v1=([a-f0-9]+)/);
    if (!m) return res.status(400).end();
    const [, ts, hash] = m;
    if (Math.abs(Date.now() - parseInt(ts, 10) * 1000) > 5 * 60 * 1000) return res.status(400).end();
    const template = `id:${dataId};request-id:${reqId};ts:${ts};`;
    const expected = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(template).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return res.status(400).end();
  }

  const { type, data } = req.body;
  if (type !== 'payment') return res.status(200).json({ ok: true });

  const paymentId = data?.id;
  if (!paymentId) return res.status(200).json({ ok: true });

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
  });
  const payment = await mpRes.json();

  if (payment.status !== 'approved') return res.status(200).json({ ok: true });

  // Evitar procesar el mismo pago dos veces
  const { data: yaProcessado } = await supabase
    .from('codigos')
    .select('id')
    .eq('payment_id', String(paymentId))
    .single();
  if (yaProcessado) return res.status(200).json({ ok: true });

  const { nombre, email, whatsapp, producto, talle, cupon } = payment.metadata || {};
  if (!email) return res.status(200).json({ ok: true });
  if (nombre && nombre.length > 200) return res.status(200).json({ ok: true });

  // Validar que el producto y talle sean legítimos
  const productosValidos = ['tailandesa-premium', 'nacional-adulto', 'nacional-nino'];
  if (!productosValidos.includes(producto)) return res.status(200).json({ ok: true });

  const tallesValidos = ['S', 'M', 'L', 'XL', 'XXL', '2', '4', '6', '8', '10', '12', '14', '16'];
  if (!tallesValidos.includes(talle)) return res.status(200).json({ ok: true });

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

  const cuotas = payment.installments || 1;
  const monto_total = payment.transaction_amount || 0;

  await supabase.from('codigos').insert([{
    codigo, nombre, email, whatsapp, producto, talle, usado: false,
    payment_id: String(paymentId), cuotas, monto_total,
    cupon_descuento: cupon || null
  }]);

  await supabase.from('inscripciones').insert([{
    nombre, email, whatsapp, producto, talle, codigo,
    resena: null, foto_url: null, autoriza_publicacion: false
  }]);

  // Email al comprador
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: EMAIL_FROM,
      reply_to: ADMIN_EMAIL,
      to: [email],
      subject: `¡Listo, ${nombre || 'hincha'}! Tu camiseta está en camino 🔵⚪`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#C0A24A;font-size:28px;margin-bottom:16px;">La tercera estrella ya es tuya.</h1>
          <p style="color:#ccc;font-size:16px;line-height:1.6;">Tu pago se confirmó y tu camiseta está siendo preparada para vos.</p>

          <div style="background:#0A3D7C;border-radius:8px;padding:24px;margin:28px 0;text-align:center;">
            <p style="margin:0 0 8px;color:#74ACDF;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Tu código del sorteo</p>
            <p style="font-size:38px;font-weight:bold;letter-spacing:0.18em;color:#C0A24A;margin:0;">${codigo}</p>
            <p style="margin:12px 0 0;color:#aaa;font-size:13px;">Guardalo — con este código te inscribís al sorteo y podés dejar tu opinión.</p>
          </div>

          <div style="background:#0f2a50;border-radius:8px;padding:20px;margin-bottom:28px;text-align:center;">
            <p style="margin:0 0 6px;color:#74ACDF;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;">Tu regalo por ser cliente</p>
            <p style="font-size:26px;font-weight:bold;letter-spacing:0.15em;color:#C0A24A;margin:0 0 8px;">HINCHA10</p>
            <p style="margin:0;color:#aaa;font-size:13px;">10% de descuento en tu próxima compra. Usá este código al finalizar tu pedido.</p>
          </div>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="https://www.tercerestrella.com.ar" style="background:#fff;color:#1A1A2E;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">VOLVER A LA TIENDA</a>
          </div>

          <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
          <p style="color:#555;font-size:13px;text-align:center;">Cualquier consulta respondemos por WhatsApp. Gracias por confiar en nosotros.</p>
          <p style="color:#444;font-size:12px;text-align:center;margin-top:4px;">TercerEstrella</p>
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
