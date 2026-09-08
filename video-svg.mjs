// Record the shared canvas renderer as editable SVG shapes and live Focal text.
// Only placed photos and the current video frame are embedded raster images.
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
const num = (value) => Number(Number(value).toFixed(5));
export function createSvgContext(width, height, measurementContext) {
  const ctx = measurementContext;
  const elements = [],
    defs = [],
    stack = [];
  let path = "",
    clips = [],
    id = 0;
  const transform = () => {
    const m = ctx.getTransform();
    return `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(num).join(" ")})`;
  };
  const append = (markup) => {
    let output = markup;
    for (const clip of clips)
      output = `<g clip-path="url(#${clip})">${output}</g>`;
    elements.push(output);
  };
  const style = (stroke) => {
    const dash = stroke ? ctx.getLineDash() : [];
    return `fill="${stroke ? "none" : esc(ctx.fillStyle)}"${stroke ? ` stroke="${esc(ctx.strokeStyle)}" stroke-width="${num(ctx.lineWidth)}" stroke-linecap="${ctx.lineCap}" stroke-linejoin="${ctx.lineJoin}"${dash.length ? ` stroke-dasharray="${dash.map(num).join(" ")}" stroke-dashoffset="${num(ctx.lineDashOffset)}"` : ""}` : ""} opacity="${num(ctx.globalAlpha)}" transform="${transform()}"`;
  };
  const rectPath = (x, y, w, h, r = 0) => {
    r = Math.max(0, Math.min(Number(r) || 0, Math.abs(w) / 2, Math.abs(h) / 2));
    if (!r) return `M${x} ${y}h${w}v${h}h${-w}Z`;
    return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
  };
  const api = {
    save() {
      stack.push([...clips]);
      ctx.save();
    },
    restore() {
      if (stack.length) {
        clips = stack.pop();
        ctx.restore();
      }
    },
    beginPath() {
      path = "";
    },
    closePath() {
      path += "Z";
    },
    moveTo(x, y) {
      path += `M${x} ${y}`;
    },
    lineTo(x, y) {
      path += `L${x} ${y}`;
    },
    rect(x, y, w, h) {
      path += rectPath(x, y, w, h);
    },
    roundRect(x, y, w, h, r) {
      path += rectPath(x, y, w, h, Array.isArray(r) ? r[0] : r);
    },
    arc(x, y, r, start, end, ccw = false) {
      const sweep = ccw ? 0 : 1,
        delta = Math.abs(end - start);
      const sx = x + r * Math.cos(start),
        sy = y + r * Math.sin(start);
      path += `M${sx} ${sy}`;
      if (delta >= Math.PI * 2 - 1e-6)
        path += `A${r} ${r} 0 1 ${sweep} ${x - r * Math.cos(start)} ${y - r * Math.sin(start)}A${r} ${r} 0 1 ${sweep} ${sx} ${sy}`;
      else
        path += `A${r} ${r} 0 ${delta > Math.PI ? 1 : 0} ${sweep} ${x + r * Math.cos(end)} ${y + r * Math.sin(end)}`;
    },
    fill(rule = "nonzero") {
      append(
        `<path d="${path}" fill-rule="${rule === "evenodd" ? "evenodd" : "nonzero"}" ${style(false)}/>`,
      );
    },
    stroke() {
      append(`<path d="${path}" ${style(true)}/>`);
    },
    fillRect(x, y, w, h) {
      append(`<path d="${rectPath(x, y, w, h)}" ${style(false)}/>`);
    },
    strokeRect(x, y, w, h) {
      append(`<path d="${rectPath(x, y, w, h)}" ${style(true)}/>`);
    },
    clip() {
      const name = `clip${id++}`;
      defs.push(
        `<clipPath id="${name}" clipPathUnits="userSpaceOnUse"><path d="${path}" transform="${transform()}"/></clipPath>`,
      );
      clips.push(name);
    },
    fillText(text, x, y, maxWidth) {
      if (!String(text)) return;
      const m = ctx.measureText(text);
      // Baseline metrics depend on the current canvas baseline. Compare the same
      // glyphs at alphabetic baseline to retain exact Focal placement in SVG.
      const baseline = ctx.textBaseline;
      ctx.textBaseline = "alphabetic";
      const alphabetic = ctx.measureText(text);
      ctx.textBaseline = baseline;
      y += alphabetic.actualBoundingBoxAscent - m.actualBoundingBoxAscent;
      const anchor =
        {
          left: "start",
          start: "start",
          center: "middle",
          right: "end",
          end: "end",
        }[ctx.textAlign] || "start";
      const font = ctx.font.match(/^(.*?)\s*([\d.]+)px\s+(.+)$/);
      const weight = font?.[1]?.trim() || "400";
      const size = font?.[2] || "16";
      append(
        `<text x="${num(x)}" y="${num(y)}" text-anchor="${anchor}" font-family="Focal Upright, Focal, sans-serif" font-size="${size}" font-weight="${esc(weight)}" letter-spacing="${esc(ctx.letterSpacing || "0px")}" xml:space="preserve"${m.width > 0 ? ` textLength="${num(Math.min(maxWidth || m.width, m.width))}" lengthAdjust="${maxWidth && m.width > maxWidth ? "spacingAndGlyphs" : "spacing"}"` : ""} ${style(false)}>${esc(text)}</text>`,
      );
    },
    drawImage(image, ...args) {
      const iw = image.videoWidth || image.naturalWidth || image.width,
        ih = image.videoHeight || image.naturalHeight || image.height;
      const raster = document.createElement("canvas");
      raster.width = iw;
      raster.height = ih;
      raster.getContext("2d").drawImage(image, 0, 0, iw, ih);
      let x, y, w, h;
      if (args.length === 2) [x, y, w, h] = [...args, iw, ih];
      else if (args.length === 4) [x, y, w, h] = args;
      else throw Error("This media crop cannot be exported as SVG.");
      append(
        `<image x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" preserveAspectRatio="none" href="${raster.toDataURL("image/png")}" opacity="${num(ctx.globalAlpha)}" transform="${transform()}"/>`,
      );
    },
  };
  return {
    context: new Proxy(ctx, {
      get(target, key) {
        if (key in api) return api[key];
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target, key, value) {
        Reflect.set(target, key, value, target);
        return true;
      },
    }),
    serialize(title = "Video slide", fontData = "") {
      const font = fontData
        ? `<style>@font-face{font-family:'Focal Upright';src:url('${fontData}') format('truetype');font-weight:100 900;}</style>`
        : "";
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${esc(title)}</title><defs>${font}${defs.join("")}</defs>${elements.join("")}</svg>`;
    },
  };
}
