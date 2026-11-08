import * as THREE from 'three';
import { OrbitControls } from '../vendor/controls/OrbitControls.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/postprocessing/OutputPass.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';

// Dimensões do prédio
const BAY = 3.4, CORE = 2.4, W = BAY * 4 + CORE, D = 11, FH = 3, LOBBY = 4.2, FLOORS = 8;
const TOP = LOBBY + FLOORS * FH;

function rand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function windowTexture(cols, rows, litRatio, seed, warm = true) {
  const c = document.createElement('canvas'); c.width = cols * 16; c.height = rows * 16;
  const g = c.getContext('2d'); const r = rand(seed);
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (r() < litRatio) {
      const t = r();
      g.fillStyle = warm ? (t < 0.6 ? '#ffcf7a' : t < 0.85 ? '#ffe9b8' : '#9fc6ff') : '#cfe3ff';
      g.globalAlpha = 0.55 + r() * 0.45;
      g.fillRect(x * 16 + 3, y * 16 + 3, 10, 9);
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function facadeTexture(cols, rows, seed) {
  const c = document.createElement('canvas'); c.width = cols * 16; c.height = rows * 16;
  const g = c.getContext('2d'); const r = rand(seed);
  g.fillStyle = '#9a9aa6'; g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const v = 40 + Math.floor(r() * 30); g.fillStyle = `rgb(${v},${v + 6},${v + 18})`;
    g.fillRect(x * 16 + 3, y * 16 + 3, 10, 9);
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function skyTexture(stops) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512); stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function boxUV(w, h, d, scale) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv; const n = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    const sx = nx > 0.5 ? d : w; const sy = ny > 0.5 ? d : h;
    uv.setXY(i, uv.getX(i) * sx / scale, uv.getY(i) * sy / scale);
  }
  return geo;
}

export const LIGHTING = ['noite', 'por-do-sol', 'dia'];

export function createBuilding(container, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = 'gl';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 900);
  const HOME = { pos: new THREE.Vector3(34, 21, 58), target: new THREE.Vector3(0, 15, 0) };
  camera.position.copy(HOME.pos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.target); controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.minDistance = 14; controls.maxDistance = 130; controls.maxPolarAngle = Math.PI * 0.49; controls.minPolarAngle = 0.15;
  controls.autoRotateSpeed = 0.6; controls.enablePan = true;

  // Luzes
  const hemi = new THREE.HemisphereLight(0x8090ff, 0x101018, 0.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); sun.position.set(-40, 60, 50); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 50, bottom: -20, far: 220 }); scene.add(sun);
  const lobbyLight = new THREE.PointLight(0xffb36b, 60, 26, 1.6); lobbyLight.position.set(0, 2.5, D / 2 + 3); scene.add(lobbyLight);
  const crownLight = new THREE.PointLight(0x8b5cff, 50, 30, 1.6); crownLight.position.set(0, TOP + 3, 0); scene.add(crownLight);

  // Chão, rua, orla e mar
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1b22, roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(W + 14, 0.3, D + 12), new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.8 }));
  plaza.position.set(0, 0.15, 1); plaza.receiveShadow = true; scene.add(plaza);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(600, 9), new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.6 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, D / 2 + 12); scene.add(road);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(600, 14), new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.03, D / 2 + 23.5); scene.add(sand);
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x0a1a33, roughness: 0.18, metalness: 0.7 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.04, D / 2 + 230); scene.add(sea);

  // Postes de luz na orla
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffc070, emissiveIntensity: 3 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.6 });
  const lampGroup = new THREE.Group(); scene.add(lampGroup);
  for (let x = -60; x <= 60; x += 12) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5), poleMat); pole.position.set(x, 2.5, D / 2 + 16.8); lampGroup.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), lampMat); bulb.position.set(x, 5.1, D / 2 + 16.8); lampGroup.add(bulb);
  }
  // Coqueiros
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f5a35, roughness: 0.9 });
  [[-11, 8.5], [11, 8.5], [-15, 2], [15, 2], [-30, 21], [-18, 21], [6, 21], [24, 21], [40, 21]].forEach(([x, z], i) => {
    const h = 5 + (i % 3);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h, 6), trunkMat); t.position.set(x, h / 2, z); t.castShadow = true; scene.add(t);
    for (let k = 0; k < 6; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3, 4), leafMat);
      leaf.position.set(x, h, z); leaf.rotation.z = Math.PI / 2.6; leaf.rotation.y = (k / 6) * Math.PI * 2;
      leaf.geometry.translate(0, 1.5, 0); scene.add(leaf);
    }
  });

  // Cidade ao redor
  const r = rand(42); const cityGeos = [];
  for (let i = 0; i < 170; i++) {
    const ang = r() * Math.PI * 2; const dist = 34 + r() * 150;
    const x = Math.cos(ang) * dist; const z = Math.sin(ang) * dist - 30;
    if (z > D / 2 + 8) continue; if (Math.abs(x) < 20 && z > -22) continue;
    const w = 7 + r() * 12, d = 7 + r() * 12, h = 8 + Math.pow(r(), 1.6) * 70;
    const g = boxUV(w, h, d, 48); g.translate(x, h / 2, z); cityGeos.push(g);
  }
  const cityLit = windowTexture(16, 16, 0.42, 7);
  const cityBase = facadeTexture(16, 16, 9);
  const cityMat = new THREE.MeshStandardMaterial({ map: cityBase, emissiveMap: cityLit, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.8, color: 0x5b5e70 });
  const city = new THREE.Mesh(mergeGeometries(cityGeos), cityMat); city.receiveShadow = true; scene.add(city);

  // ===== Torre =====
  const tower = new THREE.Group(); scene.add(tower);
  const white = new THREE.MeshStandardMaterial({ color: 0xece7df, roughness: 0.55 });
  const beige = new THREE.MeshStandardMaterial({ color: 0xcfc3b0, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23232b, roughness: 0.5, metalness: 0.2 });
  const sideLit = windowTexture(6, 16, 0.55, 11);
  const sideBase = facadeTexture(6, 16, 13);
  const sideMat = new THREE.MeshStandardMaterial({ map: sideBase, emissiveMap: sideLit, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.6 });
  const add = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; tower.add(m); return m; };

  // Corpo (laterais e fundo com janelas texturizadas)
  const body = new THREE.BoxGeometry(W - 0.4, FLOORS * FH, D - 1.2);
  {
    const uv = body.attributes.uv; const n = body.attributes.normal;
    for (let i = 0; i < uv.count; i++) {
      const sx = Math.abs(n.getX(i)) > 0.5 ? (D - 1.2) : (W - 0.4);
      uv.setXY(i, (uv.getX(i) * sx) / (sx > 12 ? 13 : 9.5), uv.getY(i) * (FLOORS / 16) * 2);
    }
  }
  const bodyMesh = add(body, [sideMat, sideMat, white, white, dark, sideMat], 0, LOBBY + (FLOORS * FH) / 2, -0.6);

  // Térreo / lobby
  const glassWarm = new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffa95a, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.3 });
  add(new THREE.BoxGeometry(W - 2, LOBBY - 0.4, D - 2), glassWarm, 0, (LOBBY - 0.4) / 2 + 0.3, -0.4);
  add(new THREE.BoxGeometry(W + 1.2, 0.45, D + 0.6), white, 0, LOBBY - 0.2, 0);
  add(new THREE.BoxGeometry(6, 0.25, 3.2), white, 0, 3.2, D / 2 + 1.6);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.7, LOBBY, 0.7), white, sx * (W / 2 - 0.35), LOBBY / 2, D / 2 - 0.35);

  // Núcleo de circulação (vidro)
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x1b2a40, emissive: 0x5a7cff, emissiveIntensity: 0.25, roughness: 0.15, metalness: 0.6 });
  add(new THREE.BoxGeometry(CORE - 0.3, FLOORS * FH, 0.3), coreMat, 0, LOBBY + (FLOORS * FH) / 2, D / 2 - 0.5);

  // Pilares brancos entre baias
  const bayX = (col) => { const left = -W / 2 + BAY / 2; return col <= 2 ? left + (col - 1) * BAY : left + (col - 1) * BAY + CORE; };
  const pillarXs = [-W / 2, -W / 2 + BAY, -W / 2 + 2 * BAY, W / 2 - 2 * BAY, W / 2 - BAY, W / 2];
  pillarXs.forEach((x) => add(new THREE.BoxGeometry(0.42, FLOORS * FH + 0.4, 1.3), white, x, LOBBY + (FLOORS * FH) / 2, D / 2 - 0.1));

  // Unidades: painel envidraçado + laje/varanda + guarda-corpo
  const glassRail = new THREE.MeshStandardMaterial({ color: 0x9fc3ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.4, depthWrite: false });
  const mullion = new THREE.MeshStandardMaterial({ color: 0x15151b, roughness: 0.4 });
  const units = new Map(); const pickables = [];
  for (let f = 1; f <= FLOORS; f++) {
    const y0 = LOBBY + (f - 1) * FH;
    add(new THREE.BoxGeometry(W + 0.5, 0.32, 1.9), f % 2 ? white : beige, 0, y0 + 0.16, D / 2 + 0.25);
    for (let col = 1; col <= 4; col++) {
      const num = f * 100 + col; const x = bayX(col);
      const mat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x22c55e, emissiveIntensity: 1.4, roughness: 0.35, metalness: 0.1 });
      const panel = add(new THREE.BoxGeometry(BAY - 0.55, FH - 0.75, 0.12), mat, x, y0 + 0.32 + (FH - 0.75) / 2 + 0.05, D / 2 - 0.62, false);
      panel.userData.num = num; pickables.push(panel);
      [-0.34, 0, 0.34].forEach((k) => add(new THREE.BoxGeometry(0.05, FH - 0.75, 0.05), mullion, x + k * (BAY - 0.55), panel.position.y, D / 2 - 0.54, false));
      add(new THREE.BoxGeometry(BAY - 0.55, 0.05, 0.05), mullion, x, y0 + 1.25, D / 2 - 0.54, false);
      add(new THREE.BoxGeometry(BAY - 0.3, 1.05, 0.04), glassRail, x, y0 + 0.32 + 0.52, D / 2 + 1.15, false);
      add(new THREE.BoxGeometry(BAY - 0.3, 0.05, 0.08), white, x, y0 + 0.32 + 1.05, D / 2 + 1.15, false);
      // Hitbox maior (facilita clique no celular)
      const hit = new THREE.Mesh(new THREE.BoxGeometry(BAY - 0.1, FH - 0.1, 2.2), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(x, y0 + FH / 2, D / 2 + 0.2); hit.userData.num = num; tower.add(hit); pickables.push(hit);
      units.set(num, { panel, mat, x, y: y0 + FH / 2, z: D / 2 + 0.4, base: { color: 0x22c55e, intensity: 1.4 } });
    }
  }
  // Coroamento com LED
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x8b5cff, emissiveIntensity: 4 });
  add(new THREE.BoxGeometry(W + 0.6, 0.5, D + 0.2), white, 0, TOP + 0.25, 0);
  add(new THREE.BoxGeometry(W - 3, 2.6, D - 3), dark, 0, TOP + 1.8, -0.5);
  add(new THREE.BoxGeometry(W + 0.62, 0.08, 0.08), ledMat, 0, TOP + 0.52, D / 2 + 0.12, false);
  add(new THREE.BoxGeometry(W - 2.9, 0.08, 0.08), ledMat, 0, TOP + 3.12, D / 2 - 1.95, false);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.08, 0.08, D + 0.22), ledMat, sx * (W / 2 + 0.31), TOP + 0.52, 0, false);
  add(new THREE.BoxGeometry(4, 1.6, 3), white, 3, TOP + 3.9, -1.5);

  // Destaque de seleção
  const selBox = new THREE.Mesh(new THREE.BoxGeometry(BAY + 0.1, FH + 0.1, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.9 }));
  selBox.visible = false; tower.add(selBox);
  const hoverBox = new THREE.Mesh(new THREE.BoxGeometry(BAY, FH, 2.3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false }));
  hoverBox.visible = false; tower.add(hoverBox);

  // Pós-processamento (bloom)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.55, 0.62); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Rótulos HTML
  const overlay = document.createElement('div'); overlay.className = 'gl-overlay'; container.appendChild(overlay);
  const tip = document.createElement('div'); tip.className = 'gl-tip'; tip.hidden = true; overlay.appendChild(tip);
  let badges = new Map();

  let selected = null, hovered = null, filter = null, lighting = 'noite';
  let colorFn = () => ({ color: 0x22c55e, intensity: 1.4 });
  let badgeFn = () => null; let tipFn = (n) => `Apto ${n}`;

  function applyColors() {
    units.forEach((u, num) => {
      const c = colorFn(num); u.base = c;
      u.mat.emissive.setHex(c.color);
      const dim = filter && !filter(num) ? 0.12 : 1;
      u.mat.emissiveIntensity = c.intensity * dim * (lighting === 'dia' ? 0.9 : 1);
    });
    badges.forEach((el) => el.remove()); badges = new Map();
    units.forEach((u, num) => {
      const b = badgeFn(num); if (!b) return;
      const el = document.createElement('button'); el.className = 'gl-badge ' + (b.cls || ''); el.innerHTML = b.html; el.dataset.num = num;
      el.setAttribute('aria-label', `Apto ${num}`);
      el.addEventListener('click', (e) => { e.stopPropagation(); opts.onPick?.(num); });
      overlay.appendChild(el); badges.set(num, el);
    });
  }

  function setLighting(mode) {
    lighting = mode;
    const night = mode === 'noite', dusk = mode === 'por-do-sol', day = mode === 'dia';
    scene.background = night ? skyTexture([[0, '#03040b'], [0.6, '#0b0d22'], [1, '#1a1636']])
      : dusk ? skyTexture([[0, '#2a1b4d'], [0.45, '#b04a5a'], [0.75, '#ff8a4c'], [1, '#ffc27a']])
        : skyTexture([[0, '#5d9be0'], [0.7, '#a9cdf2'], [1, '#e6f0fa']]);
    scene.fog = new THREE.Fog(night ? 0x0b0d1f : dusk ? 0xd9785a : 0xc9def2, 90, 320);
    hemi.color.setHex(night ? 0x5a66c8 : dusk ? 0xffb38a : 0xdfeaff); hemi.groundColor.setHex(night ? 0x0a0a12 : 0x3a3030);
    hemi.intensity = night ? 0.35 : dusk ? 0.9 : 1.5;
    sun.color.setHex(night ? 0x8fa2ff : dusk ? 0xff9a55 : 0xffffff); sun.intensity = night ? 0.35 : dusk ? 2.6 : 2.4;
    sun.position.set(dusk ? -70 : -40, dusk ? 18 : 70, dusk ? 30 : 50);
    cityMat.emissiveIntensity = night ? 0.62 : dusk ? 0.3 : 0.0; cityMat.color.setHex(night ? 0x6a6e86 : day ? 0xb7bccb : 0x9a8f98);
    sideMat.emissiveIntensity = night ? 0.6 : dusk ? 0.3 : 0.0;
    glassWarm.emissiveIntensity = night ? 0.55 : 0.25; lampMat.emissiveIntensity = night ? 1.6 : dusk ? 1 : 0.2;
    lobbyLight.intensity = night ? 25 : 8; crownLight.intensity = night ? 50 : 10; ledMat.emissiveIntensity = night ? 4 : dusk ? 2.5 : 1.2;
    seaMat.color.setHex(night ? 0x08152b : dusk ? 0x5a3a5a : 0x2a6aa8);
    groundMat.color.setHex(night ? 0x16171e : 0x5b5a5f);
    renderer.toneMappingExposure = night ? 1.0 : dusk ? 1.0 : 1.05;
    bloom.strength = night ? 0.42 : dusk ? 0.3 : 0.15; bloom.threshold = night ? 0.72 : 0.85;
    applyColors();
  }

  // Picking
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  function pick(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    ptr.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1; ptr.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.num : null;
  }
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt) return; const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); downAt = null;
    if (moved > 6) return; const n = pick(e); if (n) opts.onPick?.(n);
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return; const n = pick(e);
    hovered = n; renderer.domElement.style.cursor = n ? 'pointer' : 'grab';
  });
  renderer.domElement.addEventListener('pointerleave', () => { hovered = null; });

  // Animação de câmera
  let camAnim = null;
  function flyTo(pos, target, ms = 900) { camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms }; }
  function select(num, fly = true) {
    selected = num; const u = units.get(num);
    if (!u) { selBox.visible = false; return; }
    selBox.position.set(u.x, u.y, u.z); selBox.visible = true;
    if (fly) {
      const target = new THREE.Vector3(u.x * 0.5, u.y - 1, 2);
      const dir = camera.position.clone().sub(controls.target).setY(0).normalize();
      if (dir.z < 0.3) dir.set(0.45, 0, 0.9).normalize();
      flyTo(target.clone().add(dir.multiplyScalar(52)).setY(u.y + 8), target);
    }
  }
  function clearSelection() { selected = null; selBox.visible = false; }
  function resetView() { flyTo(HOME.pos.clone(), HOME.target.clone()); }

  const v = new THREE.Vector3();
  function project(x, y, z) {
    v.set(x, y, z).project(camera);
    return [(v.x * 0.5 + 0.5) * container.clientWidth, (-v.y * 0.5 + 0.5) * container.clientHeight, v.z];
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h;
    camera.fov = w < 520 ? 48 : 38; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let raf, t = 0, running = true;
  function loop(now) {
    raf = requestAnimationFrame(loop); if (!running) return; t += 0.016;
    if (camAnim) {
      const k = Math.min(1, (now - camAnim.start) / camAnim.ms); const e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(camAnim.p0, camAnim.p1, e); controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
      if (k >= 1) camAnim = null;
    }
    controls.update();
    // brilho pulsante da unidade selecionada
    units.forEach((u, num) => {
      const dim = filter && !filter(num) ? 0.12 : 1;
      let k = u.base.intensity * dim;
      if (num === selected) k = u.base.intensity * (1.35 + Math.sin(t * 4) * 0.35);
      else if (num === hovered) k = u.base.intensity * 1.6;
      u.mat.emissiveIntensity = k;
    });
    if (hovered && units.get(hovered)) { const u = units.get(hovered); hoverBox.visible = true; hoverBox.position.set(u.x, u.y, u.z); } else hoverBox.visible = false;
    selBox.material.opacity = 0.55 + Math.sin(t * 4) * 0.35;

    const tipNum = hovered || selected;
    if (tipNum) {
      const u = units.get(tipNum); const [sx, sy, sz] = project(u.x, u.y + FH / 2 + 0.2, u.z + 1);
      tip.hidden = sz > 1; tip.innerHTML = tipFn(tipNum); tip.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
    } else tip.hidden = true;
    badges.forEach((el, num) => {
      const u = units.get(num); const [sx, sy, sz] = project(u.x, u.y, u.z + 1.2);
      el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`; el.style.display = sz > 1 ? 'none' : '';
    });
    composer.render();
  }
  setLighting('noite');
  raf = requestAnimationFrame(loop);

  return {
    setColors(fn, bfn, tfn) { colorFn = fn; badgeFn = bfn || (() => null); if (tfn) tipFn = tfn; applyColors(); },
    setLighting, getLighting: () => lighting, select, clearSelection, resetView,
    setAutoRotate(b) { controls.autoRotate = b; }, isAutoRotate: () => controls.autoRotate,
    setFilter(fn) { filter = fn; applyColors(); },
    pause(p) { running = !p; },
    resize,
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.innerHTML = ''; },
  };
}
