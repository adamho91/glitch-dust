(function () {
  const SLIDE_MIN_MARK = 3.0;
  const SLIDE_STRONG = 4.5;
  const SLIDE_AVG = 3.2;

  // Hidden from the visualizer (weak / noisy for slide reference).
  const HIDDEN_PRESET_IDS = new Set(['2-x', '2-g']);

  const state = {
    count: 2,
    family: 'all',
    slideReady: true,
    selectedId: null,
  };

  const els = {
    countSeg: document.getElementById('countSeg'),
    familySeg: document.getElementById('familySeg'),
    slideReady: document.getElementById('slideReady'),
    gridWrap: document.getElementById('gridWrap'),
    previewCount: document.getElementById('previewCount'),
    detailLabel: document.getElementById('detailLabel'),
    detailId: document.getElementById('detailId'),
    detailMeta: document.getElementById('detailMeta'),
    bgSwatches: document.getElementById('bgSwatches'),
    markSwatches: document.getElementById('markSwatches'),
    promptBox: document.getElementById('promptBox'),
    copyPromptBtn: document.getElementById('copyPromptBtn'),
    copyHexBtn: document.getElementById('copyHexBtn'),
    status: document.getElementById('status'),
  };

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  function parseHex(hex) {
    let h = String(hex || '').trim();
    if (!h) return null;
    if (!h.startsWith('#')) h = '#' + h;
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    if (!/^#[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
      hex: h.toUpperCase(),
    };
  }

  function srgbChannel(c) {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(hex) {
    const rgb = parseHex(hex);
    if (!rgb) return 0;
    return 0.2126 * srgbChannel(rgb.r) + 0.7152 * srgbChannel(rgb.g) + 0.0722 * srgbChannel(rgb.b);
  }

  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const light = Math.max(l1, l2);
    const dark = Math.min(l1, l2);
    return (light + 0.05) / (dark + 0.05);
  }

  function sameHex(a, b) {
    const aa = parseHex(a);
    const bb = parseHex(b);
    return !!(aa && bb && aa.hex === bb.hex);
  }

  function shortLabel(preset) {
    return String(preset.label || '').replace(/^\d+-[A-Z]+\s*·\s*/i, '').trim() || preset.id;
  }

  function displayId(preset) {
    return String(preset.id || '').toUpperCase();
  }

  function familyLabel(id) {
    const hit = (TONAL_GROUP_ORDER || []).find(g => g.id === id);
    return hit ? hit.label : id;
  }

  function analyzePreset(preset) {
    const bg = preset.bg;
    const colors = (preset.colors || []).slice();
    const contrasts = colors.map(c => contrastRatio(c, bg));
    const useful = colors
      .map((c, i) => ({ hex: c, ratio: contrasts[i], nearBg: sameHex(c, bg) || contrasts[i] < 1.35 }))
      .filter(c => !c.nearBg);
    const usefulRatios = useful.map(c => c.ratio);
    const minAll = contrasts.length ? Math.min.apply(null, contrasts) : 0;
    const avgAll = contrasts.length
      ? contrasts.reduce((s, n) => s + n, 0) / contrasts.length
      : 0;
    const minUseful = usefulRatios.length ? Math.min.apply(null, usefulRatios) : 0;
    const avgUseful = usefulRatios.length
      ? usefulRatios.reduce((s, n) => s + n, 0) / usefulRatios.length
      : 0;
    const strongCount = usefulRatios.filter(r => r >= SLIDE_STRONG).length;
    const okCount = usefulRatios.filter(r => r >= SLIDE_MIN_MARK).length;
    const nearBgCount = colors.length - useful.length;

    // Slide-ready: at least one mark reads clearly on the ground (deck / motion board).
    // Extra marks may be softer accents; near-bg duplicates are ignored.
    const slideReady = useful.length >= 1
      && nearBgCount < colors.length
      && (
        strongCount >= 1
        || (okCount >= 1 && avgUseful >= SLIDE_AVG && minUseful >= SLIDE_MIN_MARK - 0.2)
      );

    let grade = 'weak';
    if (slideReady && (strongCount >= 1 || avgUseful >= 4.2)) grade = 'good';
    else if (slideReady || (okCount >= 1 && avgUseful >= 2.6)) grade = 'mid';

    const textCandidates = colors.concat(['#FFFFFF', '#000000']);
    let bestText = '#FFFFFF';
    let bestTextRatio = 0;
    textCandidates.forEach(c => {
      const r = contrastRatio(c, bg);
      if (r > bestTextRatio) {
        bestTextRatio = r;
        bestText = parseHex(c).hex;
      }
    });

    const accent = (useful[0] && useful[0].hex)
      || colors.find(c => !sameHex(c, bg))
      || colors[0]
      || '#ADFF00';

    return {
      contrasts,
      useful,
      minAll,
      avgAll,
      minUseful,
      avgUseful,
      strongCount,
      okCount,
      nearBgCount,
      slideReady,
      grade,
      bestText,
      bestTextRatio,
      accent: parseHex(accent).hex,
      score: (avgUseful * 2) + strongCount + (okCount * 0.35) - (nearBgCount * 0.8),
    };
  }

  function gradeLabel(grade) {
    if (grade === 'good') return 'Strong';
    if (grade === 'mid') return 'OK';
    return 'Low';
  }

  function allPresetsForCount(count) {
    return (typeof getGroupedTonalPresets === 'function'
      ? getGroupedTonalPresets(count)
      : []
    ).flatMap(section => section.presets.map(p => ({
      ...p,
      group: p.group || section.id,
      groupLabel: section.label,
    })));
  }

  function filteredPresets() {
    let list = allPresetsForCount(state.count)
      .filter(p => !HIDDEN_PRESET_IDS.has(String(p.id || '').toLowerCase()))
      .map(p => ({
        ...p,
        analysis: analyzePreset(p),
      }));
    if (state.family !== 'all') {
      list = list.filter(p => p.group === state.family);
    }
    if (state.slideReady) {
      list = list.filter(p => p.analysis.slideReady);
    }
    list.sort((a, b) => {
      if (a.group !== b.group) {
        const order = (TONAL_GROUP_ORDER || []).map(g => g.id);
        return order.indexOf(a.group) - order.indexOf(b.group);
      }
      return b.analysis.score - a.analysis.score;
    });
    return list;
  }

  function buildPrompt(preset) {
    const a = preset.analysis;
    const marks = (preset.colors || []).map((c, i) => {
      const ratio = a.contrasts[i];
      const role = i === 0 ? 'primary' : (i === 1 ? 'secondary' : 'accent ' + (i + 1));
      return `- ${role}: ${parseHex(c).hex}  (contrast vs bg ${ratio.toFixed(1)}:1)`;
    }).join('\n');

    return [
      `fal Glitch Dust tonal pairing`,
      `Pairing: ${displayId(preset)} · ${shortLabel(preset)}`,
      `Family: ${familyLabel(preset.group)}`,
      `Count: ${state.count}-color`,
      ``,
      `bg (slide / board ground): ${parseHex(preset.bg).hex}`,
      `colors (marks / series, in order):`,
      ...(preset.colors || []).map(c => `  ${parseHex(c).hex}`),
      ``,
      `Recommended type / keyline on bg: ${a.bestText}`,
      `Lead accent: ${a.accent}`,
      ``,
      `Contrast notes:`,
      marks,
      `Slide grade: ${gradeLabel(a.grade)} · avg mark contrast ${a.avgUseful.toFixed(1)}:1`,
      ``,
      `Motion / design brief:`,
      `Use only this pairing. Fill the canvas with ${parseHex(preset.bg).hex}.`,
      `Animate marks, charts, and geometric accents with the listed colors in order.`,
      `Keep body/headline type at ${a.bestText} (or the highest-contrast mark) for readability.`,
      `Do not remix colors from other fal IDs. Energy should feel like fal Glitch Dust — sharp, graphic, high-chroma.`,
    ].join('\n');
  }

  function buildHexBlock(preset) {
    return [
      `Pairing: ${displayId(preset)} · ${shortLabel(preset)}`,
      `bg: ${parseHex(preset.bg).hex}`,
      `colors: ${(preset.colors || []).map(c => parseHex(c).hex).join(', ')}`,
    ].join('\n');
  }

  function swatchHtml(hex, label) {
    const clean = parseHex(hex).hex;
    return (
      `<div class="swatch-chip${label === 'bg' ? ' bg-chip' : ''}">` +
      `<div class="face" style="background:${clean}" title="${clean}"></div>` +
      `<div class="hex">${clean}</div>` +
      `</div>`
    );
  }

  function setStatus(msg) {
    if (els.status) els.status.textContent = msg || '';
  }

  function flashCopied(btn, label) {
    const prev = btn.textContent;
    btn.classList.add('copied');
    btn.textContent = 'Copied';
    setStatus(label);
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = prev;
    }, 1100);
  }

  async function copyText(text, btn, label) {
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(btn, label);
    } catch (_) {
      els.promptBox.focus();
      els.promptBox.select();
      setStatus('Select + copy manually (clipboard blocked)');
    }
  }

  function selectPreset(preset) {
    if (!preset) return;
    state.selectedId = preset.id;
    const a = preset.analysis;
    els.detailLabel.textContent = shortLabel(preset);
    els.detailId.textContent = displayId(preset) + ' · ' + familyLabel(preset.group);
    els.detailMeta.innerHTML =
      `<span class="meta-pill ${a.grade}">${gradeLabel(a.grade)} slide contrast</span>` +
      `<span class="meta-pill">avg ${a.avgUseful.toFixed(1)}:1</span>` +
      `<span class="meta-pill">${a.strongCount} strong mark${a.strongCount === 1 ? '' : 's'}</span>`;
    els.bgSwatches.innerHTML = swatchHtml(preset.bg, 'bg');
    els.markSwatches.innerHTML = (preset.colors || []).map(c => swatchHtml(c)).join('');
    els.promptBox.value = buildPrompt(preset);
    document.querySelectorAll('.pair-card').forEach(card => {
      card.classList.toggle('active', card.dataset.id === preset.id);
    });
  }

  function renderFamilies() {
    const buttons = [{ id: 'all', label: 'All' }].concat(TONAL_GROUP_ORDER || []);
    els.familySeg.innerHTML = buttons.map(g => (
      `<button type="button" data-family="${g.id}" class="${state.family === g.id ? 'active' : ''}">${g.label}</button>`
    )).join('');
  }

  function renderGrid() {
    const list = filteredPresets();
    els.previewCount.textContent = list.length
      ? list.length + ' pairing' + (list.length === 1 ? '' : 's')
      : '0 pairings';

    if (!list.length) {
      els.gridWrap.innerHTML = '<div class="empty">No pairings match these filters. Turn off slide contrast or pick another family.</div>';
      return;
    }

    const byFamily = [];
    list.forEach(p => {
      let block = byFamily.find(b => b.id === p.group);
      if (!block) {
        block = { id: p.group, label: familyLabel(p.group), presets: [] };
        byFamily.push(block);
      }
      block.presets.push(p);
    });

    els.gridWrap.innerHTML = byFamily.map(block => (
      `<section class="family-block">` +
      `<div class="family-label">${block.label}</div>` +
      `<div class="card-grid">` +
      block.presets.map(p => {
        const a = p.analysis;
        const marks = (p.colors || []).map(c => (
          `<span class="slide-mark" style="background:${parseHex(c).hex}"></span>`
        )).join('');
        return (
          `<button type="button" class="pair-card${state.selectedId === p.id ? ' active' : ''}" data-id="${p.id}">` +
          `<div class="slide-preview" style="background:${parseHex(p.bg).hex};color:${a.bestText}">` +
          `<div>` +
          `<div class="slide-kicker">${displayId(p)}</div>` +
          `<div class="slide-title">fal motion</div>` +
          `</div>` +
          `<div class="slide-marks">${marks}</div>` +
          `</div>` +
          `<div class="card-meta">` +
          `<div class="name"><strong>${displayId(p)}</strong>${shortLabel(p)}</div>` +
          `<span class="score ${a.grade}">${gradeLabel(a.grade)}</span>` +
          `</div>` +
          `</button>`
        );
      }).join('') +
      `</div></section>`
    )).join('');

    let selected = list.find(p => p.id === state.selectedId) || list[0];
    selectPreset(selected);
  }

  function bind() {
    els.countSeg.addEventListener('click', e => {
      const btn = e.target.closest('button[data-count]');
      if (!btn) return;
      state.count = parseInt(btn.dataset.count, 10);
      state.selectedId = null;
      els.countSeg.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      renderGrid();
    });

    els.familySeg.addEventListener('click', e => {
      const btn = e.target.closest('button[data-family]');
      if (!btn) return;
      state.family = btn.dataset.family;
      state.selectedId = null;
      renderFamilies();
      renderGrid();
    });

    els.slideReady.addEventListener('change', () => {
      state.slideReady = !!els.slideReady.checked;
      state.selectedId = null;
      renderGrid();
    });

    els.gridWrap.addEventListener('click', e => {
      const card = e.target.closest('.pair-card');
      if (!card) return;
      const preset = filteredPresets().find(p => p.id === card.dataset.id);
      if (preset) selectPreset(preset);
    });

    els.copyPromptBtn.addEventListener('click', () => {
      copyText(els.promptBox.value, els.copyPromptBtn, 'Motion prompt copied');
    });

    els.copyHexBtn.addEventListener('click', () => {
      const preset = filteredPresets().find(p => p.id === state.selectedId);
      if (!preset) return;
      copyText(buildHexBlock(preset), els.copyHexBtn, 'Hex block copied');
    });
  }

  function init() {
    if (typeof TONAL_BY_COUNT === 'undefined') {
      setStatus('Palette data missing — check fal-palette.js');
      return;
    }
    renderFamilies();
    bind();
    renderGrid();
    setStatus('Slide contrast on · pick a card to copy prompts');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
