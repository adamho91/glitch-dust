import test from "node:test";
import assert from "node:assert/strict";
import { suggestChart, chartNumber } from "../video-chart-import.mjs";
import { createSvgContext } from "../video-svg.mjs";
const line = (text, x, y, width = 0.08, height = 0.05) => ({
  text,
  x,
  y,
  width,
  height,
  confidence: 1,
});
test("screenshot pairs visible values with labels in column order", () => {
  const result = suggestChart([
    line("92", 0.84, 0),
    line("Design", 0.11, 0.8),
    line("42", 0.12, 0),
    line("Video", 0.83, 0.8),
    line("68", 0.48, 0),
    line("Motion", 0.47, 0.8),
  ]);
  assert.deepEqual(
    result.rows.map((r) => [r.label, r.value]),
    [
      ["Design", 42],
      ["Motion", 68],
      ["Video", 92],
    ],
  );
  assert.equal(result.layout, "columns");
  assert.equal(result.title, "");
});
test("screenshot supports horizontal rows and formatted numbers without estimating marks", () => {
  const result = suggestChart([
    line("Latency", 0.1, 0.02, 0.3, 0.08),
    line("Model A", 0.1, 0.3),
    line("1,200", 0.7, 0.3),
    line("Model B", 0.1, 0.6),
    line("−42", 0.7, 0.6),
  ]);
  assert.deepEqual(
    result.rows.map((r) => r.value),
    [1200, -42],
  );
  assert.equal(result.layout, "bars");
  assert.equal(result.title, "Latency");
  assert.equal(
    suggestChart([line("Design", 0.1, 0.8), line("Motion", 0.5, 0.8)]).rows
      .length,
    0,
  );
  assert.deepEqual(chartNumber("$1.2k"), {
    value: 1200,
    prefix: "$",
    suffix: "",
  });
  assert.equal(chartNumber("unknown"), null);
  assert.equal(
    suggestChart([line("Design 42%", 0.1, 0.2), line("Motion 68ms", 0.1, 0.4)])
      .mixedUnits,
    true,
  );
});
test("SVG keeps live text, escapes markup and restores clip state", () => {
  const native = {
    globalAlpha: 1,
    fillStyle: "#5718c0",
    strokeStyle: "#111111",
    lineWidth: 2,
    lineCap: "butt",
    lineJoin: "miter",
    font: '500 32px "Focal Upright"',
    letterSpacing: "0px",
    textAlign: "left",
    textBaseline: "top",
    save() {},
    restore() {},
    getTransform() {
      return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    },
    measureText() {
      return {
        width: 80,
        actualBoundingBoxAscent: this.textBaseline === "top" ? -4 : 22,
        actualBoundingBoxDescent: 3,
      };
    },
  };
  const recorder = createSvgContext(720, 720, native),
    ctx = recorder.context;
  ctx.save();
  ctx.beginPath();
  ctx.rect(10, 10, 100, 100);
  ctx.clip();
  ctx.fillText("<chart & stat>", 20, 20);
  ctx.restore();
  ctx.fillRect(200, 200, 10, 10);
  const svg = recorder.serialize("A & B");
  assert.match(svg, /<text[^>]* y="46"/);
  assert.match(svg, /&lt;chart &amp; stat&gt;/);
  assert.match(svg, /letter-spacing="0px"/);
  assert.match(svg, /<clipPath/);
  assert.match(svg, /<\/g><path d="M200/);
  assert.doesNotMatch(svg, /<image/);
});

const { EXTRA_LAYOUTS, renderExtraLayout } = await import(
  "../video-layouts.mjs"
);
const { createScene } = await import("../video-core.mjs");
test("all chart layouts use zero tracking without changing stored headline settings", () => {
  for (const [layout, , group] of EXTRA_LAYOUTS) {
    if (group !== "data") continue;
    const scene = createScene({ layout, tracking: -3 }),
      drawn = [];
    const ctx = new Proxy(
      { measureText: (text) => ({ width: String(text).length * 8 }) },
      { get: (target, key) => (key in target ? target[key] : () => {}) },
    );
    renderExtraLayout(ctx, scene, 2, 1280, 720, null, {
      headline: (_ctx, s) => {
        drawn.push(s);
        return 20;
      },
      drawPrompt: () => 20,
      media: () => {},
      pattern: () => {},
    });
    assert.ok(drawn.length, layout);
    assert.ok(
      drawn.every((s) => s.tracking === 0),
      layout,
    );
    assert.equal(scene.tracking, -3);
    if (layout === "line-chart")
      assert.ok(drawn.find((s) => s.title === "Design").fontSize < 30);
  }
});

const { pixelAlignedRect } = await import("../video-pixel-grid.mjs");
test("tile edges snap to buffer pixels under preview, export and thumbnail scales", () => {
  for (const scale of [1, 1.5, 0.225]) {
    const m = { a: scale, b: 0, c: 0, d: scale, e: 0.4, f: 0.7 };
    const [x, y, w, h] = pixelAlignedRect(m, 26.5, 79.5, 106, 106);
    for (const edge of [
      x * scale + m.e,
      (x + w) * scale + m.e,
      y * scale + m.f,
      (y + h) * scale + m.f,
    ])
      assert.ok(Math.abs(edge - Math.round(edge)) < 1e-8);
    assert.ok(Math.abs(w - 106) <= 1 / scale);
  }
  assert.deepEqual(
    pixelAlignedRect(
      { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
      0.1,
      0.2,
      0.4,
      0.4,
    ),
    [0.1, 0.2, 0.4, 0.4],
  );
  assert.deepEqual(
    pixelAlignedRect({ a: 1, b: 1, c: 0, d: 1, e: 0, f: 0 }, 0.5, 0.5, 20, 20),
    [0.5, 0.5, 20, 20],
  );
});

const { GRID_LAYOUTS, GRID_DATA_LIMITS } = await import(
  "../video-grid-layouts.mjs"
);
test("15 new layouts expose bounded data and reserve chart space in every format", () => {
  assert.equal(GRID_LAYOUTS.length, 15);
  for (const [layout, , group] of GRID_LAYOUTS) {
    if (group !== "data") continue;
    assert.ok(GRID_DATA_LIMITS[layout] >= 2 && GRID_DATA_LIMITS[layout] <= 6);
    for (const [w, h] of [
      [1280, 720],
      [720, 1280],
      [720, 720],
      [720, 900],
    ]) {
      const zones = [],
        marks = [];
      const ctx = new Proxy(
        {
          measureText: (text) => ({ width: String(text).length * 8 }),
          fillRect: (...r) => marks.push(r),
        },
        { get: (target, key) => (key in target ? target[key] : () => {}) },
      );
      renderExtraLayout(
        ctx,
        createScene({ layout, dataRows: "Before | 0\nAfter | 42" }),
        2,
        w,
        h,
        null,
        {
          headline: () => 20,
          drawPrompt: () => 20,
          media: () => {},
          pattern: () => {},
          reserveGraphic: (r) => zones.push(r),
        },
      );
      assert.equal(zones.length, 1, layout);
      assert.ok(marks.flat().every(Number.isFinite), layout);
      const [x, y, ww, hh] = zones[0];
      assert.ok(x >= 0 && y >= 0 && x + ww <= w && y + hh <= h, layout);
    }
  }
});
