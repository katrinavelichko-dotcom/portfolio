import { $, LEVELS, card, getVolume, setVolume } from './app.js';
import { FAQ, PRODUCTS } from './data.js';

const vol = $('#vol');
const INK = ['#16161A', '#16161A', '#5E1D29', '#7D1E2D'];
// Образы на первом экране: от спокойных к самым ярким
const LOOKS = [
  [['vol-1-a', 'Девушка в сером свитере и прямых брюках'], ['vol-1-b', 'Парень в тёмно-синем свитере и серых брюках']],
  [['vol-2-a', 'Девушка в бежевом свитере с малиновым шарфом'], ['vol-2-b', 'Парень в оливковой рубашке и горчичных носках']],
  [['cut-1', 'Девушка в малиновом свитере, шарфе в горошек и широких джинсах'], ['cut-2', 'Парень в полосатом свитере, широких чёрных брюках и розовых носках']],
  [['vol-4-a', 'Девушка в розовом кардигане, клетчатой юбке и оранжевых колготках'], ['vol-4-b', 'Парень в ярком свитере, синих брюках и красных ботинках']],
];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let setLetters = () => {}, level = 1;
vol.value = getVolume();

function showLooks(i) {
  [$('#lookA'), $('#lookB')].forEach((img, n) => {
    const [file, alt] = LOOKS[i][n];
    img.src = `images/${file}.png`;
    img.alt = alt;
    // Через filter, а не opacity: иначе анимация появления первого экрана примет прозрачность за конечную
    if (!reduced) img.animate([{ filter: 'saturate(var(--sat)) opacity(0)' }, { filter: 'saturate(var(--sat)) opacity(1)' }], { duration: 300, easing: 'ease-out' });
  });
  const lvl = LEVELS[i], link = $('#levelLink');
  link.href = `catalog.html?level=${i}`;
  link.textContent = `Смотреть ${lvl.pick}`;
}

function apply() {
  const n = +vol.value, lvl = setVolume(n);
  $('#out').textContent = `${n} из 100`;
  $('#hint').textContent = lvl.hint;
  const i = LEVELS.indexOf(lvl);
  setLetters(n / 100, INK[i]);
  if (i !== level) showLooks(level = i);
}
vol.addEventListener('input', apply);
apply();
// Заранее загружаем остальные образы, чтобы при движении шкалы они менялись сразу
addEventListener('load', () => setTimeout(() => LOOKS.flat().forEach(([file]) => { new Image().src = `images/${file}.png`; }), 1000), { once: true });

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

/* Сначала виден снимок букв, живые встают на его место с первым кадром. Если 3D не запустится, снимок останется */
import('./letters.js').then(({ mountLetters }) => {
  setLetters = mountLetters($('#letters'), reduced);
  apply();
  requestAnimationFrame(() => $('#word').classList.add('is-3d'));
}).catch(() => {});
