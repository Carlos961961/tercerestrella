import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar', 'https://www.tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { data, error } = await supabase
    .from('testimonios')
    .select('*')
    .eq('aprobado', true)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Error al obtener testimonios' });

  return res.status(200).json(data);
}
