/* студия 505: движение на GSAP (gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-utils, gsap-performance).
   Решения по навыку animate:
   · заголовок первого экрана — редкое событие (раз за визит), цель: объяснение, где ты. Маска по строке, 0.9 с.
   · появление разделов — один раз, цель: не дать блокам «телепортироваться». Подъём 32px, 0.7 с, шаг 70 мс.
   · фраза слово за словом — привязана к прокрутке (landing-page-design B11).
   · фото неба — сдвиг и лёгкое приближение, привязанные к прокрутке.
   · кнопки, меню, карточка — в CSS (переходы можно прервать). Клавиатурным действиям анимации нет. */
(function () {
  const root = document.documentElement;
  const done = () => root.classList.remove('motion-pending');

  function start() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST) { done(); return; }
    gsap.registerPlugin(ST);
    const toArray = gsap.utils.toArray;

    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { motion } = ctx.conditions;
      const lines = toArray('.line > span');
      const after = toArray('[data-after]');

      if (motion) {
        // 1. Маска по строке: строки поднимаются из-под своей базовой линии, вторая на 110 мс позже
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        if (lines.length) tl.from(lines, { yPercent: 110, duration: 0.8, stagger: 0.11 });
        if (after.length) tl.from(after, { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, lines.length ? '-=0.45' : 0);

        // 2. Небо на фотографиях медленно плывёт и чуть приближается при прокрутке («живая картинка»).
        //    Привязано к прокрутке, поэтому ease: 'none' (gsap-scrolltrigger), только transform (gsap-performance).

        // 3. Части каждого раздела появляются по очереди, один раз
        // части разделов: заголовки, тексты, строки афиши, ссылки, факты
        // карточки спектаклей и первый месяц афиши появляются по очереди; скрытые вкладки не трогаем
        const reveal = toArray('[data-reveal]:not(.links), .links a, .sr-card, .rows:not([hidden]) > .row, .ft-top > *');
        gsap.set(reveal, { autoAlpha: 0, y: 32 });
        ST.batch(reveal, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, overwrite: true }),
        });

        // 4. Фраза: слова по одному переходят из бледного в полный цвет
        toArray('[data-words]').forEach((el) => {
          const words = el.querySelectorAll('.w');
          gsap.fromTo(words, { opacity: 0.3 }, {
            opacity: 1, ease: 'power2.out', stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: 0.6 },
          });
        });
      } else {
        // Меньше движения: видео облаков стоит на первом кадре, остальное — только мягкое появление
        document.querySelectorAll('video[data-loop]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
        if (lines.length || after.length) gsap.from([...lines, ...after], { opacity: 0, duration: 0.4, ease: 'power1.out' });
      }
      done();
    });

    // Шрифт мог поменять высоту блоков — пересчитать точки срабатывания
    document.fonts?.ready.then(() => ST.refresh());

    window.S505Motion = {
      // строки афиши после смены месяца: 40 мс между строками
      rows(nodes) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return gsap.from(nodes, { opacity: 0, duration: 0.2 });
        gsap.from(nodes, { opacity: 0, y: 8, duration: 0.25, ease: 'power3.out', stagger: 0.04 });
      },
      // ссылки в мобильном меню: шаг 60 мс, вся очередь не дольше 400 мс (landing-page-design B7)
      menu(links) {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const each = Math.min(0.06, 0.4 / Math.max(links.length, 1));
        gsap.fromTo(links, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: each, overwrite: true, clearProps: 'transform,opacity,visibility' });
      },
    };
  }

  // Если библиотека не загрузилась, текст не должен остаться спрятанным
  setTimeout(done, 2500);
  if (window.__s505ready) start();
  else document.addEventListener('s505:ready', start, { once: true });
})();
