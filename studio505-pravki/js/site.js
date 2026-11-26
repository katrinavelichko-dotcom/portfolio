/* студия 505: разметка из данных (шапка, подвал, афиша, репертуар, спектакль, люди).
   Правки заказчика 24.11: без плавных появлений при прокрутке, меню «репертуар / о студии / адрес»,
   логотип «студия 505» на каждой странице, синий подвал из базового варианта, люди театра внутри «о студии». */

const NAV = [
  ['репертуар', 'spektakli.html', 'shows'],
  ['о студии', 'o-teatre.html', 'about'],
  ['адрес', 'kak-dobratsya.html', 'route'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const byName = () => Object.fromEntries(PEOPLE.map((p) => [p.name, p]));
const showUrl = (id) => `spektakl.html?id=${id}`;
const personUrl = (id) => `o-teatre.html#${id}`;
/* логотип: цифры той же высоты, что и строчные буквы «студия» (правка заказчика) */
const LOGO = 'студия <span class="num">505</span>';

function personLink(name) {
  const p = byName()[name];
  return p ? `<a class="person-link" href="${personUrl(p.id)}">${esc(name)}</a>` : `<span>${esc(name)}</span>`;
}

/* Инициалы по графемам (break-ui): «Ману» → «М», имя с эмодзи не ломается */
function initials(name) {
  const seg = 'Segmenter' in Intl ? new Intl.Segmenter('ru', { granularity: 'grapheme' }) : null;
  const first = (w) => (seg ? [...seg.segment(w)][0]?.segment : [...w][0]) || '';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '·';
  return (first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : '')).toUpperCase();
}

/* ---------- шапка ---------- */
function renderHeader(el) {
  const page = document.body.dataset.page;
  el.innerHTML = `
  <a class="wordmark" href="index.html" aria-label="студия 505, на главную">${LOGO}</a>
  <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Открыть меню"><i></i><i></i></button>
  <nav id="nav" class="nav" aria-label="Разделы">${NAV.map(([t, h, id]) =>
    `<a href="${h}"${id === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;

  const burger = el.querySelector('.burger');
  const links = [...el.querySelectorAll('.nav a')];
  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    el.classList.toggle('is-open', open);
    if (open) el.classList.remove('on-dark');
    else watch();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) { setOpen(false); burger.focus(); } });
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  matchMedia('(min-width: 1101px)').addEventListener('change', (e) => e.matches && setOpen(false));

  // над тёмным первым экраном и синим подвалом шапка прозрачная со светлым текстом, иначе на светлом фоне
  let io;
  const watch = () => {
    io?.disconnect();
    const h = el.offsetHeight;
    const hits = new Set();
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? hits.add(en.target) : hits.delete(en.target)));
      const open = el.classList.contains('is-open');
      el.classList.toggle('on-dark', !open && hits.size > 0);
      // над тёмным первым экраном (не над синим подвалом) логотип может быть синим — примерка ?logo=blue / light
      el.classList.toggle('on-hero', !open && [...hits].some((n) => n.classList.contains('hero')));
    }, { rootMargin: `0px 0px -${Math.max(0, innerHeight - h)}px 0px` });
    document.querySelectorAll('.dark, .site-footer').forEach((s) => io.observe(s));
  };
  watch();
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(watch, 200); });
}

/* ---------- подвал: синий, из базового варианта. Почта, под ней адрес, потом соцсети. Партнёр — подпись над логотипом ---------- */
function renderFooter(el) {
  const P = SITE.partner;
  el.innerHTML = `
  <div class="ft-grid">
    <a class="ft-name" href="index.html" aria-label="студия 505, на главную">${LOGO}</a>
    <div class="ft-col">
      <a class="ft-mail" href="mailto:${SITE.email}">${esc(SITE.email)}</a>
      <a href="${SITE.maps}" target="_blank" rel="noopener">${esc(SITE.address)}</a>
    </div>
    <div class="ft-col">
      <a class="ft-social" href="${SITE.taplink}" target="_blank" rel="noopener">Наши соцсети ↗</a>
      <a href="https://t.me/${SITE.tg}" target="_blank" rel="noopener">@${esc(SITE.tg)}</a>
      <a href="https://www.instagram.com/${SITE.insta}/" target="_blank" rel="noopener">@${esc(SITE.insta)}</a>
    </div>
    <a class="ft-partner" href="${P.site}" target="_blank" rel="noopener" aria-label="Партнёр: театр ${P.name}, сайт">
      <span>партнёр</span>
      <img src="images/akthaus.jpg" alt="" width="72" height="72" loading="lazy">
    </a>
  </div>
  <p class="ft-bottom"><span>© 2026 студия 505</span><a href="#top">наверх ↑</a></p>`;
}

/* ---------- фото ---------- */
function photoAlt(name, s) {
  if (name.startsWith('sad')) return 'Вишнёвый сад: портрет из фотосессии в цветущем саду';
  if (name.startsWith('blok')) return `Сцена из спектакля «${s?.title || 'Блок'}»`;
  if (name.startsWith('akrobaty')) return 'Репетиция спектакля «Придворные акробаты»';
  if (name === 'marin') return 'Режиссёр Александр Марин на репетиции';
  if (name.startsWith('diss')) return 'Перформанс «Диссипация»';
  if (name.startsWith('repeticiya')) return 'Репетиция студии 505';
  return 'Тренинг студии 505';
}
const isWide = (name) => name.startsWith('blok') || name === 'obshee';
/* где на снимке главное (object-position): у «Вишнёвого сада» лицо внизу кадра — поднимаем его выше */
const FOCUS = { 'sad-01': '50% 58%' };
/* thumb: лёгкая копия (images/thumbs, ~70 КБ) для ленты и миниатюр, чтобы фото появлялись сразу */
const photoTag = (name, s, lazy = true, thumb = false) => {
  const [w, h] = isWide(name) ? [1600, 1067] : [1075, 1600];
  const pos = FOCUS[name] ? ` style="object-position:${FOCUS[name]}"` : '';
  return `<img src="images/${thumb ? 'thumbs' : 'photos'}/${name}.jpg" alt="${esc(photoAlt(name, s))}" width="${w}" height="${h}"${pos}${lazy ? ' loading="lazy"' : ''} decoding="async">`;
};

/* ---------- афиша (оставляем как есть, названия жирнее) ---------- */
const WEEKDAYS = { пн: 'понедельник', вт: 'вторник', ср: 'среда', чт: 'четверг', пт: 'пятница', сб: 'суббота', вс: 'воскресенье' };
function directorOf(s) {
  return s.creators.find(([r]) => r === 'режиссёр') || s.creators.find(([r]) => r === 'идея') || null;
}
function castFor(ev) {
  const s = SHOWS[ev.show];
  if (!s || !s.rotating) return null;
  return s.cast.map(([role, ppl]) => [role, ppl[(ev.n || 0) % ppl.length]]);
}

/* «Состав» по ТЗ: кнопка «Состав ⌄» → «Скрыть ⌃», под строкой — «Действующие лица и исполнители» */
const CHEVRON = '<svg class="chev" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const castButton = (id) => `<button class="btn btn-line btn-cast" type="button" aria-expanded="false" aria-controls="${id}"><span>Состав</span>${CHEVRON}</button>`;
const castPanel = (cast, id) => `<div class="ev-cast" id="${id}" hidden>
  <p class="ev-cast-h">Действующие лица и исполнители</p>
  <dl>${cast.map(([r, p]) => `<div><dt>${esc(r)}</dt><dd>${personLink(p)}</dd></div>`).join('')}</dl>
</div>`;

function bindCast(root) {
  root.querySelectorAll('[aria-controls^="cast-"]').forEach((btn) => btn.addEventListener('click', () => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open);
    btn.querySelector('span').textContent = open ? 'Скрыть' : 'Состав';
    box.hidden = !open;
    btn.closest('.ev').classList.toggle('is-open', open);
  }));
}

function rowHTML(ev, key) {
  const s = SHOWS[ev.show];
  if (!s) return '';
  const cast = castFor(ev);
  const id = `cast-${key}`;
  const pic = s.photos?.[0];
  const dir = directorOf(s);
  return `
  <article class="ev row${pic ? '' : ' no-pic'}">
    <p class="row-when"><span class="row-date">${esc(ev.date)}</span><span class="row-time">${esc(ev.time)} <span class="row-wd">· ${esc(WEEKDAYS[ev.wd] || ev.wd)}</span></span></p>
    ${pic ? `<a class="row-pic" href="${showUrl(ev.show)}" tabindex="-1" aria-hidden="true">${photoTag(pic, s)}</a>` : ''}
    <div class="row-main">
      <h3 class="row-title"><a href="${showUrl(ev.show)}"><span>${esc(s.title)}</span></a></h3>
      ${dir ? `<p class="row-dir">${esc(dir[0])}: ${esc(dir[1].join(', '))}</p>` : ''}
      <p class="row-sub">${esc(s.sub)}</p>
      <div class="ev-actions">
        ${cast ? castButton(id) : ''}
        <a class="btn btn-blue" href="${SITE.tickets}" target="_blank" rel="noopener">Билеты</a>
      </div>
    </div>
    ${cast ? castPanel(cast, id) : ''}
  </article>`;
}

const emptyRows = (text) => `<div class="empty"><p class="body-3">${text}</p>
  <a class="btn btn-line" href="https://t.me/${SITE.tg}" target="_blank" rel="noopener">Открыть телеграм</a></div>`;

function renderAfisha(el) {
  const months = AFISHA.filter((mo) => mo.events.length);
  if (!months.length) { el.innerHTML = emptyRows('Показов пока нет. Новые даты ребята публикуют в телеграме.'); return; }
  el.innerHTML = `
    <div class="tabs" role="tablist" aria-label="Месяцы">
      ${months.map((mo, m) => `<button class="tab" type="button" role="tab" id="tab-${m}" aria-controls="month-${m}" aria-selected="${m === 0}" tabindex="${m === 0 ? 0 : -1}">${esc(mo.month)}</button>`).join('')}
    </div>
    ${months.map((mo, m) => `<div class="rows" role="tabpanel" id="month-${m}" aria-labelledby="tab-${m}"${m ? ' hidden' : ''}>
      ${mo.events.map((ev, i) => rowHTML(ev, `${m}-${i}`)).join('')}</div>`).join('')}
    <p class="note">Даты показаны для примера.</p>`;
  const tabs = [...el.querySelectorAll('.tab')];
  const select = (t, focus) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  bindCast(el);
}

/* ---------- лента спектаклей сбоку на чёрной главной: бесконечно едет вверх, на телефоне — влево.
   Останавливается под курсором и при фокусе; при «меньше движения» стоит и листается рукой ---------- */
function renderRibbon(el) {
  const items = SHOW_ORDER.map((id) => {
    const s = SHOWS[id];
    return `<a class="rb-card" href="${showUrl(id)}">
      <span class="rb-pic">${s.photos?.length ? photoTag(s.photos[0], s, false, true) : ''}</span>
      <span class="rb-title">${esc(s.title)}</span>
    </a>`;
  }).join('');
  // вторая копия только для бесшовного круга: скрыта от экранного диктора и клавиатуры
  el.innerHTML = `<div class="rb-track"><div class="rb-set">${items}</div><div class="rb-set" aria-hidden="true">${items.replace(/<a /g, '<a tabindex="-1" ')}</div></div>`;
}

/* ---------- репертуар: как у пространства «Внутри» — афиша слева, справа название, линия, режиссёр ---------- */
function renderShowsList(el) {
  el.innerHTML = SHOW_ORDER.map((id) => {
    const s = SHOWS[id];
    const dir = directorOf(s);
    return `
    <article class="rep">
      <a class="rep-pic" href="${showUrl(id)}" tabindex="-1" aria-hidden="true">${s.photos?.length ? photoTag(s.photos[0], s) : ''}</a>
      <div class="rep-info">
        <h2 class="rep-title"><a href="${showUrl(id)}">${esc(s.title)}</a></h2>
        <p class="rep-sub">${esc(s.sub)}</p>
        ${dir ? `<p class="rep-dir"><b>${esc(dir[0])}</b> ${esc(dir[1].join(', '))}</p>` : ''}
      </div>
    </article>`;
  }).join('');
}

/* ---------- страница спектакля: слева большое фото и миниатюры (нажатая встаёт на место большого),
   справа команда и авторы; ниже описание, ещё ниже актёры и ближайшие даты ---------- */
function renderShowPage(el) {
  const id = new URLSearchParams(location.search).get('id');
  const sid = SHOWS[id] ? id : SHOW_ORDER[0];
  const s = SHOWS[sid];
  document.title = `${s.title} · студия 505`;
  document.querySelector('[data-show-title]').textContent = s.title;
  const dates = AFISHA.flatMap((mo) => mo.events).filter((e) => e.show === sid);
  const pairs = (list) => list.map(([r, ppl]) =>
    `<div><dt>${esc(r)}</dt><dd>${ppl.map(personLink).join(', ')}</dd></div>`).join('');
  const photos = [...(s.photos || [])];

  el.innerHTML = `
  <section class="sp-top wrap" aria-label="Фотографии и создатели">
    <div class="sp-gallery">
      ${photos.length ? `<figure class="sp-main">${photoTag(photos[0], s, false)}</figure>` : '<div class="sp-main sp-empty"><span>Фото скоро появятся</span></div>'}
      ${photos.length > 1 ? `<ul class="sp-thumbs" aria-label="Другие фото">${photos.slice(1).map((p, i) => `
        <li><button class="sp-thumb" type="button" data-i="${i + 1}" aria-label="Показать это фото крупно">${photoTag(p, s, true, true)}</button></li>`).join('')}</ul>` : ''}
    </div>
    <div class="sp-side">
      <p class="sp-sub">${esc(s.sub)}</p>
      <h2 class="sp-k" id="team-h">команда и авторы</h2>
      <dl class="team" aria-labelledby="team-h">${pairs(s.creators)}</dl>
    </div>
  </section>

  <section class="sp-about wrap grid" aria-labelledby="about-h">
    <h2 class="heading-2" id="about-h">о спектакле</h2>
    <div class="sp-text body-3">
      ${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${s.quote ? `<blockquote><p>«${esc(s.quote.text)}»</p><footer>${personLink(s.quote.who)}</footer></blockquote>` : ''}
    </div>
    <dl class="sp-facts">
      <div><dt>продолжительность</dt><dd>${esc(s.duration)}</dd></div>
      <div><dt>где</dt><dd>${esc(SITE.address)}</dd></div>
    </dl>
  </section>

  <section class="sp-team wrap grid" aria-labelledby="cast-h">
    <h2 class="heading-2" id="cast-h">${s.ensemble ? 'участники' : 'в ролях'}</h2>
    ${s.cast ? `<dl class="roles">${pairs(s.cast)}</dl>` : ''}
    ${s.ensemble ? `<ul class="ensemble">${s.ensemble.length ? s.ensemble.map((n) => `<li>${personLink(n)}</li>`).join('') : '<li class="soft">уточняется</li>'}${s.ensembleTail ? `<li class="tail">${esc(s.ensembleTail)}</li>` : ''}</ul>` : ''}
  </section>

  <section class="sp-dates wrap" aria-labelledby="dates-h">
    <h2 class="heading-2" id="dates-h">ближайшие даты</h2>
    <div class="rows">${dates.length ? dates.map((ev, i) => rowHTML(ev, `d${i}`)).join('') : emptyRows('Новые даты скоро появятся в телеграме студии.')}</div>
    <p class="note">Даты показаны для примера.</p>
  </section>`;

  // миниатюра и большое фото меняются местами, без анимации (правка: без плавных переходов)
  const main = el.querySelector('.sp-main');
  el.querySelectorAll('.sp-thumb').forEach((btn) => btn.addEventListener('click', () => {
    const i = +btn.dataset.i;
    [photos[0], photos[i]] = [photos[i], photos[0]];
    main.innerHTML = photoTag(photos[0], s, false);
    btn.innerHTML = photoTag(photos[i], s, false, true);
  }));
  bindCast(el);
}

/* ---------- люди театра (внутри «о студии»): Марин крупно, порядок — из документа заказчика.
   В карточке — только спектакли, без ролей и должностей ---------- */
function worksOf(person) {
  return person.shows.map((sid) => {
    if (EXTRA_WORKS[sid]) return { title: EXTRA_WORKS[sid] };
    const s = SHOWS[sid];
    return s ? { title: s.title, href: showUrl(sid) } : null;
  }).filter(Boolean);
}

function renderPeople(grid, dialog) {
  grid.innerHTML = PEOPLE.map((p) => `
    <li>
      <a class="person" href="#${p.id}" data-id="${p.id}">
        <span class="ph" aria-hidden="true">${p.photo ? `<img src="${p.photo}" alt="" width="853" height="1280" loading="lazy">` : `<b>${esc(initials(p.name))}</b>`}</span>
        <span class="person-name">${esc(p.name)}</span>
      </a>
    </li>`).join('');

  const body = dialog.querySelector('.card-body');
  let opener = null;
  const open = (id) => {
    const p = PEOPLE.find((x) => x.id === id);
    if (!p) return;
    const works = worksOf(p);
    body.innerHTML = `
      <div class="card-pic ph">${p.photo ? `<img src="${p.photo}" alt="${esc(p.name)}" width="853" height="1280">` : `<b role="img" aria-label="Фото: ${esc(p.name)}">${esc(initials(p.name))}</b>`}</div>
      <div class="card-info">
        <h2 class="card-name" id="card-name">${esc(p.name)}</h2>
        ${works.length ? `<ul class="card-works" aria-label="Спектакли">${works.map((w) =>
          `<li>${w.href ? `<a href="${w.href}">${esc(w.title)}</a>` : `<span>${esc(w.title)}</span>`}</li>`).join('')}</ul>`
          : p.note ? `<p class="card-note">${esc(p.note)}</p>` : '<p class="body-3 soft">Спектакли скоро появятся.</p>'}
      </div>`;
    if (!dialog.open) dialog.showModal();
  };
  dialog.addEventListener('close', () => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    opener?.focus();
  });
  dialog.querySelector('.card-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('.person');
    if (!a) return;
    e.preventDefault();
    opener = a;
    history.replaceState(null, '', `#${a.dataset.id}`);
    open(a.dataset.id);
  });
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    opener = grid.querySelector(`[data-id="${CSS.escape(id)}"]`);
    open(id);
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}

/* ---------- карта на странице «адрес»: открытая карта OpenStreetMap в светлых тонах (без рекламы),
   в точке студии — наша синяя пульсирующая точка, как в прошлом варианте ---------- */
function renderMap(el) {
  const [lon, lat] = SITE.geo;
  if (!window.L) { el.innerHTML = `<a class="map-fallback" href="${SITE.maps}" target="_blank" rel="noopener"><span class="map-dot" aria-hidden="true"></span>${esc(SITE.address)} ↗</a>`; return; }
  const map = L.map(el, { center: [lat, lon], zoom: 16, scrollWheelZoom: false, attributionControl: true });
  // плитки OpenStreetMap; в CSS они переведены в спокойный серый, синей остаётся только точка студии
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  const dot = L.divIcon({ className: 'map-pin', html: '<span class="map-dot"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });
  L.marker([lat, lon], { icon: dot, keyboard: false, title: 'студия 505' }).addTo(map);
  map.attributionControl.setPrefix(false);
}

document.addEventListener('DOMContentLoaded', () => {
  const q = (s) => document.querySelector(s);
  // примерка шрифта заголовков: ?font=dela | rmono | jost | unbounded | rubik | onest (основной текст остаётся Jost)
  const FONTS = { dela: 'Dela+Gothic+One', rmono: 'Rubik+Mono+One', unbounded: 'Unbounded:wght@700', rubik: 'Rubik:wght@700', onest: 'Onest:wght@700', jost: '' };
  const font = new URLSearchParams(location.search).get('font');
  if (font in FONTS) {
    if (FONTS[font]) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${FONTS[font]}&display=swap">`);
    document.body.classList.add('font-try', `font-${font}`);
    // ссылки внутри сайта сохраняют выбранный шрифт, чтобы можно было походить по страницам
    document.addEventListener('click', (e) => {
      const l = e.target.closest('a[href]');
      if (!l || l.target === '_blank' || /^(https?:|mailto:|#)/.test(l.getAttribute('href'))) return;
      const u = new URL(l.href); u.searchParams.set('font', font); l.href = u.href;
    }, true);
  }
  // примерка цвета надписи на главной: ?logo=blue — фирменный синий, ?logo=light — светлый синий
  const logo = new URLSearchParams(location.search).get('logo');
  if (logo === 'blue' || logo === 'light') document.body.classList.add(`logo-${logo}`);
  if (q('[data-header]')) renderHeader(q('[data-header]'));
  if (q('[data-footer]')) renderFooter(q('[data-footer]'));
  if (q('[data-afisha]')) renderAfisha(q('[data-afisha]'));
  if (q('[data-ribbon]')) renderRibbon(q('[data-ribbon]'));
  if (q('[data-shows]')) renderShowsList(q('[data-shows]'));
  if (q('[data-show-page]')) renderShowPage(q('[data-show-page]'));
  if (q('[data-people]')) renderPeople(q('[data-people]'), q('[data-card]'));
  if (q('[data-map]')) renderMap(q('[data-map]'));
});
