import {MEDIA_TEMPLATES,renderMediaTemplate} from './video-media-layouts.mjs?v=24';
// Data and editorial layouts use the same Focal text and square primitives as the editor.
import { easeOutQuad as ease } from "./video-motion.mjs?v=24";
import { SWISS_LAYOUTS, renderSwissLayout } from "./video-swiss.mjs?v=24";
export const EXTRA_LAYOUTS = [
  ["big-stat", "Big stat", "data"],
  ["stat-grid", "Stat grid", "data"],
  ["bars", "Bar chart", "data"],
  ["columns", "Column chart", "data"],
  ["waffle", "Square share", "data"],
  ["progress", "Progress", "data"],
  ["comparison", "Comparison", "data"],
  ["steps", "Steps", "data"],
  ["quote", "Quote", "type"],
  ["end-card", "End card", "type"],
  ...SWISS_LAYOUTS,
  ...MEDIA_TEMPLATES,
];
export const DEFAULT_DATA = "Design | 42\nMotion | 68\nVideo | 92";
export function parseDataRows(text) {
  const rows = [],
    errors = [];
  String(text || "")
    .split("\n")
    .forEach((line, i) => {
      if (!line.trim()) return;
      const parts = line.split("|"),
        label = parts[0].trim();
      const raw = (parts[1] || "").trim();
      if (
        parts.length !== 2 ||
        !label ||
        !raw ||
        !/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) ||
        !Number.isFinite(Number(raw)) ||
        Math.abs(Number(raw)) > 1e12
      ) {
        errors.push(i + 1);
        return;
      }
      if (rows.length < 8)
        rows.push({ label: label.slice(0, 80), value: Number(raw) });
      else errors.push(i + 1);
    });
  return { rows, errors };
}
export function chartDomain(rows, max = 0) {
  const low = Math.min(0, ...rows.map((r) => r.value)),
    high = Math.max(0, max, ...rows.map((r) => r.value));
  return { low, high: high === low ? low + 1 : high };
}
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export function renderExtraLayout(ctx, s, t, w, h, asset, helpers) {
  if (!EXTRA_LAYOUTS.some((l) => l[0] === s.layout)) return false;
  const isData = EXTRA_LAYOUTS.some(
    ([id, , group]) => id === s.layout && group === "data",
  );
  if (isData) s = { ...s, tracking: 0 };
  const { headline, drawPrompt, media, pattern } = helpers,
    k = Math.min(w, h) / 720,
    pad = 50 * k,
    inner = w - pad * 2,
    portrait = h > w;
  const p = s.animation === "none" ? 1 : ease(t / (s.entrance / 100));
  const { rows } = parseDataRows(s.dataRows);
  const colorList = [...new Set([s.accent, ...s.colors, s.fg])].filter(
    (c) => c.toLowerCase() !== s.bg.toLowerCase(),
  );
  const color = (i) => colorList[i % colorList.length] || s.fg;
  const number = (v, animate = true) => {
    const decimals = s.dataDecimals || 0;
    return (
      s.valuePrefix +
      (v * (animate ? p : 1)).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) +
      s.valueSuffix
    );
  };
  const text = (
    str,
    x,
    y,
    width,
    height,
    size,
    align = "left",
    fill = s.fg,
  ) => {
    if (isData) size *= 0.82;
    // Keep numeric values on a single line, including prefixes and suffixes.
    if (/\d/.test(String(str))) {
      ctx.save();
      ctx.letterSpacing = `${s.tracking * k}px`;
      for (let i = 0; i < 50; i++) {
        ctx.font = `${s.weight} ${size * k}px 'Focal Upright'`;
        if (ctx.measureText(String(str)).width <= width) break;
        size *= 0.94;
      }
      ctx.restore();
    }
    return headline(
      ctx,
      {
        ...s,
        title: String(str),
        fontSize: size,
        weight: s.weight,
        align,
        fg: fill,
        animation: "none",
        treatment: "solid",
        uppercase: false,
      },
      t,
      [x, y, width, height],
      k,
    );
  };
  const box = (
    str,
    x,
    y,
    width,
    size = 26,
    align = "left",
    fill = s.promptBg,
    fg = s.promptFg,
  ) =>
    drawPrompt(
      ctx,
      {
        ...s,
        promptSize: isData ? size * 0.82 : size,
        align,
        promptBg: fill,
        promptFg: fg,
        promptReveal: false,
      },
      String(str),
      t,
      x,
      y,
      width,
      k,
    );
  if (
    asset &&
    !EXTRA_LAYOUTS.some(([id, , group]) => id === s.layout && group === "media")
  )
    media(ctx, s, asset, [0, 0, w, h]);
  pattern(ctx, s, t, w, h);
  if (EXTRA_LAYOUTS.some(([id, , group]) => id === s.layout && group === "media"))
    helpers.paintMediaMotion?.();
  if (renderMediaTemplate(ctx,s,t,w,h,asset,helpers)) return true;
  if (
    renderSwissLayout(
      ctx,
      s,
      t,
      w,
      h,
      asset,
      { ...helpers, text, box, number, color, p },
      rows,
    )
  )
    return true;
  if (s.layout === "quote" || s.layout === "end-card") {
    const align = s.layout === "end-card" ? "center" : s.align;
    const top = h * (s.layout === "quote" ? 0.22 : 0.27);
    const titleHeight = headline(
      ctx,
      { ...s, align },
      t,
      [pad, top, inner, h * 0.43],
      k,
    );
    if (s.body) {
      let style = { ...s, align };
      let height = drawPrompt(ctx, style, s.body, t, 0, 0, inner, k, true);
      while (height > h * 0.18 && style.promptSize > 10) {
        style = { ...style, promptSize: style.promptSize * 0.9 };
        height = drawPrompt(ctx, style, s.body, t, 0, 0, inner, k, true);
      }
      drawPrompt(
        ctx,
        style,
        s.body,
        t,
        pad,
        Math.min(h - pad - height, top + titleHeight + 30 * k),
        inner,
        k,
      );
    }
    if (s.eyebrow) text(s.eyebrow, pad, pad, inner, 40 * k, 24, align);
    return true;
  }
  const titleY = pad + (s.eyebrow ? 42 * k : 0);
  if (s.eyebrow) text(s.eyebrow, pad, pad, inner, 32 * k, 24);
  const headerH = Math.min(h * 0.16, 112 * k);
  headline(
    ctx,
    { ...s, fontSize: Math.min(s.fontSize * 0.5, 64), align: "left" },
    t,
    [pad, titleY, inner, headerH],
    k,
  );
  let noteStyle = {
    ...s,
    promptSize: Math.min(s.promptSize, 28),
    align: "left",
  };
  let noteHeight = s.body
    ? drawPrompt(ctx, noteStyle, s.body, t, 0, 0, inner, k, true)
    : 0;
  for (let i = 0; i < 30 && noteHeight > h * 0.16; i++) {
    noteStyle = {
      ...noteStyle,
      promptSize: noteStyle.promptSize * 0.9,
      promptPadding: noteStyle.promptPadding * 0.9,
    };
    noteHeight = drawPrompt(ctx, noteStyle, s.body, t, 0, 0, inner, k, true);
  }
  const y = titleY + headerH + 28 * k,
    bottom = h - pad - (s.body ? noteHeight + 28 * k : 0),
    areaH = Math.max(100 * k, bottom - y);
  if (s.body)
    drawPrompt(ctx, noteStyle, s.body, t, pad, h - pad - noteHeight, inner, k);
  if (!rows.length) {
    text("Add your data", pad, y, inner, areaH, 48);
    return true;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, y, inner, areaH);
  ctx.clip();
  helpers.reserveGraphic?.([pad, y, inner, areaH]);
  if (s.layout === "big-stat") {
    const row = rows[0],
      valueH = areaH * 0.67;
    const usedHeight = text(
      number(row.value),
      pad,
      y,
      inner,
      valueH,
      Math.min(260, valueH / k),
      s.align,
    );
    box(row.label, pad, y + usedHeight + 16 * k, inner, 32, s.align);
  } else if (s.layout === "stat-grid") {
    const list = rows.slice(0, 6),
      cols = Math.min(w / h < 1.4 ? 2 : 3, list.length),
      nrows = Math.ceil(list.length / cols),
      cw = inner / cols,
      ch = areaH / nrows;
    let metricSize = Math.min(128, (ch * 0.56) / k);
    ctx.save();
    ctx.letterSpacing = `${s.tracking * k}px`;
    for (let i = 0; i < 50; i++) {
      ctx.font = `${s.weight} ${metricSize * k}px 'Focal Upright'`;
      if (
        list.every(
          (row) =>
            ctx.measureText(number(row.value, false)).width <= cw - 24 * k,
        )
      )
        break;
      metricSize *= 0.94;
    }
    ctx.restore();
    list.forEach((row, i) => {
      const x = pad + (i % cols) * cw,
        yy = y + Math.floor(i / cols) * ch;
      const usedHeight = text(
        number(row.value),
        x,
        yy,
        cw - 24 * k,
        ch * 0.58,
        metricSize,
      );
      box(
        row.label,
        x,
        yy + usedHeight + 16 * k,
        cw - 24 * k,
        Math.min(28, (ch * 0.16) / k),
      );
    });
  } else if (s.layout === "bars") {
    const ch = areaH / rows.length,
      labelW = inner * (portrait ? 0.28 : 0.25),
      valueW = inner * 0.2,
      plotX = pad + labelW + 12 * k,
      plotW = inner - labelW - valueW - 24 * k;
    const { low, high } = chartDomain(rows, s.chartMax),
      span = high - low,
      zero = plotX + (-low / span) * plotW;
    rows.forEach((r, i) => {
      const yy = y + i * ch;
      text(r.label, pad, yy, labelW, ch * 0.8, Math.min(32, (ch * 0.47) / k));
      const endpoint = plotX + ((r.value * p - low) / span) * plotW;
      ctx.fillStyle = color(i);
      ctx.fillRect(
        Math.min(zero, endpoint),
        yy + ch * 0.1,
        Math.abs(endpoint - zero),
        ch * 0.55,
      );
      text(
        number(r.value, false),
        pad + inner - valueW,
        yy,
        valueW,
        ch * 0.8,
        Math.min(32, (ch * 0.47) / k),
        "right",
      );
    });
  } else if (s.layout === "columns") {
    const list = rows.slice(0, 6),
      cw = inner / list.length,
      plotY = y + 42 * k,
      plotH = Math.max(20 * k, areaH - 110 * k),
      { low, high } = chartDomain(list, s.chartMax),
      span = high - low,
      zero = plotY + (high / span) * plotH;
    list.forEach((r, i) => {
      const x = pad + i * cw + cw * 0.12,
        endpoint = plotY + ((high - r.value * p) / span) * plotH;
      ctx.fillStyle = color(i);
      ctx.fillRect(
        x,
        Math.min(zero, endpoint),
        cw * 0.65,
        Math.abs(zero - endpoint),
      );
      text(
        number(r.value, false),
        pad + i * cw,
        y,
        cw - 8 * k,
        38 * k,
        portrait ? 26 : 30,
        "center",
      );
      text(
        r.label,
        pad + i * cw,
        plotY + plotH + 14 * k,
        cw - 8 * k,
        52 * k,
        portrait ? 24 : 26,
        "center",
      );
    });
  } else if (s.layout === "waffle") {
    const row = rows[0],
      goal = s.chartMax || 100,
      ratio = clamp(row.value / goal),
      side = Math.min(
        areaH * (portrait ? 0.62 : 1),
        inner * (portrait ? 0.9 : 0.5),
      ),
      cell = side / 10,
      gap = cell * 0.18;
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = s.fg;
      ctx.globalAlpha = i < Math.round(ratio * p * 100) ? 1 : 0.13;
      ctx.fillRect(
        pad + (i % 10) * cell,
        y + Math.floor(i / 10) * cell,
        cell - gap,
        cell - gap,
      );
    }
    ctx.globalAlpha = 1;
    const tx = portrait ? pad : pad + side + 36 * k,
      ty = portrait ? y + side + 18 * k : y + areaH * 0.2,
      tw = portrait ? inner : inner - side - 36 * k;
    text(Math.round(ratio * p * 100) + "%", tx, ty, tw, areaH * 0.26, 110);
    box(row.label, tx, ty + Math.min(110 * k, areaH * 0.27), tw, 28);
  } else if (s.layout === "progress") {
    const list = rows.slice(0, 4),
      ch = areaH / list.length,
      goal = s.chartMax || 100;
    list.forEach((r, i) => {
      const yy = y + i * ch,
        ratio = clamp(r.value / goal),
        tile = inner / 20,
        gap = tile * 0.15;
      text(
        r.label,
        pad,
        yy,
        inner * 0.65,
        ch * 0.4,
        Math.min(32, (ch * 0.28) / k),
      );
      text(
        Math.round(ratio * p * 100) + "%",
        pad + inner * 0.7,
        yy,
        inner * 0.3,
        ch * 0.4,
        Math.min(40, (ch * 0.3) / k),
        "right",
      );
      for (let j = 0; j < 20; j++) {
        ctx.globalAlpha = j < Math.round(ratio * p * 20) ? 1 : 0.13;
        ctx.fillStyle = color(i);
        ctx.fillRect(
          pad + j * tile,
          yy + Math.min(ch * 0.45, 52 * k),
          tile - gap,
          Math.min(tile - gap, ch * 0.38),
        );
      }
      ctx.globalAlpha = 1;
    });
  } else if (s.layout === "comparison") {
    const list = rows.slice(0, 2),
      vertical = portrait,
      cw = vertical ? inner : inner / 2,
      ch = vertical ? areaH / 2 : areaH;
    list.forEach((r, i) => {
      const xx = pad + (vertical ? 0 : i * cw),
        yy = y + (vertical ? i * ch : 0);
      box(r.label, xx, yy, cw - 24 * k, 32);
      text(
        number(r.value),
        xx,
        yy + 56 * k,
        cw - 24 * k,
        ch - 66 * k,
        Math.min(180, (ch - 66 * k) / k),
      );
    });
  } else if (s.layout === "steps") {
    const list = rows.slice(0, 6),
      cols = portrait ? 1 : Math.min(3, list.length),
      nrows = Math.ceil(list.length / cols),
      cw = inner / cols,
      ch = areaH / nrows;
    list.forEach((r, i) => {
      const xx = pad + (i % cols) * cw,
        yy = y + Math.floor(i / cols) * ch;
      ctx.globalAlpha =
        s.animation === "none" ? 1 : ease((t - i * 0.13) / (s.entrance / 100));
      box(String(i + 1).padStart(2, "0"), xx, yy, 64 * k, 32);
      text(
        r.label,
        xx + (portrait ? 84 * k : 0),
        yy + (portrait ? 0 : 64 * k),
        cw - (portrait ? 84 * k : 24 * k),
        ch - (portrait ? 10 * k : 70 * k),
        Math.min(40, (ch * 0.3) / k),
      );
    });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  return true;
}
