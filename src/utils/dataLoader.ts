import type { MovieDB, HueIndex } from '@/types';

// 异步版本 - 使用动态 import
export async function loadMovies(): Promise<MovieDB> {
  const data = await import('../../data/movies.json');
  return data.default || data;
}

export async function loadHueIndex(): Promise<HueIndex> {
  const data = await import('../../data/hue_index.json');
  return data.default || data;
}
