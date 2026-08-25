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
  ink: '#EC0648',
  offink: '#EC0648',
  strink: '#000000',
  sw: 0,
  gnd: '#E5ECE7',
  pairingId: null,
};

let cells = new Map();
let W = 800;
let H = 600;
const undos = [];
let prims = null;
let activeGen = 0;
const generations = Array.from({ length: GEN_COUNT }, () => null);

const key = (ix, iy) => ix + ',' + iy;

function hash(x, y, s) {
  let h = (x * 374761393) ^ (y * 668265263) ^ (s * 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

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
    const h1 = hash(ix, iy, st.seed);
    const h2 = hash(ix, iy, st.seed + 101);
    const h3 = hash(ix, iy, st.seed + 211);
    if (h1 < st.tiled * (0.4 + 0.6 * d)) tile.push({ x, y });
    else if (h2 < st.dotd) {
      dot.push({
        cx: x + cw / 2,
        cy: y + cw / 2,
        r: cw * st.dot * (0.86 + 0.14 * d),
        col: spotColor(h3),
      });
    }
  }
  return { cw, r, tile, dot };
}

function getPrims() {
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

function paint(ctx, P, dil, tileCol, dotCol) {
  // dil > 0: square (Chebyshev) expansion so offset rims keep sharp 90° corners
  // instead of round stroke joins.
  ctx.fillStyle = tileCol;
  for (const t of P.tile) {
    if (dil > 0) {
      ctx.fillRect(t.x - dil, t.y - dil, P.cw + dil * 2, P.cw + dil * 2);
    } else {
      ctx.beginPath();
      tilePath(ctx, t.x, t.y, P.cw, P.r);
      ctx.fill();
    }
  }
  for (const d of P.dot) {
    const c = dotCol || d.col;
    ctx.fillStyle = c;
    if (dil > 0) {
      const s = d.r * 2 + dil * 2;
      ctx.fillRect(d.cx - d.r - dil, d.cy - d.r - dil, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(d.cx, d.cy, d.r, 0, TAU);
      ctx.fill();
    }
  }
}

function paintOffset(ctx, P) {
  if (st.sw > 0) {
    paint(ctx, P, st.off, st.strink, st.strink);
    paint(ctx, P, Math.max(0, st.off - st.sw), st.offink, st.offink);
  } else {
    paint(ctx, P, st.off, st.offink, st.offink);
  }
  if (st.offink !== st.ink) paint(ctx, P, 0, st.ink, st.ink);
}

function paintScene(ctx, w, h) {
  ctx.fillStyle = st.gnd;
  ctx.fillRect(0, 0, w, h);
  const P = getPrims();
  if (st.mode === 'halftone') paint(ctx, P, 0, PLATE, null);
  else if (st.mode === 'unite') paint(ctx, P, 0, st.ink, st.ink);
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
      (st.pairingId ? ` · ${st.pairingId}` : '')
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
  const size = 128;
  const artW = Math.max(1, W);
  const artH = Math.max(1, H);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
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
  const sx = size / artW;
  const sy = size / artH;
  o.setTransform(sx, 0, 0, sy, 0, 0);
  o.fillStyle = st.gnd;
  o.fillRect(0, 0, artW, artH);
  if (st.mode === 'halftone') paint(o, P, 0, PLATE, null);
  else if (st.mode === 'unite') paint(o, P, 0, st.ink, st.ink);
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

/* ---- SVG compound path helpers (unite / offset export) ---- */
function maskField(dil) {
  const k = clamp(Math.sqrt(2600000 / (W * H)), 0.6, 1.4);
  const rw = Math.max(4, Math.round(W * k));
  const rh = Math.max(4, Math.round(H * k));
  const c = document.createElement('canvas');
  c.width = rw;
  c.height = rh;
  const o = c.getContext('2d', { willReadFrequently: true });
  o.setTransform(rw / W, 0, 0, rh / H, 0, 0);
  paint(o, getPrims(), dil, '#000', '#000');
  const d = o.getImageData(0, 0, rw, rh).data;
  const f = new Uint8Array(rw * rh);
  for (let i = 0, n = rw * rh; i < n; i++) f[i] = d[i * 4 + 3];
  return { f, rw, rh, sx: W / rw, sy: H / rh };
}

function marching(f, rw, rh, T) {
  const segs = [];
  const V = (x, y) => f[y * rw + x];
  for (let y = 0; y < rh - 1; y++) {
    for (let x = 0; x < rw - 1; x++) {
      const v0 = V(x, y);
      const v1 = V(x + 1, y);
      const v2 = V(x + 1, y + 1);
      const v3 = V(x, y + 1);
      let idx = 0;
      if (v0 >= T) idx |= 1;
      if (v1 >= T) idx |= 2;
      if (v2 >= T) idx |= 4;
      if (v3 >= T) idx |= 8;
      if (idx === 0 || idx === 15) continue;
      const A = () => [x + (T - v0) / (v1 - v0), y];
      const B = () => [x + 1, y + (T - v1) / (v2 - v1)];
      const C = () => [x + (T - v3) / (v2 - v3), y + 1];
      const D = () => [x, y + (T - v0) / (v3 - v0)];
      const S = (p, q) => segs.push([p[0], p[1], q[0], q[1]]);
      switch (idx) {
        case 1: S(D(), A()); break;
        case 2: S(A(), B()); break;
        case 3: S(D(), B()); break;
        case 4: S(B(), C()); break;
        case 5: S(D(), A()); S(B(), C()); break;
        case 6: S(A(), C()); break;
        case 7: S(D(), C()); break;
        case 8: S(C(), D()); break;
        case 9: S(C(), A()); break;
        case 10: S(A(), B()); S(C(), D()); break;
        case 11: S(C(), B()); break;
        case 12: S(B(), D()); break;
        case 13: S(B(), A()); break;
        case 14: S(A(), D()); break;
      }
    }
  }
  const kk = (x, y) => Math.round(x * 2048) * 8388608 + Math.round(y * 2048);
  const map = new Map();
  for (let i = 0; i < segs.length; i++) {
    const k = kk(segs[i][0], segs[i][1]);
    const a = map.get(k);
    if (a) a.push(i);
    else map.set(k, [i]);
  }
  const used = new Uint8Array(segs.length);
  const loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const pts = [];
    let cur = i;
    while (cur !== -1 && !used[cur]) {
      used[cur] = 1;
      pts.push([segs[cur][0], segs[cur][1]]);
      const cand = map.get(kk(segs[cur][2], segs[cur][3]));
      let nxt = -1;
      if (cand) for (const c of cand) if (!used[c]) { nxt = c; break; }
      cur = nxt;
    }
    if (pts.length > 3) loops.push(pts);
  }
  return loops;
}

function rdp(pts, eps) {
  const n = pts.length;
  if (n < 4) return pts;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    if (e - s < 2) continue;
    const [x1, y1] = pts[s];
    const [x2, y2] = pts[e];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1e-9;
    let md = -1;
    let mi = -1;
    for (let i = s + 1; i < e; i++) {
      const d = Math.abs((pts[i][0] - x1) * dy - (pts[i][1] - y1) * dx) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > eps) {
      keep[mi] = 1;
      stack.push([s, mi], [mi, e]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

function compound(dil) {
  const { f, rw, rh, sx, sy } = maskField(dil);
  let d = '';
  for (let L of marching(f, rw, rh, 128)) {
    L = rdp(L, 0.5);
    if (L.length < 3) continue;
    d += 'M' + L.map(p => (p[0] * sx).toFixed(2) + ' ' + (p[1] * sy).toFixed(2)).join('L') + 'Z';
  }
  return d;
}

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

function buildSVG() {
  const P = getPrims();
  let body = `<rect id="ground" width="${W}" height="${H}" fill="${st.gnd}"/>`;
  if (st.mode === 'halftone') {
    let d = '';
    for (const t of P.tile) d += tileSvgPath(t.x, t.y, P.cw, P.r);
    body += `<path id="plate" fill="${PLATE}" fill-rule="evenodd" d="${d}"/>`;
    const by = new Map();
    for (const c of P.dot) {
      by.set(c.col, (by.get(c.col) || '') + `<circle cx="${N2(c.cx)}" cy="${N2(c.cy)}" r="${N2(c.r)}"/>`);
    }
    let i = 0;
    for (const [col, g] of by) body += `<g id="spot-${++i}" fill="${col}">${g}</g>`;
  } else if (st.mode === 'unite') {
    body += `<path id="united" fill="${st.ink}" fill-rule="evenodd" d="${compound(0)}"/>`;
  } else {
    if (st.sw > 0) {
      body += `<path id="stroke" fill="${st.strink}" fill-rule="evenodd" d="${compound(st.off)}"/>`;
      body += `<path id="offset" fill="${st.offink}" fill-rule="evenodd" d="${compound(Math.max(0.01, st.off - st.sw))}"/>`;
    } else {
      body += `<path id="offset" fill="${st.offink}" fill-rule="evenodd" d="${compound(st.off)}"/>`;
    }
    if (st.offink !== st.ink) {
      body += `<path id="united" fill="${st.ink}" fill-rule="evenodd" d="${compound(0)}"/>`;
    }
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

// Default: Black / Lime pairing energy, then 10 gens
const defaultPair = (typeof FAL_2 !== 'undefined' && FAL_2.find(p => p.id === '2-s')) || null;
if (defaultPair) applyPairing(defaultPair);
generateTen();
undos.length = 0;
