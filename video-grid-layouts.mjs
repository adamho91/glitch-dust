// Further compositions built from the existing Focal, prompt and square system.
export const GRID_LAYOUTS = [
  ["title-caption", "Title + caption", "type"],
  ["numbered-story", "Numbered story", "type"],
  ["paired-statements", "Paired statements", "type"],
  ["prompt-grid", "Prompt grid", "type"],
  ["reading-column", "Reading column", "type"],
  ["media-right", "Image right", "media"],
  ["media-bottom", "Image bottom", "media"],
  ["media-crops", "Two crops", "media"],
  ["media-corner", "Image corner", "media"],
  ["waterfall", "Waterfall", "data"],
  ["square-stems", "Square stems", "data"],
  ["goal-bars", "Goal bars", "data"],
  ["funnel", "Funnel", "data"],
  ["delta", "Change", "data"],
  ["area-squares", "Area squares", "data"],
];
export const GRID_DATA_LIMITS = {
  waterfall: 6,
  "square-stems": 6,
  "goal-bars": 4,
  funnel: 5,
  delta: 2,
  "area-squares": 6,
};
export function renderGridLayout(ctx, s, t, w, h, asset, helpers, rows) {
  const def = GRID_LAYOUTS.find(([id]) => id === s.layout);
  if (!def) return false;
  const { headline, drawPrompt, media, text, number, color, p } = helpers;
  const k = Math.min(w, h) / 720,
    pad = 50 * k,
    gap = 28 * k,
    iw = w - 2 * pad,
    ih = h - 2 * pad,
    portrait = h > w;
  const title = (x, y, ww, hh, size = 100) =>
    headline(
      ctx,
      { ...s, fontSize: (size * s.fontSize) / 124 },
      t,
      [x, y, ww, hh],
      k,
    );
  const prose = (str, x, y, ww, hh, size = 38) =>
    headline(
      ctx,
      {
        ...s,
        title: str,
        tracking: 0,
        fontSize: size,
        weight: 400,
        animation: "none",
        treatment: "solid",
      },
      t,
      [x, y, ww, hh],
      k,
    );
  const caption = (str, x, y, ww, hh, size = 28) => {
    if (!str) return;
    let style = { ...s, promptSize: size, align: "left" };
    for (
      let i = 0;
      i < 45 && drawPrompt(ctx, style, str, t, 0, 0, ww, k, true) > hh;
      i++
    )
      style = {
        ...style,
        promptSize: style.promptSize * 0.92,
        promptPadding: style.promptPadding * 0.92,
        promptGap: style.promptGap * 0.92,
      };
    drawPrompt(ctx, style, str, t, x, y, ww, k);
  };
  const rect = (x, y, ww, hh, fill = s.accent) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, Math.max(0, ww), Math.max(0, hh));
  };
  const frame = (x, y, ww, hh, overrides = {}) =>
    media(ctx, { ...s, ...overrides }, asset, [x, y, ww, hh]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, iw, ih);
  ctx.clip();
  if (def[2] === "type") {
    if (s.layout === "title-caption") {
      title(pad, pad, iw, ih * 0.63, 154);
      caption(
        s.body,
        pad + iw * (portrait ? 0 : 0.5),
        pad + ih * 0.78,
        iw * (portrait ? 1 : 0.5),
        ih * 0.22,
        34,
      );
    } else if (s.layout === "numbered-story") {
      // The index is explicitly editable through the existing eyebrow field.
      text(
        s.eyebrow || "01",
        pad,
        pad,
        iw * (portrait ? 1 : 0.25),
        ih * 0.24,
        140,
      );
      const x = pad + iw * (portrait ? 0 : 0.33),
        y = pad + ih * (portrait ? 0.31 : 0.1),
        ww = iw * (portrait ? 1 : 0.67);
      title(x, y, ww, ih * 0.39, 106);
      caption(s.body, x, pad + ih * 0.77, ww, ih * 0.23, 32);
    } else if (s.layout === "paired-statements") {
      title(
        pad,
        pad,
        iw * (portrait ? 1 : 0.46),
        ih * (portrait ? 0.43 : 0.86),
        112,
      );
      prose(
        s.body,
        pad + iw * (portrait ? 0 : 0.54),
        pad + ih * (portrait ? 0.57 : 0.15),
        iw * (portrait ? 1 : 0.46),
        ih * (portrait ? 0.43 : 0.72),
        68,
      );
    } else if (s.layout === "prompt-grid") {
      title(pad, pad, iw, ih * 0.24, 84);
      const entries = s.body
          .split("\n")
          .filter((x) => x.trim())
          .slice(0, 4),
        cw = (iw - gap) / 2,
        ch = ih * 0.29;
      entries.forEach((entry, i) =>
        caption(
          entry,
          pad + (i % 2) * (cw + gap),
          pad + ih * 0.37 + Math.floor(i / 2) * (ch + ih * 0.04),
          cw,
          ch,
          42,
        ),
      );
    } else {
      title(
        pad,
        pad,
        iw * (portrait ? 1 : 0.37),
        ih * (portrait ? 0.3 : 0.7),
        88,
      );
      prose(
        s.body,
        pad + iw * (portrait ? 0 : 0.47),
        pad + ih * (portrait ? 0.4 : 0.08),
        iw * (portrait ? 1 : 0.53),
        ih * (portrait ? 0.6 : 0.84),
        44,
      );
    }
  } else if (def[2] === "media") {
    if (s.layout === "media-right") {
      frame(
        pad + iw * (portrait ? 0 : 0.44),
        pad,
        iw * (portrait ? 1 : 0.56),
        ih * (portrait ? 0.53 : 1),
      );
      const y = pad + ih * (portrait ? 0.6 : 0.13),
        ww = iw * (portrait ? 1 : 0.37);
      title(pad, y, ww, ih * (portrait ? 0.23 : 0.46), 92);
      caption(
        s.body,
        pad,
        pad + ih * (portrait ? 0.89 : 0.73),
        ww,
        ih * (portrait ? 0.11 : 0.27),
        26,
      );
    } else if (s.layout === "media-bottom") {
      title(pad, pad, iw * (portrait ? 1 : 0.65), ih * 0.25, 88);
      caption(
        s.body,
        pad + iw * (portrait ? 0 : 0.72),
        pad + ih * (portrait ? 0.27 : 0.03),
        iw * (portrait ? 1 : 0.28),
        ih * (portrait ? 0.1 : 0.22),
        26,
      );
      frame(pad, pad + ih * 0.43, iw, ih * 0.57);
    } else if (s.layout === "media-crops") {
      title(pad, pad, iw, ih * 0.23, 88);
      const cw = (iw - gap) / 2;
      frame(pad, pad + ih * 0.32, cw, ih * 0.5, {
        mediaZoom: Math.max(130, s.mediaZoom),
        mediaX: 20,
      });
      frame(pad + cw + gap, pad + ih * 0.32, cw, ih * 0.5, {
        mediaZoom: Math.max(130, s.mediaZoom),
        mediaX: 80,
      });
      caption(s.body, pad, pad + ih * 0.89, iw, ih * 0.11, 26);
    } else {
      const side = Math.min(iw * (portrait ? 0.8 : 0.48), ih * 0.59);
      frame(pad + iw - side, pad, side, side);
      title(pad, pad + ih * 0.64, iw, ih * 0.24, 94);
      caption(s.body, pad, pad + ih * 0.92, iw, ih * 0.08, 24);
    }
  } else {
    const list = rows.slice(0, GRID_DATA_LIMITS[s.layout]),
      top = pad + ih * 0.27,
      ah = ih * 0.57;
    title(pad, pad, iw, ih * 0.2, 64);
    caption(s.body, pad, pad + ih * 0.9, iw, ih * 0.1, 26);
    if (!list.length) {
      text("Add your data", pad, top, iw, ah, 48);
      ctx.restore();
      return true;
    }
    helpers.reserveGraphic?.([pad, top, iw, ah]);
    if (s.layout === "waterfall") {
      let total = 0;
      const steps = list.map((r) => {
        const from = total;
        total += r.value;
        return { ...r, from, to: total };
      });
      const lo = Math.min(0, ...steps.map((r) => r.to)),
        hi = Math.max(1, s.chartMax, ...steps.map((r) => r.to)),
        plotTop = top + ah * 0.14,
        plotH = ah * 0.64,
        cw = iw / list.length;
      const pos = (v) => plotTop + ((hi - v) / (hi - lo)) * plotH;
      steps.forEach((r, i) => {
        const a = pos(r.from),
          b = pos(r.from + r.value * p),
          x = pad + i * cw;
        rect(
          x + cw * 0.17,
          Math.min(a, b),
          cw * 0.66,
          Math.abs(a - b),
          color(i),
        );
        text(number(r.value), x, top, cw - 4 * k, ah * 0.12, 24, "center");
        text(r.label, x, top + ah * 0.84, cw - 4 * k, ah * 0.16, 22, "center");
      });
    } else if (s.layout === "square-stems") {
      const lo = Math.min(0, ...list.map((r) => r.value)),
        hi = Math.max(1, s.chartMax, ...list.map((r) => r.value)),
        cw = iw / list.length,
        ph = ah * 0.66,
        py = top + ah * 0.14,
        zero = py + (hi / (hi - lo)) * ph;
      list.forEach((r, i) => {
        const x = pad + (i + 0.5) * cw,
          y = py + ((hi - r.value * p) / (hi - lo)) * ph;
        rect(
          x - 1.5 * k,
          Math.min(zero, y),
          3 * k,
          Math.abs(zero - y),
          color(i),
        );
        rect(x - 7 * k, y - 7 * k, 14 * k, 14 * k, color(i));
        text(
          number(r.value),
          pad + i * cw,
          top,
          cw - 4 * k,
          ah * 0.12,
          24,
          "center",
        );
        text(
          r.label,
          pad + i * cw,
          top + ah * 0.85,
          cw - 4 * k,
          ah * 0.15,
          22,
          "center",
        );
      });
    } else if (s.layout === "goal-bars") {
      const goal = s.chartMax || 100,
        max = Math.max(goal, ...list.map((r) => Math.max(0, r.value))),
        rh = ah / list.length;
      if (list.some((r) => r.value < 0))
        text("Use nonnegative values for goals", pad, top, iw, ah, 38);
      else
        list.forEach((r, i) => {
          const y = top + i * rh,
            barY = y + rh * 0.51,
            barW = iw * 0.81;
          text(r.label, pad, y, iw * 0.68, rh * 0.35, 28);
          text(
            number(r.value),
            pad + iw * 0.72,
            y,
            iw * 0.28,
            rh * 0.35,
            30,
            "right",
          );
          ctx.save();
          ctx.globalAlpha = 0.12;
          rect(pad, barY, barW, rh * 0.18, s.fg);
          ctx.restore();
          rect(pad, barY, ((barW * r.value) / max) * p, rh * 0.18, color(i));
          rect(
            pad + (barW * goal) / max - 1.5 * k,
            barY - rh * 0.08,
            3 * k,
            rh * 0.34,
            s.fg,
          );
          text(
            number(goal, false),
            pad + iw * 0.84,
            barY,
            iw * 0.16,
            rh * 0.25,
            22,
            "right",
          );
        });
    } else if (s.layout === "funnel") {
      if (list.some((r) => r.value < 0))
        text("Use nonnegative values for a funnel", pad, top, iw, ah, 38);
      else {
        const max = Math.max(1, s.chartMax, ...list.map((r) => r.value)),
          rh = ah / list.length,
          plotX = pad + iw * 0.29,
          plotW = iw * 0.48;
        list.forEach((r, i) => {
          const y = top + i * rh,
            ww = ((plotW * r.value) / max) * p;
          text(r.label, pad, y, iw * 0.25, rh * 0.8, 28);
          rect(
            plotX + (plotW - ww) / 2,
            y + rh * 0.06,
            ww,
            rh * 0.65,
            color(i),
          );
          text(
            number(r.value),
            pad + iw * 0.81,
            y,
            iw * 0.19,
            rh * 0.8,
            30,
            "right",
          );
        });
      }
    } else if (s.layout === "delta") {
      if (list.length < 2)
        text("Add a before and after value", pad, top, iw, ah, 40);
      else {
        const change = list[1].value - list[0].value;
        text(
          (change > 0 ? "+" : "") + number(change),
          pad,
          top,
          iw,
          ah * 0.5,
          150,
        );
        list.forEach((r, i) => {
          const x = pad + i * iw * 0.53;
          text(number(r.value), x, top + ah * 0.59, iw * 0.47, ah * 0.2, 48);
          caption(r.label, x, top + ah * 0.84, iw * 0.47, ah * 0.16, 26);
        });
      }
    } else {
      if (list.some((r) => r.value < 0))
        text("Use nonnegative values for areas", pad, top, iw, ah, 38);
      else {
        const cols = portrait ? 2 : 3,
          cw = iw / cols,
          ch = ah / Math.ceil(list.length / cols),
          max = Math.max(1, s.chartMax, ...list.map((r) => r.value));
        list.forEach((r, i) => {
          const x = pad + (i % cols) * cw,
            y = top + Math.floor(i / cols) * ch,
            side =
              Math.min(cw * 0.38, ch * 0.57) * Math.sqrt(r.value / max) * p;
          rect(x + cw * 0.5, y, side, side, color(i));
          text(number(r.value), x, y, cw * 0.45, ch * 0.5, 48);
          caption(r.label, x, y + ch * 0.69, cw - gap, ch * 0.24, 24);
        });
      }
    }
  }
  ctx.restore();
  return true;
}
