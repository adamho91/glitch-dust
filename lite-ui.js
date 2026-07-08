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

  function importStatusMessage(result) {
    if (result.mode === 'library') {
      const skipped = result.skipped ? ` (${result.skipped} built-in skipped)` : '';
      return `Imported ${result.added} preset${result.added === 1 ? '' : 's'}${skipped}.`;
    }
    return `Imported preset “${getActivePreset().name}”.`;
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
        syncLiteControlsFromSettings(p.settings);
        renderLitePresetGrid();
        if (typeof renderPresetSelect === 'function') renderPresetSelect();
        persistPresetStore();
      };
      grid.appendChild(btn);
    });
  }

  function exportPresetLibraryJson() {
    if (typeof saveActivePresetFromUI !== 'function') {
      const status = document.getElementById('status');
      if (status) status.textContent = 'Export unavailable — reload the page.';
      return;
    }
    if (typeof PresetIO === 'undefined') {
      const status = document.getElementById('status');
      if (status) status.textContent = 'Export unavailable — preset-io.js did not load.';
      return;
    }
    saveActivePresetFromUI();
    try {
      const payload = PresetIO.buildPresetLibraryExport(presetStore);
      PresetIO.downloadPresetJson(payload, 'glitch-dust-presets');
      const status = document.getElementById('status');
      if (status) {
        status.textContent = `Exported ${payload.presets.length} preset${payload.presets.length === 1 ? '' : 's'}.`;
      }
    } catch (err) {
      const status = document.getElementById('status');
      if (status) status.textContent = 'Export failed: ' + (err.message || 'unknown error');
    }
  }

  function importPresetFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof presetStore === 'undefined') throw new Error('Preset system not ready');
        if (typeof PresetIO === 'undefined') throw new Error('Preset IO not loaded');
        const data = JSON.parse(reader.result);
        const fileName = file.name.replace(/\.json$/i, '') || 'Imported preset';
        const result = PresetIO.importPresetData(presetStore, data, fileName, {
          builtinDefaultId: typeof BUILTIN_DEFAULT_ID !== 'undefined' ? BUILTIN_DEFAULT_ID : 'builtin-default',
          builtinTransitionId: typeof BUILTIN_TRANSITION_ID !== 'undefined' ? BUILTIN_TRANSITION_ID : 'builtin-transition',
        });
        applySettings(getActivePreset().settings);
        persistPresetStore();
        if (typeof renderPresetSelect === 'function') renderPresetSelect();
        renderLitePresetGrid();
        syncLiteTextFromSettings(getActivePreset().settings);
        if (typeof syncDialSliders === 'function') syncDialSliders();
        const status = document.getElementById('status');
        if (status) status.textContent = importStatusMessage(result);
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

  function clearAllPresets() {
    const msg = (typeof PresetIO !== 'undefined' && PresetIO.CLEAR_ALL_PRESETS_CONFIRM)
      || 'Clear all presets? Your saved presets will be deleted and built-ins reset to defaults.';
    if (!confirm(msg)) return;
    if (typeof createDefaultPresetStore !== 'function') return;
    presetStore = createDefaultPresetStore();
    persistPresetStore();
    applySettings(getActivePreset().settings);
    if (typeof renderPresetSelect === 'function') renderPresetSelect();
    renderLitePresetGrid();
    syncLiteControlsFromSettings(getActivePreset().settings);
    if (typeof syncDialSliders === 'function') syncDialSliders();
    if (typeof clearAllPaletteMedia === 'function') clearAllPaletteMedia();
    const status = document.getElementById('status');
    if (status) status.textContent = 'All presets cleared · loaded defaults.';
  }

  function syncLiteControlsFromSettings(settings) {
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
    const liteLogo = document.getElementById('liteLogoEnabled');
    const logo = document.getElementById('logoEnabled');
    if (liteLogo && logo) {
      const enabled = settings.logo && settings.logo.enabled === true;
      logo.checked = enabled;
      liteLogo.checked = enabled;
      if (typeof refreshLogoOverlay === 'function') refreshLogoOverlay();
    }
    if (settings.nodeMedia && document.getElementById('nodeMediaEnabled')) {
      document.getElementById('nodeMediaEnabled').checked = settings.nodeMedia.enabled === true;
      if (settings.nodeMedia.gifLoop != null && document.getElementById('nodeMediaGifLoop')) {
        document.getElementById('nodeMediaGifLoop').checked = settings.nodeMedia.gifLoop !== false;
      }
      if (typeof updateNodeMediaUi === 'function') updateNodeMediaUi();
    }
  }

  function syncLiteTextFromSettings(settings) {
    syncLiteControlsFromSettings(settings);
  }

  function wireLiteLogoToggle() {
    const lite = document.getElementById('liteLogoEnabled');
    const logo = document.getElementById('logoEnabled');
    if (!lite || !logo || lite.dataset.liteWired === 'true') return;
    lite.dataset.liteWired = 'true';
    lite.checked = logo.checked;
    lite.addEventListener('change', () => {
      logo.checked = lite.checked;
      if (typeof refreshLogoOverlay === 'function') refreshLogoOverlay();
      if (typeof drawFrame === 'function') drawFrame(performance.now());
      if (typeof schedulePresetAutosave === 'function') schedulePresetAutosave();
    });
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

  function wireLiteOverlayWrap() {
    const sel = document.getElementById('liteOverlayWrap');
    if (!sel || sel.dataset.liteWired === 'true') return;
    sel.dataset.liteWired = 'true';
    const apply = () => {
      if (typeof setOverlayWrapCharsLandscapeOverride === 'function') {
        setOverlayWrapCharsLandscapeOverride(sel.value);
      }
      if (typeof invalidateTextLayout === 'function') invalidateTextLayout();
      if (typeof drawFrame === 'function') drawFrame(performance.now());
      if (typeof updateMedianPreview === 'function') updateMedianPreview();
    };
    sel.addEventListener('change', apply);
    apply();
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
    wireLiteOverlayWrap();
    wireLiteLogoToggle();

    const importBtn = document.getElementById('litePresetImport');
    const exportBtn = document.getElementById('litePresetExport');
    const importInput = document.getElementById('litePresetImportFile');

    if (exportBtn && !exportBtn.dataset.liteWired) {
      exportBtn.dataset.liteWired = 'true';
      exportBtn.addEventListener('click', exportPresetLibraryJson);
    }

    if (importBtn && importInput && !importBtn.dataset.liteWired) {
      importBtn.dataset.liteWired = 'true';
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', () => {
        importPresetFromFile(importInput.files && importInput.files[0]);
        importInput.value = '';
      });
    }

    const clearBtn = document.getElementById('litePresetClearAll');
    if (clearBtn && !clearBtn.dataset.liteWired) {
      clearBtn.dataset.liteWired = 'true';
      clearBtn.addEventListener('click', clearAllPresets);
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
