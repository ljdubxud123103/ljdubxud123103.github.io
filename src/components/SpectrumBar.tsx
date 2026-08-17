import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';

function generateHueGradient(): string {
  const stops: string[] = [];
  for (let i = 0; i <= 360; i += 30) {
    stops.push(`hsl(${i}, 62%, 52%) ${(i / 360) * 100}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export default function SpectrumBar() {
  const selectedHue = useAppStore(s => s.selectedHue);
  const setSelectedHue = useAppStore(s => s.setSelectedHue);
  const clearHueFilter = useAppStore(s => s.clearHueFilter);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragHue, setDragHue] = useState<number | null>(null);

  const hueFromX = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * 360);
  }, []);

  const displayHue = dragHue ?? selectedHue ?? 0;
  const hasFilter = selectedHue !== null;
  const cursorLeft = (displayHue / 360) * 100;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      setDragHue(hueFromX(e.clientX));
    },
    [hueFromX],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragHue === null) return;
      setDragHue(hueFromX(e.clientX));
    },
    [dragHue, hueFromX],
  );

  const handlePointerUp = useCallback(() => {
    if (dragHue !== null) {
      setSelectedHue(dragHue);
    }
    setDragHue(null);
  }, [dragHue, setSelectedHue]);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <span
          style={{
            ...styles.label,
            color: hasFilter ? 'var(--ink)' : 'var(--ink-faint)',
          }}
        >
          色调
        </span>
        <span
          style={{
            ...styles.readout,
            color: hasFilter ? 'var(--accent)' : 'var(--ink-faint)',
          }}
        >
          {hasFilter ? `${displayHue}°` : '全部'}
        </span>
        {hasFilter && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={clearHueFilter}
            aria-label="清除色调筛选"
            whileTap={{ scale: 0.85 }}
            style={styles.clearBtn}
          >
            <X size={12} weight="bold" />
          </motion.button>
        )}
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={styles.track}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: generateHueGradient(),
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.4)',
          }}
        />
        {(hasFilter || dragHue !== null) && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${cursorLeft}%`,
              width: 22,
              height: 22,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2.5px solid #fff',
              backgroundColor: `hsl(${displayHue}, 62%, 52%)`,
              boxShadow: '0 1px 6px rgba(0,0,0,0.6)',
              pointerEvents: 'none',
              transition:
                dragHue === null
                  ? 'left 0.2s ease, background-color 0.2s ease'
                  : 'background-color 0.1s ease',
            }}
          />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '10px 16px 12px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    height: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    transition: 'color 0.2s',
  },
  readout: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    transition: 'color 0.2s',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(196,93,62,0.18)',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  track: {
    position: 'relative',
    height: 14,
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  },
};
