/* студия 505 · вариант 2 «утро на сцене».
   Данные общие со старым сайтом: ../studio505/js/data.js (правишь там — меняется на обоих сайтах).
   Здесь только разметка из данных: шапка, подвал, афиша, спектакли, люди. Движение — в motion.js. */

const IMG = '../studio505/images/';
const NAV = [
  ['афиша', 'index.html', 'home'],
  ['спектакли', 'spektakli.html', 'shows'],
  ['о театре', 'o-teatre.html', 'about'],
  ['люди театра', 'lyudi.html', 'people'],
  ['как добраться', 'kak-dobratsya.html', 'route'],
  ['партнёры', 'partnery.html', 'partners'],
  ['контакты', 'kontakty.html', 'contacts'],
];
const WEEKDAYS = { пн: 'понедельник', вт: 'вторник', ср: 'среда', чт: 'четверг', пт: 'пятница', сб: 'суббота', вс: 'воскресенье' };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const showUrl = (id) => `spektakl.html?id=${id}`;
const byName = () => Object.fromEntries(PEOPLE.map((p) => [p.name, p]));
const allEvents = () => AFISHA.flatMap((mo) => mo.events.map((ev) => ({ ...ev, month: mo.month })));

function personLink(name) {
  const p = byName()[name];
  return p ? `<a class="person-link" href="lyudi.html#${p.id}">${esc(name)}</a>` : `<span>${esc(name)}</span>`;
}
function initials(name) {
  const seg = 'Segmenter' in Intl ? new Intl.Segmenter('ru', { granularity: 'grapheme' }) : null;
  const first = (w) => (seg ? [...seg.segment(w)][0]?.segment : [...w][0]) || '';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '·';
  return (first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : '')).toUpperCase();
}
function photoAlt(name, s) {
  if (name.startsWith('akrobaty')) return 'Репетиция спектакля «Придворные акробаты»';
  if (name.startsWith('diss')) return 'Перформанс «Диссипация»';
  if (name === 'marin') return 'Режиссёр Александр Марин на репетиции';
  if (name.startsWith('repeticiya')) return 'Репетиция студии 505';
  return s ? `Тренинг студии 505 (временное фото к спектаклю «${s.title}»)` : 'Тренинг студии 505';
}
const photo = (name, s, lazy = true) =>
  `<img src="${IMG}photos/${name}.jpg" alt="${esc(photoAlt(name, s))}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
function directorOf(s) {
  const d = s.creators.find(([r]) => r === 'режиссёр') || s.creators.find(([r]) => r === 'идея');
  return d ? `${d[0]}: ${d[1].join(', ')}` : '';
}
function castFor(ev) {
  const s = SHOWS[ev.show];
  if (!s || !s.rotating) return null;
  return s.cast.map(([role, ppl]) => [role, ppl[(ev.n || 0) % ppl.length]]);
}

/* ---------- шапка ---------- */
function renderHeader(el) {
  const page = document.body.dataset.page;
  el.innerHTML = `
    <a class="wordmark" href="index.html" aria-label="студия 505, на главную">студия 505</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Открыть меню"><i></i><i></i></button>
    <nav id="nav" class="nav" aria-label="Разделы">${NAV.map(([t, h, id]) =>
      `<a href="${h}"${id === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
  const burger = el.querySelector('.burger');
  const nav = el.querySelector('.nav');
  const set = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.documentElement.classList.toggle('menu-open', open);
    if (open) window.S505Motion?.menu(nav.querySelectorAll('a'));
  };
  burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  // шапка на светлой плашке, как только страница уехала с верха
  const onScroll = () => el.classList.toggle('is-solid', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- подвал (по брифу, как у Озера): наш знак, логотип партнёра со ссылкой, почта, адрес, tg и insta ---------- */
function renderFooter(el) {
  const P = SITE.partner;
  el.innerHTML = `
    <div class="ft-grid">
      <a class="ft-name" href="index.html">студия 505</a>
      <a class="ft-partner" href="${P.site}" target="_blank" rel="noopener" aria-label="${P.name}, сайт партнёра">
        <img src="${IMG}akthaus.jpg" alt="" width="72" height="72" loading="lazy"><span>партнёр<br>${P.name}</span></a>
      <div class="ft-col"><p class="ft-k">для коллабораций и сотрудничества</p><a class="ft-mail" href="mailto:${SITE.email}">${SITE.email}</a></div>
      <div class="ft-col"><p class="ft-k">адрес</p><a href="${SITE.maps}" target="_blank" rel="noopener">${esc(SITE.address)}</a></div>
      <div class="ft-col"><p class="ft-k">соцсети</p>
        <a href="https://t.me/${SITE.tg}" target="_blank" rel="noopener">telegram @${SITE.tg}</a>
        <a href="https://www.instagram.com/${SITE.insta}/" target="_blank" rel="noopener">instagram @${SITE.insta}</a></div>
    </div>
    <p class="ft-bottom"><span>© студия 505</span><a href="#top">наверх ↑</a></p>`;
}

/* ---------- афиша ---------- */
const CHEVRON = '<svg class="chev" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const castButton = (id) => `<button class="btn btn-line btn-cast" type="button" aria-expanded="false" aria-controls="${id}"><span>Состав</span>${CHEVRON}</button>`;
const ticket = `<a class="btn btn-blue" href="${SITE.tickets}" target="_blank" rel="noopener">Билеты</a>`;

function rowHTML(ev, key) {
  const s = SHOWS[ev.show];
  if (!s) return '';
  const cast = castFor(ev);
  const id = `cast-${key}`;
  const pic = s.photos?.[0];
  return `
  <article class="ev${pic ? '' : ' no-pic'}">
    <p class="ev-when"><span class="ev-date">${esc(ev.date)}</span><span class="ev-time">${esc(ev.time)} · ${esc(WEEKDAYS[ev.wd] || ev.wd)}</span></p>
    <div class="ev-main">
      <h3 class="ev-title"><a href="${showUrl(ev.show)}">${esc(s.title)}</a></h3>
      ${directorOf(s) ? `<p class="ev-dir">${esc(directorOf(s))}</p>` : ''}
      <p class="ev-sub">${esc(s.sub)}</p>
      <div class="ev-actions">${cast ? castButton(id) : ''}${ticket}</div>
    </div>
    ${pic ? `<a class="ev-pic" href="${showUrl(ev.show)}" tabindex="-1" aria-hidden="true">${photo(pic, s)}</a>` : ''}
    ${cast ? `<div class="ev-cast" id="${id}" hidden>
      <p class="ev-cast-h">Действующие лица и исполнители</p>
      <dl>${cast.map(([r, p]) => `<div><dt>${esc(r)}</dt><dd>${personLink(p)}</dd></div>`).join('')}</dl>
    </div>` : ''}
  </article>`;
}

function bindCast(root) {
  root.querySelectorAll('.btn-cast').forEach((btn) => btn.addEventListener('click', () => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open);
    btn.querySelector('span').textContent = open ? 'Скрыть' : 'Состав';
    box.hidden = !open;
    // открытие: короткое появление; закрытие мгновенное
    if (open) box.animate(reduceMotion() ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE });
  }));
}

const empty = (text) => `<div class="empty"><p>${text}</p><a class="btn btn-line" href="https://t.me/${SITE.tg}" target="_blank" rel="noopener">Открыть телеграм</a></div>`;

function renderAfisha(el) {
  const months = AFISHA.filter((mo) => mo.events.length);
  if (!months.length) { el.innerHTML = empty('Показов пока нет. Новые даты ребята публикуют в телеграме.'); return; }
  el.innerHTML = `
    <div class="tabs" role="tablist" aria-label="Месяцы">
      ${months.map((mo, m) => `<button class="tab" type="button" role="tab" id="tab-${m}" aria-controls="month-${m}" aria-selected="${m === 0}" tabindex="${m === 0 ? 0 : -1}">${esc(mo.month)}</button>`).join('')}
    </div>
    ${months.map((mo, m) => `<div class="evs" role="tabpanel" id="month-${m}" aria-labelledby="tab-${m}"${m ? ' hidden' : ''}>
      ${mo.events.map((ev, i) => rowHTML(ev, `${m}-${i}`)).join('')}</div>`).join('')}
    <p class="note">Даты показаны для примера.</p>`;
  const tabs = [...el.querySelectorAll('.tab')];
  const select = (t, focus) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    if (focus) t.focus();
    else window.S505Motion?.rows(document.getElementById(t.getAttribute('aria-controls')).querySelectorAll('.ev'));
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

/* первый экран: четыре ближайших показа колонкой */
function renderNext(el) {
  const evs = allEvents().slice(0, 4);
  if (!evs.length) { el.innerHTML = `<p class="next-empty">Новые даты скоро появятся в телеграме студии.</p>`; return; }
  el.innerHTML = `<ul class="next-list">${evs.map((ev) => {
    const s = SHOWS[ev.show];
    if (!s) return '';
    return `<li><a href="${showUrl(ev.show)}"><span class="next-d">${esc(ev.date)}</span>
      <span class="next-m"><span class="next-t">${esc(s.title)}</span><small>${esc(ev.wd)} · ${esc(ev.time)} · ${esc(directorOf(s))}</small></span></a></li>`;
  }).join('')}</ul>
  <a class="next-all" href="#afisha">вся афиша →</a>`;
}

/* ---------- спектакли ---------- */
function renderShows(el) {
  el.innerHTML = SHOW_ORDER.map((id) => {
    const s = SHOWS[id];
    return `<a class="show" href="${showUrl(id)}" data-reveal>
      <span class="show-pic">${s.photos?.length ? photo(s.photos[0], s) : ''}</span>
      <span class="show-title">${esc(s.title)}</span>
      <span class="show-sub">${esc(s.sub)}</span>
    </a>`;
  }).join('');
}

const pairs = (list) => list.map(([r, ppl]) => `<div><dt>${esc(r)}</dt><dd>${ppl.map(personLink).join(', ')}</dd></div>`).join('');

function renderShowPage(el) {
  const id = new URLSearchParams(location.search).get('id');
  const s = SHOWS[id];
  if (!s) {
    el.innerHTML = `<section class="page-head wrap"><h1 class="page-title">спектакль не найден</h1><p class="lead"><a class="link" href="spektakli.html">Все спектакли →</a></p></section>`;
    return;
  }
  document.title = `${s.title} · студия 505`;
  const dates = allEvents().filter((ev) => ev.show === id);
  const [main, ...extra] = s.photos || [];
  el.innerHTML = `
  <section class="sp-head wrap">
    <p class="crumbs"><a href="spektakli.html">спектакли</a></p>
    <h1 class="sp-title">${esc(s.title)}</h1>
    <p class="lead">${esc(s.sub)}</p>
  </section>
  ${main ? `<figure class="sp-main wrap">${photo(main, s, false)}</figure>` : ''}
  ${extra.length ? `<div class="sp-pics wrap" aria-label="Фотографии спектакля">${extra.map((p) => `<figure>${photo(p, s)}</figure>`).join('')}</div>` : ''}
  <section class="sp-about wrap" aria-labelledby="about-h">
    <h2 class="h2" id="about-h" data-reveal>о спектакле</h2>
    <div class="sp-text" data-reveal>${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${s.quote ? `<blockquote><p>«${esc(s.quote.text)}»</p><footer>${esc(s.quote.who)}</footer></blockquote>` : ''}</div>
    <dl class="sp-facts" data-reveal><div><dt>продолжительность</dt><dd>${esc(s.duration)}</dd></div><div><dt>где</dt><dd>${esc(SITE.address)}</dd></div></dl>
  </section>
  <section class="sp-dates wrap" aria-labelledby="dates-h">
    <h2 class="h2" id="dates-h" data-reveal>ближайшие даты</h2>
    <div class="evs">${dates.length ? dates.map((ev, i) => rowHTML(ev, `d${i}`)).join('') : empty('Новые даты скоро появятся в телеграме студии.')}</div>
    ${dates.length ? '<p class="note">Даты показаны для примера.</p>' : ''}
  </section>
  <section class="sp-team wrap" aria-labelledby="team-h">
    <h2 class="h2" id="team-h" data-reveal>создатели</h2>
    <dl class="roles" data-reveal>${pairs(s.creators)}</dl>
    <h2 class="h2" id="cast-h" data-reveal>${s.ensemble ? 'участники' : 'в ролях'}</h2>
    ${s.cast ? `<dl class="roles" data-reveal>${pairs(s.cast)}</dl>` : ''}
    ${s.ensemble ? `<ul class="ensemble" data-reveal>${s.ensemble.length ? s.ensemble.map((n) => `<li>${personLink(n)}</li>`).join('') : '<li class="soft">уточняется</li>'}${s.ensembleTail ? `<li class="tail">${esc(s.ensembleTail)}</li>` : ''}</ul>` : ''}
  </section>`;
  bindCast(el);
}

/* ---------- люди театра ---------- */
const singular = { 'художники по костюмам': 'художник по костюмам' };
function rolesOf(person) {
  return person.shows.map((sid) => {
    if (EXTRA_WORKS[sid]) return { title: EXTRA_WORKS[sid], roles: [] };
    const s = SHOWS[sid];
    if (!s) return null;
    const roles = [];
    s.creators.forEach(([r, ppl]) => ppl.includes(person.name) && roles.push(singular[r] || r));
    (s.cast || []).forEach(([r, ppl]) => ppl.includes(person.name) && roles.push(r));
    return { title: s.title, href: showUrl(sid), roles };
  }).filter(Boolean);
}
const face = (p, big) => p.photo
  ? `<img src="${IMG}${p.photo.replace(/^images\//, '')}" alt="${big ? esc(p.name) : ''}"${big ? '' : ' loading="lazy"'}>`
  : `<b${big ? ` role="img" aria-label="Фото: ${esc(p.name)}"` : ''}>${esc(initials(p.name))}</b>`;

function renderPeople(grid, dialog) {
  // Марин первый, остальные в случайном порядке (бриф)
  const [first, ...rest] = PEOPLE;
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  grid.innerHTML = [first, ...rest].filter(Boolean).map((p) => `
    <li data-reveal><a class="person" href="#${p.id}" data-id="${p.id}">
      <span class="person-pic" aria-hidden="true">${face(p)}</span>
      <span class="person-name">${esc(p.name)}</span></a></li>`).join('');

  const body = dialog.querySelector('.card-body');
  let opener = null;
  const open = (id) => {
    const p = PEOPLE.find((x) => x.id === id);
    if (!p) return;
    const works = rolesOf(p);
    body.innerHTML = `
      <div class="card-pic">${face(p, true)}</div>
      <h2 class="card-name" id="card-name">${esc(p.name)}</h2>
      ${works.length ? `<ul class="card-roles">${works.map((r) => `<li>${r.href ? `<a href="${r.href}">${esc(r.title)}</a>` : `<span>${esc(r.title)}</span>`}${r.roles.length ? `<small>${r.roles.map(esc).join(', ')}</small>` : ''}</li>`).join('')}</ul>`
        : '<p class="soft">Спектакли скоро появятся.</p>'}`;
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

document.addEventListener('DOMContentLoaded', () => {
  const q = (s) => document.querySelector(s);
  if (q('[data-header]')) renderHeader(q('[data-header]'));
  if (q('[data-footer]')) renderFooter(q('[data-footer]'));
  if (q('[data-next]')) renderNext(q('[data-next]'));
  if (q('[data-afisha]')) renderAfisha(q('[data-afisha]'));
  if (q('[data-shows]')) renderShows(q('[data-shows]'));
  if (q('[data-show-page]')) renderShowPage(q('[data-show-page]'));
  if (q('[data-people]')) renderPeople(q('[data-people]'), q('[data-card]'));
  document.querySelectorAll('[data-text]').forEach((n) => { n.textContent = SITE[n.dataset.text] ?? ''; });
  window.__s505ready = true;
  document.dispatchEvent(new Event('s505:ready'));
});
