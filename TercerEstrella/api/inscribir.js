import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar', 'https://www.tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const {
    nombre, email, whatsapp, producto, talle,
    codigo, resena, foto_base64, foto_tipo, autoriza_publicacion
  } = req.body;

  if (!nombre || !whatsapp || !producto || !talle || !codigo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const productosValidos = ['tailandesa-premium', 'nacional-adulto', 'nacional-nino'];
  if (!productosValidos.includes(producto)) return res.status(400).json({ error: 'Producto inválido' });

  const tallesValidos = ['S', 'M', 'L', 'XL', 'XXL', '2', '4', '6', '8', '10', '12', '14', '16'];
  if (!tallesValidos.includes(talle)) return res.status(400).json({ error: 'Talle inválido' });

  if (whatsapp.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'WhatsApp inválido' });
  if (nombre.length > 100 || whatsapp.length > 30 || (resena && resena.length > 2000)) {
    return res.status(400).json({ error: 'Datos demasiado largos' });
  }

  // Validar código de compra
  const { data: codigoData, error: codigoError } = await supabase
    .from('codigos')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .single();

  if (codigoError || !codigoData) {
    return res.status(400).json({ error: 'Código inválido. Verificá que lo hayas escrito correctamente.' });
  }

  if (codigoData.usado) {
    return res.status(400).json({ error: 'Este código ya fue utilizado. Cada código es de un solo uso.' });
  }

  // Subir foto a Supabase Storage si viene una
  let foto_url = null;
  if (foto_base64 && foto_tipo) {
    const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
    if (!TIPOS_PERMITIDOS.includes(foto_tipo)) return res.status(400).json({ error: 'Tipo de imagen no permitido' });
    if (foto_base64.length > 5_000_000) return res.status(400).json({ error: 'Imagen demasiado grande (máx 5MB)' });
    const buffer = Buffer.from(foto_base64, 'base64');
    const ext = foto_tipo.split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${nombre.replace(/\s+/g, '-').toLowerCase()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(filename, buffer, { contentType: foto_tipo });

    if (!uploadError) {
      foto_url = filename;
    }
  }

  // Guardar inscripción en la base de datos
  const { error: dbError } = await supabase.from('inscripciones').insert([{
    nombre,
    email: email || null,
    whatsapp,
    producto,
    talle,
    codigo: codigo || null,
    resena: resena || null,
    foto_url,
    autoriza_publicacion: autoriza_publicacion || false
  }]);

  if (dbError) return res.status(500).json({ error: 'Error al guardar' });

  // Marcar código como usado
  await supabase.from('codigos').update({ usado: true }).eq('codigo', codigo.toUpperCase());

  // Email de confirmación al cliente
  if (email && process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>',
      to: [email],
      subject: '¡Estás inscripto al sorteo! 🎁',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:40px;border-radius:12px;">
          <h1 style="color:#C0A24A;font-size:28px;margin-bottom:8px;">¡Estás inscripto, ${nombre}!</h1>
          <p style="color:#ccc;font-size:16px;">Tu inscripción al sorteo de TercerEstrella fue registrada correctamente.</p>
          <div style="background:#0A3D7C;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;color:#74ACDF;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Tu inscripción</p>
            <p style="margin:4px 0;color:#fff;"><strong>Producto:</strong> ${producto} — Talle ${talle}</p>
            ${codigo ? `<p style="margin:4px 0;color:#fff;"><strong>Código:</strong> ${codigo}</p>` : ''}
          </div>
          <p style="color:#ccc;font-size:14px;">El sorteo se realiza cuando se completan las 30 camisetas del lote. Si ganás, te contactamos por WhatsApp al <strong>${whatsapp}</strong>.</p>
          <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
          <p style="color:#666;font-size:12px;">TercerEstrella · WhatsApp: +54 9 11 3465-2868</p>
        </div>
      `
    }).catch(() => {});
  }

  // Notificación al admin
  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TercerEstrella <onboarding@resend.dev>',
      to: [process.env.ADMIN_EMAIL],
      subject: `Nueva inscripción: ${nombre} — ${producto}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;">
          <h2>Nueva inscripción al sorteo</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Nombre</td><td style="padding:6px 0;"><strong>${esc(nombre)}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${esc(email || '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">WhatsApp</td><td style="padding:6px 0;">${esc(whatsapp)}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Producto</td><td style="padding:6px 0;">${esc(producto)} — Talle ${esc(talle)}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Código</td><td style="padding:6px 0;">${esc(codigo || '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Reseña</td><td style="padding:6px 0;">${esc(resena || '—')}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Autoriza publicación</td><td style="padding:6px 0;">${autoriza_publicacion ? 'Sí' : 'No'}</td></tr>
            ${foto_url ? `<tr><td style="padding:6px 0;color:#666;">Foto</td><td style="padding:6px 0;"><a href="${esc(foto_url)}">Ver foto</a></td></tr>` : ''}
          </table>
        </div>
      `
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
