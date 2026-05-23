// Año dinámico
document.getElementById('year').textContent = new Date().getFullYear();

// Estado abierto / cerrado en tiempo real
// Horario: todos los días 9:00–17:00 · cocina y brunch hasta las 16:00
function updateOpenStatus() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const open    = 9 * 60;    // 09:00
  const kitchen = 16 * 60;   // 16:00
  const close   = 17 * 60;   // 17:00

  let state, label, labelShort, detail;
  if (mins < open) {
    state = 'is-closed';
    label = 'Cerrado'; labelShort = 'Cerrado';
    detail = 'Abre hoy a las 9:00';
  } else if (mins < kitchen) {
    state = 'is-open';
    label = 'Abierto ahora'; labelShort = 'Abierto';
    detail = 'Cocina hasta las 16:00';
  } else if (mins < close) {
    state = 'is-cafe-only';
    label = 'Solo café'; labelShort = 'Solo café';
    detail = 'Cocina cerrada · cierre 17:00';
  } else {
    state = 'is-closed';
    label = 'Cerrado'; labelShort = 'Cerrado';
    detail = 'Abre mañana a las 9:00';
  }

  // Badge del nav (texto corto en móvil)
  const navStatus = document.getElementById('navStatus');
  if (navStatus) {
    navStatus.classList.remove('is-open', 'is-cafe-only', 'is-closed');
    navStatus.classList.add(state);
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    navStatus.querySelector('.nav__status-label').textContent = isMobile ? labelShort : label;
    navStatus.setAttribute('title', `${label} · ${detail}`);
  }

  // Panel grande en la sección de horarios
  const big = document.getElementById('statusBig');
  if (big) {
    big.classList.remove('is-open', 'is-cafe-only', 'is-closed');
    big.classList.add(state);
    big.querySelector('.status-big__label').textContent = label;
    big.querySelector('.status-big__detail').textContent = detail;
  }
}
updateOpenStatus();
setInterval(updateOpenStatus, 60 * 1000);

// Nav: sombra al hacer scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Burger menu
const burger = document.querySelector('.nav__burger');
const links  = document.querySelector('.nav__links');
burger.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
});
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    links.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

// Reveal en scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section, .card, .gallery__item, .hours__panel').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

// Tabs de la carta
const tabs   = document.querySelectorAll('.menu__tab');
const panels = document.querySelectorAll('.menu__panel');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('is-active', t === tab));
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
  });
});

// Sustitución automática de imágenes en la galería.
// Coloca tus fotos en /images con los nombres foto-1.jpg ... foto-7.jpg
// (también acepta .jpeg, .png o .webp) y se cargan solas. Si no existen,
// se ve el placeholder con un degradado bonito.
const exts = ['jpg', 'jpeg', 'png', 'webp'];
document.querySelectorAll('.gallery__item[data-placeholder]').forEach(item => {
  const base = item.dataset.placeholder.replace(/\.[^.]+$/, '');
  const tryNext = (i = 0) => {
    if (i >= exts.length) return;
    const url = `images/${base}.${exts[i]}`;
    const img = new Image();
    img.onload = () => {
      item.style.backgroundImage = `url("${url}")`;
      item.style.backgroundSize = 'cover';
      item.style.backgroundPosition = 'center';
      item.classList.add('has-image');
    };
    img.onerror = () => tryNext(i + 1);
    img.src = url;
  };
  tryNext();
});
