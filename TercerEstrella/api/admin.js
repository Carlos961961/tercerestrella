import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const MAX_INTENTOS = 5;
const VENTANA_SEGUNDOS = 15 * 60;

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const key = `ratelimit:admin:${ip}`;

  try {
    if (redis) {
      const intentos = await redis.get(key);
      if (intentos && parseInt(intentos) >= MAX_INTENTOS) {
        return res.status(429).json({ error: 'Demasiados intentos. Intentá en 15 minutos.' });
      }
    }
  } catch (_) {}

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    try {
      if (redis) {
        await redis.incr(key);
        await redis.expire(key, VENTANA_SEGUNDOS);
      }
    } catch (_) {}
    return res.status(401).json({ error: 'No autorizado' });
  }

  try { if (redis) await redis.del(key); } catch (_) {}

  if (req.method === 'GET') {
    const { data: inscripcionesRaw } = await supabase
      .from('inscripciones')
      .select('*')
      .order('created_at', { ascending: false });

    const inscripciones = await Promise.all((inscripcionesRaw || []).map(async i => {
      if (i.foto_url && !i.foto_url.startsWith('http')) {
        const { data: signed } = await supabase.storage.from('fotos').createSignedUrl(i.foto_url, 3600);
        return { ...i, foto_url: signed?.signedUrl || null };
      }
      return i;
    }));

    const { data: testimonios } = await supabase
      .from('testimonios')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: ventas } = await supabase
      .from('codigos')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    return res.status(200).json({ inscripciones, testimonios, ventas, leads });
  }

  if (req.method === 'POST') {
    const { action, id } = req.body;

    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido' });

    if (action === 'aprobar') {
      const { error } = await supabase
        .from('testimonios')
        .update({ aprobado: true })
        .eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al aprobar' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'rechazar') {
      const { error } = await supabase
        .from('testimonios')
        .delete()
        .eq('id', id);
      if (error) return res.status(500).json({ error: 'Error al rechazar' });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción no válida' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
