import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const PRODUCTOS = ['tailandesa-premium', 'nacional-adulto', 'nacional-nino'];

const defaultEstado = () => Object.fromEntries(PRODUCTOS.map(p => [p, true]));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    if (!redis) return res.status(200).json(defaultEstado());
    try {
      const vals = await Promise.all(PRODUCTOS.map(p => redis.get(`stock:${p}`)));
      const estado = {};
      PRODUCTOS.forEach((p, i) => {
        const v = vals[i];
        estado[p] = v === null ? true : v === true || v === 'true';
      });
      return res.status(200).json(estado);
    } catch (_) {
      return res.status(200).json(defaultEstado());
    }
  }

  if (req.method === 'POST') {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    try {
      const { producto, activo } = req.body;
      if (!PRODUCTOS.includes(producto)) {
        return res.status(400).json({ error: 'Producto no válido' });
      }
      if (redis) await redis.set(`stock:${producto}`, String(activo));
      return res.status(200).json({ ok: true, producto, activo });
    } catch (err) {
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
