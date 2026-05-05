// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 40);
}, { passive: true });

// Mobile burger
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Smooth active nav links on scroll
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav__link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinksAll.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'white';
        }
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => observer.observe(s));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Form → WhatsApp
const form = document.getElementById('form');
const WA_NUMBER = '543704000000'; // TODO: reemplazar con número real

form.addEventListener('submit', e => {
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
  ].filter(l => l !== null).join('\n');

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`, '_blank');
});

// Animate-in on scroll
const animEls = document.querySelectorAll('.prod-card, .step, .strip__item, .nosotros__card');
const animObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
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
