import type { Movie, ScreenshotColor } from '@/types';
import { hexToRgb, rgbToHex, rgbToHsv } from '@/utils/colorUtils';

export interface ImageColorProfile {
  palette: string[];
  dominantHue: number;
  saturation: number;
  brightness: number;
}

export interface ScreenshotMatch {
  movie: Movie;
  screenshot: ScreenshotColor;
  similarity: number;
}

interface ColorBucket {
  count: number;
  r: number;
  g: number;
  b: number;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('无法读取这张图片，请换一张重试。'));
    image.src = source;
  });
}

function colorDistance(a: string, b: string): number {
  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);
  return Math.hypot(colorA.r - colorB.r, colorA.g - colorB.g, colorA.b - colorB.b);
}

export async function extractImageColorProfile(source: string): Promise<ImageColorProfile> {
  const image = await loadImage(source);
  const maxSide = 144;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) throw new Error('当前浏览器无法分析图片颜色。');

  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const buckets = new Map<string, ColorBucket>();

  for (let index = 0; index < pixels.length; index += 8) {
    const alpha = pixels[index + 3];
    if (alpha < 180) continue;

    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max > 248 && min > 244) continue;
    if (max < 7) continue;

    const key = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const candidates = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .map((bucket) =>
      rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
    );

  const palette: string[] = [];
  for (const color of candidates) {
    if (palette.every((selected) => colorDistance(selected, color) > 42)) {
      palette.push(color);
    }
    if (palette.length === 5) break;
  }

  for (const color of candidates) {
    if (palette.length === 5) break;
    if (!palette.includes(color)) palette.push(color);
  }

  if (palette.length === 0) throw new Error('这张图片没有足够的可分析颜色。');
  while (palette.length < 5) palette.push(palette[palette.length - 1]);

  const dominantRgb = hexToRgb(palette[0]);
  const dominant = rgbToHsv(dominantRgb.r, dominantRgb.g, dominantRgb.b);

  return {
    palette,
    dominantHue: dominant.h,
    saturation: dominant.s,
    brightness: dominant.v,
  };
}

function hsvDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  const hsvA = rgbToHsv(rgbA.r, rgbA.g, rgbA.b);
  const hsvB = rgbToHsv(rgbB.r, rgbB.g, rgbB.b);
  const hueDiff = Math.min(Math.abs(hsvA.h - hsvB.h), 360 - Math.abs(hsvA.h - hsvB.h)) / 180;
  const hueWeight = 0.18 + Math.min(hsvA.s, hsvB.s) * 0.42;
  return hueDiff * hueWeight + Math.abs(hsvA.s - hsvB.s) * 0.24 + Math.abs(hsvA.v - hsvB.v) * 0.24;
}

function matchDistance(profile: ImageColorProfile, screenshot: ScreenshotColor): number {
  const hueDiff =
    Math.min(
      Math.abs(profile.dominantHue - screenshot.dominant_hue),
      360 - Math.abs(profile.dominantHue - screenshot.dominant_hue),
    ) / 180;
  const dominantDistance =
    hueDiff * (0.18 + profile.saturation * 0.34) +
    Math.abs(profile.saturation - screenshot.saturation) * 0.18 +
    Math.abs(profile.brightness - screenshot.brightness) * 0.18;

  const paletteDistance =
    profile.palette.reduce((sum, referenceColor) => {
      const nearest = Math.min(
        ...screenshot.palette.map((candidateColor) => hsvDistance(referenceColor, candidateColor)),
      );
      return sum + nearest;
    }, 0) / profile.palette.length;

  return dominantDistance * 0.58 + paletteDistance * 0.42;
}

export function matchScreenshots(
  profile: ImageColorProfile,
  movies: Movie[],
  limit = 60,
): ScreenshotMatch[] {
  const ranked = movies
    .flatMap((movie) =>
      movie.screenshots.map((screenshot) => ({
        movie,
        screenshot,
        distance: matchDistance(profile, screenshot),
      })),
    )
    .sort((a, b) => a.distance - b.distance);

  const selected: typeof ranked = [];
  const perMovie = new Map<string, number>();
  for (const candidate of ranked) {
    const count = perMovie.get(candidate.movie.id) ?? 0;
    if (count >= 6) continue;
    selected.push(candidate);
    perMovie.set(candidate.movie.id, count + 1);
    if (selected.length === limit) break;
  }

  return selected.map(({ movie, screenshot, distance }) => ({
    movie,
    screenshot,
    similarity: Math.max(0, Math.min(99, Math.round(100 - distance * 105))),
  }));
}
