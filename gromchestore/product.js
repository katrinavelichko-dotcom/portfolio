import { $, addToCart, card, cartQty, changeQty, isFav } from './app.js';
import { CATS, GENDERS, PRODUCTS, SIZES, byId, rub } from './data.js';

const p = byId(new URLSearchParams(location.search).get('id')) || PRODUCTS[0];
document.title = `${p.title} — ГРОМЧЕ`;
const img = (cls, loading = '') => `<div class="tile ${cls}"><img src="images/${p.img}.jpg" alt="${p.alt}" width="900" height="1125" ${loading}></div>`;

$('#crumbs').innerHTML = `<a href="catalog.html?g=${p.g}">${GENDERS[p.g]}</a> / <a href="catalog.html?g=${p.g}&cat=${p.cat}">${CATS[p.cat]}</a> / ${p.title}`;
$('#product').innerHTML = `
  <div class="gallery-wrap">
    <div class="gallery" id="gallery">${img('')}${img('detail')}${img('detail')}</div>
    <p class="gallery-count" id="galleryCount" aria-live="polite">1 / 3</p>
  </div>
  <div class="info">
    <div class="info-block">
      <h1>${p.title}</h1>
      <p class="price">${p.sale ? `<s>${rub(p.oldPrice)}</s> <span class="sale-price">${rub(p.price)}</span>` : rub(p.price)}</p>
      <p>Цвет: ${p.color}</p>
    </div>
    <fieldset class="sizes">
      <legend>Размер</legend>
      <div class="size-row" id="sizes">${p.oneSize
        ? '<button class="size" type="button" aria-pressed="true" style="grid-column:1/-1">Один размер</button>'
        : SIZES.map(s => `<button class="size" type="button" aria-pressed="false"${p.sizes.includes(s) ? '' : ' disabled'}>${s}</button>`).join('')}</div>
      <p class="error" id="sizeError" hidden>Выбери размер, чтобы добавить вещь в корзину.</p>
    </fieldset>
    <div class="buy">
      <div id="buyBox"></div>
      <button class="btn btn-ghost" type="button" data-fav="${p.id}" aria-pressed="${isFav(p.id)}">${isFav(p.id) ? 'В избранном' : 'В избранное'}</button>
    </div>
    <div class="info-block small">
      <p>${p.desc}</p>
      <p>${p.fit}</p>
      <p>Артикул: ${p.sku}</p>
    </div>
    <div class="acc">
      <details><summary>Состав и уход</summary><div class="acc-body"><p>${p.comp}</p><p>${p.care}</p></div></details>
      <details><summary>Доставка и возврат</summary><div class="acc-body"><p>По Москве 390 ₽, от 10 000 ₽ бесплатно. Примерка перед оплатой.</p><p>Вернуть вещь можно в течение 14 дней. <a href="help.html#returns"><u>Подробнее</u></a></p></div></details>
      ${p.oneSize ? '' : `<details><summary>Гид по размерам</summary><div class="acc-body">
        <table class="size-table"><thead><tr><th>Размер</th><th>Грудь, см</th><th>Талия, см</th><th>Бёдра, см</th></tr></thead><tbody>
          <tr><td>XS</td><td>82</td><td>64</td><td>90</td></tr><tr><td>S</td><td>86</td><td>68</td><td>94</td></tr>
          <tr><td>M</td><td>90</td><td>72</td><td>98</td></tr><tr><td>L</td><td>96</td><td>78</td><td>104</td></tr>
          <tr><td>XL</td><td>102</td><td>84</td><td>110</td></tr>
        </tbody></table></div></details>`}
    </div>
  </div>`;

// На телефоне фото листаются пальцем
const gallery = $('#gallery');
gallery.addEventListener('scroll', () => {
  $('#galleryCount').textContent = `${Math.round(gallery.scrollLeft / gallery.clientWidth) + 1} / 3`;
}, { passive: true });

let size = p.oneSize ? 'Один размер' : null;
$('#sizes').addEventListener('click', e => {
  const b = e.target.closest('.size');
  if (!b || p.oneSize) return;
  size = b.textContent;
  $('#sizeError').hidden = true;
  document.querySelectorAll('#sizes .size').forEach(x => x.setAttribute('aria-pressed', x === b));
  renderBuy();
});
function renderBuy() {
  const n = size ? cartQty(p.id, size) : 0;
  $('#buyBox').innerHTML = n
    ? `<div class="stepper"><button type="button" data-step="-1" aria-label="Убрать одну штуку">−</button><span>В корзине: ${n}</span><button type="button" data-step="1" aria-label="Добавить ещё одну">+</button></div>`
    : '<button class="btn" id="add" type="button">В корзину</button>';
}
$('#buyBox').addEventListener('click', e => {
  const step = e.target.closest('[data-step]');
  if (step) { changeQty(p.id, size, +step.dataset.step); return; }
  if (!e.target.closest('#add')) return;
  if (!size) { $('#sizeError').hidden = false; return; }
  addToCart(p.id, size);
});
document.addEventListener('cart', renderBuy);
renderBuy();

const others = PRODUCTS.filter(x => x.g === p.g && x.cat !== p.cat);
const seen = new Set();
$('#more').innerHTML = others.filter(x => !seen.has(x.cat) && seen.add(x.cat)).slice(0, 4).map(card).join('');
