import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilmStrip } from '@phosphor-icons/react';
import { useAppStore, hueDistance } from '@/store/appStore';
import ScreenshotCard from './ScreenshotCard';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
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

export default function ScreenshotGrid() {
  const movies = useAppStore(s => s.movies);
  const selectedHue = useAppStore(s => s.selectedHue);
  const openDetail = useAppStore(s => s.openDetail);

  const items = useMemo(() => {
    const all: { movie: typeof movies[number]; screenshot: typeof movies[number]['screenshots'][number] }[] = [];
    for (const movie of movies) {
      for (const screenshot of movie.screenshots) {
        all.push({ movie, screenshot });
      }
    }
    if (selectedHue === null) return all;
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

  const leftItems = items.filter((_, i) => i % 2 === 0);
  const rightItems = items.filter((_, i) => i % 2 === 1);

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
          {leftItems.map((item) => (
            <motion.div key={item.screenshot.id} variants={itemVariants} layout>
              <ScreenshotCard
                movie={item.movie}
                screenshot={item.screenshot}
                onClick={openDetail}
              />
            </motion.div>
          ))}
        </div>
        <div style={styles.column}>
          {rightItems.map((item) => (
            <motion.div key={item.screenshot.id} variants={itemVariants} layout>
              <ScreenshotCard
                movie={item.movie}
                screenshot={item.screenshot}
                onClick={openDetail}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
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
