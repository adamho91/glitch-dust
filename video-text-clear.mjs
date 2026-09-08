// Measure the actual layout without painting. Keeping the original scene renderer
// as the source of geometry covers every layout, alignment, and canvas format.
export function measureTextZones(ctx, draw, padding, includeText = true) {
  const zones = [];
  const noPaint = new Set([
    "fill",
    "stroke",
    "fillRect",
    "strokeRect",
    "clearRect",
    "drawImage",
    "strokeText",
    "putImageData",
    "clip",
  ]);
  ctx.save();
  ctx.resetTransform();
  const probe = new Proxy(ctx, {
    get(target, key) {
      if (key === "fillText")
        return (text, x, y, maxWidth) => {
          if (!includeText || !String(text).trim()) return;
          const m = target.measureText(text);
          const scale = maxWidth && m.width > maxWidth ? maxWidth / m.width : 1;
          const left = x - m.actualBoundingBoxLeft * scale;
          const right = x + m.actualBoundingBoxRight * scale;
          const top = y - m.actualBoundingBoxAscent;
          const bottom = y + m.actualBoundingBoxDescent;
          const matrix = target.getTransform();
          const corners = [
            [left, top],
            [right, top],
            [left, bottom],
            [right, bottom],
          ].map(([px, py]) => ({
            x: matrix.a * px + matrix.c * py + matrix.e,
            y: matrix.b * px + matrix.d * py + matrix.f,
          }));
          const xs = corners.map((p) => p.x),
            ys = corners.map((p) => p.y);
          zones.push({
            x: Math.min(...xs) - padding,
            y: Math.min(...ys) - padding,
            width: Math.max(...xs) - Math.min(...xs) + padding * 2,
            height: Math.max(...ys) - Math.min(...ys) + padding * 2,
          });
        };
      if (noPaint.has(key)) return () => {};
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
    set(target, key, value) {
      Reflect.set(target, key, value, target);
      return true;
    },
  });
  try {
    draw(probe);
  } finally {
    ctx.restore();
  }
  return zones;
}

export function nodeOverlapsText(node, zones) {
  const half = node.size / 2;
  return zones.some(
    (r) =>
      node.x - half < r.x + r.width &&
      node.x + half > r.x &&
      node.y - half < r.y + r.height &&
      node.y + half > r.y,
  );
}
