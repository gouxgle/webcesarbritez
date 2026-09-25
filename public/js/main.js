// Comportamiento común a todas las páginas del sitio (nav, footer, WhatsApp) y, en la
// portada, formulario de contacto, animaciones y productos destacados del catálogo.
import { WA_NUMBER, waLink } from './config.js';
import { api, tarjeta } from './catalogo-comun.js';

// Links de WhatsApp: el número vive solo en config.js
document.querySelectorAll('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

// Nav scroll effect (las páginas internas usan nav--solid y no dependen del scroll)
const nav = document.getElementById('nav');
if (nav && !nav.classList.contains('nav--solid')) {
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mobile burger
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
if (burger && navLinks) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// Smooth active nav links on scroll (solo portada)
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav__link');
if (sections.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinksAll.forEach((link) => {
          link.style.color = '';
          if (link.getAttribute('href').endsWith('#' + entry.target.id)) link.style.color = 'white';
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach((s) => observer.observe(s));
}

// Footer year
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Form → WhatsApp
const form = document.getElementById('form');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre   = form.nombre.value.trim();
  const telefono = form.telefono.value.trim();
  const email    = form.email.value.trim();
  const mensaje  = form.mensaje.value.trim();

  if (!nombre || !telefono || !mensaje) {
    form.querySelector('[required]:placeholder-shown')?.focus();
    return;
  }

  const txt = [
    `Hola César Brítez, me comunico desde el sitio web.`,
    ``,
    `*Nombre:* ${nombre}`,
    `*Teléfono:* ${telefono}`,
    email ? `*Email:* ${email}` : null,
    ``,
    `*Consulta:*`,
    mensaje,
  ].filter((l) => l !== null).join('\n');

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`, '_blank');
});

// Animate-in on scroll
const animEls = document.querySelectorAll('.prod-card, .step, .strip__item, .nosotros__card');
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = entry.target.style.transform?.replace('translateY(20px)', '') || '';
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

animEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transition = `opacity .4s ease ${i * 60}ms, transform .4s ease ${i * 60}ms`;
  el.style.transform = 'translateY(20px)';
  animObserver.observe(el);
});

// Portada: productos destacados del catálogo online (los que tienen etiqueta).
// Si la API no responde o no hay destacados, el bloque queda oculto.
const destacados = document.getElementById('destacados');
if (destacados) {
  api('/catalogo?destacados=1&limite=4')
    .then((lista) => {
      if (!lista.length) return;
      destacados.querySelector('.cat-grid').replaceChildren(...lista.map(tarjeta));
      destacados.hidden = false;
    })
    .catch(() => {});
}
