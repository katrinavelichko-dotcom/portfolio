// Анимация всего сайта. Без GSAP или при отключённой анимации страница просто остаётся видимой
const load = src => new Promise((ok, fail) => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = ok;
  s.onerror = fail;
  document.head.append(s);
});

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'power3.out';

function pageIntro() {
  const tl = gsap.timeline({ defaults: { ease: EASE, duration: 0.9 } });
  if (document.querySelector('.hero-look')) {
    tl.from('.hero-look', { y: 96, opacity: 0, stagger: 0.12 })
      .from('.hero-mid', { y: 32, opacity: 0, duration: 0.7 }, 0.2);
  }
  if (document.querySelector('.big-title')) tl.from('.big-title', { yPercent: 40, opacity: 0 }, 0);
}

function scrollMotion() {
  gsap.utils.toArray('.big-head').forEach(el => gsap.from(el, {
    yPercent: 48, opacity: 0, duration: 0.9, ease: EASE, scrollTrigger: { trigger: el, start: 'top 90%', once: true },
  }));

  // Большие входы: фото раскрывается при прокрутке
  gsap.utils.toArray('.gate').forEach((el, i) => {
    gsap.from(el.querySelector('span'), { yPercent: 96, opacity: 0, duration: 0.9, ease: EASE, delay: i * 0.1, scrollTrigger: { trigger: el, start: 'top 60%', once: true } });
  });

  if (document.querySelector('.band')) {
    gsap.fromTo('.band', { scale: 0.92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'top 40%', scrub: 1 } });
    gsap.from('.band-text', { y: 64, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top 80%', end: 'top 32%', scrub: 1 } });
  }

  document.querySelectorAll('.gallery .tile img').forEach(img => gsap.from(img, {
    opacity: 0, duration: 0.6, ease: EASE, scrollTrigger: { trigger: img, start: 'top 90%', once: true },
  }));
  document.querySelectorAll('.help-body section').forEach(el => gsap.from(el, {
    y: 48, opacity: 0, duration: 0.8, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  }));

  // Карточки каталога появляются пачками
  const cards = gsap.utils.toArray('.card:not(.rail .card)');
  if (cards.length) {
    gsap.set(cards, { y: 48, opacity: 0 });
    ScrollTrigger.batch(cards, { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: 0.8, ease: EASE, stagger: 0.08 }) });
    // На телефоне высота экрана меняется при прокрутке: пересчитываем точки появления, когда всё загрузилось
    addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  gsap.from('.footer-word', { yPercent: 32, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
}

function marquee() {
  const m = document.querySelector('#marquee');
  if (!m) return;
  const loop = gsap.to(m, { xPercent: -50, duration: 48, ease: 'none', repeat: -1 });
  const speed = v => loop.timeScale(0.5 + v * 2.5);
  speed(+document.querySelector('#vol').value / 100);
  document.addEventListener('volume', e => speed(e.detail));
  // Чем быстрее прокрутка, тем быстрее строка
  ScrollTrigger.create({ trigger: '.marquee', onUpdate: self => {
    const boost = Math.min(Math.abs(self.getVelocity()) / 400, 6);
    gsap.fromTo(loop, { timeScale: 1 + boost }, { timeScale: 0.5 + (+document.querySelector('#vol').value / 100) * 2.5, duration: 1, overwrite: true });
  } });
}

export async function startMotion() {
  if (reduced) return;
  try {
    await load('vendor/gsap.min.js');
    await load('vendor/ScrollTrigger.min.js');
  } catch { return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  pageIntro();
  scrollMotion();
  marquee();
  addEventListener('load', () => ScrollTrigger.refresh());
}

export function popCart() {
  if (window.gsap && !reduced) gsap.fromTo('#cartCount', { scale: 2 }, { scale: 1, duration: 0.5, ease: EASE });
}
