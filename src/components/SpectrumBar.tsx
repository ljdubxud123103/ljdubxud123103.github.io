import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown, Check, FunnelSimple } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';

const HUE_SWATCHES = [
  { hue: 0, label: '红色' },
  { hue: 30, label: '橙色' },
  { hue: 60, label: '黄色' },
  { hue: 90, label: '黄绿色' },
  { hue: 120, label: '绿色' },
  { hue: 150, label: '青绿色' },
  { hue: 180, label: '青色' },
  { hue: 210, label: '蓝色' },
  { hue: 240, label: '靛蓝色' },
  { hue: 270, label: '紫色' },
  { hue: 300, label: '洋红色' },
  { hue: 330, label: '玫红色' },
] as const;

function checkColor(hue: number): string {
  return hue >= 35 && hue <= 180 ? '#0c0d0f' : '#fff';
}

export default function SpectrumBar() {
  const selectedHue = useAppStore(s => s.selectedHue);
  const setSelectedHue = useAppStore(s => s.setSelectedHue);
  const clearHueFilter = useAppStore(s => s.clearHueFilter);
  const movies = useAppStore(s => s.movies);
  const [isOpen, setIsOpen] = useState(false);

  const hasFilter = selectedHue !== null;
  const screenshotCount = useMemo(
    () => movies.reduce((total, movie) => total + movie.screenshots.length, 0),
    [movies],
  );

  const chooseHue = (hue: number) => {
    setSelectedHue(hue);
    setIsOpen(false);
  };

  const chooseAll = () => {
    clearHueFilter();
    setIsOpen(false);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <motion.button
          type="button"
          aria-expanded={isOpen}
          aria-controls="hue-filter-panel"
          onClick={() => setIsOpen((open) => !open)}
          whileTap={{ scale: 0.97 }}
          style={{
            ...styles.trigger,
            ...(hasFilter ? styles.triggerActive : {}),
          }}
        >
          <FunnelSimple size={15} weight={hasFilter ? 'fill' : 'regular'} />
          <span>筛选</span>
          {hasFilter && (
            <span
              aria-hidden="true"
              style={{
                ...styles.currentColor,
                backgroundColor: `hsl(${selectedHue}, 62%, 52%)`,
              }}
            />
          )}
          <span style={styles.triggerValue}>{hasFilter ? `${selectedHue}°` : '全部'}</span>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={styles.caret}
          >
            <CaretDown size={12} weight="bold" />
          </motion.span>
        </motion.button>

        <span
          style={{
            ...styles.libraryCount,
            color: hasFilter ? 'var(--ink-muted)' : 'var(--ink-faint)',
          }}
        >
          {movies.length} 部 · {screenshotCount} 张
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="hue-filter-panel"
            aria-label="选择色调"
            initial={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={styles.panelClip}
          >
            <div style={styles.swatchGrid}>
              <motion.button
                type="button"
                aria-label="显示全部色调"
                aria-pressed={!hasFilter}
                onClick={chooseAll}
                whileTap={{ scale: 0.94 }}
                style={{
                  ...styles.allSwatch,
                  ...(!hasFilter ? styles.swatchSelected : {}),
                }}
              >
                全部
              </motion.button>
              {HUE_SWATCHES.map(({ hue, label }) => {
                const selected = selectedHue === hue;
                return (
                  <motion.button
                    key={hue}
                    type="button"
                    aria-label={`筛选${label}`}
                    aria-pressed={selected}
                    onClick={() => chooseHue(hue)}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      ...styles.colorSwatch,
                      ...(selected ? styles.swatchSelected : {}),
                      backgroundColor: `hsl(${hue}, 62%, 52%)`,
                    }}
                  >
                    {selected && <Check size={12} weight="bold" color={checkColor(hue)} />}
                    <span style={{ ...styles.swatchLabel, color: checkColor(hue) }}>
                      {label.replace('色', '')}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '8px 16px 6px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '0 10px',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-raised)',
    color: 'var(--ink-muted)',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    lineHeight: 1,
  },
  triggerActive: {
    color: 'var(--ink)',
    borderColor: 'rgba(196,93,62,0.48)',
    backgroundColor: 'rgba(196,93,62,0.1)',
  },
  currentColor: {
    width: 10,
    height: 10,
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.65)',
  },
  triggerValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    color: 'currentColor',
    fontVariantNumeric: 'tabular-nums',
  },
  caret: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  panelClip: {
    overflow: 'hidden',
  },
  swatchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(34px, 1fr))',
    gap: 7,
    width: 'min(100%, 420px)',
    marginTop: 8,
    padding: 9,
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--rule)',
  },
  allSwatch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    height: 44,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255,255,255,0.13)',
    backgroundColor: '#23252a',
    color: 'var(--ink-muted)',
    fontSize: 10.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  colorSwatch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    height: 44,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255,255,255,0.16)',
    cursor: 'pointer',
    flexDirection: 'column',
    gap: 1,
  },
  swatchLabel: {
    fontSize: 8,
    fontWeight: 700,
    lineHeight: 1,
  },
  swatchSelected: {
    borderColor: '#fff',
    boxShadow: '0 2px 7px rgba(0,0,0,0.35)',
  },
};
