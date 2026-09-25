// Configuración del sitio. Único lugar donde vive el número de WhatsApp.
// TODO: reemplazar con el número real (formato internacional sin "+": 549370XXXXXXX).
export const WA_NUMBER = '543704000000';

export const waLink = (texto) =>
  `https://wa.me/${WA_NUMBER}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
