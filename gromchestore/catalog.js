import { $, card } from './app.js';
import { CATS, GENDERS, MENU, PRODUCTS, SIZES } from './data.js';

const url = new URLSearchParams(location.search);
const g = GENDERS[url.get('g')] ? url.get('g') : null;
const cat = CATS[url.get('cat')] ? url.get('cat') : null;
const onlyNew = url.has('new'), onlySale = url.has('sale');
const rawQuery = (url.get('q') || '').trim();

// Поиск ищет целое слово в любой форме: футболка, футболки, футболку. «Поло» не находит «полоску»
const norm = s => s.toLowerCase().replace(/ё/g, 'е');
const stem = w => w.replace(/(ыми|ими|ая|яя|ое|ее|ые|ие|ый|ий|ой|ов|ам|ах|ы|и|а|я|у|ю|е|о)$/, '');
const tokens = s => norm(s).split(/[^a-zа-я0-9]+/).filter(Boolean).map(stem);
const words = tokens(rawQuery);
const found = p => {
  const all = tokens(`${p.title} ${p.color} ${GENDERS[p.g]}`);
  return words.every(w => all.includes(w));
};
// Сначала вещи, где слово есть в названии, потом совпадения только по цвету
const titleHit = p => words.some(w => tokens(p.title).includes(w));

const base = PRODUCTS.filter(p => (!g || p.g === g) && (!cat || p.cat === cat)
  && (!onlyNew || p.fresh) && (!onlySale || p.sale) && found(p));

const title = rawQuery ? `Поиск: ${rawQuery}` : onlySale ? 'Распродажа' : onlyNew ? 'Новинки' : cat ? CATS[cat] : g ? GENDERS[g] : 'Каталог';
$('#title').textContent = title;
document.title = `${title} — ГРОМЧЕ`;
$('#q').value = rawQuery;

const link = (gender, c) => {
  const q = new URLSearchParams();
  if (gender) q.set('g', gender);
  if (c) q.set('cat', c);
  if (onlySale) q.set('sale', 1);
  if (onlyNew && !c) q.set('new', 1);
  return `catalog.html?${q}`;
};
$('#tabs').innerHTML = `<a href="${link(null, cat)}"${!g ? ' aria-current="page"' : ''}>Всё</a>` + Object.entries(GENDERS).map(([k, t]) =>
  `<a href="${link(k, MENU[k].includes(cat) ? cat : null)}"${k === g ? ' aria-current="page"' : ''}>${t}</a>`).join('');

$('#side').innerHTML = `<a href="${link(g)}"${!cat ? ' aria-current="page"' : ''}>Все вещи</a>`
  + (g ? MENU[g] : Object.keys(CATS)).map(c => `<a href="${link(g, c)}"${c === cat ? ' aria-current="page"' : ''}>${CATS[c]}</a>`).join('');

/* Фильтры: можно выбрать несколько значений */
const chosen = { size: new Set(), color: new Set() };
const from = $('#priceFrom'), to = $('#priceTo');
const prices = base.map(p => p.price);
if (prices.length) {
  from.placeholder = Math.min(...prices);
  to.placeholder = Math.max(...prices);
}
const chips = (group, values) => values.map(v => `<button class="filter-chip" type="button" data-group="${group}" aria-pressed="false">${v}</button>`).join('');

$('#fSizes').innerHTML = chips('size', SIZES.filter(s => base.some(p => p.sizes.includes(s))));
$('#fColors').innerHTML = chips('color', [...new Set(base.map(p => p.color))].sort());

const SORT = {
  new: (a, b) => b.fresh - a.fresh,
  asc: (a, b) => a.price - b.price,
  desc: (a, b) => b.price - a.price,
};
function matches(p) {
  return (!chosen.size.size || p.sizes.some(s => chosen.size.has(s)))
    && (!chosen.color.size || chosen.color.has(p.color))
    && (!from.value || p.price >= +from.value)
    && (!to.value || p.price <= +to.value);
}
const ending = n => (n % 10 === 1 && n % 100 !== 11 ? 'вещь' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'вещи' : 'вещей');

function render() {
  const list = base.filter(matches).sort(SORT[$('#fSort').value]);
  if (words.length) list.sort((a, b) => titleHit(b) - titleHit(a));
  $('#total').textContent = `${list.length} ${ending(list.length)}`;
  $('#reset').hidden = !Object.values(chosen).some(s => s.size) && !from.value && !to.value;
  $('#grid').innerHTML = list.length ? list.map(card).join('')
    : `<div class="nothing"><h2>Ничего не нашлось</h2><p>Попробуй другое слово или сбрось фильтры.</p><a class="btn" href="catalog.html">Смотреть весь каталог</a></div>`;
}
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.filter-chip');
  if (!b) return;
  const set = chosen[b.dataset.group], v = b.textContent;
  set.has(v) ? set.delete(v) : set.add(v);
  b.setAttribute('aria-pressed', set.has(v));
  render();
});
$('#reset').addEventListener('click', () => {
  Object.values(chosen).forEach(s => s.clear());
  from.value = to.value = '';
  document.querySelectorAll('.filter-chip').forEach(b => b.setAttribute('aria-pressed', false));
  render();
});
$('#fSort').addEventListener('change', render);
[from, to].forEach(i => i.addEventListener('input', render));
if (innerWidth <= 820) $('#filters').open = false;
render();
