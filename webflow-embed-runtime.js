(function (root) {
  'use strict';

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createEngine(cfg) {
    const W = cfg.W;
    const H = cfg.H;
    const bg = cfg.bg;
    const style = cfg.style || (cfg.selects && cfg.selects.animStyle) || 'dust';
    const sliders = cfg.sliders || {};
    const selects = cfg.selects || {};
    const megaTiers = (cfg.megaTiers || []).slice().sort((a, b) => a - b);
    const tonalCount = cfg.tonalCount;
    const activeTonalColors = cfg.activeTonalColors || [];
    const colorAll = cfg.colorAll || [];
    const colorWeights = cfg.colorWeights || [];
    const customWavePoints = (cfg.customWavePoints || [
      { x: 0, y: 0 }, { x: 0.18, y: 0.55 }, { x: 0.38, y: 0.92 },
      { x: 0.62, y: 1 }, { x: 0.82, y: 0.55 }, { x: 1, y: 0 },
    ]).map(p => ({ x: p.x, y: p.y }));
    const bakeInOut = !!cfg.bakeInOut;
    const infiniteLoop = !!cfg.infiniteLoop;
    const oneMovePerNode = !!cfg.oneMovePerNode;
    const circleNodes = cfg.circleNodes != null ? cfg.circleNodes : parseInt(selects.circleNodes, 10) || 2;
    const animDuration = cfg.animDuration || parseFloat(sliders.animDuration) || 3.5;
    const blanketNodeSpeedEnabled = !!cfg.blanketNodeSpeedEnabled;
    const blanketNodeSpeed = cfg.blanketNodeSpeed != null ? cfg.blanketNodeSpeed : 1;
    // Global playback speed: 1 = authored pace, 0.5 = half speed, 2 = double.
    // Applied by warping the clock fed to drawFrame plus dt-scaling physics.
    const timeScale = Math.min(4, Math.max(0.1, cfg.timeScale || 1));
    // Hover calm zone: nodes within hoverRadius (canvas px) of the pointer
    // stop moving and hold their current look until the pointer leaves.
    const hoverFreeze = !!cfg.hoverFreeze;
    const hoverRadius = Math.max(20, cfg.hoverRadius || 160);
    // Palette media: an image revealed through the union of one palette
    // color's particles (embed version of the editor's "mask image / video
    // per palette color"). cfg.paletteMedia = [{ color:'#hex', src:'url' }].
    const paletteMedia = (cfg.paletteMedia || []).filter(m => m && m.color && m.src);
    const mediaByColor = {};
    paletteMedia.forEach(m => { mediaByColor[String(m.color).toLowerCase()] = m; });

    let noiseSeed = cfg.noiseSeed || 0;
    let rand = mulberry32(((noiseSeed * 10000) | 0) ^ (W * 7) ^ (H * 13));
    function random() { return rand(); }
    function rnd(a, b) { return a + random() * (b - a); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(t) { return Math.max(0, Math.min(1, t)); }
    function smoothstep(t) {
      t = clamp01(t);
      return t * t * (3 - 2 * t);
    }
    function v(id) { return parseFloat(sliders[id] || 0); }
    function sel(id) { return selects[id] || ''; }

    const ENVELOPE_CURVES = {
      linear: t => t,
      smooth: t => smoothstep(t),
      easeIn: t => t * t * t,
      easeOut: t => 1 - Math.pow(1 - t, 3),
      easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      expoIn: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
      expoOut: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
      circIn: t => 1 - Math.sqrt(Math.max(0, 1 - t * t)),
      circOut: t => Math.sqrt(Math.max(0, 1 - Math.pow(t - 1, 2))),
      back: t => 2.70158 * t * t * t - 1.70158 * t * t,
      bounce: t => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
        if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
        t -= 2.625 / d1; return n1 * t * t + 0.984375;
      },
      sineIn: t => 1 - Math.cos(t * Math.PI / 2),
      sineOut: t => Math.sin(t * Math.PI / 2),
    };
    function envCurve(name, t) {
      const fn = ENVELOPE_CURVES[name] || ENVELOPE_CURVES.smooth;
      return clamp01(fn(clamp01(t)));
    }
    function hashNoise(n) {
      n = Math.sin(n * 127.1 + noiseSeed * 17.3) * 43758.5453;
      return n - Math.floor(n);
    }
    function valueNoise(x, y) {
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const x1 = x0 + 1, y1 = y0 + 1;
      const sx = smoothstep(x - x0);
      const sy = smoothstep(y - y0);
      const n00 = hashNoise(x0 * 57.13 + y0 * 113.71);
      const n10 = hashNoise(x1 * 57.13 + y0 * 113.71);
      const n01 = hashNoise(x0 * 57.13 + y1 * 113.71);
      const n11 = hashNoise(x1 * 57.13 + y1 * 113.71);
      return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
    }
    function fbm(x, y, octaves) {
      let val = 0, amp = 0.5, freq = 1;
      for (let i = 0; i < octaves; i++) {
        val += amp * valueNoise(x * freq, y * freq);
        amp *= 0.52;
        freq *= 2.05;
      }
      return val;
    }
    function cornerNoiseOffset(gx, gy, cols, rows, cornerSpread) {
      const t = cornerSpread / 100;
      if (t <= 0) return { ox: 0, oy: 0 };
      const nx = gx / Math.max(1, cols - 1);
      const ny = gy / Math.max(1, rows - 1);
      const corners = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
      let best = corners[0], bestD = Infinity;
      corners.forEach(c => {
        const d = (nx - c.x) ** 2 + (ny - c.y) ** 2;
        if (d < bestD) { bestD = d; best = c; }
      });
      return { ox: (best.x - 0.5) * 3.5 * t, oy: (best.y - 0.5) * 3.5 * t };
    }
    function nodeKey(bx, by) { return bx + ',' + by; }
    function snapNode(x, y, sz) {
      return { px: Math.round(x / sz) * sz, py: Math.round(y / sz) * sz };
    }
    function getAccentColor() {
      if (tonalCount === 'all') return colorAll[4] || colorAll[0] || '#ffffff';
      return activeTonalColors[0] || '#ffffff';
    }
    function pickColor() {
      if (tonalCount === 'all') {
        const wts = colorWeights.map(w => Math.max(0, +w));
        const total = wts.reduce((a, b) => a + b, 0);
        if (!total) return colorAll[0] || '#ffffff';
        let r = random() * total;
        for (let i = 0; i < wts.length; i++) { r -= wts[i]; if (r <= 0) return colorAll[i]; }
        return colorAll[0] || '#ffffff';
      }
      return activeTonalColors[Math.floor(random() * activeTonalColors.length)] || '#ffffff';
    }
    function pickNodeShape(gx, gy, salt) {
      const cir = Math.max(0, v('circlePct'));
      const sq = Math.max(0, v('squarePct'));
      const total = Math.max(1, cir + sq);
      const h = hashNoise(gx * 11.3 + gy * 19.7 + (salt || 0) + noiseSeed * 0.31);
      return h < cir / total ? 'circle' : 'rect';
    }
    function pickSizeMultiplier(gx, gy, salt) {
      if (!megaTiers.length) return 1;
      const rarity = v('megaRarity') / 100;
      if (rarity <= 0) return 1;
      const chance = lerp(0, 0.4, rarity);
      const h = hashNoise(gx * 23.1 + gy * 31.7 + (salt || 0) + noiseSeed * 0.47);
      if (h >= chance) return 1;
      const tierRoll = hashNoise(gx * 7.9 + gy * 13.3 + (salt || 0) * 2.1 + 99);
      const weights = megaTiers.map(t => Math.max(1, 9 - t));
      const totalW = weights.reduce((a, b) => a + b, 0);
      let roll = tierRoll * totalW;
      for (let i = 0; i < megaTiers.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return megaTiers[i];
      }
      return megaTiers[megaTiers.length - 1];
    }
    function sizeMulForCell(bx, by, sz, salt) {
      return pickSizeMultiplier(Math.round(bx / sz), Math.round(by / sz), salt);
    }
    // Directional fade (mirrors index.html): keep-probability factor for a
    // node at normalized position (nx, ny). fadeDir names the anchor (densest
    // side); density falls smoothly to ~0 toward the opposite side at full
    // fadeStrength. Returns 1 when off / missing from older specs.
    function fadeBiasKeepFactor(nx, ny) {
      const dir = sel('fadeDir');
      const strength = clamp01(v('fadeStrength') / 100);
      if (!dir || dir === 'off' || !(strength > 0)) return 1;
      let t; // 0 at the anchor side, 1 at the far side
      switch (dir) {
        case 'left': t = nx; break;
        case 'right': t = 1 - nx; break;
        case 'top': t = ny; break;
        case 'bottom': t = 1 - ny; break;
        case 'top-left': t = (nx + ny) / 2; break;
        case 'top-right': t = ((1 - nx) + ny) / 2; break;
        case 'bottom-left': t = (nx + (1 - ny)) / 2; break;
        case 'bottom-right': t = ((1 - nx) + (1 - ny)) / 2; break;
        default: return 1;
      }
      const u = clamp01(1 - t);
      return lerp(1, u * u * (3 - 2 * u), strength);
    }
    function fadeFactorGrid(gx, gy, cols, rows) {
      return fadeBiasKeepFactor(gx / Math.max(1, cols - 1), gy / Math.max(1, rows - 1));
    }
    function fadeFactorAtPx(x, y) {
      return fadeBiasKeepFactor(x / Math.max(1, W), y / Math.max(1, H));
    }
    function cellDensityMultiplier(gx, gy, cols, rows) {
      const nx = gx / Math.max(1, cols - 1);
      const ny = gy / Math.max(1, rows - 1);
      const density = v('clusterDensity') / 100;
      const cornerF = v('cornerFocus') / 100;
      const centerB = v('centerBias') / 100;
      const spread = v('cornerSpread') / 100;
      let m = lerp(0.18, 1.05, density);
      const edge = Math.min(nx, 1 - nx, ny, 1 - ny);
      const cornerness = clamp01(1 - edge * 2.2);
      const cornerAmt = Math.max(cornerF, spread * 0.85);
      m *= lerp(1, 0.28 + cornerness * 2.4, cornerAmt);
      if (centerB > 0) {
        const d = Math.hypot(nx - 0.5, ny - 0.5) * 2;
        m *= lerp(1, 1.55 - d * 0.75, centerB);
      }
      return Math.max(0.04, m) * fadeFactorGrid(gx, gy, cols, rows);
    }
    function shouldSpawnCell(gx, gy, cols, rows, noiseVal) {
      const m = cellDensityMultiplier(gx, gy, cols, rows);
      return random() < m * (0.32 + noiseVal * 0.68);
    }
    function getShapeDrawScale(raw) {
      const lo = Math.min(v('shapeMin'), v('shapeMax')) / 100;
      const hi = Math.max(v('shapeMin'), v('shapeMax')) / 100;
      if (raw < 0.02) return 0;
      return lo + clamp01(raw) * (hi - lo);
    }
    function getParticleDrawScale(p, raw) {
      const base = getShapeDrawScale(raw);
      if (base < 0.02) return 0;
      return base * (p.sizeMul || 1);
    }
    function clusterPos(dim, bias) {
      const t = bias / 100;
      const spread = lerp(0.44, 0.15, t);
      return dim * (0.5 + rnd(-spread, spread));
    }
    function clusterAnchor(centerBias, cornerSpread, ci, nc) {
      const freeX = clusterPos(W, centerBias);
      const freeY = clusterPos(H, centerBias);
      const t = cornerSpread / 100;
      if (t <= 0) return { cx: freeX, cy: freeY };
      const pad = lerp(0.14, 0.06, t);
      const jitter = lerp(0.22, 0.08, t);
      const corners = [
        { x: pad, y: pad }, { x: 1 - pad, y: pad },
        { x: pad, y: 1 - pad }, { x: 1 - pad, y: 1 - pad },
      ];
      const corner = corners[ci % corners.length];
      const cornerX = W * (corner.x + rnd(-jitter, jitter));
      const cornerY = H * (corner.y + rnd(-jitter, jitter));
      return {
        cx: lerp(freeX, Math.max(0, Math.min(W, cornerX)), t),
        cy: lerp(freeY, Math.max(0, Math.min(H, cornerY)), t),
      };
    }
    function buildRectCluster(cx, cy, sz, maxCells, opts) {
      const o = opts || {};
      const maxLen = o.maxLen != null ? o.maxLen : Math.round(v('branchLen'));
      const splitProb = o.splitProb != null ? o.splitProb : v('branchSplit') / 100;
      const axisBias = o.axisBias != null ? o.axisBias : v('axisBias') / 100;
      const cells = new Set();
      const cellDepth = new Map();
      const key = (gx, gy) => gx + ',' + gy;
      const sx = Math.round(cx / sz), sy = Math.round(cy / sz);
      cells.add(key(sx, sy));
      cellDepth.set(key(sx, sy), 0);
      const queue = [{ gx: sx, gy: sy, dx: 0, dy: 0, rem: 0 }];
      let iter = 0;
      while (cells.size < maxCells && iter < maxCells * 6) {
        iter++;
        if (!queue.length) break;
        const qi = Math.floor(random() * queue.length);
        let { gx, gy, dx, dy, rem } = queue[qi];
        if (rem <= 0 || (dx === 0 && dy === 0)) {
          if (random() < axisBias) {
            const d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            [dx, dy] = d[Math.floor(random() * d.length)];
          } else {
            const d = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
            [dx, dy] = d[Math.floor(random() * d.length)];
          }
          rem = Math.ceil(rnd(1, maxLen));
        }
        const nx = gx + dx, ny = gy + dy, k = key(nx, ny);
        if (!cells.has(k)) {
          cells.add(k);
          cellDepth.set(k, (cellDepth.get(key(gx, gy)) || 0) + 1);
          queue[qi] = { gx: nx, gy: ny, dx, dy, rem: rem - 1 };
          if (random() < splitProb && cells.size < maxCells) {
            const alt = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([adx, ady]) => !(adx === dx && ady === dy));
            const [adx, ady] = alt[Math.floor(random() * alt.length)];
            queue.push({ gx: nx, gy: ny, dx: adx, dy: ady, rem: Math.ceil(rnd(1, maxLen)) });
          }
        } else {
          queue[qi] = { gx: nx, gy: ny, dx, dy, rem: rem - 1 };
        }
        if (rem <= 1) queue.splice(qi, 1);
      }
      let maxDepth = 1;
      cellDepth.forEach(d => { if (d > maxDepth) maxDepth = d; });
      return [...cells].map(k => {
        const [gx, gy] = k.split(',').map(Number);
        return { gx, gy, depth: cellDepth.get(k) || 0, maxDepth };
      });
    }
    function particleGridCoord(p, sz) {
      return {
        gx: p.gx != null ? p.gx : Math.round(p.baseX / sz),
        gy: p.gy != null ? p.gy : Math.round(p.baseY / sz),
      };
    }
    function getSweepCoords(gx, gy, cols, rows) {
      const nx = gx / Math.max(1, cols - 1);
      const ny = gy / Math.max(1, rows - 1);
      const axis = sel('sweepAxis') || 'v';
      if (axis === 'h') return { along: nx, across: ny, axis };
      if (axis === 'd') {
        return {
          along: clamp01((nx + ny) * 0.707),
          across: clamp01((nx - ny) * 0.707 + 0.5),
          axis,
        };
      }
      return { along: ny, across: nx, axis };
    }
    function getNodeTriggerProgress(gx, gy, cols, rows) {
      const { along } = getSweepCoords(gx, gy, cols, rows);
      const softAmt = v('diffusionSoft') / 100;
      const stagger = hashNoise(gx * 13.7 + gy * 19.1 + noiseSeed * 0.31) * lerp(0, 0.24, softAmt);
      return clamp01(along + stagger * 0.55 - lerp(0, 0.08, softAmt));
    }
    function sampleDiffusionWave(gx, gy, cols, rows, progress) {
      const sweepAmt = v('sweepDepth') / 100;
      const rippleAmt = v('waveRipples') / 100;
      const softAmt = v('diffusionSoft') / 100;
      const shiftAmt = v('glitchShift') / 100;
      if (sweepAmt <= 0 && rippleAmt <= 0 && shiftAmt <= 0) return { mod: 1, dx: 0, dy: 0 };
      let sampleProgress = progress;
      if (oneMovePerNode) {
        const trigger = getNodeTriggerProgress(gx, gy, cols, rows);
        if (progress < trigger) {
          const idle = lerp(1, 0.05, Math.max(sweepAmt, rippleAmt * 0.85, shiftAmt * 0.5));
          return { mod: idle, dx: 0, dy: 0 };
        }
        sampleProgress = trigger;
      }
      const { along, across, axis } = getSweepCoords(gx, gy, cols, rows);
      const phase = sampleProgress * Math.PI * 2;
      const rippleFreq = lerp(1.5, 18, rippleAmt);
      const ridge = 0.5 + 0.5 * Math.sin(across * Math.PI * 2 * rippleFreq + phase * 0.35);
      const ridgeMod = lerp(1, 0.18 + ridge * 0.82, rippleAmt);
      let band = 1;
      if (sweepAmt > 0) {
        const bandDist = Math.min(
          Math.abs(along - sampleProgress),
          Math.abs(along - sampleProgress + 1),
          Math.abs(along - sampleProgress - 1)
        );
        const bandWidth = lerp(0.05, 0.38, softAmt);
        band = 1 - smoothstep(bandDist / Math.max(0.02, bandWidth));
        if (!oneMovePerNode) {
          const breatheSweep = 0.5 + 0.5 * Math.sin(phase - along * Math.PI * 2);
          band = lerp(band, breatheSweep, sweepAmt * 0.35);
        }
      }
      if (softAmt > 0) {
        const grain = hashNoise(gx * 17.3 + gy * 23.7 + Math.floor(sampleProgress * 80));
        const marble = fbm(gx * 0.11 + phase * 0.25, gy * 0.11 - phase * 0.18 + noiseSeed, 3);
        const dither = lerp(0.42, 1, grain) * lerp(0.5, 1, marble);
        band = lerp(band, band * dither, softAmt * 0.78);
      }
      const sweepMod = sweepAmt > 0 ? lerp(1, 0.1 + band * 0.9, sweepAmt) : 1;
      const mod = clamp01(ridgeMod * sweepMod);
      let dx = 0, dy = 0;
      if (shiftAmt > 0) {
        const trigger = band * sweepAmt + ridge * rippleAmt * 0.5;
        if (trigger > 0.12) {
          const step = Math.floor(trigger * 6 + hashNoise(gx * 5.3 + gy * 9.1 + sampleProgress * 120) * 3);
          const mag = lerp(0, 2.5, shiftAmt) * trigger;
          const dir = hashNoise(gx + gy * 3 + sampleProgress * 50) > 0.5 ? 1 : -1;
          if (axis === 'h') dx = step * dir * mag;
          else if (axis === 'v') dy = step * dir * mag;
          else { dx = step * dir * mag * 0.65; dy = step * dir * mag * 0.65; }
        }
      }
      return { mod, dx, dy };
    }
    function applyDiffusionWave(p, cols, rows, progress, sz, basePx, basePy) {
      const { gx, gy } = particleGridCoord(p, sz);
      const w = sampleDiffusionWave(gx, gy, cols, rows, progress);
      p.snapPx = (basePx != null ? basePx : p.baseX) + w.dx * sz;
      p.snapPy = (basePy != null ? basePy : p.baseY) + w.dy * sz;
      return w.mod;
    }
    function getLoopTiming(progress) {
      const buildEnd = Math.max(0.12, v('waveBuild') / 100);
      const fadeStart = Math.min(0.92, Math.max(buildEnd + 0.08, v('waveFade') / 100));
      const p = clamp01(progress);
      return { buildEnd, fadeStart, isHold: p >= buildEnd && p <= fadeStart };
    }
    function pulseMod(t, phase) {
      const kind = sel('pulseCurve') || 'none';
      const depth = v('pulseDepth') / 100;
      const hz = v('pulseRate');
      if (kind === 'none' || depth <= 0) return 1;
      const w = Math.PI * hz;
      let osc = 1;
      if (kind === 'sine') osc = 0.5 + 0.5 * Math.sin(t * w);
      else if (kind === 'cosine') osc = 0.5 + 0.5 * Math.cos(t * w);
      else if (kind === 'triangle') {
        const p = (t * hz) % 1;
        osc = 1 - 4 * Math.abs(p - 0.5);
      } else if (kind === 'square') osc = Math.sin(t * w) >= 0 ? 1 : 0;
      else if (kind === 'saw') osc = (t * hz) % 1;
      else if (kind === 'glitch') {
        const step = Math.floor(t * hz * 4 + (phase || 0));
        osc = 0.5 + 0.5 * Math.sin(step * 12.9898);
      }
      return 1 - depth + depth * osc;
    }
    function sampleCustomWave(t) {
      const pts = customWavePoints.slice().sort((a, b) => a.x - b.x);
      if (!pts.length) return 0;
      if (t <= pts[0].x) return pts[0].y;
      if (t >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (t >= a.x && t <= b.x) {
          const u = b.x === a.x ? 0 : (t - a.x) / (b.x - a.x);
          return clamp01(lerp(a.y, b.y, u));
        }
      }
      return 0;
    }
    function sampleBreatheLoopOpacity(p) {
      if (p <= 0 || p >= 1) return 0;
      const buildEnd = Math.max(0.12, v('waveBuild') / 100);
      const fadeStart = Math.min(0.92, Math.max(buildEnd + 0.08, v('waveFade') / 100));
      const envIn = sel('envInCurve') || 'smooth';
      const envOut = sel('envOutCurve') || 'smooth';
      if (p < buildEnd) return envCurve(envIn, p / buildEnd);
      if (p > fadeStart) return 1 - envCurve(envOut, (p - fadeStart) / (1 - fadeStart));
      return bakeInOut ? 1 : pulseMod(p, 1);
    }
    function sampleLoopOpacity(progress) {
      const preset = sel('loopWave') || 'breathe';
      const p = clamp01(progress);
      if (preset === 'custom') return sampleCustomWave(p);
      if (bakeInOut) return sampleBreatheLoopOpacity(p);
      if (preset === 'sine-dome') return Math.sin(p * Math.PI) * pulseMod(p, 0);
      if (preset === 'triangle') return (p < 0.5 ? p * 2 : 2 - p * 2) * pulseMod(p, 0);
      if (preset === 'expo-burst') {
        const base = p < 0.5 ? envCurve('expoOut', p * 2) : 1 - envCurve('expoIn', (p - 0.5) * 2);
        return base * pulseMod(p, 0);
      }
      if (preset === 'stutter') {
        const steps = 8;
        return clamp01(Math.floor(p * steps) / (steps - 1)) * pulseMod(p, 1);
      }
      const buildEnd = Math.max(0.12, v('waveBuild') / 100);
      const fadeStart = Math.min(0.92, Math.max(buildEnd + 0.08, v('waveFade') / 100));
      const envIn = sel('envInCurve') || 'smooth';
      const envOut = sel('envOutCurve') || 'smooth';
      if (p < buildEnd) return envCurve(envIn, p / buildEnd);
      if (p > fadeStart) return 1 - envCurve(envOut, (p - fadeStart) / (1 - fadeStart));
      return pulseMod(p, 1);
    }
    function getStyleLoopEnvelope(progress) {
      if (infiniteLoop) return 1;
      return bakeInOut ? sampleLoopOpacity(progress) : 1;
    }
    function softenDiffusionForLoop(progress, diffMod) {
      if (infiniteLoop) return diffMod;
      if (bakeInOut) {
        const { isHold } = getLoopTiming(progress);
        if (isHold) return diffMod;
        const env = sampleLoopOpacity(progress);
        return lerp(1, diffMod, clamp01(env * 0.9 + 0.1));
      }
      if ((sel('loopWave') || 'breathe') !== 'breathe') return diffMod;
      const { isHold } = getLoopTiming(progress);
      if (isHold) return diffMod;
      const env = sampleLoopOpacity(progress);
      return lerp(1, diffMod, clamp01(env * 1.15));
    }
    function nodeStagger() { return v('nodeSpread') / 100; }
    function breatheEnvelope(progress, p) {
      if (infiniteLoop) return 1;
      const global = sampleLoopOpacity(progress);
      const useStagger = bakeInOut || (sel('loopWave') || 'breathe') === 'breathe';
      if (!useStagger) return Math.max(0, global);
      const spread = nodeStagger();
      if (spread <= 0.02) return Math.max(0, global);
      const { buildEnd, fadeStart } = getLoopTiming(progress);
      const appearWindow = lerp(0.06, 0.28, spread);
      const vanishWindow = lerp(0.06, 0.28, spread);
      let stagger = 1;
      if (progress < buildEnd) {
        const at = (p.appearT || 0) * buildEnd * lerp(0.15, 1, spread);
        stagger = smoothstep((progress - at) / appearWindow);
      } else if (progress > fadeStart) {
        const vanishStart = fadeStart + (p.vanishT || 0) * (1 - fadeStart) * lerp(0.2, 0.65, spread);
        stagger = 1 - smoothstep((progress - vanishStart) / vanishWindow);
      }
      return Math.max(0, global * lerp(1, stagger, spread));
    }
    function applyTransitionBandRipple(bandScale, progress, p, phase) {
      if (bandScale < 0.03) return bandScale;
      const { isHold } = getLoopTiming(progress);
      if (infiniteLoop) {
        return bandScale * (0.92 + 0.08 * Math.sin(phase * 3 + p.gx * 0.4 + p.gy * 0.3));
      }
      if (bakeInOut) {
        if (isHold) return bandScale * (0.92 + 0.08 * Math.sin(phase * 3 + p.gx * 0.4 + p.gy * 0.3));
        const env = sampleLoopOpacity(progress);
        const ripple = 0.72 + 0.28 * Math.sin(phase * 4 + p.gx * 0.45 + p.gy * 0.35);
        return bandScale * clamp01(env) * ripple;
      }
      if (isHold) return bandScale * (0.92 + 0.08 * Math.sin(phase * 3 + p.gx * 0.4 + p.gy * 0.3));
      return bandScale;
    }
    function getAnimDurationMs() { return animDuration * 1000; }
    function getNodeLoopProgress(loopProgress) {
      if (!blanketNodeSpeedEnabled) return loopProgress;
      return clamp01(loopProgress * Math.max(0.1, blanketNodeSpeed));
    }
    function scaledNodeAnimIntervalMs(ms) {
      if (!blanketNodeSpeedEnabled) return ms;
      return ms / Math.max(0.1, blanketNodeSpeed);
    }

    let particles = [];
    let svg = null;
    let bgR = null;
    let gR = null;
    let mediaLayers = null;
    const NS = 'http://www.w3.org/2000/svg';
    const FRAME_MS = 1000 / 24;
    let lastBurst = 0;
    let nextBeatAt = 0;
    let beatIndex = 0;
    let cycleStart = 0;
    let lastFrame = 0;
    let animId = null;

    function remountParticleElements() {
      if (!gR) return;
      gR.replaceChildren();
      if (mediaLayers) {
        for (const k in mediaLayers) mediaLayers[k].group.replaceChildren();
      }
      particles.forEach(p => {
        const el = document.createElementNS(NS, p.shape === 'circle' ? 'circle' : 'rect');
        el.setAttribute('shape-rendering', 'crispEdges');
        p._el = el;
        // Particles whose color has media live inside that color's mask, so
        // the image shows through them instead of a flat fill.
        const layer = mediaLayers && mediaLayers[String(p.col).toLowerCase()];
        p._media = !!layer;
        (layer ? layer.group : gR).appendChild(el);
      });
    }

    function spawnHalftone() {
      particles = [];
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const n = fbm(gx * 0.09 + noiseSeed, gy * 0.09, 2);
          if (!shouldSpawnCell(gx, gy, cols, rows, n)) continue;
          const bx = gx * sz, by = gy * sz;
          particles.push({
            gx, gy, x: bx, y: by, baseX: bx, baseY: by,
            sz, shape: pickNodeShape(gx, gy, n), col: pickColor(), on: 1,
            ci: 0, vx: 0, vy: 0, drawScale: 1, sizeMul: pickSizeMultiplier(gx, gy, n),
          });
        }
      }
      remountParticleElements();
    }

    function spawnDataStream() {
      particles = [];
      const occupied = new Set();
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      const gradient = v('streamGradient') / 100;
      const corner = v('cornerSpread') / 100;
      function addNode(gx, gy) {
        const bx = gx * sz, by = gy * sz;
        const key = nodeKey(bx, by);
        if (occupied.has(key)) return;
        occupied.add(key);
        const n = fbm(gx * 0.11 + noiseSeed, gy * 0.07, 2);
        particles.push({
          gx, gy, x: bx, y: by, baseX: bx, baseY: by,
          sz, shape: pickNodeShape(gx, gy, n), col: pickColor(), on: 1,
          ci: gy, vx: 0, vy: 0, drawScale: 1,
          sizeMul: pickSizeMultiplier(gx, gy, n),
          glitchSeed: hashNoise(gx * 17.3 + gy * 23.9),
        });
      }
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const nx = gx / Math.max(1, cols - 1);
          const ny = gy / Math.max(1, rows - 1);
          let density = lerp(0.05, 0.92, Math.pow(nx, lerp(0.55, 2.8, gradient)));
          density *= cellDensityMultiplier(gx, gy, cols, rows);
          if (corner > 0) {
            const edge = Math.min(nx, 1 - nx, ny, 1 - ny);
            density *= lerp(1, 0.35 + edge * 2.2, corner);
          }
          const n = fbm(gx * 0.11 + noiseSeed, gy * 0.07, 2);
          if (random() > density * (0.42 + n * 0.58)) continue;
          addNode(gx, gy);
        }
      }
      remountParticleElements();
    }

    function spawnVoxel() {
      particles = [];
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const bx = gx * sz, by = gy * sz;
          const n = fbm(gx * 0.09 + noiseSeed, gy * 0.09, 2);
          if (!shouldSpawnCell(gx, gy, cols, rows, n)) continue;
          particles.push({
            gx, gy, x: bx, y: by, baseX: bx, baseY: by,
            sz, shape: pickNodeShape(gx, gy, n), col: pickColor(), on: 0,
            ci: 0, vx: 0, vy: 0, drawScale: 1,
            sizeMul: pickSizeMultiplier(gx, gy, n),
            appearT: hashNoise(gx * 7.3 + gy * 11.1) * 0.42 + 0.04,
            vanishT: hashNoise(gx * 13.7 + gy * 17.3) * 0.42 + 0.04,
          });
        }
      }
      remountParticleElements();
    }

    function spawnConnected() {
      particles = [];
      const occupied = new Set();
      const sz = Math.round(v('pixSize'));
      const nc = Math.round(v('isolines'));
      const cornerSpread = v('cornerSpread');
      const fill = v('isoFill') / 100;
      const totalAmt = Math.round(lerp(80, 520, fill) * lerp(0.45, 1.15, v('clusterDensity') / 100));
      const maxCellsPerCluster = Math.max(6, Math.round(totalAmt / nc));
      const branchLen = Math.round(lerp(5, 22, v('isoBand') / 100));
      const splitProb = lerp(0.35, 0.75, v('isoBand') / 100);
      const axisBias = lerp(0.55, 0.92, v('waveScale') / 100);
      const clusterOpts = { maxLen: branchLen, splitProb, axisBias };
      const mainCol = getAccentColor();
      const cirRatio = v('circlePct') / Math.max(1, v('circlePct') + v('squarePct'));
      function addParticle(bx, by, props) {
        const key = nodeKey(bx, by);
        if (occupied.has(key)) return false;
        occupied.add(key);
        particles.push({ x: bx, y: by, baseX: bx, baseY: by, sz, vx: 0, vy: 0, ...props });
        return true;
      }
      for (let ci = 0; ci < nc; ci++) {
        const { cx, cy } = clusterAnchor(lerp(25, 100, v('centerBias') / 100), cornerSpread, ci, nc);
        const cells = buildRectCluster(cx, cy, sz, maxCellsPerCluster, clusterOpts);
        const maxDepth = cells[0] ? cells[0].maxDepth || 1 : 1;
        cells.forEach(({ gx, gy, depth }) => {
          const bx = gx * sz, by = gy * sz;
          if (bx < -sz || bx > W + sz || by < -sz || by > H + sz) return;
          const cols = Math.floor(W / sz), rows = Math.floor(H / sz);
          if (!shouldSpawnCell(gx, gy, cols, rows, depth / maxDepth)) return;
          const asCircle = random() < cirRatio * 0.22;
          addParticle(bx, by, {
            ci, on: 1, col: asCircle ? mainCol : pickColor(),
            shape: asCircle ? 'circle' : 'rect',
            sizeMul: pickSizeMultiplier(gx, gy, depth / maxDepth),
            appearT: (depth / maxDepth) * rnd(0.65, 1.05) + hashNoise(gx * 3.1 + gy * 5.7 + ci) * 0.35,
            vanishT: hashNoise(gx * 9.1 + gy * 14.3 + ci) * rnd(0.7, 1.2),
          });
        });
      }
      const numCircles = Math.max(0, Math.round(nc * lerp(1.5, 3.5, fill) * cirRatio * 2));
      let circlesPlaced = 0;
      for (let attempt = 0; circlesPlaced < numCircles && attempt < numCircles * 50; attempt++) {
        const bx = Math.round(rnd(0.06, 0.94) * W / sz) * sz;
        const by = Math.round(rnd(0.06, 0.94) * H / sz) * sz;
        const gx = Math.round(bx / sz), gy = Math.round(by / sz);
        const cols = Math.floor(W / sz), rows = Math.floor(H / sz);
        if (!shouldSpawnCell(gx, gy, cols, rows, 0.5)) continue;
        if (addParticle(bx, by, {
          ci: -1, on: 1, col: mainCol, shape: 'circle',
          sizeMul: pickSizeMultiplier(gx, gy, 0.5),
          appearT: rnd(0.04, 0.42) + hashNoise(bx + by) * 0.2,
          vanishT: rnd(0.04, 0.42) + hashNoise(bx * 2 + by) * 0.2,
        })) circlesPlaced++;
      }
      remountParticleElements();
    }

    function spawnClusters() {
      particles = [];
      const occupied = new Set();
      const nc = Math.round(v('clusterN'));
      const sz = Math.round(v('pixSize'));
      const spd = v('speed') / 100;
      const driftMag = lerp(0.005, 0.4, spd);
      const numCircNodes = Math.min(circleNodes, nc);
      const cirRatio = v('circlePct') / Math.max(1, v('circlePct') + v('squarePct'));
      const sqRatio = 1 - cirRatio;
      const clusterBias = v('clusterBias');
      const cornerSpread = v('cornerSpread');
      const totalAmt = Math.round(v('pixAmt'));
      const scatterAmt = Math.round(lerp(0, totalAmt * 0.5, v('scatter') / 100));
      const clusterBudget = Math.max(nc, Math.round((totalAmt - scatterAmt) * lerp(0.5, 1.15, v('clusterDensity') / 100)));
      const maxCellsPerCluster = Math.max(2, Math.round(clusterBudget / nc) * 2);
      function addParticle(bx, by, props) {
        // Only roll when the fade is active, so seeded output for older
        // specs (no fadeDir) is byte-identical to before.
        const ff = fadeFactorAtPx(bx, by);
        if (ff < 1 && random() >= ff) return false;
        const key = nodeKey(bx, by);
        if (occupied.has(key)) return false;
        occupied.add(key);
        particles.push({ x: bx, y: by, baseX: bx, baseY: by, ...props });
        return true;
      }
      for (let ci = 0; ci < nc; ci++) {
        const { cx, cy } = clusterAnchor(clusterBias, cornerSpread, ci, nc);
        const cells = buildRectCluster(cx, cy, sz, maxCellsPerCluster);
        cells.forEach(({ gx, gy }) => {
          const bx = gx * sz, by = gy * sz;
          if (bx < -sz || bx > W + sz || by < -sz || by > H + sz) return;
          const dir = random() * Math.PI * 2;
          const asCircle = random() < cirRatio * 0.12;
          addParticle(bx, by, {
            vx: Math.cos(dir) * driftMag * rnd(0.3, 1),
            vy: Math.sin(dir) * driftMag * rnd(0.3, 1),
            ci, on: 1, col: asCircle ? getAccentColor() : pickColor(), sz,
            shape: asCircle ? 'circle' : 'rect',
            sizeMul: pickSizeMultiplier(gx, gy, ci * 0.17),
          });
        });
      }
      for (let i = 0; i < scatterAmt; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 40 && !placed; attempt++) {
          const bx = Math.round(rnd(0.04, 0.96) * W / sz) * sz;
          const by = Math.round(rnd(0.04, 0.96) * H / sz) * sz;
          const dir = random() * Math.PI * 2;
          placed = addParticle(bx, by, {
            vx: Math.cos(dir) * driftMag * rnd(0.3, 1),
            vy: Math.sin(dir) * driftMag * rnd(0.3, 1),
            ci: -2, on: 1, col: pickColor(), sz,
            shape: random() < sqRatio ? 'rect' : 'circle',
            sizeMul: sizeMulForCell(bx, by, sz, i * 0.31),
          });
        }
      }
      const numCircles = Math.max(0, Math.round(
        Math.max(numCircNodes, nc) * Math.floor(rnd(2, 4)) * lerp(0.35, 1.25, cirRatio)
      ));
      const mainCol = getAccentColor();
      let circlesPlaced = 0;
      for (let attempt = 0; circlesPlaced < numCircles && attempt < numCircles * 40; attempt++) {
        const bx = Math.round(rnd(0.05, 0.95) * W / sz) * sz;
        const by = Math.round(rnd(0.05, 0.95) * H / sz) * sz;
        const dir = random() * Math.PI * 2;
        if (addParticle(bx, by, {
          vx: Math.cos(dir) * driftMag * rnd(0.3, 1),
          vy: Math.sin(dir) * driftMag * rnd(0.3, 1),
          ci: -1, on: 1, col: mainCol, sz, shape: 'circle',
          sizeMul: sizeMulForCell(bx, by, sz, circlesPlaced * 0.41),
        })) circlesPlaced++;
      }
      lastBurst = performance.now();
      scheduleNextBeat(lastBurst);
      remountParticleElements();
    }

    function spawn() {
      if (style === 'voxel') spawnVoxel();
      else if (style === 'connected') spawnConnected();
      else if (style === 'halftone') spawnHalftone();
      else if (style === 'stream') spawnDataStream();
      else spawnClusters();
    }

    function nextBeatDelay() {
      const s = v('staccato') / 100;
      if (s === 0) return Infinity;
      const cycleMs = getAnimDurationMs();
      const minGap = lerp(cycleMs * 0.15, 80, s);
      const maxGap = lerp(cycleMs * 0.55, 600, s);
      let delay;
      if (random() < 0.3 * s) delay = rnd(80, 300);
      else delay = rnd(minGap, maxGap);
      return scaledNodeAnimIntervalMs(delay);
    }
    function scheduleNextBeat(now) { nextBeatAt = now + nextBeatDelay(); }

    function fireStaccatoBeat(ts) {
      const s = v('staccato') / 100;
      const nc = Math.round(v('clusterN'));
      if (nc < 1) { beatIndex++; scheduleNextBeat(ts); return; }
      const spd = v('speed') / 100;
      const kick = lerp(0.05, 1.2, s) * lerp(0.1, 1, spd);
      const numAffected = Math.ceil(rnd(0.5, lerp(1, 3, s)));
      const affected = new Set();
      while (affected.size < numAffected) affected.add(Math.floor(random() * nc));
      particles.forEach(p => {
        if (!affected.has(p.ci)) return;
        // Beats don't reach into the hover calm zone.
        const calm = hoverFreeze ? hoverCalm(p.x + p.sz / 2, p.y + p.sz / 2) : 0;
        const a = random() * Math.PI * 2;
        p.vx += Math.cos(a) * kick * rnd(0.5, 1.5) * (1 - calm);
        p.vy += Math.sin(a) * kick * rnd(0.5, 1.5) * (1 - calm);
        if (random() < lerp(0.05, 0.45, s) * (1 - calm)) p.on = p.on ? 0 : 1;
      });
      beatIndex++;
      scheduleNextBeat(ts);
    }

    function triggerBurst(ts) {
      const nc = Math.round(v('clusterN'));
      if (nc < 1) { lastBurst = ts; return; }
      const bgc = Math.floor(random() * nc);
      const burstDir = random() * Math.PI * 2;
      const spd = v('speed') / 100;
      const kick = lerp(0.1, 1.5, spd);
      particles.forEach(p => {
        // Bursts don't reach into the hover calm zone.
        const calm = hoverFreeze ? hoverCalm(p.x + p.sz / 2, p.y + p.sz / 2) : 0;
        if (p.ci === bgc) {
          const a = burstDir + rnd(-0.5, 0.5);
          p.vx += Math.cos(a) * kick * rnd(1.2, 2.5) * (1 - calm);
          p.vy += Math.sin(a) * kick * rnd(1.2, 2.5) * (1 - calm);
        }
        if (random() < 0.06 * (1 - calm)) p.on = p.on ? 0 : 1;
      });
      lastBurst = ts;
    }

    function stepClusterPhysics() {
      const spd = v('speed') / 100;
      const k = timeScale;
      const drag = Math.pow(0.91, k);
      const sz = Math.round(v('pixSize'));
      particles.forEach(p => {
        if (p.on) {
          // Nodes inside the hover calm zone bleed velocity and stop drifting.
          const still = hoverFreeze ? hoverCalm(p.x + p.sz / 2, p.y + p.sz / 2) : 0;
          const kk = k * (1 - still);
          p.vx *= drag * (1 - still * 0.85); p.vy *= drag * (1 - still * 0.85);
          const jitter = lerp(0.0005, 0.04, spd) * kk;
          p.vx += (random() - 0.5) * jitter;
          p.vy += (random() - 0.5) * jitter;
          p.x += p.vx * kk; p.y += p.vy * kk;
          const ret = lerp(0.001, 0.012, spd) * kk;
          p.vx += (p.baseX - p.x) * ret;
          p.vy += (p.baseY - p.y) * ret;
          if (p.x < 0) { p.x = 0; p.vx *= -0.3; }
          if (p.x > W - p.sz) { p.x = W - p.sz; p.vx *= -0.3; }
          if (p.y < 0) { p.y = 0; p.vy *= -0.3; }
          if (p.y > H - p.sz) { p.y = H - p.sz; p.vy *= -0.3; }
        }
        const snap = snapNode(p.x, p.y, sz);
        p.snapPx = snap.px;
        p.snapPy = snap.py;
        p.drawScale = p.on ? 1 : 0;
      });
    }

    function drawScaledParticle(p, scale) {
      const s = getParticleDrawScale(p, scale);
      if (s < 0.02 || scale < 0.02) {
        p._el.setAttribute('visibility', 'hidden');
        return;
      }
      const el = p._el;
      el.removeAttribute('opacity');
      el.setAttribute('visibility', 'visible');
      // Mask shapes paint white: in an SVG luminance mask, white = reveal.
      el.setAttribute('fill', p._media ? '#ffffff' : p.col);
      const cx = p.snapPx + p.sz / 2;
      const cy = p.snapPy + p.sz / 2;
      if (p.shape === 'circle') {
        el.setAttribute('cx', cx);
        el.setAttribute('cy', cy);
        el.setAttribute('r', Math.max(0.5, (p.sz / 2) * s));
      } else {
        const side = p.sz * s;
        el.setAttribute('x', cx - side / 2);
        el.setAttribute('y', cy - side / 2);
        el.setAttribute('width', Math.max(0.5, side));
        el.setAttribute('height', Math.max(0.5, side));
      }
    }

    const pointer = { x: 0, y: 0, active: false };
    function attachHover() {
      if (!hoverFreeze || !svg) return;
      const move = e => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const m = svg.getScreenCTM();
        if (!m) return;
        const p = pt.matrixTransform(m.inverse());
        pointer.x = p.x; pointer.y = p.y; pointer.active = true;
      };
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerdown', move);
      svg.addEventListener('pointerleave', () => { pointer.active = false; });
      svg.addEventListener('pointercancel', () => { pointer.active = false; });
    }
    // 1 across the inner half of the radius (hard freeze), then smooth
    // falloff to 0 at hoverRadius so the zone edge still blends in.
    function hoverCalm(cx, cy) {
      if (!hoverFreeze || !pointer.active) return 0;
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= hoverRadius) return 0;
      const inner = hoverRadius * 0.5;
      if (d <= inner) return 1;
      const t = (d - inner) / (hoverRadius - inner);
      return 1 - t * t * (3 - 2 * t);
    }
    // Hold each nearby node's look AND position (a display-only override —
    // p.on and physics state stay the engine's own, so everything resumes
    // untouched after the pointer leaves).
    function applyHoverHold(p) {
      const f = hoverCalm(p.snapPx + p.sz / 2, p.snapPy + p.sz / 2);
      if (f <= 0) { p._hold = null; p._onOverride = null; return; }
      if (!p._hold) {
        p._hold = {
          scale: p.drawScale != null ? p.drawScale : 0,
          on: p.on,
          px: p.snapPx,
          py: p.snapPy,
        };
      }
      p.drawScale = (p.drawScale != null ? p.drawScale : 0) * (1 - f) + p._hold.scale * f;
      // Pin the drawn position too, so diffusion/glitch-shift offsets can't
      // jiggle frozen nodes.
      p.snapPx = p.snapPx * (1 - f) + p._hold.px * f;
      p.snapPy = p.snapPy * (1 - f) + p._hold.py * f;
      p._onOverride = p.drawScale >= 0.02 ? 1 : 0;
    }

    function drawParticlesDeduped() {
      if (hoverFreeze) particles.forEach(applyHoverHold);
      const isOn = p => (p._onOverride != null ? p._onOverride : p.on);
      const occupied = new Set();
      function drawOne(p) {
        let alpha = p.drawScale != null ? p.drawScale : 0;
        if (alpha < 0.02 || !isOn(p)) {
          p._el.setAttribute('visibility', 'hidden');
          return;
        }
        const key = nodeKey(p.snapPx, p.snapPy);
        if (occupied.has(key)) {
          p._el.setAttribute('visibility', 'hidden');
          return;
        }
        occupied.add(key);
        drawScaledParticle(p, alpha);
      }
      particles.forEach(p => { if (!isOn(p)) p._el.setAttribute('visibility', 'hidden'); });
      particles.forEach(p => { if (p.shape === 'rect') drawOne(p); });
      particles.forEach(p => { if (p.shape === 'circle') drawOne(p); });
    }

    function drawVoxelFrame(progress) {
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      const levels = Math.round(v('isolines'));
      const bandW = lerp(0.012, 0.075, v('isoBand') / 100);
      const fillAmt = v('isoFill') / 100;
      const waveScale = lerp(0.028, 0.1, v('waveScale') / 100);
      const corner = v('cornerSpread') / 100;
      const phase = progress * Math.PI * 2;
      const drift = Math.sin(phase * 1.1) * 0.05;
      particles.forEach(p => {
        p.snapPx = p.baseX;
        p.snapPy = p.baseY;
        const warp = cornerNoiseOffset(p.gx, p.gy, cols, rows, corner);
        const nx = p.gx * waveScale + warp.ox + phase * 0.2;
        const ny = p.gy * waveScale + warp.oy + phase * 0.15;
        const n = fbm(nx, ny, 4);
        let bandScale = 0;
        for (let i = 1; i <= levels; i++) {
          const level = i / (levels + 1) + drift;
          const d = Math.abs(n - level);
          if (d < bandW) { bandScale = 1 - d / bandW; break; }
        }
        if (bandScale < 0.03 && fillAmt > 0 && n > 0.52) {
          const h = hashNoise(p.gx * 19.7 + p.gy * 23.1 + noiseSeed);
          if (h < fillAmt * 0.38) bandScale = 0.5 + h * 0.5;
        }
        bandScale = applyTransitionBandRipple(bandScale, progress, p, phase);
        const breathe = breatheEnvelope(progress, p);
        let diffMod = applyDiffusionWave(p, cols, rows, progress, sz, p.baseX, p.baseY);
        diffMod = softenDiffusionForLoop(progress, diffMod);
        const alpha = bandScale * breathe * diffMod;
        p.on = alpha >= 0.02 ? 1 : 0;
        p.drawScale = alpha;
      });
      drawParticlesDeduped();
    }

    function drawConnectedFrame(progress) {
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      const spd = v('speed') / 100;
      const drag = 0.86;
      const ret = lerp(0.035, 0.11, spd);
      const { buildEnd, fadeStart, isHold } = getLoopTiming(progress);
      particles.forEach(p => {
        const breathe = breatheEnvelope(progress, p);
        if (breathe > 0.02) {
          const still = hoverFreeze ? hoverCalm(p.x + p.sz / 2, p.y + p.sz / 2) : 0;
          p.vx *= drag; p.vy *= drag;
          if (!isHold) {
            const jitter = lerp(0, 0.006, spd) * breathe * (progress < buildEnd ? 0.35 : 0.2) * (1 - still);
            p.vx += (random() - 0.5) * jitter;
            p.vy += (random() - 0.5) * jitter;
          }
          p.x += p.vx * (1 - still); p.y += p.vy * (1 - still);
          p.vx += (p.baseX - p.x) * (isHold ? ret * 1.4 : ret);
          p.vy += (p.baseY - p.y) * (isHold ? ret * 1.4 : ret);
          if (isHold) { p.x = p.baseX; p.y = p.baseY; p.vx = 0; p.vy = 0; }
        }
        const snap = snapNode(p.x, p.y, sz);
        let diffMod = applyDiffusionWave(p, cols, rows, progress, sz, snap.px, snap.py);
        diffMod = softenDiffusionForLoop(progress, diffMod);
        p.on = breathe >= 0.02 && diffMod >= 0.02 ? 1 : 0;
        p.drawScale = breathe * diffMod;
        p.snapPx = snap.px;
        p.snapPy = snap.py;
      });
      drawParticlesDeduped();
    }

    function drawHalftoneFrame(ts, loopProgress) {
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      const waveScale = lerp(0.035, 0.13, v('waveScale') / 100);
      const fill = v('gridFill') / 100;
      const corner = v('cornerSpread') / 100;
      const threshold = lerp(0.58, 0.18, fill);
      const phase = ts * 0.0022;
      const progress = loopProgress;
      particles.forEach(p => {
        const warp = cornerNoiseOffset(p.gx, p.gy, cols, rows, corner);
        const nx = p.gx * waveScale + warp.ox + Math.cos(phase * 0.9) * 0.35;
        const ny = p.gy * waveScale + warp.oy + Math.sin(phase * 0.7) * 0.35 + phase * 0.22;
        const n = fbm(nx, ny, 4);
        const scale = Math.max(0, (n - threshold) / Math.max(0.001, 1 - threshold));
        const eased = scale * scale * (3 - 2 * scale);
        const diffMod = applyDiffusionWave(p, cols, rows, progress, sz, p.baseX, p.baseY);
        const loopEnv = getStyleLoopEnvelope(progress);
        const alpha = eased * diffMod * loopEnv;
        p.on = alpha >= 0.03 ? 1 : 0;
        p.drawScale = alpha;
        p.snapPx = p.baseX;
        p.snapPy = p.baseY;
      });
      drawParticlesDeduped();
    }

    function drawStreamFrame(ts, loopProgress) {
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      const gradient = v('streamGradient') / 100;
      const jitterAmt = v('streamJitter') / 100;
      const staccato = v('staccato') / 100;
      const spd = lerp(0.35, 2.8, v('speed') / 100);
      const tick = ts * 0.001 * spd;
      const progress = loopProgress;
      particles.forEach(p => {
        const nx = p.gx / Math.max(1, cols - 1);
        const colGate = lerp(0.06, 0.96, Math.pow(nx, lerp(0.55, 2.6, gradient)));
        const travel = (nx + tick * 0.4) % 1;
        const wave = 0.45 + 0.55 * Math.sin(travel * Math.PI * 2 * 2.5 - ts * 0.0018);
        const rowGate = hashNoise(p.gy * 4.1 + Math.floor(ts * 0.007 * spd)) > (1 - jitterAmt * 0.75);
        const flickerRate = 0.012 + staccato * 0.045;
        const flicker = staccato <= 0
          || hashNoise(Math.floor(ts * flickerRate) + p.glitchSeed * 31 + p.gx * 7) > lerp(0.08, 0.52, staccato);
        const noise = fbm(p.gx * 0.14 + tick, p.gy * 0.09 + noiseSeed, 2);
        const alpha = colGate * wave * noise;
        const diffMod = applyDiffusionWave(p, cols, rows, progress, sz, p.baseX, p.baseY);
        const loopEnv = getStyleLoopEnvelope(progress);
        const show = alpha > 0.22 && rowGate && flicker;
        const outAlpha = (show ? Math.min(1, alpha * 1.15) : 0) * diffMod * loopEnv;
        p.on = outAlpha >= 0.03 ? 1 : 0;
        p.drawScale = outAlpha;
        p.snapPx = p.baseX;
        p.snapPy = p.baseY;
      });
      drawParticlesDeduped();
    }

    function drawClusterFrame(ts, loopProgress, skipPhysics) {
      if (!skipPhysics) stepClusterPhysics();
      const sz = Math.round(v('pixSize'));
      const cols = Math.floor(W / sz);
      const rows = Math.floor(H / sz);
      const progress = loopProgress;
      particles.forEach(p => {
        const snap = snapNode(p.x, p.y, sz);
        const diffMod = applyDiffusionWave(p, cols, rows, progress, sz, snap.px, snap.py);
        const loopEnv = getStyleLoopEnvelope(progress);
        p.drawScale = (p.on ? 1 : 0) * diffMod * loopEnv;
        if (!infiniteLoop) p.on = p.on && diffMod >= 0.03 ? 1 : 0;
        p.snapPx = snap.px;
        p.snapPy = snap.py;
      });
      drawParticlesDeduped();
    }

    function resetDustLoop(ts) {
      particles.forEach(p => {
        p.x = p.baseX; p.y = p.baseY; p.vx = 0; p.vy = 0; p.on = 1;
      });
      lastBurst = ts;
      scheduleNextBeat(ts);
    }

    // Infinite loop: revive a share of dimmed nodes at each wrap without
    // touching positions or burst timers, so the loop boundary is invisible.
    function replenishDustLoop() {
      particles.forEach(p => {
        if (!p.on && random() < 0.5) p.on = 1;
      });
    }

    function drawFrame(ts) {
      const cycleMs = getAnimDurationMs();
      if (ts - cycleStart >= cycleMs) {
        cycleStart = ts;
        if (style === 'dust') {
          if (infiniteLoop) replenishDustLoop();
          else resetDustLoop(ts);
        }
      }
      const loopProgress = clamp01((ts - cycleStart) / cycleMs);
      const nodeProgress = getNodeLoopProgress(loopProgress);
      const sampleTs = loopProgress * cycleMs;

      if (bg === 'transparent') bgR.setAttribute('fill', 'none');
      else bgR.setAttribute('fill', bg);

      if (style === 'voxel') drawVoxelFrame(nodeProgress);
      else if (style === 'connected') drawConnectedFrame(nodeProgress);
      else if (style === 'halftone') drawHalftoneFrame(sampleTs, nodeProgress);
      else if (style === 'stream') drawStreamFrame(sampleTs, nodeProgress);
      else {
        if (ts - lastBurst >= scaledNodeAnimIntervalMs(v('burst') * 1000)) triggerBurst(ts);
        if (v('staccato') > 0 && ts >= nextBeatAt) fireStaccatoBeat(ts);
        drawClusterFrame(ts, nodeProgress, false);
      }
    }

    function buildMediaLayers() {
      // Unique ids so several embeds can coexist on one page.
      const uid = 'fgdm' + Math.floor(Math.random() * 1e9).toString(36);
      const defs = document.createElementNS(NS, 'defs');
      svg.insertBefore(defs, bgR);
      mediaLayers = {};
      paletteMedia.forEach((m, i) => {
        const id = uid + '-' + i;
        const mask = document.createElementNS(NS, 'mask');
        mask.setAttribute('id', id);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('x', '0');
        mask.setAttribute('y', '0');
        mask.setAttribute('width', W);
        mask.setAttribute('height', H);
        const g = document.createElementNS(NS, 'g');
        mask.appendChild(g);
        defs.appendChild(mask);
        const img = document.createElementNS(NS, 'image');
        img.setAttribute('href', m.src);
        img.setAttribute('x', '0');
        img.setAttribute('y', '0');
        img.setAttribute('width', W);
        img.setAttribute('height', H);
        img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        img.setAttribute('mask', 'url(#' + id + ')');
        svg.appendChild(img);
        mediaLayers[String(m.color).toLowerCase()] = { group: g, image: img };
      });
    }

    function mount(container) {
      container.innerHTML = '<svg xmlns="' + NS + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" style="width:100%;max-width:100%;height:auto;display:block;"><rect x="0" y="0" width="' + W + '" height="' + H + '" shape-rendering="crispEdges"/><g></g></svg>';
      svg = container.firstElementChild;
      bgR = svg.children[0];
      gR = svg.children[1];
      if (paletteMedia.length) buildMediaLayers();
      spawn();
      attachHover();
    }

    function start() {
      const t0 = performance.now();
      cycleStart = t0;
      lastBurst = t0;
      lastFrame = 0;
      scheduleNextBeat(t0);
      function loop(ts) {
        // Throttle on real time (steady fps), draw on the warped clock.
        if (ts - lastFrame >= FRAME_MS) {
          drawFrame(t0 + (ts - t0) * timeScale);
          lastFrame = ts;
        }
        animId = requestAnimationFrame(loop);
      }
      animId = requestAnimationFrame(loop);
    }

    function stop() {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    }

    return { mount, start, stop, spawn, particleCount: () => particles.length };
  }

  function mountEmbed(wrapId, dataId) {
    const wrap = document.getElementById(wrapId);
    const dataEl = document.getElementById(dataId);
    if (!wrap || !dataEl) return;
    const cfg = JSON.parse(dataEl.textContent);
    const engine = createEngine(cfg);
    engine.mount(wrap);
    engine.start();
  }

  root.FalGlitchDustWebflow = { createEngine, mountEmbed };
})(typeof window !== 'undefined' ? window : globalThis);
