import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readDustPresets, applyDustPreset } from "../video-presets.mjs";
import { nodeOverlapsText } from "../video-text-clear.mjs";
import { timelineGeometry } from "../video-timeline.mjs";
import { easeOutQuad, easeInOutQuad } from "../video-motion.mjs";
import {
  starterProject,
  createScene,
  setSceneLayout,
  normalizeProject,
  duration,
  locate,
  sceneStart,
  transitionAt,
  mediaTime,
  mediaGeometry,
  renderScene,
  outputSize,
  random,
} from "../video-core.mjs";

test("adapted media preserves source proportions and keeps zoom inside the fitted frame", () => {
  const slot = [100, 50, 400, 600];
  for (const [iw, ih] of [[1600, 900], [900, 1600], [800, 800]]) {
    const s = createScene({ mediaFit: "adapt" });
    const {frame, image} = mediaGeometry(s, slot, iw, ih);
    assert.ok(Math.abs(frame[2] / frame[3] - iw / ih) < 1e-10);
    assert.ok(frame[0] >= slot[0] && frame[1] >= slot[1]);
    assert.ok(frame[2] <= slot[2] && frame[3] <= slot[3]);
    image.forEach((n, i) => assert.ok(Math.abs(n - frame[i]) < 1e-10));
    const zoom = mediaGeometry({...s, mediaZoom: 150}, slot, iw, ih);
    assert.deepEqual(zoom.frame, frame);
    assert.ok(zoom.image[2] > frame[2] && zoom.image[3] > frame[3]);
  }
  const project = starterProject();
  project.scenes[0].mediaFit = "adapt";
  assert.equal(normalizeProject(project).scenes[0].mediaFit, "adapt");
});

test("media darkening follows image bounds instead of painting letterbox margins", () => {
  for (const mediaFit of ["contain", "adapt", "cover"]) {
    const fills = [], images = [], bounds = [];
    const ctx = new Proxy({
      measureText: () => ({width: 0}),
      getTransform: () => ({a:2,b:0,c:0,d:2,e:10,f:20}),
      fillRect(...bounds) { fills.push({color:this.fillStyle, bounds}); },
      drawImage(el, ...bounds) { images.push(bounds); },
    }, {get: (target,key) => key in target ? target[key] : () => {}});
    const s = createScene({layout:"frame", mediaId:"test", mediaFit, mediaDim:40,
      pattern:"none", title:"", body:"", eyebrow:"", onMediaBounds:r=>bounds.push(r)});
    renderScene(ctx, s, 2, 720, 720, {element:{naturalWidth:1600,naturalHeight:900}});
    const dim = fills.find(f => f.color === "rgba(0,0,0,0.4)");
    assert.deepEqual(dim.bounds, images[0]);
    assert.equal(bounds.length, 1);
    assert.ok(bounds[0].x >= 110 && bounds[0].y >= 120);
    assert.ok(bounds[0].width <= 1240 && bounds[0].height <= 1240);
    if (mediaFit === "cover") assert.deepEqual(bounds[0], {x:110,y:120,width:1240,height:1240});
    if (mediaFit !== "cover") {
      assert.ok(dim.bounds[1] > 50);
      assert.ok(dim.bounds[3] < 620);
    }
  }
});

test("scene boundaries select the incoming scene without dropping the final frame", () => {
  const p = starterProject();
  assert.equal(duration(p), 15);
  assert.equal(sceneStart(p, 2), 10);
  assert.equal(locate(p, 4.999).index, 0);
  assert.equal(locate(p, 5).index, 1);
  assert.equal(locate(p, 5).local, 0);
  assert.equal(locate(p, 15).index, 2);
  assert.ok(locate(p, 15).local < 5);
  assert.equal(locate(p, -4).local, 0);
});
test("text exclusion removes whole overlapping primitives and persists its toggle", () => {
  const zones = [{ x: 100, y: 100, width: 200, height: 80 }];
  assert.equal(nodeOverlapsText({ x: 90, y: 140, size: 30 }, zones), true);
  assert.equal(nodeOverlapsText({ x: 60, y: 140, size: 80 }, zones), false);
  assert.equal(nodeOverlapsText({ x: 330, y: 140, size: 80 }, zones), true);
  assert.equal(nodeOverlapsText({ x: 200, y: 70, size: 20 }, zones), false);
  const p = starterProject();
  p.scenes[0].clearPattern = false;
  assert.equal(normalizeProject(p).scenes[0].clearPattern, false);
  delete p.scenes[0].clearPattern;
  assert.equal(normalizeProject(p).scenes[0].clearPattern, true);
});
test("chart clearance defaults on and persists independently of text clearance", () => {
  const scene = createScene({ layout: "waffle" });
  assert.equal(scene.clearGraphics, true);
  for (const clearGraphics of [false, true]) {
    for (const clearPattern of [false, true]) {
      const project = normalizeProject({
        version: 1,
        format: "wide",
        scenes: [{ ...scene, clearGraphics, clearPattern }],
      });
      const restored = normalizeProject(JSON.parse(JSON.stringify(project)))
        .scenes[0];
      assert.equal(restored.clearGraphics, clearGraphics);
      assert.equal(restored.clearPattern, clearPattern);
    }
  }
  delete scene.clearGraphics;
  assert.equal(
    normalizeProject({ version: 1, scenes: [scene] }).scenes[0].clearGraphics,
    true,
  );
});
test("Shift 1 and 2 preset libraries adapt to layouts without replacing scene content or timing", () => {
  const data = JSON.parse(
    readFileSync(new URL("../default-presets.json", import.meta.url)),
  );
  const presets = readDustPresets(data);
  assert.equal(presets.length, data.presets.length);
  const scene = createScene({
    layout: "bars",
    title: "Keep this headline",
    body: "Keep this prompt",
    duration: 7,
    mediaId: "my-clip",
    transition: "slide",
  });
  const original = JSON.stringify(data);
  for (const preset of presets) {
    const next = applyDustPreset(scene, preset);
    for (const key of [
      "id",
      "layout",
      "title",
      "body",
      "dataRows",
      "duration",
      "mediaId",
      "transition",
    ])
      assert.deepEqual(next[key], scene[key]);
    assert.equal(next.pattern, "dust");
    assert.equal(next.patternExplicit, true);
    assert.ok(next.megaTiers.every((t) => t >= 2 && t <= 8));
    assert.deepEqual(
      normalizeProject({ version: 1, format: "wide", scenes: [next] })
        .scenes[0],
      next,
    );
  }
  const preset = structuredClone(presets.find((p) => p.settings.text?.content));
  assert.ok(preset);
  preset.settings.text.enabled = true;
  assert.equal(
    applyDustPreset(scene, preset, true).title,
    preset.settings.text.content.slice(0, 500),
  );
  assert.equal(JSON.stringify(data), original);
  assert.equal(readDustPresets(presets[0].settings).length, 1);
  assert.throws(() => readDustPresets({ version: 1, scenes: [] }));
  const all = structuredClone(presets[0]);
  all.settings.tonalCount = "all";
  assert.equal(applyDustPreset(scene, all).colors.length, 12);
});
test("transitions stay inside incoming scene duration, including short scenes", () => {
  const p = starterProject();
  assert.equal(transitionAt(p, 5).blend, 0);
  assert.equal(transitionAt(p, 5.3).blend.toFixed(2), "0.50");
  assert.equal(transitionAt(p, 5.6).blend.toFixed(2), "1.00");
  assert.equal(transitionAt(p, 5.7).blend, 1);
  p.scenes[1].duration = 0.5;
  assert.equal(transitionAt(p, 5.2).blend, 1);
  p.scenes[1].transition = "cut";
  assert.equal(transitionAt(p, 5).blend, 1);
});
test("motion uses out quad entrances and symmetric transitions without overshoot", () => {
  assert.equal(easeOutQuad(0.5), 0.75);
  assert.equal(easeInOutQuad(0.25), 0.125);
  assert.equal(easeInOutQuad(0.5), 0.5);
  assert.equal(easeInOutQuad(0.75), 0.875);
  for (const curve of [easeOutQuad, easeInOutQuad]) {
    assert.equal(curve(-1), 0);
    assert.equal(curve(2), 1);
  }
  const p = starterProject();
  assert.ok(p.scenes.every((s) => s.entrance === 60));
  p.scenes[0].entrance = 85;
  p.scenes[1].entrance = 120;
  const restored = normalizeProject(p);
  assert.equal(restored.scenes[0].entrance, 60);
  assert.equal(restored.scenes[1].entrance, 120);
});
test("trimmed videos loop within the selected range or hold their last frame", () => {
  const s = starterProject().scenes[0];
  s.mediaStart = 2;
  assert.equal(mediaTime(s, 0, 5), 2);
  assert.equal(mediaTime(s, 3, 5), 2);
  assert.equal(mediaTime(s, 1, 5), 3);
  s.mediaLoop = false;
  assert.equal(mediaTime(s, 9, 5), 4.96);
  s.mediaStart = 20;
  assert.equal(mediaTime(s, 1, 5), 4.96);
  assert.equal(mediaTime(s, 1, NaN), 0);
});
test("storyboard geometry keeps scene edges and transition spans aligned at every zoom", () => {
  const p = starterProject();
  p.scenes[0].duration = 2;
  p.scenes[1].duration = 0.5;
  p.scenes[2].duration = 12;
  for (const zoom of [0, 1, 2, 4]) {
    const g = timelineGeometry(p, 800, zoom);
    assert.equal(g.total, 14.5);
    assert.equal(g.segments[1].left, g.segments[0].width);
    assert.equal(g.segments[2].start, 2.5);
    assert.equal(g.segments[0].transition, 0);
    assert.equal(g.segments[1].transition, 0.5 / 3);
    assert.equal(g.segments[2].transition, 0.6);
    assert.ok(
      Math.abs(g.segments.at(-1).left + g.segments.at(-1).width - g.width) <
        1e-9,
    );
    assert.equal(g.ticks.at(-1), g.total);
  }
  p.scenes[1].duration = 4;
  p.scenes[1].transition = "cut";
  const changed = timelineGeometry(p, 800, 2);
  assert.equal(changed.segments[2].start, 6);
  assert.equal(changed.segments[1].transition, 0);
});
test("output sizes preserve common aspect ratios and produce even H.264 dimensions", () => {
  assert.deepEqual(outputSize("wide", 1080), [1920, 1080]);
  assert.deepEqual(outputSize("portrait", 1080), [1080, 1920]);
  assert.deepEqual(outputSize("social", 1080), [1080, 1350]);
  assert.deepEqual(outputSize("wide", 2160), [3840, 2160]);
});
test("procedural seeds reproduce identical frames while different seeds vary", () => {
  const a = random(24),
    b = random(24),
    c = random(25);
  const aa = Array.from({ length: 100 }, a),
    bb = Array.from({ length: 100 }, b),
    cc = Array.from({ length: 100 }, c);
  assert.deepEqual(aa, bb);
  assert.notDeepEqual(aa, cc);
  assert.ok(aa.every((v) => v >= 0 && v < 1));
});
test("project import clamps unsafe dimensions/timing and rejects malformed projects", () => {
  const p = starterProject();
  p.scenes[0].duration = -5;
  p.scenes[0].density = Infinity;
  p.scenes[0].scale = 0;
  p.scenes[0].layout = "unknown";
  p.scenes[1].id = p.scenes[0].id;
  p.scenes[0].bg = "url(malicious)";
  p.scenes[0].title = "a".repeat(900);
  const v = normalizeProject(p);
  assert.equal(v.scenes[0].duration, 0.5);
  assert.equal(v.scenes[0].scale, 12);
  assert.equal(v.scenes[0].layout, "hero");
  assert.equal(v.scenes[0].title.length, 500);
  assert.notEqual(v.scenes[0].id, v.scenes[1].id);
  assert.match(v.scenes[0].bg, /^#[0-9a-f]{6}$/i);
  assert.throws(() => normalizeProject({ version: 1, scenes: [] }));
  assert.throws(() => normalizeProject({ version: 4, scenes: [{}] }));
  assert.throws(() => normalizeProject({ version: 1, scenes: [null] }));
});
test("project roundtrip preserves composition settings and local media references", () => {
  const p = starterProject();
  p.scenes[0].mediaId = "example-clip";
  p.scenes[0].font = "Focal Upright";
  p.scenes[0].treatment = "highlight";
  p.scenes[1].treatment = "background";
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(p))), p);
});

const { diffusionNodes, sizeMultiplier } = await import(
  "../video-diffusion.mjs"
);
test("diffusion respects node caps and square/circle primitives with deterministic seeds", () => {
  const s = starterProject().scenes[0];
  s.maxNodes = 35;
  s.density = 100;
  s.fadeDirection = "none";
  s.sweepDepth = 0;
  const nodes = diffusionNodes(s, 1, 1280, 720);
  assert.ok(nodes.length > 0 && nodes.length <= 35);
  assert.deepEqual(nodes, diffusionNodes(s, 1, 1280, 720));
  assert.ok(
    nodes.every(
      (n) => ["square", "circle"].includes(n.shape) && Number.isFinite(n.size),
    ),
  );
  s.primitive = "squares";
  assert.ok(diffusionNodes(s, 1, 1280, 720).every((n) => n.shape === "square"));
  s.primitive = "circles";
  assert.ok(diffusionNodes(s, 1, 1280, 720).every((n) => n.shape === "circle"));
});
test("node scale limits and rarity tiers follow the original Glitch Dust rules", () => {
  const s = starterProject().scenes[0];
  Object.assign(s, {
    megaRarity: 0,
    shapeMin: 100,
    shapeMax: 100,
    fadeDirection: "none",
    density: 100,
  });
  assert.ok(diffusionNodes(s, 1, 1280, 720).every((n) => n.size === s.scale));
  for (let i = 0; i < 100; i++) assert.equal(sizeMultiplier(i, 2, s), 1);
  s.megaRarity = 100;
  s.megaTiers = [2, 8];
  let small = 0,
    large = 0;
  for (let i = 0; i < 10000; i++) {
    const mult = sizeMultiplier(i % 100, Math.floor(i / 100), s);
    assert.ok([1, 2, 8].includes(mult));
    if (mult === 2) small++;
    if (mult === 8) large++;
  }
  assert.ok(small > large * 4 && large > 0);
  s.megaTiers = [];
  assert.equal(sizeMultiplier(12, 8, s), 1);
});
test("older video projects adopt Focal and diffusion without losing content", () => {
  const p = starterProject();
  Object.assign(p.scenes[0], {
    font: "Georgia",
    pattern: "orbit",
    footer: true,
    title: "Keep my words",
  });
  const next = normalizeProject(p);
  assert.equal(next.scenes[0].font, "Focal Upright");
  assert.equal(next.scenes[0].pattern, "dust");
  assert.equal(next.scenes[0].footer, false);
  assert.equal(next.scenes[0].title, "Keep my words");
});

const { EXTRA_LAYOUTS, parseDataRows, chartDomain, renderExtraLayout } =
  await import("../video-layouts.mjs");
test("data layouts pass the chosen opacity through without hidden dimming", () => {
  for (const opacity of [0, 25, 100]) {
    let observed;
    renderExtraLayout(
      {},
      createScene({
        layout: "waffle",
        dataRows: "",
        title: "",
        body: "",
        opacity,
      }),
      1,
      1280,
      720,
      null,
      {
        headline: () => 0,
        drawPrompt: () => 0,
        media: () => {},
        pattern: (_, scene) => {
          observed = scene.opacity;
        },
      },
    );
    assert.equal(observed, opacity);
  }
});
test("forty-five extra layouts retain editable data through save/open", () => {
  assert.equal(EXTRA_LAYOUTS.length, 45);
  assert.equal(new Set(EXTRA_LAYOUTS.map((l) => l[0])).size, 45);
  const project = starterProject();
  for (const [id] of EXTRA_LAYOUTS) {
    setSceneLayout(project.scenes[0], id);
    project.scenes[0].dataRows = "Loss | -12.5\nGain | 34";
    project.scenes[0].valueSuffix = "%";
    project.scenes[0].dataDecimals = 1;
    assert.deepEqual(
      normalizeProject(JSON.parse(JSON.stringify(project))),
      project,
    );
  }
});
test("non-cover layouts default to no pattern and explicit choices survive layout changes and restore", () => {
  const s = createScene();
  assert.equal(s.pattern, "dust");
  for (const layout of [
    "split",
    "frame",
    "editorial",
    "prompt",
    ...EXTRA_LAYOUTS.map(([id]) => id),
  ]) {
    assert.equal(createScene({ layout }).pattern, "none");
    setSceneLayout(s, layout);
    assert.equal(s.pattern, "none");
  }
  setSceneLayout(s, "poster");
  assert.equal(s.pattern, "dust");
  const p = starterProject();
  p.scenes[1] = createScene({ layout: "bars", pattern: "dust" });
  setSceneLayout(p.scenes[1], "columns");
  assert.equal(p.scenes[1].pattern, "dust");
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(p))), p);
  delete p.scenes[1].patternExplicit;
  assert.equal(normalizeProject(p).scenes[1].pattern, "none");
  const off = createScene({ pattern: "none" });
  setSceneLayout(off, "poster");
  assert.equal(off.pattern, "none");
});
test("chart rows validate numbers, bounds, and limits without inventing missing values", () => {
  assert.deepEqual(parseDataRows("First | -12.5\nSecond | 0").rows, [
    { label: "First", value: -12.5 },
    { label: "Second", value: 0 },
  ]);
  assert.deepEqual(
    parseDataRows("Missing |\nBad | NaN\nExtra | 1 | 2\nGood | 40").errors,
    [1, 2, 3],
  );
  assert.equal(
    parseDataRows(
      Array.from({ length: 9 }, (_, i) => `Item ${i} | ${i}`).join("\n"),
    ).rows.length,
    8,
  );
  assert.equal(parseDataRows("Huge | 10000000000000").rows.length, 0);
  assert.deepEqual(chartDomain([{ value: -20 }, { value: 60 }]), {
    low: -20,
    high: 60,
  });
  assert.deepEqual(chartDomain([{ value: 0 }]), { low: 0, high: 1 });
  assert.deepEqual(chartDomain([{ value: 200 }], 100), { low: 0, high: 200 });
});
