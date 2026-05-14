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

function toCSV(rows) {
  if (!rows || rows.length === 0) return 'sin datos';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const lines = rows.map(row =>
    keys.map(k => {
      const val = row[k] == null ? '' : String(row[k]);
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const tablas = ['leads', 'inscripciones', 'codigos', 'testimonios'];
  const adjuntos = [];
  const resumen = [];

  for (const tabla of tablas) {
    const { data, error } = await supabase.from(tabla).select('*');
    if (error) {
      resumen.push(`${tabla}: error (${error.message})`);
      continue;
    }
    const csv = toCSV(data);
    adjuntos.push({
      filename: `${tabla}.csv`,
      content: Buffer.from(csv).toString('base64'),
    });
    resumen.push(`${tabla}: ${data?.length ?? 0} registros`);
  }

  const fecha = new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

  await resend.emails.send({
    from: EMAIL_FROM,
    to: [ADMIN_EMAIL],
    subject: `Backup TercerEstrella — ${fecha}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;">
        <h2 style="color:#0A3D7C;">Backup diario — ${fecha}</h2>
        <ul>${resumen.map(r => `<li>${r}</li>`).join('')}</ul>
        <p style="color:#666;font-size:13px;">Adjuntos: ${adjuntos.map(a => a.filename).join(', ')}</p>
      </div>
    `,
    attachments: adjuntos,
  });

  return res.status(200).json({ ok: true, tablas: resumen });
}
