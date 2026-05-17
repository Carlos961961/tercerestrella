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
    const PAGE_SIZE = 50;
    const vp = Math.max(1, parseInt(req.query.ventas_page) || 1);
    const lp = Math.max(1, parseInt(req.query.leads_page) || 1);
    const ip = Math.max(1, parseInt(req.query.inscripciones_page) || 1);

    const [
      { data: ventas, count: ventas_total },
      { data: leads, count: leads_total },
      { data: inscripcionesRaw, count: inscripciones_total },
      { data: testimonios },
      { data: recaudadoData },
      { count: leads_pendientes }
    ] = await Promise.all([
      supabase.from('codigos').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((vp-1)*PAGE_SIZE, vp*PAGE_SIZE-1),
      supabase.from('leads').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((lp-1)*PAGE_SIZE, lp*PAGE_SIZE-1),
      supabase.from('inscripciones').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((ip-1)*PAGE_SIZE, ip*PAGE_SIZE-1),
      supabase.from('testimonios').select('*').order('created_at', { ascending: false }),
      supabase.from('codigos').select('monto_total'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('convertido', false)
    ]);

    const recaudado_total = (recaudadoData || []).reduce((s, v) => s + (v.monto_total || 0), 0);
    const testimonios_pendientes = (testimonios || []).filter(t => !t.aprobado).length;

    const inscripciones = await Promise.all((inscripcionesRaw || []).map(async i => {
      if (i.foto_url && !i.foto_url.startsWith('http')) {
        const { data: signed } = await supabase.storage.from('fotos').createSignedUrl(i.foto_url, 3600);
        return { ...i, foto_url: signed?.signedUrl || null };
      }
      return i;
    }));

    return res.status(200).json({
      ventas: ventas || [], ventas_total: ventas_total || 0,
      leads: leads || [], leads_total: leads_total || 0,
      inscripciones, inscripciones_total: inscripciones_total || 0,
      testimonios: testimonios || [],
      stats: {
        ventas_total: ventas_total || 0,
        recaudado_total,
        leads_pendientes: leads_pendientes || 0,
        inscripciones_total: inscripciones_total || 0,
        testimonios_pendientes
      }
    });
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
