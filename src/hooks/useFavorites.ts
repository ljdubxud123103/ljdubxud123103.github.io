import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Movie, ScreenshotColor } from '@/types';

export function useFavorites() {
  const favorites = useAppStore(s => s.favorites);
  const movies = useAppStore(s => s.movies);
  const addFavorite = useAppStore(s => s.addFavorite);
  const removeFavorite = useAppStore(s => s.removeFavorite);
  const isFavorite = useAppStore(s => s.isFavorite);

  const favoriteScreenshots = useMemo(() => {
    const movieMap = new Map(movies.map(m => [m.id, m]));
    const results: { movie: Movie; screenshot: ScreenshotColor }[] = [];
    for (const fav of favorites) {
      const movie = movieMap.get(fav.movieId);
      if (!movie) continue;
      const screenshot = movie.screenshots.find(s => s.id === fav.screenshotId);
      if (!screenshot) continue;
      results.push({ movie, screenshot });
    }
    return results;
  }, [favorites, movies]);

  const groupedByMovie = useMemo(() => {
    const grouped: Record<string, { movie: Movie; screenshot: ScreenshotColor }[]> = {};
    for (const item of favoriteScreenshots) {
      if (!grouped[item.movie.id]) {
        grouped[item.movie.id] = [];
      }
      grouped[item.movie.id].push(item);
    }
    return grouped;
  }, [favoriteScreenshots]);

  const toggleFavorite = (movieId: string, screenshotId: string) => {
    if (isFavorite(movieId, screenshotId)) {
      removeFavorite(movieId, screenshotId);
    } else {
      addFavorite(movieId, screenshotId);
    }
  };

  return {
    favorites,
    favoriteCount: favorites.length,
    favoriteScreenshots,
    groupedByMovie,
    isFavorite,
    toggleFavorite,
  };
}
