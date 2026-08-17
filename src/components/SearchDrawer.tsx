import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';
import type { Movie } from '@/types';

export default function SearchDrawer() {
  const navigate = useNavigate();
  const isSearchOpen = useAppStore(s => s.isSearchOpen);
  const searchQuery = useAppStore(s => s.searchQuery);
  const searchResults = useAppStore(s => s.searchResults);
  const setSearchOpen = useAppStore(s => s.setSearchOpen);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);
  const openDetail = useAppStore(s => s.openDetail);
  const clearHueFilter = useAppStore(s => s.clearHueFilter);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setSearchOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleCardClick = (movie: Movie) => {
    setSearchOpen(false);
    clearHueFilter();
    navigate('/');
    if (movie.screenshots.length > 0) {
      openDetail(movie, movie.screenshots[0]);
    }
  };

  useEffect(() => {
    if (!isSearchOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInput = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusInput);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isSearchOpen, setSearchOpen]);

  return (
    <AnimatePresence mode="wait">
      {isSearchOpen && (
        <>
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
          />

          <motion.div
            ref={drawerRef}
            style={styles.drawer}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="搜索电影"
          >
            <div style={styles.handleBar} />

            <div style={styles.searchContainer}>
              <MagnifyingGlass size={17} color="var(--ink-faint)" style={{ flexShrink: 0 }} />
              <input
                style={styles.searchInput}
                type="text"
                placeholder="搜索电影或导演…"
                aria-label="搜索电影或导演"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button style={styles.clearBtn} onClick={handleClear} aria-label="清除">
                  <X size={14} weight="bold" color="var(--ink-muted)" />
                </button>
              )}
            </div>

            <div style={styles.listContainer}>
              {searchResults.length === 0 && searchQuery.trim() !== '' && (
                <div style={styles.empty}>未找到匹配的电影</div>
              )}

              {searchResults.map((movie) => (
                <motion.button
                  type="button"
                  key={movie.id}
                  style={styles.card}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(movie)}
                >
                  {movie.screenshots[0] && (
                    <img
                      style={styles.thumbnail}
                      src={movie.screenshots[0].url}
                      alt={movie.title}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div style={styles.cardInfo}>
                    <div style={styles.cardTitle}>{movie.title}</div>
                    <div style={styles.cardMeta}>
                      {movie.director} · {movie.year}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 110,
    backgroundColor: 'rgba(8, 9, 11, 0.6)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  drawer: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 111,
    maxHeight: '78dvh',
    backgroundColor: 'var(--bg-raised)',
    borderRadius: '16px 16px 0 0',
    borderTop: '1px solid var(--rule)',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 'env(safe-area-inset-bottom)',
    boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    margin: '10px auto 4px',
    flexShrink: 0,
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius)',
    padding: '10px 12px',
    gap: 9,
    margin: '8px 16px 10px',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 15,
    color: 'var(--ink)',
    padding: 0,
  },
  clearBtn: {
    flexShrink: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 2,
    lineHeight: 1,
    display: 'flex',
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: '0 16px 16px',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    fontSize: 14,
    color: 'var(--ink-faint)',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    width: '100%',
    border: 0,
    background: 'transparent',
    textAlign: 'left',
  },
  thumbnail: {
    width: 72,
    height: 45,
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
    flexShrink: 0,
    backgroundColor: 'var(--bg)',
  },
  cardInfo: {
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardMeta: {
    fontSize: 12.5,
    color: 'var(--ink-faint)',
    marginTop: 2,
  },
};
