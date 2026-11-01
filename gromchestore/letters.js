// Объёмное слово ГРОМЧЕ: буквы нарисованы вручную, чем громче, тем они глубже
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const poly = pts => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => s[i ? 'lineTo' : 'moveTo'](x, y));
  s.closePath();
  return s;
};

function letterR() {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.26, 0); s.lineTo(0.26, 0.34); s.lineTo(0.42, 0.34);
  s.absarc(0.42, 0.67, 0.33, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(0, 1); s.closePath();
  const h = new THREE.Path();
  h.moveTo(0.26, 0.56); h.lineTo(0.42, 0.56);
  h.absarc(0.42, 0.67, 0.11, -Math.PI / 2, Math.PI / 2, false);
  h.lineTo(0.26, 0.78); h.closePath();
  s.holes.push(h);
  return { shape: s, w: 0.75 };
}

function letterO() {
  const s = new THREE.Shape();
  s.absellipse(0.5, 0.5, 0.5, 0.52, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absellipse(0.5, 0.5, 0.23, 0.27, 0, Math.PI * 2, true);
  s.holes.push(h);
  return { shape: s, w: 1 };
}

const LETTERS = [
  { shape: poly([[0, 0], [0.26, 0], [0.26, 0.78], [0.62, 0.78], [0.62, 1], [0, 1]]), w: 0.62 },
  letterR(),
  letterO(),
  { shape: poly([[0, 0], [0.25, 0], [0.25, 0.6], [0.47, 0.18], [0.59, 0.18], [0.81, 0.6], [0.81, 0], [1.06, 0], [1.06, 1], [0.79, 1], [0.53, 0.52], [0.27, 1], [0, 1]]), w: 1.06 },
  { shape: poly([[0.46, 0], [0.72, 0], [0.72, 1], [0.46, 1], [0.46, 0.64], [0.26, 0.64], [0.26, 1], [0, 1], [0, 0.56], [0.07, 0.42], [0.22, 0.38], [0.46, 0.38]]), w: 0.72 },
  { shape: poly([[0, 0], [0.66, 0], [0.66, 0.22], [0.26, 0.22], [0.26, 0.4], [0.6, 0.4], [0.6, 0.6], [0.26, 0.6], [0.26, 0.78], [0.66, 0.78], [0.66, 1], [0, 1]]), w: 0.66 },
];

const GAP = 0.16;
const TOTAL = LETTERS.reduce((n, l) => n + l.w, 0) + GAP * (LETTERS.length - 1);

export function mountLetters(canvas, reduced) {
  const box = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 4, 6);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 100);
  const mat = new THREE.MeshPhysicalMaterial({ color: '#16161A', roughness: 0.42, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5 });

  let x = -TOTAL / 2;
  const meshes = LETTERS.map((l, i) => {
    const geo = new THREE.ExtrudeGeometry(l.shape, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 5, curveSegments: 48 });
    geo.translate(-l.w / 2, -0.5, -0.17);
    const m = new THREE.Mesh(geo, mat);
    m.position.x = x + l.w / 2;
    m.userData.i = i;
    x += l.w + GAP;
    scene.add(m);
    return m;
  });

  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = (TOTAL * 0.53) / (Math.tan(THREE.MathUtils.degToRad(8)) * camera.aspect);
    camera.updateProjectionMatrix();
  }

  const state = { v: 0.35, sv: 0.35, mx: 0, my: 0, smx: 0, smy: 0, color: new THREE.Color('#16161A') };
  addEventListener('pointermove', e => {
    state.mx = e.clientX / innerWidth - 0.5;
    state.my = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  function draw(now) {
    const k = reduced ? 1 : 0.08;
    state.sv += (state.v - state.sv) * k;
    state.smx += (state.mx - state.smx) * k;
    state.smy += (state.my - state.smy) * k;
    mat.color.lerp(state.color, reduced ? 1 : 0.08);
    const t = now / 1000;
    for (const m of meshes) {
      const i = m.userData.i;
      m.scale.z = 0.2 + state.sv * 0.85;
      const wave = reduced ? 0 : Math.sin(t * 0.7 + i * 0.7) * 0.02 * state.sv;
      m.rotation.y = -0.1 * state.sv + state.smx * 0.22 + wave;
      m.rotation.x = 0.06 * state.sv + state.smy * 0.12 + Math.min(scrollY / innerHeight, 1) * 0.5;
    }
    renderer.render(scene, camera);
  }

  resize();
  new ResizeObserver(() => { resize(); draw(performance.now()); }).observe(box);
  if (!reduced) {
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);
    const loop = now => { requestAnimationFrame(loop); if (visible) draw(now); };
    requestAnimationFrame(loop);
  } else draw(0);

  return (v, color) => {
    state.v = v;
    state.color.set(color);
    if (reduced) { draw(0); }
  };
}
