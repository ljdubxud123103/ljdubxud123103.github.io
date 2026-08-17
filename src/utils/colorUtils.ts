// HSV/RGB/HEX 转换函数

// RGB {r,g,b} 0-255 -> HSV {h:0-360, s:0-1, v:0-1}
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else if (max === bNorm) {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

// HEX "#RRGGBB" -> RGB {r,g,b}
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace(/^#/, '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return { r, g, b };
}

// RGB -> HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 计算两个色相之间的最小角度差 (0-180)
export function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return Math.min(diff, 360 - diff);
}

// 获取色相值对应的桶键名, 如 32 -> "30-44"
export function getHueBucketKey(hue: number): string {
  const bucketSize = 15;
  const start = Math.floor(hue / bucketSize) * bucketSize;
  const end = start + bucketSize - 1;
  return `${start}-${end}`;
}
