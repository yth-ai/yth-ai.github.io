/**
 * BookmarkButton — 全站收藏按钮
 *
 * 嵌入内容页标题旁，支持：
 * 1. 一键收藏/取消
 * 2. 收藏后弹出标签快捷面板
 * 3. 自定义标签输入
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  isBookmarked,
  toggleBookmark,
  getBookmarkByUrl,
  addTagToBookmark,
  removeTagFromBookmark,
  getRecentTags,
  detectCollection,
  type CollectionType,
} from './bookmarkStore';

interface Props {
  url?: string;
  title?: string;
  collection?: CollectionType;
}

export default function BookmarkButton({ url: propUrl, title: propTitle, collection: propCollection }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 从 DOM 获取当前页面信息
  const url = propUrl || (typeof window !== 'undefined' ? window.location.pathname : '');
  const title = propTitle || (typeof document !== 'undefined' ? document.title.split(' | ')[0] : '');
  const collection = propCollection || detectCollection(url);

  useEffect(() => {
    setBookmarked(isBookmarked(url));
    const bm = getBookmarkByUrl(url);
    if (bm) setCurrentTags(bm.tags);
    setRecentTags(getRecentTags());
  }, [url]);

  // 点击外部关闭标签面板
  useEffect(() => {
    if (!showTags) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowTags(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTags]);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleToggle = useCallback(() => {
    const result = toggleBookmark(url, title, collection);
    setBookmarked(result);
    if (result) {
      showToastMsg('已收藏');
      setShowTags(true);
      setRecentTags(getRecentTags());
    } else {
      showToastMsg('已取消收藏');
      setShowTags(false);
      setCurrentTags([]);
    }
  }, [url, title, collection, showToastMsg]);

  const handleAddTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (currentTags.includes(trimmed)) return;
    addTagToBookmark(url, trimmed);
    setCurrentTags(prev => [...prev, trimmed]);
    setRecentTags(getRecentTags());
    setTagInput('');
  }, [url, currentTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    removeTagFromBookmark(url, tag);
    setCurrentTags(prev => prev.filter(t => t !== tag));
  }, [url]);

  const suggestedTags = recentTags.filter(t => !currentTags.includes(t)).slice(0, 8);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={panelRef}>
      {/* 收藏按钮 */}
      <button
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
          bookmarked
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-700'
        }`}
        title={bookmarked ? '取消收藏（点击可添加标签）' : '收藏此页'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={bookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>{bookmarked ? '已收藏' : '收藏'}</span>
        {bookmarked && currentTags.length > 0 && (
          <span className="text-xs opacity-70">({currentTags.length})</span>
        )}
      </button>

      {/* 已收藏时点击可展开标签面板 */}
      {bookmarked && (
        <button
          onClick={() => setShowTags(!showTags)}
          className="ml-1 p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          title="管理标签"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </button>
      )}

      {/* 标签面板 */}
      {showTags && bookmarked && (
        <div
          className="absolute top-full left-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50"
          style={{ animation: 'fadeInUp 0.2s ease' }}
        >
          <div className="p-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">标签</div>

            {/* 当前标签 */}
            {currentTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {currentTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-amber-500 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 新标签输入 */}
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag(tagInput);
                  if (e.key === 'Escape') setShowTags(false);
                }}
                placeholder="输入标签，回车添加"
                className="flex-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              <button
                onClick={() => handleAddTag(tagInput)}
                className="px-2 py-1 rounded-md text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                +
              </button>
            </div>

            {/* 最近标签建议 */}
            {suggestedTags.length > 0 && (
              <>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">最近使用</div>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2 flex justify-between">
            <a
              href="/tools/bookmarks"
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
            >
              管理全部收藏
            </a>
            <button
              onClick={() => setShowTags(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[10001] px-4 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg"
          style={{ animation: 'fadeInUp 0.3s ease' }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
