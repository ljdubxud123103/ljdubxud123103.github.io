import type { Movie } from '@/types';

// 按电影名模糊匹配（不区分大小写，支持部分匹配）
export function searchByTitle(movies: Movie[], query: string): Movie[] {
  const lowerQuery = query.toLowerCase();
  return movies.filter((movie) => movie.title.toLowerCase().includes(lowerQuery));
}

// 按导演名模糊匹配
export function searchByDirector(movies: Movie[], query: string): Movie[] {
  const lowerQuery = query.toLowerCase();
  return movies.filter((movie) => movie.director.toLowerCase().includes(lowerQuery));
}

// 综合搜索（电影名+导演名），去重
export function searchMovies(movies: Movie[], query: string): Movie[] {
  const byTitle = searchByTitle(movies, query);
  const byDirector = searchByDirector(movies, query);

  const seen = new Set<string>();
  const result: Movie[] = [];

  for (const movie of [...byTitle, ...byDirector]) {
    if (!seen.has(movie.id)) {
      seen.add(movie.id);
      result.push(movie);
    }
  }

  return result;
}
