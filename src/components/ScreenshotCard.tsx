import { motion } from 'framer-motion';
import type { Movie, ScreenshotColor } from '@/types';

interface ScreenshotCardProps {
  movie: Movie;
  screenshot: ScreenshotColor;
  onClick: (movie: Movie, screenshot: ScreenshotColor) => void;
  eager?: boolean;
}

export default function ScreenshotCard({
  movie,
  screenshot,
  onClick,
  eager = false,
}: ScreenshotCardProps) {
  return (
    <motion.button
      type="button"
      className="screenshot-card"
      style={styles.card}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(movie, screenshot)}
      aria-label={`查看 ${movie.title} 截图`}
    >
      <img
        className="screenshot-card__image"
        src={screenshot.url}
        alt={movie.title}
        width={screenshot.width}
        height={screenshot.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        style={styles.image}
      />
      <div style={styles.caption}>
        <span style={styles.title}>{movie.title}</span>
        <span
          style={{
            ...styles.colorDot,
            backgroundColor: screenshot.dominant_color,
          }}
        />
      </div>
    </motion.button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    display: 'block',
    width: '100%',
    padding: 0,
    border: 'none',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-raised)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  image: {
    width: '100%',
    display: 'block',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '26px 10px 9px',
    background:
      'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 62%, rgba(0,0,0,0) 100%)',
  },
  title: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.94)',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  colorDot: {
    flexShrink: 0,
    width: 11,
    height: 11,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.85)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
};
