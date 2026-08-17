import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';

export default function SearchBar() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);

  const handleClear = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="gallery-search" style={styles.wrapper}>
      <div className="gallery-search__container" style={styles.container}>
        <MagnifyingGlass size={17} color="var(--ink-faint)" style={{ flexShrink: 0 }} />
        <input
          style={styles.input}
          type="text"
          placeholder="搜索电影或导演…"
          aria-label="搜索电影或导演"
          value={searchQuery}
          onChange={handleChange}
          onFocus={() => setSearchOpen(true)}
          onClick={() => setSearchOpen(true)}
          readOnly
        />
        {searchQuery && (
          <button style={styles.clearBtn} onClick={handleClear} aria-label="清除">
            <X size={14} weight="bold" color="var(--ink-muted)" />
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    padding: '12px 16px 10px',
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    backgroundColor: 'var(--bg-overlay)',
    backdropFilter: 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
    borderBottom: '1px solid var(--rule)',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--rule)',
    borderRadius: 'var(--radius)',
    padding: '9px 12px',
    gap: 9,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 14.5,
    color: 'var(--ink)',
    padding: 0,
    cursor: 'pointer',
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
};
