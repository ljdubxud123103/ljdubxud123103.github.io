import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FilmSlate, Clock, Heart } from '@phosphor-icons/react';
import SpectrumBar from '@/components/SpectrumBar';
import ScreenshotGrid from '@/components/ScreenshotGrid';
import SearchBar from '@/components/SearchBar';
import SearchDrawer from '@/components/SearchDrawer';
import MovieDetail from '@/components/MovieDetail';
import FavoritesPage from '@/components/FavoritesPage';
import RecentPage from '@/components/RecentPage';
import { useAppStore } from '@/store/appStore';
import { getMovies, getHueIndex } from '@/utils/dataLoader';

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--ink-muted)',
        fontSize: 10,
        fontWeight: active ? 600 : 500,
        letterSpacing: '0.02em',
        position: 'relative',
        padding: 0,
        transition: 'color 0.2s',
        height: '100%',
      }}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="tab-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 18,
            height: 2,
            backgroundColor: 'var(--accent)',
            borderRadius: '1px',
          }}
        />
      )}
    </motion.button>
  );
}

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
      <div style={{ flex: 1, paddingBottom: 76 }}>
        <SearchBar />
        {location.pathname === '/' && <SpectrumBar />}
        <Routes>
          <Route path="/" element={<ScreenshotGrid />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </div>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(56px + env(safe-area-inset-bottom))',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
          borderTop: '1px solid var(--rule)',
          background: 'var(--bg-overlay)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          zIndex: 40,
        }}
      >
        <TabButton
          icon={<FilmSlate size={21} weight={location.pathname === '/' ? 'fill' : 'regular'} />}
          label="浏览"
          active={location.pathname === '/'}
          onClick={() => navigate('/')}
        />
        <TabButton
          icon={<Clock size={21} weight={location.pathname === '/recent' ? 'fill' : 'regular'} />}
          label="最近"
          active={location.pathname === '/recent'}
          onClick={() => navigate('/recent')}
        />
        <TabButton
          icon={
            <Heart
              size={21}
              weight={location.pathname === '/favorites' ? 'fill' : 'regular'}
              color={location.pathname === '/favorites' ? 'var(--accent)' : undefined}
            />
          }
          label="收藏"
          active={location.pathname === '/favorites'}
          onClick={() => navigate('/favorites')}
        />
      </nav>

      <SearchDrawer />
      <MovieDetail />
    </div>
  );
}

function App() {
  const loadData = useAppStore((s) => s.loadData);
  const isDataLoaded = useAppStore((s) => s.isDataLoaded);

  useEffect(() => {
    const moviesData = getMovies();
    const hueIndex = getHueIndex();
    loadData(moviesData.movies, hueIndex);
  }, [loadData]);

  if (!isDataLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          fontSize: '14px',
          color: 'var(--ink-faint)',
          letterSpacing: '0.1em',
          backgroundColor: 'var(--bg)',
        }}
      >
        CINEPALETTE
      </div>
    );
  }

  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
}

export default App;
