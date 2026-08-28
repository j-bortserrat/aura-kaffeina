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

// Scroll suave del hero hacia "El lugar" (dentro de la misma página)
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

// ---------- Cookies + iframe de terceros con consentimiento (Google Maps) ----------
(function () {
  const KEY = 'aura_cookies';
  const banner = document.getElementById('cookieBanner');
  const mapWrap = document.getElementById('mapWrap');
  const mapFrame = document.getElementById('mapFrame');

  function loadThirdPartyFrames() {
    if (mapFrame && !mapFrame.src) mapFrame.src = mapFrame.dataset.src;
    if (mapWrap) mapWrap.classList.add('ok');
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
  document.getElementById('ckReset')?.addEventListener('click', () => { if (banner) banner.classList.add('show'); });
})();

// ---------- Reservas por WhatsApp ----------
(function () {
  const form = document.getElementById('reservasForm');
  if (!form) return;
  const WHATSAPP_NUMBER = '34612422574';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nombre = (data.get('nombre') || '').trim();
    const personas = data.get('personas');
    const fecha = data.get('fecha');
    const hora = data.get('hora');
    const comentario = (data.get('comentario') || '').trim();

    const fechaFmt = fecha
      ? new Date(fecha + 'T00:00:00').toLocaleDateString(isEN ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long' })
      : '';

    let msg = isEN
      ? `Hi AURA! I'd like to book a table for ${personas} on ${fechaFmt} at ${hora}. Name: ${nombre}.`
      : `¡Hola AURA! Querría reservar mesa para ${personas} personas el ${fechaFmt} a las ${hora}. Nombre: ${nombre}.`;
    if (comentario) msg += isEN ? ` Note: ${comentario}` : ` Comentario: ${comentario}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();

// ---------- Talleres (data-driven desde talleres.json) ----------
// Pega aquí la URL de "Publicar en la web" (formato CSV) de la Google Sheet
// de Talleres: en la Sheet, Archivo > Compartir > Publicar en la web >
// selecciona la pestaña > formato "Valores separados por comas (.csv)" > Publicar.
// Mientras esté vacía, se usa talleres.json como fuente local.
const TALLERES_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/131CPxEHaCQD9SlgxJxuSr0AhGdZZLcna359Uv4-XitY/export?format=csv&gid=1547456886';

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* ignorado, lo maneja \n */ }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCSV(text.trim());
  if (!rows.length) return [];
  // Cabeceras en minúsculas: así da igual si en la Sheet se escriben
  // "Plazas", "PLAZAS" o "plazas" — el código siempre las lee igual.
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
}

// Normaliza enlaces de Google Drive (cualquier formato que dé "Copiar enlace")
// a una URL de imagen directa, usable en <img>/background-image.
function normalizeImageUrl(url) {
  if (!url) return '';
  url = url.trim();
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1200` : url;
}

// Mismo ID que usa el horneado (scripts/bake-content.mjs) para cachear la
// foto en images/talleres/. Si ya está horneada, se usa esa copia propia en
// vez de pedirle la imagen a Google directamente desde el navegador —
// algunos bloqueadores de anuncios/extensiones de privacidad impiden
// incrustar imágenes de googleusercontent.com como <img>, aunque el enlace
// funcione perfectamente si se abre directamente.
function driveFileId(url) {
  if (!url) return null;
  const m = url.trim().match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
  return m ? m[1] : null;
}

// Formatea una fecha "dd/mm/aaaa" (la que da Google Sheets) a algo legible.
function formatFecha(raw) {
  const m = (raw || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return raw || '';
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.toLocaleDateString(isEN ? 'en-GB' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function parseFechaDate(raw) {
  const m = (raw || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

// De todos los talleres publicados, se queda con los que aún no han
// pasado (ordenados por fecha) + el último que ya se hizo (si lo hay).
// Los que no tienen fecha (compatibilidad con talleres.json) se muestran
// siempre, al final.
function seleccionarTalleres(items) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const conFecha = items
    .map((t) => ({ t, fecha: parseFechaDate(t.fecha) }))
    .filter((x) => x.fecha);
  const sinFecha = items.filter((t) => !parseFechaDate(t.fecha));

  const proximos = conFecha.filter((x) => x.fecha >= hoy).sort((a, b) => b.fecha - a.fecha);
  const pasados = conFecha.filter((x) => x.fecha < hoy).sort((a, b) => b.fecha - a.fecha);

  const resultado = proximos.map((x) => x.t);
  if (pasados.length) resultado.push(pasados[0].t);
  resultado.push(...sinFecha);
  return resultado;
}

// Construye el subtítulo a partir de columnas sueltas (fecha, hora, plazas)
// si existen; si no, usa la columna de texto libre subtitulo/subtitulo_en.
function buildSubtitulo(t) {
  const partes = [];
  if (t.fecha) partes.push(formatFecha(t.fecha));
  if (t.hora) partes.push(t.hora);
  if (t.plazas) partes.push(isEN ? `${t.plazas} spots` : `${t.plazas} plazas`);
  if (partes.length) return partes.join(' · ');
  return isEN ? (t.subtitulo_en || t.subtitulo || '') : (t.subtitulo || '');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const WHATSAPP_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c-5.4 0-9.8 4.4-9.8 9.8 0 1.7.5 3.4 1.3 4.9L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.4 0 9.8-4.4 9.8-9.8s-4.4-9.8-9.8-9.8zm0 17.9c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3c-.8-1.3-1.3-2.9-1.3-4.5 0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8.4-8.2 8.4zm4.5-6.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.2-.2.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2.9 2.4.1.2 1.6 2.5 4 3.5.6.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3z"/></svg>';
const WHATSAPP_NUMBER_TALLERES = '34612422574';

(function () {
  const grid = document.getElementById('talleresGrid');
  if (!grid) return;

  let imageMap = {};

  function paint(items) {
    const visibles = items.filter((t) => String(t.publicar || 'si').toLowerCase() !== 'no');
    if (!visibles.length) throw new Error('sin talleres publicados');
    const seleccion = seleccionarTalleres(visibles);

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    grid.innerHTML = seleccion.map((t) => {
      const titulo = isEN ? (t.titulo_en || t.titulo) : t.titulo;
      const subtitulo = buildSubtitulo(t);
      const texto = isEN ? (t.texto_en || t.texto) : t.texto;
      const fileId = driveFileId(t.imagen);
      const imagen = (fileId && imageMap[fileId]) || normalizeImageUrl(t.imagen);
      const fecha = parseFechaDate(t.fecha);
      const pasado = fecha && fecha < hoy;
      const cuando = fecha ? `${formatFecha(t.fecha)}${t.hora ? ' · ' + t.hora : ''}` : '';
      const apuntarse = pasado ? '' : `
            <div class="taller__signup">
              <button type="button" class="btn btn--primary taller__open">${isEN ? 'Sign me up' : 'Apúntame'}</button>
              <form class="taller__apuntarse" data-titulo="${escapeHtml(titulo)}" data-cuando="${escapeHtml(cuando)}" hidden>
                <div class="taller__stepper">
                  <button type="button" class="taller__step" data-dir="-1" aria-label="${isEN ? 'Fewer people' : 'Menos personas'}">−</button>
                  <input type="number" name="personas" min="1" max="20" value="2" inputmode="numeric" aria-label="${isEN ? 'Number of people' : 'Número de personas'}" required />
                  <button type="button" class="taller__step" data-dir="1" aria-label="${isEN ? 'More people' : 'Más personas'}">+</button>
                </div>
                <button type="submit" class="btn btn--primary taller__cta">${WHATSAPP_ICON_SVG}<span>${isEN ? 'Send request' : 'Enviar solicitud'}</span></button>
              </form>
            </div>`;
      const imgTag = imagen
        ? `<img src="${imagen}" alt="${escapeHtml(titulo)}" loading="lazy" onerror="if(!this.dataset.retried){this.dataset.retried='1';this.src=this.src+'?r='+Date.now();}else{this.remove();this.parentElement.classList.remove('has-image');}" />`
        : '';
      return `
        <article class="taller__card${pasado ? ' taller__card--pasado' : ''}">
          <div class="taller__img${imagen ? ' has-image' : ''}" data-placeholder="${escapeHtml(titulo)}">${imgTag}</div>
          <div class="taller__body">
            <h3>${titulo}</h3>
            <p class="taller__sub">${subtitulo || ''}${pasado ? ` · <span class="taller__tag">${isEN ? 'Past' : 'Ya realizado'}</span>` : ''}</p>
            <p class="taller__text">${texto || ''}</p>
            ${apuntarse}
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('.taller__stepper').forEach((stepper) => {
      const input = stepper.querySelector('input');
      stepper.querySelectorAll('.taller__step').forEach((btn) => {
        btn.addEventListener('click', () => {
          const min = +input.min || 1;
          const max = +input.max || 99;
          const next = (+input.value || min) + (+btn.dataset.dir);
          input.value = Math.min(max, Math.max(min, next));
        });
      });
    });

    grid.querySelectorAll('.taller__open').forEach((openBtn) => {
      openBtn.addEventListener('click', () => {
        const form = openBtn.nextElementSibling;
        openBtn.hidden = true;
        form.hidden = false;
        form.querySelector('input')?.focus();
      });
    });

    grid.querySelectorAll('.taller__apuntarse').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const personas = new FormData(form).get('personas');
        const titulo = form.dataset.titulo;
        const cuando = form.dataset.cuando;
        const lineas = isEN
          ? ['Hi AURA,', '', `I'd like to join the workshop *${titulo}*.`, cuando ? `Date: ${cuando}` : null, `People: ${personas}`, '', 'Could you confirm my spot?']
          : ['Hola AURA,', '', `Quiero apuntarme al taller *${titulo}*.`, cuando ? `Fecha: ${cuando}` : null, `Personas: ${personas}`, '', '¿Podéis confirmarme la plaza?'];
        const msg = lineas.filter((l) => l !== null).join('\n');
        window.open(`https://wa.me/${WHATSAPP_NUMBER_TALLERES}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      });
    });
  }

  function fromSheet() {
    const sep = TALLERES_SHEET_CSV_URL.includes('?') ? '&' : '?';
    return fetch(`${TALLERES_SHEET_CSV_URL}${sep}v=${Date.now()}`)
      .then((r) => { if (!r.ok) throw new Error('sheet no disponible'); return r.text(); })
      .then(csvToObjects);
  }
  function fromLocalJson() {
    return fetch('talleres.json').then((r) => r.json());
  }
  function showEmpty() {
    grid.innerHTML = `<p class="talleres__empty">${isEN ? 'Workshops coming soon.' : 'Muy pronto, nuevos talleres.'}</p>`;
  }

  function fetchImageMap() {
    return fetch('talleres-images.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  }

  fetchImageMap().then((map) => {
    imageMap = map;
    const load = TALLERES_SHEET_CSV_URL ? fromSheet : fromLocalJson;
    load()
      .then(paint)
      .catch(() => {
        if (TALLERES_SHEET_CSV_URL) fromLocalJson().then(paint).catch(showEmpty);
        else showEmpty();
      });
  });
})();

// ---------- Carta (opcional, data-driven desde Google Sheets) ----------
// Pega aquí la URL de exportación CSV de la Sheet de la carta (mismo
// procedimiento que TALLERES_SHEET_CSV_URL: Compartir > Cualquiera con el
// enlace > Lector, y usar .../export?format=csv&gid=...).
// Mientras esté vacía, la carta se queda tal cual está escrita en el HTML
// (no se toca nada) — esto es 100% opcional y no puede romper la carta actual.
const CARTA_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1PHh0xQYdxf3YcuI2_vE2Y6lAO_Az22scKLOVm3EwilY/export?format=csv&gid=1254248669';

(function () {
  if (!CARTA_SHEET_CSV_URL) return;

  const menuEl = document.querySelector('.menu');
  const tabsWrap = document.querySelector('.menu__tabs');
  if (!menuEl || !tabsWrap) return;

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cat';
  }

  function renderCarta(rows) {
    const visibles = rows.filter((r) => String(r.publicar || 'si').toLowerCase() !== 'no');
    if (!visibles.length) throw new Error('carta vacía');

    // Agrupar por categoría > subcategoría, preservando orden_categoria / orden.
    const categorias = [];
    const porId = new Map();
    visibles.forEach((r) => {
      const nombreCat = isEN ? (r.categoria_en || r.categoria) : r.categoria;
      const id = slugify(r.categoria || nombreCat);
      if (!porId.has(id)) {
        porId.set(id, {
          id,
          nombre: nombreCat,
          nota: isEN ? (r.categoria_nota_en || r.categoria_nota) : r.categoria_nota,
          orden: +r.orden_categoria || 999,
          subcats: new Map(),
        });
        categorias.push(porId.get(id));
      }
      const cat = porId.get(id);
      const subNombre = isEN ? (r.subcategoria_en || r.subcategoria) : (r.subcategoria || '');
      if (!cat.subcats.has(subNombre)) cat.subcats.set(subNombre, []);
      cat.subcats.get(subNombre).push(r);
    });
    categorias.sort((a, b) => a.orden - b.orden);
    categorias.forEach((cat) => {
      cat.subcats.forEach((items) => items.sort((a, b) => (+a.orden || 0) - (+b.orden || 0)));
    });

    tabsWrap.innerHTML = categorias.map((cat, i) => `
      <button class="menu__tab${i === 0 ? ' is-active' : ''}" data-tab="${cat.id}" role="tab">${escapeHtml(cat.nombre)}</button>`
    ).join('');

    menuEl.querySelectorAll('.menu__panel').forEach((p) => p.remove());
    const legal = menuEl.querySelector('.menu__legal');
    categorias.forEach((cat, i) => {
      const panel = document.createElement('div');
      panel.className = 'menu__panel' + (i === 0 ? ' is-active' : '');
      panel.dataset.panel = cat.id;
      let html = '';
      if (cat.nota) {
        html += `<div class="menu__intro"><strong>${escapeHtml(cat.nombre)}</strong><span>${escapeHtml(cat.nota)}</span></div>`;
      }
      html += '<div class="menu__cols">';
      cat.subcats.forEach((items, subNombre) => {
        html += '<div class="menu__col">';
        if (subNombre) html += `<p class="menu__cat">${escapeHtml(subNombre)}</p>`;
        items.forEach((it) => {
          const nombre = isEN ? (it.nombre_en || it.nombre) : it.nombre;
          const desc = isEN ? (it.descripcion_en || it.descripcion) : it.descripcion;
          const aler = it.alergenos ? ` (${escapeHtml(it.alergenos)})` : '';
          const descHtml = desc || aler ? `<p>${escapeHtml(desc)}${aler}</p>` : '';
          html += `<div class="menu__item"><div class="menu__name">${escapeHtml(nombre)} <span class="price">${escapeHtml(it.precio || '')}</span></div>${descHtml}</div>`;
        });
        html += '</div>';
      });
      html += '</div>';
      panel.innerHTML = html;
      menuEl.insertBefore(panel, legal || null);
    });

    bindMenuTabs();
  }

  function bindMenuTabs() {
    const tabs = menuEl.querySelectorAll('.menu__tab');
    const panels = menuEl.querySelectorAll('.menu__panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
        panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
      });
    });
  }

  const sep = CARTA_SHEET_CSV_URL.includes('?') ? '&' : '?';
  fetch(`${CARTA_SHEET_CSV_URL}${sep}v=${Date.now()}`)
    .then((r) => { if (!r.ok) throw new Error('carta sheet no disponible'); return r.text(); })
    .then(csvToObjects)
    .then(renderCarta)
    .catch(() => { /* si algo falla, se queda la carta estática del HTML tal cual */ });
})();
