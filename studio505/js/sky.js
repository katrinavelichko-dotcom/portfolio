/* студия 505: живые облака, нарисованные кодом (WebGL).
   Облака строятся из «шума» (fbm) с завихрением и медленно плывут вправо, меняя форму.
   Бережём телефон (gsap-performance, mobile-native):
   · холст рисуется в пониженном разрешении (облака мягкие, разница не видна) и не чаще 30 кадров в секунду;
   · рисование останавливается, когда холст не виден на экране или вкладка в фоне;
   · при «уменьшить движение» рисуется один неподвижный кадр;
   · без WebGL остаётся спокойный голубой фон из CSS. */
(function () {
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uFront;   // 0 — небо с облаками, 1 — только редкие облака поверх (прозрачный фон)
uniform float uScale;   // размер облаков
uniform float uSeed;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
void main(){
  vec2 st=gl_FragCoord.xy/uRes;
  vec2 uv=gl_FragCoord.xy/uRes.y*uScale;
  float t=uTime*.018;
  vec2 p=uv+vec2(uSeed,uSeed*.37)-vec2(t,0.);
  vec2 q=vec2(fbm(p+vec2(0.,t*.4)),fbm(p+vec2(5.2,1.3)+vec2(t*.25,0.)));
  float n=fbm(p+.85*q);
  float nb=fbm(p+.85*q+vec2(0.,-.05));          /* чуть ниже: свет сверху, тень снизу */
  float cover=mix(.43,.53,uFront);
  float c=smoothstep(cover,cover+.17,n);
  c=pow(c,.8);                                       /* пышнее, плотнее середина облака */
  float lit=clamp(.88+(n-nb)*6.,.64,1.05);
  vec3 cloud=mix(vec3(.74,.79,.89),vec3(1.,.993,.975),lit);
  vec3 sky=mix(vec3(.83,.89,.97),vec3(.42,.58,.88),pow(st.y,1.15));
  if(uFront>.5){
    /* края верхнего слоя тают, чтобы не было видно прямоугольника холста */
    float edge=smoothstep(0.,.22,st.x)*smoothstep(1.,.78,st.x)*smoothstep(0.,.3,st.y)*smoothstep(1.,.7,st.y);
    float a=c*.92*edge;gl_FragColor=vec4(cloud*a,a);}
  else{gl_FragColor=vec4(mix(sky,cloud,c*.96),1.);}
}`;

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const weak = () => (navigator.hardwareConcurrency || 8) <= 4 || matchMedia('(max-width: 760px)').matches;

  function Sky(canvas, { front = false, scale = 1.5, seed = Math.random() * 40 } = {}) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: front, antialias: false });
    if (!gl) { canvas.classList.add('no-gl'); return { stop() {}, start() {} }; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.classList.add('no-gl'); return { stop() {}, start() {} }; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes'), uTime = u('uTime'), uFront = u('uFront'), uScale = u('uScale'), uSeed = u('uSeed');
    gl.uniform1f(uFront, front ? 1 : 0);
    gl.uniform1f(uScale, scale);
    gl.uniform1f(uSeed, seed);

    const resize = () => {
      const q = (weak() ? 0.35 : 0.5) * Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(canvas.clientWidth * q));
      const h = Math.max(2, Math.round(canvas.clientHeight * q));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uRes, w, h);
    };
    const t0 = performance.now() - seed * 1000;
    const draw = (now) => {
      gl.uniform1f(uTime, (now - t0) / 1000);
      if (front) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let raf = 0, last = 0, visible = false, running = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;          // не чаще 30 кадров в секунду
      last = now;
      draw(now);
    };
    const start = () => {
      resize();
      if (reduce()) { draw(t0 + 60000); return; }   // один неподвижный кадр
      if (running || !visible || document.hidden) return;
      running = true; raf = requestAnimationFrame(loop);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { rootMargin: '100px' }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (!running) draw(performance.now()); }, 150); });
    resize();
    draw(performance.now());
    return { start, stop };
  }

  window.S505Sky = Sky;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('canvas[data-sky]').forEach((c) => Sky(c, {
      front: c.dataset.sky === 'front',
      scale: parseFloat(c.dataset.scale || '1.5'),
      seed: parseFloat(c.dataset.seed || String(Math.random() * 40)),
    }));
  });
})();
