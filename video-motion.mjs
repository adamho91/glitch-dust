// Shared by preview and export; time is normalized and clamped at both ends.
export const MOTION_SECONDS = 0.6;
const unit = (t) => Math.min(1, Math.max(0, t));
export function easeOutQuad(t) {
  const p = unit(t);
  return 1 - (1 - p) * (1 - p);
}
export function easeInOutQuad(t) {
  const p = unit(t);
  return p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
}

// One continuous typewriter clock; each word rises for the selected entrance length
// after its first character appears. Prefix counts include spaces, never layout widths.
export function wordEntrance(time, start, length, total, seconds = MOTION_SECONDS) {
  const duration = Math.max(0.01, seconds);
  const count = Math.max(0, Math.min(length, Math.floor(easeOutQuad(time / duration) * total) - start));
  const begins = duration * (1 - Math.sqrt(1 - Math.min(1, start / Math.max(1,total))));
  return {count, progress: easeOutQuad((time - begins) / duration)};
}
