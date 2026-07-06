/* fal — Lower Thirds generator (1920×1080) */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const W = 1920;
  const H = 1080;
  const FRAME_MS = 1000 / 24;

  const FAL_2 = [
    { id: '2-a', label: '2-A · Cyan / Lime', colors: ['#99EDFF', '#ADFF00'], bg: '#99EDFF', group: 'blue' },
    { id: '2-b', label: '2-B · Pink / Red', colors: ['#FFC4D8', '#EC0648'], bg: '#FFC4D8', group: 'pink' },
    { id: '2-c', label: '2-C · Green / Cyan', colors: ['#004012', '#99EDFF'], bg: '#004012', group: 'green' },
    { id: '2-d', label: '2-D · Olive / Cyan', colors: ['#403700', '#99EDFF'], bg: '#403700', group: 'blue' },
    { id: '2-e', label: '2-E · Yellow / Black', colors: ['#FFFF00', '#000000'], bg: '#FFFF00', group: 'lime' },
    { id: '2-f', label: '2-F · Sage / Lime', colors: ['#96AFAC', '#ADFF00'], bg: '#96AFAC', group: 'green' },
    { id: '2-g', label: '2-G · Lime / Red', colors: ['#ADFF00', '#EC0648'], bg: '#ADFF00', group: 'lime' },
    { id: '2-h', label: '2-H · Green / Red', colors: ['#004012', '#EC0648'], bg: '#004012', group: 'green' },
    { id: '2-i', label: '2-I · Green / Lime', colors: ['#004012', '#ADFF00'], bg: '#004012', group: 'green' },
    { id: '2-j', label: '2-J · Olive / Lime', colors: ['#403700', '#ADFF00'], bg: '#403700', group: 'lime' },
    { id: '2-k', label: '2-K · Lime / Pink', colors: ['#C8FF66', '#FFC4D8'], bg: '#C8FF66', group: 'lime' },
    { id: '2-l', label: '2-L · Olive / Lt brown', colors: ['#403700', '#D9D7CC'], bg: '#403700', group: 'neutral' },
    { id: '2-m', label: '2-M · Lt blue / Royal', colors: ['#C5E9FF', '#115EF3'], bg: '#C5E9FF', group: 'blue' },
    { id: '2-n', label: '2-N · White / Red', colors: ['#FFFFFF', '#EC0648'], bg: '#FFFFFF', group: 'pink' },
    { id: '2-o', label: '2-O · Sage / Brown', colors: ['#E5ECE7', '#403700'], bg: '#E5ECE7', group: 'neutral' },
    { id: '2-p', label: '2-P · Royal / Cyan', colors: ['#115EF3', '#99EDFF'], bg: '#115EF3', group: 'blue' },
    { id: '2-q', label: '2-Q · Red / Pink', colors: ['#EC0648', '#FFC4D8'], bg: '#EC0648', group: 'pink' },
    { id: '2-r', label: '2-R · Black / White', colors: ['#000000', '#FFFFFF'], bg: '#000000', group: 'neutral' },
    { id: '2-s', label: '2-S · Black / Lime', colors: ['#000000', '#ADFF00'], bg: '#000000', group: 'neutral' },
    { id: '2-t', label: '2-T · Black / Pink', colors: ['#000000', '#F57EC3'], bg: '#000000', group: 'pink' },
    { id: '2-u', label: '2-U · Olive / Yellow', colors: ['#403700', '#FFFF00'], bg: '#403700', group: 'neutral' },
    { id: '2-v', label: '2-V · Lt lime / Green', colors: ['#C8FF66', '#004012'], bg: '#C8FF66', group: 'green' },
    { id: '2-w', label: '2-W · Baby blue / Blue', colors: ['#3FB5FE', '#115EF3'], bg: '#C5E9FF', group: 'blue' },
    { id: '2-x', label: '2-X · Yellow / Blue', colors: ['#FFFF00', '#115EF3'], bg: '#FFFF00', group: 'lime' },
    { id: '2-y', label: '2-Y · Teal / Lt blue', colors: ['#004012', '#C5E9FF'], bg: '#004012', group: 'green' },
    { id: '2-z', label: '2-Z · Pink / White', colors: ['#F57EC3', '#FFFFFF'], bg: '#F57EC3', group: 'pink' },
  ];

  const TONAL_GROUP_ORDER = [
    { id: 'blue', label: 'Blue / Cyan' },
    { id: 'green', label: 'Green / Teal' },
    { id: 'lime', label: 'Lime / Yellow' },
    { id: 'pink', label: 'Pink / Red' },
    { id: 'neutral', label: 'Neutral / Earth' },
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
  let scrubMode = false;
  let scrubProgress = 0;
  let animId = null;
  let cycleStart = 0;
  let lastFrame = 0;
  let measureCtx = null;
  let exportCancelRequested = false;
  let exportRunMeta = { format: '', fps: 0, totalFrames: 0 };
  let mp4MuxerModule = null;
  let focalUprightDataUrlPromise = null;
  let exportFontRegistered = false;
  let presetStore = null;
  let presetApplyInProgress = false;
  let presetAutosaveTimer = null;

  const PRESET_STORAGE_KEY = 'fal-lower-thirds-presets-v1';
  const BUILTIN_DEFAULT_ID = 'lt-builtin-default';

  const SLIDER_IDS = [
    'fontSize', 'barHeight', 'barPad', 'barMaxWidth', 'typeSpeed',
    'logoSize', 'logoIntro', 'margin', 'logoGap',
    'badgeGap', 'badgeOffsetX', 'pixSize', 'shapeMin', 'shapeMax', 'dustCells', 'dustOffsetX',
    'branchLen', 'branchSplit', 'axisBias', 'circlePct', 'squarePct', 'animDuration',
  ];

  function v(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return Number(el.value);
  }

  function clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  const WCAG_AA_CONTRAST = 4.5;

  function parseHexColor(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let h = hex.trim();
    if (!h.startsWith('#')) h = '#' + h;
    if (h.length === 4) {
      h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
    };
  }

  function relativeLuminance(rgb) {
    const channel = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function contrastRatio(hexA, hexB) {
    const a = parseHexColor(hexA);
    const b = parseHexColor(hexB);
    if (!a || !b) return 1;
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function pickAccessibleBarText(colors) {
    const palette = (colors || []).filter(Boolean);
    const barCandidates = palette.length >= 2 ? [palette[1], palette[0]] : palette.length ? [palette[0]] : ['#EC0648'];
    const textCandidates = [...new Set([...palette, '#FFFFFF', '#000000'])];

    let best = null;
    barCandidates.forEach((bar, barIdx) => {
      textCandidates.forEach(text => {
        if (text.toLowerCase() === bar.toLowerCase()) return;
        const ratio = contrastRatio(bar, text);
        if (ratio < WCAG_AA_CONTRAST) return;
        const paletteScore =
          (barIdx === 0 ? 2 : 1) +
          (palette.indexOf(text) === 0 ? 1 : 0) -
          (text === '#FFFFFF' || text === '#000000' ? 0.25 : 0);
        const score = ratio + paletteScore * 0.001;
        if (!best || score > best.score) best = { bar, text, ratio, score };
      });
    });

    if (best) return best;

    const bar = barCandidates[0];
    const text = contrastRatio(bar, '#000000') >= contrastRatio(bar, '#FFFFFF') ? '#000000' : '#FFFFFF';
    return { bar, text, ratio: contrastRatio(bar, text) };
  }

  function applyAccessiblePresetColors(preset) {
    const pair = pickAccessibleBarText(preset.colors);
    document.getElementById('barColor').value = pair.bar;
    document.getElementById('textColor').value = pair.text;
    return pair;
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

  function isHeadlineStatic() {
    const el = document.getElementById('headlineStatic');
    return el && el.checked;
  }

  function updateHeadlineTypeUi() {
    const row = document.getElementById('typeSpeedRow');
    if (row) row.style.display = isHeadlineStatic() ? 'none' : '';
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

  function pickNodeShape(gx, gy, salt) {
    const cir = Math.max(0, v('circlePct'));
    const sq = Math.max(0, v('squarePct'));
    const total = Math.max(1, cir + sq);
    const h = hashNoise(gx * 11.3 + gy * 19.7 + (salt || 0) + noiseSeed * 0.31);
    return h < cir / total ? 'circle' : 'rect';
  }

  function pickBranchDirection() {
    const axisBias = v('axisBias') / 100;
    const r = Math.random();
    if (r < 0.36) return [1, 0];
    if (r < 0.72) return [0, -1];
    if (r < 0.84) return [1, -1];
    if (Math.random() < axisBias) {
      const d = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      return d[Math.floor(Math.random() * d.length)];
    }
    const d = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    return d[Math.floor(Math.random() * d.length)];
  }

  function buildRectCluster(rootTopLeftX, rootTopLeftY, sz, maxCells) {
    const maxLen = Math.round(v('branchLen'));
    const splitProb = v('branchSplit') / 100;
    const cells = new Set();
    const cellDepth = new Map();
    const key = (gx, gy) => gx + ',' + gy;
    const sx = Math.round(rootTopLeftX / sz);
    const sy = Math.round(rootTopLeftY / sz);
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
        [dx, dy] = pickBranchDirection();
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

  function snapPx(n) {
    return Math.round(n);
  }

  function getLayout(fullText) {
    const margin = v('margin');
    const marginL = margin;
    const marginB = margin;
    const logoSize = v('logoSize');
    const logoGap = v('logoGap');
    const barHeight = v('barHeight');
    const barPad = v('barPad');
    const fontSize = v('fontSize');
    const fontWeight = 480;
    const maxBarW = v('barMaxWidth');
    const textW = measureHeadlineWidth(fullText || 'Headline', fontSize, fontWeight);
    const barWidth = Math.ceil(Math.min(maxBarW, Math.max(120, textW + barPad * 2)));

    const logoX = snapPx(marginL);
    const logoY = snapPx(H - marginB - logoSize);
    const logoCenterY = logoY + logoSize / 2;
    const barX = snapPx(logoX + logoSize + logoGap);
    const barY = snapPx(logoCenterY - barHeight / 2);

    const badgeW = 141;
    const badgeH = 32;
    const badgeX = snapPx(barX + barWidth - badgeW + v('badgeOffsetX'));
    const badgeY = snapPx(barY + barHeight + v('badgeGap'));

    return {
      logoX, logoY, logoSize: snapPx(logoSize), barX, barY,
      barWidth, barHeight: snapPx(barHeight), barPad: snapPx(barPad),
      fontSize: snapPx(fontSize), fontWeight, badgeX, badgeY, badgeW, badgeH,
    };
  }

  function getDustRootTopLeft(layout, sz) {
    return {
      x: layout.barX + layout.barWidth + v('dustOffsetX'),
      y: layout.barY - sz,
    };
  }

  function getTypewriterState(progress) {
    const full = getHeadlineText();
    if (!full) return { visible: '', count: 0, total: 0 };
    const total = full.length;
    if (isHeadlineStatic()) {
      return { visible: full, count: total, total };
    }
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
    const root = getDustRootTopLeft(layout, sz);
    const cells = buildRectCluster(0, 0, sz, maxCells);
    cells.forEach((cell, i) => {
      const bx = root.x + cell.gx * sz;
      const by = root.y + cell.gy * sz;
      particles.push({
        x: bx,
        y: by,
        baseX: bx,
        baseY: by,
        sz,
        shape: pickNodeShape(cell.gx, cell.gy, i),
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

  function getShapeDrawScale(raw) {
    const lo = Math.min(v('shapeMin'), v('shapeMax')) / 100;
    const hi = Math.max(v('shapeMin'), v('shapeMax')) / 100;
    if (raw < 0.02) return 0;
    return lo + clamp01(raw) * (hi - lo);
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
      p.drawScale = getShapeDrawScale(alpha);
      drawScaledParticle(p, p.drawScale);
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
    bar.setAttribute('x', String(layout.barX));
    bar.setAttribute('y', String(layout.barY));
    bar.setAttribute('width', String(layout.barWidth));
    bar.setAttribute('height', String(layout.barHeight));
    bar.setAttribute('fill', barColor);
    bar.setAttribute('shape-rendering', 'crispEdges');
    bar.setAttribute('opacity', String(logoScale >= 0.995 ? 1 : smoothstep(logoScale)));
    group.appendChild(bar);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(layout.barX + layout.barPad));
    text.setAttribute('y', String(snapPx(layout.barY + layout.barHeight / 2)));
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-family', "'Focal Upright', sans-serif");
    text.setAttribute('font-size', String(layout.fontSize));
    text.setAttribute('font-weight', '480');
    text.setAttribute('letter-spacing', String(snapPx(layout.fontSize * -0.01)));
    text.setAttribute('fill', textColor);
    text.setAttribute('text-rendering', 'geometricPrecision');
    text.setAttribute('opacity', tw.visible.length ? '1' : '0');
    text.textContent = tw.visible || '';
    group.appendChild(text);

    if (document.getElementById('showBadge').checked) {
      const badgeBg = document.createElementNS(SVG_NS, 'rect');
      badgeBg.setAttribute('x', String(layout.badgeX));
      badgeBg.setAttribute('y', String(layout.badgeY));
      badgeBg.setAttribute('width', String(layout.badgeW));
      badgeBg.setAttribute('height', String(layout.badgeH));
      badgeBg.setAttribute('fill', '#FFFFFF');
      badgeBg.setAttribute('shape-rendering', 'crispEdges');
      const badgeOpacity = logoScale >= 0.995 ? 1 : smoothstep(Math.max(0, logoScale - 0.2));
      badgeBg.setAttribute('opacity', String(badgeOpacity >= 0.995 ? 1 : badgeOpacity));
      group.appendChild(badgeBg);

      const badgeText = document.createElementNS(SVG_NS, 'text');
      badgeText.setAttribute('x', String(snapPx(layout.badgeX + layout.badgeW / 2)));
      badgeText.setAttribute('y', String(snapPx(layout.badgeY + layout.badgeH / 2)));
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

  function renderAtProgress(progress) {
    const layout = getLayout(getHeadlineText());
    renderLogo(progress, layout);
    renderOverlay(progress);
    drawDustFrame(progress);
  }

  function getFrameProgress(ts) {
    const cycleMs = getAnimDurationMs();
    if (!cycleStart) cycleStart = ts;
    if (scrubMode) return scrubProgress;
    if (cycleMs <= 0) return 0;
    return ((ts - cycleStart) % cycleMs) / cycleMs;
  }

  function updateStatus(progress) {
    const status = document.getElementById('status');
    if (!status) return;
    const tw = getTypewriterState(progress);
    const cycleMs = getAnimDurationMs();
    const frameNum = Math.floor(progress * cycleMs / FRAME_MS);
    const frameTotal = Math.max(1, Math.floor(cycleMs / FRAME_MS));
    const pct = Math.round(progress * 100);
    const scrubTag = scrubMode ? ' · scrub' : '';
    if (!tw.total) {
      status.textContent = 'Enter headline text';
    } else if (isHeadlineStatic()) {
      status.textContent = 'Lower thirds · ' + W + '×' + H + ' · frame ' + frameNum + '/' + frameTotal + ' (' + pct + '%)' + scrubTag;
    } else {
      status.textContent = tw.count + ' / ' + tw.total + ' chars · frame ' + frameNum + '/' + frameTotal + ' (' + pct + '%)' + scrubTag;
    }
  }

  function drawFrame(ts) {
    const progress = getFrameProgress(ts);
    renderAtProgress(progress);
    updateStatus(progress);
  }

  function loop(ts) {
    if (!paused && ts - lastFrame >= FRAME_MS) {
      drawFrame(ts);
      lastFrame = ts;
    }
    animId = requestAnimationFrame(loop);
  }

  function beginCycle(opts) {
    opts = opts || {};
    const preserveScrub = !!(opts.preserveScrub && scrubMode);
    const savedScrubProgress = preserveScrub ? scrubProgress : null;
    const layout = getLayout(getHeadlineText());
    spawnDustCluster(layout);
    if (preserveScrub) {
      cycleStart = performance.now() - savedScrubProgress * getAnimDurationMs();
    } else {
      cycleStart = performance.now();
      scrubMode = false;
      const line = document.getElementById('scrubLine');
      const wrap = document.getElementById('previewWrap');
      if (line) line.style.display = 'none';
      if (wrap) wrap.classList.remove('scrub-active');
    }
    lastFrame = 0;
    drawFrame(preserveScrub ? performance.now() : cycleStart);
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
    applyAccessiblePresetColors(preset);
    renderTonalPresets();
    schedulePresetAutosave();
    beginCycle();
  }

  function renderTonalPresets() {
    const container = document.getElementById('tonalPresets');
    if (!container) return;
    container.replaceChildren();
    TONAL_GROUP_ORDER.forEach(section => {
      const items = FAL_2.filter(p => p.group === section.id);
      if (!items.length) return;
      const heading = document.createElement('div');
      heading.className = 'tonal-preset-group';
      heading.textContent = section.label;
      container.appendChild(heading);
      items.forEach(preset => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tonal-preset' + (preset.id === activePresetId ? ' active' : '');
        btn.innerHTML = '<span>' + preset.label + '</span><span class="chips"></span>';
        const pair = pickAccessibleBarText(preset.colors);
        btn.title = 'Bar ' + pair.bar + ' · Text ' + pair.text + ' · ' + pair.ratio.toFixed(1) + ':1 contrast';
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
    });
  }

  function updateLogoColorUi() {
    const style = getLogoStyle();
    const detailRow = document.getElementById('logoDetailRow');
    if (detailRow) detailRow.style.display = style === 'light' ? 'none' : '';
  }

  function buildDefaultSettings() {
    return {
      v: 1,
      type: 'fal-lower-thirds',
      headline: 'How to access Seedance 2.0 API',
      headlineStatic: false,
      noiseSeed: 42,
      activePresetId: '2-b',
      activeTonalColors: ['#FFC4D8', '#EC0648'],
      logoStyle: 'dark',
      showBadge: true,
      colors: {
        bar: '#EC0648',
        text: '#FFFFFF',
        logoAccent: '#FFFFFF',
        logoDetail: '#000000',
      },
      sliders: {
        fontSize: '50',
        barHeight: '63',
        barPad: '10',
        barMaxWidth: '754',
        typeSpeed: '100',
        logoSize: '126',
        logoIntro: '18',
        margin: '42',
        logoGap: '17',
        badgeGap: '0',
        badgeOffsetX: '28',
        pixSize: '21',
        shapeMin: '100',
        shapeMax: '100',
        dustCells: '18',
        dustOffsetX: '0',
        branchLen: '7',
        branchSplit: '55',
        axisBias: '33',
        circlePct: '7',
        squarePct: '85',
        animDuration: '5',
      },
    };
  }

  function getActivePreset() {
    if (!presetStore || !presetStore.presets.length) {
      return { id: BUILTIN_DEFAULT_ID, name: 'Default', builtin: true, settings: buildDefaultSettings() };
    }
    return presetStore.presets.find(p => p.id === presetStore.activeId) || presetStore.presets[0];
  }

  function collectSettings() {
    const sliders = {};
    SLIDER_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) sliders[id] = el.value;
    });
    return {
      v: 1,
      type: 'fal-lower-thirds',
      headline: getHeadlineText(),
      headlineStatic: isHeadlineStatic(),
      noiseSeed,
      activePresetId,
      activeTonalColors: activeTonalColors.slice(),
      logoStyle: getLogoStyle(),
      showBadge: document.getElementById('showBadge').checked,
      colors: {
        bar: document.getElementById('barColor').value,
        text: document.getElementById('textColor').value,
        logoAccent: document.getElementById('logoColorAccent').value,
        logoDetail: document.getElementById('logoColorDetail').value,
      },
      sliders,
    };
  }

  function applySettings(settings, opts) {
    opts = opts || {};
    presetApplyInProgress = true;
    const s = settings || buildDefaultSettings();

    document.getElementById('headlineText').value = s.headline != null ? s.headline : '';
    document.getElementById('headlineStatic').checked = !!s.headlineStatic;
    document.getElementById('showBadge').checked = s.showBadge !== false;
    document.getElementById('logoStyle').value = s.logoStyle || 'dark';

    if (s.colors) {
      document.getElementById('barColor').value = s.colors.bar || '#EC0648';
      document.getElementById('textColor').value = s.colors.text || '#FFFFFF';
      document.getElementById('logoColorAccent').value = s.colors.logoAccent || '#FFFFFF';
      document.getElementById('logoColorDetail').value = s.colors.logoDetail || '#000000';
    }

    if (s.sliders) {
      Object.keys(s.sliders).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = s.sliders[id];
      });
    }

    activePresetId = s.activePresetId || '2-b';
    const tonal = FAL_2.find(p => p.id === activePresetId);
    activeTonalColors = (s.activeTonalColors || (tonal ? tonal.colors.slice() : ['#FFC4D8', '#EC0648'])).slice();
    noiseSeed = s.noiseSeed != null ? s.noiseSeed : 42;

    renderTonalPresets();
    updateLogoColorUi();
    updateHeadlineTypeUi();
    if (typeof syncDialSliders === 'function') syncDialSliders();

    presetApplyInProgress = false;
    if (!opts.skipRegen) beginCycle({ preserveScrub: scrubMode });
    else drawFrame(performance.now());
  }

  function loadPresetStore() {
    const defaults = {
      activeId: BUILTIN_DEFAULT_ID,
      presets: [{
        id: BUILTIN_DEFAULT_ID,
        name: 'Default',
        builtin: true,
        settings: buildDefaultSettings(),
      }],
    };
    try {
      const raw = localStorage.getItem(PRESET_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.presets) || !parsed.presets.length) return defaults;
      parsed.presets = parsed.presets.filter(p => p && p.settings && p.settings.sliders);
      if (!parsed.presets.length) return defaults;
      if (!parsed.presets.some(p => p.id === BUILTIN_DEFAULT_ID)) {
        parsed.presets.unshift(defaults.presets[0]);
      }
      parsed.activeId = parsed.presets.some(p => p.id === parsed.activeId)
        ? parsed.activeId
        : BUILTIN_DEFAULT_ID;
      return parsed;
    } catch (e) {
      return defaults;
    }
  }

  function persistPresetStore() {
    if (!presetStore) return;
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presetStore));
    } catch (e) {
      console.warn('Could not persist lower-thirds presets:', e);
    }
  }

  function renderPresetSelect() {
    const sel = document.getElementById('presetSelect');
    if (!sel || !presetStore) return;
    sel.replaceChildren();
    presetStore.presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.builtin ? ' · built-in' : '');
      opt.selected = p.id === presetStore.activeId;
      sel.appendChild(opt);
    });
    const delBtn = document.getElementById('presetDelete');
    if (delBtn) delBtn.disabled = !!getActivePreset().builtin;
  }

  function saveActivePresetFromUI() {
    const preset = getActivePreset();
    if (!preset) return;
    preset.settings = collectSettings();
    const nameEl = document.getElementById('presetName');
    const name = nameEl && nameEl.value.trim();
    if (name) preset.name = name;
  }

  function schedulePresetAutosave() {
    if (presetApplyInProgress) return;
    clearTimeout(presetAutosaveTimer);
    presetAutosaveTimer = setTimeout(() => {
      saveActivePresetFromUI();
      persistPresetStore();
    }, 450);
  }

  function initPresetSystem() {
    presetStore = loadPresetStore();
    persistPresetStore();
    applySettings(getActivePreset().settings, { skipRegen: true });
    renderPresetSelect();
    const nameEl = document.getElementById('presetName');
    if (nameEl) nameEl.value = getActivePreset().name;

    document.getElementById('presetSelect').onchange = () => {
      presetStore.activeId = document.getElementById('presetSelect').value;
      applySettings(getActivePreset().settings);
      renderPresetSelect();
      if (nameEl) nameEl.value = getActivePreset().name;
      persistPresetStore();
    };

    document.getElementById('presetSave').onclick = () => {
      saveActivePresetFromUI();
      persistPresetStore();
      renderPresetSelect();
      document.getElementById('status').textContent = 'Saved preset “' + getActivePreset().name + '”.';
    };

    document.getElementById('presetSaveAs').onclick = () => {
      const name = (nameEl && nameEl.value.trim()) || ('Preset ' + (presetStore.presets.length + 1));
      const id = 'user-' + Date.now();
      presetStore.presets.push({ id, name, settings: collectSettings() });
      presetStore.activeId = id;
      persistPresetStore();
      renderPresetSelect();
      if (nameEl) nameEl.value = name;
      document.getElementById('status').textContent = 'Created preset “' + name + '”.';
    };

    document.getElementById('presetDelete').onclick = () => {
      const preset = getActivePreset();
      if (!preset || preset.builtin) return;
      presetStore.presets = presetStore.presets.filter(p => p.id !== preset.id);
      presetStore.activeId = BUILTIN_DEFAULT_ID;
      applySettings(getActivePreset().settings);
      persistPresetStore();
      renderPresetSelect();
      if (nameEl) nameEl.value = getActivePreset().name;
      document.getElementById('status').textContent = 'Preset deleted · loaded Default.';
    };

    if (nameEl) nameEl.onchange = () => schedulePresetAutosave();

    document.getElementById('presetExport').onclick = () => {
      saveActivePresetFromUI();
      try {
        if (typeof PresetIO === 'undefined') throw new Error('Preset IO not loaded');
        const payload = PresetIO.buildPresetLibraryExport(presetStore);
        PresetIO.downloadPresetJson(payload, 'fal-lower-thirds-presets');
        document.getElementById('status').textContent =
          'Exported ' + payload.presets.length + ' preset' + (payload.presets.length === 1 ? '' : 's') + '.';
      } catch (err) {
        document.getElementById('status').textContent = 'Export failed: ' + (err.message || 'unknown error');
      }
    };

    document.getElementById('presetImport').onclick = () => {
      document.getElementById('presetImportFile').click();
    };

    document.getElementById('presetImportFile').onchange = () => {
      const input = document.getElementById('presetImportFile');
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (typeof PresetIO === 'undefined') throw new Error('Preset IO not loaded');
          const data = JSON.parse(reader.result);
          const result = PresetIO.importPresetData(
            presetStore,
            data,
            file.name.replace(/\.json$/i, ''),
            { builtinDefaultId: BUILTIN_DEFAULT_ID, builtinTransitionId: BUILTIN_DEFAULT_ID }
          );
          applySettings(getActivePreset().settings);
          persistPresetStore();
          renderPresetSelect();
          if (nameEl) nameEl.value = getActivePreset().name;
          if (typeof syncDialSliders === 'function') syncDialSliders();
          document.getElementById('status').textContent =
            result.mode === 'library'
              ? 'Imported ' + result.added + ' preset' + (result.added === 1 ? '' : 's') +
                (result.skipped ? ' (' + result.skipped + ' built-in skipped)' : '') + '.'
              : 'Imported preset “' + getActivePreset().name + '”.';
        } catch (err) {
          document.getElementById('status').textContent = 'Import failed: ' + (err.message || 'invalid JSON');
        }
      };
      reader.readAsText(file);
    };
  }

  function setExportButtonsBusy(busy) {
    ['mp4ExportBtn', 'webmExportBtn', 'gifExportBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('exporting', !!busy);
    });
  }

  function updateExportProgress(pct, msg, frame) {
    const rounded = Math.min(100, Math.max(0, Math.round(pct * 100)));
    const fill = document.getElementById('exportProgressFill');
    const pctEl = document.getElementById('exportProgressPct');
    const status = document.getElementById('exportStatus');
    const meta = document.getElementById('exportMeta');
    if (fill) fill.style.width = rounded + '%';
    if (pctEl) pctEl.textContent = rounded + '%';
    if (msg != null && status) status.textContent = msg;
    const tf = exportRunMeta.totalFrames;
    const fps = exportRunMeta.fps;
    const fmt = exportRunMeta.format ? exportRunMeta.format.toUpperCase() : 'VIDEO';
    if (meta) {
      if (frame != null && tf) {
        meta.textContent = fmt + ' · frame ' + frame + ' / ' + tf + ' · ' + W + '×' + H + ' · ' + fps + ' fps';
      } else if (tf) {
        meta.textContent = fmt + ' · ' + tf + ' frames · ' + W + '×' + H + ' · ' + fps + ' fps';
      } else {
        meta.textContent = '';
      }
    }
    const statusBar = document.getElementById('status');
    if (statusBar && msg) statusBar.textContent = 'Exporting ' + fmt + ' · ' + rounded + '% · ' + msg;
  }

  function setExportModal(open, pct, msg, frame) {
    const modal = document.getElementById('exportModal');
    if (!modal) return;
    modal.classList.toggle('open', open);
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open && pct != null) updateExportProgress(pct, msg, frame);
    else if (!open) {
      const fill = document.getElementById('exportProgressFill');
      const pctEl = document.getElementById('exportProgressPct');
      const meta = document.getElementById('exportMeta');
      if (fill) fill.style.width = '0%';
      if (pctEl) pctEl.textContent = '0%';
      if (meta) meta.textContent = '';
    } else if (msg != null) {
      const status = document.getElementById('exportStatus');
      if (status) status.textContent = msg;
    }
  }

  function collectSvgTextOpacity(el) {
    let opacity = 1;
    let node = el;
    while (node && node.nodeType === 1 && node.localName !== 'svg') {
      if (node.hasAttribute('opacity')) {
        const val = parseFloat(node.getAttribute('opacity'));
        if (isFinite(val)) opacity *= Math.max(0, Math.min(1, val));
      }
      node = node.parentNode;
    }
    return opacity;
  }

  function canvasTextAlignFromSvg(anchor) {
    if (anchor === 'middle') return 'center';
    if (anchor === 'end') return 'right';
    return 'left';
  }

  function canvasTextBaselineFromSvg(baseline) {
    if (baseline === 'hanging') return 'hanging';
    if (baseline === 'middle' || baseline === 'central') return 'middle';
    return 'alphabetic';
  }

  function parseFontFamily(raw) {
    if (!raw) return 'Focal Upright';
    const first = raw.split(',')[0].trim().replace(/^['"]+|['"]+$/g, '');
    return first || 'Focal Upright';
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function fetchFontArrayBuffer(path) {
    try {
      const res = await fetch(path);
      if (res.ok) return res.arrayBuffer();
    } catch (e) {}
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        if (xhr.status === 0 || xhr.status === 200) resolve(xhr.response);
        else reject(new Error('font xhr ' + xhr.status));
      };
      xhr.onerror = () => reject(new Error('font xhr error'));
      xhr.send();
    });
  }

  function getFontLoadPaths() {
    const paths = ['Focal-Upright-VF_wght.ttf', './Focal-Upright-VF_wght.ttf', 'fonts/Focal-Upright-VF_wght.ttf'];
    try {
      const base = document.baseURI || window.location.href;
      ['Focal-Upright-VF_wght.ttf', 'fonts/Focal-Upright-VF_wght.ttf'].forEach(rel => {
        const url = new URL(rel, base);
        if (url.protocol === 'file:') paths.push(decodeURIComponent(url.pathname));
        else paths.push(url.href);
      });
    } catch (e) {}
    return [...new Set(paths)];
  }

  async function loadFocalUprightDataUrl() {
    if (!focalUprightDataUrlPromise) {
      focalUprightDataUrlPromise = (async () => {
        let lastErr;
        for (const path of getFontLoadPaths()) {
          try {
            const buf = await fetchFontArrayBuffer(path);
            return 'data:font/ttf;base64,' + bytesToBase64(new Uint8Array(buf));
          } catch (e) {
            lastErr = e;
          }
        }
        throw lastErr || new Error('Focal-Upright-VF_wght.ttf not found');
      })();
    }
    return focalUprightDataUrlPromise;
  }

  async function registerExportFontFace(dataUrl) {
    if (!dataUrl || !document.fonts || exportFontRegistered) return;
    const face = new FontFace('Focal Upright', 'url(' + dataUrl + ')', { weight: '100 900', style: 'normal' });
    await face.load();
    try {
      document.fonts.add(face);
    } catch (e) {
      if (![...document.fonts].some(f => f.family === 'Focal Upright')) throw e;
    }
    exportFontRegistered = true;
  }

  function getExportSvgMount() {
    let mount = document.getElementById('exportSvgMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'exportSvgMount';
      mount.setAttribute('aria-hidden', 'true');
      mount.style.cssText = 'position:fixed;left:-24000px;top:0;overflow:hidden;width:0;height:0;pointer-events:none;';
      document.body.appendChild(mount);
    }
    return mount;
  }

  function injectSvgExportFont(clone, fontDataUrl) {
    if (!fontDataUrl) return;
    let defs = clone.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(SVG_NS, 'defs');
      clone.insertBefore(defs, clone.firstChild);
    }
    let styleEl = defs.querySelector('#exportOverlayFont');
    if (!styleEl) {
      styleEl = document.createElementNS(SVG_NS, 'style');
      styleEl.setAttribute('id', 'exportOverlayFont');
      defs.insertBefore(styleEl, defs.firstChild);
    }
    styleEl.textContent =
      "@font-face{font-family:'Focal Upright';src:url('" + fontDataUrl + "') format('truetype');font-weight:100 900;font-style:normal;}";
  }

  function drawExportSvgTexts(ctx, svgEl) {
    const svgPoint = svgEl.createSVGPoint ? svgEl.createSVGPoint() : null;
    svgEl.querySelectorAll('text').forEach(textEl => {
      const opacity = collectSvgTextOpacity(textEl);
      if (opacity <= 0.001) return;

      const fontSize = parseFloat(textEl.getAttribute('font-size') || '16');
      const fontWeight = textEl.getAttribute('font-weight') || '400';
      const fill = textEl.getAttribute('fill') || '#000000';
      const anchor = textEl.getAttribute('text-anchor') || 'start';
      const baseline = textEl.getAttribute('dominant-baseline') || 'auto';
      const letterSpacing = parseFloat(textEl.getAttribute('letter-spacing') || '0');
      const family = parseFontFamily(textEl.getAttribute('font-family'));
      const x = parseFloat(textEl.getAttribute('x') || '0');
      const y = parseFloat(textEl.getAttribute('y') || '0');
      const content = textEl.textContent || '';
      if (!content) return;

      const ctm = textEl.getCTM && textEl.getCTM();
      if (!ctm) return;

      let drawX = x;
      let drawY = y;
      if (svgPoint) {
        svgPoint.x = x;
        svgPoint.y = y;
        const pt = svgPoint.matrixTransform(ctm);
        drawX = snapPx(pt.x);
        drawY = snapPx(pt.y);
      } else {
        drawX = snapPx(x + ctm.e);
        drawY = snapPx(y + ctm.f);
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = fontWeight + ' ' + fontSize + 'px "' + family + '", sans-serif';
      ctx.fillStyle = fill;
      ctx.globalAlpha = opacity;
      if (letterSpacing && 'letterSpacing' in ctx) ctx.letterSpacing = letterSpacing + 'px';
      ctx.textAlign = canvasTextAlignFromSvg(anchor);
      ctx.textBaseline = canvasTextBaselineFromSvg(baseline);
      ctx.fillText(content, drawX, drawY);
      ctx.restore();
    });
  }

  async function rasterizeSvgBlobToCanvas(ctx, blob, dw, dh) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(blob);
        try {
          ctx.drawImage(bitmap, 0, 0, dw, dh);
          return;
        } finally {
          bitmap.close();
        }
      } catch (e) {}
    }
    await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, dw, dh);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('svg rasterize failed'));
      };
      img.src = url;
    });
  }

  async function preloadExportFonts() {
    try {
      const dataUrl = await loadFocalUprightDataUrl();
      await registerExportFontFace(dataUrl);
    } catch (e) {
      console.warn('Lower-thirds export font load failed:', e);
    }
    if (!document.fonts || !document.fonts.load) return;
    const fontSize = v('fontSize') || 50;
    await Promise.all([
      document.fonts.load('480 ' + fontSize + 'px "Focal Upright"'),
      document.fonts.load('400 25px "HAL Timezone Mono"'),
    ].map(p => p.catch(() => {})));
    await document.fonts.ready;
  }

  function isExportTransparent() {
    const el = document.getElementById('exportTransparentBg');
    return el ? el.checked : false;
  }

  async function renderProgressToCanvas(ctx, progress, dw, dh, exportOpts) {
    exportOpts = exportOpts || {};
    const transparent = !!exportOpts.transparent;
    renderAtProgress(progress);

    let fontDataUrl = null;
    try {
      fontDataUrl = await loadFocalUprightDataUrl();
      await registerExportFontFace(fontDataUrl);
    } catch (e) {}

    const clone = svg.cloneNode(true);
    if (transparent) {
      const bgRect = clone.querySelector('rect');
      if (bgRect) bgRect.setAttribute('fill', 'none');
    }
    if (fontDataUrl) injectSvgExportFont(clone, fontDataUrl);
    clone.setAttribute('width', String(W));
    clone.setAttribute('height', String(H));
    clone.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    clone.setAttribute('xmlns', SVG_NS);

    const textNodes = [...clone.querySelectorAll('text')];
    const textRestore = textNodes.map(node => ({
      node,
      parent: node.parentNode,
      next: node.nextSibling,
    }));
    textNodes.forEach(node => node.remove());

    const mount = getExportSvgMount();
    mount.replaceChildren(clone);

    const blob = new Blob(
      [new XMLSerializer().serializeToString(clone)],
      { type: 'image/svg+xml;charset=utf-8' }
    );

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (transparent) {
      ctx.clearRect(0, 0, dw, dh);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, dw, dh);
    }
    await rasterizeSvgBlobToCanvas(ctx, blob, dw, dh);

    textRestore.forEach(({ node, parent, next }) => {
      if (next && next.parentNode === parent) parent.insertBefore(node, next);
      else parent.appendChild(node);
    });

    const sx = dw / W;
    const sy = dh / H;
    if (sx !== 1 || sy !== 1) {
      ctx.save();
      ctx.scale(sx, sy);
      drawExportSvgTexts(ctx, clone);
      ctx.restore();
    } else {
      drawExportSvgTexts(ctx, clone);
    }
    ctx.restore();

    mount.replaceChildren();
  }

  function resolveAssetUrl(rel) {
    try {
      return new URL(rel, document.baseURI || window.location.href).href;
    } catch (e) {
      return rel;
    }
  }

  async function loadMp4Muxer() {
    if (mp4MuxerModule) return mp4MuxerModule;
    const url = resolveAssetUrl('vendor/mp4-muxer.mjs');
    const res = await fetch(url);
    if (!res.ok) throw new Error('mp4-muxer-load-failed');
    const code = await res.text();
    const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try {
      mp4MuxerModule = await import(blobUrl);
      return mp4MuxerModule;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  function getMp4MuxerExports(mod) {
    const Muxer = mod.Muxer || mod.default?.Muxer;
    const ArrayBufferTarget = mod.ArrayBufferTarget || mod.default?.ArrayBufferTarget;
    if (!Muxer || !ArrayBufferTarget) throw new Error('mp4-muxer exports missing');
    return { Muxer, ArrayBufferTarget };
  }

  let gifencModule = null;

  async function loadGifenc() {
    if (gifencModule) return gifencModule;
    const url = resolveAssetUrl('vendor/gifenc.mjs');
    const res = await fetch(url);
    if (!res.ok) throw new Error('gifenc-load-failed');
    const code = await res.text();
    const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try {
      gifencModule = await import(blobUrl);
      return gifencModule;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  function getGifencExports(mod) {
    const GIFEncoder = mod.GIFEncoder || mod.default;
    const quantize = mod.quantize;
    const applyPalette = mod.applyPalette;
    if (!GIFEncoder || !quantize || !applyPalette) throw new Error('gifenc exports missing');
    return { GIFEncoder, quantize, applyPalette };
  }

  async function getH264EncoderConfig(width, height, fps) {
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
    const evenW = width & ~1;
    const evenH = height & ~1;
    const codecs = ['avc1.42E01E', 'avc1.4D401E', 'avc1.64001E', 'avc1.640028'];
    for (const codec of codecs) {
      const base = {
        codec,
        width: evenW,
        height: evenH,
        bitrate: Math.min(24_000_000, Math.round(evenW * evenH * fps * 0.14)),
        framerate: fps,
      };
      const candidates = [{ ...base, avc: { format: 'avc' } }, base];
      for (const config of candidates) {
        try {
          const support = await VideoEncoder.isConfigSupported(config);
          if (support.supported) {
            return {
              codec,
              evenW,
              evenH,
              bitrate: base.bitrate,
              encoderConfig: support.config || config,
            };
          }
        } catch (e) {}
      }
    }
    return null;
  }

  async function getHevcAlphaEncoderConfig(width, height, fps) {
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
    const evenW = width & ~1;
    const evenH = height & ~1;
    const codecs = ['hvc1.1.6.L93.B0', 'hvc1.1.6.L120.B0', 'hev1.1.6.L93.B0'];
    for (const codec of codecs) {
      const config = {
        codec,
        width: evenW,
        height: evenH,
        alpha: 'keep',
        bitrate: Math.min(28_000_000, Math.round(evenW * evenH * fps * 0.18)),
        framerate: fps,
        hevc: { format: 'hevc' },
        latencyMode: 'quality',
      };
      try {
        const support = await VideoEncoder.isConfigSupported(config);
        if (support.supported) {
          return {
            codec,
            evenW,
            evenH,
            bitrate: config.bitrate,
            encoderConfig: support.config || config,
            alpha: true,
          };
        }
      } catch (e) {}
    }
    return null;
  }

  function pickWebmMimeType() {
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    return candidates.find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
  }

  function pickMp4MimeType() {
    const candidates = [
      'video/mp4;codecs="avc1.42E01E"',
      'video/mp4;codecs="avc1.4D401E"',
      'video/mp4;codecs="avc1.640028"',
      'video/mp4;codecs="avc1"',
      'video/mp4',
    ];
    return candidates.find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
  }

  async function exportVideoH264(config, fps, totalFrames, canvas, ctx, exportOpts) {
    exportOpts = exportOpts || {};
    const mod = await loadMp4Muxer();
    const { Muxer, ArrayBufferTarget } = getMp4MuxerExports(mod);
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'avc', width: config.evenW, height: config.evenH, frameRate: fps },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    let encoderError = null;
    let encodedChunks = 0;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        try {
          encodedChunks++;
          muxer.addVideoChunk(chunk, meta);
        } catch (e) {
          encoderError = e;
        }
      },
      error: e => { encoderError = e; },
    });
    encoder.configure(config.encoderConfig || {
      codec: config.codec,
      width: config.evenW,
      height: config.evenH,
      bitrate: config.bitrate,
      framerate: fps,
      latencyMode: 'quality',
    });
    const frameDurUs = Math.round(1_000_000 / fps);
    const keyEvery = Math.max(1, fps * 2);
    const dw = canvas.width;
    const dh = canvas.height;
    try {
      for (let i = 0; i < totalFrames; i++) {
        if (exportCancelRequested) throw new Error('cancelled');
        if (encoderError) throw encoderError;
        await renderProgressToCanvas(ctx, i / totalFrames, dw, dh, exportOpts);
        const frame = new VideoFrame(canvas, { timestamp: i * frameDurUs, duration: frameDurUs });
        encoder.encode(frame, { keyFrame: i % keyEvery === 0 });
        frame.close();
        setExportModal(true, (i + 1) / totalFrames, 'Encoding H.264 · ' + (i + 1) + ' / ' + totalFrames + ' frames…', i + 1);
        await new Promise(r => setTimeout(r, 0));
      }
      if (encoderError) throw encoderError;
      updateExportProgress(0.99, 'Finalizing MP4 file…');
      await encoder.flush();
      if (!encodedChunks) throw new Error('H.264 encoder produced no frames.');
      muxer.finalize();
      const buffer = target.buffer;
      if (!buffer || buffer.byteLength < 256) throw new Error('MP4 output empty');
      return {
        blob: new Blob([buffer], { type: 'video/mp4' }),
        filename: 'fal-lower-thirds-' + W + 'x' + H + '-' + fps + 'fps-' + Date.now() + '.mp4',
        format: 'mp4',
        codec: 'h264',
      };
    } finally {
      try { encoder.close(); } catch (e) {}
    }
  }

  async function exportVideoHevc(config, fps, totalFrames, canvas, ctx, exportOpts) {
    exportOpts = exportOpts || {};
    const mod = await loadMp4Muxer();
    const { Muxer, ArrayBufferTarget } = getMp4MuxerExports(mod);
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'hevc', width: config.evenW, height: config.evenH, frameRate: fps },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });
    let encoderError = null;
    let encodedChunks = 0;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        try {
          encodedChunks++;
          muxer.addVideoChunk(chunk, meta);
        } catch (e) {
          encoderError = e;
        }
      },
      error: e => { encoderError = e; },
    });
    encoder.configure(config.encoderConfig || {
      codec: config.codec,
      width: config.evenW,
      height: config.evenH,
      alpha: 'keep',
      bitrate: config.bitrate,
      framerate: fps,
      hevc: { format: 'hevc' },
      latencyMode: 'quality',
    });
    const frameDurUs = Math.round(1_000_000 / fps);
    const keyEvery = Math.max(1, fps * 2);
    const dw = canvas.width;
    const dh = canvas.height;
    try {
      for (let i = 0; i < totalFrames; i++) {
        if (exportCancelRequested) throw new Error('cancelled');
        if (encoderError) throw encoderError;
        await renderProgressToCanvas(ctx, i / totalFrames, dw, dh, exportOpts);
        const frame = new VideoFrame(canvas, { timestamp: i * frameDurUs, duration: frameDurUs, alpha: 'keep' });
        encoder.encode(frame, { keyFrame: i % keyEvery === 0 });
        frame.close();
        setExportModal(true, (i + 1) / totalFrames, 'Encoding HEVC (alpha) · ' + (i + 1) + ' / ' + totalFrames + ' frames…', i + 1);
        await new Promise(r => setTimeout(r, 0));
      }
      if (encoderError) throw encoderError;
      updateExportProgress(0.99, 'Finalizing transparent MP4…');
      await encoder.flush();
      if (!encodedChunks) throw new Error('HEVC encoder produced no frames.');
      muxer.finalize();
      const buffer = target.buffer;
      if (!buffer || buffer.byteLength < 256) throw new Error('MP4 output empty');
      return {
        blob: new Blob([buffer], { type: 'video/mp4' }),
        filename: 'fal-lower-thirds-' + W + 'x' + H + '-' + fps + 'fps-alpha-' + Date.now() + '.mp4',
        format: 'mp4',
        codec: 'hevc-alpha',
      };
    } finally {
      try { encoder.close(); } catch (e) {}
    }
  }

  async function exportVideoRecorder(format, fps, totalFrames, canvas, ctx, exportOpts) {
    exportOpts = exportOpts || {};
    const mimeType = format === 'mp4' ? pickMp4MimeType() : pickWebmMimeType();
    if (!mimeType) throw new Error(format === 'mp4' ? 'no-mp4-recorder' : 'no-webm');
    const stream = canvas.captureStream(0);
    const track = stream.getVideoTracks()[0];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 14_000_000 });
    const chunks = [];
    const recordingDone = new Promise(resolve => {
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = resolve;
    });
    recorder.start();
    const dw = canvas.width;
    const dh = canvas.height;
    const frameDelay = 1000 / fps;
    for (let i = 0; i < totalFrames; i++) {
      if (exportCancelRequested) throw new Error('cancelled');
      await renderProgressToCanvas(ctx, i / totalFrames, dw, dh, exportOpts);
      if (track && track.requestFrame) track.requestFrame();
      setExportModal(true, (i + 1) / totalFrames, 'Recording · ' + (i + 1) + ' / ' + totalFrames + ' frames…', i + 1);
      await new Promise(r => setTimeout(r, frameDelay));
    }
    recorder.stop();
    await recordingDone;
    const ext = format === 'mp4' ? 'mp4' : 'webm';
    return {
      blob: new Blob(chunks, { type: mimeType.split(';')[0] }),
      filename: 'fal-lower-thirds-' + W + 'x' + H + '-' + fps + 'fps-' + Date.now() + '.' + ext,
      format: ext,
      codec: format === 'webm' && exportOpts.transparent ? 'vp9-alpha' : ext,
    };
  }

  async function exportVideoGif(fps, totalFrames, canvas, ctx, exportOpts) {
    exportOpts = exportOpts || {};
    const { GIFEncoder, quantize, applyPalette } = getGifencExports(await loadGifenc());
    const gif = GIFEncoder();
    const w = canvas.width;
    const h = canvas.height;
    const frameDelay = Math.max(20, Math.round(1000 / fps));
    const rgba = new Uint8Array(w * h * 4);

    for (let i = 0; i < totalFrames; i++) {
      if (exportCancelRequested) throw new Error('cancelled');
      await renderProgressToCanvas(ctx, i / totalFrames, w, h, exportOpts);
      rgba.set(ctx.getImageData(0, 0, w, h).data);
      const palette = quantize(rgba, 256);
      const index = applyPalette(rgba, palette);
      const frameOpts = { palette, delay: frameDelay };
      if (i === 0) frameOpts.first = true;
      gif.writeFrame(index, w, h, frameOpts);
      setExportModal(true, (i + 1) / totalFrames, 'Encoding GIF · ' + (i + 1) + ' / ' + totalFrames + ' frames…', i + 1);
      await new Promise(r => setTimeout(r, 0));
    }

    gif.finish();
    const bytes = gif.bytes();
    if (!bytes || !bytes.byteLength) throw new Error('GIF output empty');
    return {
      blob: new Blob([bytes], { type: 'image/gif' }),
      filename: 'fal-lower-thirds-' + W + 'x' + H + '-' + fps + 'fps-' + Date.now() + '.gif',
      format: 'gif',
    };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function exportVideoLoop(format) {
    if (!particles.length) beginCycle();
    exportCancelRequested = false;
    const wasPaused = paused;
    pauseAnim();
    setExportButtonsBusy(true);
    const fps = parseInt(document.getElementById('exportFps').value, 10) || 24;
    const cycleMs = getAnimDurationMs();
    const totalFrames = Math.max(1, Math.round((cycleMs / 1000) * fps));
    exportRunMeta = { format, fps, totalFrames };
    const isMp4 = format === 'mp4';
    const isGif = format === 'gif';
    const transparent = isExportTransparent();
    const exportOpts = { transparent };
    const canvas = document.createElement('canvas');
    canvas.width = W & ~1;
    canvas.height = H & ~1;
    const ctx = canvas.getContext('2d', { alpha: transparent });
    let exportNote = '';
    try {
      setExportModal(true, 0, 'Loading fonts…');
      await preloadExportFonts();
      let result;
      if (isMp4) {
        if (transparent) {
          try {
            const hevcConfig = await getHevcAlphaEncoderConfig(canvas.width, canvas.height, fps);
            if (hevcConfig) {
              setExportModal(true, 0, 'Preparing transparent HEVC MP4…');
              result = await exportVideoHevc(hevcConfig, fps, totalFrames, canvas, ctx, exportOpts);
              exportNote = ' (HEVC with alpha — best in Safari)';
            } else {
              throw new Error('no-hevc-alpha');
            }
          } catch (hevcErr) {
            if (hevcErr && hevcErr.message === 'cancelled') throw hevcErr;
            if (pickWebmMimeType()) {
              setExportModal(true, 0, 'Recording transparent WebM…');
              result = await exportVideoRecorder('webm', fps, totalFrames, canvas, ctx, exportOpts);
              exportNote = ' (WebM with alpha — HEVC unavailable in this browser)';
            } else {
              throw new Error('Transparent MP4 needs Safari HEVC or Chrome WebM VP9.');
            }
          }
        } else {
          try {
            const h264Config = await getH264EncoderConfig(canvas.width, canvas.height, fps);
            if (h264Config) {
              setExportModal(true, 0, 'Preparing H.264 MP4…');
              result = await exportVideoH264(h264Config, fps, totalFrames, canvas, ctx, exportOpts);
            } else {
              throw new Error('no-webcodecs');
            }
          } catch (webcodecsErr) {
            if (webcodecsErr && webcodecsErr.message === 'cancelled') throw webcodecsErr;
            if (pickMp4MimeType()) {
              setExportModal(true, 0, 'Recording MP4…');
              result = await exportVideoRecorder('mp4', fps, totalFrames, canvas, ctx, exportOpts);
            } else {
              throw webcodecsErr;
            }
          }
        }
      } else if (isGif) {
        setExportModal(true, 0, 'Encoding GIF…');
        result = await exportVideoGif(fps, totalFrames, canvas, ctx, exportOpts);
      } else {
        if (!pickWebmMimeType()) throw new Error('no-webm');
        setExportModal(true, 0, transparent ? 'Encoding transparent WebM…' : 'Encoding WebM…');
        result = await exportVideoRecorder('webm', fps, totalFrames, canvas, ctx, exportOpts);
      }
      updateExportProgress(1, 'Download starting…');
      downloadBlob(result.blob, result.filename);
      document.getElementById('status').textContent = 'Exported ' + result.filename + exportNote;
    } catch (err) {
      if (err && err.message === 'cancelled') {
        document.getElementById('status').textContent = 'Video export cancelled.';
      } else if (isMp4 && String(err).includes('mp4-muxer')) {
        document.getElementById('status').textContent = 'MP4 export failed — keep vendor/mp4-muxer.mjs next to this page.';
      } else if (isGif && String(err).includes('gifenc')) {
        document.getElementById('status').textContent = 'GIF export failed — keep vendor/gifenc.mjs next to this page.';
      } else {
        document.getElementById('status').textContent = (isMp4 ? 'MP4' : isGif ? 'GIF' : 'WebM') + ' export failed — ' + (err?.message || 'try Chrome.');
        console.error(err);
      }
    } finally {
      setExportModal(false);
      setExportButtonsBusy(false);
      exportRunMeta = { format: '', fps: 0, totalFrames: 0 };
      drawFrame(performance.now());
      if (!wasPaused) startAnim();
    }
  }

  function exportSettingsJson() {
    const text = JSON.stringify(collectSettings(), null, 2);
    const filename = 'fal-lower-thirds-' + Date.now() + '.json';
    downloadBlob(new Blob([text], { type: 'application/json;charset=utf-8' }), filename);
    document.getElementById('status').textContent = 'Exported ' + filename;
  }

  function initPreviewScrub() {
    const wrap = document.getElementById('previewWrap');
    const stage = document.getElementById('stage');
    const stageCanvas = document.getElementById('stageCanvas');
    const line = document.getElementById('scrubLine');
    const svgEl = document.getElementById('s');
    if (!wrap || !stage || !line) return;

    let scrubPointerDown = false;
    let scrubDragStarted = false;
    let scrubDownX = 0;

    function scrubBoundsEl() {
      return stageCanvas || stage;
    }

    function stageRect() {
      return scrubBoundsEl().getBoundingClientRect();
    }

    function syncScrubLineLayout() {
      const bounds = scrubBoundsEl();
      if (!svgEl || !bounds) return;
      line.style.top = '0';
      line.style.bottom = '0';
      line.style.height = '';
      if (svgEl.offsetHeight > 0 && bounds.offsetHeight > svgEl.offsetHeight + 1) {
        line.style.top = '0';
        line.style.bottom = 'auto';
        line.style.height = svgEl.offsetHeight + 'px';
      }
    }

    function setScrubFromEvent(e) {
      const rect = stageRect();
      if (rect.width <= 0) return;
      const x = Math.max(rect.left, Math.min(rect.right, e.clientX));
      scrubProgress = clamp01((x - rect.left) / rect.width);
      line.style.left = (scrubProgress * 100) + '%';
      drawFrame(performance.now());
    }

    function syncScrubLinePosition() {
      line.style.left = (scrubProgress * 100) + '%';
      syncScrubLineLayout();
    }

    function showScrubLine() {
      line.style.display = 'block';
      wrap.classList.add('scrub-active');
    }

    function hideScrubLine() {
      line.style.display = 'none';
      wrap.classList.remove('scrub-active');
    }

    function enterScrubMode() {
      const cycleMs = getAnimDurationMs();
      if (cycleStart) {
        scrubProgress = clamp01((performance.now() - cycleStart) / cycleMs);
      }
      scrubMode = true;
      showScrubLine();
      syncScrubLinePosition();
      drawFrame(performance.now());
    }

    function exitScrubMode() {
      if (!scrubMode) return;
      scrubMode = false;
      scrubPointerDown = false;
      scrubDragStarted = false;
      hideScrubLine();
      cycleStart = performance.now() - scrubProgress * getAnimDurationMs();
      drawFrame(performance.now());
    }

    wrap.addEventListener('click', e => {
      if (e.target.closest('#status')) return;
      if (scrubDragStarted) {
        scrubDragStarted = false;
        return;
      }
      if (scrubMode) exitScrubMode();
      else enterScrubMode();
    });

    wrap.addEventListener('pointerdown', e => {
      if (e.target.closest('#status')) return;
      if (!scrubMode) return;
      scrubPointerDown = true;
      scrubDragStarted = false;
      scrubDownX = e.clientX;
    });

    wrap.addEventListener('pointermove', e => {
      if (e.target.closest('#status')) return;
      if (!scrubMode || !scrubPointerDown) return;
      if (!scrubDragStarted && Math.abs(e.clientX - scrubDownX) > 3) {
        scrubDragStarted = true;
      }
      if (scrubDragStarted) setScrubFromEvent(e);
    });

    function endScrubPointer() {
      scrubPointerDown = false;
    }

    wrap.addEventListener('pointerup', endScrubPointer);
    wrap.addEventListener('pointercancel', endScrubPointer);
    window.addEventListener('resize', () => {
      if (scrubMode) syncScrubLinePosition();
      else syncScrubLineLayout();
    });
    syncScrubLineLayout();
  }

  function wireControls() {
    document.getElementById('genBtn').onclick = () => beginCycle({ preserveScrub: scrubMode });
    document.getElementById('animBtn').onclick = () => {
      if (paused) startAnim();
      else pauseAnim();
    };

    document.getElementById('logoStyle').onchange = () => {
      updateLogoColorUi();
      drawFrame(performance.now());
      schedulePresetAutosave();
    };
    document.getElementById('logoColorAccent').oninput = () => {
      drawFrame(performance.now());
      schedulePresetAutosave();
    };
    document.getElementById('logoColorDetail').oninput = () => {
      drawFrame(performance.now());
      schedulePresetAutosave();
    };
    document.getElementById('barColor').oninput = () => {
      drawFrame(performance.now());
      schedulePresetAutosave();
    };
    document.getElementById('textColor').oninput = () => {
      drawFrame(performance.now());
      schedulePresetAutosave();
    };
    document.getElementById('showBadge').onchange = () => {
      drawFrame(performance.now());
      schedulePresetAutosave();
    };

    document.getElementById('headlineText').oninput = () => {
      beginCycle();
      schedulePresetAutosave();
    };

    document.getElementById('headlineStatic').onchange = () => {
      updateHeadlineTypeUi();
      drawFrame(performance.now());
      schedulePresetAutosave();
    };

    document.getElementById('exportCancel').onclick = () => { exportCancelRequested = true; };
    document.getElementById('mp4ExportBtn').onclick = () => exportVideoLoop('mp4');
    document.getElementById('webmExportBtn').onclick = () => exportVideoLoop('webm');
    document.getElementById('gifExportBtn').onclick = () => exportVideoLoop('gif');
    document.getElementById('jsonExportBtn').onclick = () => exportSettingsJson();

    const rerender = () => drawFrame(performance.now());
    [
      'margin', 'logoSize', 'logoGap', 'logoIntro',
      'barHeight', 'barPad', 'barMaxWidth', 'fontSize', 'typeSpeed',
      'animDuration', 'pixSize', 'shapeMin', 'shapeMax', 'dustCells', 'dustOffsetX', 'badgeGap',
      'badgeOffsetX', 'branchLen', 'branchSplit', 'axisBias', 'circlePct', 'squarePct',
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => {
        if (['pixSize', 'dustCells', 'branchLen', 'branchSplit', 'axisBias', 'circlePct', 'squarePct', 'dustOffsetX'].includes(id)) {
          beginCycle();
        } else {
          rerender();
        }
        schedulePresetAutosave();
      };
    });
  }

  function init() {
    svg = document.getElementById('s');
    particleRoot = document.getElementById('particleRoot');
    overlayRoot = document.getElementById('overlayRoot');
    logoRoot = document.getElementById('logoRoot');

    initPresetSystem();
    wireControls();
    initPreviewScrub();

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
