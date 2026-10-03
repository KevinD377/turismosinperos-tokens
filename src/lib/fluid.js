export const FLUID_MIN_VW = 375;
export const FLUID_MAX_VW = 1280;

export function rem(px) {
  return `${Number((px / 16).toFixed(4))}rem`;
}

export function fluid(minPx, maxPx) {
  if (minPx > maxPx) throw new Error(`fluid: min (${minPx}) mayor que max (${maxPx})`);
  const slope = (maxPx - minPx) / (FLUID_MAX_VW - FLUID_MIN_VW);
  const intercept = minPx - FLUID_MIN_VW * slope;
  return `clamp(${rem(minPx)}, ${(intercept / 16).toFixed(3)}rem + ${(slope * 100).toFixed(3)}vw, ${rem(maxPx)})`;
}
