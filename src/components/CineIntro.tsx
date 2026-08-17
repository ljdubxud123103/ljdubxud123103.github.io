import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CinePaletteMark } from '@/components/CinePaletteIcons';

export default function CineIntro() {
  const reduceMotion = Boolean(useReducedMotion());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(false),
      reduceMotion ? 260 : 1120,
    );

    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="cine-intro"
          initial={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
          exit={reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
          transition={{
            duration: reduceMotion ? 0.18 : 0.42,
            ease: [0.16, 1, 0.3, 1],
          }}
          aria-hidden="true"
        >
          <span className="cine-intro__scan" />
          <div className="cine-intro__lockup">
            <CinePaletteMark className="cine-intro__mark" />
            <span className="cine-intro__wordmark">CINEPALETTE</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
