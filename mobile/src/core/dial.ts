/** Unwrap the twelve-o'clock seam; continued revolutions keep adding time. */
export function angleDelta(current: number, previous: number) {
  "worklet";
  let delta = current - previous;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}
export function dialValue(
  value: number,
  step: number,
  min: number,
  max: number,
) {
  "worklet";
  return Math.min(max, Math.max(min, Math.round(value / step) * step));
}
