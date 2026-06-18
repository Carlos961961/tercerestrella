import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const PRODUCTOS = ['tailandesa-premium', 'nacional-adulto', 'nacional-nino'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const estado = {};
    if (redis) {
      for (const p of PRODUCTOS) {
        const val = await redis.get(`stock:${p}`);
        estado[p] = val === null ? true : val === true || val === 'true';
      }
    } else {
      PRODUCTOS.forEach(p => { estado[p] = true; });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(estado);
  }

  if (req.method === 'POST') {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const { producto, activo } = req.body;
    if (!PRODUCTOS.includes(producto)) {
      return res.status(400).json({ error: 'Producto no válido' });
    }
    if (redis) {
      await redis.set(`stock:${producto}`, activo);
    }
    return res.status(200).json({ ok: true, producto, activo });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
