import * as THREE from 'three';
import { OrbitControls } from '../vendor/controls/OrbitControls.js';

// Layouts das plantas (metros). z cresce em direção à fachada/varanda.
export const LAYOUTS = {
  A: {
    w: 12, d: 8.9,
    rooms: [
      { n: 'Sala', x: 0, z: 3.4, w: 6.4, d: 4.0, f: 'wood', k: 'sala' },
      { n: 'Varanda gourmet', x: 0, z: 7.4, w: 6.4, d: 1.5, f: 'deck', k: 'varanda' },
      { n: 'Cozinha', x: 0, z: 0, w: 3.4, d: 3.4, f: 'tile', k: 'cozinha' },
      { n: 'Área de serviço', x: 3.4, z: 0, w: 1.4, d: 2.6, f: 'tile', k: 'servico' },
      { n: 'Circulação', x: 3.4, z: 2.6, w: 3.0, d: 0.8, f: 'wood', k: 'circ' },
      { n: 'Suíte', x: 6.4, z: 5.0, w: 4.2, d: 3.9, f: 'wood', k: 'suite' },
      { n: 'Banho suíte', x: 10.6, z: 5.0, w: 1.4, d: 3.0, f: 'tile', k: 'banho' },
      { n: 'Quarto 2', x: 6.4, z: 1.6, w: 3.0, d: 3.4, f: 'wood', k: 'quarto' },
      { n: 'Quarto 3', x: 9.4, z: 1.6, w: 2.6, d: 3.4, f: 'wood', k: 'quarto' },
      { n: 'Banho social', x: 6.4, z: 0, w: 2.4, d: 1.6, f: 'tile', k: 'banho' },
      { n: 'Hall íntimo', x: 8.8, z: 0, w: 3.2, d: 1.6, f: 'wood', k: 'circ' },
      { n: 'Cozinha · apoio', x: 4.8, z: 0, w: 1.6, d: 2.6, f: 'tile', k: 'circ', hide: true },
    ],
  },
  B: {
    w: 9.6, d: 8.1,
    rooms: [
      { n: 'Sala', x: 0, z: 3.2, w: 5.2, d: 3.6, f: 'wood', k: 'sala' },
      { n: 'Varanda', x: 0, z: 6.8, w: 5.2, d: 1.3, f: 'deck', k: 'varanda' },
      { n: 'Cozinha', x: 0, z: 0, w: 3.0, d: 3.2, f: 'tile', k: 'cozinha' },
      { n: 'Área de serviço', x: 3.0, z: 0, w: 1.3, d: 2.4, f: 'tile', k: 'servico' },
      { n: 'Circulação', x: 3.0, z: 2.4, w: 2.2, d: 0.8, f: 'wood', k: 'circ' },
      { n: 'Suíte', x: 5.2, z: 4.4, w: 3.2, d: 3.7, f: 'wood', k: 'suite' },
      { n: 'Banho suíte', x: 8.4, z: 4.4, w: 1.2, d: 3.2, f: 'tile', k: 'banho' },
      { n: 'Quarto 2', x: 6.6, z: 1.4, w: 3.0, d: 3.0, f: 'wood', k: 'quarto' },
      { n: 'Banho social', x: 5.2, z: 1.4, w: 1.4, d: 3.0, f: 'tile', k: 'banho' },
      { n: 'Hall íntimo', x: 4.3, z: 0, w: 5.3, d: 1.4, f: 'wood', k: 'circ' },
    ],
  },
};

export function ambientes(tipo) {
  return LAYOUTS[tipo].rooms.filter((r) => !r.hide).map((r) => [r.n, +(r.w * r.d).toFixed(1)]);
}

const FLOOR = { wood: '#b88a5a', deck: '#8a6a4a', tile: '#d9d6cf' };
const FLOOR2D = { wood: '#e9d3b2', deck: '#c9a57f', tile: '#e6e8ea' };

// Planta humanizada 2D em SVG (vista de cima)
export function planSVG(tipo, { labels = true } = {}) {
  const L = LAYOUTS[tipo]; const s = 30; const pad = 8; const W = L.w * s + pad * 2, H = L.d * s + pad * 2;
  const fy = (z) => pad + (L.d - z) * s; // fachada em cima? não: varanda embaixo
  const Y = (z) => pad + z * s;
  let out = `<svg viewBox="0 0 ${W} ${H}" class="plan2d" role="img" aria-label="Planta humanizada ${tipo === 'A' ? '3 quartos' : '2 quartos'}">`;
  out += `<rect x="${pad - 3}" y="${pad - 3}" width="${L.w * s + 6}" height="${L.d * s + 6}" fill="#2b2b33" rx="2"/>`;
  L.rooms.forEach((r) => {
    out += `<rect x="${pad + r.x * s}" y="${Y(r.z)}" width="${r.w * s}" height="${r.d * s}" fill="${FLOOR2D[r.f]}" stroke="#2b2b33" stroke-width="3"/>`;
    if (r.f === 'wood') for (let i = 1; i < r.w * 3; i++) out += `<line x1="${pad + r.x * s + i * 10}" y1="${Y(r.z) + 2}" x2="${pad + r.x * s + i * 10}" y2="${Y(r.z) + r.d * s - 2}" stroke="#d9bf9a" stroke-width=".6"/>`;
    out += furn2d(r, s, pad, Y);
    if (labels && !r.hide && r.w * r.d > 3) out += `<text x="${pad + (r.x + r.w / 2) * s}" y="${Y(r.z + r.d / 2) + 3}" text-anchor="middle" font-size="${r.w < 2 ? 6.5 : 8}" fill="#3a3326" font-weight="600">${r.n}</text>`;
  });
  return out + '</svg>';
}
function furn2d(r, s, pad, Y) {
  const X = (x) => pad + (r.x + x) * s, Z = (z) => Y(r.z + z);
  const rect = (x, z, w, d, c, rx = 2) => `<rect x="${X(x)}" y="${Z(z)}" width="${w * s}" height="${d * s}" rx="${rx}" fill="${c}"/>`;
  switch (r.k) {
    case 'sala': return rect(0.4, r.d - 1.3, 2.6, 0.9, '#7a7f8c', 4) + rect(1.0, r.d - 2.5, 1.3, 0.7, '#c9a37a') + rect(0.3, 0.2, 2.2, 0.35, '#5b5148') + rect(r.w - 2.4, 0.6, 1.8, 1.1, '#8b6a4c', 6);
    case 'varanda': return `<circle cx="${X(r.w / 2)}" cy="${Z(r.d / 2)}" r="${0.45 * s}" fill="#e0c9a2"/>` + rect(0.3, 0.3, 1.4, 0.6, '#6f7a68', 4);
    case 'cozinha': return rect(0.1, 0.1, r.w - 0.2, 0.6, '#9aa0a8') + rect(0.1, 0.7, 0.6, r.d - 1.0, '#9aa0a8') + rect(1.2, 1.5, 1.4, 0.8, '#f0ede6');
    case 'suite': return rect(0.6, 0.5, 1.8, 2.0, '#f3f1ec', 4) + rect(0.6, 0.5, 1.8, 0.4, '#8d97b0') + rect(r.w - 0.7, 0.2, 0.55, 2.4, '#b9a07f');
    case 'quarto': return rect(0.2, 0.3, 0.95, 1.9, '#f3f1ec', 4) + rect(r.w - 1.2, r.d - 0.7, 1.0, 0.5, '#a88b67');
    case 'banho': return rect(0.1, 0.1, Math.min(0.9, r.w - 0.2), 0.45, '#ffffff') + `<circle cx="${X(r.w / 2)}" cy="${Z(r.d - 0.4)}" r="${0.2 * s}" fill="#fff"/>`;
    case 'servico': return rect(0.15, 0.15, 0.6, 0.6, '#ffffff');
    default: return '';
  }
}

// Planta 3D mobiliada
export function createPlan3D(container, tipo, { onReady } = {}) {
  const L = LAYOUTS[tipo];
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement); renderer.domElement.className = 'gl';
  const scene = new THREE.Scene(); scene.background = null;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  camera.position.set(L.w * 0.2, L.w * 1.05, L.d * 1.55);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.9;
  controls.target.set(0, 0, 0); controls.maxPolarAngle = Math.PI * 0.42; controls.minDistance = 6; controls.maxDistance = 30;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6655aa, 1.4));
  const sun = new THREE.DirectionalLight(0xfff1dd, 2.2); sun.position.set(6, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(sun);

  const g = new THREE.Group(); g.position.set(-L.w / 2, 0, -L.d / 2); scene.add(g);
  const M = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const box = (w, h, d, mat, x, y, z, parent = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };

  // anel/brilho no chão
  const ring = new THREE.Mesh(new THREE.RingGeometry(L.w * 0.72, L.w * 0.74, 96), new THREE.MeshBasicMaterial({ color: 0x8b5cff, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.24; scene.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(L.w * 0.72, 96), new THREE.MeshBasicMaterial({ color: 0x1a1240, transparent: true, opacity: 0.6 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = -0.25; scene.add(disc);

  box(L.w + 0.4, 0.3, L.d + 0.4, M(0x2a2a31), L.w / 2, -0.1, L.d / 2);
  const wallMat = M(0xf4f1ea, 0.85); const wallH = 2.5; const t = 0.12;
  const labels = [];
  L.rooms.forEach((r) => {
    box(r.w, 0.06, r.d, M(FLOOR[r.f], r.f === 'tile' ? 0.35 : 0.65), r.x + r.w / 2, 0.06, r.z + r.d / 2);
    // paredes (varanda tem só mureta de vidro na frente)
    const h = r.k === 'varanda' ? 1.1 : wallH;
    const wm = r.k === 'varanda' ? new THREE.MeshStandardMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.35, roughness: 0.05 }) : wallMat;
    if (r.k !== 'varanda') {
      box(r.w, h, t, wallMat, r.x + r.w / 2, h / 2, r.z);
      box(t, h, r.d, wallMat, r.x, h / 2, r.z + r.d / 2);
      box(t, h, r.d, wallMat, r.x + r.w, h / 2, r.z + r.d / 2);
      // parede frontal com vão de porta
      if (r.k === 'sala') { box(r.w * 0.2, h, t, wallMat, r.x + r.w * 0.1, h / 2, r.z + r.d); box(r.w * 0.2, h, t, wallMat, r.x + r.w * 0.9, h / 2, r.z + r.d); box(r.w, 0.3, t, wallMat, r.x + r.w / 2, h - 0.15, r.z + r.d); }
      else { const gap = 0.9; box((r.w - gap) * 0.75, h, t, wallMat, r.x + ((r.w - gap) * 0.75) / 2, h / 2, r.z + r.d); box((r.w - gap) * 0.25, h, t, wallMat, r.x + r.w - ((r.w - gap) * 0.25) / 2, h / 2, r.z + r.d); }
    } else box(r.w, h, 0.05, wm, r.x + r.w / 2, h / 2, r.z + r.d);
    furnish(r);
    if (!r.hide) labels.push({ r, el: null, pos: new THREE.Vector3(r.x + r.w / 2 - L.w / 2, 2.7, r.z + r.d / 2 - L.d / 2) });
  });

  function furnish(r) {
    const cx = r.x, cz = r.z;
    const fabric = M(0x7a7f8c, 0.95), wood = M(0x8b6a4c, 0.6), light = M(0xf0ede6, 0.5), steel = M(0xb8bcc4, 0.3, 0.6), linen = M(0xf6f4ef, 0.95), blue = M(0x6d7ba8, 0.9), orange = M(0xe07a3a, 0.6);
    switch (r.k) {
      case 'sala': {
        box(2.6, 0.45, 0.9, fabric, cx + 1.7, 0.3, cz + r.d - 0.85); box(2.6, 0.5, 0.2, fabric, cx + 1.7, 0.6, cz + r.d - 0.35);
        box(1.2, 0.35, 0.6, wood, cx + 1.7, 0.25, cz + r.d - 2.0);
        box(3.2, 0.02, 2.2, M(0xc9c1b4, 1), cx + 1.7, 0.1, cz + r.d - 1.6);
        box(2.2, 0.5, 0.4, M(0x3e3832), cx + 1.7, 0.35, cz + 0.3); box(1.6, 0.9, 0.05, M(0x0b0b0e, 0.2), cx + 1.7, 1.25, cz + 0.2);
        // mesa de jantar laranja
        box(1.8, 0.06, 1.0, orange, cx + r.w - 1.6, 0.78, cz + 1.3); [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].forEach(([a, b]) => box(0.05, 0.75, 0.05, wood, cx + r.w - 1.6 + a, 0.4, cz + 1.3 + b));
        [-0.5, 0, 0.5].forEach((a) => { box(0.42, 0.45, 0.42, light, cx + r.w - 1.6 + a, 0.3, cz + 0.55); box(0.42, 0.45, 0.42, light, cx + r.w - 1.6 + a, 0.3, cz + 2.05); });
        break;
      }
      case 'varanda': {
        const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24), M(0xe0c9a2)); tb.position.set(cx + r.w / 2, 0.75, cz + r.d / 2); tb.castShadow = true; g.add(tb);
        box(1.4, 0.4, 0.6, M(0x6f7a68, 0.9), cx + 1.0, 0.3, cz + 0.5); box(0.6, 0.9, 0.6, M(0x2e5b3a, 0.9), cx + r.w - 0.5, 0.5, cz + 0.5);
        break;
      }
      case 'cozinha': {
        box(r.w - 0.2, 0.9, 0.6, light, cx + r.w / 2, 0.5, cz + 0.4); box(0.6, 0.9, r.d - 1.0, light, cx + 0.4, 0.5, cz + 0.7 + (r.d - 1.0) / 2);
        box(r.w - 0.2, 0.04, 0.62, M(0x2b2b2f, 0.2), cx + r.w / 2, 0.97, cz + 0.4); box(0.7, 1.9, 0.65, steel, cx + r.w - 0.5, 0.95, cz + 0.4);
        box(1.4, 0.9, 0.8, light, cx + 1.9, 0.5, cz + 1.9); break;
      }
      case 'suite': {
        box(1.8, 0.45, 2.0, linen, cx + 1.5, 0.3, cz + 1.5); box(1.8, 0.12, 0.7, blue, cx + 1.5, 0.58, cz + 2.1); box(1.9, 1.0, 0.1, wood, cx + 1.5, 0.6, cz + 0.45);
        box(0.45, 0.5, 0.4, wood, cx + 0.3, 0.3, cz + 0.7); box(0.45, 0.5, 0.4, wood, cx + 2.7, 0.3, cz + 0.7);
        box(0.55, 2.2, 2.4, M(0xb9a07f, 0.6), cx + r.w - 0.4, 1.15, cz + 1.4); break;
      }
      case 'quarto': {
        box(0.95, 0.42, 1.9, linen, cx + 0.65, 0.28, cz + 1.25); box(0.95, 0.1, 0.6, M(0xa6c2a0), cx + 0.65, 0.53, cz + 1.8);
        box(1.0, 0.05, 0.5, wood, cx + r.w - 0.7, 0.75, cz + r.d - 0.45); box(0.42, 0.45, 0.42, light, cx + r.w - 0.7, 0.3, cz + r.d - 0.9); break;
      }
      case 'banho': {
        box(Math.min(0.9, r.w - 0.3), 0.85, 0.45, light, cx + 0.15 + Math.min(0.9, r.w - 0.3) / 2, 0.45, cz + 0.32);
        box(0.38, 0.4, 0.55, M(0xffffff, 0.2), cx + r.w / 2, 0.25, cz + r.d - 0.55);
        const gl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.0, 1.0), new THREE.MeshStandardMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.3 })); gl.position.set(cx + r.w - 0.9, 1.0, cz + r.d / 2); g.add(gl); break;
      }
      case 'servico': box(0.6, 0.85, 0.6, M(0xffffff, 0.3), cx + 0.45, 0.45, cz + 0.45); break;
    }
  }

  const overlay = document.createElement('div'); overlay.className = 'gl-overlay'; container.appendChild(overlay);
  labels.forEach((l) => { l.el = document.createElement('div'); l.el.className = 'room-label'; l.el.innerHTML = `<b>${l.r.n}</b><span>${(l.r.w * l.r.d).toFixed(1).replace('.', ',')} m²</span>`; overlay.appendChild(l.el); });

  const v = new THREE.Vector3();
  function resize() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  let raf;
  (function loop() {
    raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera);
    labels.forEach((l) => { v.copy(l.pos).project(camera); l.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * container.clientWidth}px, ${(-v.y * 0.5 + 0.5) * container.clientHeight}px) translate(-50%,-50%)`; });
  })();
  onReady?.();
  return {
    toggleSpin() { controls.autoRotate = !controls.autoRotate; return controls.autoRotate; },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss?.(); container.innerHTML = ''; },
  };
}
