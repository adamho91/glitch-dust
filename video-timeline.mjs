import { duration, transitionLength } from "./video-core.mjs?v=14";

export function timelineGeometry(project, viewport, zoom = 0) {
  const total = duration(project);
  const width = Math.max(1, viewport, zoom ? total * 32 * zoom : 0);
  const scale = width / total;
  let start = 0;
  const segments = project.scenes.map((scene, index) => {
    const segment = {
      start,
      left: start * scale,
      width: scene.duration * scale,
      transition: index ? transitionLength(scene) : 0,
    };
    start += scene.duration;
    return segment;
  });
  const target = 90 / scale;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= target);
  const ticks = [];
  for (let i = 0; i * step < total; i++) ticks.push(i * step);
  // Keep room for the final duration label.
  if (ticks.length && (total - ticks.at(-1)) * scale < 100) ticks.pop();
  ticks.push(total);
  return { total, width, scale, segments, ticks };
}
