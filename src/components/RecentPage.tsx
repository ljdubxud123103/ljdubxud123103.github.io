import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';

export default function RecentPage({ embedded = false }: { embedded?: boolean }) {
  const openDetail = useAppStore(s => s.openDetail);
  const clearRecent = useAppStore(s => s.clearRecent);
  const recentItems = useAppStore(s => s.recentItems);
  const movies = useAppStore(s => s.movies);

  const recentScreenshots = useMemo(() => {
    const movieMap = new Map(movies.map(m => [m.id, m]));
    const results: { movie: typeof movies[number]; screenshot: typeof movies[number]['screenshots'][number] }[] = [];
    for (const r of recentItems) {
      const movie = movieMap.get(r.movieId);
      if (!movie) continue;
      const screenshot = movie.screenshots.find(s => s.id === r.screenshotId);
      if (!screenshot) continue;
      results.push({ movie, screenshot });
    }
    return results;
  }, [recentItems, movies]);

  if (recentScreenshots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ ...S.emptyContainer, ...(embedded ? S.emptyContainerEmbedded : {}) }}
      >
        <Clock size={44} weight="thin" color="var(--ink-faint)" />
        <div style={S.emptyTitle}>还没有浏览记录</div>
        <div style={S.emptySubtitle}>点击任意截图即可开始记录</div>
      </motion.div>
    );
  }

  return (
    <div style={{ ...S.page, ...(embedded ? S.pageEmbedded : {}) }}>
      <div style={{ ...S.header, ...(embedded ? S.headerEmbedded : {}) }}>
        {!embedded && <h2 style={S.title}>最近浏览</h2>}
        <button style={S.clearBtn} onClick={clearRecent}>
          清空
        </button>
      </div>

      <div style={S.grid}>
        {recentScreenshots.map(entry => (
          <motion.button
            type="button"
            key={`${entry.movie.id}::${entry.screenshot.id}`}
            style={S.gridItem}
            whileTap={{ scale: 0.97 }}
            onClick={() => openDetail(entry.movie, entry.screenshot)}
            aria-label={`查看 ${entry.movie.title} 截图`}
          >
            <img
              src={entry.screenshot.url}
              alt={entry.movie.title}
              loading="lazy"
              decoding="async"
              style={S.gridImage}
            />
            <div style={S.label}>{entry.movie.title}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    padding: '16px',
    paddingBottom: '84px',
    minHeight: 'calc(100dvh - 76px)',
    boxSizing: 'border-box',
  },
  pageEmbedded: {
    padding: 0,
    paddingBottom: 24,
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  headerEmbedded: {
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 21,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'var(--ink)',
  },
  clearBtn: {
    background: 'none',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 12px',
    fontSize: 12.5,
    fontWeight: 500,
    color: 'var(--ink-muted)',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },
  gridItem: {
    position: 'relative',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-raised)',
    width: '100%',
    padding: 0,
    border: 0,
    textAlign: 'left',
  },
  gridImage: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    display: 'block',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '20px 7px 6px',
    fontSize: 10,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.94)',
    background:
      'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: '70dvh',
    color: 'var(--ink-muted)',
  },
  emptyContainerEmbedded: {
    height: '48dvh',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginTop: 14,
    color: 'var(--ink-muted)',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: 'var(--ink-faint)',
  },
};
