import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tercerestrella.ar@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>';
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
  // Solo puede llamarse con la clave secreta (cron de Vercel)
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Buscar leads que no compraron en las últimas 2-24 horas
  const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('convertido', false)
    .eq('email_recordatorio_enviado', false)
    .lt('created_at', hace2h)
    .gt('created_at', hace24h);

  if (!leads || leads.length === 0) return res.status(200).json({ enviados: 0 });

  let enviados = 0;
  for (const lead of leads) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        reply_to: ADMIN_EMAIL,
        to: [lead.email],
        subject: '¿Olvidaste tu camiseta? 🔵⚪',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:40px;border-radius:12px;">
            <h1 style="color:#C0A24A;font-size:26px;margin-bottom:8px;">Hola ${lead.nombre}, te quedaste sin tu camiseta 👕</h1>
            <p style="color:#ccc;font-size:16px;">Vimos que estabas por comprar la <strong>${lead.producto === 'tailandesa-premium' ? 'Tailandesa Premium' : lead.producto === 'nacional-adulto' ? 'Nacional Adulto' : 'Nacional Niño'}</strong> en talle <strong>${lead.talle}</strong> pero no completaste el pago.</p>
            <p style="color:#ccc;font-size:15px;margin-top:16px;">El stock es limitado — no dejes que se agote.</p>
            <div style="margin-top:28px;text-align:center;">
              <a href="https://www.tercerestrella.com.ar/${lead.producto}.html" style="background:#C0A24A;color:#1A1A2E;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">COMPLETAR MI COMPRA</a>
            </div>
            <hr style="border:none;border-top:1px solid #333;margin:32px 0;" />
            <p style="color:#555;font-size:12px;text-align:center;">Si ya compraste ignorá este mensaje. Consultas: <a href="https://wa.me/5491134652868" style="color:#74ACDF;">WhatsApp</a></p>
          </div>
        `
      });

      await supabase.from('leads').update({ email_recordatorio_enviado: true }).eq('id', lead.id);
      enviados++;
    } catch(e) {}
  }

  return res.status(200).json({ enviados });
}
