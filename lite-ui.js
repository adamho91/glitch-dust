(function () {
  const ASPECT_PRESETS = [
    { id: 'full', label: '16:9', w: 1920, h: 1080 },
    { id: 'square', label: '1:1', w: 1080, h: 1080 },
    { id: 'banner', label: '3:1', w: 1200, h: 400 },
    { id: 'story', label: '9:16', w: 1080, h: 1920 },
  ];

  function isLiteApp() {
    return typeof GLITCH_DUST_LITE !== 'undefined' && GLITCH_DUST_LITE;
  }

  function presetChipColors(settings) {
    if (!settings) return [];
    if (settings.tonalCount === 'all' && settings.colorAll) {
      return settings.colorAll.slice(0, 4);
    }
    return (settings.activeTonalColors || []).slice(0, 4);
  }

  function normalizeImportedPreset(data, fileName) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid preset JSON');
    }

    if (Array.isArray(data.presets) && data.presets.length) {
      const activeId = data.activeId || data.presets[0].id;
      const active = data.presets.find(p => p.id === activeId) || data.presets[0];
      if (!active || !active.settings) throw new Error('Preset bundle has no settings');
      return { name: active.name || fileName, settings: active.settings };
    }

    if (data.settings && typeof data.settings === 'object') {
      return {
        name: data.name || fileName,
        settings: data.settings,
      };
    }

    if (data.sliders && data.selects) {
      return { name: data.name || fileName, settings: data };
    }

    throw new Error('Unrecognized preset format');
  }

  function renderLitePresetGrid() {
    const grid = document.getElementById('litePresetGrid');
    if (!grid || typeof presetStore === 'undefined') return;
    grid.replaceChildren();
    presetStore.presets.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lite-preset-card' + (p.id === presetStore.activeId ? ' active' : '');
      const name = document.createElement('span');
      name.className = 'lite-preset-name';
      name.textContent = p.name;
      const chips = document.createElement('span');
      chips.className = 'lite-preset-chips';
      presetChipColors(p.settings).forEach(hex => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.style.background = hex;
        chips.appendChild(chip);
      });
      btn.append(name, chips);
      btn.onclick = () => {
        presetStore.activeId = p.id;
        applySettings(p.settings);
        renderLitePresetGrid();
        if (typeof renderPresetSelect === 'function') renderPresetSelect();
        persistPresetStore();
      };
      grid.appendChild(btn);
    });
  }

  function exportActivePresetJson() {
    if (typeof saveActivePresetFromUI !== 'function') return;
    saveActivePresetFromUI();
    const preset = getActivePreset();
    if (!preset) return;
    const payload = {
      v: 1,
      name: preset.name,
      settings: preset.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (preset.name || 'glitch-dust-preset').replace(/[^\w\-]+/g, '_') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    const status = document.getElementById('status');
    if (status) status.textContent = `Exported “${preset.name}” for full editor import.`;
  }

  function importPresetFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof presetStore === 'undefined') throw new Error('Preset system not ready');
        const data = JSON.parse(reader.result);
        const fileName = file.name.replace(/\.json$/i, '') || 'Imported preset';
        const imported = normalizeImportedPreset(data, fileName);
        const name = (imported.name || fileName).trim();
        const settings = imported.settings;
        const id = 'user-' + Date.now();
        presetStore.presets.push({ id, name, settings });
        presetStore.activeId = id;
        applySettings(settings);
        persistPresetStore();
        if (typeof renderPresetSelect === 'function') renderPresetSelect();
        renderLitePresetGrid();
        syncLiteTextFromSettings(settings);
        const status = document.getElementById('status');
        if (status) status.textContent = `Imported preset “${name}”.`;
      } catch (err) {
        const status = document.getElementById('status');
        if (status) status.textContent = 'Import failed: ' + (err.message || 'invalid JSON');
        console.error('Preset import failed:', err);
      }
    };
    reader.onerror = () => {
      const status = document.getElementById('status');
      if (status) status.textContent = 'Import failed: could not read file';
    };
    reader.readAsText(file);
  }

  function syncLiteTextFromSettings(settings) {
    if (!settings) return;
    const headline = document.getElementById('overlayText');
    const prompt = document.getElementById('promptText');
    if (headline && settings.text) headline.value = settings.text.content || '';
    if (prompt && settings.promptText) prompt.value = settings.promptText.content || '';
    if (settings.text && document.getElementById('textEnabled')) {
      document.getElementById('textEnabled').checked = settings.text.enabled !== false;
    }
    if (settings.promptText && document.getElementById('promptEnabled')) {
      document.getElementById('promptEnabled').checked = settings.promptText.enabled === true;
    }
  }

  function initLiteAspectRatios() {
    const row = document.querySelector('.lite-ratio-row > div');
    if (!row) return;
    row.replaceChildren();
    ASPECT_PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.liteAspect = p.id;
      btn.textContent = p.label;
      btn.onclick = () => {
        document.getElementById('canvasW').value = p.w;
        document.getElementById('canvasH').value = p.h;
        applyCanvasSize();
        row.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      };
      row.appendChild(btn);
    });
    const w = parseInt(document.getElementById('canvasW').value, 10);
    const h = parseInt(document.getElementById('canvasH').value, 10);
    const match = ASPECT_PRESETS.find(p => p.w === w && p.h === h);
    if (match) {
      const btn = row.querySelector(`[data-liteAspect="${match.id}"]`);
      if (btn) btn.classList.add('active');
    }
  }

  function wireLiteTextareas() {
    ['overlayText', 'promptText'].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.liteWired === 'true') return;
      el.dataset.liteWired = 'true';
      el.addEventListener('input', () => {
        if (id === 'overlayText') {
          document.getElementById('textEnabled').checked = el.value.trim().length > 0;
        } else {
          document.getElementById('promptEnabled').checked = el.value.trim().length > 0;
        }
        drawFrame(performance.now());
        schedulePresetAutosave();
      });
    });
  }

  function initLiteUi() {
    if (!isLiteApp()) return;

    renderLitePresetGrid();
    initLiteAspectRatios();
    wireLiteTextareas();

    const importBtn = document.getElementById('litePresetImport');
    const exportBtn = document.getElementById('litePresetExport');
    const importInput = document.getElementById('litePresetImportFile');

    if (exportBtn && !exportBtn.dataset.liteWired) {
      exportBtn.dataset.liteWired = 'true';
      exportBtn.addEventListener('click', exportActivePresetJson);
    }

    if (importBtn && importInput && !importBtn.dataset.liteWired) {
      importBtn.dataset.liteWired = 'true';
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', () => {
        importPresetFromFile(importInput.files && importInput.files[0]);
        importInput.value = '';
      });
    }

    if (typeof renderPresetSelect === 'function' && !window.__liteRenderPresetSelectPatched) {
      window.__liteRenderPresetSelectPatched = true;
      const origRender = renderPresetSelect;
      window.renderPresetSelect = function () {
        origRender();
        renderLitePresetGrid();
      };
    }
  }

  window.initLiteUi = initLiteUi;
  window.renderLitePresetGrid = renderLitePresetGrid;
  window.importLitePresetFromFile = importPresetFromFile;
})();
