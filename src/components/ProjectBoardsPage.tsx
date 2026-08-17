import { useEffect, useMemo, useState } from 'react';
import { Check, FolderOpen, PencilSimple, Plus, TrashSimple, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/appStore';

export default function ProjectBoardsPage() {
  const movies = useAppStore((state) => state.movies);
  const projectBoards = useAppStore((state) => state.projectBoards);
  const createProjectBoard = useAppStore((state) => state.createProjectBoard);
  const renameProjectBoard = useAppStore((state) => state.renameProjectBoard);
  const deleteProjectBoard = useAppStore((state) => state.deleteProjectBoard);
  const removeFromProjectBoard = useAppStore((state) => state.removeFromProjectBoard);
  const openDetail = useAppStore((state) => state.openDetail);
  const [activeBoardId, setActiveBoardId] = useState(projectBoards[0]?.id ?? '');
  const [newBoardName, setNewBoardName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (projectBoards.length === 0) {
      setActiveBoardId('');
      return;
    }
    if (!projectBoards.some((board) => board.id === activeBoardId)) {
      setActiveBoardId(projectBoards[0].id);
    }
  }, [activeBoardId, projectBoards]);

  const activeBoard = projectBoards.find((board) => board.id === activeBoardId) ?? null;

  const activeEntries = useMemo(() => {
    if (!activeBoard) return [];
    const movieMap = new Map(movies.map((movie) => [movie.id, movie]));
    return activeBoard.items.flatMap((item) => {
      const movie = movieMap.get(item.movieId);
      const screenshot = movie?.screenshots.find((shot) => shot.id === item.screenshotId);
      return movie && screenshot ? [{ movie, screenshot }] : [];
    });
  }, [activeBoard, movies]);

  const handleCreate = () => {
    const name = newBoardName.trim();
    if (!name) return;
    const boardId = createProjectBoard(name);
    setActiveBoardId(boardId);
    setNewBoardName('');
  };

  const startRename = () => {
    if (!activeBoard) return;
    setEditingName(activeBoard.name);
    setIsEditing(true);
  };

  const confirmRename = () => {
    if (!activeBoard || !editingName.trim()) return;
    renameProjectBoard(activeBoard.id, editingName);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!activeBoard) return;
    const confirmed = window.confirm(`删除项目板“${activeBoard.name}”？其中的截图不会从收藏夹删除。`);
    if (confirmed) deleteProjectBoard(activeBoard.id);
  };

  return (
    <main className="tool-page project-page">
      <header className="tool-page__header project-page__header">
        <div>
          <h1>项目板</h1>
          <p>按项目收集画面参考，浏览时可从截图详情直接加入。</p>
        </div>
        <form
          className="project-create"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <input
            value={newBoardName}
            onChange={(event) => setNewBoardName(event.target.value)}
            placeholder="新项目名称"
            maxLength={30}
            aria-label="新项目名称"
          />
          <button type="submit" disabled={!newBoardName.trim()}>
            <Plus size={16} weight="bold" />
            新建
          </button>
        </form>
      </header>

      {projectBoards.length === 0 ? (
        <section className="project-empty">
          <FolderOpen size={42} weight="thin" aria-hidden="true" />
          <h2>先建立一个项目板</h2>
          <p>例如“品牌广告提案”或“短片色彩参考”，然后从任意截图详情加入画面。</p>
        </section>
      ) : (
        <>
          <nav className="board-switcher" aria-label="项目板列表">
            {projectBoards.map((board) => (
              <button
                key={board.id}
                type="button"
                className={board.id === activeBoardId ? 'is-active' : ''}
                onClick={() => {
                  setActiveBoardId(board.id);
                  setIsEditing(false);
                }}
              >
                <span>{board.name}</span>
                <small>{board.items.length}</small>
              </button>
            ))}
          </nav>

          {activeBoard && (
            <section className="active-board">
              <div className="active-board__toolbar">
                {isEditing ? (
                  <div className="board-rename">
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setIsEditing(false);
                      }}
                      maxLength={30}
                      autoFocus
                      aria-label="修改项目板名称"
                    />
                    <button type="button" onClick={confirmRename} aria-label="保存名称">
                      <Check size={16} weight="bold" />
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} aria-label="取消修改">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2>{activeBoard.name}</h2>
                    <p>{activeEntries.length} 张画面</p>
                  </div>
                )}

                {!isEditing && (
                  <div className="active-board__actions">
                    <button type="button" onClick={startRename} aria-label="重命名项目板">
                      <PencilSimple size={16} />
                      <span>重命名</span>
                    </button>
                    <button type="button" className="is-danger" onClick={handleDelete} aria-label="删除项目板">
                      <TrashSimple size={16} />
                      <span>删除</span>
                    </button>
                  </div>
                )}
              </div>

              {activeEntries.length === 0 ? (
                <div className="active-board__empty">
                  <p>这个项目板还是空的。</p>
                  <span>打开图库中的任意截图，点击“加入项目”。</span>
                </div>
              ) : (
                <div className="project-shot-grid">
                  {activeEntries.map(({ movie, screenshot }) => (
                    <article key={`${movie.id}-${screenshot.id}`} className="project-shot">
                      <button
                        type="button"
                        className="project-shot__image"
                        onClick={() => openDetail(movie, screenshot)}
                        aria-label={`查看 ${movie.title} 截图`}
                      >
                        <img
                          src={screenshot.url}
                          alt={movie.title}
                          width={screenshot.width}
                          height={screenshot.height}
                          loading="lazy"
                          decoding="async"
                        />
                        <span>{movie.title}</span>
                      </button>
                      <button
                        type="button"
                        className="project-shot__remove"
                        onClick={() =>
                          removeFromProjectBoard(activeBoard.id, movie.id, screenshot.id)
                        }
                        aria-label={`从项目板移除 ${movie.title} 截图`}
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
