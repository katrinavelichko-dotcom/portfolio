import { $, TEST_LOGIN, card, currentUser, getCart, getFavs, getOrders, login, logout, register } from './app.js';
import { byId, rub } from './data.js';

const user = currentUser();
let mode = 'login';

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
  $('#orderList').innerHTML = orders.length
    ? orders.map(o => `<div class="order"><strong>${o.date}, ${rub(o.total)}</strong>${o.items.map(i => `<span class="small">${i.title}, ${i.size}, ${i.qty} шт.</span>`).join('')}</div>`).join('')
    : '<p>Заказов пока нет.</p>';
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
