import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, GridFour, ListBullets, Check, TrashSimple } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';
import { useFavorites } from '@/hooks/useFavorites';
import type { Movie, ScreenshotColor } from '@/types';

type ViewMode = 'grid' | 'grouped';

interface FavoriteEntry {
  movie: Movie;
  screenshot: ScreenshotColor;
}

export default function FavoritesPage({ embedded = false }: { embedded?: boolean }) {
  const openDetail = useAppStore(s => s.openDetail);
  const removeFavorite = useAppStore(s => s.removeFavorite);
  const { favoriteScreenshots, groupedByMovie, favoriteCount } = useFavorites();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const favoriteScreenshotsList = favoriteScreenshots;

  const keyFor = (entry: FavoriteEntry) => `${entry.movie.id}::${entry.screenshot.id}`;

  const toggleSelect = (entry: FavoriteEntry) => {
    const key = keyFor(entry);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isSelected = (entry: FavoriteEntry) => selectedIds.has(keyFor(entry));

  const handleDeleteSelected = () => {
    for (const key of selectedIds) {
      const [movieId, screenshotId] = key.split('::');
      removeFavorite(movieId, screenshotId);
    }
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleCancelSelect = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleClickEntry = (entry: FavoriteEntry) => {
    if (selectMode) {
      toggleSelect(entry);
    } else {
      openDetail(entry.movie, entry.screenshot);
    }
  };

  if (favoriteCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ ...S.emptyContainer, ...(embedded ? S.emptyContainerEmbedded : {}) }}
      >
        <Heart size={44} weight="thin" color="var(--ink-faint)" />
        <div style={S.emptyTitle}>还没有收藏的截图</div>
        <div style={S.emptySubtitle}>在详情页点击心形按钮收藏喜欢的截图</div>
      </motion.div>
    );
  }

  const renderCheckbox = (entry: FavoriteEntry) =>
    selectMode ? (
      <div
        style={{ ...S.checkbox, ...(isSelected(entry) ? S.checkboxChecked : {}) }}
        aria-hidden="true"
      >
        {isSelected(entry) && <Check size={13} weight="bold" color="#fff" />}
      </div>
    ) : null;

  return (
    <div style={{ ...S.page, ...(embedded ? S.pageEmbedded : {}) }}>
      <div style={{ ...S.header, ...(embedded ? S.headerEmbedded : {}) }}>
        {!embedded && <h2 style={S.title}>收藏夹</h2>}
        <div style={S.headerActions}>
          {selectMode ? (
            <button style={S.selectBtn} onClick={handleCancelSelect}>
              取消
            </button>
          ) : favoriteScreenshotsList.length > 0 ? (
            <button style={S.selectBtn} onClick={() => setSelectMode(true)}>
              选择
            </button>
          ) : null}
          <button
            style={{ ...S.viewBtn, ...(viewMode === 'grid' ? S.viewBtnActive : {}) }}
            onClick={() => setViewMode('grid')}
            aria-label="网格视图"
          >
            <GridFour size={16} />
          </button>
          <button
            style={{ ...S.viewBtn, ...(viewMode === 'grouped' ? S.viewBtnActive : {}) }}
            onClick={() => setViewMode('grouped')}
            aria-label="按电影分组"
          >
            <ListBullets size={16} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={S.grid}>
          {favoriteScreenshotsList.map(entry => (
            <motion.button
              type="button"
              key={keyFor(entry)}
              style={S.gridItem}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClickEntry(entry)}
              aria-label={selectMode ? `选择 ${entry.movie.title} 截图` : `查看 ${entry.movie.title} 截图`}
            >
              <img
                src={entry.screenshot.url}
                alt={entry.movie.title}
                loading="lazy"
                decoding="async"
                style={S.gridImage}
              />
              {renderCheckbox(entry)}
            </motion.button>
          ))}
        </div>
      ) : (
        <div style={S.groupedContainer}>
          {Object.entries(groupedByMovie).map(([movieId, entries], idx) => (
            <div key={movieId}>
              {idx > 0 && <div style={S.divider} />}
              <h3 style={S.groupTitle}>{entries[0].movie.title}</h3>
              <div style={S.groupRow}>
                {entries.map(entry => (
                  <motion.button
                    type="button"
                    key={keyFor(entry)}
                    style={S.groupItem}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClickEntry(entry)}
                    aria-label={selectMode ? `选择 ${entry.movie.title} 截图` : `查看 ${entry.movie.title} 截图`}
                  >
                    <img
                      src={entry.screenshot.url}
                      alt={entry.movie.title}
                      loading="lazy"
                      decoding="async"
                      style={S.groupImage}
                    />
                    {renderCheckbox(entry)}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectMode && (
        <div style={S.bottomBar}>
          <button style={S.bottomBtn} onClick={handleCancelSelect}>
            取消
          </button>
          <button
            style={{
              ...S.bottomBtn,
              ...S.deleteBtn,
              ...(selectedIds.size === 0 ? S.deleteBtnDisabled : {}),
            }}
            disabled={selectedIds.size === 0}
            onClick={handleDeleteSelected}
          >
            <TrashSimple size={15} />
            <span>删除选中{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
          </button>
        </div>
      )}
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

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  selectBtn: {
    background: 'none',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 12px',
    fontSize: 12.5,
    fontWeight: 500,
    color: 'var(--ink-muted)',
    cursor: 'pointer',
    lineHeight: 1.4,
  },

  viewBtn: {
    background: 'none',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 8px',
    color: 'var(--ink-faint)',
    cursor: 'pointer',
    lineHeight: 1,
    display: 'flex',
    transition: 'all 0.2s',
  },

  viewBtnActive: {
    color: 'var(--accent)',
    borderColor: 'rgba(196,93,62,0.5)',
    backgroundColor: 'rgba(196,93,62,0.1)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },

  gridItem: {
    position: 'relative' as const,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-raised)',
    width: '100%',
    padding: 0,
    border: 0,
  },

  gridImage: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    display: 'block',
  },

  groupedContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },

  divider: {
    height: 1,
    backgroundColor: 'var(--rule)',
    margin: '14px 0',
  },

  groupTitle: {
    margin: '0 0 10px 0',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink)',
  },

  groupRow: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    paddingBottom: 4,
  },

  groupItem: {
    position: 'relative' as const,
    flexShrink: 0,
    width: 100,
    height: 100,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-raised)',
    padding: 0,
    border: 0,
  },

  groupImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  checkbox: {
    position: 'absolute' as const,
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'none',
  },

  checkboxChecked: {
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)',
  },

  bottomBar: {
    position: 'fixed' as const,
    left: 0,
    right: 0,
    bottom: 'calc(56px + env(safe-area-inset-bottom))',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    backgroundColor: 'var(--bg-overlay)',
    backdropFilter: 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
    borderTop: '1px solid var(--rule)',
    zIndex: 100,
  },

  bottomBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 18px',
    fontSize: 13.5,
    fontWeight: 500,
    color: 'var(--ink-muted)',
    cursor: 'pointer',
  },

  deleteBtn: {
    color: 'var(--accent)',
    borderColor: 'rgba(196,93,62,0.5)',
  },

  deleteBtnDisabled: {
    opacity: 0.4,
  },

  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
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
