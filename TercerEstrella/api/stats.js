import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const TOTAL_LOTE = 30;

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar'].includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Cache-Control', 'public, max-age=60');

  const { count } = await supabase
    .from('inscripciones')
    .select('*', { count: 'exact', head: true });

  const inscriptos = count || 0;

  return res.status(200).json({
    inscriptos,
    total: TOTAL_LOTE,
    restantes: Math.max(0, TOTAL_LOTE - inscriptos),
    porcentaje: Math.round((inscriptos / TOTAL_LOTE) * 100)
  });
}
