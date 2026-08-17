import { useState } from 'react';
import { ClockCounterClockwise, Heart } from '@phosphor-icons/react';
import FavoritesPage from '@/components/FavoritesPage';
import RecentPage from '@/components/RecentPage';
import { useAppStore } from '@/store/appStore';

type SavedView = 'favorites' | 'recent';

export default function SavedPage() {
  const [view, setView] = useState<SavedView>('favorites');
  const favoriteCount = useAppStore((state) => state.favorites.length);
  const recentCount = useAppStore((state) => state.recentItems.length);

  return (
    <main className="tool-page saved-page">
      <header className="tool-page__header">
        <div>
          <h1>收藏</h1>
          <p>集中管理留下的画面，最近浏览收纳在这里。</p>
        </div>
      </header>

      <div className="saved-switcher" role="tablist" aria-label="收藏内容">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'favorites'}
          className={view === 'favorites' ? 'is-active' : ''}
          onClick={() => setView('favorites')}
        >
          <Heart size={17} weight={view === 'favorites' ? 'fill' : 'regular'} />
          收藏截图
          <span>{favoriteCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'recent'}
          className={view === 'recent' ? 'is-active' : ''}
          onClick={() => setView('recent')}
        >
          <ClockCounterClockwise size={17} />
          最近浏览
          <span>{recentCount}</span>
        </button>
      </div>

      <section role="tabpanel" className="saved-content">
        {view === 'favorites' ? <FavoritesPage embedded /> : <RecentPage embedded />}
      </section>
    </main>
  );
}
