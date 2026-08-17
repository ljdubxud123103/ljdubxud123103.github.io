import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Heart,
  Download,
  Check,
  CaretLeft,
  CaretRight,
  Swatches,
  FolderPlus,
  Plus,
} from '@phosphor-icons/react';
import type { ScreenshotColor } from '@/types';
import { useAppStore } from '@/store/appStore';
import { exportScreenshot, exportPaletteCard } from '@/utils/exportUtils';

// 根据亮度选择色块上的文字颜色
function inkOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.9)';
}

export default function MovieDetail() {
  const selectedScreenshot = useAppStore((s) => s.selectedScreenshot);
  const isDetailOpen = useAppStore((s) => s.isDetailOpen);
  const openDetail = useAppStore((s) => s.openDetail);
  const closeDetail = useAppStore((s) => s.closeDetail);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const projectBoards = useAppStore((s) => s.projectBoards);
  const createProjectBoard = useAppStore((s) => s.createProjectBoard);
  const addToProjectBoard = useAppStore((s) => s.addToProjectBoard);
  const removeFromProjectBoard = useAppStore((s) => s.removeFromProjectBoard);

  const [isExporting, setIsExporting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);

  const favorited =
    selectedScreenshot !== null &&
    isFavorite(selectedScreenshot.movie.id, selectedScreenshot.screenshot.id);

  const sameMovieScreenshots = useMemo(
    () => (selectedScreenshot ? selectedScreenshot.movie.screenshots : []),
    [selectedScreenshot],
  );

  const currentIndex = useMemo(
    () =>
      selectedScreenshot
        ? selectedScreenshot.movie.screenshots.findIndex(
            (s) => s.id === selectedScreenshot.screenshot.id,
          )
        : -1,
    [selectedScreenshot],
  );

  const navigateDetail = useCallback(
    (delta: number) => {
      if (!selectedScreenshot) return;
      const shots = selectedScreenshot.movie.screenshots;
      const next = shots.findIndex((s) => s.id === selectedScreenshot.screenshot.id) + delta;
      if (next < 0 || next >= shots.length) return;
      openDetail(selectedScreenshot.movie, shots[next]);
    },
    [selectedScreenshot, openDetail],
  );

  useEffect(() => {
    if (!isDetailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateDetail(-1);
      else if (e.key === 'ArrowRight') navigateDetail(1);
      else if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDetailOpen, navigateDetail, closeDetail]);

  useEffect(() => {
    if (!isDetailOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusClose = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>('[aria-label="关闭"]')?.focus();
    }, 0);
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>(
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
    document.addEventListener('keydown', trapFocus);
    return () => {
      window.clearTimeout(focusClose);
      document.removeEventListener('keydown', trapFocus);
      previousFocus?.focus();
    };
  }, [isDetailOpen]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    touchStart.current = null;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigateDetail(dx < 0 ? 1 : -1);
    }
  };

  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isDetailOpen) {
      activeThumbRef.current?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [currentIndex, isDetailOpen]);

  if (!selectedScreenshot) return null;

  const { movie, screenshot } = selectedScreenshot;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < sameMovieScreenshots.length - 1;

  const handleFavoriteToggle = () => {
    if (favorited) {
      removeFavorite(movie.id, screenshot.id);
    } else {
      addFavorite(movie.id, screenshot.id);
    }
  };

  const handleThumbClick = (s: ScreenshotColor) => {
    if (s.id !== screenshot.id) {
      openDetail(movie, s);
    }
  };

  const handleCopyHex = async (hex: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
    } catch {
      // clipboard 不可用时静默失败
    }
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 1200);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportScreenshot(screenshot.url, `${movie.title}-${screenshot.id}.jpg`);
    } catch (e) {
      console.error('导出截图失败:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePaletteExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportPaletteCard({
        imageUrl: screenshot.url,
        palette: screenshot.palette,
        title: movie.title,
        meta: `${movie.director} · ${movie.year}`,
        hue: screenshot.dominant_hue,
        saturation: screenshot.saturation,
        brightness: screenshot.brightness,
        filename: `${movie.title}-palette-${screenshot.id}.png`,
      });
    } catch (e) {
      console.error('导出色卡失败:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const projectMembershipCount = projectBoards.filter((board) =>
    board.items.some(
      (item) => item.movieId === movie.id && item.screenshotId === screenshot.id,
    ),
  ).length;

  const toggleProjectMembership = (boardId: string) => {
    const board = projectBoards.find((candidate) => candidate.id === boardId);
    const isIncluded = board?.items.some(
      (item) => item.movieId === movie.id && item.screenshotId === screenshot.id,
    );
    if (isIncluded) {
      removeFromProjectBoard(boardId, movie.id, screenshot.id);
    } else {
      addToProjectBoard(boardId, movie.id, screenshot.id);
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const boardId = createProjectBoard(newProjectName);
    addToProjectBoard(boardId, movie.id, screenshot.id);
    setNewProjectName('');
  };

  return (
    <AnimatePresence>
      {isDetailOpen && (
        <motion.div
          style={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeDetail}
        >
          <motion.div
            ref={sheetRef}
            style={styles.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${movie.title} 截图详情`}
          >
            {/* 顶部图片区：支持左右滑动切换 */}
            <div
              style={styles.imageWrap}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <motion.img
                key={screenshot.id}
                src={screenshot.url}
                alt={movie.title}
                style={styles.image}
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                draggable={false}
              />
              <button style={styles.closeBtn} onClick={closeDetail} aria-label="关闭">
                <X size={18} weight="bold" color="#fff" />
              </button>
              <motion.button
                style={{
                  ...styles.favoriteBtn,
                  color: favorited ? 'var(--accent)' : '#fff',
                }}
                onClick={handleFavoriteToggle}
                whileTap={{ scale: 0.85 }}
                aria-label="收藏"
              >
                <Heart size={19} weight={favorited ? 'fill' : 'regular'} />
              </motion.button>

              {sameMovieScreenshots.length > 1 && (
                <>
                  <div style={styles.positionChip}>
                    {currentIndex + 1} / {sameMovieScreenshots.length}
                  </div>
                  {hasPrev && (
                    <motion.button
                      style={{ ...styles.navBtn, left: 12 }}
                      onClick={() => navigateDetail(-1)}
                      whileTap={{ scale: 0.88 }}
                      aria-label="上一张"
                    >
                      <CaretLeft size={20} weight="bold" color="#fff" />
                    </motion.button>
                  )}
                  {hasNext && (
                    <motion.button
                      style={{ ...styles.navBtn, right: 12 }}
                      onClick={() => navigateDetail(1)}
                      whileTap={{ scale: 0.88 }}
                      aria-label="下一张"
                    >
                      <CaretRight size={20} weight="bold" color="#fff" />
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* 可滚动信息区 */}
            <div style={styles.infoScroll}>
              {/* 调色板：打开即见 */}
              <div style={styles.paletteRow}>
                {screenshot.palette.map((color, i) => (
                  <button
                    key={`${color}-${i}`}
                    style={{ ...styles.paletteBlock, backgroundColor: color }}
                    onClick={() => handleCopyHex(color, i)}
                    aria-label={`复制 ${color}`}
                  >
                    <span style={{ ...styles.paletteHex, color: inkOn(color) }}>
                      {copiedIndex === i ? (
                        <Check size={11} weight="bold" color={inkOn(color)} />
                      ) : (
                        color.toUpperCase()
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {/* 色彩数据读数 */}
              <div style={styles.dataRow}>
                <div style={styles.dataItem}>
                  <span style={styles.dataLabel}>HUE</span>
                  <span style={styles.dataValue}>{Math.round(screenshot.dominant_hue)}°</span>
                </div>
                <div style={styles.dataDivider} />
                <div style={styles.dataItem}>
                  <span style={styles.dataLabel}>SAT</span>
                  <span style={styles.dataValue}>{Math.round(screenshot.saturation * 100)}%</span>
                </div>
                <div style={styles.dataDivider} />
                <div style={styles.dataItem}>
                  <span style={styles.dataLabel}>BRI</span>
                  <span style={styles.dataValue}>{Math.round(screenshot.brightness * 100)}%</span>
                </div>
                <div style={styles.dataDivider} />
                <div style={styles.dataItem}>
                  <span style={styles.dataLabel}>DOMINANT</span>
                  <span
                    style={{ ...styles.dataSwatch, backgroundColor: screenshot.dominant_color }}
                  />
                </div>
              </div>

              {/* 电影信息 */}
              <div style={styles.movieInfo}>
                <h2 style={styles.title}>{movie.title}</h2>
                <div style={styles.meta}>
                  {movie.director} · {movie.year}
                  {movie.cinematographer ? ` · 摄影 ${movie.cinematographer}` : ''}
                </div>
                {movie.cast && movie.cast.length > 0 && (
                  <div style={styles.cast}>{movie.cast.join(' · ')}</div>
                )}
              </div>

              {/* 同片截图：打开即见 */}
              {sameMovieScreenshots.length > 1 && (
                <div style={styles.thumbsSection}>
                  <div style={styles.sectionLabel}>本片全部截图 · {sameMovieScreenshots.length}</div>
                  <div style={styles.thumbsScroll}>
                    {sameMovieScreenshots.map((s) => (
                      <button
                        key={s.id}
                        ref={s.id === screenshot.id ? activeThumbRef : undefined}
                        style={{
                          ...styles.thumb,
                          ...(s.id === screenshot.id ? styles.thumbActive : {}),
                        }}
                        onClick={() => handleThumbClick(s)}
                      >
                        <img
                          src={s.url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width={96}
                          height={60}
                          style={styles.thumbImg}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <motion.button
                type="button"
                style={{
                  ...styles.projectAction,
                  ...(isProjectPickerOpen ? styles.projectActionActive : {}),
                }}
                onClick={() => setIsProjectPickerOpen((open) => !open)}
                whileTap={{ scale: 0.98 }}
                aria-expanded={isProjectPickerOpen}
              >
                <FolderPlus size={18} weight={projectMembershipCount > 0 ? 'fill' : 'regular'} />
                <span>
                  {projectMembershipCount > 0
                    ? `已加入 ${projectMembershipCount} 个项目`
                    : '加入项目板'}
                </span>
              </motion.button>

              <AnimatePresence initial={false}>
                {isProjectPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    style={styles.projectPickerClip}
                  >
                    <div style={styles.projectPicker}>
                      {projectBoards.length > 0 && (
                        <div style={styles.projectOptions}>
                          {projectBoards.map((board) => {
                            const isIncluded = board.items.some(
                              (item) =>
                                item.movieId === movie.id && item.screenshotId === screenshot.id,
                            );
                            return (
                              <button
                                key={board.id}
                                type="button"
                                style={{
                                  ...styles.projectOption,
                                  ...(isIncluded ? styles.projectOptionActive : {}),
                                }}
                                onClick={() => toggleProjectMembership(board.id)}
                              >
                                <span>{board.name}</span>
                                {isIncluded && <Check size={15} weight="bold" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div style={styles.projectCreate}>
                        <input
                          value={newProjectName}
                          onChange={(event) => setNewProjectName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleCreateProject();
                          }}
                          placeholder="新项目名称"
                          maxLength={30}
                          style={styles.projectInput}
                          aria-label="新项目名称"
                        />
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim()}
                          style={{
                            ...styles.projectCreateBtn,
                            ...(!newProjectName.trim() ? styles.projectCreateBtnDisabled : {}),
                          }}
                        >
                          <Plus size={15} weight="bold" />
                          新建并加入
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 导出 */}
              <div style={styles.toolbar}>
                <motion.button
                  style={{ ...styles.exportBtn, ...styles.paletteBtn }}
                  onClick={handlePaletteExport}
                  disabled={isExporting}
                  whileTap={{ scale: 0.97 }}
                >
                  <Swatches size={17} weight="regular" />
                  <span>{isExporting ? '导出中…' : '下载色卡'}</span>
                </motion.button>
                <motion.button
                  style={styles.exportBtn}
                  onClick={handleExport}
                  disabled={isExporting}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download size={17} weight="regular" />
                  <span>导出图片</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    backgroundColor: 'rgba(8, 9, 11, 0.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    position: 'relative',
    width: '100%',
    maxWidth: '640px',
    height: '94dvh',
    backgroundColor: 'var(--bg-raised)',
    borderRadius: '16px 16px 0 0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -12px 48px rgba(0,0,0,0.6)',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    flexShrink: 0,
    maxHeight: '46dvh',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: 'auto',
    maxHeight: '46dvh',
    objectFit: 'cover',
    display: 'block',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  infoScroll: {
    flex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: '16px 20px calc(24px + env(safe-area-inset-bottom))',
  },
  paletteRow: {
    display: 'flex',
    gap: 6,
  },
  paletteBlock: {
    flex: 1,
    height: 52,
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 6,
    transition: 'transform 0.15s ease',
  },
  paletteHex: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.04em',
    fontWeight: 600,
  },
  dataRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 2px',
    borderBottom: '1px solid var(--rule)',
  },
  dataItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  dataLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    letterSpacing: '0.14em',
    color: 'var(--ink-faint)',
  },
  dataValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink)',
  },
  dataSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.15)',
  },
  dataDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'var(--rule)',
  },
  movieInfo: {
    padding: '14px 2px 12px',
  },
  title: {
    fontSize: 21,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'var(--ink)',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: 'var(--ink-muted)',
    marginBottom: 4,
  },
  cast: {
    fontSize: 12.5,
    color: 'var(--ink-faint)',
  },
  thumbsSection: {
    padding: '4px 0 8px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.14em',
    color: 'var(--ink-faint)',
    marginBottom: 8,
  },
  thumbsScroll: {
    display: 'flex',
    gap: 6,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    paddingBottom: 4,
  },
  thumb: {
    flexShrink: 0,
    width: 96,
    height: 60,
    padding: 0,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1.5px solid transparent',
    backgroundColor: 'var(--bg)',
    opacity: 0.85,
    transition: 'opacity 0.15s ease, border-color 0.15s ease',
  },
  thumbActive: {
    border: '1.5px solid var(--accent)',
    opacity: 1,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  positionChip: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    padding: '4px 10px',
    borderRadius: 999,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.14)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    pointerEvents: 'none',
  } as React.CSSProperties,
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  toolbar: {
    display: 'flex',
    gap: 10,
    paddingTop: 14,
  },
  projectAction: {
    width: '100%',
    minHeight: 44,
    marginTop: 18,
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg)',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 13.5,
    fontWeight: 600,
  },
  projectActionActive: {
    borderColor: 'rgba(196,93,62,0.48)',
    color: 'var(--accent)',
    backgroundColor: 'rgba(196,93,62,0.08)',
  },
  projectPickerClip: {
    overflow: 'hidden',
  },
  projectPicker: {
    marginTop: 8,
    padding: 10,
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg)',
  },
  projectOptions: {
    display: 'grid',
    gap: 6,
    marginBottom: 8,
  },
  projectOption: {
    minHeight: 44,
    padding: '0 11px',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-raised)',
    color: 'var(--ink-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontSize: 13,
  },
  projectOptionActive: {
    color: 'var(--ink)',
    borderColor: 'rgba(196,93,62,0.48)',
    backgroundColor: 'rgba(196,93,62,0.1)',
  },
  projectCreate: {
    display: 'flex',
    gap: 6,
  },
  projectInput: {
    minWidth: 0,
    flex: 1,
    minHeight: 44,
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-raised)',
    color: 'var(--ink)',
    padding: '0 10px',
    fontSize: 13,
    outline: 'none',
  },
  projectCreateBtn: {
    flexShrink: 0,
    minHeight: 44,
    padding: '0 11px',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
  },
  projectCreateBtnDisabled: {
    opacity: 0.42,
    cursor: 'not-allowed',
  },
  exportBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 24px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--rule)',
    backgroundColor: 'var(--bg-raised)',
    color: 'var(--ink-muted)',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: 'pointer',
  },
  paletteBtn: {
    border: '1px solid rgba(196,93,62,0.55)',
    backgroundColor: 'rgba(196,93,62,0.12)',
    color: 'var(--accent)',
  },
};
