const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Мобильное меню
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
function toggleMenu(open) {
  burger.classList.toggle('is-open', open);
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
}
burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));

// Появление блоков: внутри раздела по очереди, шаг 70 мс
document.querySelectorAll('section, footer').forEach((section) => {
  section.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
  });
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Вкладки с ценами (стрелки ← → переключают вкладки с клавиатуры)
const tabs = [...document.querySelectorAll('.tab')];
function showTab(name) {
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active);
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
}
// Стрелка на плитке услуги открывает нужную вкладку цен
document.querySelectorAll('[data-tab-link]').forEach((link) => link.addEventListener('click', () => showTab(link.dataset.tabLink)));
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const next = tabs[(i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    showTab(next.dataset.tab);
    next.focus();
  });
});

// «Записаться» у мастера выбирает в форме его направление
const form = document.getElementById('form');
document.querySelectorAll('[data-service]').forEach((link) => link.addEventListener('click', () => {
  form.elements.service.value = link.dataset.service;
}));

// Маска телефона: российские номера как +7 (900) 000-00-00,
// номер другой страны (начинается с «+», но не «+7») оставляем как есть
const phone = form.elements.phone;
const isForeign = () => /^\+[0-689]/.test(phone.value.trim());
phone.addEventListener('input', () => {
  if (phone.value.trim() === '+') return;
  if (isForeign()) {
    phone.value = '+' + phone.value.replace(/\D/g, '').slice(0, 15);
    return;
  }
  let digits = phone.value.replace(/\D/g, '');
  if (digits.startsWith('8') || digits.startsWith('7')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  let result = '+7';
  if (digits.length) result += ' (' + digits.slice(0, 3);
  if (digits.length >= 4) result += ') ' + digits.slice(3, 6);
  if (digits.length >= 7) result += '-' + digits.slice(6, 8);
  if (digits.length >= 9) result += '-' + digits.slice(8, 10);
  phone.value = result;
});

// Отправка заявки (демо): ошибки текстом под полем, успех — по выбранному способу связи
const successText = {
  call: 'Администратор перезвонит вам в течение 15 минут.',
  tg: 'Администратор напишет вам в Telegram в течение 15 минут.',
  wa: 'Администратор напишет вам в WhatsApp в течение 15 минут.',
  vk: 'Администратор напишет вам ВКонтакте в течение 15 минут.',
};
function setError(field, errorId, hasError) {
  field.classList.toggle('is-error', hasError);
  field.setAttribute('aria-invalid', hasError);
  document.getElementById(errorId).hidden = !hasError;
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = form.elements.name;
  const digits = phone.value.replace(/\D/g, '').length;
  const nameOk = name.value.trim().length >= 1;
  const phoneOk = isForeign() ? digits >= 8 && digits <= 15 : digits === 11;
  setError(name, 'name-error', !nameOk);
  setError(phone, 'phone-error', !phoneOk);
  if (!nameOk) { name.focus(); return; }
  if (!phoneOk) { phone.focus(); return; }
  document.getElementById('success-text').textContent = successText[form.elements.way.value];
  document.getElementById('success').hidden = false;
});

// «Живая» строка на первом экране: ближайшее свободное окно (демо).
// Окна каждые полчаса с 9:00 до 21:00, ближайшее — не раньше чем через час
const slot = document.getElementById('slot');
if (slot) {
  const now = new Date();
  let minutes = Math.ceil((now.getHours() * 60 + now.getMinutes() + 60) / 30) * 30;
  let day = 'сегодня';
  if (minutes < 9 * 60) minutes = 9 * 60;
  if (minutes > 20 * 60) { minutes = 10 * 60; day = 'завтра'; }
  const time = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  document.getElementById('slot-text').textContent = `Ближайшее свободное окно — ${day} в ${time}`;
  slot.hidden = false;
}

// Плавающая кнопка «Написать» (телефон): видна между первым экраном и блоком записи
const chat = document.getElementById('chat');
const chatBtn = document.getElementById('chat-btn');
function toggleChat(open) {
  chat.classList.toggle('is-open', open);
  chatBtn.setAttribute('aria-expanded', open);
}
chatBtn.addEventListener('click', () => toggleChat(!chat.classList.contains('is-open')));
document.addEventListener('click', (event) => { if (!chat.contains(event.target)) toggleChat(false); });
const chatHiders = new Map();
const chatObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => chatHiders.set(entry.target, entry.isIntersecting));
  const hidden = [...chatHiders.values()].some(Boolean);
  chat.classList.toggle('is-shown', !hidden);
  if (hidden) toggleChat(false);
});
['.hero', '.offer', '#booking', '#contacts', '.footer'].forEach((selector) => chatObserver.observe(document.querySelector(selector)));

// Esc закрывает меню и список мессенджеров
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  toggleMenu(false);
  toggleChat(false);
});

// Демо-ссылки: в концепте показываем подсказку вместо перехода
const toast = document.getElementById('toast');
let toastTimer;
document.querySelectorAll('[data-demo]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  toggleChat(false);
  toast.textContent = `Это демо-сайт: здесь будет ${link.dataset.demo}`;
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2800);
}));

