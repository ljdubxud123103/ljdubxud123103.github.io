import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmStrip } from '@phosphor-icons/react';
import { useAppStore, hueDistance } from '@/store/appStore';
import ScreenshotCard from './ScreenshotCard';
import type { Movie, ScreenshotColor } from '@/types';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};

const INITIAL_ITEM_COUNT = 60;
const LOAD_BATCH_SIZE = 60;
const COLOR_BAND_ROWS = 2;

type GridItem = { movie: Movie; screenshot: ScreenshotColor };
type ColorBand = 'red' | 'yellow' | 'green' | 'blue' | 'violet' | 'neutral';

const COLOR_BAND_ORDER: ColorBand[] = ['red', 'yellow', 'green', 'blue', 'violet', 'neutral'];
const COLOR_BAND_CENTERS: Partial<Record<ColorBand, number>> = {
  red: 0,
  yellow: 52,
  green: 122,
  blue: 210,
  violet: 292,
};

function getColorBand(screenshot: ScreenshotColor): ColorBand {
  if (screenshot.saturation < 0.18) return 'neutral';

  const hue = ((screenshot.dominant_hue % 360) + 360) % 360;
  if (hue < 24 || hue >= 336) return 'red';
  if (hue < 80) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 250) return 'blue';
  return 'violet';
}

function getBandStrength(item: GridItem, band: ColorBand): number {
  const { brightness, dominant_hue: hue, saturation } = item.screenshot;
  if (band === 'neutral') {
    return (1 - saturation) * 0.8 + (1 - Math.abs(brightness - 0.48)) * 0.2;
  }

  const center = COLOR_BAND_CENTERS[band] ?? hue;
  const hueClarity = 1 - hueDistance(hue, center) / 180;
  const usableBrightness = 1 - Math.abs(brightness - 0.52);
  return saturation * 0.62 + hueClarity * 0.28 + usableBrightness * 0.1;
}

function rankBandItems(items: GridItem[], band: ColorBand): GridItem[] {
  const byMovie = new Map<string, GridItem[]>();
  items.forEach((item) => {
    const movieItems = byMovie.get(item.movie.id) ?? [];
    movieItems.push(item);
    byMovie.set(item.movie.id, movieItems);
  });

  const movieQueues = [...byMovie.values()]
    .map((queue) => queue.sort((a, b) => getBandStrength(b, band) - getBandStrength(a, band)))
    .sort((a, b) => getBandStrength(b[0], band) - getBandStrength(a[0], band));

  const ranked: GridItem[] = [];
  while (movieQueues.some((queue) => queue.length > 0)) {
    movieQueues.forEach((queue) => {
      const next = queue.shift();
      if (next) ranked.push(next);
    });
  }
  return ranked;
}

function arrangeColorBands(items: GridItem[], columnCount: number): GridItem[] {
  const buckets = Object.fromEntries(
    COLOR_BAND_ORDER.map((band) => [band, [] as GridItem[]]),
  ) as Record<ColorBand, GridItem[]>;

  items.forEach((item) => buckets[getColorBand(item.screenshot)].push(item));
  COLOR_BAND_ORDER.forEach((band) => {
    buckets[band] = rankBandItems(buckets[band], band);
  });

  const blockSize = columnCount * COLOR_BAND_ROWS;
  const arranged: GridItem[] = [];
  while (COLOR_BAND_ORDER.some((band) => buckets[band].length > 0)) {
    COLOR_BAND_ORDER.forEach((band) => {
      arranged.push(...buckets[band].splice(0, blockSize));
    });
  }
  return arranged;
}

function getColumnCount() {
  if (typeof window === 'undefined') return 2;
  if (window.innerWidth >= 1700) return 5;
  if (window.innerWidth >= 1400) return 4;
  if (window.innerWidth >= 1100) return 3;
  return 2;
}

export default function ScreenshotGrid() {
  const movies = useAppStore(s => s.movies);
  const selectedHue = useAppStore(s => s.selectedHue);
  const openDetail = useAppStore(s => s.openDetail);
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEM_COUNT);
  const [columnCount, setColumnCount] = useState(getColumnCount);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQueries = [1100, 1400, 1700].map((width) =>
      window.matchMedia(`(min-width: ${width}px)`),
    );
    const updateColumns = () => setColumnCount(getColumnCount());
    updateColumns();
    mediaQueries.forEach((media) => media.addEventListener('change', updateColumns));
    return () => {
      mediaQueries.forEach((media) => media.removeEventListener('change', updateColumns));
    };
  }, []);

  const items = useMemo(() => {
    const all: GridItem[] = [];
    for (const movie of movies) {
      for (const screenshot of movie.screenshots) {
        all.push({ movie, screenshot });
      }
    }

    if (selectedHue === null) {
      const interleaved: typeof all = [];
      const longestMovie = Math.max(0, ...movies.map((movie) => movie.screenshots.length));
      for (let screenshotIndex = 0; screenshotIndex < longestMovie; screenshotIndex++) {
        for (const movie of movies) {
          const screenshot = movie.screenshots[screenshotIndex];
          if (screenshot) interleaved.push({ movie, screenshot });
        }
      }
      return arrangeColorBands(interleaved, columnCount);
    }

    const filtered = all.filter(
      ({ screenshot }) => hueDistance(screenshot.dominant_hue, selectedHue) <= 15,
    );
    filtered.sort(
      (a, b) =>
        hueDistance(a.screenshot.dominant_hue, selectedHue) -
        hueDistance(b.screenshot.dominant_hue, selectedHue),
    );
    return filtered;
  }, [columnCount, movies, selectedHue]);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_ITEM_COUNT, items.length));
  }, [movies, selectedHue]);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + LOAD_BATCH_SIZE, items.length));
  }, [items.length]);

  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (!hasMore) return;

    if (!('IntersectionObserver' in window)) {
      setVisibleCount(items.length);
      return;
    }

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '800px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore, items.length]);

  const visibleItems = items.slice(0, visibleCount);
  const columns = useMemo(() => {
    const nextColumns = Array.from({ length: columnCount }, () => [] as {
      item: typeof visibleItems[number];
      itemIndex: number;
    }[]);

    visibleItems.forEach((item, itemIndex) => {
      nextColumns[itemIndex % columnCount].push({ item, itemIndex });
    });

    return nextColumns;
  }, [columnCount, visibleItems]);

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={styles.emptyContainer}
      >
        <FilmStrip size={44} weight="thin" color="var(--ink-faint)" />
        <p style={styles.emptyText}>暂无匹配截图</p>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedHue ?? 'all'}
          className="screenshot-grid"
          aria-label={selectedHue === null ? '按色系分组的电影截图' : '筛选后的电影截图'}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="screenshot-grid__column">
              {column.map(({ item, itemIndex }) => (
                <motion.div
                  key={item.screenshot.id}
                  className="screenshot-grid__item"
                  data-color-band={getColorBand(item.screenshot)}
                  variants={itemVariants}
                >
                  <ScreenshotCard
                    movie={item.movie}
                    screenshot={item.screenshot}
                    onClick={openDetail}
                    eager={itemIndex < columnCount * COLOR_BAND_ROWS}
                  />
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      {hasMore && (
        <div ref={loadMoreRef} style={styles.loadMore} aria-hidden="true">
          <span style={styles.loadMoreCount}>
            {visibleItems.length} / {items.length}
          </span>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadMore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingBottom: 12,
  },
  loadMoreCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--ink-faint)',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '100px 16px',
    color: 'var(--ink-muted)',
  },
  emptyText: {
    fontSize: 14,
    color: 'var(--ink-muted)',
  },
};
