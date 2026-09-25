// Ficha de producto estilo marketplace: galería, datos, caja de consulta, ficha técnica
// y productos relacionados. Sin precios (decisión de negocio del catálogo web).
import { api, el, badge, medidas, tarjeta, urlProducto, imagenProducto } from './catalogo-comun.js';
import { waLink } from './config.js';

const raiz = document.getElementById('ficha');
const id = new URLSearchParams(location.search).get('id');

function noEncontrado(titulo, texto) {
  document.title = `${titulo} — César Brítez Aberturas`;
  raiz.replaceChildren(el('div.cat-vacio.ficha-error', {}, [
    el('h2', { text: titulo }),
    el('p', { text: texto }),
    el('a.btn.btn--red', { href: '/catalogo.html', text: 'Ver el catálogo' }),
  ]));
}

/** YouTube / Vimeo → URL de embed; URL directa a video → null (se usa <video>). */
function embedVideo(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com') {
      const v = u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).pop();
      return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (host === 'vimeo.com') return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`;
  } catch { /* URL inválida */ }
  return null;
}

function galeria(p) {
  const medios = p.imagenes.map((src) => ({ tipo: 'img', src }));
  if (p.video_url) medios.push({ tipo: 'video', src: p.video_url });

  const principal = el('div.gal__main');
  const thumbs = el('div.gal__thumbs', { role: 'tablist', 'aria-label': 'Imágenes del producto' });

  const mostrar = (i) => {
    const m = medios[i];
    thumbs.querySelectorAll('.gal__thumb').forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
    if (!m) { principal.replaceChildren(imagenProducto(null, '', 'gal__img')); return; }
    if (m.tipo === 'img') {
      const img = el('img.gal__img', { src: m.src, alt: p.titulo });
      principal.replaceChildren(img);
      // Zoom tipo marketplace: la imagen sigue al puntero (solo con mouse).
      principal.onmousemove = (e) => {
        const r = principal.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      };
    } else {
      principal.onmousemove = null;
      const emb = embedVideo(m.src);
      principal.replaceChildren(emb
        ? el('iframe.gal__video', { src: emb, title: `Video: ${p.titulo}`, allow: 'fullscreen; picture-in-picture', loading: 'lazy' })
        : el('video.gal__video', { src: m.src, controls: true, preload: 'metadata' }));
    }
  };

  medios.forEach((m, i) => {
    thumbs.append(el('button.gal__thumb', {
      type: 'button', role: 'tab', 'aria-label': m.tipo === 'img' ? `Imagen ${i + 1}` : 'Video',
      onmouseenter: () => m.tipo === 'img' && mostrar(i), onclick: () => mostrar(i),
    }, [m.tipo === 'img'
      ? el('img', { src: m.src, alt: '', loading: 'lazy' })
      : el('span.gal__play', { 'aria-hidden': 'true', text: '▶' })]));
  });
  mostrar(0);
  return el('div.gal', {}, [medios.length > 1 ? thumbs : null, principal]);
}

function variantes(p) {
  if (p.variantes.length < 2) {
    return p.color ? el('p.ficha__color', {}, ['Color: ', el('strong', { text: p.color })]) : null;
  }
  return el('div.ficha__variantes', {}, [
    el('p.ficha__color', {}, ['Color: ', el('strong', { text: p.color ?? '—' })]),
    el('div.var', {}, p.variantes.map((v) => el('a.var__item', {
      href: urlProducto(v.id), title: v.color ?? '', 'aria-current': v.id === p.id ? 'true' : null,
    }, [imagenProducto(v.imagen, v.color ?? '', 'var__img')]))),
  ]);
}

function cajaConsulta(p) {
  const link = `${location.origin}${urlProducto(p.id)}`;
  const texto = `Hola César Brítez, quisiera consultar precio y disponibilidad de: ${p.titulo}${p.color ? ` (${p.color})` : ''}.\n${link}`;
  const ok = (titulo, sub) => el('li', {}, [el('strong', { text: titulo }), el('span', { text: sub })]);
  return el('aside.caja', {}, [
    el('p.caja__titulo', { text: 'Consultá precio y disponibilidad' }),
    el('p.caja__sub', { text: 'Te respondemos por WhatsApp con el presupuesto para tu obra.' }),
    el('a.btn.btn--wa.btn--full', { href: waLink(texto), target: '_blank', rel: 'noopener', text: 'Consultar por WhatsApp' }),
    el('a.btn.btn--outline.btn--full', { href: '/#contacto', text: 'Pedir presupuesto' }),
    el('ul.caja__beneficios', {}, [
      ok('Instalación con equipo propio', 'Sin terceros, de principio a fin'),
      ok('Medida exacta', 'Fabricamos a medida para cada obra'),
      ok('Asesoramiento sin cargo', 'Te guiamos en la elección'),
    ]),
  ]);
}

function fichaTecnica(p) {
  const filas = [
    ['Tipo', p.tipo_abertura], ['Línea', p.linea], ['Sistema', p.sistema],
    ['Material', p.material], ['Color', p.color], ['Vidrio', p.vidrio],
    ['Medidas', medidas(p) ?? 'A medida'], ['Premarco', p.premarco ? 'Incluido' : null],
    ['Accesorios', p.accesorios?.length ? p.accesorios.join(', ') : null],
    ...p.ficha.map((a) => [a.label, a.valor]),
  ].filter(([, v]) => v);
  return el('table.tabla', {}, [el('tbody', {}, filas.map(([k, v]) =>
    el('tr', {}, [el('th', { scope: 'row', text: k }), el('td', { text: v })])))]);
}

async function relacionados(p) {
  const cont = document.getElementById('relacionados');
  try {
    const qs = new URLSearchParams({ excluir: p.id, limite: '4' });
    if (p.tipo_abertura) qs.set('tipo', p.tipo_abertura);
    const lista = await api(`/catalogo?${qs}`);
    if (!lista.length) return;
    cont.replaceChildren(
      el('h2.bloque__titulo', { text: 'También te puede interesar' }),
      el('div.cat-grid.cat-grid--4', {}, lista.map(tarjeta)));
    cont.hidden = false;
  } catch { /* opcional: sin relacionados no pasa nada */ }
}

function render(p) {
  document.title = `${p.titulo} — César Brítez Aberturas`;
  document.querySelector('meta[name="description"]')?.setAttribute('content',
    (p.descripcion ?? `${p.titulo}. Consultá precio y disponibilidad.`).slice(0, 160));
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', p.titulo);
  if (p.imagen) document.querySelector('meta[property="og:image"]')?.setAttribute('content', p.imagen);

  const tipoUrl = p.tipo_abertura ? `/catalogo.html?tipo=${encodeURIComponent(p.tipo_abertura)}` : null;
  const sub = [p.linea && `Línea ${p.linea}`, p.sistema, p.material].filter(Boolean).join(' · ');

  raiz.replaceChildren(
    el('nav.migas', { 'aria-label': 'Ruta' }, [
      el('a', { href: '/catalogo.html', text: 'Catálogo' }),
      tipoUrl && el('span', { 'aria-hidden': 'true', text: '›' }),
      tipoUrl && el('a', { href: tipoUrl, text: p.tipo_abertura }),
      p.categoria && p.categoria !== p.tipo_abertura && el('span', { 'aria-hidden': 'true', text: '›' }),
      p.categoria && p.categoria !== p.tipo_abertura && el('span', { text: p.categoria }),
    ]),
    el('article.ficha', {}, [
      galeria(p),
      el('div.ficha__info', {}, [
        el('div.ficha__badges', {}, [badge(p.etiqueta), p.tipo_abertura && el('span.ficha__tipo', { text: p.tipo_abertura })]),
        el('h1.ficha__titulo', { text: p.titulo }),
        sub && el('p.ficha__sub', { text: sub }),
        variantes(p),
        el('p.ficha__medidas', {}, ['Medidas: ', el('strong', { text: medidas(p) ?? 'A medida' })]),
        p.caracteristicas.length > 0 && el('div.ficha__carac', {}, [
          el('h2', { text: 'Lo que tenés que saber de este producto' }),
          el('ul', {}, p.caracteristicas.map((c) => el('li', { text: c }))),
        ]),
      ]),
      cajaConsulta(p),
    ]),
    el('section.bloque', {}, [
      el('div.bloque__col', {}, [
        el('h2.bloque__titulo', { text: 'Descripción' }),
        el('p.bloque__desc', { text: p.descripcion || 'Consultanos por los detalles de este producto: te asesoramos sin cargo.' }),
      ]),
      el('div.bloque__col', {}, [el('h2.bloque__titulo', { text: 'Características técnicas' }), fichaTecnica(p)]),
    ]),
  );
  relacionados(p);
}

if (!id) {
  noEncontrado('Producto no encontrado', 'El enlace no es válido.');
} else {
  api(`/catalogo/${encodeURIComponent(id)}`)
    .then(render)
    .catch((e) => e.status === 404
      ? noEncontrado('Producto no encontrado', 'Puede que ya no esté publicado en el catálogo.')
      : noEncontrado('No pudimos cargar el producto', 'Probá de nuevo en unos minutos.'));
}
