(function (root) {
  const PRESET_LIBRARY_KIND = 'preset-library';

  function cloneJson(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function sanitizeFilename(name) {
    return String(name || 'glitch-dust-presets').replace(/[^\w\-]+/g, '_');
  }

  function sanitizePresetEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const settings = entry.settings || (entry.sliders && entry.selects ? entry : null);
    if (!settings || !settings.sliders) return null;
    return {
      id: entry.id || null,
      name: String(entry.name || 'Imported preset').trim() || 'Imported preset',
      builtin: !!entry.builtin,
      settings: cloneJson(settings),
    };
  }

  function isPresetLibrary(data) {
    return !!(
      data &&
      typeof data === 'object' &&
      Array.isArray(data.presets) &&
      data.presets.length &&
      (data.kind === PRESET_LIBRARY_KIND || data.presets.some(p => p && p.settings))
    );
  }

  function buildPresetLibraryExport(store) {
    if (!store || !Array.isArray(store.presets)) {
      throw new Error('Preset store not available');
    }
    return {
      v: 1,
      kind: PRESET_LIBRARY_KIND,
      exportedAt: new Date().toISOString(),
      activeId: store.activeId,
      presets: store.presets.map(p => ({
        id: p.id,
        name: p.name,
        builtin: !!p.builtin,
        settings: cloneJson(p.settings),
      })),
    };
  }

  function uniquePresetId(store, preferredId) {
    let id = preferredId || ('user-' + Date.now());
    while (store.presets.some(p => p.id === id)) {
      id = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    }
    return id;
  }

  function mergePresetLibrary(store, data, opts) {
    opts = opts || {};
    const builtinIds = new Set([
      opts.builtinDefaultId || 'builtin-default',
      opts.builtinTransitionId || 'builtin-transition',
    ]);
    const incoming = (data.presets || []).map(sanitizePresetEntry).filter(Boolean);
    if (!incoming.length) throw new Error('No valid presets in file');

    let added = 0;
    let skipped = 0;
    let lastAddedId = null;
    const idMap = new Map();

    incoming.forEach(entry => {
      if (entry.builtin || (entry.id && builtinIds.has(entry.id))) {
        skipped++;
        return;
      }
      const id = uniquePresetId(store, entry.id);
      store.presets.push({ id, name: entry.name, settings: entry.settings });
      if (entry.id) idMap.set(entry.id, id);
      lastAddedId = id;
      added++;
    });

    if (!added) throw new Error('No user presets to import (built-ins are skipped)');

    let activeId = data.activeId;
    if (activeId && idMap.has(activeId)) activeId = idMap.get(activeId);
    if (activeId && store.presets.some(p => p.id === activeId)) {
      store.activeId = activeId;
    } else if (lastAddedId) {
      store.activeId = lastAddedId;
    }

    return { added, skipped, activeId: store.activeId };
  }

  function importSinglePreset(store, data, fileName) {
    const entry = sanitizePresetEntry(
      data.settings ? { name: data.name, settings: data.settings, id: data.id, builtin: data.builtin } : data
    );
    if (!entry) throw new Error('Invalid preset JSON');
    const name = entry.name || fileName || 'Imported preset';
    const id = uniquePresetId(store, entry.id);
    store.presets.push({ id, name, settings: entry.settings });
    store.activeId = id;
    return { added: 1, skipped: 0, activeId: id, name };
  }

  function importPresetData(store, data, fileName, opts) {
    if (!store) throw new Error('Preset store not available');
    if (!data || typeof data !== 'object') throw new Error('Invalid preset JSON');

    if (isPresetLibrary(data)) {
      return { mode: 'library', ...mergePresetLibrary(store, data, opts) };
    }

    const single = importSinglePreset(store, data, fileName);
    return { mode: 'single', ...single };
  }

  function downloadPresetJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = sanitizeFilename(filename) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const CLEAR_ALL_PRESETS_CONFIRM =
    'Clear all presets? Your saved presets will be deleted and built-ins reset to defaults.';

  root.PresetIO = {
    PRESET_LIBRARY_KIND,
    CLEAR_ALL_PRESETS_CONFIRM,
    isPresetLibrary,
    buildPresetLibraryExport,
    importPresetData,
    downloadPresetJson,
    sanitizeFilename,
  };
})(typeof window !== 'undefined' ? window : globalThis);
