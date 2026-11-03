import { $, LEVELS, card } from './app.js';
import { CATS, GENDERS, MENU, PRODUCTS, SIZES, catName, rub } from './data.js';

const url = new URLSearchParams(location.search);
const g = GENDERS[url.get('g')] ? url.get('g') : null;
const cat = CATS[url.get('cat')] ? url.get('cat') : null;
const onlyNew = url.has('new'), onlySale = url.has('sale');
const levelId = url.get('level'), level = LEVELS[levelId], levelFrom = levelId > 0 ? LEVELS[levelId - 1]?.shelf : 0;
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
  && (!onlyNew || p.fresh) && (!onlySale || p.sale) && (!level || (p.loud >= levelFrom && p.loud < level.shelf)) && found(p));

const levelTitle = level && `${level.pick[0].toUpperCase()}${level.pick.slice(1)}`;
const title = rawQuery ? `Поиск: ${rawQuery}` : levelTitle || (onlySale ? 'Распродажа' : onlyNew ? 'Новинки' : cat ? catName(cat, g) : g ? GENDERS[g] : 'Каталог');
$('#title').textContent = title;
document.title = `${title} — ГРОМЧЕ`;
$('#q').value = rawQuery;

const link = (gender, c) => {
  const q = new URLSearchParams();
  if (gender) q.set('g', gender);
  if (c) q.set('cat', c);
  if (onlySale) q.set('sale', 1);
  if (onlyNew && !c) q.set('new', 1);
  if (level) q.set('level', levelId);
  return `catalog.html?${q}`;
};
$('#tabs').innerHTML = `<a href="${link(null, cat)}"${!g ? ' aria-current="page"' : ''}>Всё</a>` + Object.entries(GENDERS).map(([k, t]) =>
  `<a href="${link(k, MENU[k].includes(cat) ? cat : null)}"${k === g ? ' aria-current="page"' : ''}>${t}</a>`).join('');

$('#side').innerHTML = `<a href="${link(g)}"${!cat ? ' aria-current="page"' : ''}>Все вещи</a>`
  + (g ? MENU[g] : Object.keys(CATS)).map(c => `<a href="${link(g, c)}"${c === cat ? ' aria-current="page"' : ''}>${catName(c, g)}</a>`).join('');

/* Фильтры: можно выбрать несколько значений */
const chosen = { size: new Set(), color: new Set() };
const from = $('#priceFrom'), to = $('#priceTo');
const prices = base.map(p => p.price);
if (prices.length) {
  from.placeholder = Math.min(...prices);
  to.placeholder = Math.max(...prices);
}
const chips = (group, values) => values.map(v => `<button class="filter-chip" type="button" data-group="${group}" data-value="${v}" aria-pressed="false">${v}</button>`).join('');
const SWATCH = {
  'Бежевый': '#D8C4A5', 'Белый': '#FFFFFF', 'Бирюзовый': '#1FA8A0', 'Бордовый': '#6E1A2B', 'Голубой': '#9CC3E6', 'Горчичный': '#C99A2E',
  'Жёлтый': '#F2D33B', 'Зелёный': '#2F8F4E', 'Коралловый': '#F0735A', 'Коричневый': '#6B4427', 'Кремовый': '#F3E7CE', 'Малиновый': '#C2185B',
  'Оливковый': '#6F7533', 'Оранжевый': '#EE7D24', 'Розовый': '#F29CB7', 'Синий': '#2A4F9E', 'Сиреневый': '#B79BDD',
  'Чёрно-кремовый': 'linear-gradient(135deg, #16161A 50%, #F3E7CE 50%)',
};
const swatches = values => values.map(v => `<button class="swatch" type="button" data-group="color" data-value="${v}" aria-pressed="false" aria-label="${v}" title="${v}" style="--c:${SWATCH[v]}"></button>`).join('');

$('#fSizes').innerHTML = chips('size', SIZES.filter(s => base.some(p => p.sizes.includes(s))));
$('#fColors').innerHTML = swatches([...new Set(base.map(p => p.color))].sort());

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

const priceLabel = () => [from.value && `от ${rub(+from.value)}`, to.value && `до ${rub(+to.value)}`].filter(Boolean).join(' ');
function renderTags() {
  const tag = (group, value, label) => `<button class="tag" type="button" data-tag="${group}" data-value="${value}" aria-label="Убрать фильтр: ${label}">${label}<span aria-hidden="true">×</span></button>`;
  $('#tags').innerHTML = [...chosen.size].map(v => tag('size', v, v)).join('')
    + [...chosen.color].map(v => tag('color', v, v)).join('')
    + (from.value || to.value ? tag('price', '', priceLabel()) : '');
}
function render() {
  const list = base.filter(matches).sort(SORT[$('#fSort').value]);
  if (words.length) list.sort((a, b) => titleHit(b) - titleHit(a));
  $('#total').textContent = `${list.length} ${ending(list.length)}`;
  const count = chosen.size.size + chosen.color.size + (from.value || to.value ? 1 : 0);
  $('#fCount').textContent = count ? `: ${count}` : '';
  $('#reset').hidden = !count;
  renderTags();
  $('#grid').innerHTML = list.length ? list.map(card).join('')
    : `<div class="nothing"><h2>Ничего не нашлось</h2><p>Попробуйте другое слово или сбросьте фильтры.</p><a class="btn" href="catalog.html">Смотреть весь каталог</a></div>`;
}
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('[data-group]');
  if (!b) return;
  const set = chosen[b.dataset.group], v = b.dataset.value;
  set.has(v) ? set.delete(v) : set.add(v);
  b.setAttribute('aria-pressed', set.has(v));
  render();
});
$('#reset').addEventListener('click', () => {
  Object.values(chosen).forEach(s => s.clear());
  from.value = to.value = '';
  document.querySelectorAll('[data-group]').forEach(b => b.setAttribute('aria-pressed', false));
  render();
});
$('#tags').addEventListener('click', e => {
  const b = e.target.closest('.tag');
  if (!b) return;
  const { tag, value } = b.dataset;
  if (tag === 'price') from.value = to.value = '';
  else {
    chosen[tag].delete(value);
    document.querySelector(`[data-group="${tag}"][data-value="${value}"]`).setAttribute('aria-pressed', false);
  }
  render();
});
$('#fSort').addEventListener('change', render);
[from, to].forEach(i => i.addEventListener('input', render));
if (innerWidth <= 820) $('#filters').open = false;
render();
