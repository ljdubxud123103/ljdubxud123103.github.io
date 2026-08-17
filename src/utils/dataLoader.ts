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

// 同步版本 - 利用 Vite 对静态 JSON import 的同步支持
import moviesData from '../../data/movies.json';
import hueIndexData from '../../data/hue_index.json';

export function getMovies(): MovieDB {
  return moviesData as MovieDB;
}

export function getHueIndex(): HueIndex {
  return hueIndexData as HueIndex;
}
