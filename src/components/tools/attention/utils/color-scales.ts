// Color scales for attention heatmap visualization

export type ColorScale = 'viridis' | 'magma' | 'blues' | 'reds' | 'inferno' | 'plasma';

export const COLOR_SCALES: Record<ColorScale, [number, number, number][]> = {
  viridis: [
    [68, 1, 84], [72, 35, 116], [64, 67, 135], [52, 94, 141],
    [41, 120, 142], [32, 144, 140], [34, 167, 132], [68, 190, 112],
    [121, 209, 81], [189, 222, 38], [253, 231, 37],
  ],
  magma: [
    [0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129],
    [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 140],
    [254, 234, 195], [252, 253, 191],
  ],
  blues: [
    [8, 48, 107], [8, 81, 156], [33, 113, 181], [66, 146, 198],
    [107, 174, 214], [158, 202, 225], [198, 219, 239], [222, 235, 247],
    [247, 251, 255],
  ],
  reds: [
    [103, 0, 13], [165, 15, 21], [203, 24, 29], [239, 59, 44],
    [251, 106, 74], [252, 146, 114], [252, 187, 161], [254, 224, 210],
    [255, 245, 240],
  ],
  inferno: [
    [0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99],
    [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164],
  ],
  plasma: [
    [13, 8, 135], [75, 3, 161], [125, 3, 168], [168, 34, 150],
    [203, 70, 121], [229, 107, 93], [248, 148, 65], [253, 195, 40],
    [240, 249, 33],
  ],
};

export function interpolateColor(scale: ColorScale, t: number): string {
  const colors = COLOR_SCALES[scale];
  const clampedT = Math.max(0, Math.min(1, t));
  const idx = clampedT * (colors.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, colors.length - 1);
  const frac = idx - lo;
  const r = Math.round(colors[lo][0] + frac * (colors[hi][0] - colors[lo][0]));
  const g = Math.round(colors[lo][1] + frac * (colors[hi][1] - colors[lo][1]));
  const b = Math.round(colors[lo][2] + frac * (colors[hi][2] - colors[lo][2]));
  return `rgb(${r},${g},${b})`;
}

/** Get CSS color string with alpha */
export function interpolateColorAlpha(scale: ColorScale, t: number, alpha: number): string {
  const colors = COLOR_SCALES[scale];
  const clampedT = Math.max(0, Math.min(1, t));
  const idx = clampedT * (colors.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, colors.length - 1);
  const frac = idx - lo;
  const r = Math.round(colors[lo][0] + frac * (colors[hi][0] - colors[lo][0]));
  const g = Math.round(colors[lo][1] + frac * (colors[hi][1] - colors[lo][1]));
  const b = Math.round(colors[lo][2] + frac * (colors[hi][2] - colors[lo][2]));
  return `rgba(${r},${g},${b},${alpha})`;
}
