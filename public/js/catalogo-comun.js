// Utilidades compartidas por el catálogo (grilla, ficha y destacados de la portada).
// Todo texto que viene de la base se inserta con textContent, nunca como HTML.

export const ETIQUETAS = {
  mas_vendido: 'Más vendido',
  recomendado: 'Recomendado',
  nuevo: 'Nuevo',
};

/** Crea un elemento: el('a.card', { href }, [hijos | texto]) */
export function el(tag, attrs = {}, hijos = []) {
  const [nombre, ...clases] = tag.split('.');
  const n = document.createElement(nombre);
  if (clases.length) n.className = clases.join(' ');
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const h of [].concat(hijos)) {
    if (h === null || h === undefined || h === false) continue;
    n.append(h instanceof Node ? h : document.createTextNode(String(h)));
  }
  return n;
}

export async function api(ruta) {
  const r = await fetch(`/api${ruta}`, { headers: { Accept: 'application/json' } });
  if (r.status === 404) { const e = new Error('no encontrado'); e.status = 404; throw e; }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** "80.00" → "80" · "0.90" → "0,9" */
const num = (v) => Number(v).toLocaleString('es-AR', { maximumFractionDigits: 2 });

export function medidas(p) {
  if (p.ancho && p.alto) return `${num(p.ancho)} × ${num(p.alto)} cm`;
  return null;
}

export const urlProducto = (id) => `/producto.html?id=${encodeURIComponent(id)}`;

export function badge(etiqueta) {
  if (!ETIQUETAS[etiqueta]) return null;
  return el(`span.badge.badge--${etiqueta}`, { text: ETIQUETAS[etiqueta] });
}

export function imagenProducto(src, alt, clase = 'pcard__img') {
  if (!src) return el(`div.${clase}.img-vacia`, { 'aria-hidden': 'true' }, [iconoAbertura()]);
  return el(`img.${clase}`, { src, alt, loading: 'lazy', decoding: 'async' });
}

function iconoAbertura() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('fill', 'none');
  svg.innerHTML = '<rect x="8" y="8" width="48" height="48" rx="4" stroke="currentColor" stroke-width="2.5"/><line x1="32" y1="8" x2="32" y2="56" stroke="currentColor" stroke-width="2"/>';
  return svg;
}

/** Tarjeta de producto para grillas (catálogo, relacionados, destacados). */
export function tarjeta(p) {
  const meta = [p.tipo_abertura, p.material, p.linea].filter(Boolean).join(' · ');
  const extra = p.colores > 1 ? `${p.colores} colores disponibles` : medidas(p) ?? (p.color || null);
  return el('a.pcard', { href: urlProducto(p.id) }, [
    el('div.pcard__media', {}, [imagenProducto(p.imagen, p.titulo), badge(p.etiqueta)]),
    el('div.pcard__body', {}, [
      el('h3.pcard__title', { text: p.titulo }),
      meta && el('p.pcard__meta', { text: meta }),
      extra && el('p.pcard__extra', { text: extra }),
      el('span.pcard__cta', { text: 'Ver detalle →' }),
    ]),
  ]);
}

export function skeletons(n) {
  return Array.from({ length: n }, () =>
    el('div.pcard.pcard--skeleton', { 'aria-hidden': 'true' }, [
      el('div.pcard__media'), el('div.pcard__body', {}, [el('div.sk'), el('div.sk.sk--corto')]),
    ]));
}
