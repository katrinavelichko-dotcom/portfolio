import { $, TEST_LOGIN, cancelOrder, card, sizeLabel, currentUser, getCart, getFavs, getOrders, login, logout, register } from './app.js';
import { byId, rub } from './data.js';

// Карточка заказа раскрывается по нажатию. В старых заказах нет адреса и времени, их не показываем
const orderCard = (o, i) => {
  const rows = [
    o.day && ['Доставка', `${o.day}, ${o.time}`], o.address && ['Адрес', o.address], o.note && ['Комментарий', o.note],
    o.name && ['Получатель', `${o.name}, ${o.phone}`], o.ship !== undefined && ['Стоимость доставки', o.ship ? rub(o.ship) : 'Бесплатно'],
    ['Оплата', 'После примерки, картой или через СБП'], ['Итого', rub(o.total)],
  ].filter(Boolean);
  const status = o.cancelled ? `Отменён ${o.cancelled}` : 'Демо заказ принят';
  return `<details class="order${o.cancelled ? ' cancelled' : ''}" data-order="${i}"><summary><span><strong>${o.no ? `Заказ ${o.no}` : 'Заказ'} от ${o.date}</strong><span class="small order-status">${status} · ${o.items.reduce((n, x) => n + x.qty, 0)} шт.</span></span><strong>${rub(o.total)}</strong></summary>
    <div class="order-body">${o.items.map(i => { const p = i.id && byId(i.id); return `<div class="line">${p ? `<div class="tile"><img src="images/${p.img}.jpg" alt="${p.alt}" width="900" height="1125" loading="lazy"></div>` : '<div></div>'}<div class="line-text">${p ? `<a href="product.html?id=${p.id}">${i.title}</a>` : i.title}<span class="small">${sizeLabel(i.size)}, ${i.qty} шт.</span>${i.price ? `<strong>${rub(i.price * i.qty)}</strong>` : ''}</div></div>`; }).join('')}
    <dl class="order-info">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    ${o.cancelled ? '<p class="small">Заказ отменён. Это демонстрация: деньги не списывались.</p>' : `<div class="order-cancel"><button class="btn btn-ghost" type="button" data-cancel>Отменить заказ</button></div>`}</div></details>`;
};

const user = currentUser();
let mode = 'login';

function renderOrders(open) {
  const orders = getOrders();
  $('#orderList').innerHTML = orders.length ? orders.map(orderCard).join('') : '<p>Заказов пока нет.</p>';
  if (open !== undefined) $(`[data-order="${open}"]`).open = true;
}
// Отмена в два шага, чтобы не отменить заказ случайным нажатием
$('#orderList').addEventListener('click', e => {
  const box = e.target.closest('.order-cancel');
  if (!box) return;
  const i = +e.target.closest('[data-order]').dataset.order;
  if (e.target.closest('[data-cancel]')) {
    box.innerHTML = '<p>Отменить этот заказ?</p><div class="order-cancel-row"><button class="btn" type="button" data-yes>Да, отменить</button><button class="btn btn-ghost" type="button" data-no>Нет, оставить</button></div>';
    box.querySelector('[data-no]').focus();
  } else if (e.target.closest('[data-yes]')) { cancelOrder(i); renderOrders(i); }
  else if (e.target.closest('[data-no]')) renderOrders(i);
});

function renderAccount() {
  $('#title').textContent = `Здравствуйте, ${user.name}`;
  document.title = 'Профиль — ГРОМЧЕ';
  $('#account').hidden = false;
  $('#aInfo').textContent = user.mail;
  const favs = getFavs().map(byId).filter(Boolean), cart = getCart(), orders = getOrders();
  $('#favList').innerHTML = favs.length ? favs.map(card).join('') : '<p>Здесь появятся вещи с сердечком.</p>';
  $('#cartList').innerHTML = cart.length
    ? cart.map(l => { const p = byId(l.id); return `<div class="total"><a href="product.html?id=${p.id}">${p.title}, ${l.size}, ${l.qty} шт.</a><span>${rub(p.price * l.qty)}</span></div>`; }).join('')
    : '<p>Корзина пока пуста.</p>';
  renderOrders();
  $('#logout').addEventListener('click', () => { logout(); location.reload(); });
}

function setMode(m) {
  mode = m;
  const reg = m === 'reg';
  $('#tabLogin').setAttribute('aria-pressed', !reg);
  $('#tabReg').setAttribute('aria-pressed', reg);
  $('#nameField').hidden = !reg;
  $('#title').textContent = reg ? 'Регистрация' : 'Вход';
  $('#authSubmit').textContent = reg ? 'Зарегистрироваться' : 'Войти';
  $('#aPass').autocomplete = reg ? 'new-password' : 'current-password';
  $('#authError').hidden = true;
}

const RULES = {
  name: v => v.trim().length >= 2 ? '' : 'Напишите имя, хотя бы две буквы.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Проверьте почту, например name@mail.ru.',
  password: v => v.length >= 6 ? '' : 'Пароль должен быть не короче 6 символов.',
};
function check(input) {
  const free = TEST_LOGIN && mode === 'login';
  const msg = free ? (input.value.trim() ? '' : 'Введите что нибудь.') : RULES[input.name](input.value), err = input.nextElementSibling;
  err.textContent = msg;
  err.hidden = !msg;
  input.setAttribute('aria-invalid', !!msg);
  return !msg;
}

function renderAuth() {
  $('#auth').hidden = false;
  if (TEST_LOGIN) $('#demoNote').textContent = 'Тестовый режим: для входа подойдут любые почта и пароль. Не используйте настоящий пароль.';
  $('#tabLogin').addEventListener('click', () => setMode('login'));
  $('#tabReg').addEventListener('click', () => setMode('reg'));
  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fields = [...e.target.querySelectorAll('input')].filter(i => !i.closest('[hidden]'));
    const bad = fields.filter(i => !check(i));
    if (bad.length) { bad[0].focus(); return; }
    const msg = mode === 'reg'
      ? await register($('#aName').value, $('#aMail').value, $('#aPass').value)
      : await login($('#aMail').value, $('#aPass').value);
    if (msg) { $('#authError').textContent = msg; $('#authError').hidden = false; return; }
    location.reload();
  });
}

user ? renderAccount() : renderAuth();
