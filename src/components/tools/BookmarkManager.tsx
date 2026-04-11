/**
 * BookmarkManager — 收藏管理页面
 *
 * 功能：
 * 1. 按集合/标签/时间筛选收藏
 * 2. 标签云视图
 * 3. 编辑标签、删除收藏
 * 4. 导出为 Markdown
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getBookmarks,
  saveBookmarks,
  removeBookmark,
  setBookmarkTags,
  getAllTags,
  getRecentTags,
  collectionLabels,
  collectionColors,
  exportBookmarksMarkdown,
  syncToServer,
  type BookmarkItem,
  type CollectionType,
} from './bookmarkStore';

type ViewMode = 'list' | 'tags';
type SortMode = 'newest' | 'oldest' | 'alpha';

export default function BookmarkManager() {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterCollection, setFilterCollection] = useState<CollectionType | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setItems(getBookmarks());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(() => {
    setItems(getBookmarks());
  }, []);

  // 删除
  const handleRemove = useCallback((url: string) => {
    removeBookmark(url);
    refresh();
    showToast('已移除收藏');
  }, [refresh, showToast]);

  // 标签编辑
  const startEditTags = useCallback((item: BookmarkItem) => {
    setEditingId(item.id);
    setEditTags([...item.tags]);
    setTagInput('');
  }, []);

  const saveEditTags = useCallback((url: string) => {
    setBookmarkTags(url, editTags);
    setEditingId(null);
    refresh();
  }, [editTags, refresh]);

  const addEditTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  }, [editTags]);

  const removeEditTag = useCallback((tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag));
  }, []);

  // 导出
  const handleExportMd = useCallback(() => {
    const md = exportBookmarksMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maxwell-bookmarks-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出为 Markdown');
  }, [showToast]);

  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(getBookmarks(), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showToast(`已复制 ${items.length} 条收藏的 JSON`);
    }).catch(() => showToast('复制失败'));
  }, [items, showToast]);

  // 清空全部
  const [confirmClear, setConfirmClear] = useState(false);
  const handleClearAll = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    saveBookmarks([]);
    refresh();
    setConfirmClear(false);
    showToast('已清空全部收藏');
    syncToServer().catch(() => {});
  }, [confirmClear, refresh, showToast]);

  // 标签数据
  const allTags = getAllTags();
  const recentTags = getRecentTags();

  // 筛选 + 排序
  let filtered = items;
  if (filterCollection !== 'all') {
    filtered = filtered.filter(i => i.collection === filterCollection);
  }
  if (filterTag) {
    filtered = filtered.filter(i => i.tags.includes(filterTag));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (sortMode === 'newest') {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortMode === 'oldest') {
    filtered = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }

  // 集合统计
  const collectionCounts = new Map<string, number>();
  items.forEach(i => collectionCounts.set(i.collection, (collectionCounts.get(i.collection) || 0) + 1));

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm shadow-lg" style={{ animation: 'fadeInUp 0.3s ease' }}>
          {toast}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{items.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">总收藏</div>
        </div>
        <div className="card p-4 text-center border-amber-200 dark:border-amber-800">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{allTags.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">标签数</div>
        </div>
        <div className="card p-4 text-center border-violet-200 dark:border-violet-800">
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{collectionCounts.size}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">涉及集合</div>
        </div>
        <div className="card p-4 text-center border-emerald-200 dark:border-emerald-800">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {items.filter(i => i.tags.length > 0).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">已标记</div>
        </div>
      </div>

      {/* 搜索 + 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 搜索 */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索标题或标签..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* 视图切换 */}
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            列表
          </button>
          <button
            onClick={() => setViewMode('tags')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'tags'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            标签云
          </button>
        </div>

        {/* 排序 */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
        >
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
          <option value="alpha">按标题</option>
        </select>
      </div>

      {/* 集合筛选 */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => { setFilterCollection('all'); setFilterTag(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterCollection === 'all' && !filterTag
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          全部 ({items.length})
        </button>
        {Array.from(collectionCounts.entries()).map(([col, count]) => (
          <button
            key={col}
            onClick={() => { setFilterCollection(col as CollectionType); setFilterTag(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCollection === col
                ? `${collectionColors[col as CollectionType]?.bg || ''} ${collectionColors[col as CollectionType]?.text || ''}`
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {collectionLabels[col as CollectionType] || col} ({count})
          </button>
        ))}
        {filterTag && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            标签: {filterTag}
            <button onClick={() => setFilterTag(null)} className="hover:text-red-500">×</button>
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button onClick={handleExportMd} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          导出 Markdown
        </button>
        <button onClick={handleExportJson} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          复制 JSON
        </button>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              confirmClear
                ? 'bg-red-500 text-white'
                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            {confirmClear ? '确认清空？' : '清空全部'}
          </button>
        )}
      </div>

      {/* 标签云视图 */}
      {viewMode === 'tags' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">标签云</h3>
          {allTags.length === 0 ? (
            <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
              还没有标签，收藏内容后添加标签即可看到分布
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map(({ tag, count }) => {
                const isActive = filterTag === tag;
                const size = count >= 5 ? 'text-base' : count >= 3 ? 'text-sm' : 'text-xs';
                return (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(isActive ? null : tag)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-all ${size} ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300'
                    }`}
                  >
                    {tag}
                    <span className="ml-1 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 收藏列表 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              {items.length === 0 ? '还没有收藏' : '没有匹配的收藏'}
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-xs mt-2">
              在文章、专栏、研究等页面点击标题旁的星标按钮即可收藏
            </div>
          </div>
        ) : (
          filtered.map((item) => {
            const colors = collectionColors[item.collection] || collectionColors.unknown;
            return (
              <div
                key={item.id}
                className="card p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* 集合徽章 */}
                  <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${colors.text} ${colors.bg}`}>
                    {collectionLabels[item.collection]}
                  </span>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.url}
                        className="text-sm font-medium text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors leading-snug"
                      >
                        {item.title}
                      </a>
                      <button
                        onClick={() => handleRemove(item.url)}
                        className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors text-xs"
                        title="移除收藏"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 元信息 */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleString('zh-CN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}</span>
                      <a href={item.url} className="hover:underline truncate max-w-[200px]">{item.url}</a>
                    </div>

                    {/* 标签 */}
                    {editingId === item.id ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {editTags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              {tag}
                              <button onClick={() => removeEditTag(tag)} className="hover:text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addEditTag(tagInput);
                              if (e.key === 'Escape') { saveEditTags(item.url); }
                            }}
                            placeholder="输入标签名，回车添加"
                            className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                            autoFocus
                          />
                          <button onClick={() => saveEditTags(item.url)} className="px-2 py-1 rounded text-xs bg-amber-500 text-white">
                            完成
                          </button>
                        </div>
                        {/* 快捷标签 */}
                        {recentTags.filter(t => !editTags.includes(t)).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {recentTags.filter(t => !editTags.includes(t)).slice(0, 6).map(tag => (
                              <button
                                key={tag}
                                onClick={() => addEditTag(tag)}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 transition-colors"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {item.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => setFilterTag(tag)}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                        <button
                          onClick={() => startEditTags(item)}
                          className="px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          {item.tags.length > 0 ? '编辑' : '+ 标签'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
