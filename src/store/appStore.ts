import { create } from 'zustand';
import type { FavoriteItem, HueIndex, Movie, RecentItem, ScreenshotColor } from '@/types';

export function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

function loadFavorites(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem('cinepalette-favorites');
    return stored ? (JSON.parse(stored) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoriteItem[]): void {
  localStorage.setItem('cinepalette-favorites', JSON.stringify(favorites));
}

function loadRecent(): RecentItem[] {
  try {
    const stored = localStorage.getItem('cinepalette-recent');
    return stored ? (JSON.parse(stored) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(recent: RecentItem[]): void {
  localStorage.setItem('cinepalette-recent', JSON.stringify(recent));
}

interface AppState {
  movies: Movie[];
  hueIndex: HueIndex;
  isDataLoaded: boolean;

  selectedHue: number | null;
  setSelectedHue: (hue: number | null) => void;
  clearHueFilter: () => void;

  searchQuery: string;
  isSearchOpen: boolean;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  searchResults: Movie[];

  selectedScreenshot: { movie: Movie; screenshot: ScreenshotColor } | null;
  isDetailOpen: boolean;
  openDetail: (movie: Movie, screenshot: ScreenshotColor) => void;
  closeDetail: () => void;

  favorites: FavoriteItem[];
  addFavorite: (movieId: string, screenshotId: string) => void;
  removeFavorite: (movieId: string, screenshotId: string) => void;
  isFavorite: (movieId: string, screenshotId: string) => boolean;

  recentItems: RecentItem[];
  addRecent: (movieId: string, screenshotId: string) => void;
  clearRecent: () => void;

  loadData: (movies: Movie[], hueIndex: HueIndex) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  movies: [],
  hueIndex: {},
  isDataLoaded: false,

  selectedHue: null,
  setSelectedHue: (hue) => set({ selectedHue: hue }),
  clearHueFilter: () => set({ selectedHue: null }),

  searchQuery: '',
  isSearchOpen: false,
  setSearchQuery: (query) => {
    const q = query.toLowerCase().trim();
    if (q === '') {
      set({ searchQuery: query, searchResults: [] });
      return;
    }
    const { movies } = get();
    set({
      searchQuery: query,
      searchResults: movies.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q),
      ),
    });
  },
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  searchResults: [],

  selectedScreenshot: null,
  isDetailOpen: false,
  openDetail: (movie, screenshot) => {
    set({ selectedScreenshot: { movie, screenshot }, isDetailOpen: true });
    get().addRecent(movie.id, screenshot.id);
  },
  closeDetail: () => set({ selectedScreenshot: null, isDetailOpen: false }),

  favorites: loadFavorites(),
  recentItems: loadRecent(),
  addRecent: (movieId, screenshotId) => {
    const { recentItems } = get();
    const filtered = recentItems.filter(
      (r) => !(r.movieId === movieId && r.screenshotId === screenshotId),
    );
    const updated = [
      { movieId, screenshotId, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, 50);
    saveRecent(updated);
    set({ recentItems: updated });
  },
  clearRecent: () => {
    saveRecent([]);
    set({ recentItems: [] });
  },

  addFavorite: (movieId, screenshotId) => {
    const { favorites } = get();
    if (
      favorites.some(
        (f) => f.movieId === movieId && f.screenshotId === screenshotId,
      )
    ) {
      return;
    }
    const updated: FavoriteItem[] = [
      ...favorites,
      { movieId, screenshotId, addedAt: Date.now() },
    ];
    saveFavorites(updated);
    set({ favorites: updated });
  },
  removeFavorite: (movieId, screenshotId) => {
    const { favorites } = get();
    const updated = favorites.filter(
      (f) => !(f.movieId === movieId && f.screenshotId === screenshotId),
    );
    saveFavorites(updated);
    set({ favorites: updated });
  },
  isFavorite: (movieId, screenshotId) => {
    return get().favorites.some(
      (f) => f.movieId === movieId && f.screenshotId === screenshotId,
    );
  },

  loadData: (movies, hueIndex) => set({ movies, hueIndex, isDataLoaded: true }),
}));
