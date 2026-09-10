import { pixelAlignedRect } from "./video-pixel-grid.mjs?v=22";
import {
  EXTRA_LAYOUTS,
  DEFAULT_DATA,
  renderExtraLayout,
} from "./video-layouts.mjs?v=22";
import { diffusionNodes } from "./video-diffusion.mjs?v=22";
import {
  measureTextZones,
  nodeOverlapsText,
} from "./video-text-clear.mjs?v=22";
import {
  MOTION_SECONDS,
  easeOutQuad as ease,
  easeInOutQuad,
} from "./video-motion.mjs?v=22";
// Shared deterministic scene model and renderer. Preview and exports use the same timebase.
export const FORMATS = {
  wide: [1280, 720],
  portrait: [720, 1280],
  square: [720, 720],
  social: [720, 900],
};
export const LAYOUTS = [
  ["hero", "Statement"],
  ["split", "Split screen"],
  ["poster", "Type poster"],
  ["frame", "Media frame"],
  ["editorial", "Editorial"],
  ["prompt", "Prompt text"],
  ...EXTRA_LAYOUTS.map(([id, label]) => [id, label]),
];
export const DEFAULTS = {
  layout: "hero",
  dataRows: DEFAULT_DATA,
  valuePrefix: "",
  valueSuffix: "",
  dataDecimals: 0,
  chartMax: 0,
  title: "Make\nsomething\nmove.",
  eyebrow: "",
  body: "From a spark of an idea\nto something that moves.",
  duration: 5,
  transition: "cut",
  paletteId: "2-i",
  bg: "#004012",
  fg: "#ADFF00",
  accent: "#ADFF00",
  colors: ["#ADFF00"],
  pattern: "dust",
  patternExplicit: false,
  clearPattern: true,
  clearGraphics: true,
  density: 58,
  scale: 32,
  maxNodes: 800,
  shapeMin: 0,
  shapeMax: 100,
  megaRarity: 12,
  megaTiers: [2, 3, 4],
  primitive: "mixed",
  circlePct: 12,
  sweepAxis: "v",
  sweepDepth: 35,
  diffusionSoft: 15,
  waveRipples: 15,
  fadeDirection: "right",
  promptSize: 32,
  promptBg: "#ADFF00",
  promptFg: "#004012",
  promptPadding: 4,
  promptGap: 4,
  promptRadius: 0,
  promptReveal: true,
  speed: 65,
  opacity: 100,
  seed: 2408,
  font: "Focal Upright",
  weight: 500,
  fontSize: 124,
  lineHeight: 89,
  tracking: -3,
  align: "left",
  treatment: "solid",
  uppercase: false,
  animation: "rise",
  entrance: MOTION_SECONDS * 100,
  textX: 0,
  textY: 0,
  footer: false,
  mediaId: null,
  mediaFit: "cover",
  mediaZoom: 100,
  mediaX: 50,
  mediaY: 50,
  mediaDim: 15,
  mediaStart: 0,
  mediaLoop: true,
  mediaFlow: true,
};
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const defaultPattern = (layout) =>
  ["hero", "poster"].includes(layout) ? "dust" : "none";
export function setSceneLayout(scene, layout) {
  scene.layout = layout;
  if (!scene.patternExplicit) scene.pattern = defaultPattern(layout);
}
export function createScene(overrides = {}) {
  return {
    ...structuredClone(DEFAULTS),
    id: crypto.randomUUID(),
    ...overrides,
    pattern:
      overrides.pattern ?? defaultPattern(overrides.layout ?? DEFAULTS.layout),
    patternExplicit:
      overrides.patternExplicit ?? Object.hasOwn(overrides, "pattern"),
  };
}
export function starterProject() {
  return {
    version: 1,
    name: "A study in motion",
    format: "wide",
    scenes: [
      createScene(),
      createScene({
        layout: "split",
        title: "A different\npoint of view.",
        eyebrow: "",
        body: "Your images. Your footage.\nA whole new way to put it together.",
        bg: "#C5E9FF",
        fg: "#115EF3",
        accent: "#115EF3",
        colors: ["#115EF3"],
        promptBg: "#115EF3",
        promptFg: "#C5E9FF",
        paletteId: "2-m",
        seed: 1306,
        fontSize: 102,
        transition: "wipe",
      }),
      createScene({
        layout: "poster",
        title: "Less static.\nMore magic.",
        eyebrow: "",
        body: "Make your next idea a moving one.",
        bg: "#5718C0",
        fg: "#D5BBFF",
        accent: "#D5BBFF",
        colors: ["#D5BBFF"],
        promptBg: "#D5BBFF",
        promptFg: "#5718C0",
        paletteId: "2-aa",
        seed: 901,
        fontSize: 132,
        align: "center",
        transition: "fade",
      }),
    ],
  };
}
const ranges = {
  duration: [0.5, 60],
  chartMax: [0, 1e12],
  dataDecimals: [0, 2],
  density: [10, 100],
  scale: [12, 80],
  maxNodes: [1, 2000],
  shapeMin: [0, 100],
  shapeMax: [0, 100],
  megaRarity: [0, 100],
  circlePct: [0, 100],
  sweepDepth: [0, 100],
  diffusionSoft: [0, 100],
  waveRipples: [0, 100],
  promptSize: [16, 80],
  promptPadding: [0, 16],
  promptGap: [0, 24],
  promptRadius: [0, 20],
  speed: [0, 200],
  opacity: [0, 100],
  seed: [1, 999999],
  weight: [100, 900],
  fontSize: [36, 200],
  lineHeight: [80, 160],
  tracking: [-6, 16],
  entrance: [10, 180],
  textX: [-30, 30],
  textY: [-30, 30],
  mediaZoom: [100, 200],
  mediaX: [0, 100],
  mediaY: [0, 100],
  mediaDim: [0, 90],
  mediaStart: [0, 86400],
};
const enums = {
  layout: LAYOUTS.map((x) => x[0]),
  transition: ["cut", "fade", "wipe", "slide"],
  pattern: ["dust", "none"],
  primitive: ["mixed", "squares", "circles"],
  sweepAxis: ["h", "v", "d"],
  fadeDirection: ["none", "left", "right", "top", "bottom"],
  align: ["left", "center", "right"],
  treatment: ["solid", "highlight", "background"],
  animation: ["rise", "reveal", "typewriter", "scale", "fade", "none"],
  mediaFit: ["cover", "contain", "adapt"],
};
const hex = (x) => typeof x === "string" && /^#[\da-f]{6}$/i.test(x);
export function normalizeProject(input) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.scenes) ||
    input.scenes.length < 1 ||
    input.scenes.length > 100
  )
    throw Error("Choose a Video Studio project with 1–100 scenes.");
  const ids = new Set();
  return {
    version: 1,
    name: String(input.name || "Untitled film").slice(0, 80),
    format: FORMATS[input.format] ? input.format : "wide",
    scenes: input.scenes.map((raw) => {
      const s = createScene();
      if (!raw || typeof raw !== "object")
        throw Error("This project contains an invalid scene.");
      for (const [k, [lo, hi]] of Object.entries(ranges))
        if (Number.isFinite(Number(raw[k])))
          s[k] = clamp(Number(raw[k]), lo, hi);
      // Bring the former default along with the updated motion direction.
      // Other saved entrance lengths remain editable and keep their timing.
      if (s.entrance === 85) s.entrance = DEFAULTS.entrance;
      for (const [k, values] of Object.entries(enums))
        if (values.includes(raw[k])) s[k] = raw[k];
      for (const k of ["title", "body", "eyebrow", "font", "paletteId"])
        if (typeof raw[k] === "string")
          s[k] = raw[k].slice(
            0,
            k === "body" ? 700 : k === "title" ? 500 : 100,
          );
      if (typeof raw.dataRows === "string")
        s.dataRows = raw.dataRows.slice(0, 2000);
      for (const key of ["valuePrefix", "valueSuffix"])
        if (typeof raw[key] === "string") s[key] = raw[key].slice(0, 12);
      s.dataDecimals = Math.round(s.dataDecimals);
      for (const k of ["bg", "fg", "accent", "promptBg", "promptFg"])
        if (hex(raw[k])) s[k] = raw[k];
      if (Array.isArray(raw.colors) && raw.colors.some(hex))
        s.colors = raw.colors.filter(hex).slice(0, 12);
      for (const k of [
        "uppercase",
        "footer",
        "mediaLoop",
        "mediaFlow",
        "promptReveal",
        "clearPattern",
        "clearGraphics",
      ])
        if (typeof raw[k] === "boolean") s[k] = raw[k];
      if (typeof raw.mediaId === "string") s.mediaId = raw.mediaId;
      if (typeof raw.id === "string" && !ids.has(raw.id)) s.id = raw.id;
      s.font = "Focal Upright";
      s.footer = false;
      if (raw.layout === "marquee") s.layout = "prompt";
      // Older projects inherited dust everywhere. Adopt layout defaults unless
      // the scene has a recorded choice, retaining an existing off setting.
      s.patternExplicit =
        typeof raw.patternExplicit === "boolean"
          ? raw.patternExplicit
          : raw.pattern === "none";
      if (!s.patternExplicit) s.pattern = defaultPattern(s.layout);
      if (/^FAL \/ MOTION|^0[23] \/ /.test(s.eyebrow)) s.eyebrow = "";
      if (Array.isArray(raw.megaTiers))
        s.megaTiers = [
          ...new Set(
            raw.megaTiers.filter(
              (t) => Number.isInteger(t) && t >= 2 && t <= 8,
            ),
          ),
        ].sort((a, b) => a - b);
      if (!raw.promptBg) s.promptBg = s.fg;
      if (!raw.promptFg) s.promptFg = s.bg;
      ids.add(s.id);
      return s;
    }),
  };
}
export const duration = (p) => p.scenes.reduce((n, s) => n + s.duration, 0);
export const sceneStart = (p, index) =>
  p.scenes.slice(0, index).reduce((n, s) => n + s.duration, 0);
export function locate(p, time) {
  let start = 0;
  const t = clamp(time, 0, Math.max(0, duration(p) - 0.000001));
  for (let i = 0; i < p.scenes.length; i++) {
    const s = p.scenes[i];
    if (t < start + s.duration || i === p.scenes.length - 1)
      return { scene: s, index: i, local: t - start, start };
    start += s.duration;
  }
}
export function transitionAt(p, time) {
  const at = locate(p, time);
  const previous = p.scenes[at.index - 1];
  const sharedMedia = usesMediaFlow(previous, at.scene);
  const length = transitionLength(at.scene, previous);
  return {
    ...at,
    sharedMedia,
    blend:
      at.index > 0 && at.local < length
        ? at.local / length
        : 1,
  };
}
export const usesMediaFlow = (previous, scene) =>
  Boolean(previous?.mediaId && previous.mediaId === scene.mediaId && scene.mediaFlow !== false);
export const transitionLength = (scene, previous) =>
  scene.transition === "cut" && !usesMediaFlow(previous, scene)
    ? 0 : Math.min(MOTION_SECONDS, scene.duration / 3);
// Reusing the same trim and loop settings continues the clip across the whole run.
// Changing either setting deliberately starts a new playback run.
export function mediaSequenceStart(p, index) {
  while (index > 0 && usesMediaFlow(p.scenes[index - 1], p.scenes[index]) &&
    p.scenes[index - 1].mediaStart === p.scenes[index].mediaStart &&
    p.scenes[index - 1].mediaLoop === p.scenes[index].mediaLoop) index--;
  return index;
}
export function mediaElapsed(p, index, local) {
  const start = mediaSequenceStart(p, index);
  return local + p.scenes.slice(start, index).reduce((sum, scene) => sum + scene.duration, 0);
}
export function mediaTime(scene, local, clipDuration) {
  if (!Number.isFinite(clipDuration) || clipDuration <= 0) return 0;
  const end = Math.max(0, clipDuration - 0.04),
    start = clamp(scene.mediaStart, 0, end),
    available = clipDuration - start;
  return Math.min(
    end,
    start +
      (scene.mediaLoop ? Math.max(0, local) % available : Math.max(0, local)),
  );
}
export function random(seed) {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pattern(ctx, s, t, w, h) {
  if (s.pattern === "none" || s.opacity === 0) return;
  ctx.save();
  ctx.globalAlpha = s.opacity / 100;
  const pixelGrid = ctx.getTransform();
  for (const node of diffusionNodes(s, t, w, h)) {
    if (
      (s.clearPattern || s.clearGraphics) &&
      s.textClearZones &&
      nodeOverlapsText(node, s.textClearZones)
    )
      continue;
    ctx.fillStyle = s.colors[node.color] || s.accent;
    if (node.shape === "circle") {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else
      ctx.fillRect(
        ...pixelAlignedRect(
          pixelGrid,
          node.x - node.size / 2,
          node.y - node.size / 2,
          node.size,
          node.size,
        ),
      );
  }
  ctx.restore();
}
export function mediaGeometry(s, rect, iw, ih) {
  let [x, y, w, h] = rect;
  if (s.mediaFit === "adapt") {
    const fit = Math.min(w / iw, h / ih);
    const fw = iw * fit, fh = ih * fit;
    x += ((w - fw) * s.mediaX) / 100;
    y += ((h - fh) * s.mediaY) / 100;
    w = fw;
    h = fh;
  }
  const scale = (s.mediaFit === "contain"
    ? Math.min(w / iw, h / ih)
    : Math.max(w / iw, h / ih)) * s.mediaZoom / 100;
  const dw = iw * scale, dh = ih * scale;
  return {
    frame: [x, y, w, h],
    image: [x + ((w - dw) * s.mediaX) / 100,
      y + ((h - dh) * s.mediaY) / 100, dw, dh],
  };
}
function media(ctx, s, asset, rect) {
  if (s.mediaMotion) return;
  const el = asset?.element;
  const iw = el?.videoWidth || el?.naturalWidth;
  const ih = el?.videoHeight || el?.naturalHeight;
  const geometry = iw && ih ? mediaGeometry(s, rect, iw, ih) : null;
  if (s.collectMediaGeometry) {
    if (geometry) s.collectMediaGeometry(geometry);
    return;
  }
  paintMedia(ctx, s, asset, geometry, rect);
}
function paintMedia(ctx, s, asset, geometry, rect = geometry.frame) {
  const el = asset?.element;
  const [x, y, w, h] = geometry?.frame || rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (el) {
    if (geometry) {
      if (s.onMediaBounds) {
        const [ix, iy, iw, ih] = geometry.image;
        const left = Math.max(x, ix), top = Math.max(y, iy);
        const right = Math.min(x + w, ix + iw), bottom = Math.min(y + h, iy + ih);
        const m = ctx.getTransform();
        s.onMediaBounds({x: left * m.a + m.e, y: top * m.d + m.f,
          width: (right - left) * m.a, height: (bottom - top) * m.d});
      }
      ctx.drawImage(el, ...geometry.image);
      ctx.fillStyle = `rgba(0,0,0,${s.mediaDim / 100})`;
      // Darken the placed media, never the unused space around a fitted image.
      ctx.fillRect(...geometry.image);
    }
  } else {
    ctx.fillStyle = s.accent;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.8;
    ctx.font = `${Math.min(w, h) * 0.05}px 'Focal Upright'`;
    ctx.fillStyle = s.fg;
    ctx.textAlign = "center";
    ctx.fillText("Add an image or video", x + w / 2, y + h * 0.52);
  }
  ctx.restore();
}
function wrap(ctx, text, maxWidth) {
  const lines = [];
  for (const para of text.split("\n")) {
    if (!para) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
      // Split long unbroken words so they stay within the text area.
      if (ctx.measureText(line).width > maxWidth) {
        let part = "";
        for (const ch of line) {
          if (part && ctx.measureText(part + ch).width > maxWidth) {
            lines.push(part);
            part = "";
          }
          part += ch;
        }
        line = part;
      }
    }
    lines.push(line);
  }
  return lines;
}
function headline(ctx, s, t, rect, k) {
  const [x, y, w, h] = rect,
    text = s.uppercase ? s.title.toUpperCase() : s.title;
  let size = s.fontSize * k,
    lines = [];
  ctx.save();
  ctx.textBaseline = "top";
  ctx.textAlign = s.align;
  const font = () => {
    ctx.font = `${s.weight} ${size}px "${s.font.replace(/["\\]/g, "")}", sans-serif`;
    ctx.letterSpacing = `${s.tracking * k}px`;
  };
  font();
  lines = wrap(ctx, text, w);
  for (
    let i = 0;
    i < 30 && (lines.length * size * s.lineHeight) / 100 > h;
    i++
  ) {
    size *= 0.94;
    font();
    lines = wrap(ctx, text, w);
  }
  const lh = (size * s.lineHeight) / 100,
    tx = x + (s.align === "center" ? w / 2 : s.align === "right" ? w : 0);
  const total = lines.join("").length;
  const paintLines = (background) => {
    let consumed = 0;
    lines.forEach((line, i) => {
      ctx.save();
      const p =
        s.animation === "none" ? 1 : ease((t - i * 0.075) / (s.entrance / 100));
      let yy = y + i * lh;
      if (s.animation === "rise") yy += (1 - p) * size * 0.6;
      if (["rise", "scale", "fade"].includes(s.animation)) ctx.globalAlpha = p;
      if (s.animation === "reveal") {
        ctx.beginPath();
        ctx.rect(x - 4, y + i * lh - 4, w + 8, lh * p + 8 * p);
        ctx.clip();
        yy += (1 - p) * lh;
      }
      if (s.animation === "scale") {
        ctx.translate(tx, yy);
        ctx.scale(0.7 + p * 0.3, 0.7 + p * 0.3);
        ctx.translate(-tx, -yy);
      }
      if (s.animation === "typewriter") {
        const count = Math.floor(ease(t / (s.entrance / 100)) * total);
        const len = line.length;
        line = line.slice(0, Math.max(0, count - consumed));
        consumed += len;
      }
      if (background) {
        if (line.trim()) {
          const m = ctx.measureText(line);
          ctx.fillStyle = s.promptBg;
          ctx.fillRect(
            tx - m.actualBoundingBoxLeft,
            yy - m.actualBoundingBoxAscent,
            m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
            m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
          );
        }
      } else {
        ctx.fillStyle = s.treatment === "background" ? s.promptFg : s.fg;
        ctx.fillText(line, tx, yy);
      }
      ctx.restore();
    });
  };
  // Paint all tight line backgrounds first so closely spaced lines cannot
  // cover the preceding line's descenders. Both passes share the same motion.
  if (s.treatment === "background") paintLines(true);
  paintLines(false);
  ctx.restore();
  return Math.min(h, lines.length * lh);
}
function drawPrompt(ctx, s, text, t, x, y, width, k, measure = false) {
  ctx.save();
  ctx.font = `400 ${s.promptSize * k}px 'Focal Upright'`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
  // Fit the background to Focal's visible glyph bounds instead of an em
  // line box, which added extra space beneath the text. Measure the full
  // prompt so every word keeps a shared baseline as it reveals.
  const metrics = ctx.measureText(text.replace(/\s+/g, " ") || "Hg");
  const ascent = Math.max(0, metrics.actualBoundingBoxAscent);
  const descent = Math.max(0, metrics.actualBoundingBoxDescent);
  const pad = s.promptPadding * k,
    gap = s.promptGap * k,
    height = ascent + descent + pad * 2,
    lines = [[]];
  let lineWidth = 0;
  const tokens = text.match(/[^\s]+|\n/g) || [];
  for (const word of tokens) {
    if (word === "\n") {
      lines.push([]);
      lineWidth = 0;
      continue;
    }
    const pieces = wrap(ctx, word, Math.max(1, width - pad * 2));
    for (const piece of pieces) {
      const ww = ctx.measureText(piece).width + pad * 2;
      if (lineWidth && lineWidth + gap + ww > width) {
        lines.push([]);
        lineWidth = 0;
      }
      lines.at(-1).push({ word: piece, w: ww, x: lineWidth });
      lineWidth += ww + gap;
    }
  }
  const blockHeight = lines.length * (height + gap) - gap;
  if (measure) {
    ctx.restore();
    return blockHeight;
  }
  const count = s.promptReveal
    ? Math.floor(
        ease(t / (s.entrance / 100)) *
          lines.reduce((sum, line) => sum + line.length, 0),
      )
    : Infinity;
  let visible = 0;
  lines.forEach((line, i) => {
    const lineWidth = line.length ? line.at(-1).x + line.at(-1).w : 0;
    const offset =
      s.align === "center"
        ? (width - lineWidth) / 2
        : s.align === "right"
          ? width - lineWidth
          : 0;
    line.forEach((item) => {
      if (visible++ >= count) return;
      ctx.fillStyle = s.promptBg;
      ctx.beginPath();
      ctx.roundRect(
        x + offset + item.x,
        y + i * (height + gap),
        item.w,
        height,
        s.promptRadius * k,
      );
      ctx.fill();
      ctx.fillStyle = s.promptFg;
      ctx.fillText(
        item.word,
        x + offset + item.x + pad,
        y + i * (height + gap) + pad + ascent,
      );
    });
  });
  ctx.restore();
  return blockHeight;
}
const textZoneCache = new Map();
export function renderScene(ctx, s, t, w, h, asset, index = 0) {
  if (
    (s.clearPattern || s.clearGraphics) &&
    s.pattern !== "none" &&
    s.opacity > 0
  ) {
    const {mediaMotion, onMediaBounds, collectMediaGeometry, ...zoneScene} = s;
    const key = JSON.stringify([zoneScene, w, h, Boolean(asset)]);
    let zones = textZoneCache.get(key);
    if (!zones) {
      const padding = ((s.scale + 8) * Math.min(w, h)) / 720;
      const graphicZones = [];
      const clean = {
        ...s,
        onMediaBounds: undefined,
        collectMediaGeometry: undefined,
        mediaMotion: undefined,
        clearPattern: false,
        clearGraphics: false,
        graphicClearZones: s.clearGraphics ? graphicZones : undefined,
        pattern: "none",
        promptReveal: false,
      };
      zones = measureTextZones(
        ctx,
        (probe) => {
          renderScene(
            probe,
            { ...clean, animation: "none" },
            10,
            w,
            h,
            asset,
            index,
          );
          // Reserve the start position too, so rising/scaling text never sweeps
          // through a node while the final text bounds remain stable.
          if (["rise", "scale", "reveal"].includes(s.animation))
            renderScene(probe, clean, 0, w, h, asset, index);
        },
        padding,
        s.clearPattern,
      );
      zones.push(
        ...graphicZones.map(([x, y, width, height]) => ({
          x: x - padding,
          y: y - padding,
          width: width + padding * 2,
          height: height + padding * 2,
        })),
      );
      if (textZoneCache.size >= 32)
        textZoneCache.delete(textZoneCache.keys().next().value);
      textZoneCache.set(key, zones);
    }
    s = { ...s, textClearZones: zones };
  }
  ctx.save();
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, w, h);
  const paintMediaMotion = () => {
    if (!s.mediaMotion) return;
    for (const geometry of s.mediaMotion.geometries)
      paintMedia(ctx, {...s, mediaDim: s.mediaMotion.dim}, s.mediaMotion.asset, geometry);
  };
  if (!EXTRA_LAYOUTS.some(([id, , group]) => id === s.layout && group === "media"))
    paintMediaMotion();
  if (
    renderExtraLayout(ctx, s, t, w, h, asset, {
      headline,
      drawPrompt,
      media,
      pattern,
      paintMediaMotion,
      reserveGraphic: (rect) => s.graphicClearZones?.push(rect),
    })
  ) {
    ctx.restore();
    return;
  }
  const k = Math.min(w, h) / 720,
    pad = 50 * k,
    portrait = h > w;
  let textRect = [pad, h * 0.23, w * 0.74, h * 0.57],
    patternRect = [w * 0.56, 0, w * 0.44, h],
    mediaRect = null;
  if (s.layout === "split") {
    textRect = portrait
      ? [pad, h * 0.12, w - pad * 2, h * 0.35]
      : [pad, h * 0.24, w * 0.45 - pad, h * 0.54];
    patternRect = portrait
      ? [0, h * 0.55, w, h * 0.45]
      : [w * 0.53, 0, w * 0.47, h];
    mediaRect = portrait
      ? [pad, h * 0.57, w - pad * 2, h * 0.32]
      : [w * 0.55, pad, w * 0.45 - pad * 1.5, h - pad * 2];
  }
  if (s.layout === "poster") {
    textRect = [pad, h * 0.28, w - pad * 2, h * 0.45];
    patternRect = [0, 0, w, h];
  }
  if (s.layout === "frame") {
    mediaRect = [pad, pad, w - pad * 2, h - pad * 2];
    textRect = [pad * 1.5, h * 0.54, w - pad * 3, h * 0.3];
    patternRect = [0, 0, w, h];
  }
  if (s.layout === "editorial") {
    textRect = portrait
      ? [pad, h * 0.55, w - pad * 2, h * 0.28]
      : [w * 0.52, h * 0.2, w * 0.48 - pad, h * 0.56];
    mediaRect = portrait
      ? [pad, pad * 1.8, w - pad * 2, h * 0.4]
      : [pad, pad * 1.8, w * 0.42, h - pad * 2.8];
    patternRect = [0, 0, w * 0.46, h];
  }
  if (s.layout === "prompt") {
    textRect = [pad, h * 0.31, w - pad * 2, h * 0.42];
    patternRect = [0, 0, w, h];
  }
  if (s.mediaId && !mediaRect) mediaRect = [0, 0, w, h];
  if (mediaRect && s.mediaId) media(ctx, s, asset, mediaRect);
  pattern(ctx, s, t, w, h, patternRect);
  if (mediaRect && !s.mediaId && ["frame", "editorial"].includes(s.layout))
    media(ctx, s, null, mediaRect);
  textRect[0] += (s.textX * w) / 100;
  textRect[1] += (s.textY * h) / 100;
  const promptWidth = textRect[2];
  let promptStyle = s;
  let promptHeight = s.body
    ? drawPrompt(ctx, promptStyle, s.body, t, 0, 0, promptWidth, k, true)
    : 0;
  const contentBottom = s.layout === "split" && portrait ? h * 0.53 : h - pad;
  // Reserve space for the complete prompt before fitting the headline.
  for (
    let i = 0;
    i < 35 && promptHeight > (contentBottom - textRect[1]) * 0.4;
    i++
  ) {
    promptStyle = {
      ...promptStyle,
      promptSize: promptStyle.promptSize * 0.94,
      promptPadding: promptStyle.promptPadding * 0.94,
      promptGap: promptStyle.promptGap * 0.94,
    };
    promptHeight = drawPrompt(
      ctx,
      promptStyle,
      s.body,
      t,
      0,
      0,
      promptWidth,
      k,
      true,
    );
  }
  textRect[3] = Math.max(
    24 * k,
    Math.min(
      textRect[3],
      contentBottom - textRect[1] - promptHeight - (s.body ? 24 * k : 0),
    ),
  );
  let titleHeight = 0;
  if (
    (s.layout === "prompt" && s.treatment !== "background") ||
    s.treatment === "highlight"
  ) {
    let titleStyle = { ...s, promptSize: s.fontSize * 0.5 };
    for (
      let i = 0;
      i < 35 &&
      drawPrompt(ctx, titleStyle, s.title, t, 0, 0, textRect[2], k, true) >
        textRect[3];
      i++
    )
      titleStyle = {
        ...titleStyle,
        promptSize: titleStyle.promptSize * 0.94,
        promptPadding: titleStyle.promptPadding * 0.94,
      };
    titleHeight = drawPrompt(
      ctx,
      titleStyle,
      s.title,
      t,
      textRect[0],
      textRect[1],
      textRect[2],
      k,
    );
  } else titleHeight = headline(ctx, s, t, textRect, k);
  if (s.eyebrow) {
    ctx.fillStyle = s.fg;
    ctx.textBaseline = "top";
    ctx.font = `400 ${24 * k}px 'Focal Upright'`;
    ctx.fillText(s.eyebrow, pad, pad, w - pad * 2);
  }
  if (s.body)
    drawPrompt(
      ctx,
      promptStyle,
      s.body,
      t,
      textRect[0],
      textRect[1] + titleHeight + 24 * k,
      promptWidth,
      k,
    );
  ctx.restore();
}
// Query the real layout renderer so media flow also follows adapted frames and two-crop layouts.
const mediaGeometryCache = new Map();
function sceneMediaGeometry(ctx, scene, w, h, asset) {
  const el = asset?.element;
  const iw = el?.videoWidth || el?.naturalWidth, ih = el?.videoHeight || el?.naturalHeight;
  if (!iw || !ih) return [];
  const key = JSON.stringify([scene, w, h, iw, ih]);
  if (mediaGeometryCache.has(key)) return mediaGeometryCache.get(key);
  const geometries = [];
  measureTextZones(ctx, probe => renderScene(probe, {
    ...scene, pattern: "none", clearPattern: false, clearGraphics: false,
    onMediaBounds: undefined, collectMediaGeometry: g => geometries.push(g),
  }, 10, w, h, asset), 0, false);
  if (mediaGeometryCache.size >= 32) mediaGeometryCache.delete(mediaGeometryCache.keys().next().value);
  mediaGeometryCache.set(key, geometries);
  return geometries;
}
export function interpolateMediaGeometry(from, to, progress) {
  const mix = (a, b) => a + (b - a) * progress;
  return {frame: from.frame.map((n, i) => mix(n, to.frame[i])),
    image: from.image.map((n, i) => mix(n, to.image[i]))};
}
export function renderFrame(canvas, p, time, assets, newLayer, onMediaBounds) {
  const ctx = canvas.getContext("2d"),
    [w, h] = FORMATS[p.format],
    at = transitionAt(p, time);
  let activeScene = onMediaBounds ? {...at.scene, onMediaBounds} : at.scene;
  ctx.save();
  ctx.scale(canvas.width / w, canvas.height / h);
  if (at.blend < 1) {
    let prev = p.scenes[at.index - 1];
    const blend = easeInOutQuad(at.blend);
    const previousAsset = assets.get(prev.id) || assets.get(prev.mediaId);
    const activeAsset = assets.get(at.scene.id) || assets.get(at.scene.mediaId);
    if (at.sharedMedia) {
      const from = sceneMediaGeometry(ctx, prev, w, h, previousAsset);
      const to = sceneMediaGeometry(ctx, at.scene, w, h, activeAsset);
      if (from.length && from.length === to.length) {
        const mediaMotion = {
          geometries: from.map((g, i) => interpolateMediaGeometry(g, to[i], blend)),
          dim: prev.mediaDim + (at.scene.mediaDim - prev.mediaDim) * blend,
          asset: activeAsset,
        };
        prev = {...prev, mediaMotion};
        activeScene = {...activeScene, mediaMotion};
      }
    }
    renderScene(
      ctx,
      prev,
      Math.max(0, prev.duration - 1 / 60),
      w,
      h,
      assets.get(prev.id) || assets.get(prev.mediaId),
      at.index - 1,
    );
    ctx.save();
    const dissolve = at.sharedMedia || at.scene.transition === "fade";
    if (dissolve) ctx.globalAlpha = blend;
    if (!at.sharedMedia && at.scene.transition === "wipe") {
      ctx.beginPath();
      ctx.rect(0, 0, w * blend, h);
      ctx.clip();
    }
    if (!at.sharedMedia && at.scene.transition === "slide") ctx.translate(w * (1 - blend), 0);
    // Dissolve a flattened scene to avoid separately blending its background and elements.
    if (dissolve && newLayer) {
      newLayer.width = canvas.width;
      newLayer.height = canvas.height;
      const lc = newLayer.getContext("2d");
      lc.save();
      lc.scale(newLayer.width / w, newLayer.height / h);
      renderScene(
        lc,
        activeScene,
        at.local,
        w,
        h,
        assets.get(at.scene.id) || assets.get(at.scene.mediaId),
        at.index,
      );
      lc.restore();
      ctx.drawImage(newLayer, 0, 0, w, h);
    } else
      renderScene(
        ctx,
        activeScene,
        at.local,
        w,
        h,
        assets.get(at.scene.id) || assets.get(at.scene.mediaId),
        at.index,
      );
    ctx.restore();
  } else
    renderScene(
      ctx,
      activeScene,
      at.local,
      w,
      h,
      assets.get(at.scene.id) || assets.get(at.scene.mediaId),
      at.index,
    );
  ctx.restore();
  return at;
}
export function outputSize(format, shortEdge) {
  const [w, h] = FORMATS[format];
  const f = shortEdge / Math.min(w, h);
  return [Math.round((w * f) / 2) * 2, Math.round((h * f) / 2) * 2];
}
