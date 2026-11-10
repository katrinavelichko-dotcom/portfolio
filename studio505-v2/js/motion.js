/* студия 505 · вариант 2: движение на GSAP (gsap-core, gsap-scrolltrigger, gsap-utils, gsap-performance).
   · первый экран: название и ближайшие показы проявляются один раз за визит (объяснение «где ты»), 0,7 с;
   · блоки разделов поднимаются на 24px и проявляются один раз при входе в экран, шаг 70 мс;
   · фото первого экрана медленно приближается при прокрутке (привязано к прокрутке, поэтому без ease);
   · кнопки, наведение, карточка — в CSS. Клавиатурным действиям анимации нет.
   Только transform и opacity. При «меньше движения» — только мягкое проявление без сдвигов. */
(function () {
  const root = document.documentElement;
  const done = () => root.classList.remove('motion-pending');

  function start() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST) { done(); return; }
    gsap.registerPlugin(ST);
    const toArray = gsap.utils.toArray;

    gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const intro = toArray('[data-intro]');
      if (ctx.conditions.motion) {
        if (intro.length) gsap.from(intro, { autoAlpha: 0, y: 24, duration: 0.7, ease: 'power3.out', stagger: 0.09 });
        const heroImg = document.querySelector('.hero-bg img');
        if (heroImg) gsap.fromTo(heroImg, { scale: 1.02 }, { scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

        const reveal = toArray('[data-reveal], .evs:not([hidden]) > .ev, .ft-grid > *');
        gsap.set(reveal, { autoAlpha: 0, y: 24 });
        ST.batch(reveal, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, overwrite: true }),
        });
      } else if (intro.length) {
        gsap.from(intro, { opacity: 0, duration: 0.4, ease: 'power1.out' });
      }
      done();
    });
    document.fonts?.ready.then(() => ST.refresh());

    window.S505Motion = {
      rows(nodes) {
        if (reduceMotion()) return gsap.from(nodes, { opacity: 0, duration: 0.2 });
        gsap.fromTo(nodes, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out', stagger: 0.04, overwrite: true });
      },
      // ссылки мобильного меню: шаг 60 мс, вся очередь не дольше 400 мс
      menu(links) {
        if (reduceMotion()) return;
        const each = Math.min(0.06, 0.4 / Math.max(links.length, 1));
        gsap.fromTo(links, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power3.out', stagger: each, overwrite: true, clearProps: 'transform,opacity,visibility' });
      },
    };
  }

  // если библиотека не загрузилась, текст не остаётся спрятанным
  setTimeout(done, 2500);
  if (window.__s505ready) start();
  else document.addEventListener('s505:ready', start, { once: true });
})();
