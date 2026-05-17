import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://www.tercerestrella.com.ar', 'https://tercerestrella.com.ar', 'https://www.tercerestrella.com.ar'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    const { data: inscripciones } = await supabase
      .from('inscripciones')
      .select('*')
      .order('created_at', { ascending: false });

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
