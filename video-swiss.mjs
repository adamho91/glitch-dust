import {
  GRID_LAYOUTS,
  GRID_DATA_LIMITS,
  renderGridLayout,
} from "./video-grid-layouts.mjs?v=24";
export const SWISS_LAYOUTS = [
  ...GRID_LAYOUTS,
  ["chapter", "Chapter", "type"],
  ["agenda", "Agenda", "type"],
  ["manifesto", "Manifesto", "type"],
  ["two-column", "Two columns", "type"],
  ["margin-title", "Margin title", "type"],
  ["closing-note", "Closing note", "type"],
  ["media-left", "Image left", "media"],
  ["media-top", "Image top", "media"],
  ["media-window", "Image window", "media"],
  ["media-band", "Image band", "media"],
  ["ranked-bars", "Ranked bars", "data"],
  ["diverging-bars", "Diverging bars", "data"],
  ["share-bar", "Share bar", "data"],
  ["dot-plot", "Square plot", "data"],
  ["line-chart", "Line chart", "data"],
  ["area-chart", "Area chart", "data"],
  ["metric-list", "Metric list", "data"],
  ["metric-feature", "Featured metric", "data"],
  ["goal-blocks", "Goal blocks", "data"],
  ["leaderboard", "Leaderboard", "data"],
];
export const SWISS_DATA_LIMITS = {
  ...GRID_DATA_LIMITS,
  "ranked-bars": 6,
  "diverging-bars": 6,
  "share-bar": 6,
  "dot-plot": 6,
  "line-chart": 8,
  "area-chart": 8,
  "metric-list": 4,
  "metric-feature": 3,
  "goal-blocks": 4,
  leaderboard: 6,
};
const clamp = (v) => Math.max(0, Math.min(1, v));

export function renderSwissLayout(ctx, s, t, w, h, asset, helpers, rows) {
  const def = SWISS_LAYOUTS.find(([id]) => id === s.layout);
  if (!def) return false;
  if (renderGridLayout(ctx, s, t, w, h, asset, helpers, rows)) return true;
  const { headline, drawPrompt, media, text, box, number, color, p } = helpers;
  const k = Math.min(w, h) / 720,
    pad = 50 * k,
    gap = 28 * k;
  const iw = w - 2 * pad,
    ih = h - 2 * pad,
    portrait = h > w;
  const title = (x, y, ww, hh, size = 100, align = "left") =>
    headline(
      ctx,
      { ...s, fontSize: (size * s.fontSize) / 124, align },
      t,
      [x, y, ww, hh],
      k,
    );
  const prompt = (str, x, y, ww, hh, size = s.promptSize) => {
    if (!str) return 0;
    let style = { ...s, promptSize: size, align: "left" };
    for (
      let i = 0;
      i < 40 && drawPrompt(ctx, style, str, t, 0, 0, ww, k, true) > hh;
      i++
    )
      style = {
        ...style,
        promptSize: style.promptSize * 0.92,
        promptPadding: style.promptPadding * 0.92,
        promptGap: style.promptGap * 0.92,
      };
    return drawPrompt(ctx, style, str, t, x, y, ww, k);
  };
  const frame = (rect) => media(ctx, s, asset, rect);
  const rect = (x, y, ww, hh, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, Math.max(0, ww), Math.max(0, hh));
  };
  const lines = s.body
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, iw, ih);
  ctx.clip();
  if (def[2] === "type") {
    if (s.layout === "chapter") {
      if (s.eyebrow) box(s.eyebrow, pad, pad, iw, 28);
      const used = title(pad, pad + ih * 0.27, iw, ih * 0.44, 148);
      prompt(s.body, pad, pad + ih * 0.27 + used + gap, iw * 0.8, ih * 0.2);
    } else if (s.layout === "agenda") {
      title(pad, pad, iw, ih * 0.23, 80);
      const entries = lines.slice(0, 6),
        top = pad + ih * 0.3,
        cell = (ih * 0.65) / Math.max(1, entries.length);
      entries.forEach((line, i) => {
        box(String(i + 1).padStart(2, "0"), pad, top + i * cell, 70 * k, 28);
        text(
          line,
          pad + 90 * k,
          top + i * cell,
          iw - 90 * k,
          cell - gap * 0.35,
          Math.min(46, (cell / k) * 0.65),
        );
      });
    } else if (s.layout === "manifesto") {
      title(pad, pad, iw, ih * 0.65, 160);
      prompt(
        s.body,
        pad + iw * (portrait ? 0 : 0.5),
        pad + ih * 0.73,
        iw * (portrait ? 1 : 0.5),
        ih * 0.27,
        34,
      );
    } else if (s.layout === "two-column") {
      title(pad, pad, iw, ih * 0.27, 100);
      const mid = Math.ceil(lines.length / 2),
        cols = [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")];
      cols.forEach((str, i) =>
        prompt(
          str,
          pad + (portrait ? 0 : (i * (iw + gap)) / 2),
          pad + ih * (portrait ? 0.34 + i * 0.32 : 0.4),
          portrait ? iw : (iw - gap) / 2,
          ih * (portrait ? 0.28 : 0.55),
          38,
        ),
      );
    } else if (s.layout === "margin-title") {
      title(
        pad,
        pad,
        portrait ? iw : iw * 0.36,
        ih * (portrait ? 0.3 : 0.9),
        90,
      );
      prompt(
        s.body,
        pad + (portrait ? 0 : iw * 0.46),
        pad + ih * (portrait ? 0.4 : 0.15),
        iw * (portrait ? 1 : 0.54),
        ih * (portrait ? 0.56 : 0.7),
        44,
      );
    } else {
      prompt(s.body, pad, pad, iw * (portrait ? 1 : 0.55), ih * 0.25, 32);
      title(pad, pad + ih * 0.43, iw, ih * 0.57, 150);
      if (s.eyebrow)
        box(s.eyebrow, pad + iw * 0.65, pad, iw * 0.35, 24, "right");
    }
  } else if (def[2] === "media") {
    if (s.layout === "media-left") {
      const mr = portrait
        ? [pad, pad, iw, ih * 0.48]
        : [pad, pad, iw * 0.48, ih];
      frame(mr);
      const x = pad + (portrait ? 0 : iw * 0.55),
        y = pad + (portrait ? ih * 0.54 : ih * 0.12),
        ww = iw * (portrait ? 1 : 0.45);
      const used = title(x, y, ww, ih * 0.3, 94);
      prompt(s.body, x, y + used + gap, ww, ih * 0.2, 28);
    } else if (s.layout === "media-top") {
      frame([pad, pad, iw, ih * 0.57]);
      const y = pad + ih * 0.63;
      const used = title(pad, y, iw * (portrait ? 1 : 0.6), ih * 0.23, 82);
      prompt(
        s.body,
        pad + (portrait ? 0 : iw * 0.68),
        portrait ? y + used + gap : y,
        iw * (portrait ? 1 : 0.32),
        ih * (portrait ? 0.11 : 0.33),
        26,
      );
    } else if (s.layout === "media-window") {
      title(pad, pad, iw, ih * 0.24, 88);
      const ww = iw * (portrait ? 1 : 0.63);
      frame([pad, pad + ih * 0.31, ww, ih * 0.54]);
      prompt(
        s.body,
        pad + (portrait ? 0 : iw * 0.7),
        pad + ih * (portrait ? 0.9 : 0.36),
        iw * (portrait ? 1 : 0.3),
        ih * (portrait ? 0.1 : 0.5),
        26,
      );
    } else {
      title(pad, pad, iw, ih * 0.29, 110);
      frame([pad, pad + ih * 0.36, iw, ih * 0.39]);
      prompt(s.body, pad, pad + ih * 0.83, iw, ih * 0.17, 30);
    }
  } else {
    const limit = SWISS_DATA_LIMITS[s.layout],
      list = rows.slice(0, limit);
    const top = pad + ih * 0.27,
      ah = ih * 0.57;
    if (list.length) helpers.reserveGraphic?.([pad, top, iw, ah]);
    title(pad, pad, iw, ih * 0.2, 64);
    prompt(s.body, pad, pad + ih * 0.9, iw, ih * 0.1, 26);
    if (!list.length) text("Add your data", pad, top, iw, ah, 48);
    else if (["ranked-bars", "diverging-bars", "dot-plot"].includes(s.layout)) {
      const items =
        s.layout === "ranked-bars"
          ? [...list].sort((a, b) => b.value - a.value)
          : list;
      const rowH = ah / items.length,
        labelW = iw * 0.26,
        plotX = pad + iw * 0.3,
        plotW = iw * 0.5;
      const limit = Math.max(
        1,
        s.chartMax,
        ...items.map((r) => Math.abs(r.value)),
      );
      const low =
        s.layout === "diverging-bars"
          ? -limit
          : Math.min(0, ...items.map((r) => r.value));
      const high =
        s.layout === "diverging-bars"
          ? limit
          : Math.max(1, s.chartMax, ...items.map((r) => r.value));
      const pos = (v) => plotX + ((v - low) / (high - low)) * plotW,
        zero = pos(0);
      items.forEach((r, i) => {
        const yy = top + i * rowH;
        text(
          r.label,
          pad,
          yy,
          labelW,
          rowH * 0.8,
          Math.min(32, (rowH / k) * 0.5),
        );
        const end = pos(r.value * p);
        if (s.layout === "dot-plot")
          rect(end - 7 * k, yy + rowH * 0.22, 14 * k, 14 * k, color(i));
        else
          rect(
            Math.min(zero, end),
            yy + rowH * 0.12,
            Math.abs(end - zero),
            rowH * 0.5,
            color(i),
          );
        text(
          number(r.value, false),
          pad + iw * 0.83,
          yy,
          iw * 0.17,
          rowH * 0.8,
          Math.min(32, (rowH / k) * 0.5),
          "right",
        );
      });
    } else if (s.layout === "share-bar") {
      if (list.some((r) => r.value < 0))
        text("Use positive values for shares", pad, top, iw, ah, 40);
      else {
        const sum = list.reduce((a, r) => a + r.value, 0);
        let x = pad;
        list.forEach((r, i) => {
          const ww = sum ? (iw * r.value) / sum : 0;
          rect(x, top, ww * p, ah * 0.3, color(i));
          x += ww;
        });
        const cols = portrait ? 2 : 3,
          cw = iw / cols,
          ch = (ah * 0.56) / Math.ceil(list.length / cols);
        list.forEach((r, i) => {
          const x = pad + (i % cols) * cw,
            y = top + ah * 0.44 + Math.floor(i / cols) * ch;
          text(
            `${sum ? Math.round((100 * r.value) / sum) : 0}%`,
            x,
            y,
            cw - gap,
            ch * 0.56,
            52,
          );
          box(r.label, x, y + ch * 0.6, cw - gap, 24);
        });
      }
    } else if (["line-chart", "area-chart"].includes(s.layout)) {
      const lo = Math.min(0, ...list.map((r) => r.value)),
        hi = Math.max(1, s.chartMax, ...list.map((r) => r.value));
      const ph = ah * 0.68,
        py = top + 40 * k,
        cell = iw / list.length,
        step = cell;
      const points = list.map((r, i) => ({
        x: pad + cell / 2 + i * step,
        y: py + ((hi - r.value * p) / (hi - lo)) * ph,
      }));
      ctx.fillStyle = s.accent;
      ctx.strokeStyle = s.accent;
      ctx.lineWidth = 3 * k;
      ctx.lineCap = "butt";
      ctx.setLineDash([3 * k, 6 * k]);
      ctx.beginPath();
      points.forEach((v, i) =>
        i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y),
      );
      if (s.layout === "area-chart") {
        ctx.lineTo(points.at(-1).x, py + (hi / (hi - lo)) * ph);
        ctx.lineTo(points[0].x, py + (hi / (hi - lo)) * ph);
        ctx.closePath();
        ctx.fill();
      } else ctx.stroke();
      points.forEach((v, i) => {
        rect(v.x - 5 * k, v.y - 5 * k, 10 * k, 10 * k, s.accent);
        const cell = iw / list.length;
        text(
          number(list[i].value, false),
          pad + i * cell,
          top,
          cell - 6 * k,
          32 * k,
          24,
          "center",
        );
        text(
          list[i].label,
          pad + i * cell,
          py + ph + 18 * k,
          cell - 6 * k,
          ah * 0.2,
          22,
          "center",
        );
      });
    } else if (["metric-list", "leaderboard"].includes(s.layout)) {
      const items =
        s.layout === "leaderboard"
          ? [...list].sort((a, b) => b.value - a.value)
          : list;
      const ch = ah / items.length;
      items.forEach((r, i) => {
        const yy = top + i * ch,
          offset = s.layout === "leaderboard" ? 80 * k : 0;
        if (offset) box(String(i + 1).padStart(2, "0"), pad, yy, 64 * k, 26);
        text(
          r.label,
          pad + offset,
          yy,
          iw * 0.6 - offset,
          ch * 0.85,
          Math.min(46, (ch / k) * 0.58),
        );
        text(
          number(r.value),
          pad + iw * 0.65,
          yy,
          iw * 0.35,
          ch * 0.85,
          Math.min(64, (ch / k) * 0.72),
          "right",
        );
      });
    } else if (s.layout === "metric-feature") {
      const lead = list[0];
      text(
        number(lead.value),
        pad,
        top,
        iw * (portrait ? 1 : 0.58),
        ah * (portrait ? 0.44 : 0.58),
        160,
      );
      box(lead.label, pad, top + ah * (portrait ? 0.46 : 0.61), iw * 0.58, 30);
      list.slice(1).forEach((r, i) => {
        const x = pad + (portrait ? i * iw * 0.5 : iw * 0.67),
          yy = top + ah * (portrait ? 0.64 : i * 0.5);
        text(
          number(r.value),
          x,
          yy,
          iw * (portrait ? 0.46 : 0.33),
          ah * 0.25,
          64,
        );
        box(
          r.label,
          x,
          yy + ah * (portrait ? 0.22 : 0.27),
          iw * (portrait ? 0.46 : 0.33),
          24,
        );
      });
    } else if (s.layout === "goal-blocks") {
      const cols = 2,
        cw = iw / cols,
        ch = ah / Math.ceil(list.length / cols),
        goal = s.chartMax || 100;
      list.forEach((r, i) => {
        const x = pad + (i % cols) * cw,
          yy = top + Math.floor(i / cols) * ch,
          ratio = clamp(r.value / goal);
        const side = Math.min(cw * 0.3, ch * 0.6);
        ctx.strokeStyle = s.fg;
        ctx.lineWidth = 2 * k;
        ctx.lineCap = "butt";
        ctx.setLineDash([2 * k, 4 * k]);
        rect(
          x + cw - side - gap,
          yy + side * (1 - ratio * p),
          side,
          side * ratio * p,
          s.accent,
        );
        ctx.strokeRect(x + cw - side - gap, yy, side, side);
        text(
          `${Math.round(ratio * p * 100)}%`,
          x,
          yy,
          cw - side - gap * 1.5,
          ch * 0.55,
          64,
        );
        box(r.label, x, yy + ch * 0.65, cw - gap, 26);
      });
    }
  }
  ctx.restore();
  return true;
}
