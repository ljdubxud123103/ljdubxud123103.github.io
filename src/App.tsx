import { HashRouter, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import SpectrumBar from '@/components/SpectrumBar';
import ScreenshotGrid from '@/components/ScreenshotGrid';
import SearchBar from '@/components/SearchBar';
import SearchDrawer from '@/components/SearchDrawer';
import MovieDetail from '@/components/MovieDetail';
import CineIntro from '@/components/CineIntro';
import { CineNavIcon, CinePaletteMark, type CineNavIconName } from '@/components/CinePaletteIcons';
import { useAppStore } from '@/store/appStore';
import { loadMovies } from '@/utils/dataLoader';

const ColorMatchPage = lazy(() => import('@/components/ColorMatchPage'));
const ProjectBoardsPage = lazy(() => import('@/components/ProjectBoardsPage'));
const SavedPage = lazy(() => import('@/components/SavedPage'));

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: CineNavIconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={`app-nav__item${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="app-nav__signal" aria-hidden="true" />
      <span className="app-nav__icon" aria-hidden="true">
        <CineNavIcon name={icon} active={active} />
      </span>
      <span>{label}</span>
    </motion.button>
  );
}

function GalleryPage() {
  return (
    <main className="gallery-page">
      <SearchBar />
      <SpectrumBar />
      <ScreenshotGrid />
    </main>
  );
}

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="app-content">
        <Suspense fallback={<div style={routeLoadingStyle}>载入中</div>}>
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/match" element={<ColorMatchPage />} />
            <Route path="/projects" element={<ProjectBoardsPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/recent" element={<Navigate to="/saved" replace />} />
            <Route path="/favorites" element={<Navigate to="/saved" replace />} />
            <Route path="/library" element={<Navigate to="/saved" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      <nav className="app-nav" aria-label="主要功能">
        <div className="app-nav__brand" aria-hidden="true">
          <CinePaletteMark className="app-nav__brand-mark" />
        </div>
        <TabButton
          icon="library"
          label="图库"
          active={location.pathname === '/'}
          onClick={() => navigate('/')}
        />
        <TabButton
          icon="match"
          label="识色"
          active={location.pathname === '/match'}
          onClick={() => navigate('/match')}
        />
        <TabButton
          icon="boards"
          label="项目板"
          active={location.pathname === '/projects'}
          onClick={() => navigate('/projects')}
        />
        <TabButton
          icon="saved"
          label="收藏"
          active={location.pathname === '/saved'}
          onClick={() => navigate('/saved')}
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
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    loadMovies()
      .then((moviesData) => {
        if (!cancelled) loadData(moviesData.movies, {});
      })
      .catch((error) => {
        console.error('电影数据载入失败:', error);
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [loadAttempt, loadData]);

  if (loadError) {
    return (
      <>
        <CineIntro />
        <div style={loadStateStyle}>
          <span>电影数据载入失败</span>
          <button style={retryButtonStyle} onClick={() => setLoadAttempt((value) => value + 1)}>
            重新载入
          </button>
        </div>
      </>
    );
  }

  if (!isDataLoaded) {
    return (
      <>
        <CineIntro />
        <div style={loadStateStyle}>
          CINEPALETTE
        </div>
      </>
    );
  }

  return (
    <>
      <CineIntro />
      <HashRouter>
        <MainLayout />
      </HashRouter>
    </>
  );
}

const routeLoadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '50dvh',
  color: 'var(--ink-faint)',
  fontSize: 12,
  letterSpacing: '0.08em',
};

const loadStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  height: '100dvh',
  fontSize: 14,
  color: 'var(--ink-faint)',
  letterSpacing: '0.1em',
  backgroundColor: 'var(--bg)',
};

const retryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 16px',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-raised)',
  color: 'var(--ink)',
  cursor: 'pointer',
  fontSize: 13,
  letterSpacing: 0,
};

export default App;
