/* Общие данные и разметка для трёх вариантов главной студии 505.
   Каждый вариант сам решает, как это выглядит (CSS в своём файле). */

const NAV = [
  ['афиша', '#afisha'],
  ['спектакли', '#'],
  ['о театре', '#'],
  ['люди театра', '#'],
  ['как добраться', '#'],
  ['партнёры', '#'],
  ['контакты', '#footer'],
];

const TG = 'https://t.me/theatrestudio505';

const SHOWS = {
  sad: { title: 'Вишнёвый сад', sub: 'по пьесе А. П. Чехова' },
  blok: { title: 'Блок', sub: 'пластический спектакль по произведениям А. А. Блока' },
  akro: { title: 'Придворные акробаты', sub: 'трагикомедия' },
  diss: { title: 'Диссипация', sub: 'перформанс' },
};

/* Составы на конкретную дату. Где у роли несколько исполнителей,
   берём одного по номеру показа, чтобы составы отличались. */
const CAST = {
  sad: [
    ['Лопахин', ['Геннадий Беликов']],
    ['Раневская', ['Арина Попова', 'Ольга Грехнёва', 'Любовь Стоянова', 'Светлана Тарабанова']],
    ['Гаев', ['Михаил Иванов']],
    ['Аня', ['Татьяна Шель', 'Мария Мантуровская']],
    ['Варя', ['Евгения Каверау', 'Валерия Севостьянова', 'Анна Кеслер']],
    ['Трофимов', ['Егор Плентайтис']],
    ['Симеонов-Пищик', ['Александр Алямовский']],
    ['Яша, прохожий', ['Артём Никитенко']],
    ['Дуняша', ['Екатерина Прокопьева']],
    ['Епиходов', ['Влад Мазуркевич']],
    ['Фирс', ['Сергей Болгарь']],
  ],
  akro: [
    ['Джен', ['Геннадий Беликов', 'Сергей Болгарь']],
    ['Юань, его жена', ['Светлана Тарабанова']],
    ['Лианг, их сын', ['Влад Мазуркевич']],
    ['Хэй, их сын', ['Егор Плентайтис']],
    ['Джия, их дочь', ['Ману', 'Валерия Севостьянова']],
    ['Аи, их дочь', ['Евгения Каверау', 'Арина Попова']],
    ['Юнксу, их сын', ['Артём Никитенко']],
    ['Чунтао, нюй-женщина', ['Любовь Стоянова']],
    ['Му-гун, правитель царства Цинь', ['Александр Марин']],
    ['Хуан Ли, распорядитель воли Му-гуна', ['Сергей Болгарь', 'Геннадий Беликов']],
    ['Ки, возлюбленный Аи', ['Александр Алямовский']],
  ],
};

/* Даты для примера: ребята пришлют настоящие. */
const MONTHS = [
  {
    name: 'ноябрь 2026',
    events: [
      { d: '14.11', t: '19:00', wd: 'сб', show: 'sad', n: 0 },
      { d: '15.11', t: '19:00', wd: 'вс', show: 'akro', n: 0 },
      { d: '21.11', t: '19:00', wd: 'сб', show: 'blok' },
      { d: '22.11', t: '20:00', wd: 'вс', show: 'diss' },
      { d: '28.11', t: '19:00', wd: 'сб', show: 'sad', n: 1 },
      { d: '29.11', t: '19:00', wd: 'вс', show: 'akro', n: 1 },
    ],
  },
  {
    name: 'декабрь 2026',
    events: [
      { d: '05.12', t: '19:00', wd: 'сб', show: 'blok' },
      { d: '06.12', t: '19:00', wd: 'вс', show: 'sad', n: 2 },
      { d: '12.12', t: '20:00', wd: 'сб', show: 'diss' },
      { d: '13.12', t: '19:00', wd: 'вс', show: 'akro', n: 2 },
    ],
  },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function castFor(ev) {
  const list = CAST[ev.show];
  if (!list) return null;
  return list.map(([role, people]) => [role, people[ev.n % people.length]]);
}

function eventHTML(ev, i) {
  const s = SHOWS[ev.show];
  const cast = castFor(ev);
  const id = `cast-${ev.d.replace('.', '-')}-${i}`;
  return `
  <article class="ev" data-show="${ev.show}">
    <div class="ev-date"><span class="ev-day">${ev.d}</span><span class="ev-time">${ev.t}, ${ev.wd}</span></div>
    <div class="ev-main">
      <h3 class="ev-title"><a href="#">${esc(s.title)}</a></h3>
      <p class="ev-sub">${esc(s.sub)}</p>
      <div class="ev-actions">
        <a class="btn btn-buy" href="${TG}" target="_blank" rel="noopener">Билеты</a>
        ${cast ? `<button class="btn btn-cast" type="button" aria-expanded="false" aria-controls="${id}">Состав</button>` : ''}
      </div>
    </div>
    <div class="ev-pic ph ph-${ev.show}" aria-hidden="true"><span>${esc(s.title)}</span></div>
    ${cast ? `<div class="ev-cast" id="${id}" hidden><p class="ev-cast-h">Состав на ${ev.d}</p><dl>${cast
      .map(([r, p]) => `<div><dt>${esc(r)}</dt><dd><a href="#">${esc(p)}</a></dd></div>`)
      .join('')}</dl></div>` : ''}
  </article>`;
}

function renderHeader(el) {
  el.innerHTML = `
  <a class="logo" href="#" aria-label="студия 505, на главную">студия&nbsp;505</a>
  <button class="burger" type="button" aria-expanded="false" aria-controls="nav">меню</button>
  <nav id="nav" class="nav" aria-label="Разделы">${NAV.map(([t, h]) => `<a href="${h}">${t}</a>`).join('')}</nav>`;
  const b = el.querySelector('.burger');
  b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open);
    el.classList.toggle('is-open', open);
    b.textContent = open ? 'закрыть' : 'меню';
  });
  el.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => {
    b.setAttribute('aria-expanded', 'false'); el.classList.remove('is-open'); b.textContent = 'меню';
  }));
}

function renderAfisha(el) {
  let m = 0;
  const draw = () => {
    const month = MONTHS[m];
    el.innerHTML = `
    <div class="af-head">
      <h2 class="af-month">${month.name}</h2>
      <div class="af-arrows">
        <button class="arrow" type="button" aria-label="Предыдущий месяц" ${m === 0 ? 'disabled' : ''}>←</button>
        <button class="arrow" type="button" aria-label="Следующий месяц" ${m === MONTHS.length - 1 ? 'disabled' : ''}>→</button>
      </div>
    </div>
    <div class="af-list">${month.events.map(eventHTML).join('')}</div>
    <p class="af-note">Даты на этой странице для примера.</p>`;
    const [prev, next] = el.querySelectorAll('.arrow');
    prev.addEventListener('click', () => { m = Math.max(0, m - 1); draw(); el.querySelectorAll('.arrow')[0].focus(); });
    next.addEventListener('click', () => { m = Math.min(MONTHS.length - 1, m + 1); draw(); el.querySelectorAll('.arrow')[1].focus(); });
    el.querySelectorAll('.btn-cast').forEach((btn) => btn.addEventListener('click', () => {
      const box = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open);
      btn.textContent = open ? 'Скрыть состав' : 'Состав';
      box.hidden = !open;
      btn.closest('.ev').classList.toggle('is-open', open);
    }));
    el.querySelectorAll('.ev').forEach((e, i) => e.style.setProperty('--i', i));
  };
  draw();
}

function renderFooter(el) {
  el.innerHTML = `
  <div class="ft-grid">
    <div class="ft-brand">
      <a class="logo ft-logo" href="#">студия&nbsp;505</a>
      <a class="ft-partner" href="https://akthaus.com/" target="_blank" rel="noopener">
        <span>партнёр</span>
        <img src="../images/akthaus.jpg" alt="Актхаус" width="56" height="56">
      </a>
    </div>
    <div class="ft-col">
      <p class="ft-k">для коллабораций и сотрудничества</p>
      <a class="ft-v" href="mailto:studio505.team@gmail.com">studio505.team@gmail.com</a>
      <p class="ft-k">адрес</p>
      <a class="ft-v" href="https://yandex.ru/maps/?text=Москва, Воротниковский переулок, 7 ст3" target="_blank" rel="noopener">москва, воротниковский переулок,&nbsp;7&nbsp;ст3</a>
    </div>
    <div class="ft-col">
      <p class="ft-k">telegram</p>
      <a class="ft-v" href="${TG}" target="_blank" rel="noopener">@theatrestudio505</a>
      <p class="ft-k">instagram</p>
      <a class="ft-v" href="https://www.instagram.com/505.std/" target="_blank" rel="noopener">@505.std</a>
    </div>
  </div>
  <div class="ft-bottom"><span>2026 © студия 505</span><span>независимый театральный проект</span></div>`;
}

/* Появление строк афиши и блоков при прокрутке (только если человек не просил убрать движение). */
function reveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  items.forEach((i) => io.observe(i));
}

document.addEventListener('DOMContentLoaded', () => {
  const h = document.querySelector('[data-header]'); if (h) renderHeader(h);
  const a = document.querySelector('[data-afisha]'); if (a) renderAfisha(a);
  const f = document.querySelector('[data-footer]'); if (f) renderFooter(f);
  reveal();
});
