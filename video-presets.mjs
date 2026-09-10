import { normalizeProject } from "./video-core.mjs?v=21";
export const DUST_PRESET_KEY = "falGlitchDustPresets_v1";
const hex = (v) => typeof v === "string" && /^#[\da-f]{6}$/i.test(v);

export function readDustPresets(data) {
  if (!data || typeof data !== "object")
    throw Error("Choose a Glitch Dust preset JSON file.");
  const entries = Array.isArray(data.presets) ? data.presets : [data];
  const presets = entries.slice(0, 500).flatMap((entry, i) => {
    const settings = entry?.settings || entry;
    if (
      !settings?.sliders ||
      !settings?.selects ||
      typeof settings.sliders !== "object" ||
      typeof settings.selects !== "object"
    )
      return [];
    return [
      {
        id: String(entry.id || `import-${i}`).slice(0, 120),
        name: String(entry.name || "Imported preset").slice(0, 100),
        settings,
      },
    ];
  });
  if (!presets.length)
    throw Error("No Glitch Dust presets found in this file.");
  return presets;
}

// Adapt shared controls into Video's editable diffusion model. Unsupported source
// motion styles are disclosed by the picker; scene timing and layout stay local.
export function applyDustPreset(scene, preset, includeText = false) {
  const source = preset.settings,
    sliders = source.sliders,
    selects = source.selects;
  const next = { ...scene, pattern: "dust", patternExplicit: true, opacity: 100 };
  const map = {
    shapeMin: "shapeMin",
    shapeMax: "shapeMax",
    megaRarity: "megaRarity",
    clusterDensity: "density",
    pixAmt: "maxNodes",
    circlePct: "circlePct",
    sweepDepth: "sweepDepth",
    waveRipples: "waveRipples",
    diffusionSoft: "diffusionSoft",
    speed: "speed",
  };
  for (const [from, to] of Object.entries(map)) {
    if (sliders[from] != null && Number.isFinite(Number(sliders[from])))
      next[to] = Number(sliders[from]);
  }
  const reference = Math.min(
    Number(source.canvasW) || 1280,
    Number(source.canvasH) || 720,
  );
  if (Number.isFinite(Number(sliders.pixSize)))
    next.scale = Math.round(
      (Number(sliders.pixSize) * 720) / Math.max(100, reference),
    );
  if (sliders.squarePct != null && sliders.circlePct != null) {
    const circles = Math.max(0, Number(sliders.circlePct)),
      squares = Math.max(0, Number(sliders.squarePct));
    if (circles + squares > 0)
      next.circlePct = Math.round((circles * 100) / (circles + squares));
  }
  next.primitive =
    next.circlePct === 0
      ? "squares"
      : next.circlePct === 100
        ? "circles"
        : "mixed";
  if (Array.isArray(source.megaTiers)) next.megaTiers = source.megaTiers;
  if (selects.sweepAxis) next.sweepAxis = selects.sweepAxis;
  next.fadeDirection = ["left", "right", "top", "bottom"].includes(
    selects.fadeDir,
  )
    ? selects.fadeDir
    : "none";
  if (source.noiseSeed != null && Number.isFinite(Number(source.noiseSeed)))
    next.seed =
      Math.round(Math.abs(Number(source.noiseSeed)) * 1000) % 999999 || 1;
  const rawColors =
    source.tonalCount === "all" ? source.colorAll : source.activeTonalColors;
  const colors = Array.isArray(rawColors) ? rawColors.filter(hex) : [];
  if (colors?.length) {
    next.colors = colors.slice(0, 12);
    next.accent = colors[0];
  }
  const bg = selects.bgSel === "custom" ? selects.bgCustom : selects.bgSel;
  if (hex(bg)) next.bg = bg;
  next.paletteId =
    typeof source.activePresetId === "string"
      ? source.activePresetId
      : "custom";
  if (hex(source.text?.color)) next.fg = source.text.color;
  else
    next.fg =
      next.colors.find((c) => c.toLowerCase() !== next.bg.toLowerCase()) ||
      next.fg;
  if (typeof source.text?.clearPattern === "boolean")
    next.clearPattern = source.text.clearPattern;
  next.promptBg = hex(source.promptText?.boxColor)
    ? source.promptText.boxColor
    : next.fg;
  next.promptFg = hex(source.promptText?.textColor)
    ? source.promptText.textColor
    : next.bg;
  if (includeText) {
    const text = source.text || {},
      prompt = source.promptText || {};
    if (typeof text.content === "string")
      next.title = text.enabled === false ? "" : text.content;
    if (typeof prompt.content === "string")
      next.body = prompt.enabled === false ? "" : prompt.content;
    for (const [from, to] of [
      ["fontSize", "fontSize"],
      ["fontWeight", "weight"],
      ["lineHeight", "lineHeight"],
      ["align", "align"],
    ])
      if (text[from] != null) next[to] = text[from];
    if (prompt.fontSize != null) next.promptSize = prompt.fontSize;
    if (prompt.boxRadius != null) next.promptRadius = prompt.boxRadius;
    if (typeof prompt.typewriter === "boolean")
      next.promptReveal = prompt.typewriter;
  }
  return normalizeProject({ version: 1, format: "wide", scenes: [next] })
    .scenes[0];
}
