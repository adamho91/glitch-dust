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
