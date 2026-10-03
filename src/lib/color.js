const HEX = /^#([0-9a-f]{6})$/i;

export function hexToRgb(hex) {
  const match = HEX.exec(hex);
  if (!match) throw new Error(`Color hex inválido: ${hex}`);
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function composite(rgb, alpha, bgRgb) {
  return rgb.map((channel, i) => Math.round(channel * alpha + bgRgb[i] * (1 - alpha)));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(rgbA, rgbB) {
  const a = luminance(rgbA);
  const b = luminance(rgbB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function cssColor({ hex, rgb, alpha }) {
  return alpha === 1 ? hex : `rgb(${rgb.join(" ")} / ${alpha})`;
}

export function rnColor({ hex, rgb, alpha }) {
  return alpha === 1 ? hex : `rgba(${rgb.join(", ")}, ${alpha})`;
}

const round4 = (n) => Math.round(n * 10000) / 10000;

export function figmaColor({ rgb, alpha }) {
  const [r, g, b] = rgb.map((channel) => round4(channel / 255));
  return { r, g, b, a: alpha };
}
