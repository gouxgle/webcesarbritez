// Traduce el JSONB `atributos` de la vista catalogo_web (claves y valores en slug) a pares
// legibles para la ficha técnica. La vista ya recorta las claves por lista blanca; acá solo
// se les pone nombre. Una clave o un valor sin traducción cae al fallback (capitalizar y
// reemplazar "_" por espacio), así que una clave nueva nunca rompe la ficha.

const CLAVES = {
  tipo_puerta: 'Tipo de puerta',
  uso: 'Uso',
  config_hojas: 'Configuración de hojas',
  ancho_hoja: 'Ancho de hoja',
  hoja_principal: 'Hoja principal',
  tipo_provision: 'Provisión',
  estructura: 'Estructura',
  sistema: 'Sistema',
  espesor: 'Espesor',
  modelo: 'Modelo',
  modelo_comercial: 'Modelo comercial',
  subtipo_granero: 'Subtipo',
  diseno_hoja: 'Diseño de hoja',
  config_estructural: 'Configuración',
  apertura: 'Apertura',
  vidrio_incluye: 'Incluye vidrio',
  vidrio_tipo: 'Tipo de vidrio',
  vidrio_formato: 'Formato de vidrio',
  herrajes: 'Herrajes',
  cerradura: 'Cerradura',
  componentes: 'Componentes',
  instalacion: 'Instalación',
  entrega: 'Entrega',
  tipo_ventana: 'Tipo de ventana',
  celosia_tipo: 'Celosía',
  configuracion_especial: 'Configuración especial',
  diseno: 'Diseño',
  reja: 'Reja',
  mosquitero: 'Mosquitero',
  marco_tipo: 'Tipo de marco',
  tipo_mosquitera: 'Tipo de mosquitera',
  material_marco: 'Material del marco',
  tipo_malla: 'Tipo de malla',
};

const VALORES = {
  true: 'Sí',
  false: 'No',
  si: 'Sí',
  no: 'No',
  opcional: 'Opcional',
  hoja_simple: 'Hoja simple',
  hoja_y_media: 'Hoja y media',
  '2_hojas': '2 hojas',
  puerta_pano_fijo: 'Puerta + paño fijo',
  de_abrir: 'De abrir',
  chapa_inyectada: 'Chapa inyectada',
  chapa_simple: 'Chapa simple',
  aluminio_completo: 'Aluminio completo',
  placa_marco_aluminio: 'Placa con marco de aluminio',
  plegable_pvc: 'Plegable de PVC',
  embutir: 'De embutir',
  ingreso_frente: 'Ingreso / frente',
  hoja_marco: 'Hoja y marco',
  hoja_sola: 'Hoja sola',
  barral_medio_picaporte: 'Barral y medio picaporte',
  sistema_plegable: 'Sistema plegable',
  herrajes_completos: 'Herrajes completos',
  envio_disponible: 'Envío disponible',
  retiro_local: 'Retiro en el local',
  con_celosia: 'Con celosía',
  con_mosquitero: 'Con mosquitero',
  con_reja: 'Con reja',
  ultrafina: 'Ultrafina',
  estandar: 'Estándar',
  modena: 'Módena',
};

const humanizar = (s) => {
  const t = String(s).replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const valorLegible = (v) => {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(valorLegible).filter(Boolean).join(', ');
  const s = String(v).trim();
  if (!s) return '';
  return VALORES[s] ?? humanizar(s);
};

/** jsonb → [{ label, valor }] en el orden de CLAVES, sin vacíos. */
export function atributosLegibles(atributos) {
  if (!atributos || typeof atributos !== 'object') return [];
  const orden = Object.keys(CLAVES);
  return Object.entries(atributos)
    .sort(([a], [b]) => (orden.indexOf(a) + 1 || 999) - (orden.indexOf(b) + 1 || 999))
    .map(([k, v]) => ({ label: CLAVES[k] ?? humanizar(k), valor: valorLegible(v) }))
    .filter((a) => a.valor);
}
