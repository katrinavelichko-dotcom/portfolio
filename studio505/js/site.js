/* студия 505: разметка из данных (шапка, подвал, афиша, спектакли, люди). Движение — в motion.js. */

const NAV = [
  ['афиша', 'index.html', 'home'],
  ['спектакли', 'spektakli.html', 'shows'],
  ['о театре', 'o-teatre.html', 'about'],
  ['люди театра', 'lyudi.html', 'people'],
  ['как добраться', 'kak-dobratsya.html', 'route'],
  ['партнёры', 'partnery.html', 'partners'],
  ['контакты', 'kontakty.html', 'contacts'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const byName = () => Object.fromEntries(PEOPLE.map((p) => [p.name, p]));
const showUrl = (id) => `spektakl.html?id=${id}`;
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';

function personLink(name) {
  const p = byName()[name];
  return p ? `<a class="person-link" href="lyudi.html#${p.id}">${esc(name)}</a>` : `<span>${esc(name)}</span>`;
}

/* Инициалы по графемам (break-ui): «Ману» → «М», имя с эмодзи не ломается */
function initials(name) {
  const seg = 'Segmenter' in Intl ? new Intl.Segmenter('ru', { granularity: 'grapheme' }) : null;
  const first = (w) => (seg ? [...seg.segment(w)][0]?.segment : [...w][0]) || '';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '·';
  return (first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : '')).toUpperCase();
}

/* ---------- облака ---------- */
const CLOUDS = [
  '<circle cx="60" cy="62" r="30"/><circle cx="100" cy="45" r="38"/><circle cx="145" cy="62" r="28"/><rect x="30" y="62" width="145" height="30" rx="15"/>',
  '<circle cx="70" cy="60" r="26"/><circle cx="110" cy="48" r="32"/><rect x="44" y="60" width="110" height="26" rx="13"/>',
  '<circle cx="55" cy="64" r="24"/><circle cx="92" cy="46" r="34"/><circle cx="135" cy="58" r="30"/><circle cx="168" cy="70" r="18"/><rect x="31" y="64" width="155" height="24" rx="12"/>',
  '<circle cx="80" cy="60" r="24"/><circle cx="118" cy="56" r="28"/><rect x="56" y="60" width="90" height="24" rx="12"/>',
];
function renderClouds(el) {
  el.innerHTML = CLOUDS.map((c, i) => `<svg class="cloud c${i + 1}" viewBox="0 0 200 100" aria-hidden="true" focusable="false">${c}</svg>`).join('');
}

/* ---------- шапка ---------- */
function renderHeader(el) {
  const page = document.body.dataset.page;
  // логотипа пока нет по просьбе заказчицы: на главную ведёт пункт «афиша»
  el.innerHTML = `
  <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Открыть меню"><i></i><i></i></button>
  <nav id="nav" class="nav" aria-label="Разделы">${NAV.map(([t, h, id]) =>
    `<a href="${h}"${id === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;

  const burger = el.querySelector('.burger');
  const links = [...el.querySelectorAll('.nav a')];
  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    el.classList.toggle('is-open', open);
    if (open) el.classList.remove('on-dark', 'on-sky');
    else watch();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) window.S505Motion?.menu(links);
  };
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) { setOpen(false); burger.focus(); } });
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  matchMedia('(min-width: 1101px)').addEventListener('change', (e) => e.matches && setOpen(false));

  // над чёрным подвалом шапка прозрачная со светлым текстом, над небом первого экрана — прозрачная с тёмным, иначе бумажная
  let io;
  const watch = () => {
    io?.disconnect();
    const targets = [...document.querySelectorAll('.dark, .hero')];
    const h = el.offsetHeight;
    const hits = new Set();
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? hits.add(en.target) : hits.delete(en.target)));
      const open = el.classList.contains('is-open');
      el.classList.toggle('on-dark', !open && [...hits].some((n) => n.classList.contains('dark')));
      el.classList.toggle('on-sky', !open && [...hits].some((n) => n.classList.contains('hero') && !n.classList.contains('dark')));
    }, { rootMargin: `0px 0px -${Math.max(0, innerHeight - h)}px 0px` });
    targets.forEach((s) => io.observe(s));
  };
  watch();
  document.addEventListener('s505:ready', watch);
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(watch, 200); });
}

/* ---------- подвал ---------- */
function renderFooter(el) {
  const [user, domain] = SITE.email.split('@');
  el.innerHTML = `
  <div class="ft-top">
    <div class="ft-brand">
      <p class="ft-name">студия 505 × akthaus.</p>
      <a class="ft-partner" href="${SITE.partner.site}" target="_blank" rel="noopener">
        <img src="images/akthaus.jpg" alt="" width="48" height="48" loading="lazy">
        <span>партнёр<br>Актхаус</span>
      </a>
    </div>
    <div class="ft-col">
      <p class="ft-k">адрес</p>
      <a class="ft-v" href="${SITE.maps}" target="_blank" rel="noopener">${esc(SITE.address)}</a>
    </div>
    <div class="ft-col">
      <p class="ft-k">telegram</p>
      <a class="ft-v" href="https://t.me/${SITE.tg}" target="_blank" rel="noopener">@${SITE.tg}</a>
      <p class="ft-k">instagram</p>
      <a class="ft-v" href="https://www.instagram.com/${SITE.insta}/" target="_blank" rel="noopener">@${SITE.insta}</a>
    </div>
    <a class="ft-up" href="#top">наверх ↑</a>
  </div>
  <div class="ft-mail">
    <p class="caption-1">для коллабораций и сотрудничества</p>
    <a href="mailto:${SITE.email}"><span>${esc(user)}</span><wbr><span>@${esc(domain)}</span></a>
  </div>
  <div class="ft-bottom"><span>2026 © студия 505</span><span>независимый театральный проект · Москва</span></div>`;

  // почта — главная строка подвала: подгоняем размер так, чтобы самая длинная строка доходила до правого поля
  const mail = el.querySelector('.ft-mail a');
  const fit = () => {
    mail.style.fontSize = '';
    const spans = [...mail.querySelectorAll('span')];
    const lines = new Map();
    spans.forEach((s) => { const top = Math.round(s.getBoundingClientRect().top); lines.set(top, (lines.get(top) || 0) + s.getBoundingClientRect().width); });
    const widest = Math.max(...lines.values());
    const room = mail.clientWidth;
    if (widest > 0) mail.style.fontSize = `${Math.min(parseFloat(getComputedStyle(mail).fontSize) * (room / widest) * 0.995, 160)}px`;
  };
  fit();
  document.fonts?.ready.then(fit);
  let ft;
  addEventListener('resize', () => { clearTimeout(ft); ft = setTimeout(fit, 150); });
}

/* ---------- афиша ---------- */
function castFor(ev) {
  const s = SHOWS[ev.show];
  if (!s || !s.rotating) return null;
  return s.cast.map(([role, ppl]) => [role, ppl[(ev.n || 0) % ppl.length]]);
}

function eventHTML(ev, key) {
  const s = SHOWS[ev.show];
  if (!s) return '';
  const cast = castFor(ev);
  const id = `cast-${key}`;
  return `
  <article class="ev">
    <p class="ev-date"><span class="ev-day">${esc(ev.date)}</span><span class="ev-time">${esc(ev.time)}, ${esc(ev.wd)}</span></p>
    <div class="ev-main">
      <h3 class="ev-title"><a href="${showUrl(ev.show)}">${esc(s.title)}</a></h3>
      <p class="ev-sub">${esc(s.sub)}</p>
    </div>
    <div class="ev-actions">
      ${cast ? `<button class="btn btn-soft" type="button" aria-expanded="false" aria-controls="${id}">Состав</button>` : ''}
      <a class="btn btn-blue" href="${SITE.tickets}" target="_blank" rel="noopener">Билеты</a>
    </div>
    ${cast ? `<div class="ev-cast" id="${id}" hidden>
      <p class="ev-cast-h">Состав на ${esc(ev.date)}</p>
      <dl>${cast.map(([r, p]) => `<div><dt>${esc(r)}</dt><dd>${personLink(p)}</dd></div>`).join('')}</dl>
    </div>` : ''}
  </article>`;
}

function bindCast(root) {
  root.querySelectorAll('[aria-controls^="cast-"]').forEach((btn) => btn.addEventListener('click', () => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open);
    const label = btn.querySelector('span');
    if (label) label.textContent = open ? 'Скрыть' : 'Состав';
    else btn.textContent = open ? 'Скрыть' : 'Состав';
    box.hidden = !open;
    btn.closest('.ev').classList.toggle('is-open', open);
    // открытие: короткое появление, закрытие мгновенное (быстрый ответ системы)
    if (open) {
      box.animate(reduceMotion()
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }],
      { duration: 200, easing: ease });
    }
  }));
}

/* Фото студии (временные, от заказчицы): тренинг и репетиции. alt говорит, что на снимке. */
function photoAlt(name, s) {
  if (name.startsWith('akrobaty')) return 'Репетиция спектакля «Придворные акробаты»';
  if (name === 'marin') return 'Режиссёр Александр Марин на репетиции';
  if (name.startsWith('diss')) return 'Перформанс «Диссипация»';
  if (name.startsWith('repeticiya')) return s ? `Репетиция студии 505 (временное фото к спектаклю «${s.title}»)` : 'Репетиция студии 505';
  return s ? `Тренинг студии 505 (временное фото к спектаклю «${s.title}»)` : 'Тренинг студии 505';
}
const photoTag = (name, s, lazy = true) =>
  `<img src="images/photos/${name}.jpg" alt="${esc(photoAlt(name, s))}" width="853" height="1280"${lazy ? ' loading="lazy"' : ''} decoding="async">`;

/* Афиша списком: понятная строка на каждый показ (день недели, дата, время | название, режиссёр, описание, «Состав», «Билеты»).
   Месяцы переключаются вкладками. Обычная вертикальная прокрутка, ничего не «захватывает» страницу. */
const WEEKDAYS = { пн: 'понедельник', вт: 'вторник', ср: 'среда', чт: 'четверг', пт: 'пятница', сб: 'суббота', вс: 'воскресенье' };
function directorOf(s) {
  const d = s.creators.find(([r]) => r === 'режиссёр') || s.creators.find(([r]) => r === 'идея');
  return d ? `${d[0]}: ${d[1].join(', ')}` : '';
}

/* «Состав» по ТЗ: кнопка «Состав ⌄» → «Скрыть ⌃», под строкой — «Действующие лица и исполнители»: роль слева, имя справа */
const CHEVRON = '<svg class="chev" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const castButton = (id) => `<button class="btn btn-line btn-cast" type="button" aria-expanded="false" aria-controls="${id}"><span>Состав</span>${CHEVRON}</button>`;
const castPanel = (cast, id) => `<div class="ev-cast" id="${id}" hidden>
  <p class="ev-cast-h">Действующие лица и исполнители</p>
  <dl>${cast.map(([r, p]) => `<div><dt>${esc(r)}</dt><dd>${personLink(p)}</dd></div>`).join('')}</dl>
</div>`;

function rowHTML(ev, key) {
  const s = SHOWS[ev.show];
  if (!s) return '';
  const cast = castFor(ev);
  const id = `cast-${key}`;
  // вариант «фото наезжает»: дата слева, главное фото спектакля сдвинуто, название лежит на его нижнем краю
  const pic = s.photos?.[0];
  return `
  <article class="ev row${pic ? '' : ' no-pic'}">
    <p class="row-when"><span class="row-date">${esc(ev.date)}</span><span class="row-time">${esc(ev.time)} <span class="row-wd">· ${esc(WEEKDAYS[ev.wd] || ev.wd)}</span></span></p>
    ${pic ? `<a class="row-pic" href="${showUrl(ev.show)}" tabindex="-1" aria-hidden="true">${photoTag(pic, s)}</a>` : ''}
    <div class="row-main">
      <h3 class="row-title"><a href="${showUrl(ev.show)}"><span>${esc(s.title)}</span></a></h3>
      ${directorOf(s) ? `<p class="row-dir">${esc(directorOf(s))}</p>` : ''}
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
  <a class="btn btn-soft" href="https://t.me/${SITE.tg}" target="_blank" rel="noopener">Открыть телеграм</a></div>`;

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
    window.S505Motion?.rows(document.getElementById(t.getAttribute('aria-controls')).querySelectorAll('.row'));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    // стрелки влево/вправо по вкладкам, как в обычных вкладках (без анимации по клавиатуре)
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(n, true);
    });
  });
  bindCast(el);
}

/* Ряд спектаклей на главной: большие фото, название наезжает на нижний край фото и выходит за него.
   Листается обычной горизонтальной прокруткой, свайпом и стрелками. */
function renderShowsRow(el) {
  const track = el.querySelector('.sr-track');
  const all = AFISHA.flatMap((mo) => mo.events);
  track.innerHTML = SHOW_ORDER.map((id) => {
    const s = SHOWS[id];
    const next = all.find((e) => e.show === id);
    return `
    <a class="sr-card" href="${showUrl(id)}">
      <span class="sr-pic">${s.photos?.length ? photoTag(s.photos[0], s) : ''}</span>
      <span class="sr-title"><span>${esc(s.title)}</span></span>
      <span class="sr-sub">${esc(s.sub)}${next ? ` · ближайший показ ${esc(next.date)}` : ''}</span>
    </a>`;
  }).join('');
  const [prev, nextBtn] = el.querySelectorAll('.arrow');
  const step = () => (track.querySelector('.sr-card')?.offsetWidth || 300) + 24;
  const sync = () => {
    prev.disabled = track.scrollLeft < 4;
    nextBtn.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
  };
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: smooth }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: step(), behavior: smooth }));
  track.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
}

/* ---------- список спектаклей ---------- */
function renderShowsList(el) {
  const kinds = ['', 'ph-b', 'ph-c', 'ph-d'];
  el.innerHTML = SHOW_ORDER.map((id, i) => {
    const s = SHOWS[id];
    return `
    <a class="show-card" href="${showUrl(id)}" data-reveal>
      <span class="ph ${kinds[i % 4]}">${s.photos?.length ? photoTag(s.photos[0], s) : ''}</span>
      <span class="show-name">${esc(s.title)}</span>
      <span class="body-3 soft">${esc(s.sub)}</span>
    </a>`;
  }).join('');
}

/* ---------- страница спектакля ---------- */
function renderShowPage(el) {
  const id = new URLSearchParams(location.search).get('id');
  const sid = SHOWS[id] ? id : SHOW_ORDER[0];
  const s = SHOWS[sid];
  document.title = `${s.title} · студия 505`;
  document.querySelector('[data-show-title] > span').textContent = s.title;
  const dates = AFISHA.flatMap((mo) => mo.events).filter((e) => e.show === sid);
  const sub = s.sub.charAt(0).toUpperCase() + s.sub.slice(1);
  document.querySelector('[data-show-sub]').textContent = dates.length
    ? `${sub}. Ближайший показ ${dates[0].date} в ${dates[0].time}.`
    : `${sub}. Студия 505.`;
  const pairs = (list) => list.map(([r, ppl]) =>
    `<div><dt>${esc(r)}</dt><dd>${ppl.map(personLink).join(', ')}</dd></div>`).join('');

  el.innerHTML = `
  <div class="sp-pics wrap" aria-label="Фотографии спектакля">
    ${(s.photos || []).map((p, i) => `<div class="ph">${photoTag(p, s, i > 0)}</div>`).join('')}
  </div>

  <section class="sp-about wrap grid" aria-labelledby="about-h">
    <h2 class="heading-2" id="about-h" data-reveal>О спектакле</h2>
    <div class="sp-text body-3" data-reveal>
      ${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${s.quote ? `<blockquote><p>«${esc(s.quote.text)}»</p><footer>${personLink(s.quote.who)}</footer></blockquote>` : ''}
    </div>
    <dl class="sp-facts" data-reveal>
      <div><dt>продолжительность</dt><dd>${esc(s.duration)}</dd></div>
      <div><dt>где</dt><dd>${esc(SITE.address)}</dd></div>
    </dl>
  </section>

  <section class="sp-dates wrap" aria-labelledby="dates-h">
    <h2 class="heading-2" id="dates-h" data-reveal>Ближайшие даты</h2>
    <div class="rows">${dates.length ? dates.map((ev, i) => rowHTML(ev, `d${i}`)).join('') : emptyRows('Новые даты скоро появятся в телеграме студии.')}</div>
    <p class="note">Даты показаны для примера.</p>
  </section>

  <section class="sp-team wrap grid" aria-labelledby="team-h">
    <h2 class="heading-2" id="team-h" data-reveal>Создатели</h2>
    <dl class="roles" data-reveal>${pairs(s.creators)}</dl>
    <h2 class="heading-2 cast-h" id="cast-h" data-reveal>${s.ensemble ? 'Участники' : 'В ролях'}</h2>
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

function renderPeople(grid, dialog) {
  const [first, ...rest] = PEOPLE;
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const kinds = ['', 'ph-b', 'ph-c', 'ph-d'];
  grid.innerHTML = [first, ...rest].filter(Boolean).map((p, i) => `
    <li data-reveal>
      <a class="person" href="#${p.id}" data-id="${p.id}">
        <span class="ph ${kinds[i % 4]}" aria-hidden="true">${p.photo ? `<img src="${p.photo}" alt="" width="853" height="1280" loading="lazy">` : `<b>${esc(initials(p.name))}</b>`}</span>
        <span class="person-name">${esc(p.name)}</span>
      </a>
    </li>`).join('');

  const body = dialog.querySelector('.card-body');
  let opener = null;
  const open = (id) => {
    const p = PEOPLE.find((x) => x.id === id);
    if (!p) return;
    const works = rolesOf(p);
    body.innerHTML = `
      <div class="card-pic ph">${p.photo ? `<img src="${p.photo}" alt="${esc(p.name)}" width="853" height="1280">` : `<b role="img" aria-label="Фото: ${esc(p.name)}">${esc(initials(p.name))}</b>`}</div>
      <div class="card-info">
        <h2 class="card-name" id="card-name">${esc(p.name)}</h2>
        ${works.length ? `<ul class="card-roles">${works.map((r) => `
          <li>${r.href ? `<a href="${r.href}">${esc(r.title)}</a>` : `<span class="work">${esc(r.title)}</span>`}
          ${r.roles.length ? `<span class="roles-of">${r.roles.map(esc).join(', ')}</span>` : ''}</li>`).join('')}</ul>`
          : '<p class="body-3 soft">Спектакли скоро появятся.</p>'}
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

/* ---------- фраза слово за словом: делим на слова ---------- */
function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${esc(w)}</span>`).join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-clouds]').forEach(renderClouds);
  const h = document.querySelector('[data-header]'); if (h) renderHeader(h);
  const f = document.querySelector('[data-footer]'); if (f) renderFooter(f);
  const a = document.querySelector('[data-afisha]'); if (a) renderAfisha(a);
  const sr = document.querySelector('[data-shows-row]'); if (sr) renderShowsRow(sr);
  const sl = document.querySelector('[data-shows]'); if (sl) renderShowsList(sl);
  const sp = document.querySelector('[data-show-page]'); if (sp) renderShowPage(sp);
  const pg = document.querySelector('[data-people]'); if (pg) renderPeople(pg, document.querySelector('[data-card]'));
  document.querySelectorAll('[data-words]').forEach(splitWords);
  // шапка слушает все синие поля, включая отрисованные только что
  window.__s505ready = true;
  document.dispatchEvent(new Event('s505:ready'));
});
