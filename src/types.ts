// 截图色彩数据
export interface ScreenshotColor {
  id: string;
  url: string;
  dominant_hue: number;      // 0-360
  dominant_color: string;    // #RRGGBB
  palette: string[];         // 5色调色板 [#RRGGBB, ...]
  saturation: number;        // 0-1
  brightness: number;        // 0-1
}

// 电影数据
export interface Movie {
  id: string;
  title: string;
  director: string;
  year: number;
  slug: string;
  cast?: string[];
  cinematographer?: string;
  screenshots: ScreenshotColor[];
}

// 电影数据库
export interface MovieDB {
  movies: Movie[];
}

// 色相倒排索引
export type HueIndex = Record<string, string[]>;

// 应用视图
export type AppView = 'main' | 'detail' | 'favorites';

// 收藏项
export interface FavoriteItem {
  movieId: string;
  screenshotId: string;
  addedAt: number; // timestamp
}

// 最近浏览项
export interface RecentItem {
  movieId: string;
  screenshotId: string;
  viewedAt: number; // timestamp
}
