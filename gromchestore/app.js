// Общее для всех страниц: шапка, подвал, громкость, избранное, корзина
import { GENDERS, MENU, PRODUCTS, SIZES, STORE, byId, catName, rub } from './data.js';
import { popCart, startMotion } from './motion.js';
import './typo.js';

export const $ = s => document.querySelector(s);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const drop = k => { try { localStorage.removeItem(k); } catch {} };

/* Демо аккаунты: всё хранится только в этом браузере, у каждого пользователя свои данные */
// Тестовый режим: вход с любыми данными. Поставь false, чтобы вернуть проверку пароля
export const TEST_LOGIN = true;
const normMail = s => s.trim().toLowerCase();
export const currentUser = () => {
  const mail = read('gromche-session', null);
  const u = mail && read('gromche-users', {})[mail];
  return u ? { mail, name: u.name } : null;
};
const scoped = k => { const u = currentUser(); return u ? `gromche-${k}:${u.mail}` : `gromche-${k}`; };

async function hash(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const out = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(out)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Вещи, выбранные до входа, переходят в аккаунт
function mergeGuest(mail) {
  const merge = (k, join) => {
    const guest = read(`gromche-${k}`, []);
    write(`gromche-${k}:${mail}`, join(read(`gromche-${k}:${mail}`, []), guest));
    drop(`gromche-${k}`);
  };
  merge('favs', (a, b) => [...new Set([...a, ...b])]);
  merge('cart', (a, b) => {
    const all = a.map(l => ({ ...l }));
    b.forEach(l => {
      const same = all.find(x => x.id === l.id && x.size === l.size);
      same ? same.qty += l.qty : all.push({ ...l });
    });
    return all;
  });
}
export async function register(name, email, password) {
  const mail = normMail(email), users = read('gromche-users', {});
  if (users[mail]) return 'Такая почта уже зарегистрирована. Попробуйте войти.';
  const salt = crypto.randomUUID();
  users[mail] = { name: name.trim(), salt, hash: await hash(password, salt) };
  write('gromche-users', users);
  mergeGuest(mail);
  write('gromche-session', mail);
  return '';
}
export async function login(email, password) {
  const mail = normMail(email), user = read('gromche-users', {})[mail];
  if (TEST_LOGIN) {
    if (!user) {
      const users = read('gromche-users', {}), salt = crypto.randomUUID();
      users[mail] = { name: email.trim().split('@')[0], salt, hash: await hash(password, salt) };
      write('gromche-users', users);
    }
    mergeGuest(mail);
    write('gromche-session', mail);
    return '';
  }
  if (!user || user.hash !== await hash(password, user.salt)) return 'Неверная почта или пароль.';
  mergeGuest(mail);
  write('gromche-session', mail);
  return '';
}
export function logout() { drop('gromche-session'); }
export const getOrders = () => read(scoped('orders'), []);

/* Громкость: буквы и двое на первом экране. Фон и фото товаров не меняются */
export const LEVELS = [
  { to: 25, shelf: 35, pick: 'базовые вещи', name: 'Тихо', ground: '#F5F2EC', tile: '#E9E4DA', ink: '#16161A', hint: 'Тихо. База на каждый день: спокойный крой и один цвет.' },
  { to: 50, shelf: 60, pick: 'вещи с акцентом', name: 'Негромко', ground: '#F2EDE3', tile: '#E6DFD2', ink: '#16161A', hint: 'Негромко. Один акцент: шарф, носки или сумка.' },
  { to: 75, shelf: 80, pick: 'смелые вещи', name: 'Заметно', ground: '#EEE6D8', tile: '#E2D8C6', ink: '#5E1D29', hint: 'Заметно. Горошек рядом с полоской, цвета спорят сдержанно.' },
  { to: 101, shelf: 101, pick: 'яркие вещи', name: 'Громко', ground: '#EADFCD', tile: '#DED0B9', ink: '#7D1E2D', hint: 'Громко. Весь образ собран из акцентов.' },
];
export const getVolume = () => read('gromche-volume', 35);
export function setVolume(n) {
  write('gromche-volume', n);
  document.dispatchEvent(new CustomEvent('volume', { detail: n / 100 }));
  return applyVolume(n);
}
function applyVolume(n) {
  const lvl = LEVELS.find(l => n < l.to), s = document.documentElement.style;
  s.setProperty('--sat', (0.35 + (n / 100) * 0.6).toFixed(2));
  return lvl;
}
applyVolume(getVolume());

/* Шапка и подвал */
const svg = d => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="${d}"/></svg>`;
const ICONS = {
  search: svg('M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8'),
  heart: svg('M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z'),
  bag: svg('M5 8h14l1 12H4zM9 8V7a3 3 0 0 1 6 0v1'),
  up: svg('M12 20V4M6 10l6-6 6 6'),
  user: svg('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1-4 4-6 7-6s6 2 7 6'),
};
function setBadge(el, n) {
  el.textContent = n;
  el.hidden = !n;
}
const sectionLinks = g => MENU[g].map(c => `<a href="catalog.html?g=${g}&cat=${c}">${catName(c, g)}</a>`).join('');

function renderChrome() {
  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip" href="#main">Перейти к содержанию</a>
    <header class="site-header">
      <div class="bar">
        <a class="logo" href="index.html" aria-label="ГРОМЧЕ, на главную">ГРОМЧЕ</a>
        <nav class="main-nav" aria-label="Основное меню">
          <div class="has-mega">
            <a class="nav-catalog" href="catalog.html">Каталог</a>
            <div class="mega">
              <a class="mega-all" href="catalog.html">Смотреть всё</a>
              ${Object.entries(GENDERS).map(([g, t]) => `
                <div class="has-mega has-sub">
                  <a href="catalog.html?g=${g}">${t}</a>
                  <div class="mega"><a class="mega-all" href="catalog.html?g=${g}">Смотреть всё</a>${sectionLinks(g)}</div>
                </div>`).join('')}
            </div>
          </div>
          <a href="catalog.html?new=1">Новинки</a>
          <div class="has-mega">
            <a class="sale-link" href="catalog.html?sale=1">Распродажа</a>
            <div class="mega"><a class="mega-all" href="catalog.html?sale=1">Смотреть всё</a><a href="catalog.html?sale=1&g=women">Женское</a><a href="catalog.html?sale=1&g=men">Мужское</a></div>
          </div>
          <a href="help.html#faq">Вопросы и ответы</a>
        </nav>
        <div class="actions">
          <form class="search" id="searchBox" action="catalog.html" role="search">
            <input id="q" name="q" type="search" placeholder="Поиск" aria-label="Поиск по каталогу">
            <button class="icon-btn" type="submit" aria-label="Найти">${ICONS.search}</button>
          </form>
          <button class="icon-btn search-toggle" type="button" id="searchOpen" aria-label="Открыть поиск" aria-expanded="false" aria-controls="searchBox">${ICONS.search}</button>
          <a class="icon-btn" href="profile.html" aria-label="${currentUser() ? 'Профиль' : 'Войти'}">${ICONS.user}${currentUser() ? '<span class="dot"></span>' : ''}</a>
          <a class="icon-btn" href="favorites.html" aria-label="Избранное">${ICONS.heart}<span class="badge" id="favCount" hidden></span></a>
          <button class="icon-btn" type="button" id="cartOpen" aria-label="Корзина" aria-haspopup="dialog">${ICONS.bag}<span class="badge" id="cartCount" hidden></span></button>
        </div>
        <button class="burger" id="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span></button>
      </div>
    </header>
    <div class="mobile-menu" id="mobileMenu" hidden>
      <details><summary class="nav-catalog">Каталог</summary>
        <a href="catalog.html">Смотреть всё</a>
        ${Object.entries(GENDERS).map(([g, t]) => `<details class="sub"><summary>${t}</summary><a href="catalog.html?g=${g}">Смотреть всё</a>${sectionLinks(g)}</details>`).join('')}
      </details>
      <a href="catalog.html?new=1">Новинки</a>
      <details><summary class="sale-link">Распродажа</summary><a href="catalog.html?sale=1">Смотреть всё</a><a href="catalog.html?sale=1&g=women">Женское</a><a href="catalog.html?sale=1&g=men">Мужское</a></details>
      <a href="profile.html">${currentUser() ? 'Профиль' : 'Вход и регистрация'}</a>
      <a href="favorites.html">Избранное</a>
      <a href="help.html#faq">Вопросы и ответы</a>
      <a href="help.html">Покупателям</a>
    </div>`);
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site-footer">
      <div class="grid12">
        <nav class="f-col" aria-label="Каталог"><h2>Каталог</h2>
          <a href="catalog.html?g=women">Женское</a><a href="catalog.html?g=men">Мужское</a><a href="catalog.html?new=1">Новинки</a>
          <a class="sale-link" href="catalog.html?sale=1">Распродажа</a>
        </nav>
        <nav class="f-col" aria-label="Покупателям"><h2>Покупателям</h2>
          <a href="help.html#faq">Вопросы и ответы</a><a href="help.html#delivery">Доставка</a><a href="help.html#payment">Оплата</a><a href="help.html#returns">Возврат</a>
        </nav>
        <nav class="f-col" aria-label="О компании"><h2>О компании</h2>
          <a href="company.html#about">О нас</a><a href="company.html#gift">Подарочные карты</a><a href="help.html#contacts">Адрес и контакты</a>
        </nav>
        <div class="f-col"><h2>Магазин</h2>
          <p>${STORE.address}</p><p>${STORE.hours}</p><p>${STORE.phone}</p><p>${STORE.email}</p>
          <div class="socials"><button type="button" data-demo="Telegram">Telegram</button><button type="button" data-demo="ВКонтакте">ВКонтакте</button></div>
          <a class="btn btn-light" href="help.html#ask">Задать вопрос</a>
        </div>
      </div>
      <div class="f-legal">
        <p>Демонстрационный проект для портфолио. Бренд, адрес и цены вымышлены, заказы не обрабатываются. Фото сгенерированы нейросетью.</p>
        <p><a href="privacy.html">Политика конфиденциальности</a> <a href="terms.html">Условия</a></p>
      </div>
      <p class="footer-word" aria-hidden="true">ГРОМЧЕ</p>
    </footer>
    <button class="to-top" id="toTop" type="button" aria-label="Наверх">${ICONS.up}</button>
    <div class="notice" id="notice" hidden><p>Сайт хранит корзину и избранное только в вашем браузере.</p><button class="btn" id="noticeOk" type="button">Понятно</button></div>
    <dialog class="drawer" id="cart" aria-labelledby="cartTitle">
      <div class="drawer-head"><h2 id="cartTitle">Корзина</h2><button class="close" type="button" data-close aria-label="Закрыть"><span></span><span></span></button></div>
      <div class="drawer-body" id="cartBody"></div>
    </dialog>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.demo}: на реальном сайте здесь будет ссылка`)));

  const up = $('#toTop');
  up.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  addEventListener('scroll', () => up.classList.toggle('show', scrollY > 800), { passive: true });

  if (!read('gromche-notice', false)) $('#notice').hidden = false;
  $('#noticeOk').addEventListener('click', () => { write('gromche-notice', true); $('#notice').hidden = true; });

  // В меню подсвечивается только страница, на которой находишься
  const here = new URLSearchParams(location.search), page = location.pathname.split('/').pop();
  const key = page !== 'catalog.html' ? null : here.has('sale') ? 'sale=1' : here.has('new') ? 'new=1' : 'catalog';
  document.querySelectorAll('.main-nav a').forEach(a => {
    const q = a.getAttribute('href').split('?')[1];
    const direct = a.closest('.mega') ? false : key === 'catalog' ? !q && a.classList.contains('nav-catalog') : key && q === key;
    if (direct) a.setAttribute('aria-current', 'page');
  });

  const burger = $('#burger'), menu = $('#mobileMenu');
  burger.addEventListener('click', () => {
    const show = menu.hidden;
    menu.hidden = !show;
    burger.setAttribute('aria-expanded', show);
    burger.setAttribute('aria-label', show ? 'Закрыть меню' : 'Открыть меню');
    document.documentElement.classList.toggle('lock', show);
  });
  const sOpen = $('#searchOpen'), sBox = $('#searchBox');
  sOpen.addEventListener('click', () => {
    const open = sBox.classList.toggle('open');
    sOpen.setAttribute('aria-expanded', open);
    if (open) $('#q').focus();
  });
}

/* Избранное */
let favs = read(scoped('favs'), []);
export const isFav = id => favs.includes(id);
export function toggleFav(id) {
  favs = isFav(id) ? favs.filter(x => x !== id) : [...favs, id];
  write(scoped('favs'), favs);
  setBadge($('#favCount'), favs.length);
  return isFav(id);
}
export const getFavs = () => favs;

export const HEART = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/></svg>';

/* Быстрая покупка: размеры появляются при наведении, на телефоне их нет */
const quick = p => `<div class="quick">${p.oneSize
  ? `<button type="button" data-quick="${p.id}" data-size="Один размер">В корзину</button>`
  : SIZES.map(s => `<button type="button" data-quick="${p.id}" data-size="${s}" aria-label="В корзину, размер ${s}"${p.sizes.includes(s) ? '' : ' disabled'}>${s}</button>`).join('')}</div>`;

/* Карточка в сетке: занимает 3 колонки из 12 */
export const card = p => `
  <article class="card">
    <div class="card-media"><a href="product.html?id=${p.id}"><div class="tile">${p.sale ? `<span class="sale-tag">−${p.sale}%</span>` : ''}<img src="images/${p.img}.jpg" alt="${p.alt}" width="900" height="1125" loading="lazy"></div></a>${quick(p)}<button class="to-cart" type="button" data-to-cart="${p.id}" aria-pressed="${inCart(p.id) > 0}" aria-label="${cartLabel(p.id)}">${ICONS.bag}<span class="badge"${inCart(p.id) ? '' : ' hidden'}>${inCart(p.id)}</span></button></div>
    <button class="fav" type="button" data-fav="${p.id}" aria-pressed="${isFav(p.id)}" aria-label="В избранное">${HEART}</button>
    <div class="card-foot"><div><h3><a href="product.html?id=${p.id}">${p.title}</a></h3>
    <p>${p.sale ? `<s>${rub(p.oldPrice)}</s> <span class="sale-price">${rub(p.price)}</span>` : rub(p.price)}</p></div></div>
  </article>`;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fav]');
  if (!b) return;
  const on = toggleFav(b.dataset.fav);
  b.setAttribute('aria-pressed', on);
  document.dispatchEvent(new CustomEvent('favs'));
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-quick]');
  if (b) { addToCart(b.dataset.quick, b.dataset.size); b.closest('.quick').classList.remove('open'); return; }
  // Значок корзины: вещь одного размера сразу в корзину, для остальных открываем размеры
  const t = e.target.closest('[data-to-cart]');
  document.querySelectorAll('.quick.open').forEach(q => { if (!t || q.closest('.card') !== t.closest('.card')) q.classList.remove('open'); });
  if (!t) return;
  if (byId(t.dataset.toCart).oneSize) addToCart(t.dataset.toCart, 'Один размер');
  else t.closest('.card').querySelector('.quick').classList.toggle('open');
});

/* Корзина */
const DELIVERY = 390, FREE_FROM = 10000;
let cart = read(scoped('cart'), []).filter(l => byId(l.id)), placed = null;
export const getCart = () => cart;
// Сколько штук этой вещи в корзине, во всех размерах
export const inCart = id => cart.filter(l => l.id === id).reduce((n, l) => n + l.qty, 0);
const cartLabel = id => inCart(id) ? `В корзине: ${inCart(id)} шт. Добавить ещё` : 'Добавить в корзину';

function saveCart() {
  write(scoped('cart'), cart);
  setBadge($('#cartCount'), cart.reduce((n, l) => n + l.qty, 0));
  document.querySelectorAll('[data-to-cart]').forEach(b => {
    const n = inCart(b.dataset.toCart);
    b.setAttribute('aria-pressed', n > 0);
    b.setAttribute('aria-label', cartLabel(b.dataset.toCart));
    setBadge(b.querySelector('.badge'), n);
  });
  document.dispatchEvent(new CustomEvent('cart'));
}
export function addToCart(id, size) {
  const line = cart.find(l => l.id === id && l.size === size);
  line ? line.qty++ : cart.push({ id, size, qty: 1 });
  saveCart();
  popCart();
  toast(`${byId(id).title}, ${size}, в корзине`);
}
export const cartQty = (id, size) => cart.find(l => l.id === id && l.size === size)?.qty || 0;
export function changeQty(id, size, d) {
  const line = cart.find(l => l.id === id && l.size === size);
  if (!line) return;
  line.qty += d;
  if (line.qty < 1) cart.splice(cart.indexOf(line), 1);
  saveCart();
  popCart();
}
const esc = s => s.trim().replace(/[<>&"]/g, '');
// Ближайшие пять дней, начиная с завтрашнего
const days = () => Array.from({ length: 5 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1);
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
});
// Невидимые связки не дают разорвать время по тире
export const SLOTS = ['10:00⁠–⁠14:00', '14:00⁠–⁠18:00', '18:00⁠–⁠22:00'];
export const sizeLabel = s => s === 'Один размер' ? s : `Размер ${s}`;
const emptyView = (title, text, extra = '') => `<div class="empty"><h3>${title}</h3><p>${text}</p><a class="btn" href="catalog.html?new=1">Перейти в каталог</a>${extra}</div>`;
// В пустой корзине показываем новинки: две женские и одну мужскую
function picks() {
  const fresh = g => PRODUCTS.filter(p => p.fresh && p.g === g);
  const list = [fresh('women')[0], fresh('men')[0], fresh('women')[1]];
  return `<div class="picks"><h3>Новинки</h3><div class="picks-row">${list.map(p => `<a class="pick" href="product.html?id=${p.id}"><div class="tile"><img src="images/${p.img}.jpg" alt="${p.alt}" width="900" height="1125" loading="lazy"></div><span>${p.title}</span><strong>${rub(p.price)}</strong></a>`).join('')}</div></div>`;
}

function renderCart() {
  const body = $('#cartBody');
  if (cart.length) placed = null;
  if (placed) { body.innerHTML = emptyView(`Демо заказ ${placed.no} оформлен`, `${placed.name}, спасибо! Доставка: ${placed.day}, ${placed.time}. Адрес: ${placed.address}. Курьер позвонит за час. Это демонстрация: деньги не списаны, данные никуда не отправлены.`); return; }
  if (!cart.length) { body.innerHTML = emptyView('Пока пусто', 'Здесь появятся вещи, которые вы выберете.', picks()); return; }
  const sum = cart.reduce((n, l) => n + byId(l.id).price * l.qty, 0), ship = sum >= FREE_FROM ? 0 : DELIVERY;
  const left = FREE_FROM - sum;
  body.innerHTML = `<div class="ship"><p>${left > 0 ? `До бесплатной доставки осталось ${rub(left)}` : 'Доставка будет бесплатной'}</p><div class="ship-bar" aria-hidden="true"><span style="width:${Math.min(sum / FREE_FROM * 100, 100)}%"></span></div></div>` + cart.map((l, i) => {
    const p = byId(l.id);
    return `<div class="line">
      <div class="tile"><img src="images/${p.img}.jpg" alt="${p.alt}" width="900" height="1125"></div>
      <div class="line-text"><a href="product.html?id=${p.id}">${p.title}</a><span class="small">${sizeLabel(l.size)}</span>
        <div class="qty"><div>
          <button type="button" data-qty="${i}" data-d="-1" aria-label="Убрать одну штуку">−</button><span>${l.qty}</span>
          <button type="button" data-qty="${i}" data-d="1" aria-label="Добавить одну штуку">+</button>
        </div><strong>${rub(p.price * l.qty)}</strong></div>
      </div></div>`;
  }).join('') + `
    <div class="total"><span>Доставка</span><span>${ship ? rub(ship) : 'Бесплатно'}</span></div>
    <div class="total"><span>Итого</span><span>${rub(sum + ship)}</span></div>
    <form class="form" id="orderForm" novalidate>
      <div class="field"><label for="fName">Имя</label><input id="fName" name="name" autocomplete="name" required><p class="error" hidden></p></div>
      <div class="field"><label for="fPhone">Телефон</label><input id="fPhone" name="phone" type="tel" autocomplete="tel" required><p class="error" hidden></p></div>
      <div class="field"><label for="fEmail">Почта</label><input id="fEmail" name="email" type="email" autocomplete="email" required><p class="error" hidden></p></div>
      <h3>Доставка</h3>
      <p class="small">Курьер по Москве. Можно примерить вещи 15 минут и оплатить только то, что подошло.</p>
      <div class="field"><label for="fAddress">Адрес: улица, дом, квартира</label><input id="fAddress" name="address" autocomplete="street-address" required><p class="error" hidden></p></div>
      <div class="field"><label for="fDay">День</label><select id="fDay" name="day">${days().map(d => `<option>${d}</option>`).join('')}</select></div>
      <div class="field"><label for="fTime">Время</label><select id="fTime" name="time">${SLOTS.map(s => `<option>${s}</option>`).join('')}</select></div>
      <div class="field"><label for="fNote">Комментарий для курьера</label><textarea id="fNote" name="note" rows="2" placeholder="Подъезд, этаж, код домофона"></textarea></div>
      <button class="btn" type="submit">Оформить демо заказ</button>
      <p class="small">Это демонстрация: оплаты нет, данные никуда не отправляются.</p>
    </form>`;
}
const RULES = {
  name: v => v.trim().length >= 2 ? '' : 'Напишите имя, хотя бы две буквы.',
  phone: v => v.replace(/\D/g, '').length >= 10 ? '' : 'Нужен номер из 10 цифр или больше.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Проверьте почту, например name@mail.ru.',
  address: v => v.trim().length >= 5 ? '' : 'Напишите адрес: улицу, дом и квартиру.',
};
function check(input) {
  const msg = RULES[input.name](input.value), err = input.nextElementSibling;
  err.textContent = msg;
  err.hidden = !msg;
  input.setAttribute('aria-invalid', !!msg);
  return !msg;
}
function bindCart() {
  const dlg = $('#cart'), body = $('#cartBody');
  $('#cartOpen').addEventListener('click', () => { renderCart(); dlg.showModal(); document.documentElement.classList.add('lock'); });
  dlg.addEventListener('close', () => document.documentElement.classList.remove('lock'));
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  body.addEventListener('click', e => {
    const q = e.target.closest('[data-qty]');
    if (!q) return;
    const l = cart[q.dataset.qty];
    l.qty += +q.dataset.d;
    if (l.qty < 1) cart.splice(q.dataset.qty, 1);
    saveCart();
    renderCart();
  });
  body.addEventListener('focusout', e => { if (e.target.matches('input')) check(e.target); });
  body.addEventListener('submit', e => {
    e.preventDefault();
    const inputs = [...e.target.querySelectorAll('input')], bad = inputs.filter(i => !check(i));
    if (bad.length) { bad[0].focus(); return; }
    const f = e.target.elements, sum = cart.reduce((n, l) => n + byId(l.id).price * l.qty, 0), ship = sum >= FREE_FROM ? 0 : DELIVERY;
    placed = {
      no: `№ ${String(Date.now()).slice(-6)}`, date: new Date().toLocaleDateString('ru-RU'),
      name: esc(f.name.value), phone: esc(f.phone.value), email: esc(f.email.value), address: esc(f.address.value),
      day: f.day.value, time: f.time.value, note: esc(f.note.value), ship, total: sum + ship,
      items: cart.map(l => ({ id: l.id, title: byId(l.id).title, size: l.size, qty: l.qty, price: byId(l.id).price })),
    };
    if (currentUser()) write(scoped('orders'), [placed, ...getOrders()]);
    cart = [];
    saveCart();
    renderCart();
  });
}

let toastTimer;
export function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

renderChrome();
bindCart();
// «Назад» в браузере: страница возвращается из памяти на то же место, обновляем только корзину и избранное
addEventListener('pageshow', e => {
  if (!e.persisted) return;
  favs = read(scoped('favs'), []);
  cart = read(scoped('cart'), []).filter(l => byId(l.id));
  setBadge($('#favCount'), favs.length);
  document.querySelectorAll('[data-fav]').forEach(b => b.setAttribute('aria-pressed', isFav(b.dataset.fav)));
  saveCart();
  document.dispatchEvent(new CustomEvent('favs'));
});
// Если браузер всё же загрузил страницу заново, сами возвращаем прокрутку туда, где человек был
const scrollKey = `gromche-scroll:${location.pathname}${location.search}`;
addEventListener('pagehide', () => { try { sessionStorage.setItem(scrollKey, String(scrollY)); } catch {} });
if (performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
  let y = 0;
  try { y = +sessionStorage.getItem(scrollKey) || 0; } catch {}
  if (y) { history.scrollRestoration = 'manual'; requestAnimationFrame(() => scrollTo(0, y)); }
}
saveCart();
setBadge($('#favCount'), favs.length);
// Даём странице дорисовать товары, потом включаем анимацию
setTimeout(startMotion);
