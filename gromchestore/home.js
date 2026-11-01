import { $, LEVELS, card, getVolume, setVolume } from './app.js';
import { FAQ, PRODUCTS } from './data.js';

const vol = $('#vol');
const INK = ['#16161A', '#16161A', '#5E1D29', '#7D1E2D'];
let setLetters = () => {};
vol.value = getVolume();

function apply() {
  const n = +vol.value, lvl = setVolume(n);
  $('#out').textContent = `${n} из 100`;
  $('#hint').textContent = lvl.hint;
  setLetters(n / 100, INK[LEVELS.indexOf(lvl)]);
}
vol.addEventListener('input', apply);
apply();

// В новинках чередуем женское и мужское
const fresh = g => PRODUCTS.filter(p => p.fresh && p.g === g);
const her = fresh('women'), him = fresh('men');
$('#fresh').innerHTML = Array.from({ length: Math.max(her.length, him.length) }, (_, i) => [her[i], him[i]]).flat().filter(Boolean).slice(0, 10).map(card).join('');
$('#marquee').textContent = 'Тихо Негромко Заметно Громко '.repeat(10);

/* Лента новинок: стрелки листают на одну вещь в обе стороны */
const view = $('#railView'), prev = $('#railPrev'), next = $('#railNext');
const step = () => view.querySelector('.card').offsetWidth + 16;
function arrows() {
  prev.disabled = view.scrollLeft < 8;
  next.disabled = view.scrollLeft > view.scrollWidth - view.clientWidth - 8;
}
prev.addEventListener('click', () => view.scrollBy({ left: -step(), behavior: 'smooth' }));
next.addEventListener('click', () => view.scrollBy({ left: step(), behavior: 'smooth' }));
view.addEventListener('scroll', arrows, { passive: true });
view.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') next.click();
  if (e.key === 'ArrowLeft') prev.click();
});
arrows();

$('#faqList').innerHTML = FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('');

/* Если 3D не запустится, останется обычное слово */
import('./letters.js').then(({ mountLetters }) => {
  setLetters = mountLetters($('#letters'), matchMedia('(prefers-reduced-motion: reduce)').matches);
  $('#word').classList.add('is-3d');
  apply();
}).catch(() => {});
