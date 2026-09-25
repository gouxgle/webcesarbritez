// Grilla del catálogo online: filtros por tipo y material, búsqueda y tarjetas.
import { api, el, tarjeta, skeletons } from './catalogo-comun.js';
import { waLink } from './config.js';

const grilla   = document.getElementById('grilla');
const chipsTipo = document.getElementById('chipsTipo');
const chipsMat  = document.getElementById('chipsMaterial');
const buscador  = document.getElementById('buscador');
const contador  = document.getElementById('contador');

const params = new URLSearchParams(location.search);
const estado = {
  tipo: params.get('tipo') ?? '',
  material: params.get('material') ?? '',
  q: params.get('q') ?? '',
};
buscador.value = estado.q;

function sincronizarURL() {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(estado)) if (v) p.set(k, v);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function renderChips(cont, valores, clave) {
  cont.replaceChildren();
  if (valores.length < 2 && !estado[clave]) { cont.hidden = true; return; }
  cont.hidden = false;
  for (const v of ['', ...valores]) {
    cont.append(el('button.chip', {
      type: 'button',
      'aria-pressed': String(estado[clave] === v),
      text: v || 'Todos',
      onclick: () => { estado[clave] = v; renderChips(cont, valores, clave); cargar(); },
    }));
  }
}

let pedido = 0;
async function cargar() {
  sincronizarURL();
  const mio = ++pedido;
  grilla.setAttribute('aria-busy', 'true');
  grilla.replaceChildren(...skeletons(8));
  contador.textContent = '';
  try {
    const qs = new URLSearchParams(Object.entries(estado).filter(([, v]) => v)).toString();
    const productos = await api(`/catalogo${qs ? `?${qs}` : ''}`);
    if (mio !== pedido) return;
    contador.textContent = productos.length === 1 ? '1 producto' : `${productos.length} productos`;
    if (!productos.length) {
      grilla.replaceChildren(el('div.cat-vacio', {}, [
        el('h3', { text: 'No encontramos productos con esos filtros' }),
        el('p', { text: 'Probá con otra búsqueda o consultanos: fabricamos a medida.' }),
        el('a.btn.btn--red', { href: waLink('Hola, estoy buscando una abertura que no encontré en el catálogo.'), target: '_blank', rel: 'noopener', text: 'Consultar por WhatsApp' }),
      ]));
    } else {
      grilla.replaceChildren(...productos.map(tarjeta));
    }
  } catch {
    if (mio !== pedido) return;
    grilla.replaceChildren(el('div.cat-vacio', {}, [
      el('h3', { text: 'No pudimos cargar el catálogo' }),
      el('p', { text: 'Probá de nuevo en unos minutos.' }),
      el('button.btn.btn--red', { type: 'button', text: 'Reintentar', onclick: cargar }),
    ]));
  } finally {
    if (mio === pedido) grilla.removeAttribute('aria-busy');
  }
}

let t;
buscador.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => { estado.q = buscador.value.trim(); cargar(); }, 300);
});
document.getElementById('formBuscar').addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(t);
  estado.q = buscador.value.trim();
  cargar();
});

api('/catalogo/filtros')
  .then((f) => { renderChips(chipsTipo, f.tipos, 'tipo'); renderChips(chipsMat, f.materiales, 'material'); })
  .catch(() => {});
cargar();
