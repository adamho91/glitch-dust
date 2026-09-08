// Adapted from Glitch Dust Maker's hashNoise, valueNoise/fbm,
// pickSizeMultiplier, getShapeDrawScale, and sampleDiffusionWave.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};
function hash(n, seed) {
  const v = Math.sin(n * 127.1 + seed * 17.3) * 43758.5453;
  return v - Math.floor(v);
}
function valueNoise(x, y, seed) {
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    sx = smoothstep(x - x0),
    sy = smoothstep(y - y0);
  return lerp(
    lerp(
      hash(x0 * 57.13 + y0 * 113.71, seed),
      hash((x0 + 1) * 57.13 + y0 * 113.71, seed),
      sx,
    ),
    lerp(
      hash(x0 * 57.13 + (y0 + 1) * 113.71, seed),
      hash((x0 + 1) * 57.13 + (y0 + 1) * 113.71, seed),
      sx,
    ),
    sy,
  );
}
function fbm(x, y, seed) {
  let v = 0,
    amp = 0.5,
    freq = 1;
  for (let i = 0; i < 3; i++) {
    v += amp * valueNoise(x * freq, y * freq, seed);
    amp *= 0.52;
    freq *= 2.05;
  }
  return v;
}
export function sizeMultiplier(gx, gy, s) {
  const enabled = (s.megaTiers || [2, 3, 4]).filter(
    (t) => Number.isInteger(t) && t >= 2 && t <= 8,
  );
  if (!enabled.length || s.megaRarity <= 0) return 1;
  if (
    hash(gx * 23.1 + gy * 31.7 + s.seed * 0.47, s.seed) >=
    (s.megaRarity / 100) * 0.4
  )
    return 1;
  const weights = enabled.map((t) => Math.max(1, 9 - t));
  let roll =
    hash(gx * 7.9 + gy * 13.3 + 99, s.seed) *
    weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < enabled.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return enabled[i];
  }
  return enabled.at(-1);
}
const grids = new Map();
function grid(w, h, cell, seed) {
  const key = [w, h, cell, seed].join(":");
  if (grids.has(key)) return grids.get(key);
  const cols = Math.ceil(w / cell),
    rows = Math.ceil(h / cell),
    nodes = [];
  for (let gy = 0; gy < rows; gy++)
    for (let gx = 0; gx < cols; gx++)
      nodes.push({ gx, gy, rank: hash(gx * 11.7 + gy * 83.2, seed) });
  nodes.sort((a, b) => a.rank - b.rank);
  const result = { nodes, cols, rows };
  if (grids.size >= 8) grids.delete(grids.keys().next().value);
  grids.set(key, result);
  return result;
}
export function diffusionNodes(s, t, w, h) {
  if (s.pattern === "none") return [];
  const cell = (s.scale * Math.min(w, h)) / 720,
    { nodes, cols, rows } = grid(w, h, cell, s.seed),
    out = [];
  const speed = (t * s.speed) / 100,
    progress = (speed / 6) % 1,
    phase = progress * Math.PI * 2;
  const lo = Math.min(s.shapeMin, s.shapeMax) / 100,
    hi = Math.max(s.shapeMin, s.shapeMax) / 100;
  const sweep = s.sweepDepth / 100,
    soft = s.diffusionSoft / 100,
    ripple = s.waveRipples / 100;
  for (const p of nodes.slice(0, Math.floor(s.maxNodes))) {
    const { gx, gy } = p,
      nx = gx / Math.max(1, cols - 1),
      ny = gy / Math.max(1, rows - 1);
    const along =
      s.sweepAxis === "h"
        ? nx
        : s.sweepAxis === "d"
          ? clamp((nx + ny) * 0.707)
          : ny;
    const across =
      s.sweepAxis === "h"
        ? ny
        : s.sweepAxis === "d"
          ? clamp((nx - ny) * 0.707 + 0.5)
          : nx;
    let field = fbm(
      gx * 0.115 + speed * 0.09,
      gy * 0.115 - speed * 0.06,
      s.seed,
    );
    const anchor =
      s.fadeDirection === "left"
        ? 1 - nx
        : s.fadeDirection === "right"
          ? nx
          : s.fadeDirection === "top"
            ? 1 - ny
            : s.fadeDirection === "bottom"
              ? ny
              : 1;
    const presence =
      clamp((field - (1 - s.density / 100) * 0.65) * 3.6) * smoothstep(anchor);
    if (presence < 0.035) continue;
    const distance = Math.min(
      Math.abs(along - progress),
      Math.abs(along - progress + 1),
      Math.abs(along - progress - 1),
    );
    let band = 1 - smoothstep(distance / lerp(0.05, 0.38, soft));
    band = lerp(
      band,
      0.5 + 0.5 * Math.sin(phase - along * Math.PI * 2),
      sweep * 0.35,
    );
    if (soft > 0) {
      const grain = hash(
          gx * 17.3 + gy * 23.7 + Math.floor(progress * 80),
          s.seed,
        ),
        marble = fbm(
          gx * 0.11 + phase * 0.25,
          gy * 0.11 - phase * 0.18 + s.seed,
          s.seed,
        );
      band = lerp(
        band,
        band * lerp(0.42, 1, grain) * lerp(0.5, 1, marble),
        soft * 0.78,
      );
    }
    const ridge =
      0.5 +
      0.5 *
        Math.sin(across * Math.PI * 2 * lerp(1.5, 18, ripple) + phase * 0.35);
    const mod =
      lerp(1, 0.1 + band * 0.9, sweep) * lerp(1, 0.18 + ridge * 0.82, ripple);
    const raw = clamp(presence * mod);
    if (raw < 0.02) continue;
    const size = cell * lerp(lo, hi, raw) * sizeMultiplier(gx, gy, s);
    if (size < 0.3) continue;
    const shape =
      s.primitive === "squares"
        ? "square"
        : s.primitive === "circles"
          ? "circle"
          : hash(gx * 11.3 + gy * 19.7 + s.seed * 0.31, s.seed) <
              s.circlePct / 100
            ? "circle"
            : "square";
    out.push({
      x: (gx + 0.5) * cell,
      y: (gy + 0.5) * cell,
      size,
      shape,
      color: Math.floor(hash(gx * 67.7 + gy * 19.3, s.seed) * s.colors.length),
    });
  }
  return out;
}
