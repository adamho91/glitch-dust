/* fal — Lower Thirds generator (1920×1080) */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const W = 1920;
  const H = 1080;
  const FRAME_MS = 1000 / 24;

  const FAL_2 = [
    { id: '2-a', label: '2-A · Cyan / Purple', colors: ['#99EDFF', '#5718C0'], bg: '#99EDFF' },
    { id: '2-b', label: '2-B · Pink / Red', colors: ['#FFC4D8', '#EC0648'], bg: '#FFC4D8' },
    { id: '2-c', label: '2-C · Green / Cyan', colors: ['#004012', '#99EDFF'], bg: '#004012' },
    { id: '2-d', label: '2-D · Olive / Cyan', colors: ['#403700', '#99EDFF'], bg: '#403700' },
    { id: '2-e', label: '2-E · Yellow / Black', colors: ['#FFFF00', '#000000'], bg: '#FFFF00' },
    { id: '2-f', label: '2-F · Sage / Purple', colors: ['#96AFAC', '#5718C0'], bg: '#96AFAC' },
    { id: '2-g', label: '2-G · Purple / Red', colors: ['#5718C0', '#EC0648'], bg: '#5718C0' },
    { id: '2-h', label: '2-H · Green / Red', colors: ['#004012', '#EC0648'], bg: '#004012' },
    { id: '2-i', label: '2-I · Green / Lime', colors: ['#004012', '#ADFF00'], bg: '#004012' },
    { id: '2-j', label: '2-J · Olive / Lime', colors: ['#403700', '#ADFF00'], bg: '#403700' },
    { id: '2-k', label: '2-K · Lavender / Pink', colors: ['#D5B8FF', '#FFC4D8'], bg: '#D5B8FF' },
    { id: '2-l', label: '2-L · Olive / Lt brown', colors: ['#403700', '#D9D7CC'], bg: '#403700' },
  ];

  const FAL_LOGO_VIEW_W = 435;
  const FAL_LOGO_VIEW_H = 200;
  const FAL_LOGO_BRAND_INNER =
    '<rect width="434.024" height="200" rx="22.5317" fill="{{ACCENT}}"/>' +
    '<path d="M411.492 43.3949V157.015C411.492 175.04 411.289 175.85 409.054 175.85H381.424C379.19 175.85 378.783 175.04 378.783 157.015V43.3949C378.783 25.3697 379.19 24.5596 381.424 24.5596H409.054C411.289 24.5596 411.492 25.3697 411.492 43.3949Z" fill="{{DETAIL}}"/>' +
    '<path d="M334.023 109.823V105.57C334.023 95.443 329.35 91.3924 321.224 91.3924C313.3 91.3924 309.034 95.6455 307.815 103.139C307.408 105.367 307.612 107.19 306.393 107.19H278.966C277.34 107.19 277.34 106.785 277.34 105.367C277.34 94.6329 287.499 72.3545 322.849 72.3545C347.838 72.3545 365.716 82.2785 365.716 109.823V150.329C365.716 159.645 370.795 172.81 370.795 174.632C370.795 175.443 370.186 175.848 369.576 175.848H339.102C337.68 175.848 337.477 175.038 336.461 169.974L335.648 166.126C335.039 163.088 334.632 162.076 333.413 162.076C331.788 162.076 330.772 165.721 326.303 169.974C321.427 174.43 315.535 177.468 305.377 177.468C288.921 177.468 274.09 168.151 274.09 147.898C274.09 125.215 291.765 115.494 317.973 114.481C331.585 113.873 334.023 115.291 334.023 109.823ZM334.023 139.19V135.139C334.023 131.088 333.007 129.873 329.553 130.076L322.036 130.481C312.488 131.088 306.799 135.949 306.799 145.063C306.799 153.974 311.675 158.43 318.786 158.43C326.709 158.43 334.023 151.139 334.023 139.19Z" fill="{{DETAIL}}"/>' +
    '<path d="M218.798 98.8853C218.798 95.0372 217.172 94.6322 209.655 94.6322H205.998C204.576 94.6322 204.373 93.6195 204.373 85.3158V83.898C204.373 75.5943 204.576 74.7842 205.998 74.7842H210.265C217.782 74.7842 218.798 74.1766 218.798 70.531V57.9741C218.798 34.278 230.784 22.5312 253.945 22.5312C263.087 22.5312 269.385 23.949 270.401 24.5566C270.807 24.9616 270.807 25.5692 270.807 33.0628V35.6957C270.807 43.3919 270.807 45.2147 270.198 45.2147C269.588 45.2147 266.744 43.3919 261.868 43.3919C255.367 43.3919 251.304 46.6324 251.304 57.9741V70.531C251.304 74.1766 252.726 74.7842 261.868 74.7842H271.01C272.839 74.7842 272.839 75.5943 272.839 83.898V85.3158C272.839 93.6195 272.636 94.6322 271.214 94.6322H261.868C252.726 94.6322 251.304 95.0372 251.304 98.8853V157.012C251.304 175.037 250.694 175.847 249.069 175.847H220.829C219.204 175.847 218.798 175.037 218.798 157.012V98.8853Z" fill="{{DETAIL}}"/>' +
    '<path d="M120.281 24.9209C122.907 24.9209 125.013 27.0474 125.264 29.6504C127.503 52.8691 146.06 71.3473 169.377 73.5771C171.991 73.8273 174.126 75.9225 174.126 78.5371V122.258C174.126 124.873 171.991 126.969 169.377 127.219C146.06 129.449 127.503 147.927 125.264 171.146C125.013 173.748 122.907 175.875 120.281 175.875H76.376C73.7499 175.875 71.6447 173.748 71.3936 171.146C69.1542 147.927 50.5976 129.449 27.2803 127.219C24.6664 126.969 22.5312 124.873 22.5312 122.258V78.5371C22.5315 75.9225 24.6666 73.8273 27.2803 73.5771C50.5975 71.3473 69.1542 52.8691 71.3936 29.6504C71.6446 27.0474 73.7499 24.9209 76.376 24.9209H120.281ZM98.5869 54.793C73.3927 54.7932 52.969 75.1537 52.9688 100.27C52.9688 125.386 73.3925 145.747 98.5869 145.747C123.781 145.747 144.206 125.386 144.206 100.27C144.206 75.1536 123.781 54.793 98.5869 54.793Z" fill="{{DETAIL}}"/>';

  const FAL_LOGO_LIGHT_VIEW_W = 502;
  const FAL_LOGO_LIGHT_VIEW_H = 200;
  const FAL_LOGO_LIGHT_INNER =
    '<path d="M501.389 26.9308V173.596C501.389 196.864 501.127 197.91 498.247 197.91H462.638C459.758 197.91 459.234 196.864 459.234 173.596V26.9308C459.234 3.66294 459.758 2.61719 462.638 2.61719H498.247C501.127 2.61719 501.389 3.66294 501.389 26.9308Z" fill="{{FILL}}"/>' +
    '<path d="M442.394 164.966V112.678C442.394 77.1258 419.35 64.3135 387.15 64.3135C341.587 64.3135 328.497 93.0692 328.497 106.925C328.497 108.756 328.497 109.28 330.589 109.28H365.936C367.51 109.28 367.247 106.925 367.772 104.051C369.345 94.3802 374.841 88.8892 385.052 88.8892C395.525 88.8892 401.546 94.118 401.546 107.187V112.678C401.546 119.737 398.404 117.907 380.862 118.694C347.088 120 324.307 132.55 324.307 161.83C324.307 187.974 343.422 199.999 364.63 199.999C377.72 199.999 385.314 196.077 391.597 190.323C397.36 184.838 398.666 180.128 400.764 180.128C402.332 180.128 402.857 181.434 403.643 185.357L404.692 190.323C405.998 196.863 406.26 197.907 408.096 197.907H447.371C448.152 197.907 448.939 197.383 448.939 196.339C448.939 193.984 442.394 176.992 442.394 164.966ZM401.546 150.585C401.546 166.009 392.121 175.423 381.911 175.423C372.749 175.423 366.461 169.67 366.461 158.169C366.461 146.405 373.792 140.128 386.101 139.346L395.787 138.822C400.24 138.56 401.546 140.128 401.546 145.356V150.585Z" fill="{{FILL}}"/>' +
    '<path d="M253.047 98.5617C253.047 93.5941 250.953 93.0712 241.265 93.0712H236.552C234.719 93.0712 234.457 91.7643 234.457 81.045V79.2152C234.457 68.4965 234.719 67.4507 236.552 67.4507H242.05C251.738 67.4507 253.047 66.6662 253.047 61.9603V45.7516C253.047 15.1635 268.496 0 298.344 0C310.127 0 318.243 1.82982 319.552 2.61439C320.076 3.13727 320.076 3.92133 320.076 13.5948V16.9938C320.076 26.9285 320.076 29.2812 319.291 29.2812C318.505 29.2812 314.839 26.9285 308.556 26.9285C300.177 26.9285 294.94 31.1115 294.94 45.7521V61.9608C294.94 66.6667 296.773 67.4512 308.556 67.4512H320.338C322.694 67.4512 322.694 68.497 322.694 79.2157V81.0456C322.694 91.7648 322.433 93.0717 320.6 93.0717H308.556C296.773 93.0717 294.94 93.5946 294.94 98.5622V173.594C294.94 196.862 294.155 197.908 292.06 197.908H255.666C253.571 197.908 253.047 196.862 253.047 173.594V98.5617Z" fill="{{FILL}}"/>' +
    '<path d="M189.249 65.5834C159.198 62.7042 135.285 38.8534 132.396 8.88432C132.072 5.52186 129.362 2.77637 125.979 2.77637H69.3931C66.005 2.77637 63.2955 5.52186 62.9716 8.88432C60.0872 38.8534 36.1696 62.7042 6.11824 65.5834C2.75064 65.9073 0 68.6117 0 71.9896V128.426C0 131.799 2.75064 134.504 6.11824 134.827C36.1696 137.707 60.0872 161.557 62.9716 191.532C63.2955 194.889 66.005 197.634 69.3931 197.634H125.979C129.362 197.634 132.072 194.889 132.396 191.532C135.285 161.557 159.198 137.707 189.249 134.827C192.616 134.504 195.372 131.799 195.372 128.426V71.9896C195.372 68.6117 192.616 65.9073 189.249 65.5834ZM97.6861 158.91C65.2132 158.91 38.8894 132.627 38.8894 100.205C38.8894 67.7839 65.2132 41.5012 97.6861 41.5012C130.159 41.5012 156.478 67.7839 156.478 100.205C156.478 132.627 130.154 158.91 97.6861 158.91Z" fill="{{FILL}}"/>';

  const FAL_LOGO_DARK_VIEW_W = 201;
  const FAL_LOGO_DARK_VIEW_H = 200;
  const FAL_LOGO_DARK_INNER =
    '<rect width="200.848" height="199.999" rx="27.4784" fill="{{ACCENT}}"/>' +
    '<path d="M124.535 17.1738C127.419 17.1738 129.731 19.5068 130.007 22.3633C132.466 47.8428 152.848 68.1194 178.458 70.5664C181.329 70.8409 183.674 73.1412 183.674 76.0107V123.988C183.674 126.858 181.329 129.157 178.458 129.432C152.848 131.879 132.466 152.156 130.007 177.636C129.731 180.492 127.419 182.825 124.535 182.825H76.3125C73.4284 182.825 71.1167 180.492 70.8408 177.636C68.3813 152.156 48.0005 131.879 22.3906 129.432C19.5196 129.157 17.1739 126.858 17.1738 123.988V76.0107C17.1738 73.1411 19.5195 70.8408 22.3906 70.5664C48.0005 68.1194 68.3813 47.8428 70.8408 22.3633C71.1166 19.5069 73.4283 17.174 76.3125 17.1738H124.535ZM100.708 49.9541C73.0363 49.9542 50.6045 72.2977 50.6045 99.8594C50.6045 127.421 73.0363 149.765 100.708 149.765C128.38 149.765 150.812 127.421 150.812 99.8594C150.812 72.2977 128.38 49.9541 100.708 49.9541Z" fill="{{DETAIL}}"/>';

  let svg, particleRoot, overlayRoot, logoRoot;
  let particles = [];
  let noiseSeed = 42;
  let activePresetId = '2-b';
  let activeTonalColors = ['#FFC4D8', '#EC0648'];
  let paused = false;
  let animId = null;
  let cycleStart = 0;
  let lastFrame = 0;
  let measureCtx = null;

  function v(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return Number(el.value);
  }

  function clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp01(t), 3);
  }

  function smoothstep(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }

  function hashNoise(n) {
    n = Math.sin(n * 127.1 + noiseSeed * 17.3) * 43758.5453;
    return n - Math.floor(n);
  }

  function getAnimDurationMs() {
    return v('animDuration') * 1000;
  }

  function getLoopProgress(ts) {
    const dur = getAnimDurationMs();
    if (dur <= 0) return 0;
    return ((ts - cycleStart) % dur) / dur;
  }

  function getHeadlineText() {
    return (document.getElementById('headlineText').value || '').trim();
  }

  function getLogoStyle() {
    const el = document.getElementById('logoStyle');
    const s = el ? el.value : 'dark';
    return s === 'brand' || s === 'light' ? s : 'dark';
  }

  function getLogoViewSize(style) {
    if (style === 'light') return { w: FAL_LOGO_LIGHT_VIEW_W, h: FAL_LOGO_LIGHT_VIEW_H };
    if (style === 'dark') return { w: FAL_LOGO_DARK_VIEW_W, h: FAL_LOGO_DARK_VIEW_H };
    return { w: FAL_LOGO_VIEW_W, h: FAL_LOGO_VIEW_H };
  }

  function getLogoInnerTemplate(style) {
    if (style === 'brand') return FAL_LOGO_BRAND_INNER;
    if (style === 'light') return FAL_LOGO_LIGHT_INNER;
    return FAL_LOGO_DARK_INNER;
  }

  function getLogoColors() {
    const style = getLogoStyle();
    const accent = document.getElementById('logoColorAccent').value;
    const detail = document.getElementById('logoColorDetail').value;
    if (style === 'light') {
      const c = accent || '#ffffff';
      return { accent: c, detail: c };
    }
    if (style === 'dark') {
      return { accent: accent || '#ffffff', detail: detail || '#000000' };
    }
    return { accent: accent || '#99EDFF', detail: detail || '#403700' };
  }

  function colorizeLogoMarkup(markup, style, colors) {
    if (!markup.includes('{{')) return markup;
    if (markup.includes('{{ACCENT}}')) {
      return markup
        .replace(/\{\{ACCENT\}\}/g, colors.accent)
        .replace(/\{\{DETAIL\}\}/g, colors.detail);
    }
    return markup.replace(/\{\{FILL\}\}/g, colors.accent);
  }

  function appendLogoMarkup(parent, style, colors) {
    const markup = colorizeLogoMarkup(getLogoInnerTemplate(style), style, colors);
    const doc = new DOMParser().parseFromString(
      '<svg xmlns="' + SVG_NS + '">' + markup + '</svg>',
      'image/svg+xml'
    );
    Array.from(doc.documentElement.childNodes).forEach(node => {
      if (node.nodeType === 1) parent.appendChild(document.importNode(node, true));
    });
  }

  function getMeasureCtx() {
    if (!measureCtx) {
      const c = document.createElement('canvas');
      measureCtx = c.getContext('2d');
    }
    return measureCtx;
  }

  function measureHeadlineWidth(text, fontSize, fontWeight) {
    const ctx = getMeasureCtx();
    ctx.font = fontWeight + ' ' + fontSize + 'px "Focal Upright", sans-serif';
    return ctx.measureText(text || ' ').width;
  }

  function pickColor() {
    const i = Math.floor(Math.random() * activeTonalColors.length);
    return activeTonalColors[i];
  }

  function pickNodeShape(gx, gy) {
    const h = hashNoise(gx * 13.7 + gy * 9.3);
    const circlePct = v('circlePct') / 100;
    return h < circlePct ? 'circle' : 'rect';
  }

  function buildRectCluster(cx, cy, sz, maxCells) {
    const maxLen = Math.round(v('branchLen'));
    const splitProb = v('branchSplit') / 100;
    const axisBias = v('axisBias') / 100;
    const cells = new Set();
    const cellDepth = new Map();
    const key = (gx, gy) => gx + ',' + gy;
    const sx = Math.round(cx / sz);
    const sy = Math.round(cy / sz);
    cells.add(key(sx, sy));
    cellDepth.set(key(sx, sy), 0);
    const queue = [{ gx: sx, gy: sy, dx: 0, dy: 0, rem: 0 }];
    let iter = 0;
    while (cells.size < maxCells && iter < maxCells * 6) {
      iter++;
      if (!queue.length) break;
      const qi = Math.floor(Math.random() * queue.length);
      let { gx, gy, dx, dy, rem } = queue[qi];
      if (rem <= 0 || (dx === 0 && dy === 0)) {
        if (Math.random() < axisBias) {
          const d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          [dx, dy] = d[Math.floor(Math.random() * d.length)];
        } else {
          const d = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
          [dx, dy] = d[Math.floor(Math.random() * d.length)];
        }
        rem = Math.ceil(rnd(1, maxLen));
      }
      const nx = gx + dx;
      const ny = gy + dy;
      const k = key(nx, ny);
      if (!cells.has(k)) {
        cells.add(k);
        cellDepth.set(k, (cellDepth.get(key(gx, gy)) || 0) + 1);
        queue[qi] = { gx: nx, gy: ny, dx, dy, rem: rem - 1 };
        if (Math.random() < splitProb && cells.size < maxCells) {
          const alt = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([adx, ady]) => !(adx === dx && ady === dy));
          const [adx, ady] = alt[Math.floor(Math.random() * alt.length)];
          queue.push({ gx: nx, gy: ny, dx: adx, dy: ady, rem: Math.ceil(rnd(1, maxLen)) });
        }
      } else {
        queue[qi] = { gx: nx, gy: ny, dx, dy, rem: rem - 1 };
      }
      if (rem <= 1) queue.splice(qi, 1);
    }
    return [...cells].map(k => {
      const [gx, gy] = k.split(',').map(Number);
      return { gx, gy, depth: cellDepth.get(k) || 0 };
    });
  }

  function getLayout(fullText) {
    const marginL = v('marginLeft');
    const marginB = v('marginBottom');
    const logoSize = v('logoSize');
    const logoGap = v('logoGap');
    const barHeight = v('barHeight');
    const barPad = v('barPad');
    const fontSize = v('fontSize');
    const fontWeight = 480;
    const maxBarW = v('barMaxWidth');
    const textW = measureHeadlineWidth(fullText || 'Headline', fontSize, fontWeight);
    const barWidth = Math.min(maxBarW, Math.max(120, textW + barPad * 2));

    const logoX = marginL;
    const logoY = H - marginB - logoSize;
    const logoCenterY = logoY + logoSize / 2;
    const barX = logoX + logoSize + logoGap;
    const barY = logoCenterY - barHeight / 2;

    const badgeW = 141;
    const badgeH = 32;
    const badgeX = barX + barWidth - badgeW + v('badgeOffsetX');
    const badgeY = barY + barHeight + v('badgeGap');

    const dustAnchorX = barX + barWidth + v('dustOffsetX');
    const dustAnchorY = barY + barHeight * 0.35;

    return {
      logoX, logoY, logoSize, barX, barY, barWidth, barHeight, barPad,
      fontSize, fontWeight, badgeX, badgeY, badgeW, badgeH,
      dustAnchorX, dustAnchorY,
    };
  }

  function getTypewriterState(progress) {
    const full = getHeadlineText();
    if (!full) return { visible: '', count: 0, total: 0 };
    const total = full.length;
    const speed = v('typeSpeed') / 100;
    const introEnd = v('logoIntro') / 100;
    const typeStart = introEnd * 0.6;
    const typeEnd = Math.min(0.92, typeStart + 0.45 / Math.max(0.25, speed));
    let count;
    if (progress < typeStart) count = 0;
    else if (progress >= typeEnd) count = total;
    else {
      const t = (progress - typeStart) / (typeEnd - typeStart);
      count = Math.floor(total * easeOutCubic(t * speed));
    }
    count = Math.max(0, Math.min(total, count));
    return { visible: full.slice(0, count), count, total };
  }

  function getLogoScale(progress) {
    const introEnd = v('logoIntro') / 100;
    const t = introEnd > 0 ? clamp01(progress / introEnd) : 1;
    return lerp(0.5, 1, easeOutCubic(t));
  }

  function spawnDustCluster(layout) {
    particles = [];
    noiseSeed = Math.random() * 200;
    const sz = Math.round(v('pixSize'));
    const maxCells = Math.round(v('dustCells'));
    const cells = buildRectCluster(layout.dustAnchorX, layout.dustAnchorY, sz, maxCells);
    cells.forEach((cell, i) => {
      const bx = cell.gx * sz;
      const by = cell.gy * sz;
      particles.push({
        x: bx,
        y: by,
        baseX: bx,
        baseY: by,
        sz,
        shape: pickNodeShape(cell.gx, cell.gy),
        col: pickColor(),
        on: 1,
        appearT: hashNoise(i * 3.1 + cell.depth * 0.7),
        depth: cell.depth,
        el: null,
        drawScale: 0,
      });
    });
    mountParticleElements();
  }

  function mountParticleElements() {
    particleRoot.replaceChildren();
    particles.forEach(p => {
      const el = document.createElementNS(SVG_NS, p.shape === 'circle' ? 'circle' : 'rect');
      el.setAttribute('shape-rendering', 'crispEdges');
      p.el = el;
      particleRoot.appendChild(el);
    });
  }

  function drawScaledParticle(p, scale) {
    const s = clamp01(scale);
    if (s < 0.02) {
      p.el.setAttribute('visibility', 'hidden');
      return;
    }
    p.el.setAttribute('visibility', 'visible');
    p.el.setAttribute('fill', p.col);
    const cx = p.baseX + p.sz / 2;
    const cy = p.baseY + p.sz / 2;
    const side = p.sz * s;
    if (p.shape === 'circle') {
      p.el.setAttribute('cx', cx);
      p.el.setAttribute('cy', cy);
      p.el.setAttribute('r', Math.max(0.5, side / 2));
    } else {
      p.el.setAttribute('x', cx - side / 2);
      p.el.setAttribute('y', cy - side / 2);
      p.el.setAttribute('width', Math.max(0.5, side));
      p.el.setAttribute('height', Math.max(0.5, side));
    }
  }

  function drawDustFrame(progress) {
    const introEnd = v('logoIntro') / 100;
    const dustStart = introEnd + 0.05;
    const dustBuild = 0.22;
    particles.forEach(p => {
      let alpha = 0;
      if (progress >= dustStart) {
        const local = (progress - dustStart) / dustBuild;
        const stagger = p.appearT * 0.65;
        alpha = smoothstep((local - stagger) / 0.35);
        const pulse = 0.92 + 0.08 * Math.sin(progress * Math.PI * 8 + p.depth);
        alpha *= pulse;
      }
      p.drawScale = alpha;
      drawScaledParticle(p, alpha);
    });
  }

  function renderLogo(progress, layout) {
    logoRoot.replaceChildren();
    const style = getLogoStyle();
    const view = getLogoViewSize(style);
    const colors = getLogoColors();
    const baseScale = layout.logoSize / view.h;
    const animScale = getLogoScale(progress);
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'lt-logo');
    const cx = layout.logoX + layout.logoSize / 2;
    const cy = layout.logoY + layout.logoSize / 2;
    group.setAttribute(
      'transform',
      'translate(' + cx + ',' + cy + ') scale(' + (baseScale * animScale) + ') translate(' + (-view.w / 2) + ',' + (-view.h / 2) + ')'
    );
    appendLogoMarkup(group, style, colors);
    logoRoot.appendChild(group);
  }

  function renderOverlay(progress) {
    overlayRoot.replaceChildren();
    const full = getHeadlineText();
    if (!full) return;

    const layout = getLayout(full);
    const tw = getTypewriterState(progress);
    const barColor = document.getElementById('barColor').value || activeTonalColors[1] || '#EC0648';
    const textColor = document.getElementById('textColor').value || '#FFFFFF';
    const logoScale = getLogoScale(progress);

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'lt-overlay');

    const bar = document.createElementNS(SVG_NS, 'rect');
    bar.setAttribute('x', layout.barX);
    bar.setAttribute('y', layout.barY);
    bar.setAttribute('width', layout.barWidth);
    bar.setAttribute('height', layout.barHeight);
    bar.setAttribute('fill', barColor);
    bar.setAttribute('opacity', String(smoothstep(logoScale)));
    group.appendChild(bar);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', layout.barX + layout.barPad);
    text.setAttribute('y', layout.barY + layout.barHeight / 2);
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-family', "'Focal Upright', sans-serif");
    text.setAttribute('font-size', String(layout.fontSize));
    text.setAttribute('font-weight', '480');
    text.setAttribute('letter-spacing', String(layout.fontSize * -0.01));
    text.setAttribute('fill', textColor);
    text.setAttribute('opacity', tw.visible.length ? '1' : '0');
    text.textContent = tw.visible || '';
    group.appendChild(text);

    if (document.getElementById('showBadge').checked) {
      const badgeBg = document.createElementNS(SVG_NS, 'rect');
      badgeBg.setAttribute('x', layout.badgeX);
      badgeBg.setAttribute('y', layout.badgeY);
      badgeBg.setAttribute('width', layout.badgeW);
      badgeBg.setAttribute('height', layout.badgeH);
      badgeBg.setAttribute('fill', '#FFFFFF');
      badgeBg.setAttribute('opacity', String(smoothstep(Math.max(0, logoScale - 0.2))));
      group.appendChild(badgeBg);

      const badgeText = document.createElementNS(SVG_NS, 'text');
      badgeText.setAttribute('x', layout.badgeX + layout.badgeW / 2);
      badgeText.setAttribute('y', layout.badgeY + layout.badgeH / 2 + 1);
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('dominant-baseline', 'central');
      badgeText.setAttribute('font-family', "'HAL Timezone Mono', monospace");
      badgeText.setAttribute('font-size', '25');
      badgeText.setAttribute('letter-spacing', '-0.01em');
      badgeText.setAttribute('fill', '#000000');
      badgeText.setAttribute('opacity', String(smoothstep(Math.max(0, logoScale - 0.25))));
      badgeText.textContent = 'fal.ai';
      group.appendChild(badgeText);
    }

    overlayRoot.appendChild(group);
  }

  function drawFrame(ts) {
    const progress = getLoopProgress(ts);
    const layout = getLayout(getHeadlineText());
    renderLogo(progress, layout);
    renderOverlay(progress);
    drawDustFrame(progress);
    const tw = getTypewriterState(progress);
    const status = document.getElementById('status');
    if (status) {
      status.textContent = tw.total
        ? tw.count + ' / ' + tw.total + ' chars · ' + Math.round(progress * 100) + '%'
        : 'Enter headline text';
    }
  }

  function loop(ts) {
    if (!paused && ts - lastFrame >= FRAME_MS) {
      drawFrame(ts);
      lastFrame = ts;
    }
    animId = requestAnimationFrame(loop);
  }

  function beginCycle() {
    const layout = getLayout(getHeadlineText());
    spawnDustCluster(layout);
    cycleStart = performance.now();
    lastFrame = 0;
    drawFrame(cycleStart);
  }

  function startAnim() {
    paused = false;
    document.getElementById('animBtn').textContent = 'Pause';
    if (!particles.length) beginCycle();
  }

  function pauseAnim() {
    paused = true;
    document.getElementById('animBtn').textContent = 'Resume';
  }

  function applyTonalPreset(preset) {
    activePresetId = preset.id;
    activeTonalColors = preset.colors.slice();
    document.getElementById('barColor').value = preset.colors[1] || preset.colors[0];
    renderTonalPresets();
    beginCycle();
  }

  function renderTonalPresets() {
    const container = document.getElementById('tonalPresets');
    if (!container) return;
    container.replaceChildren();
    FAL_2.forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tonal-preset' + (preset.id === activePresetId ? ' active' : '');
      btn.innerHTML = '<span>' + preset.label + '</span><span class="chips"></span>';
      const chips = btn.querySelector('.chips');
      preset.colors.forEach(hex => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.style.background = hex;
        chips.appendChild(chip);
      });
      btn.onclick = () => applyTonalPreset(preset);
      container.appendChild(btn);
    });
  }

  function updateLogoColorUi() {
    const style = getLogoStyle();
    const detailRow = document.getElementById('logoDetailRow');
    if (detailRow) detailRow.style.display = style === 'light' ? 'none' : '';
  }

  function wireControls() {
    document.getElementById('genBtn').onclick = beginCycle;
    document.getElementById('animBtn').onclick = () => {
      if (paused) startAnim();
      else pauseAnim();
    };

    document.getElementById('logoStyle').onchange = () => {
      updateLogoColorUi();
      drawFrame(performance.now());
    };
    document.getElementById('logoColorAccent').oninput = () => drawFrame(performance.now());
    document.getElementById('logoColorDetail').oninput = () => drawFrame(performance.now());
    document.getElementById('barColor').oninput = () => drawFrame(performance.now());
    document.getElementById('textColor').oninput = () => drawFrame(performance.now());
    document.getElementById('showBadge').onchange = () => drawFrame(performance.now());

    document.getElementById('headlineText').oninput = () => {
      beginCycle();
    };

    const rerender = () => drawFrame(performance.now());
    [
      'marginLeft', 'marginBottom', 'logoSize', 'logoGap', 'logoIntro',
      'barHeight', 'barPad', 'barMaxWidth', 'fontSize', 'typeSpeed',
      'animDuration', 'pixSize', 'dustCells', 'dustOffsetX', 'badgeGap',
      'badgeOffsetX', 'branchLen', 'branchSplit', 'axisBias', 'circlePct',
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => {
        if (['pixSize', 'dustCells', 'branchLen', 'branchSplit', 'axisBias', 'circlePct', 'dustOffsetX'].includes(id)) {
          beginCycle();
        } else {
          rerender();
        }
      };
    });
  }

  function init() {
    svg = document.getElementById('s');
    particleRoot = document.getElementById('particleRoot');
    overlayRoot = document.getElementById('overlayRoot');
    logoRoot = document.getElementById('logoRoot');

    renderTonalPresets();
    updateLogoColorUi();
    wireControls();

    if (typeof initDialSliders === 'function') {
      initDialSliders(document.getElementById('controls'));
    }

    beginCycle();
    paused = false;
    animId = requestAnimationFrame(loop);

    document.fonts.load('480 50px "Focal Upright"').catch(() => {});
    document.fonts.load('400 25px "HAL Timezone Mono"').catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
