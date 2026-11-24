/* образец v4: три формы афиши. Данные — из js/data.js, общие функции (castFor, eventHTML, bindCast, personLink) — из js/site.js. */
(function () {
  const evs = AFISHA[0].events;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  const castBlock = (ev, id) => {
    const cast = castFor(ev);
    return cast ? `<div class="ev-cast" id="${id}" hidden><p class="ev-cast-h">Состав на ${esc(ev.date)}</p><dl>${cast
      .map(([r, p]) => `<div><dt>${esc(r)}</dt><dd>${personLink(p)}</dd></div>`).join('')}</dl></div>` : '';
  };
  const actions = (ev, id) => `<div class="ev-actions">${castFor(ev)
    ? `<button class="btn btn-soft" type="button" aria-expanded="false" aria-controls="${id}">Состав</button>` : ''}
    <a class="btn btn-blue" href="${SITE.tickets}" target="_blank" rel="noopener">Билеты</a></div>`;

  /* ---------- А. выход за края: лента едет вбок при прокрутке (gsap-scrolltrigger, pin + scrub) ---------- */
  function buildA() {
    const track = document.querySelector('[data-vA]');
    track.innerHTML = evs.map((ev, i) => {
      const s = SHOWS[ev.show];
      return `<article class="ev vA-panel">
        <p class="vA-date">${esc(ev.date)}</p>
        <h3 class="vA-title"><a href="../${showUrl(ev.show)}">${esc(s.title)}</a></h3>
        <p class="vA-meta">${esc(ev.time)}, ${esc(ev.wd)} · ${esc(s.sub)}</p>
        ${actions(ev, `cast-a${i}`)}
        ${castBlock(ev, `cast-a${i}`)}
      </article>`;
    }).join('') + '<p class="vA-end">Дальше декабрь →</p>';
    bindCast(track);
  }
  function motionA() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
      const track = document.querySelector('[data-vA]');
      const pin = document.querySelector('.vA-pin');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      // горизонтальная лента, привязанная к прокрутке: ease только 'none' (иначе прокрутка и лента расходятся)
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: pin, pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true } });
    });
  }

  /* ---------- Б. показы в небе: облачка-даты плавно покачиваются ---------- */
  const SPOTS = [[20, 18], [64, 12], [42, 44], [82, 40], [22, 74], [66, 76], [50, 92]];
  function buildB() {
    const field = document.querySelector('[data-vB]');
    field.innerHTML = evs.map((ev, i) => {
      const s = SHOWS[ev.show];
      const [x, y] = SPOTS[i % SPOTS.length];
      return `<button class="vB-dot" type="button" data-i="${i}" style="left:${x}%;top:${y}%"><b>${esc(ev.date)}</b><span>${esc(s.title)}</span></button>`;
    }).join('');
    const dialog = document.querySelector('.vB-card');
    const body = dialog.querySelector('.card-body');
    let opener = null;
    field.addEventListener('click', (e) => {
      const b = e.target.closest('.vB-dot');
      if (!b) return;
      opener = b;
      const ev = evs[Number(b.dataset.i)];
      body.innerHTML = `<h2 class="heading-3" id="vB-card-h" style="margin-bottom:var(--s-6)">${esc(SHOWS[ev.show].title)}</h2>${eventHTML(ev, `b${b.dataset.i}`)}`;
      bindCast(body);
      dialog.showModal();
    });
    dialog.querySelector('.card-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => opener?.focus());

    if (!reduce()) {
      gsap.utils.toArray('.vB-dot').forEach((d) => {
        gsap.to(d, { y: 'random(-12, 12)', x: 'random(-10, 10)', duration: 'random(3.2, 5.4)', ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    }
  }

  /* ---------- В. сигнал во времени: живая линия месяца, всплески на днях показов ---------- */
  function buildC() {
    const stage = document.querySelector('[data-vC]');
    const W = 1000, H = 300, BASE = 210;
    const days = evs.map((ev) => parseInt(ev.date, 10));
    const px = (d) => ((d - 0.5) / 30) * W;
    // соседние дни: всплески разной высоты, подписи расходятся в стороны, чтобы не налезать друг на друга
    const amp = (i) => (i % 2 ? 68 : 140);
    const side = (i) => {
      const x = px(days[i]);
      if (x > W * 0.86) return 'translate(-88%,-100%)';   // у правого края подпись всегда влево
      if (x < W * 0.14) return 'translate(-12%,-100%)';   // у левого края — вправо
      return i % 2 ? 'translate(-12%,-100%)' : 'translate(-88%,-100%)';
    };
    stage.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <path class="vC-line" d=""></path>
        <g class="vC-axis">${[1, 5, 10, 15, 20, 25, 30].map((d) => `<text x="${px(d)}" y="${H - 12}" text-anchor="middle">${d}</text>`).join('')}</g>
      </svg>
      ${evs.map((ev, i) => `<button class="vC-peak" type="button" aria-pressed="${i === 0}" data-i="${i}"
        style="left:${px(days[i]) / 10}%;top:${((BASE - amp(i) - 12) / H) * 100}%;transform:${side(i)}"><b>${esc(ev.date)}</b><span>${esc(SHOWS[ev.show].title)}</span></button>`).join('')}`;
    const path = stage.querySelector('path');
    const line = (t) => {
      let d = '';
      for (let x = 0; x <= W; x += 4) {
        let y = BASE + 3 * Math.sin(x * 0.06 + t * 2) + 2 * Math.sin(x * 0.13 - t * 1.3);
        days.forEach((day, i) => {
          const dx = x - px(day);
          y -= amp(i) * (1 + 0.05 * Math.sin(t * 2.4 + i)) * Math.exp(-(dx * dx) / (2 * 6 * 6));
        });
        d += `${x ? 'L' : 'M'}${x},${y.toFixed(1)}`;
      }
      path.setAttribute('d', d);
    };
    line(0);
    // линия дышит, только когда видна на экране и движение не отключено
    let raf = 0, on = false;
    const tick = (now) => { line(now / 1000); raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduce() && !on) { on = true; raf = requestAnimationFrame(tick); }
      if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
    }).observe(stage);

    const detail = document.querySelector('[data-vC-detail]');
    const show = (i) => {
      stage.querySelectorAll('.vC-peak').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)));
      detail.innerHTML = eventHTML(evs[i], `c${i}`);
      bindCast(detail);
      if (!reduce()) detail.firstElementChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    };
    stage.addEventListener('click', (e) => { const b = e.target.closest('.vC-peak'); if (b) show(Number(b.dataset.i)); });
    show(0);
    // на узком экране линия шире экрана: сразу показываем первый всплеск, а не пустое начало месяца
    const sc = stage.parentElement;
    const toFirst = () => { if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (px(days[0]) / W) * stage.offsetWidth - 120; };
    toFirst();
    document.querySelector('.switch [data-v="C"]').addEventListener('click', () => requestAnimationFrame(toFirst));
  }

  /* ---------- переключатель образцов ---------- */
  function switcher() {
    const btns = document.querySelectorAll('.switch button');
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      document.querySelectorAll('.variant').forEach((v) => { v.hidden = v.dataset.variant !== b.dataset.v; });
      ScrollTrigger.refresh();
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildA(); buildB(); buildC(); switcher(); motionA();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  });
})();
