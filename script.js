// Año dinámico
document.getElementById('year').textContent = new Date().getFullYear();

// Estado abierto / cerrado en tiempo real
// Horario: todos los días 9:00–16:00
const OPEN_MIN = 9 * 60;
const CLOSE_MIN = 16 * 60;

const isEN = document.documentElement.lang === 'en';

function updateOpenStatus() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const isOpen = mins >= OPEN_MIN && mins < CLOSE_MIN;

  const state = isOpen ? 'is-open' : 'is-closed';
  const label = isOpen ? (isEN ? 'Open' : 'Abierto') : (isEN ? 'Closed' : 'Cerrado');
  const detail = isOpen
    ? (isEN ? 'Closes at 16:00' : 'Cierra a las 16:00')
    : (mins < OPEN_MIN
        ? (isEN ? 'Opens today at 9:00' : 'Abre hoy a las 9:00')
        : (isEN ? 'Opens tomorrow at 9:00' : 'Abre mañana a las 9:00'));

  // Botón flotante de horario
  const statusFloat = document.getElementById('statusFloat');
  if (statusFloat) {
    statusFloat.classList.remove('is-open', 'is-closed');
    statusFloat.classList.add(state);
    statusFloat.querySelector('.txt').innerHTML = `<b>${label}</b><span class="status-detail"> · ${detail}</span>`;
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

// ---------- Vistas (páginas por hash, sin recargar) ----------
const views = document.querySelectorAll('.view');

function showView(id, updateHash = true) {
  if (!document.getElementById('view-' + id)) id = 'inicio';
  views.forEach(v => v.classList.toggle('is-active', v.id === 'view-' + id));
  document.querySelectorAll('[data-view]').forEach(a => a.classList.toggle('is-active', a.dataset.view === id));
  document.querySelectorAll('#view-' + id + ' .reveal').forEach(el => el.classList.add('is-visible'));
  links.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
  if (updateHash) history.replaceState(null, '', '#' + id);

  // Mantener la misma página al cambiar de idioma (index.html <-> en.html)
  const langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    const base = langSwitch.getAttribute('href').split('#')[0];
    langSwitch.href = base + '#' + id;
  }
}

document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  showView(el.dataset.view);
}));
window.addEventListener('hashchange', () => showView((location.hash || '#inicio').slice(1), false));

// Scroll suave del hero hacia "El lugar" (dentro de la misma vista, no cambia de página)
const heroScroll = document.getElementById('heroScroll');
if (heroScroll) {
  heroScroll.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
  });
}

// Reveal en scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section, .card, .gallery__item').forEach(el => {
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

// ---------- Cookies + iframes de terceros con consentimiento (Google Maps, CoverManager) ----------
(function () {
  const KEY = 'aura_cookies';
  const banner = document.getElementById('cookieBanner');
  const mapWrap = document.getElementById('mapWrap');
  const mapFrame = document.getElementById('mapFrame');
  const reservasWrap = document.getElementById('reservasWrap');
  const reservasFrame = document.getElementById('reservasFrame');

  function loadThirdPartyFrames() {
    if (mapFrame && !mapFrame.src) mapFrame.src = mapFrame.dataset.src;
    if (mapWrap) mapWrap.classList.add('ok');
    if (reservasFrame && !reservasFrame.src) reservasFrame.src = reservasFrame.dataset.src;
    if (reservasWrap) reservasWrap.classList.add('ok');
  }
  function setChoice(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    if (banner) banner.classList.remove('show');
    if (v === 'accept') loadThirdPartyFrames();
  }
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}
  if (choice === 'accept') loadThirdPartyFrames();
  else if (!choice && banner) banner.classList.add('show');

  document.getElementById('ckAccept')?.addEventListener('click', () => setChoice('accept'));
  document.getElementById('ckReject')?.addEventListener('click', () => setChoice('reject'));
  document.getElementById('mapAccept')?.addEventListener('click', () => setChoice('accept'));
  document.getElementById('reservasAccept')?.addEventListener('click', () => setChoice('accept'));
  document.getElementById('ckReset')?.addEventListener('click', () => { if (banner) banner.classList.add('show'); });
})();

// Vista inicial según el hash de la URL (debe ir al final, después de
// que los elementos .reveal ya existan)
showView((location.hash || '#inicio').slice(1), false);
