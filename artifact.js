"use strict";

const TAU = Math.PI * 2;
const HALF = Math.PI / 2;
const GEN_COUNT = 10;

function brandInkList() {
  const seen = new Set();
  const list = [];
  (typeof FAL_BRAND_PALETTE !== 'undefined' ? FAL_BRAND_PALETTE : []).forEach(group => {
    group.colors.forEach(hex => {
      const key = String(hex).toUpperCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push([hex, group.label + ' · ' + hex]);
    });
  });
  if (!list.length) {
    return [
      ['#ADFF00', 'Chartreuse'],
      ['#EC0648', 'Red'],
      ['#115EF3', 'Royal'],
      ['#000000', 'Black'],
      ['#FFFFFF', 'White'],
    ];
  }
  return list;
}

function brandGndList() {
  const opts = (typeof BG_COLOR_OPTIONS !== 'undefined' ? BG_COLOR_OPTIONS : [])
    .filter(o => o.value !== 'transparent' && o.value !== 'custom');
  if (!opts.length) {
    return [
      ['#E5E5E5', 'Grey'],
      ['#FFFFFF', 'White'],
      ['#000000', 'Black'],
      ['#E5ECE7', 'Light sage'],
    ];
  }
  return opts.map(o => [o.value, o.label]);
}

function brandSpotWeights() {
  const inks = brandInkList().filter(([hex]) => hex.toUpperCase() !== '#FFFFFF');
  return inks.map(([hex], i) => [hex, Math.max(4, 28 - i * 2)]);
}

const INKS = brandInkList();
const GNDS = brandGndList();
const SPOTS = brandSpotWeights();
const SPOT_TOTAL = SPOTS.reduce((a, s) => a + s[1], 0);
const PLATE = '#ADFF00';

const st = {
  cell: 32,
  seed: 7,
  mode: 'unite',
  tool: 'draw',
  brush: 2.5,
  scatter: 0.55,
  notch: 0.33,
  tiled: 0.62,
  dot: 0.34,
  dotd: 0.55,
  off: 10,
  join: 'miter',
  miterLimit: 4,
  ink: '#000000',
  offink: '#000000',
  strink: '#000000',
  sw: 0,
  gnd: '#FFFFFF',
  pairingId: null,
  animate: false,
  animDuration: 4,
  bakeInOut: true,
  infiniteLoop: false,
  sweepDepth: 55,
  diffusionSoft: 18,
  offsetBreathe: 50,
  spotFlicker: 35,
  motionPreset: 'auto',
};

let cells = new Map();
let W = 800;
let H = 600;
const undos = [];
let prims = null;
let activeGen = 0;
const generations = Array.from({ length: GEN_COUNT }, () => null);
let cycleStart = 0;
let animRaf = 0;
let animProgress = 0;
let animEnvelope = 1;
let animOffsetScale = 1;
let animMorph = 1;
let animBeat = 0;

const key = (ix, iy) => ix + ',' + iy;

function hash(x, y, s) {
  let h = (x * 374761393) ^ (y * 668265263) ^ (s * 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function gridDims() {
  return {
    cols: Math.max(1, Math.ceil(W / st.cell)),
    rows: Math.max(1, Math.ceil(H / st.cell)),
  };
}

function resolveMotionPreset() {
  if (st.motionPreset !== 'auto') return st.motionPreset;
  if (st.mode === 'halftone') return 'spot-flicker';
  if (st.mode === 'offset') return 'offset-breathe';
  return 'fill-grow';
}

function getAnimEnvelope(progress) {
  if (!st.animate || st.infiniteLoop || !st.bakeInOut) return 1;
  const p = clamp(progress, 0, 1);
  const buildEnd = 0.28;
  const fadeStart = 0.72;
  if (p < buildEnd) return smoothstep(0, 1, p / buildEnd);
  if (p > fadeStart) return 1 - smoothstep(0, 1, (p - fadeStart) / (1 - fadeStart));
  return 1;
}

/** Diffusion sweep — same band + stagger language as Glitch Dust. */
function sampleCellDiffusion(ix, iy, progress) {
  const sweepAmt = st.sweepDepth / 100;
  const softAmt = st.diffusionSoft / 100;
  if (sweepAmt <= 0) return 1;

  const { cols, rows } = gridDims();
  const along = iy / Math.max(1, rows - 1);
  const stagger = hash(ix, iy, st.seed + 911) * lerp(0, 0.28, softAmt);
  const sample = clamp(along + stagger * 0.55 - lerp(0, 0.08, softAmt), 0, 1);

  const bandDist = Math.min(
    Math.abs(along - progress),
    Math.abs(along - progress + 1),
    Math.abs(along - progress - 1)
  );
  const bandWidth = lerp(0.06, 0.38, softAmt);
  let band = 1 - smoothstep(0, Math.max(0.02, bandWidth), bandDist);

  if (softAmt > 0) {
    const grain = hash(ix * 3 + 17, iy * 5 + 23, st.seed + Math.floor(progress * 80));
    band *= lerp(0.42, 1, grain);
  }

  if (st.bakeInOut && !st.infiniteLoop && progress < sample) {
    band = lerp(0.06, band, 0.35);
  }

  return lerp(1, 0.08 + band * 0.92, sweepAmt);
}

function getCellAnimMod(ix, iy, density) {
  if (!st.animate) return 1;
  let mod = getAnimEnvelope(animProgress) * sampleCellDiffusion(ix, iy, animProgress);
  const preset = resolveMotionPreset();
  if (preset === 'spot-flicker' || (preset === 'auto' && st.mode === 'halftone')) {
    const flick = st.spotFlicker / 100;
    const on = hash(ix, iy, st.seed + animBeat * 131) > lerp(0.08, 0.55, flick);
    mod *= on ? 1 : lerp(0.12, 0.35, flick);
  }
  return clamp(mod * density, 0, 1);
}

function updateAnimState(ts) {
  if (!cycleStart) cycleStart = ts;
  const dur = Math.max(0.5, st.animDuration) * 1000;
  animProgress = ((ts - cycleStart) % dur) / dur;
  animEnvelope = getAnimEnvelope(animProgress);
  animBeat = Math.floor(animProgress * 10);

  const preset = resolveMotionPreset();
  const breathe = st.offsetBreathe / 100;

  if (preset === 'offset-breathe' || (preset === 'auto' && st.mode === 'offset')) {
    const pulse = 0.5 + 0.5 * Math.sin(animProgress * TAU);
    animOffsetScale = lerp(1 - breathe * 0.82, 1 + breathe * 0.38, pulse);
  } else {
    animOffsetScale = 1;
  }

  if (preset === 'stage-morph') {
    animMorph = animEnvelope * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(animProgress * TAU)));
  } else if (preset === 'auto' && st.mode === 'offset') {
    animMorph = animEnvelope;
  } else {
    animMorph = 1;
  }
}

function getEffectiveOffset() {
  return st.off * (st.animate ? animOffsetScale * animMorph : 1);
}

function getEffectiveStroke() {
  if (!st.animate || st.sw <= 0) return st.sw;
  return Math.max(0, st.sw * animOffsetScale * animMorph);
}

function tickAnim(ts) {
  if (!st.animate) {
    animRaf = 0;
    return;
  }
  updateAnimState(ts);
  invalidate();
  render();
  animRaf = requestAnimationFrame(tickAnim);
}

function setAnimate(on) {
  st.animate = !!on;
  document.querySelectorAll('#animToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.animate === (on ? '1' : '0'));
  });
  if (on) {
    cycleStart = performance.now();
    if (!animRaf) animRaf = requestAnimationFrame(tickAnim);
  } else {
    if (animRaf) cancelAnimationFrame(animRaf);
    animRaf = 0;
    animProgress = 0;
    animEnvelope = 1;
    animOffsetScale = 1;
    animMorph = 1;
    invalidate();
    render();
  }
}

function spotColor(r) {
  let t = r * SPOT_TOTAL;
  for (const [c, w] of SPOTS) {
    if (t < w) return c;
    t -= w;
  }
  return SPOTS[0][0];
}

function invalidate() {
  prims = null;
}

function buildPrims() {
  const cw = st.cell;
  const r = Math.min(cw * st.notch, cw * 0.4995);
  const tile = [];
  const dot = [];
  const pad = st.off + cw;
  for (const [k, v] of cells) {
    const c = k.indexOf(',');
    const ix = +k.slice(0, c);
    const iy = +k.slice(c + 1);
    const x = ix * cw;
    const y = iy * cw;
    if (x > W + pad || y > H + pad || x + cw < -pad || y + cw < -pad) continue;
    const d = v / 255;
    const animMod = getCellAnimMod(ix, iy, d);
    if (animMod <= 0.02) continue;
    const h1 = hash(ix, iy, st.seed);
    const h2 = hash(ix, iy, st.seed + 101);
    const h3 = hash(ix, iy, st.seed + 211);
    if (h1 < st.tiled * (0.4 + 0.6 * d)) tile.push({ x, y, a: animMod });
    else if (h2 < st.dotd) {
      let col = spotColor(h3);
      const preset = resolveMotionPreset();
      if (st.animate && (preset === 'spot-flicker' || (preset === 'auto' && st.mode === 'halftone'))) {
        col = spotColor(hash(ix, iy, st.seed + animBeat * 97 + 311));
      }
      dot.push({
        cx: x + cw / 2,
        cy: y + cw / 2,
        r: cw * st.dot * (0.86 + 0.14 * d),
        col,
        a: animMod,
      });
    }
  }
  return { cw, r, tile, dot };
}

function getPrims() {
  if (st.animate) return buildPrims();
  if (!prims) prims = buildPrims();
  return prims;
}

function tilePath(ctx, x, y, s, r) {
  const x1 = x + s;
  const y1 = y + s;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x1 - r, y);
  ctx.arc(x1, y, r, Math.PI, HALF, true);
  ctx.lineTo(x1, y1 - r);
  ctx.arc(x1, y1, r, 3 * HALF, Math.PI, true);
  ctx.lineTo(x + r, y1);
  ctx.arc(x, y1, r, 0, -HALF, true);
  ctx.lineTo(x, y + r);
  ctx.arc(x, y, r, HALF, 0, true);
  ctx.closePath();
}

function paint(ctx, P, tileCol, dotCol) {
  ctx.fillStyle = tileCol;
  for (const t of P.tile) {
    const a = t.a != null ? t.a : 1;
    if (a <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    tilePath(ctx, t.x, t.y, P.cw, P.r);
    ctx.fill();
    ctx.restore();
  }
  for (const d of P.dot) {
    const a = d.a != null ? d.a : 1;
    if (a <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = dotCol || d.col;
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

const MITER_LIMIT_DEFAULT = 4;

function applyStrokeJoin(ctx) {
  const join = st.join === 'round' || st.join === 'bevel' ? st.join : 'miter';
  ctx.lineJoin = join;
  ctx.miterLimit = join === 'miter' ? clamp(st.miterLimit || MITER_LIMIT_DEFAULT, 1, 100) : 10;
  ctx.lineCap = join === 'round' ? 'round' : 'butt';
}

/** True vector unite geometry — arcs + circles, not marched polygons. */
function addUniteGeometry(ctx, P) {
  for (const t of P.tile) tilePath(ctx, t.x, t.y, P.cw, P.r);
  for (const d of P.dot) {
    ctx.moveTo(d.cx + d.r, d.cy);
    ctx.arc(d.cx, d.cy, d.r, 0, TAU);
    ctx.closePath();
  }
}

/** Offset Path via fill + stroke on real arcs/circles (Miter / Round / Bevel). */
function paintPathOffset(ctx, P, dil, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  applyStrokeJoin(ctx);
  ctx.beginPath();
  addUniteGeometry(ctx, P);
  ctx.fill('nonzero');
  if (dil > 0) {
    ctx.lineWidth = dil * 2;
    ctx.stroke();
  }
  ctx.restore();
}

function paintOffset(ctx, P) {
  const off = getEffectiveOffset();
  const sw = getEffectiveStroke();
  if (st.sw > 0) {
    paintPathOffset(ctx, P, off, st.strink);
    paintPathOffset(ctx, P, Math.max(0, off - sw), st.offink);
  } else {
    paintPathOffset(ctx, P, off, st.offink);
  }
  paint(ctx, P, st.ink, st.ink);
}

function paintScene(ctx, w, h) {
  ctx.fillStyle = st.gnd;
  ctx.fillRect(0, 0, w, h);
  const P = getPrims();
  if (st.mode === 'halftone') paint(ctx, P, PLATE, null);
  else if (st.mode === 'unite') paint(ctx, P, st.ink, st.ink);
  else paintOffset(ctx, P);
}

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const statusEl = document.getElementById('status');
const genStrip = document.getElementById('genStrip');
let pointer = null;
let drawing = false;
let last = null;

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function fitCanvas() {
  const host = cv.parentElement;
  const r = host.getBoundingClientRect();
  W = Math.max(1, Math.round(r.width));
  H = Math.max(1, Math.round(r.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  if (genStrip) genStrip.style.setProperty('--art-aspect', `${W} / ${H}`);
  invalidate();
  render();
}

function luma(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function render() {
  const k = cv.width / W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  paintScene(ctx, W, H);

  if (pointer && !drawing) {
    ctx.strokeStyle = luma(st.gnd) > 0.5 ? 'rgba(14,14,12,.55)' : 'rgba(255,255,255,.65)';
    ctx.lineWidth = 1 / k;
    ctx.setLineDash(st.tool === 'erase' ? [4 / k, 4 / k] : []);
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, st.brush * st.cell, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  setStatus(
    `${st.mode} · ${W}×${H} · ${cells.size} cells · gen ${activeGen + 1}/${GEN_COUNT}` +
      (st.pairingId ? ` · ${st.pairingId}` : '') +
      (st.animate ? ` · anim ${Math.round(animProgress * 100)}%` : '')
  );
}

function pushUndo() {
  undos.push(new Map(cells));
  if (undos.length > 40) undos.shift();
}

function paintAt(ax, ay, erase) {
  const cw = st.cell;
  const R = st.brush;
  const cx = ax / cw - 0.5;
  const cy = ay / cw - 0.5;
  let touched = false;
  for (let iy = Math.floor(cy - R - 1); iy <= Math.ceil(cy + R + 1); iy++) {
    for (let ix = Math.floor(cx - R - 1); ix <= Math.ceil(cx + R + 1); ix++) {
      const dist = Math.hypot(ix - cx, iy - cy);
      if (dist > R) continue;
      const k = key(ix, iy);
      if (erase) {
        if (cells.delete(k)) touched = true;
        continue;
      }
      const fall = R < 0.75 ? 1 : clamp(1 - dist / R, 0, 1);
      if (st.scatter > 0 && hash(ix, iy, st.seed + 3571) > (1 - st.scatter) + st.scatter * fall * fall) continue;
      const want = Math.round(255 * (0.45 + 0.55 * fall));
      if (want > (cells.get(k) || 0)) {
        cells.set(k, want);
        touched = true;
      }
    }
  }
  if (touched) invalidate();
  return touched;
}

function toArt(e) {
  const r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  pushUndo();
  drawing = true;
  last = toArt(e);
  paintAt(last.x, last.y, st.tool === 'erase' || e.altKey || e.button === 2);
  render();
});

cv.addEventListener('pointermove', e => {
  const p = toArt(e);
  pointer = p;
  if (drawing) {
    const erase = st.tool === 'erase' || e.altKey || (e.buttons & 2);
    const step = st.cell * 0.6;
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step));
    for (let i = 1; i <= n; i++) paintAt(last.x + dx * i / n, last.y + dy * i / n, erase);
    last = p;
  }
  render();
});

function endStroke() {
  if (!drawing) return;
  drawing = false;
  snapshotActiveGen();
  render();
}

cv.addEventListener('pointerup', endStroke);
cv.addEventListener('pointercancel', endStroke);
cv.addEventListener('pointerleave', () => {
  pointer = null;
  render();
});
cv.addEventListener('contextmenu', e => e.preventDefault());

function growBlob(opts) {
  opts = opts || {};
  if (!opts.silent) pushUndo();
  cells = new Map();
  const span = Math.min(W, H);
  const steps = Math.round(span / st.cell * 5.5);
  let x = W / 2;
  let y = H / 2;
  const kb = st.brush;
  const rng = opts.rng || Math.random;
  for (let i = 0; i < steps; i++) {
    st.brush = 1.2 + rng() * (span / st.cell / 12);
    paintAt(x, y, false);
    const a = rng() * TAU;
    const d = st.cell * (1.2 + rng() * 2.6);
    x = clamp(x + Math.cos(a) * d, W * 0.16, W * 0.84);
    y = clamp(y + Math.sin(a) * d, H * 0.16, H * 0.84);
  }
  st.brush = kb;
  invalidate();
  if (!opts.silent) {
    snapshotActiveGen();
    render();
  }
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function serializeCells(map) {
  return [...map.entries()];
}

function restoreCells(entries) {
  cells = new Map(entries || []);
  invalidate();
}

function renderThumbDataUrl(map, seed) {
  const maxDim = 160;
  const artW = Math.max(1, W);
  const artH = Math.max(1, H);
  const scale = maxDim / Math.max(artW, artH);
  const tw = Math.max(1, Math.round(artW * scale));
  const th = Math.max(1, Math.round(artH * scale));
  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const o = c.getContext('2d');
  const saved = {
    cells: cells,
    seed: st.seed,
    prims: prims,
  };
  cells = new Map(map);
  st.seed = seed;
  invalidate();
  const P = getPrims();
  const s = tw / artW;
  o.setTransform(s, 0, 0, s, 0, 0);
  o.fillStyle = st.gnd;
  o.fillRect(0, 0, artW, artH);
  if (st.mode === 'halftone') paint(o, P, PLATE, null);
  else if (st.mode === 'unite') paint(o, P, st.ink, st.ink);
  else paintOffset(o, P);
  const url = c.toDataURL('image/png');
  cells = saved.cells;
  st.seed = saved.seed;
  prims = saved.prims;
  return url;
}

function snapshotActiveGen() {
  generations[activeGen] = {
    seed: st.seed,
    cells: serializeCells(cells),
    thumb: renderThumbDataUrl(cells, st.seed),
  };
  renderGenStrip();
}

function loadGeneration(index) {
  const gen = generations[index];
  if (!gen) return;
  activeGen = index;
  pushUndo();
  st.seed = gen.seed;
  restoreCells(gen.cells);
  renderGenStrip();
  render();
}

function renderGenStrip() {
  if (!genStrip) return;
  genStrip.style.setProperty('--art-aspect', `${Math.max(1, W)} / ${Math.max(1, H)}`);
  genStrip.replaceChildren();
  for (let i = 0; i < GEN_COUNT; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gen-thumb' + (i === activeGen ? ' active' : '');
    btn.title = 'Generation ' + (i + 1);
    if (generations[i] && generations[i].thumb) {
      const img = document.createElement('img');
      img.src = generations[i].thumb;
      img.alt = '';
      btn.appendChild(img);
    }
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = String(i + 1).padStart(2, '0');
    btn.appendChild(n);
    btn.onclick = () => loadGeneration(i);
    genStrip.appendChild(btn);
  }
}

function generateTen() {
  setStatus('Generating 10 artifacts…');
  const baseSeed = (Math.random() * 1e9) | 0;
  const savedBrush = st.brush;
  for (let i = 0; i < GEN_COUNT; i++) {
    const seed = (baseSeed + i * 9973) >>> 0;
    st.seed = seed;
    const rng = mulberry32(seed ^ 0x9e3779b9);
    growBlob({ silent: true, rng });
    generations[i] = {
      seed,
      cells: serializeCells(cells),
      thumb: renderThumbDataUrl(cells, seed),
    };
  }
  st.brush = savedBrush;
  activeGen = 0;
  restoreCells(generations[0].cells);
  st.seed = generations[0].seed;
  undos.length = 0;
  renderGenStrip();
  render();
  setStatus('10 generations ready · click a thumb to edit');
}

/* ---- SVG export: real arcs + <circle> elements (not marched polygons) ---- */
const N2 = n => n.toFixed(2);

function tileSvgPath(x, y, s, r) {
  const x1 = x + s;
  const y1 = y + s;
  const R = N2(r);
  return `M${N2(x + r)} ${N2(y)}L${N2(x1 - r)} ${N2(y)}A${R} ${R} 0 0 0 ${N2(x1)} ${N2(y + r)}`
    + `L${N2(x1)} ${N2(y1 - r)}A${R} ${R} 0 0 0 ${N2(x1 - r)} ${N2(y1)}`
    + `L${N2(x + r)} ${N2(y1)}A${R} ${R} 0 0 0 ${N2(x)} ${N2(y1 - r)}`
    + `L${N2(x)} ${N2(y + r)}A${R} ${R} 0 0 0 ${N2(x + r)} ${N2(y)}Z`;
}

function offsetJoinAttrs() {
  const join = st.join === 'round' || st.join === 'bevel' ? st.join : 'miter';
  const lim = join === 'miter' ? clamp(st.miterLimit || MITER_LIMIT_DEFAULT, 1, 100) : 4;
  const cap = join === 'round' ? 'round' : 'butt';
  return `stroke-linejoin="${join}" stroke-miterlimit="${lim}" stroke-linecap="${cap}"`;
}

function uniteSvgInner(P) {
  let tileD = '';
  for (const t of P.tile) tileD += tileSvgPath(t.x, t.y, P.cw, P.r);
  let inner = tileD ? `<path d="${tileD}"/>` : '';
  for (const c of P.dot) {
    inner += `<circle cx="${N2(c.cx)}" cy="${N2(c.cy)}" r="${N2(c.r)}"/>`;
  }
  return inner;
}

function uniteSvgGroup(id, P, fill, stroke, strokeWidth) {
  const strokePart = stroke && strokeWidth > 0
    ? ` stroke="${stroke}" stroke-width="${N2(strokeWidth)}" ${offsetJoinAttrs()}`
    : '';
  return `<g id="${id}" fill="${fill}"${strokePart}>${uniteSvgInner(P)}</g>`;
}

function buildSVG() {
  const P = getPrims();
  let body = `<rect id="ground" width="${W}" height="${H}" fill="${st.gnd}"/>`;
  if (st.mode === 'halftone') {
    let d = '';
    for (const t of P.tile) d += tileSvgPath(t.x, t.y, P.cw, P.r);
    body += `<path id="plate" fill="${PLATE}" d="${d}"/>`;
    const by = new Map();
    for (const c of P.dot) {
      by.set(c.col, (by.get(c.col) || '') + `<circle cx="${N2(c.cx)}" cy="${N2(c.cy)}" r="${N2(c.r)}"/>`);
    }
    let i = 0;
    for (const [col, g] of by) body += `<g id="spot-${++i}" fill="${col}">${g}</g>`;
  } else if (st.mode === 'unite') {
    body += uniteSvgGroup('united', P, st.ink, null, 0);
  } else {
    if (st.sw > 0) {
      body += uniteSvgGroup('stroke', P, st.strink, st.strink, st.off * 2);
      body += uniteSvgGroup('offset', P, st.offink, st.offink, Math.max(0, st.off - st.sw) * 2);
    } else {
      body += uniteSvgGroup('offset', P, st.offink, st.offink, st.off * 2);
    }
    body += uniteSvgGroup('united', P, st.ink, null, 0);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${body}\n</svg>`;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function flash(btn, text) {
  const old = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = old; }, 1300);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-2000px;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

/* ---- UI bindings ---- */
function bindRange(id, key, fmt, after) {
  const r = document.getElementById('r-' + id);
  const o = document.getElementById('o-' + id);
  if (!r || !o) return;
  r.value = st[key];
  o.textContent = fmt(st[key]);
  r.addEventListener('input', () => {
    const prev = st[key];
    st[key] = parseFloat(r.value);
    o.textContent = fmt(st[key]);
    if (after) after(prev);
    invalidate();
    snapshotActiveGen();
    render();
  });
}

const pct = v => Math.round(v * 100) + '%';
const px = v => v.toFixed(1).replace(/\.0$/, '') + 'px';
const cel = v => '×' + v.toFixed(3).replace(/0$/, '');

bindRange('brush', 'brush', v => v.toFixed(2).replace(/0$/, '') + 'c');
bindRange('scatter', 'scatter', pct);
bindRange('notch', 'notch', cel);
bindRange('tiled', 'tiled', pct);
bindRange('dot', 'dot', cel);
bindRange('dotd', 'dotd', pct);
bindRange('off', 'off', px);
bindRange('sw', 'sw', v => (v === 0 ? 'None' : px(v)));
bindRange('cell', 'cell', v => v + 'px', prev => resample(prev, st.cell));
bindRange('miter', 'miterLimit', v => String(Number(v.toFixed(1)).toString()));

function bindAnimRange(id, key, fmt) {
  const r = document.getElementById('r-' + id);
  const o = document.getElementById('o-' + id);
  if (!r || !o) return;
  r.value = st[key];
  o.textContent = fmt(st[key]);
  r.addEventListener('input', () => {
    st[key] = parseFloat(r.value);
    o.textContent = fmt(st[key]);
  });
}

bindAnimRange('animDuration', 'animDuration', v => v.toFixed(1).replace(/\.0$/, '') + 's');
bindAnimRange('sweepDepth', 'sweepDepth', v => String(Math.round(v)));
bindAnimRange('diffusionSoft', 'diffusionSoft', v => String(Math.round(v)));
bindAnimRange('offsetBreathe', 'offsetBreathe', v => String(Math.round(v)));
bindAnimRange('spotFlicker', 'spotFlicker', v => String(Math.round(v)));

function bindAnimCheckbox(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = !!st[key];
  el.addEventListener('change', () => {
    st[key] = el.checked;
    render();
  });
}

bindAnimCheckbox('bakeInOut', 'bakeInOut');
bindAnimCheckbox('infiniteLoop', 'infiniteLoop');

document.querySelectorAll('#animToggle button').forEach(btn => {
  btn.addEventListener('click', () => setAnimate(btn.dataset.animate === '1'));
});

const motionPresetEl = document.getElementById('motionPreset');
if (motionPresetEl) {
  motionPresetEl.value = st.motionPreset;
  motionPresetEl.addEventListener('change', () => {
    st.motionPreset = motionPresetEl.value;
    render();
  });
}

function syncJoinUi() {
  const sel = document.getElementById('joinSelect');
  const row = document.getElementById('miterLimitRow');
  if (sel) sel.value = st.join;
  if (row) row.style.display = st.join === 'miter' ? '' : 'none';
}

(function bindJoinControls() {
  const sel = document.getElementById('joinSelect');
  if (!sel) return;
  sel.value = st.join;
  sel.addEventListener('change', () => {
    st.join = sel.value === 'round' || sel.value === 'bevel' ? sel.value : 'miter';
    syncJoinUi();
    snapshotActiveGen();
    render();
  });
  syncJoinUi();
})();

function resample(oldCell, newCell) {
  if (oldCell === newCell || !cells.size) return;
  const out = new Map();
  const cols = Math.ceil(W / newCell) + 2;
  const rows = Math.ceil(H / newCell) + 2;
  for (let iy = -1; iy < rows; iy++) {
    for (let ix = -1; ix < cols; ix++) {
      const v = cells.get(key(
        Math.floor((ix + 0.5) * newCell / oldCell),
        Math.floor((iy + 0.5) * newCell / oldCell)
      ));
      if (v) out.set(key(ix, iy), v);
    }
  }
  cells = out;
}

function buildSwatches(hostId, nameId, list, key) {
  const host = document.getElementById(hostId);
  const name = document.getElementById(nameId);
  if (!host) return;
  host.replaceChildren();
  list.forEach(([hex, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = hex;
    b.title = label;
    b.setAttribute('aria-label', label);
    b.onclick = () => {
      st[key] = hex;
      if (key === 'ink' || key === 'gnd') st.pairingId = null;
      [...host.children].forEach(c => c.classList.toggle('active', c === b));
      if (name) name.textContent = label;
      snapshotActiveGen();
      render();
    };
    host.appendChild(b);
    const on = String(hex).toUpperCase() === String(st[key]).toUpperCase();
    b.classList.toggle('active', on);
    if (on && name) name.textContent = label;
  });
}

function sameHex(a, b) {
  return String(a || '').toUpperCase() === String(b || '').toUpperCase();
}

// FAL_2 often sets colors[0] === bg; ink must be the accent so unite isn't a flat fill.
function pairingAccent(preset) {
  const colors = preset.colors || [];
  const accent = colors.find(c => !sameHex(c, preset.bg));
  return accent || colors[1] || colors[0] || '#ADFF00';
}

function applyPairing(preset) {
  if (!preset) return;
  const colors = preset.colors || [];
  const ink = pairingAccent(preset);
  const field = colors.find(c => !sameHex(c, ink)) || preset.bg;
  st.pairingId = preset.id;
  st.gnd = preset.bg;
  st.ink = ink;
  st.offink = ink;
  st.strink = field || (luma(ink) > 0.5 ? '#000000' : '#FFFFFF');
  buildSwatches('ink', 'ink-name', INKS, 'ink');
  buildSwatches('offink', 'offink-name', INKS, 'offink');
  buildSwatches('strink', 'strink-name', INKS, 'strink');
  buildSwatches('gnd', 'gnd-name', GNDS, 'gnd');
  document.querySelectorAll('#tonalPresets .tonal-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === preset.id);
  });
  snapshotActiveGen();
  render();
}

function renderPairings() {
  const host = document.getElementById('tonalPresets');
  if (!host || typeof FAL_2 === 'undefined') return;
  host.replaceChildren();
  FAL_2.forEach(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tonal-preset' + (st.pairingId === preset.id ? ' active' : '');
    btn.dataset.id = preset.id;
    btn.innerHTML = `<span>${preset.label}</span><span class="chips"></span>`;
    const chips = btn.querySelector('.chips');
    [preset.bg, ...preset.colors].slice(0, 3).forEach(hex => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.style.background = hex;
      chips.appendChild(chip);
    });
    btn.onclick = () => applyPairing(preset);
    host.appendChild(btn);
  });
}

function setMode(m) {
  st.mode = m;
  document.querySelectorAll('#stageChain .stage-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === m);
  });
  snapshotActiveGen();
  render();
}

function setTool(t) {
  st.tool = t;
  document.querySelectorAll('#tools button').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === t);
  });
  render();
}

document.querySelectorAll('#stageChain .stage-btn').forEach(b => {
  b.addEventListener('click', () => setMode(b.dataset.mode));
});
document.querySelectorAll('#tools button').forEach(b => {
  b.addEventListener('click', () => setTool(b.dataset.tool));
});

document.getElementById('b-seed').onclick = () => {
  st.seed = (Math.random() * 1e6) | 0;
  invalidate();
  snapshotActiveGen();
  render();
};
document.getElementById('b-blob').onclick = () => growBlob();
document.getElementById('b-clear').onclick = () => {
  pushUndo();
  cells = new Map();
  invalidate();
  snapshotActiveGen();
  render();
};
document.getElementById('b-undo').onclick = () => {
  const g = undos.pop();
  if (!g) return;
  cells = g;
  invalidate();
  snapshotActiveGen();
  render();
};
document.getElementById('b-gen10').onclick = () => generateTen();

const bCopy = document.getElementById('b-copy');
bCopy.onclick = () => {
  const svg = buildSVG();
  const done = ok => flash(bCopy, ok ? 'Copied — paste into Figma' : 'Copy failed');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(svg).then(() => done(true), () => done(legacyCopy(svg)));
  } else done(legacyCopy(svg));
};

document.getElementById('b-svg').onclick = () => {
  download(`fal-artifact-${st.mode}-${st.seed}.svg`, new Blob([buildSVG()], { type: 'image/svg+xml' }));
};
document.getElementById('b-png').onclick = () => {
  const S = 2;
  const c = document.createElement('canvas');
  c.width = W * S;
  c.height = H * S;
  const o = c.getContext('2d');
  o.setTransform(S, 0, 0, S, 0, 0);
  paintScene(o, W, H);
  c.toBlob(b => download(`fal-artifact-${st.mode}-${st.seed}.png`, b));
};

function isTypingTarget(el) {
  if (!el || el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el.type || '').toLowerCase();
    return type !== 'range' && type !== 'checkbox' && type !== 'radio' && type !== 'button';
  }
  return false;
}

document.addEventListener('keydown', e => {
  if (isTypingTarget(e.target)) return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    document.getElementById('b-undo').click();
    return;
  }
  const k = e.key.toLowerCase();
  if (k === '1') setMode('halftone');
  else if (k === '2') setMode('unite');
  else if (k === '3') setMode('offset');
  else if (k === 'e') setTool('erase');
  else if (k === 'd') setTool('draw');
  else if (k === 'r') document.getElementById('b-seed').click();
  else if (k === 'a') setAnimate(!st.animate);
  else if (k === '[' || k === ']') {
    const r = document.getElementById('r-brush');
    r.value = clamp(st.brush + (k === ']' ? 0.5 : -0.5), 0.5, 10);
    r.dispatchEvent(new Event('input'));
  }
});

buildSwatches('ink', 'ink-name', INKS, 'ink');
buildSwatches('offink', 'offink-name', INKS, 'offink');
buildSwatches('strink', 'strink-name', INKS, 'strink');
buildSwatches('gnd', 'gnd-name', GNDS, 'gnd');
renderPairings();
setMode('unite');
setTool('draw');

if (typeof initAllDialSliders === 'function') initAllDialSliders();

new ResizeObserver(fitCanvas).observe(cv.parentElement || cv);
fitCanvas();

// Default: black ink on white ground, then 10 gens
generateTen();
undos.length = 0;
