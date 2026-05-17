import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>';
const BASE_URL = 'https://www.tercerestrella.com.ar';

function generarCodigo() {
  const num = (crypto.randomBytes(3).readUIntBE(0, 3) % 900000) + 100000;
  return `TE-${num}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'No autorizado' });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Falta id' });

  const { data: transfer } = await supabase.from('transferencias').select('*').eq('id', id).single();
  if (!transfer) return res.status(404).json({ error: 'Transferencia no encontrada' });
  if (transfer.estado === 'confirmado') return res.status(200).json({ ok: true, mensaje: 'Ya confirmada' });

  const { nombre, email, whatsapp, producto, talle, monto } = transfer;

  let codigo;
  let intentos = 0;
  do {
    codigo = generarCodigo();
    const { data: existing } = await supabase.from('codigos').select('id').eq('codigo', codigo).single();
    if (!existing) break;
    intentos++;
  } while (intentos < 10);

  await supabase.from('codigos').insert([{
    codigo, nombre, email, whatsapp, producto, talle, usado: false,
    payment_id: `TRANSFER-${id}`, cuotas: 1, monto_total: monto, cupon_descuento: null
  }]);

  await supabase.from('inscripciones').insert([{
    nombre, email, whatsapp, producto, talle, codigo,
    resena: null, foto_url: null, autoriza_publicacion: false
  }]);

  await supabase.from('transferencias').update({ estado: 'confirmado' }).eq('id', id);
  await supabase.from('leads').update({ convertido: true }).eq('email', email).eq('producto', producto);

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: EMAIL_FROM,
      reply_to: ADMIN_EMAIL,
      to: [email],
      subject: `¡Listo, ${nombre || 'hincha'}! Tu camiseta está en camino 🔵⚪`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#C0A24A;font-size:28px;margin-bottom:16px;">La tercera estrella ya es tuya.</h1>
          <p style="color:#ccc;font-size:16px;line-height:1.6;">Confirmamos tu pago y tu camiseta está siendo preparada para vos.</p>

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
            <a href="${BASE_URL}" style="background:#fff;color:#1A1A2E;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">VOLVER A LA TIENDA</a>
          </div>

          <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
          <p style="color:#555;font-size:13px;text-align:center;">Cualquier consulta respondemos por WhatsApp. Gracias por confiar en nosotros.</p>
          <p style="color:#444;font-size:12px;text-align:center;margin-top:4px;">TercerEstrella</p>
        </div>
      `
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true, codigo });
}
