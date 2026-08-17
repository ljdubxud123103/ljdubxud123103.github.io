import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmStrip } from '@phosphor-icons/react';
import { useAppStore, hueDistance } from '@/store/appStore';
import ScreenshotCard from './ScreenshotCard';

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

const INITIAL_ITEM_COUNT = 48;
const LOAD_BATCH_SIZE = 48;

export default function ScreenshotGrid() {
  const movies = useAppStore(s => s.movies);
  const selectedHue = useAppStore(s => s.selectedHue);
  const openDetail = useAppStore(s => s.openDetail);
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEM_COUNT);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const all: { movie: typeof movies[number]; screenshot: typeof movies[number]['screenshots'][number] }[] = [];
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
      return interleaved;
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
  }, [movies, selectedHue]);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_ITEM_COUNT, items.length));
  }, [items]);

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
  const leftItems = visibleItems.filter((_, i) => i % 2 === 0);
  const rightItems = visibleItems.filter((_, i) => i % 2 === 1);

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
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={styles.grid}
        >
          <div style={styles.column}>
            {leftItems.map((item, index) => (
              <motion.div key={item.screenshot.id} variants={itemVariants}>
                <ScreenshotCard
                  movie={item.movie}
                  screenshot={item.screenshot}
                  onClick={openDetail}
                  eager={index < 2}
                />
              </motion.div>
            ))}
          </div>
          <div style={styles.column}>
            {rightItems.map((item, index) => (
              <motion.div key={item.screenshot.id} variants={itemVariants}>
                <ScreenshotCard
                  movie={item.movie}
                  screenshot={item.screenshot}
                  onClick={openDetail}
                  eager={index < 2}
                />
              </motion.div>
            ))}
          </div>
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
  grid: {
    display: 'flex',
    gap: '8px',
    padding: '14px 16px',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
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
