import {isComparison,MEDIA_FIELDS,MEDIA_GRID_MAX,sceneMediaIds,secondaryMediaScene,resolveSceneAsset} from './video-media-layouts.mjs?v=28';
import { createSvgContext } from "./video-svg.mjs?v=24";
import { suggestChart, CHART_PALETTES } from "./video-chart-import.mjs?v=24";
import {
  EXTRA_LAYOUTS,
  DEFAULT_DATA,
  parseDataRows,
} from "./video-layouts.mjs?v=28";
import { timelineGeometry } from "./video-timeline.mjs?v=24";
import { SWISS_DATA_LIMITS } from "./video-swiss.mjs?v=24";
import {
  DUST_PRESET_KEY,
  readDustPresets,
  applyDustPreset,
} from "./video-presets.mjs?v=24";
import {
  FORMATS,
  LAYOUTS,
  DEFAULTS,
  clamp,
  createScene,
  setSceneLayout,
  starterProject,
  normalizeProject,
  duration,
  sceneStart,
  locate,
  transitionAt,
  mediaTime,
  mediaSequenceStart,
  mediaElapsed,
  renderScene,
  renderFrame,
  outputSize,
} from "./video-core.mjs?v=28";

const $ = (id) => document.getElementById(id);
const assets = new Map(),
  removedAssets = new Map(),
  videoInstances = new Map(),
  fontAssets = new Map();
const canvas = $("preview"),
  transitionCanvas = document.createElement("canvas");
let mediaRegions = [], mediaSelection = null, mediaDrag = null;
let presenting = false;
const paletteList = [2, 3, 4, 5].flatMap((n) =>
  getGroupedTonalPresets(n).flatMap((g) => g.presets),
);
let project = starterProject(),
  selected = 0,
  time = 0.9,
  playing = false,
  lastTick = 0,
  busy = false,
  cancelled = false;
let past = [],
  future = [],
  saveTimer,
  thumbTimer,
  db,
  saveChain = Promise.resolve(),
  ready = false,
  dirty = false;
const unsavedAssets = new Set();
const current = () => project.scenes[selected];
let dustPresets = [];
function renderDustPresetPreview() {
  if (!$("dustPresetPanel").open) return;
  const preset = dustPresets[Number($("dustPresetSelect").value)];
  $("applyDustPreset").disabled = !preset;
  if (!preset) return;
  try {
    const scene = applyDustPreset(
      current(),
      preset,
      $("dustPresetText").checked,
    );
    thumb($("dustPresetPreview"), scene);
    $("dustPresetHelp").textContent =
      "Colors and shared pattern controls transfer into editable Video diffusion. Source motion styles may look different.";
  } catch (e) {
    $("applyDustPreset").disabled = true;
    $("dustPresetHelp").textContent = e.message;
  }
}
function showDustPresets(list) {
  const previous = dustPresets[Number($("dustPresetSelect").value)]?.id;
  dustPresets = list;
  $("dustPresetSelect").replaceChildren();
  list.forEach((preset, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = preset.name;
    option.selected = preset.id === previous;
    $("dustPresetSelect").append(option);
  });
  renderDustPresetPreview();
}
function refreshDustPresets() {
  const entries = new Map();
  if (typeof getDefaultPresetStoreTemplate === "function")
    for (const preset of readDustPresets(getDefaultPresetStoreTemplate()))
      entries.set(preset.id, preset);
  let savedCount = 0;
  try {
    const saved = localStorage.getItem(DUST_PRESET_KEY);
    if (saved) {
      const list = readDustPresets(JSON.parse(saved));
      savedCount = list.length;
      for (const preset of list) entries.set(preset.id, preset);
    }
  } catch {
    /* Import JSON also works when browser storage is unavailable. */
  }
  showDustPresets([...entries.values()]);
  if (!savedCount)
    $("dustPresetHelp").textContent =
      "Built-in library loaded. For presets saved in another browser or page origin, export JSON from Shift 1 or 2 and import it here. Shared controls use Video diffusion.";
}
const copy = () => JSON.stringify({project, assetIds: [...assets.keys()]});
const status = (message) => ($("status").textContent = message);
function checkpoint() {
  const str = copy();
  if (past.at(-1) !== str) {
    past.push(str);
    if (past.length > 60) past.shift();
  }
  future = [];
}
function changed({ controls = false } = {}) {
  time = clamp(time, 0, duration(project) - 0.00001);
  if (controls) syncControls();
  draw();
  scheduleThumbnails();
  scheduleSave();
  updateHistory();
}
function updateHistory() {
  $("undo").disabled = !past.length;
  $("redo").disabled = !future.length;
}
function history(direction) {
  if (busy) return;
  const from = direction === "undo" ? past : future,
    to = direction === "undo" ? future : past;
  if (!from.length) return;
  stop();
  to.push(copy());
  const snapshot = JSON.parse(from.pop());
  const wanted = new Set(snapshot.assetIds);
  for (const [id, asset] of assets) {
    if (!wanted.has(id)) {
      removedAssets.set(id, asset);
      assets.delete(id);
    }
  }
  for (const id of wanted) {
    if (!assets.has(id) && removedAssets.has(id)) {
      assets.set(id, removedAssets.get(id));
      removedAssets.delete(id);
    }
  }
  project = snapshot.project;
  selected = Math.min(selected, project.scenes.length - 1);
  time =
    sceneStart(project, selected) + Math.min(0.9, current().duration * 0.5);
  buildLibrary();
  syncAll();
  scheduleSave();
}
function scheduleSave() {
  if (!ready) return;
  dirty = true;
  clearTimeout(saveTimer);
  $("saveStatus").textContent = "Saving on this device…";
  saveTimer = setTimeout(saveLocal, 350);
}
function transaction(store, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || Error("Storage unavailable"));
  });
}
async function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("fal-video-studio", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("project");
      req.result.createObjectStore("assets", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function saveLocal() {
  if (!db) return;
  const data = {
    project: structuredClone(project),
    assetIds: [...assets.keys()],
    fontIds: [...fontAssets.keys()],
  };
  saveChain = saveChain
    .catch(() => {})
    .then(() =>
      transaction("project", "readwrite", (s) => s.put(data, "current")),
    )
    .then(() => {
      if (JSON.stringify(project) === JSON.stringify(data.project) &&
          JSON.stringify([...assets.keys()]) === JSON.stringify(data.assetIds))
        dirty = false;
      $("saveStatus").textContent = [...unsavedAssets].some(id => assets.has(id) || fontAssets.has(id))
        ? "Media not autosaved · use Save project"
        : "Saved on this device";
    })
    .catch(() => {
      $("saveStatus").textContent = "Storage full · use Save project";
    });
  return saveChain;
}
async function persistAsset(item) {
  if (!db) {
    unsavedAssets.add(item.id);
    return;
  }
  try {
    await transaction("assets", "readwrite", (s) =>
      s.put({ id: item.id, name: item.name, kind: item.kind, blob: item.blob }),
    );
    unsavedAssets.delete(item.id);
  } catch {
    unsavedAssets.add(item.id);
    $("saveStatus").textContent = "Media could not autosave · use Save project";
    status("Device storage is full. Save a project file to keep your media.");
  }
}
let mediaSlot = 'primary';
const selectedMediaKey = () => mediaSlot === 'secondary' && isComparison(current().layout) ? 'mediaIdB' : 'mediaId';
const controlKey = key => mediaSlot === 'secondary' && isComparison(current().layout) && MEDIA_FIELDS.includes(key) ? key+'B' : key;
function syncControls() {
  const s = current();
  if (!isComparison(s.layout)) mediaSlot='primary';
  $("mediaSlotField").hidden=!isComparison(s.layout);
  $("mediaLabels").hidden=!isComparison(s.layout);
  $("mediaSlot").value=mediaSlot;
  document.querySelector('[data-prop="mediaFlow"]').closest("label").hidden=isComparison(s.layout);
  $("mediaFlowHelp").hidden=isComparison(s.layout);
  renderDustPresetPreview();
  syncDataControls();
  document.querySelectorAll("[data-prop]").forEach((el) => {
    const v = s[controlKey(el.dataset.prop)];
    if (el.type === "checkbox") el.checked = v;
    else el.value = v;
  });
  document.querySelectorAll("[data-output]").forEach((el) => {
    const k = controlKey(el.dataset.output);
    el.value = k === "entrance" ? (s[k] / 100).toFixed(2) + "s" : s[k];
  });
  const isChart = EXTRA_LAYOUTS.some(
    ([id, , group]) => id === s.layout && group === "data",
  );
  const trackingControl = document.querySelector('[data-prop="tracking"]');
  trackingControl.disabled = isChart;
  if (isChart) {
    trackingControl.value = 0;
    document.querySelector('[data-output="tracking"]').value = "0";
  }
  document
    .querySelectorAll("[data-tier]")
    .forEach((el) =>
      el.setAttribute(
        "aria-pressed",
        s.megaTiers.includes(Number(el.dataset.tier)),
      ),
    );
  document.querySelectorAll(".template").forEach((el) => {
    const active = el.dataset.layout === s.layout;
    el.classList.toggle("active", active);
    el.setAttribute("aria-pressed", active);
  });
  document.querySelectorAll(".palette").forEach((el) => {
    const active = el.dataset.palette === s.paletteId;
    el.classList.toggle("active", active);
    el.setAttribute("aria-pressed", active);
  });
  $("paletteName").textContent =
    paletteList.find((p) => p.id === s.paletteId)?.label ||
    "Custom color story";
  $("selectedMedia").textContent =
    assets.get(s[selectedMediaKey()])?.name || "No media selected";
  $("removeMedia").disabled = !s[selectedMediaKey()];
  $("removePreviewMedia").hidden = !s[selectedMediaKey()];
  $("aspectRatioMedia").hidden = !sceneMediaIds(s).some((id) => assets.has(id));
  $("sceneLabel").textContent = "Scene " + (selected + 1);
  $("deleteScene").disabled = project.scenes.length === 1;
  $("moveLeft").disabled = selected === 0;
  $("moveRight").disabled = selected === project.scenes.length - 1;
  for (const el of $("mediaLibrary").children)
    el.classList.toggle("active", el.dataset.id === s[selectedMediaKey()]);
}
function syncAll() {
  for (const option of $("layoutGroup").options) {
    const count =
      option.value === "all"
        ? LAYOUTS.length
        : [...$("templates").children].filter(
            (el) => el.dataset.group === option.value,
          ).length;
    option.textContent = option.textContent.split(" · ")[0] + " · " + count;
  }

  $("projectName").value = project.name;
  $("format").value = project.format;
  resizeCanvas();
  syncControls();
  renderThumbnails();
  updateHistory();
  draw();
}
function resizeCanvas() {
  const [w, h] = FORMATS[project.format];
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w}/${h}`;
  fitCanvas();
  $("dimensions").textContent = outputSize(project.format, 1080).join(" × ");
}
function fitCanvas() {
  const [w, h] = FORMATS[project.format],
    r = $("stageWrap").getBoundingClientRect(),
    f = Math.min((r.width - 24) / w, (r.height - 24) / h);
  canvas.style.width = Math.max(1, w * f) + "px";
  canvas.style.height = Math.max(1, h * f) + "px";
}
new ResizeObserver(fitCanvas).observe($("stageWrap"));
function clock(t) {
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;
}
function videoKey(s) {
  const index = project.scenes.findIndex(scene => scene.id === s.id);
  return project.scenes[mediaSequenceStart(project, index)]?.id || s.id;
}
function getVideo(s) {
  const a = assets.get(s.mediaId);
  if (a?.kind !== "video") return null;
  const key = videoKey(s);
  let instance = videoInstances.get(key);
  if (!instance || instance.assetId !== a.id || instance.url !== a.url) {
    if (instance) {
      instance.element.pause();
      instance.element.removeAttribute("src");
      instance.element.load();
    }
    const el = document.createElement("video");
    el.src = a.url;
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    el.load();
    instance = { ...a, element: el, assetId: a.id };
    videoInstances.set(key, instance);
  }
  return instance;
}
function renderAssets() {
  const map = new Map(assets);
  for (const scene of project.scenes.flatMap(s => isComparison(s.layout) ? [s,secondaryMediaScene(s)] : [s])) {
    const a = videoInstances.get(videoKey(scene));
    if (a && a.assetId === scene.mediaId && assets.has(a.assetId)) map.set(scene.id, a);
  }
  return map;
}
function draw() {
  // Consecutive scenes share a video element when their clip settings continue playback.
  mediaRegions = [];
  syncGifAssets(time);
  renderFrame(canvas, project, time, renderAssets(), transitionCanvas,
    (rect) => mediaRegions.push(rect));
  updateMediaSelection();
  $("timecode").textContent = clock(time) + " / " + clock(duration(project));
  $("scrub").max = duration(project);
  $("scrub").value = time;
  $("scrub").setAttribute(
    "aria-valuetext",
    `${clock(time)} of ${clock(duration(project))}`,
  );
  $("timelinePlayhead").style.left = `${(time / duration(project)) * 100}%`;
  if (playing) revealPlayhead();
}
function stop() {
  playing = false;
  $("play").textContent = "▶";
  $("play").setAttribute("aria-label", "Play");
  if ($("presentPlay")) {
    $("presentPlay").textContent = "▶";
    $("presentPlay").setAttribute("aria-label", "Play");
  }
  for (const a of videoInstances.values()) a.element.pause();
}
function togglePlay() {
  if (busy) return;
  if (playing) {
    stop();
    return;
  }
  if (time >= duration(project) - 0.05) time = 0;
  playing = true;
  lastTick = performance.now();
  $("play").textContent = "Ⅱ";
  $("play").setAttribute("aria-label", "Pause");
  if ($("presentPlay")) {
    $("presentPlay").textContent = "Ⅱ";
    $("presentPlay").setAttribute("aria-label", "Pause");
  }
}
function syncPreviewMedia() {
  const at = transitionAt(project, time),
    active = new Map([[at.scene.id, { s: at.scene, t: at.local }]]);
  if (at.blend < 1 && (!at.sharedMedia ||
      videoKey(at.scene) !== videoKey(project.scenes[at.index - 1]))) {
    const prev = project.scenes[at.index - 1];
    active.set(prev.id, { s: prev, t: Math.max(0, prev.duration - 1 / 60) });
  }
  for (const {s,t} of [...active.values()]) {
    if(isComparison(s.layout)) {const secondary=secondaryMediaScene(s);active.set(secondary.id,{s:secondary,t});}
  }
  for (const { s, t } of active.values()) {
    const a = getVideo(s);
    if (!a) continue;
    const v = a.element;
    if (v.readyState < 2) continue;
    const target = mediaTime(s, mediaElapsed(project, project.scenes.findIndex(scene => scene.id === s.id), t), v.duration);
    if (
      !v.seeking &&
      Math.abs(v.currentTime - target) > (playing ? 0.16 : 0.015)
    )
      v.currentTime = target;
    const atEnd = !s.mediaLoop && target >= v.duration - 0.06;
    if (playing && !atEnd && t < s.duration) {
      if (v.paused) v.play().catch(() => {});
    } else v.pause();
  }
  const activeKeys = new Set([...active.values()].map(({s}) => videoKey(s)));
  for (const [id, a] of videoInstances) if (!activeKeys.has(id)) a.element.pause();
}
function tick(now) {
  if (!busy) {
    if (playing) {
      time += (now - lastTick) / 1000;
      if (time >= duration(project)) {
        if ($("loop").checked) time %= duration(project);
        else {
          time = duration(project) - 0.00001;
          stop();
        }
      }
      const at = locate(project, time);
      if (at.index !== selected) {
        selected = at.index;
        syncControls();
        highlightCards();
        if (presenting) updatePresentHud();
      }
    }
    syncPreviewMedia();
    draw();
  }
  lastTick = now;
  requestAnimationFrame(tick);
}
function selectScene(index) {
  stop();
  selected = index;
  time = sceneStart(project, index) + Math.min(0.9, current().duration * 0.5);
  if (presenting) time = sceneStart(project, index);
  syncControls();
  highlightCards();
  syncPreviewMedia();
  draw();
  revealPlayhead();
  if (presenting) updatePresentHud();
}
function seekTimeline(next) {
  stop();
  time = clamp(next, 0, duration(project));
  selected = locate(project, time).index;
  syncControls();
  highlightCards();
  syncPreviewMedia();
  draw();
  if (presenting) updatePresentHud();
}
function updatePresentHud() {
  if (!presenting || !$("presentLabel")) return;
  $("presentLabel").textContent =
    `Scene ${selected + 1} / ${project.scenes.length}`;
}
function enterPresentMode() {
  if (busy || presenting) return;
  clearMediaSelection();
  presenting = true;
  document.body.classList.add("presenting");
  $("presentHud").hidden = false;
  $("presentMode").setAttribute("aria-pressed", "true");
  time = sceneStart(project, selected);
  updatePresentHud();
  fitCanvas();
  syncPreviewMedia();
  draw();
  canvas.focus({ preventScroll: true });
  status("Present mode · Space play · ← → scenes · Esc exit");
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}
function exitPresentMode() {
  if (!presenting) return;
  presenting = false;
  document.body.classList.remove("presenting");
  $("presentHud").hidden = true;
  $("presentMode").setAttribute("aria-pressed", "false");
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  fitCanvas();
  draw();
  status("Exited present mode.");
}
function presentGoScene(delta) {
  if (!presenting || !project.scenes.length) return;
  const next = clamp(selected + delta, 0, project.scenes.length - 1);
  selected = next;
  time = sceneStart(project, selected);
  syncControls();
  highlightCards();
  updatePresentHud();
  syncPreviewMedia();
  draw();
}
function revealPlayhead() {
  const viewport = $("timelineViewport");
  const x = (time / duration(project)) * $("timelineContent").offsetWidth;
  if (
    x < viewport.scrollLeft + 14 ||
    x > viewport.scrollLeft + viewport.clientWidth - 14
  )
    viewport.scrollLeft = Math.max(0, x - viewport.clientWidth * 0.25);
}
function renderTimeline() {
  const viewport = $("timelineViewport");
  const g = timelineGeometry(
    project,
    viewport.clientWidth - 16,
    Number($("timelineZoom").value),
  );
  $("timelineContent").style.width = `${g.width}px`;
  const ruler = $("timelineRuler"),
    transitions = $("transitionTrack");
  ruler.replaceChildren();
  transitions.replaceChildren();
  for (const tick of g.ticks) {
    const label = document.createElement("span");
    label.textContent = clock(tick).replace(/\.00$/, "");
    label.style.left = `${tick * g.scale}px`;
    if (tick === g.total) label.className = "ruler-end";
    ruler.append(label);
  }
  const names = { cut: "Cut", fade: "Dissolve", wipe: "Wipe", slide: "Slide" };
  const transitionKeys = ["cut", "fade", "wipe", "slide"];
  g.segments.forEach((segment, i) => {
    const card = $("sceneTrack").children[i];
    if (card) {
      card.style.width = `${segment.width}px`;
      card.classList.toggle("compact", segment.width < 100);
    }
    if (!i) return;
    const currentKey = project.scenes[i].transition || "fade";
    const name = segment.mediaFlow ? "Media flow" : names[currentKey] || "Dissolve";
    const marker = document.createElement("div");
    marker.className = "transition-marker";
    marker.style.left = `${segment.left}px`;

    const seek = document.createElement("button");
    seek.type = "button";
    seek.className = "transition-seek";
    seek.textContent = segment.transition ? "◆" : "│";
    seek.title = `Seek to ${clock(segment.start)}`;
    seek.setAttribute("aria-label", `Seek to transition into scene ${i + 1}`);
    seek.onclick = (e) => {
      e.stopPropagation();
      seekTimeline(segment.start);
      revealPlayhead();
    };
    marker.append(seek);

    if (segment.mediaFlow) {
      const label = document.createElement("button");
      label.type = "button";
      label.className = "transition-label";
      label.textContent = name;
      label.title =
        "Media flow is on — click to switch to a Cut / Dissolve / Wipe / Slide";
      label.onclick = (e) => {
        e.stopPropagation();
        checkpoint();
        stop();
        project.scenes[i].mediaFlow = false;
        if (!project.scenes[i].transition || project.scenes[i].transition === "cut")
          project.scenes[i].transition = "fade";
        selected = i;
        seekTimeline(segment.start);
        changed({ controls: true });
        status(`Media flow off · transition into scene ${i + 1}: ${names[project.scenes[i].transition]}`);
      };
      marker.append(label);
    } else {
      const select = document.createElement("select");
      select.className = "transition-picker";
      for (const key of transitionKeys) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = names[key];
        select.append(opt);
      }
      select.value = transitionKeys.includes(currentKey) ? currentKey : "fade";
      select.title = `Change transition · ${clock(segment.start)}${
        segment.transition ? ` · ${segment.transition.toFixed(2)}s` : ""
      }`;
      select.setAttribute(
        "aria-label",
        `Transition into scene ${i + 1} at ${clock(segment.start)}`,
      );
      select.onclick = (e) => e.stopPropagation();
      select.onchange = () => {
        checkpoint();
        stop();
        project.scenes[i].transition = select.value;
        selected = i;
        seekTimeline(segment.start);
        changed({ controls: true });
        status(`Transition into scene ${i + 1}: ${names[select.value]}`);
      };
      marker.append(select);
    }

    transitions.append(marker);
    if (segment.transition) {
      const span = document.createElement("div");
      span.className = "transition-span";
      span.style.left = `${segment.left}px`;
      span.style.width = `${segment.transition * g.scale}px`;
      span.setAttribute("aria-hidden", "true");
      transitions.append(span);
    }
  });
  $("timelinePlayhead").style.left = `${(time / g.total) * 100}%`;
}
function highlightCards() {
  [...$("sceneTrack").children].forEach((c, i) => {
    c.classList.toggle("active", i === selected);
    c.setAttribute("aria-pressed", i === selected);
  });
}
function thumb(c, s, index = 0) {
  const [w, h] = FORMATS[project.format];
  c.width = 288;
  c.height = Math.round((288 * h) / w);
  const ctx = c.getContext("2d");
  ctx.scale(c.width / w, c.height / h);
  renderScene(
    ctx,
    s,
    Math.min(1, s.duration * 0.5),
    w,
    h,
    resolveSceneAsset(renderAssets(), s),
    index,
  );
}
function scheduleThumbnails() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(renderThumbnails, 120);
}
function renderThumbnails() {
  const track = $("sceneTrack");
  track.replaceChildren();
  const total = duration(project);
  $("sceneCount").textContent =
    project.scenes.length + " scenes · " + total.toFixed(1) + "s";
  project.scenes.forEach((s, i) => {
    const card = document.createElement("button");
    card.className = "scene-card";
    card.draggable = true;
    const sceneTitle =
      s.title.trim().replace(/\n/g, " ") ||
      assets.get(s.mediaId)?.name ||
      "Untitled scene";
    card.setAttribute("aria-label", `Scene ${i + 1}: ${sceneTitle}`);
    card.title = `Scene ${i + 1}: ${sceneTitle} · ${s.duration.toFixed(1)}s`;
    const c = document.createElement("canvas");
    thumb(c, s, i);
    card.append(c);
    const meta = document.createElement("div");
    meta.className = "scene-meta";
    const label = document.createElement("span");
    label.textContent = String(i + 1).padStart(2, "0") + " / " + sceneTitle;
    const dur = document.createElement("span");
    dur.textContent = s.duration.toFixed(1) + "s";
    meta.append(label, dur);
    card.append(meta);
    card.onclick = () => selectScene(i);
    card.ondragstart = (e) =>
      e.dataTransfer.setData("application/x-fal-scene", s.id);
    card.ondragover = (e) => {
      if (e.dataTransfer.types.includes("application/x-fal-scene")) {
        e.preventDefault();
        card.classList.add("drag-over");
      }
    };
    card.ondragleave = () => card.classList.remove("drag-over");
    card.ondrop = (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("application/x-fal-scene");
      const from = project.scenes.findIndex((s) => s.id === id);
      if (from >= 0) moveScene(from, i);
    };
    track.append(card);
  });
  renderTimeline();
  highlightCards();
  document.querySelectorAll(".template canvas").forEach((c, i) => {
    const label = LAYOUTS[i][1];
    const preview = {
      ...current(),
      layout: LAYOUTS[i][0],
      title: label,
      body: "",
      eyebrow: "",
      footer: false,
      fontSize: 112,
      dataRows: DEFAULT_DATA,
      valuePrefix: "",
      valueSuffix: "",
      dataDecimals: 0,
      chartMax: 0,
    };
    setSceneLayout(preview, preview.layout);
    thumb(c, preview);
  });
}
function syncDataControls() {
  const s = current(),
    isData = EXTRA_LAYOUTS.some(
      ([id, , group]) => id === s.layout && group === "data",
    );
  $("layoutData").hidden = !isData;
  if (!isData) return;
  $("dataHelp").textContent =
    s.layout === "waterfall"
      ? "Each row is a signed change. Bars show the running total in row order."
      : s.layout === "delta"
        ? "Use two rows: the first is before, the second is after. The large value shows the difference."
        : s.layout === "goal-bars"
          ? "Use nonnegative values. Scale / goal sets the goal marker; values may exceed it."
          : s.layout === "area-squares"
            ? "Use nonnegative values. Square area is proportional to the value."
            : s.layout === "funnel"
              ? "Use nonnegative values in stage order. Widths share one scale; rows are not sorted."
              : s.layout === "steps"
                ? "One step per row: Label | 1. Steps are numbered in row order; values are not shown."
                : s.layout === "share-bar"
                  ? "One share per row: Label | 42. Use nonnegative values; shares are calculated from their total."
                  : ["line-chart", "area-chart"].includes(s.layout)
                    ? "One point per row: Label | 42. Points follow row order; negative values are supported."
                    : "One row per item: Label | 42. Up to 8 rows. Use Type for the headline and prompt.";
  const { rows, errors } = parseDataRows(s.dataRows);
  const limit = {
    "big-stat": 1,
    "stat-grid": 6,
    columns: 6,
    waffle: 1,
    progress: 4,
    comparison: 2,
    steps: 6,
    bars: 8,
    ...SWISS_DATA_LIMITS,
  }[s.layout];
  $("dataStatus").textContent = errors.length
    ? `Check row${errors.length > 1 ? "s" : ""} ${errors.join(", ")}: use Label | number. Invalid rows are omitted.`
    : s.dataRows === DEFAULT_DATA
      ? "Example data — replace with your own."
      : `${Math.min(rows.length, limit)} of ${rows.length} items shown${rows.length > limit ? `; this layout uses the first ${limit}` : ""}.`;
  const hasScale = [
    "waterfall",
    "square-stems",
    "goal-bars",
    "funnel",
    "area-squares",
    "bars",
    "columns",
    "waffle",
    "progress",
    "ranked-bars",
    "diverging-bars",
    "dot-plot",
    "line-chart",
    "area-chart",
    "goal-blocks",
  ].includes(s.layout);
  $("chartMaxField").hidden = !hasScale;
  $("chartMaxHelp").hidden = !hasScale;
}

function moveScene(from, to) {
  if (from === to || to < 0 || to >= project.scenes.length) return;
  checkpoint();
  stop();
  const [s] = project.scenes.splice(from, 1);
  project.scenes.splice(to, 0, s);
  selected = to;
  time = sceneStart(project, to) + Math.min(0.9, s.duration * 0.5);
  changed({ controls: true });
  renderThumbnails();
}
function addScene(duplicate = false) {
  if (project.scenes.length >= 100) {
    status("Projects support up to 100 scenes.");
    return;
  }
  checkpoint();
  stop();
  const s = duplicate
    ? createScene({ ...structuredClone(current()), id: crypto.randomUUID() })
    : createScene({
        bg: current().bg,
        fg: current().fg,
        accent: current().accent,
        colors: [...current().colors],
        paletteId: current().paletteId,
        title: "Your next\nbig idea.",
        body: "",
        seed: Math.ceil(Math.random() * 999999),
      });
  project.scenes.splice(selected + 1, 0, s);
  selected++;
  time = sceneStart(project, selected) + 0.8;
  changed({ controls: true });
  renderThumbnails();
}
function applyPalette(p) {
  checkpoint();
  Object.assign(current(), {
    paletteId: p.id,
    bg: p.bg || p.colors[0],
    colors: [...p.colors],
    fg:
      p.colors.find(
        (c) => c.toLowerCase() !== (p.bg || p.colors[0]).toLowerCase(),
      ) || "#FFFFFF",
    accent:
      p.colors.filter((c) => c !== (p.bg || p.colors[0])).at(-1) || "#ADFF00",
  });
  current().promptBg = current().fg;
  current().promptFg = current().bg;
  changed({ controls: true });
}
function suggestedPalettes() {
  const group = $("paletteGroup").value;
  return paletteList.filter((p) => {
    // Count the ground too: a few shared "2-color" presets contain a third hue.
    const count = new Set(
      [p.bg, ...p.colors].filter(Boolean).map((c) => c.toLowerCase()),
    ).size;
    return (
      (group === "all" || p.group === group) &&
      ($("paletteSize").value === "all" || count === 2)
    );
  });
}
function buildPalettes() {
  const list = suggestedPalettes();
  $("palettes").replaceChildren();
  $("paletteCount").textContent = list.length + " combinations";
  for (const p of list) {
    const btn = document.createElement("button");
    btn.className = "palette";
    btn.dataset.palette = p.id;
    btn.title = p.label;
    btn.setAttribute("aria-label", p.label);
    for (const color of [...new Set([p.bg, ...p.colors].filter(Boolean))]) {
      const chip = document.createElement("span");
      chip.style.background = color;
      btn.append(chip);
    }
    btn.onclick = () => applyPalette(p);
    $("palettes").append(btn);
  }
  syncControls();
}
function eventReady(el, event, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        finish(
          Error(
            "Media took too long to load. Try a smaller or different file.",
          ),
        ),
      timeout,
    );
    const finish = (err) => {
      clearTimeout(timer);
      el.removeEventListener(event, ok);
      el.removeEventListener("error", fail);
      err ? reject(err) : resolve();
    };
    const ok = () => finish(),
      fail = () =>
        finish(
          Error(
            "This media format could not be decoded. Try a PNG, JPG, GIF, or H.264 MP4 / WebM.",
          ),
        );
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", fail, { once: true });
  });
}
function releaseAsset(a) {
  if (a.element?.tagName === "VIDEO") {
    a.element.pause();
    a.element.removeAttribute("src");
    a.element.load();
  }
  if (a.url) URL.revokeObjectURL(a.url);
}
async function loadFont(blob, name, id = crypto.randomUUID()) {
  if (!blob.size) throw Error("The font file is empty.");
  const family = "Custom " + id;
  const face = new FontFace(family, await blob.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  const item = { id, name, kind: "font", blob, family, face };
  return item;
}
function buildFonts() {} // Focal is the only editor typeface.
function buildLibrary() {
  $("mediaLibrary").replaceChildren();
  $("mediaCount").textContent = assets.size + " assets";
  $("sequenceMedia").disabled = !assets.size;
  for (const a of assets.values()) {
    const card = document.createElement("div");
    card.className = "media-card";
    card.dataset.id = a.id;
    const b = document.createElement("button");
    b.className = "media-item";
    b.dataset.id = a.id;
    b.title = "Use " + a.name;
    let el;
    if (a.kind === "gif" && a.frames?.[0]?.canvas) {
      const src = a.frames[0].canvas;
      el = document.createElement("canvas");
      el.width = src.width;
      el.height = src.height;
      el.getContext("2d").drawImage(src, 0, 0);
    } else {
      el = a.element.cloneNode();
      el.removeAttribute("autoplay");
      if (a.kind === "video") {
        el.muted = true;
        el.preload = "metadata";
      }
    }
    const name = document.createElement("span");
    name.textContent =
      (a.kind === "video" ? "▶ " : a.kind === "gif" ? "GIF " : "") + a.name;
    b.append(el, name);
    b.onclick = () => {
      if (busy) return;
      stop();
      checkpoint();
      disableDustForMedia(current());
      current()[selectedMediaKey()] = a.id;
      if (selectedMediaKey() === "mediaId") current().mediaDim = 0;
      else current().mediaDimB = 0;
      changed({ controls: true });
      status(a.name + " added to this scene. Dust is off.");
    };
    const remove = document.createElement("button");
    remove.className = "media-delete";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete " + a.name + " from project");
    remove.title = "Remove this upload from the project and all scenes. Undo restores it.";
    remove.onclick = () => deleteLibraryMedia(a.id);
    card.append(b, remove);
    $("mediaLibrary").append(card);
  }
  syncControls();
}
function deleteLibraryMedia(id) {
  if (busy || !assets.has(id)) return;
  stop();
  checkpoint();
  const a = assets.get(id);
  removedAssets.set(id, a);
  assets.delete(id);
  for (const scene of project.scenes) {
    if (scene.mediaId === id) scene.mediaId = null;
    if (scene.mediaIdB === id) scene.mediaIdB = null;
    if (Array.isArray(scene.mediaIds)) {
      scene.mediaIds = scene.mediaIds.filter((mid) => mid !== id);
      if (scene.mediaIds[0]) scene.mediaId = scene.mediaIds[0];
      if (scene.mediaIds[1]) scene.mediaIdB = scene.mediaIds[1];
      else if (scene.mediaIdB === id) scene.mediaIdB = null;
    }
  }
  for (const [sceneId, instance] of videoInstances) {
    if (instance.assetId === id) {
      instance.element.pause();
      instance.element.removeAttribute("src");
      instance.element.load();
      videoInstances.delete(sceneId);
    }
  }
  clearMediaSelection();
  buildLibrary();
  changed({controls: true});
  status(a.name + " deleted from the project. Undo to restore it.");
}
function disableDustForMedia(scene) {
  if (!scene) return;
  scene.pattern = "none";
  scene.patternExplicit = true;
}

function mediaSceneBase() {
  const s = current();
  return {
    bg: s.bg,
    fg: s.fg,
    accent: s.accent,
    colors: [...s.colors],
    paletteId: s.paletteId,
    title: "",
    eyebrow: "",
    body: "",
    footer: false,
    mediaDim: 0,
    pattern: "none",
    patternExplicit: true,
    transition: "fade",
  };
}

function mediaDurationFor(asset) {
  if (asset.kind === "video")
    return clamp(asset.element.duration, 0.5, 60);
  if (asset.kind === "gif" && asset.duration > 0.05)
    return clamp(asset.duration, 0.5, 60);
  return 5;
}

function guessMediaKind(file) {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/.test(name))
    return "video";
  if (type === "image/gif" || name.endsWith(".gif")) return "gif";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|avif|bmp|svg)$/.test(name))
    return "image";
  return null;
}

async function decodeAnimatedGif(blob) {
  if (typeof ImageDecoder === "undefined") return null;
  let decoder;
  try {
    decoder = new ImageDecoder({
      data: await blob.arrayBuffer(),
      type: "image/gif",
    });
    if (decoder.tracks?.ready) await decoder.tracks.ready;
    // Prefer a completed decode so frameCount is reliable.
    try {
      await decoder.decode({ frameIndex: 0 });
    } catch (_) {}
    const track = decoder.tracks.selectedTrack;
    const count = track?.frameCount || 0;
    if (!track || count < 2) {
      decoder.close?.();
      return null;
    }
    const frames = [];
    let totalUs = 0;
    const composite = document.createElement("canvas");
    const cctx = composite.getContext("2d", { willReadFrequently: true });
    for (let i = 0; i < count; i++) {
      const { image } = await decoder.decode({ frameIndex: i });
      const fw = image.displayWidth || image.codedWidth;
      const fh = image.displayHeight || image.codedHeight;
      if (!composite.width) {
        composite.width = fw;
        composite.height = fh;
      }
      // ImageDecoder yields display frames; still composite for disposal-safe copies.
      cctx.drawImage(image, 0, 0);
      const delayUs = Math.max(
        20000,
        Number(image.duration) > 0 ? Number(image.duration) : 100000,
      );
      image.close();
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = composite.width;
      frameCanvas.height = composite.height;
      frameCanvas.getContext("2d").drawImage(composite, 0, 0);
      frames.push({
        canvas: frameCanvas,
        delayMs: delayUs / 1000,
        startMs: totalUs / 1000,
      });
      totalUs += delayUs;
    }
    decoder.close?.();
    if (frames.length < 2) return null;
    return { frames, duration: Math.max(totalUs / 1e6, 0.05) };
  } catch (e) {
    try {
      decoder?.close?.();
    } catch (_) {}
    console.warn("GIF decode failed, using live img fallback:", e);
    return null;
  }
}

function attachLiveGif(img) {
  let host = document.getElementById("gifAnimHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "gifAnimHost";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
    document.body.appendChild(host);
  }
  host.appendChild(img);
}

function gifFrameAt(asset, timeSec) {
  if (asset?.liveGif && asset.element) return asset.element;
  if (!asset?.frames?.length) return asset?.element || null;
  const loop = Math.max(asset.duration || 0.1, 0.1);
  const ms = ((((timeSec % loop) + loop) % loop) * 1000);
  let frame = asset.frames[0];
  for (const f of asset.frames) {
    if (f.startMs <= ms) frame = f;
    else break;
  }
  return frame.canvas;
}

function syncGifAssets(globalTime) {
  const at = locate(project, globalTime);
  const scenes = [at.scene];
  if (at.index > 0 && at.blend < 1) scenes.unshift(project.scenes[at.index - 1]);
  for (const scene of scenes) {
    const index = project.scenes.findIndex((s) => s.id === scene.id);
    const local = Math.max(0, globalTime - sceneStart(project, index));
    const elapsed = mediaElapsed(project, index, local);
    for (const id of sceneMediaIds(scene)) {
      const asset = assets.get(id);
      if (!asset || (asset.kind !== "gif" && !asset.liveGif)) continue;
      if (asset.liveGif) {
        // Browser advances the GIF in real time while the <img> is in the DOM.
        asset.frameElement = asset.element;
        continue;
      }
      if (!asset.frames?.length) continue;
      const t = mediaTime(scene, elapsed, asset.duration || 1);
      asset.frameElement = gifFrameAt(asset, t);
    }
  }
}

async function loadAsset(
  blob,
  name,
  id = crypto.randomUUID(),
  kind = guessMediaKind({ type: blob.type, name }) ||
    (blob.type.startsWith("video/") ? "video" : "image"),
) {
  if (kind === "gif") {
    const animated = await decodeAnimatedGif(blob);
    if (animated) {
      const url = URL.createObjectURL(blob);
      return {
        id,
        name,
        kind: "gif",
        blob,
        url,
        element: animated.frames[0].canvas,
        frameElement: animated.frames[0].canvas,
        frames: animated.frames,
        duration: animated.duration,
        liveGif: false,
      };
    }
    // Fallback: keep a live <img> so the GIF still animates while playing.
    const url = URL.createObjectURL(blob);
    const el = document.createElement("img");
    try {
      const loaded = eventReady(el, "load");
      el.src = url;
      el.decoding = "sync";
      await loaded;
      if (!el.naturalWidth) throw Error("This GIF could not be decoded.");
      attachLiveGif(el);
      return {
        id,
        name,
        kind: "gif",
        blob,
        url,
        element: el,
        frameElement: el,
        frames: null,
        duration: 5,
        liveGif: true,
      };
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }
  const url = URL.createObjectURL(blob),
    el = document.createElement(kind === "video" ? "video" : "img");
  try {
    if (kind === "video") {
      el.muted = true;
      el.playsInline = true;
      el.preload = "auto";
      const loaded = eventReady(el, "loadeddata");
      el.src = url;
      el.load();
      await loaded;
      if (!Number.isFinite(el.duration) || !el.videoWidth)
        throw Error("This video has no playable video track.");
    } else {
      const loaded = eventReady(el, "load");
      el.src = url;
      await loaded;
      if (!el.naturalWidth) throw Error("This image could not be decoded.");
    }
    return { id, name, kind, blob, url, element: el };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function createMediaFrameScene(asset, overrides = {}) {
  return createScene({
    ...mediaSceneBase(),
    layout: "frame",
    mediaId: asset.id,
    duration: mediaDurationFor(asset),
    ...overrides,
  });
}

function createMediaCompareScene(a, b, layout, overrides = {}) {
  return createScene({
    ...mediaSceneBase(),
    layout,
    mediaId: a.id,
    mediaIdB: b?.id || null,
    duration: Math.max(mediaDurationFor(a), b ? mediaDurationFor(b) : 0),
    mediaLabelA: "A",
    mediaLabelB: "B",
    ...overrides,
  });
}

function createMediaGridScene(assetList, overrides = {}) {
  const list = assetList.slice(0, MEDIA_GRID_MAX);
  const ids = list.map((a) => a.id);
  return createScene({
    ...mediaSceneBase(),
    layout: "media-grid",
    mediaIds: ids,
    mediaId: ids[0] || null,
    mediaIdB: ids[1] || null,
    mediaFit: "adapt",
    mediaFitB: "adapt",
    mediaZoom: 100,
    mediaX: 50,
    mediaY: 50,
    mediaDim: 0,
    duration: Math.max(...list.map(mediaDurationFor), 5),
    ...overrides,
  });
}

let pendingPlaceAssets = [];

function openMediaPlaceDialog(assetList) {
  const list = (assetList || []).filter(Boolean);
  if (!list.length) return;
  pendingPlaceAssets = list;
  const n = list.length;
  $("mediaPlaceHelp").textContent =
    n === 1
      ? `Place “${list[0].name}”. Glitch dust turns off on media slides — turn it back on in Pattern anytime.`
      : `Place ${n} assets. Glitch dust turns off on media slides — turn it back on in Pattern anytime.`;
  $("mediaPlaceDialog").showModal();
}

function closeMediaPlaceDialog() {
  pendingPlaceAssets = [];
  if ($("mediaPlaceDialog").open) $("mediaPlaceDialog").close();
}

function applyMediaPlacement(mode) {
  const list = pendingPlaceAssets.slice();
  if (!list.length) {
    closeMediaPlaceDialog();
    return;
  }
  checkpoint();
  stop();
  const space = Math.max(0, 100 - project.scenes.length);
  let message = "";

  if (mode === "library") {
    message = `Kept ${list.length} asset${list.length === 1 ? "" : "s"} in Your material. Click a card to place one.`;
  } else if (mode === "same") {
    const scene = current();
    disableDustForMedia(scene);
    if (list.length >= 2) {
      setSceneLayout(scene, "compare-side");
      scene.mediaId = list[0].id;
      scene.mediaIdB = list[1].id;
      scene.mediaDim = 0;
      scene.mediaDimB = 0;
      scene.mediaLabelA = scene.mediaLabelA || "A";
      scene.mediaLabelB = scene.mediaLabelB || "B";
      scene.duration = Math.max(mediaDurationFor(list[0]), mediaDurationFor(list[1]));
      const rest = list.slice(2);
      if (rest.length && space > 0) {
        const extras = rest.slice(0, space).map((a) => createMediaFrameScene(a));
        project.scenes.splice(selected + 1, 0, ...extras);
        message = `Side by side on this slide · ${extras.length} more as new slides.`;
      } else {
        message = "Side by side on this slide. Dust is off.";
      }
    } else {
      scene.mediaId = list[0].id;
      scene.mediaDim = 0;
      message = `${list[0].name} on this slide. Dust is off.`;
    }
  } else if (mode === "sequence") {
    const take = list.slice(0, Math.max(1, space || (project.scenes.length < 100 ? 1 : 0)));
    if (!take.length) {
      status("Projects support up to 100 scenes.");
      closeMediaPlaceDialog();
      return;
    }
    const scenes = take.map((a) => createMediaFrameScene(a));
    project.scenes.splice(selected + 1, 0, ...scenes);
    selected++;
    time = sceneStart(project, selected) + Math.min(0.9, current().duration * 0.5);
    message = `Created ${scenes.length} media slide${scenes.length === 1 ? "" : "s"}. Dust is off.`;
  } else if (mode === "side" || mode === "stack") {
    const layout = mode === "stack" ? "compare-stack" : "compare-side";
    if (list.length < 2) {
      const scene = current();
      disableDustForMedia(scene);
      setSceneLayout(scene, layout);
      scene.mediaId = list[0].id;
      scene.mediaDim = 0;
      message = `${list[0].name} on a ${mode === "stack" ? "stacked" : "side-by-side"} slide. Add a second asset for B.`;
    } else {
      const compare = createMediaCompareScene(list[0], list[1], layout);
      project.scenes.splice(selected + 1, 0, compare);
      selected++;
      const rest = list.slice(2);
      const room = Math.max(0, 100 - project.scenes.length);
      if (rest.length && room > 0) {
        const extras = rest.slice(0, room).map((a) => createMediaFrameScene(a));
        project.scenes.splice(selected + 1, 0, ...extras);
        message = `${mode === "stack" ? "Stacked" : "Side by side"} pair + ${extras.length} follow-up slide${extras.length === 1 ? "" : "s"}. Dust is off.`;
      } else {
        message = `${mode === "stack" ? "Stacked" : "Side by side"} on a new slide. Dust is off.`;
      }
      time = sceneStart(project, selected) + Math.min(0.9, current().duration * 0.5);
    }
  } else if (mode === "grid") {
    const take = list.slice(0, MEDIA_GRID_MAX);
    const rest = list.slice(MEDIA_GRID_MAX);
    const grid = createMediaGridScene(take);
    project.scenes.splice(selected + 1, 0, grid);
    selected++;
    const room = Math.max(0, 100 - project.scenes.length);
    if (rest.length && room > 0) {
      const extras = rest.slice(0, room).map((a) => createMediaFrameScene(a));
      project.scenes.splice(selected + 1, 0, ...extras);
      message = `Aspect grid with ${take.length} · ${extras.length} more as new slides. Dust is off.`;
    } else {
      message = `Aspect grid with ${take.length} on one slide. Dust is off.`;
    }
    time = sceneStart(project, selected) + Math.min(0.9, current().duration * 0.5);
  }

  clearMediaSelection();
  changed({ controls: true });
  renderThumbnails();
  closeMediaPlaceDialog();
  status(message);
}

async function importMedia(files) {
  if (busy) return;
  stop();
  const loaded = [];
  setBusy(true);
  try {
    for (const f of files) {
      const kind = guessMediaKind(f);
      if (!kind) {
        status("Skipped " + f.name + " — use PNG, JPG, GIF, MP4, or WebM.");
        continue;
      }
      try {
        status("Loading " + f.name + "…");
        const a = await loadAsset(f, f.name, undefined, kind);
        assets.set(a.id, a);
        loaded.push(a);
        await persistAsset(a);
      } catch (e) {
        status(f.name + ": " + e.message);
      }
    }
    if (loaded.length) {
      buildLibrary();
      if (loaded.length === 1) {
        checkpoint();
        const scene = current();
        disableDustForMedia(scene);
        scene[selectedMediaKey()] = loaded[0].id;
        if (selectedMediaKey() === "mediaId") scene.mediaDim = 0;
        else scene.mediaDimB = 0;
        changed({ controls: true });
        status(`${loaded[0].name} on this slide. Dust is off — turn Pattern back on anytime.`);
      } else {
        openMediaPlaceDialog(loaded);
        status(`Added ${loaded.length} assets. Choose how to place them.`);
      }
    }
  } finally {
    setBusy(false);
  }
}
function download(blob, name) {
  if (!blob?.size) throw Error("The export was empty.");
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const fileName = () =>
  project.name
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "fal-video";
function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
function blobFromDataUrl(url) {
  if (typeof url !== "string" || !/^data:[^,]*;base64,/.test(url))
    throw Error("Invalid embedded asset.");
  const [head, body] = url.split(",");
  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: head.slice(5).split(";")[0] });
}
async function saveProject() {
  if (busy) return;
  const snapshot = structuredClone(project),
    name = fileName();
  $("saveProject").disabled = true;
  setBusy(true);
  try {
    status("Packing project and media…");
    const ids = new Set(assets.keys());
    const media = [];
    for (const id of ids) {
      const a = assets.get(id);
      if (!a) throw Error("A scene references missing media.");
      media.push({
        id: a.id,
        name: a.name,
        kind: a.kind,
        data: await toDataUrl(a.blob),
      });
    }
    const fonts = [];
    for (const a of fontAssets.values())
      fonts.push({ id: a.id, name: a.name, data: await toDataUrl(a.blob) });
    download(
      new Blob([JSON.stringify({ ...snapshot, media, fonts })], {
        type: "application/json",
      }),
      name + ".fal-video.json",
    );
    status("Project saved with its media and custom fonts.");
  } catch (e) {
    status("Save failed: " + e.message);
  } finally {
    $("saveProject").disabled = false;
    setBusy(false);
  }
}
async function openProject(file) {
  if (!file || busy) return;
  stop();
  const staged = [],
    stagedFonts = [];
  setBusy(true);
  try {
    status("Opening project…");
    const raw = JSON.parse(await file.text()),
      next = normalizeProject(raw);
    if (
      !Array.isArray(raw.media || []) ||
      !Array.isArray(raw.fonts || []) ||
      (raw.media?.length || 0) > 200 ||
      (raw.fonts?.length || 0) > 30
    )
      throw Error("Invalid project assets.");
    const ids = new Set();
    for (const a of raw.media || []) {
      if (
        !a ||
        typeof a.id !== "string" ||
        ids.has(a.id) ||
        !["image", "video"].includes(a.kind)
      )
        throw Error("Invalid media entry.");
      ids.add(a.id);
      staged.push(
        await loadAsset(
          blobFromDataUrl(a.data),
          String(a.name || "Media"),
          a.id,
          a.kind,
        ),
      );
    }
    for (const f of raw.fonts || []) {
      if (!f || typeof f.id !== "string" || ids.has(f.id))
        throw Error("Invalid font entry.");
      ids.add(f.id);
      stagedFonts.push(
        await loadFont(
          blobFromDataUrl(f.data),
          String(f.name || "Custom font"),
          f.id,
        ),
      );
    }
    if (
      next.scenes.some(
        (s) => sceneMediaIds(s).some(id => id && !staged.some((a) => a.id === id)),
      )
    )
      throw Error("This project is missing embedded media.");
    clearTimeout(saveTimer);
    for (const a of assets.values()) releaseAsset(a);
    assets.clear();
    for (const a of removedAssets.values()) releaseAsset(a);
    removedAssets.clear();
    for (const a of videoInstances.values()) releaseAsset(a);
    videoInstances.clear();
    for (const a of fontAssets.values()) document.fonts.delete(a.face);
    fontAssets.clear();
    unsavedAssets.clear();
    past = [];
    future = [];
    project = next;
    selected = 0;
    time = Math.min(0.9, current().duration * 0.5);
    for (const a of staged) {
      assets.set(a.id, a);
      await persistAsset(a);
    }
    for (const a of stagedFonts) {
      fontAssets.set(a.id, a);
      await persistAsset(a);
    }
    buildFonts();
    buildLibrary();
    syncAll();
    scheduleSave();
    status("Project opened.");
  } catch (e) {
    for (const a of staged) if (assets.get(a.id) !== a) releaseAsset(a);
    for (const a of stagedFonts)
      if (fontAssets.get(a.id) !== a) document.fonts.delete(a.face);
    status("Could not open project: " + e.message);
  } finally {
    setBusy(false);
  }
}
function setBusy(value) {
  busy = value;
  document.body.classList.toggle("busy", value);
  $("studio").inert = value;
}
async function seekVideo(s, local) {
  const a = getVideo(s);
  if (!a) return;
  const v = a.element;
  v.pause();
  if (v.readyState < 2) await eventReady(v, "loadeddata");
  const target = mediaTime(s, mediaElapsed(project, project.scenes.findIndex(scene => scene.id === s.id), local), v.duration);
  if (Math.abs(v.currentTime - target) < 0.0001 && !v.seeking) return;
  const wait = eventReady(v, "seeked");
  v.currentTime = target;
  await wait;
}
async function prepareFrame(t) {
  const at = transitionAt(project, t);
  syncGifAssets(t);
  await seekVideo(at.scene, at.local);
  if (isComparison(at.scene.layout)) await seekVideo(secondaryMediaScene(at.scene), at.local);
  if (at.blend < 1 && (!at.sharedMedia ||
      videoKey(at.scene) !== videoKey(project.scenes[at.index - 1]))) {
    const prev = project.scenes[at.index - 1];
    await seekVideo(prev, Math.max(0, prev.duration - 1 / 60));
    if(isComparison(prev.layout)) await seekVideo(secondaryMediaScene(prev),Math.max(0,prev.duration-1/60));
  }
}
function exportInfo() {
  const type = $("exportFormat").value,
    [w, h] = outputSize(project.format, Number($("resolution").value));
  $("exportDetail").textContent =
    `${w} × ${h} px · ` +
    (type === "mp4" || type === "gif"
      ? `${duration(project).toFixed(1)} seconds · ${$("fps").value} fps`
      : type === "svg"
        ? `Slide ${selected + 1} · Editable shapes and Focal text`
        : `Frame at ${clock(time)}`);
  $("fpsField").hidden = type !== "mp4" && type !== "gif";
  $("startExport").textContent =
    "Export " + (type === "jpeg" ? "JPG" : type.toUpperCase()) + " ↗";
}
async function encoderConfig(w, h, fps) {
  if (typeof VideoEncoder === "undefined")
    throw Error(
      "MP4 encoding is unavailable in this browser. Open this page in current Chrome or Edge over localhost. Still exports are available here.",
    );
  for (const codec of [
    "avc1.640033",
    "avc1.640032",
    "avc1.640028",
    "avc1.42001f",
  ]) {
    const config = {
      codec,
      width: w,
      height: h,
      bitrate: Math.min(45e6, Math.round(w * h * fps * 0.16)),
      framerate: fps,
      avc: { format: "avc" },
    };
    try {
      const support = await VideoEncoder.isConfigSupported(config);
      if (support.supported) return support.config;
    } catch {}
  }
  throw Error(
    "H.264 is unavailable at this resolution/frame rate. Try 720p at 30 fps, or use Chrome or Edge.",
  );
}
async function exportMovie(out) {
  const fps = Number($("fps").value),
    frames = Math.ceil(duration(project) * fps),
    config = await encoderConfig(out.width, out.height, fps);
  const { Muxer, ArrayBufferTarget } = await import("./vendor/mp4-muxer.mjs");
  const target = new ArrayBufferTarget(),
    muxer = new Muxer({
      target,
      video: {
        codec: "avc",
        width: out.width,
        height: out.height,
        frameRate: fps,
      },
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    });
  let error = null,
    chunks = 0;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        muxer.addVideoChunk(chunk, meta);
        chunks++;
      } catch (e) {
        error = e;
      }
    },
    error: (e) => {
      error = e;
    },
  });
  const layer = document.createElement("canvas");
  encoder.configure(config);
  try {
    for (let i = 0; i < frames; i++) {
      if (cancelled) throw Error("Export cancelled.");
      if (error) throw error;
      await prepareFrame(i / fps);
      renderFrame(out, project, i / fps, renderAssets(), layer);
      const timestamp = Math.round((i * 1e6) / fps),
        frame = new VideoFrame(out, {
          timestamp,
          duration: Math.round(((i + 1) * 1e6) / fps) - timestamp,
        });
      try {
        encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      } finally {
        frame.close();
      }
      if (encoder.encodeQueueSize > 8) await encoder.flush();
      if (i % 3 === 0) {
        $("exportProgress").value = (i + 1) / frames;
        $("exportStatus").textContent =
          `Rendering frame ${i + 1} of ${frames} · ${Math.round(((i + 1) / frames) * 100)}%`;
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await encoder.flush();
    if (cancelled) throw Error("Export cancelled.");
    if (error) throw error;
    if (!chunks) throw Error("The encoder produced no video frames.");
    muxer.finalize();
    return new Blob([target.buffer], { type: "video/mp4" });
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }
}
async function loadGifenc() {
  try {
    return await import("./vendor/gifenc.mjs");
  } catch (e) {
    throw Error(
      "GIF export needs vendor/gifenc.mjs next to this page (or open in Chrome online).",
    );
  }
}
async function exportGif(out) {
  const fps = Math.min(30, Number($("fps").value) || 15);
  const frames = Math.ceil(duration(project) * fps);
  const mod = await loadGifenc();
  const GIFEncoder = mod.GIFEncoder || mod.default;
  const { quantize, applyPalette } = mod;
  if (!GIFEncoder || !quantize || !applyPalette)
    throw Error("gifenc exports missing.");
  const gif = GIFEncoder();
  const w = out.width;
  const h = out.height;
  const delay = Math.max(20, Math.round(1000 / fps));
  const layer = document.createElement("canvas");
  const ctx = out.getContext("2d", { willReadFrequently: true });
  for (let i = 0; i < frames; i++) {
    if (cancelled) throw Error("Export cancelled.");
    const t = i / fps;
    await prepareFrame(t);
    renderFrame(out, project, t, renderAssets(), layer);
    const { data } = ctx.getImageData(0, 0, w, h);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, w, h, {
      palette,
      delay,
      ...(i === 0 ? { first: true } : null),
    });
    if (i % 2 === 0) {
      $("exportProgress").value = (i + 1) / frames;
      $("exportStatus").textContent =
        `Encoding GIF · ${i + 1} of ${frames} · ${Math.round(((i + 1) / frames) * 100)}%`;
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  gif.finish();
  const bytes = gif.bytes();
  if (!bytes?.byteLength) throw Error("GIF output empty.");
  return new Blob([bytes], { type: "image/gif" });
}
async function runExport() {
  if (busy) return;
  if (project.scenes.some((s) => sceneMediaIds(s).some((id) => id && !assets.has(id)))) {
    $("exportStatus").textContent =
      "Some scene media is missing. Restore it by opening a saved project file, or remove it from the scene.";
    return;
  }
  stop();
  cancelled = false;
  setBusy(true);
  $("exportProgress").hidden = false;
  $("exportProgress").value = 0;
  $("startExport").disabled = true;
  $("cancelExport").hidden = false;
  $("closeExport").disabled = true;
  for (const id of ["exportFormat", "resolution", "fps"]) $(id).disabled = true;
  try {
    await document.fonts.ready;
    await Promise.all(
      project.scenes.map((s) =>
        document.fonts.load(`${s.weight} 48px "${"Focal Upright"}"`),
      ),
    );
    const out = document.createElement("canvas");
    let [ow, oh] = outputSize(
      project.format,
      Number($("resolution").value),
    );
    const type = $("exportFormat").value;
    // Keep GIFs lighter — cap longest edge at 1080.
    if (type === "gif") {
      const cap = 1080;
      const scale = Math.min(1, cap / Math.max(ow, oh));
      ow = Math.max(2, Math.round(ow * scale / 2) * 2);
      oh = Math.max(2, Math.round(oh * scale / 2) * 2);
    }
    out.width = ow;
    out.height = oh;
    let blob;
    $("exportStatus").textContent = "Preparing frames…";
    if (type === "mp4") blob = await exportMovie(out);
    else if (type === "gif") blob = await exportGif(out);
    else if (type === "svg")
      blob = new Blob([await slideSvg(out.width, out.height)], {
        type: "image/svg+xml",
      });
    else {
      await prepareFrame(time);
      syncGifAssets(time);
      renderFrame(
        out,
        project,
        time,
        renderAssets(),
        document.createElement("canvas"),
      );
      blob = await new Promise((resolve) =>
        out.toBlob(resolve, type === "jpeg" ? "image/jpeg" : "image/png", 0.95),
      );
    }
    if (cancelled) throw Error("Export cancelled.");
    download(
      blob,
      fileName() +
        (type === "mp4" || type === "gif" ? "" : "-" + time.toFixed(2) + "s") +
        "." +
        (type === "jpeg" ? "jpg" : type),
    );
    $("exportProgress").value = 1;
    $("exportStatus").textContent =
      `Exported · ${(blob.size / 1048576).toFixed(1)} MB`;
    status("Export complete. Your file is ready.");
  } catch (e) {
    $("exportStatus").textContent = e.message || "Export failed.";
  } finally {
    setBusy(false);
    $("startExport").disabled = false;
    $("cancelExport").hidden = true;
    $("closeExport").disabled = false;
    for (const id of ["exportFormat", "resolution", "fps"])
      $(id).disabled = false;
    syncPreviewMedia();
    draw();
  }
}

function filterLayouts() {
  const group = $("layoutGroup").value;
  document
    .querySelectorAll(".template")
    .forEach(
      (el) => (el.hidden = group !== "all" && el.dataset.group !== group),
    );
}
$("layoutGroup").onchange = filterLayouts;
// UI bindings
$("dustPresetPanel").ontoggle = () => {
  if (ready && $("dustPresetPanel").open) {
    if (!dustPresets.length) refreshDustPresets();
    else renderDustPresetPreview();
  }
};
$("refreshDustPresets").onclick = refreshDustPresets;
$("dustPresetSelect").onchange = renderDustPresetPreview;
$("dustPresetText").onchange = renderDustPresetPreview;
$("applyDustPreset").onclick = () => {
  const preset = dustPresets[Number($("dustPresetSelect").value)];
  if (!preset) return;
  try {
    const scene = applyDustPreset(
      current(),
      preset,
      $("dustPresetText").checked,
    );
    checkpoint();
    stop();
    project.scenes[selected] = scene;
    changed({ controls: true });
    status(
      `Applied “${preset.name}” as editable Video diffusion. Your layout and scene timing are kept.`,
    );
  } catch (e) {
    status(e.message);
  }
};
$("importDustPreset").onclick = () => $("dustPresetInput").click();
$("dustPresetInput").onchange = async () => {
  const file = $("dustPresetInput").files[0];
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024)
      throw Error("Choose a preset JSON file under 10 MB.");
    const imported = readDustPresets(JSON.parse(await file.text()));
    showDustPresets(imported);
    $("dustPresetPanel").open = true;
    status(
      `Loaded ${imported.length} presets from ${file.name}. Choose one, then apply it to this scene.`,
    );
  } catch (e) {
    status(e.message || "Could not read this preset file.");
  } finally {
    $("dustPresetInput").value = "";
  }
};
window.addEventListener("storage", (event) => {
  if (event.key === DUST_PRESET_KEY && $("dustPresetPanel").open)
    refreshDustPresets();
});
$("timelineZoom").onchange = () => {
  renderTimeline();
  revealPlayhead();
};
new ResizeObserver(() => renderTimeline()).observe($("timelineViewport"));
for (const el of document.querySelectorAll("[data-tier]"))
  el.onclick = () => {
    checkpoint();
    const tier = Number(el.dataset.tier),
      s = current();
    s.megaTiers = s.megaTiers.includes(tier)
      ? s.megaTiers.filter((t) => t !== tier)
      : [...s.megaTiers, tier].sort((a, b) => a - b);
    changed({ controls: true });
  };
for (const [layout, label] of LAYOUTS) {
  const b = document.createElement("button");
  b.className = "template";
  b.dataset.layout = layout;
  b.dataset.group =
    EXTRA_LAYOUTS.find((l) => l[0] === layout)?.[2] ||
    (["split", "frame", "editorial"].includes(layout) ? "media" : "type");
  b.setAttribute("aria-label", label + " layout");
  const c = document.createElement("canvas"),
    span = document.createElement("span");
  span.textContent = label;
  b.append(c, span);
  b.onclick = () => {
    checkpoint();
    setSceneLayout(current(), layout);
    changed({ controls: true });
  };
  $("templates").append(b);
}
for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.onclick = () => {
    document.querySelectorAll("[data-tab]").forEach((b) => {
      const active = b === tab;
      b.setAttribute("aria-selected", active);
      $("panel-" + b.dataset.tab).hidden = !active;
    });
  };
  tab.onkeydown = (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const all = [...document.querySelectorAll("[data-tab]")],
      next = all[(all.indexOf(tab) + (e.key === "ArrowRight" ? 1 : 2)) % 3];
    next.click();
    next.focus();
  };
}
for (const el of document.querySelectorAll("[data-prop]")) {
  if (el.type === "range")
    el.setAttribute(
      "aria-label",
      el.closest("label").firstChild.textContent.trim(),
    );
  el.addEventListener("focus", () => {
    if (!busy) checkpoint();
  });
  el.addEventListener("pointerdown", () => {
    if (!busy) checkpoint();
  });
  el.addEventListener("input", () => {
    if (busy) return;
    stop();
    const k = controlKey(el.dataset.prop);
    if (k === "font")
      document.fonts.load(`${current().weight} 48px "${el.value}"`).then(() => {
        draw();
        scheduleThumbnails();
      });
    let v = el.type === "checkbox" ? el.checked : el.value;
    if (typeof DEFAULTS[k] === "number") {
      if (el.value === "" || !Number.isFinite(Number(v))) return;
      v = Number(v);
      if (el.hasAttribute("min")) v = Math.max(Number(el.min), v);
      if (el.hasAttribute("max")) v = Math.min(Number(el.max), v);
    }
    current()[k] = v;
    if (k === "pattern") current().patternExplicit = true;
    if (["dataRows", "chartMax"].includes(k)) syncDataControls();
    if (["bg", "fg", "accent"].includes(k)) {
      current().paletteId = "custom";
      if (k === "accent") current().colors = [v];
    }
    const output = document.querySelector(`[data-output="${el.dataset.prop}"]`);
    if (output)
      output.value = k === "entrance" ? (v / 100).toFixed(2) + "s" : v;
    if (k === "duration")
      time =
        sceneStart(project, selected) +
        Math.min(time - sceneStart(project, selected), v - 0.001);
    changed();
  });
  el.addEventListener("change", () => {
    syncControls();
    scheduleSave();
  });
}
$("projectName").onfocus = () => checkpoint();
$("projectName").oninput = () => {
  project.name = $("projectName").value;
  scheduleSave();
};
$("format").onchange = () => {
  checkpoint();
  project.format = $("format").value;
  resizeCanvas();
  changed();
};
$("paletteGroup").onchange = buildPalettes;
$("paletteSize").onchange = buildPalettes;
$("shufflePalette").onclick = () => {
  const list = suggestedPalettes();
  if (list.length) applyPalette(list[Math.floor(Math.random() * list.length)]);
};
$("applyColors").onclick = () => {
  checkpoint();
  const { bg, fg, accent, colors, paletteId, promptBg, promptFg } = current();
  project.scenes.forEach((s) =>
    Object.assign(s, {
      bg,
      fg,
      accent,
      colors: [...colors],
      paletteId,
      promptBg,
      promptFg,
    }),
  );
  changed();
  status("Color story applied to every scene.");
};
$("reseed").onclick = () => {
  checkpoint();
  current().seed = Math.ceil(Math.random() * 999999);
  changed({ controls: true });
};
$("play").onclick = togglePlay;
$("presentPlay").onclick = togglePlay;
$("presentMode").onclick = () => {
  if (presenting) exitPresentMode();
  else enterPresentMode();
};
$("exitPresent").onclick = () => exitPresentMode();
$("restart").onclick = () => {
  stop();
  time = 0;
  selected = 0;
  syncControls();
  highlightCards();
  draw();
  if (presenting) updatePresentHud();
};
$("scrub").oninput = () => {
  seekTimeline(Number($("scrub").value));
};
$("addScene").onclick = () => addScene();
$("duplicate").onclick = () => addScene(true);
$("deleteScene").onclick = () => {
  if (project.scenes.length === 1) return;
  checkpoint();
  stop();
  project.scenes.splice(selected, 1);
  selected = Math.min(selected, project.scenes.length - 1);
  time =
    sceneStart(project, selected) + Math.min(0.9, current().duration * 0.5);
  changed({ controls: true });
  renderThumbnails();
};
$("moveLeft").onclick = () => moveScene(selected, selected - 1);
$("moveRight").onclick = () => moveScene(selected, selected + 1);
$("undo").onclick = () => history("undo");
$("redo").onclick = () => history("redo");
$("uploadMedia").onclick = () => $("mediaInput").click();
$("mediaInput").onchange = async () => {
  await importMedia([...$("mediaInput").files]);
  $("mediaInput").value = "";
};
for (const id of ["uploadMedia", "stageWrap"]) {
  const el = $(id);
  el.ondragover = (e) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      el.classList.add("drag-over");
    }
  };
  el.ondragleave = () => el.classList.remove("drag-over");
  el.ondrop = (e) => {
    e.preventDefault();
    el.classList.remove("drag-over");
    importMedia([...e.dataTransfer.files]);
  };
}
$("sequenceMedia").onclick = () => {
  if (!assets.size) return;
  openMediaPlaceDialog([...assets.values()]);
};
$("closeMediaPlace").onclick = () => closeMediaPlaceDialog();
$("mediaPlaceDialog").addEventListener("cancel", () => {
  pendingPlaceAssets = [];
});
$("mediaPlaceOptions").onclick = (e) => {
  const btn = e.target.closest("[data-place]");
  if (!btn) return;
  applyMediaPlacement(btn.dataset.place);
};
$("mediaSlot").onchange = () => {mediaSlot=$("mediaSlot").value;clearMediaSelection();syncControls();};
function removeSceneMedia() {
  if (busy || !current()[selectedMediaKey()]) return;
  stop();
  checkpoint();
  current()[selectedMediaKey()] = null;
  clearMediaSelection();
  changed({ controls: true });
  status("Media removed from this scene. Undo to restore it; the original stays in Your material.");
}
$("removeMedia").onclick = removeSceneMedia;
$("removePreviewMedia").onclick = removeSceneMedia;
$("aspectRatioMedia").onclick = () => {
  if (busy) return;
  const s = current();
  const ids = sceneMediaIds(s).filter((id) => assets.has(id)).slice(0, MEDIA_GRID_MAX);
  if (!ids.length) {
    status("Add media to this scene first.");
    return;
  }
  stop();
  checkpoint();
  disableDustForMedia(s);
  setSceneLayout(s, "media-grid");
  s.mediaIds = ids;
  s.mediaId = ids[0];
  s.mediaIdB = ids[1] || null;
  s.mediaFit = "adapt";
  s.mediaFitB = "adapt";
  s.mediaZoom = 100;
  s.mediaZoomB = 100;
  s.mediaX = 50;
  s.mediaY = 50;
  s.mediaXB = 50;
  s.mediaYB = 50;
  s.mediaDim = 0;
  s.mediaDimB = 0;
  s.title = "";
  s.eyebrow = "";
  s.body = "";
  clearMediaSelection();
  changed({ controls: true });
  renderThumbnails();
  status(
    ids.length === 1
      ? "Aspect ratio locked for this media."
      : `Aspect grid · ${ids.length} images keep their ratios.`,
  );
};

function clearMediaSelection() {
  const pointer = mediaDrag?.pointerId;
  mediaDrag = null;
  mediaSelection = null;
  if (pointer !== undefined && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
  $("mediaSelection").hidden = true;
  $("mediaDragHint").hidden = true;
  canvas.style.cursor = "";
}
function updateMediaSelection() {
  if (!mediaSelection) return;
  if (busy || playing || mediaSelection.sceneId !== current().id ||
      mediaSelection.assetId !== current()[selectedMediaKey()] || !mediaRegions.length) {
    clearMediaSelection();
    return;
  }
  const rect = mediaRegions[mediaSelection.region] || mediaRegions[0];
  const bounds = canvas.getBoundingClientRect(), stage = $("stageWrap").getBoundingClientRect();
  const outline = $("mediaSelection");
  Object.assign(outline.style, {
    left: `${bounds.left - stage.left + rect.x * bounds.width / canvas.width + (mediaDrag?.dx || 0)}px`,
    top: `${bounds.top - stage.top + rect.y * bounds.height / canvas.height + (mediaDrag?.dy || 0)}px`,
    width: `${rect.width * bounds.width / canvas.width}px`,
    height: `${rect.height * bounds.height / canvas.height}px`,
  });
  outline.hidden = false;
  $("mediaDragHint").hidden = false;
  $("mediaDragHint").textContent = mediaDrag?.outside
    ? "Release to remove media"
    : "Delete to remove · drag outside to remove";
}
function hitMedia(e) {
  // A transition may still show another scene's media. Select after it settles.
  if (transitionAt(project, time).blend < 1) return -1;
  const b = canvas.getBoundingClientRect();
  const x = (e.clientX - b.left) * canvas.width / b.width;
  const y = (e.clientY - b.top) * canvas.height / b.height;
  return mediaRegions.findIndex(r => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
}
canvas.addEventListener("pointerdown", (e) => {
  if (busy || e.button !== 0) return;
  const region = hitMedia(e);
  if (region < 0) { clearMediaSelection(); return; }
  mediaSlot = mediaRegions[region].slot || "primary";
  syncControls();
  e.preventDefault();
  stop();
  canvas.focus({preventScroll: true});
  mediaSelection = {sceneId: current().id, assetId: current()[selectedMediaKey()], region};
  mediaDrag = {pointerId: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, outside: false};
  canvas.setPointerCapture(e.pointerId);
  updateMediaSelection();
});
canvas.addEventListener("pointermove", (e) => {
  if (mediaDrag?.pointerId === e.pointerId) {
    mediaDrag.dx = e.clientX - mediaDrag.x;
    mediaDrag.dy = e.clientY - mediaDrag.y;
    const b = canvas.getBoundingClientRect();
    mediaDrag.outside = e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom;
    canvas.style.cursor = "grabbing";
    updateMediaSelection();
  } else canvas.style.cursor = !busy && hitMedia(e) >= 0 ? "grab" : "";
});
canvas.addEventListener("pointerup", (e) => {
  if (mediaDrag?.pointerId !== e.pointerId) return;
  const remove = mediaDrag.outside && Math.hypot(mediaDrag.dx, mediaDrag.dy) > 8 &&
    mediaSelection?.sceneId === current().id && mediaSelection?.assetId === current()[selectedMediaKey()];
  mediaDrag = null;
  canvas.releasePointerCapture(e.pointerId);
  if (remove) removeSceneMedia();
  else updateMediaSelection();
});
canvas.addEventListener("pointercancel", clearMediaSelection);
canvas.addEventListener("lostpointercapture", () => { if (mediaDrag) clearMediaSelection(); });
window.addEventListener("blur", clearMediaSelection);
canvas.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !busy && mediaRegions.length) {
    e.preventDefault();
    stop();
    mediaSlot=mediaRegions[0].slot || "primary";
    syncControls();
    mediaSelection = {sceneId:current().id, assetId:current()[selectedMediaKey()], region:0};
    updateMediaSelection();
  }
});
$("uploadFont").onclick = () => $("fontInput").click();
$("fontInput").onchange = async () => {
  const f = $("fontInput").files[0];
  if (!f || busy) return;
  stop();
  setBusy(true);
  try {
    const a = await loadFont(f, f.name);
    fontAssets.set(a.id, a);
    await persistAsset(a);
    checkpoint();
    current().font = a.family;
    buildFonts();
    changed({ controls: true });
    status("Custom font ready.");
  } catch {
    status("This font could not be loaded. Try a TTF, OTF, or WOFF file.");
  }
  setBusy(false);
  $("fontInput").value = "";
};
$("saveProject").onclick = saveProject;
$("openProject").onclick = () => $("projectInput").click();
$("projectInput").onchange = async () => {
  await openProject($("projectInput").files[0]);
  $("projectInput").value = "";
};

let embeddedFocal;
async function slideSvg(w, h) {
  const scene = structuredClone(current());
  const local = Math.max(0, time - sceneStart(project, selected));
  await document.fonts.load(`${scene.weight} 48px "Focal Upright"`);
  await seekVideo(scene, local);
  if(isComparison(scene.layout)) await seekVideo(secondaryMediaScene(scene),local);
  if (embeddedFocal === undefined) {
    try {
      const response = await fetch("Focal-Upright-VF_wght.ttf");
      if (!response.ok) throw Error("Font unavailable");
      embeddedFocal = await toDataUrl(await response.blob());
    } catch {
      embeddedFocal = "";
    }
  }
  const measurement = document.createElement("canvas");
  const recorder = createSvgContext(w, h, measurement.getContext("2d"));
  const asset = resolveSceneAsset(renderAssets(), scene);
  renderScene(
    recorder.context,
    { ...scene, animation: "none", promptReveal: false },
    local,
    w,
    h,
    asset,
    selected,
  );
  return recorder.serialize(
    scene.title || `Slide ${selected + 1}`,
    embeddedFocal,
  );
}
let lastSvg = "";
$("copySvg").onclick = async () => {
  if (busy) return;
  stop();
  setBusy(true);
  try {
    const [w, h] = outputSize(project.format, 1080);
    lastSvg = await slideSvg(w, h);
    try {
      await navigator.clipboard.writeText(lastSvg);
      status(
        `Slide ${selected + 1} copied as SVG. Paste into an SVG-compatible editor.`,
      );
    } catch {
      $("svgMarkup").value = lastSvg;
      $("svgDialog").showModal();
      $("svgMarkup").select();
      status(
        "Clipboard access is unavailable. Copy the selected SVG markup or download it.",
      );
    }
  } catch (error) {
    status("SVG export failed: " + error.message);
  } finally {
    setBusy(false);
    draw();
  }
};
$("closeSvg").onclick = () => $("svgDialog").close();
$("downloadSvg").onclick = () =>
  download(
    new Blob([lastSvg], { type: "image/svg+xml" }),
    `${fileName()}-slide-${selected + 1}.svg`,
  );

const chartTypes = EXTRA_LAYOUTS.filter(([, , group]) => group === "data");
for (const [id, label] of chartTypes) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = label;
  $("chartLayout").append(option);
}
let referenceUrl = "",
  recognitionId = 0,
  readingChart = false,
  chartBase;
const chartLimits = {
  "big-stat": 1,
  "stat-grid": 6,
  bars: 8,
  columns: 6,
  waffle: 1,
  progress: 4,
  comparison: 2,
  steps: 6,
  ...SWISS_DATA_LIMITS,
};
function chartDraft() {
  const palette = CHART_PALETTES[$("chartPalette").value];
  const rows = parseDataRows($("chartRows").value).rows;
  return createScene({
    ...chartBase,
    id: crypto.randomUUID(),
    layout: $("chartLayout").value,
    title: $("chartHeadline").value,
    body: $("chartSource").value,
    eyebrow: "",
    dataRows: $("chartRows").value,
    valuePrefix: $("chartPrefix").value,
    valueSuffix: $("chartSuffix").value,
    dataDecimals: Math.min(
      2,
      Math.max(
        0,
        ...rows.map((r) => (String(r.value).split(".")[1] || "").length),
      ),
    ),
    chartMax: 0,
    ...(palette
      ? {
          ...palette,
          colors: [palette.accent],
          promptBg: palette.accent,
          promptFg: palette.bg,
          paletteId: "custom",
        }
      : {}),
    font: "Focal Upright",
    fontSize: 110,
    weight: 500,
    tracking: 0,
    pattern: "none",
    patternExplicit: false,
    clearGraphics: true,
    clearPattern: true,
    mediaId: null,
    transition: "cut",
  });
}
function reviewChart() {
  const { rows, errors } = parseDataRows($("chartRows").value);
  const limit = chartLimits[$("chartLayout").value];
  const invalid = errors.length || !rows.length || rows.length > limit;
  $("applyChart").disabled = Boolean(invalid || readingChart);
  $("chartReviewStatus").textContent = errors.length
    ? `Check rows ${errors.join(", ")}. Use Label | number.`
    : !rows.length
      ? "Enter the visible values to create a chart."
      : rows.length > limit
        ? `This layout holds ${limit} items. Choose another layout or split the data.`
        : `${rows.length} editable items · Focal · 0 tracking`;
  const preview = $("chartPreview"),
    [w, h] = FORMATS[project.format];
  preview.width = w;
  preview.height = h;
  renderScene(
    preview.getContext("2d"),
    { ...chartDraft(), animation: "none", promptReveal: false },
    2,
    w,
    h,
    null,
  );
}
$("importChart").onclick = () => {
  if (busy) return;
  stop();
  chartBase = structuredClone(current());
  $("chartDialog").showModal();
  reviewChart();
};
$("chartLayout").value = "bars";
for (const id of [
  "chartHeadline",
  "chartRows",
  "chartSource",
  "chartPrefix",
  "chartSuffix",
  "chartLayout",
  "chartPalette",
])
  $(id).addEventListener("input", reviewChart);
async function readChartImage(file) {
  if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
    $("chartReadStatus").textContent = "Choose a PNG, JPEG or WebP screenshot.";
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    $("chartReadStatus").textContent = "Choose an image smaller than 20 MB.";
    return;
  }
  const request = ++recognitionId;
  if (referenceUrl) URL.revokeObjectURL(referenceUrl);
  referenceUrl = URL.createObjectURL(file);
  $("chartReference").src = referenceUrl;
  $("chartReference").hidden = false;
  $("chartDropHint").hidden = true;
  $("chartRows").value = "";
  $("chartRaw").textContent = "";
  $("chartHeadline").value = "";
  $("chartPrefix").value = "";
  $("chartSuffix").value = "";
  $("chartSource").value = "";
  readingChart = true;
  reviewChart();
  $("chartReadStatus").textContent = "Reading labels and values on your Mac…";
  try {
    const endpoint =
      location.protocol === "file:"
        ? "http://127.0.0.1:5173/api/chart-ocr"
        : "/api/chart-ocr";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
      signal: AbortSignal.timeout(75000),
    });
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw Error(
        "Start or restart the local server: python3 scripts/serve.py. You can also enter the data below.",
      );
    const result = await response.json();
    if (!response.ok)
      throw Error(result.error || "Could not read the screenshot.");
    if (request !== recognitionId) return;
    const suggestion = suggestChart(result.lines || []);
    $("chartRaw").textContent = (result.lines || [])
      .map((l) => l.text)
      .join("\n");
    $("chartRows").value = suggestion.rows
      .map((r) => `${r.label.replaceAll("|", "/")} | ${r.value}`)
      .join("\n");
    $("chartHeadline").value = suggestion.title;
    $("chartLayout").value = suggestion.layout;
    $("chartPrefix").value = suggestion.prefix;
    $("chartSuffix").value = suggestion.suffix;
    $("chartReadStatus").textContent = suggestion.message;
  } catch (error) {
    if (request === recognitionId)
      $("chartReadStatus").textContent =
        error instanceof TypeError
          ? "Start the local server with python3 scripts/serve.py to recognize screenshots. You can also enter the data below."
          : error.message;
  } finally {
    if (request === recognitionId) {
      readingChart = false;
      reviewChart();
    }
  }
}
$("chartImage").onchange = () => readChartImage($("chartImage").files[0]);
$("chartDrop").ondragover = (e) => e.preventDefault();
$("chartDrop").ondrop = (e) => {
  e.preventDefault();
  readChartImage(e.dataTransfer.files[0]);
};
$("chartDialog").addEventListener("paste", (e) => {
  const file = [...e.clipboardData.items]
    .find((item) => item.type.startsWith("image/"))
    ?.getAsFile();
  if (file) {
    e.preventDefault();
    readChartImage(file);
  }
});
$("closeChart").onclick = () => $("chartDialog").close();
$("chartDialog").addEventListener("close", () => {
  ++recognitionId;
  readingChart = false;
});
$("applyChart").onclick = () => {
  reviewChart();
  if ($("applyChart").disabled) return;
  if (project.scenes.length >= 100) {
    $("chartReviewStatus").textContent = "This project already has 100 scenes.";
    return;
  }
  checkpoint();
  stop();
  project.scenes.splice(selected + 1, 0, chartDraft());
  selected++;
  time =
    sceneStart(project, selected) + Math.min(0.9, current().duration - 0.001);
  $("chartDialog").close();
  changed({ controls: true });
  status(
    "Added an editable chart slide. Keep refining its data, layout and palette.",
  );
};

$("export").onclick = () => {
  stop();
  exportInfo();
  $("exportStatus").textContent = "";
  $("exportProgress").hidden = true;
  $("exportDialog").showModal();
};
$("closeExport").onclick = () => $("exportDialog").close();
$("exportDialog").addEventListener("cancel", (e) => {
  if (busy) {
    e.preventDefault();
    cancelled = true;
  }
});
$("startExport").onclick = runExport;
$("cancelExport").onclick = () => {
  cancelled = true;
  $("exportStatus").textContent = "Cancelling…";
};
for (const id of ["exportFormat", "resolution", "fps"])
  $(id).onchange = exportInfo;
document.addEventListener("keydown", (e) => {
  if (busy) return;
  const typing =
    e.target.matches("input,textarea,select") || e.target.isContentEditable;
  if (
    $("exportDialog").open ||
    $("chartDialog").open ||
    $("svgDialog").open ||
    $("mediaPlaceDialog")?.open
  )
    return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    saveProject();
    return;
  }
  if (typing) return;

  if (presenting) {
    if (e.key === "Escape") {
      e.preventDefault();
      exitPresentMode();
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
      return;
    }
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      presentGoScene(1);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      presentGoScene(-1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      selected = 0;
      time = sceneStart(project, 0);
      syncControls();
      highlightCards();
      updatePresentHud();
      draw();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      selected = project.scenes.length - 1;
      time = sceneStart(project, selected);
      syncControls();
      highlightCards();
      updatePresentHud();
      draw();
      return;
    }
    return;
  }

  if (e.key === "Escape" && mediaSelection) {
    e.preventDefault();
    clearMediaSelection();
    return;
  }
  if (["Delete", "Backspace"].includes(e.key) && document.activeElement === canvas &&
      mediaSelection?.sceneId === current().id) {
    e.preventDefault();
    removeSceneMedia();
    return;
  }
  if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "p") {
    e.preventDefault();
    enterPresentMode();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    history(e.shiftKey ? "redo" : "undo");
  } else if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
    e.preventDefault();
    addScene(true);
  }
});
window.addEventListener("beforeunload", (e) => {
  if (busy) {
    e.preventDefault();
    e.returnValue = "";
  }
  if (ready && dirty) saveLocal();
});

async function init() {
  buildPalettes();
  syncAll();
  setBusy(true);
  try {
    db = await openDb();
    const saved = await transaction("project", "readonly", (s) =>
      s.get("current"),
    );
    if (saved) {
      project = normalizeProject(saved.project);
      let missing = 0;
      for (const id of saved.assetIds || []) {
        try {
          const a = await transaction("assets", "readonly", (s) => s.get(id));
          if (!a) throw Error("Missing asset");
          assets.set(id, await loadAsset(a.blob, a.name, a.id, a.kind));
        } catch {
          missing++;
        }
      }
      for (const id of saved.fontIds || []) {
        try {
          const a = await transaction("assets", "readonly", (s) => s.get(id));
          if (!a) throw Error("Missing font");
          fontAssets.set(id, await loadFont(a.blob, a.name, a.id));
        } catch {
          missing++;
        }
      }
      time = Math.min(0.9, current().duration * 0.5);
      status(
        missing
          ? `Restored the composition, but ${missing} assets are missing. Open a saved project file to restore them.`
          : "Restored your last project.",
      );
      $("saveStatus").textContent = missing
        ? "Missing assets · open a project backup"
        : "Saved on this device";
    } else {
      $("saveStatus").textContent = "Autosave ready";
    }
  } catch (e) {
    $("saveStatus").textContent = "Use Save project to keep a copy";
    status(
      e.message ||
        "Local autosave unavailable. You can still save a project file.",
    );
  }
  buildFonts();
  buildLibrary();
  await document.fonts.ready;
  await Promise.all(
    ["Focal Upright", ...project.scenes.map((s) => s.font)].map((f) =>
      document.fonts.load(`400 48px "${f.replace(/["\\]/g, "")}"`),
    ),
  );
  ready = true;
  setBusy(false);
  refreshDustPresets();
  syncAll();
  requestAnimationFrame(tick);
}
init().catch((e) => {
  setBusy(false);
  status("Could not start the editor: " + e.message);
});
