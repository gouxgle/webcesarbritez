// API de solo lectura del catálogo online de cesarbritez.com.ar.
//
// Lee ÚNICAMENTE la vista `catalogo_web` de la base de aberturas, conectándose con el rol
// `web_catalogo` (sin permisos sobre ninguna tabla). La vista ya filtra publicado_web +
// activo y deja afuera precios, costos, proveedor, SKU y stock — ver
// aberturas/docs/catalogo-web.md. Esta API no agrega nada que no esté en la vista.

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import pg from 'pg';
import { atributosLegibles } from './atributos.js';

const PORT = Number(process.env.PORT ?? 3000);
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 5_000,
});
pool.on('error', (err) => console.error('pg pool:', err.message));

const app = new Hono().basePath('/api');

// ── Rate limit simple en memoria, por IP (nginx manda X-Real-IP) ────────────
const LIMITE = 120;
const VENTANA_MS = 60_000;
const hits = new Map();
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, h] of hits) if (ahora - h.desde > VENTANA_MS) hits.delete(ip);
}, VENTANA_MS).unref();

app.use('*', async (c, next) => {
  const ip = c.req.header('x-real-ip') ?? 'local';
  const ahora = Date.now();
  let h = hits.get(ip);
  if (!h || ahora - h.desde > VENTANA_MS) { h = { desde: ahora, n: 0 }; hits.set(ip, h); }
  if (++h.n > LIMITE) return c.json({ error: 'Demasiadas consultas, probá en un minuto' }, 429);
  await next();
});

// El catálogo cambia poco: 60 s de cache alcanzan para que publicar/despublicar se vea
// rápido sin pegarle a la base en cada visita.
const cacheable = (c) => c.header('Cache-Control', 'public, max-age=60');

// Imagen principal: imagen_url es espejo de imagenes[0], pero por las dudas se cae a la otra.
const IMAGEN = `COALESCE(NULLIF(imagen_url, ''), imagenes->>0)`;
// Variantes del mismo modelo se agrupan en una tarjeta; sin modelo, cada producto es su grupo.
const GRUPO = `COALESCE(modelo_id, id)`;
const ORDEN_ETIQUETA = `CASE etiqueta WHEN 'mas_vendido' THEN 0 WHEN 'recomendado' THEN 1 WHEN 'nuevo' THEN 2 ELSE 3 END`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escaparLike = (s) => s.replace(/[\\%_]/g, (m) => '\\' + m);

// GET /api/catalogo?tipo=&material=&q=&destacados=1&excluir=<id>&limite=
app.get('/catalogo', async (c) => {
  const q = c.req.query();
  const where = [];
  const params = [];
  const p = (v) => { params.push(v); return `$${params.length}`; };

  if (q.tipo)     where.push(`tipo_abertura = ${p(q.tipo.slice(0, 80))}`);
  if (q.material) where.push(`material = ${p(q.material.slice(0, 80))}`);
  if (q.destacados === '1') where.push(`etiqueta IS NOT NULL`);
  if (q.excluir && UUID_RE.test(q.excluir)) where.push(`${GRUPO} <> (SELECT ${GRUPO} FROM catalogo_web WHERE id = ${p(q.excluir)})`);
  if (q.q?.trim()) {
    const like = p(`%${escaparLike(q.q.trim().slice(0, 80))}%`);
    where.push(`(titulo ILIKE ${like} OR descripcion ILIKE ${like} OR material ILIKE ${like}
              OR color ILIKE ${like} OR tipo_abertura ILIKE ${like} OR linea ILIKE ${like}
              OR categoria ILIKE ${like})`);
  }
  const limite = Math.min(Math.max(Number(q.limite) || 200, 1), 200);

  const sql = `
    WITH filtrados AS (
      SELECT * FROM catalogo_web ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ),
    grupos AS (
      SELECT ${GRUPO} AS grupo,
             count(*) AS variantes,
             count(DISTINCT color) AS colores
      FROM filtrados GROUP BY 1
    ),
    representante AS (
      -- Una fila por grupo: la que tenga imagen y mejor etiqueta.
      SELECT DISTINCT ON (${GRUPO}) *
      FROM filtrados
      ORDER BY ${GRUPO}, (${IMAGEN} IS NULL), ${ORDEN_ETIQUETA}, titulo
    )
    SELECT r.id, r.titulo, ${IMAGEN} AS imagen, r.tipo_abertura, r.material, r.color,
           r.linea, r.etiqueta, r.ancho, r.alto, g.variantes::int, g.colores::int
    FROM representante r JOIN grupos g ON g.grupo = COALESCE(r.modelo_id, r.id)
    ORDER BY ${ORDEN_ETIQUETA.replaceAll('etiqueta', 'r.etiqueta')},
             r.tipo_abertura NULLS LAST, r.titulo
    LIMIT ${limite}`;

  const { rows } = await pool.query(sql, params);
  cacheable(c);
  return c.json(rows);
});

// GET /api/catalogo/filtros — valores para los chips de la grilla
app.get('/catalogo/filtros', async (c) => {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(array_agg(DISTINCT tipo_abertura) FILTER (WHERE tipo_abertura IS NOT NULL), '{}') AS tipos,
      COALESCE(array_agg(DISTINCT material)      FILTER (WHERE material      IS NOT NULL), '{}') AS materiales
    FROM catalogo_web`);
  cacheable(c);
  return c.json(rows[0]);
});

// GET /api/catalogo/:id — ficha completa + variantes del mismo modelo
app.get('/catalogo/:id', async (c) => {
  const id = c.req.param('id');
  if (!UUID_RE.test(id)) return c.json({ error: 'Producto no encontrado' }, 404);

  const { rows } = await pool.query(
    `SELECT id, titulo, descripcion, caracteristica_1, caracteristica_2, caracteristica_3,
            caracteristica_4, material, color, vidrio, premarco, accesorios, ancho, alto,
            imagenes, ${IMAGEN} AS imagen, video_url, etiqueta, tipo_abertura, sistema, linea,
            categoria, modelo_id, atributos, updated_at
     FROM catalogo_web WHERE id = $1`, [id]);
  const prod = rows[0];
  if (!prod) return c.json({ error: 'Producto no encontrado' }, 404);

  let variantes = [];
  if (prod.modelo_id) {
    ({ rows: variantes } = await pool.query(
      `SELECT id, color, ${IMAGEN} AS imagen FROM catalogo_web
       WHERE modelo_id = $1 ORDER BY color NULLS LAST, titulo`, [prod.modelo_id]));
  }

  const { atributos, caracteristica_1, caracteristica_2, caracteristica_3, caracteristica_4, ...resto } = prod;
  cacheable(c);
  return c.json({
    ...resto,
    imagenes: Array.isArray(prod.imagenes) ? prod.imagenes.filter((s) => typeof s === 'string' && s) : [],
    caracteristicas: [caracteristica_1, caracteristica_2, caracteristica_3, caracteristica_4]
      .map((s) => s?.trim()).filter(Boolean),
    ficha: atributosLegibles(atributos),
    variantes,
  });
});

app.get('/health', async (c) => {
  try {
    await pool.query('SELECT 1');
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

app.notFound((c) => c.json({ error: 'No encontrado' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Error interno' }, 500);
});

serve({ fetch: app.fetch, port: PORT }, () => console.log(`catálogo API en :${PORT}`));

const cerrar = () => pool.end().finally(() => process.exit(0));
process.on('SIGTERM', cerrar);
process.on('SIGINT', cerrar);
