import { create } from 'zustand';
import type {
  FavoriteItem,
  HueIndex,
  Movie,
  ProjectBoard,
  RecentItem,
  ScreenshotColor,
} from '@/types';

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

function loadProjectBoards(): ProjectBoard[] {
  try {
    const stored = localStorage.getItem('cinepalette-project-boards');
    return stored ? (JSON.parse(stored) as ProjectBoard[]) : [];
  } catch {
    return [];
  }
}

function saveProjectBoards(boards: ProjectBoard[]): void {
  localStorage.setItem('cinepalette-project-boards', JSON.stringify(boards));
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

  projectBoards: ProjectBoard[];
  createProjectBoard: (name: string) => string;
  renameProjectBoard: (boardId: string, name: string) => void;
  deleteProjectBoard: (boardId: string) => void;
  addToProjectBoard: (boardId: string, movieId: string, screenshotId: string) => void;
  removeFromProjectBoard: (boardId: string, movieId: string, screenshotId: string) => void;
  isInProjectBoard: (boardId: string, movieId: string, screenshotId: string) => boolean;

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

  projectBoards: loadProjectBoards(),
  createProjectBoard: (name) => {
    const trimmedName = name.trim() || '未命名项目';
    const id = `board-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const updated = [
      ...get().projectBoards,
      { id, name: trimmedName, createdAt: now, updatedAt: now, items: [] },
    ];
    saveProjectBoards(updated);
    set({ projectBoards: updated });
    return id;
  },
  renameProjectBoard: (boardId, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const updated = get().projectBoards.map((board) =>
      board.id === boardId
        ? { ...board, name: trimmedName, updatedAt: Date.now() }
        : board,
    );
    saveProjectBoards(updated);
    set({ projectBoards: updated });
  },
  deleteProjectBoard: (boardId) => {
    const updated = get().projectBoards.filter((board) => board.id !== boardId);
    saveProjectBoards(updated);
    set({ projectBoards: updated });
  },
  addToProjectBoard: (boardId, movieId, screenshotId) => {
    const now = Date.now();
    const updated = get().projectBoards.map((board) => {
      if (board.id !== boardId) return board;
      if (
        board.items.some(
          (item) => item.movieId === movieId && item.screenshotId === screenshotId,
        )
      ) {
        return board;
      }
      return {
        ...board,
        updatedAt: now,
        items: [...board.items, { movieId, screenshotId, addedAt: now }],
      };
    });
    saveProjectBoards(updated);
    set({ projectBoards: updated });
  },
  removeFromProjectBoard: (boardId, movieId, screenshotId) => {
    const updated = get().projectBoards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            updatedAt: Date.now(),
            items: board.items.filter(
              (item) => !(item.movieId === movieId && item.screenshotId === screenshotId),
            ),
          }
        : board,
    );
    saveProjectBoards(updated);
    set({ projectBoards: updated });
  },
  isInProjectBoard: (boardId, movieId, screenshotId) =>
    get().projectBoards.some(
      (board) =>
        board.id === boardId &&
        board.items.some(
          (item) => item.movieId === movieId && item.screenshotId === screenshotId,
        ),
    ),

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
