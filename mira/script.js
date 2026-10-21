// Мобильное меню
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const header = document.querySelector('.header');

function toggleMenu(open) {
  // меню открывается сразу под шапкой, где бы она ни была
  nav.style.setProperty('--menu-top', header.getBoundingClientRect().bottom + 'px');
  burger.classList.toggle('is-open', open);
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
}

burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));

// Линия под шапкой при прокрутке
window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 40));

// Плавное появление блоков
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Вкладки с ценами (стрелки ← → переключают вкладки с клавиатуры)
const tabs = [...document.querySelectorAll('.tab')];
function showTab(name) {
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active);
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('.price-table').forEach((panel) => {
    const active = panel.dataset.panel === name;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const next = tabs[(i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    showTab(next.dataset.tab);
    next.focus();
  });
});
// Клик по карточке услуги открывает нужную вкладку цен
document.querySelectorAll('.service').forEach((card) => card.addEventListener('click', () => showTab(card.dataset.tab)));

// Кнопка «Записаться» у мастера выбирает в форме его направление (например, «Ногти»)
const form = document.getElementById('form');
document.querySelectorAll('[data-service]').forEach((link) => link.addEventListener('click', () => {
  form.elements.service.value = link.dataset.service;
}));

// Маска телефона
const phone = form.elements.phone;
phone.addEventListener('input', () => {
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

// Отправка заявки (демо: без реальной отправки)
const successText = {
  call: 'Администратор перезвонит вам в течение 15 минут.',
  tg: 'Администратор напишет вам в Telegram в течение 15 минут.',
  wa: 'Администратор напишет вам в WhatsApp в течение 15 минут.',
  vk: 'Администратор напишет вам ВКонтакте в течение 15 минут.',
};
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = form.elements.name;
  const nameOk = name.value.trim().length > 1;
  const phoneOk = phone.value.replace(/\D/g, '').length === 11;
  name.classList.toggle('is-error', !nameOk);
  phone.classList.toggle('is-error', !phoneOk);
  if (!nameOk || !phoneOk) return;
  document.getElementById('success-text').textContent = successText[form.elements.way.value];
  document.getElementById('success').hidden = false;
});

// Плавающая кнопка «Написать»
const chat = document.getElementById('chat');
const chatBtn = document.getElementById('chat-btn');
function toggleChat(open) {
  chat.classList.toggle('is-open', open);
  chatBtn.setAttribute('aria-expanded', open);
}
chatBtn.addEventListener('click', () => toggleChat(!chat.classList.contains('is-open')));
// закрывается кликом мимо меню
document.addEventListener('click', (event) => {
  if (!chat.contains(event.target)) toggleChat(false);
});
// появляется только после первого экрана, чтобы не закрывать кнопку «Записаться»
new IntersectionObserver(([entry]) => {
  chat.classList.toggle('is-shown', !entry.isIntersecting);
  if (entry.isIntersecting) toggleChat(false);
}).observe(document.querySelector('.hero'));

// Esc закрывает меню и список мессенджеров
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  toggleMenu(false);
  toggleChat(false);
});

// Демо-ссылки на мессенджеры: в концепте показываем подсказку вместо перехода
const toast = document.getElementById('toast');
let toastTimer;
document.querySelectorAll('[data-demo]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  toggleChat(false);
  toast.textContent = `Это демо-сайт: здесь будет ссылка на ${link.dataset.demo} салона`;
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2800);
}));
