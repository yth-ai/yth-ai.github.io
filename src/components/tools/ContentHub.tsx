/**
 * ContentHub — 全站统一浮标组件
 *
 * 替代 PaperCollector，整合：
 * Tab 1: 收藏夹（最近收藏）
 * Tab 2: 精读队列（原 PaperCollector 的弹出面板）
 *
 * 同时保留 PaperCollector 的 arXiv 链接扫描 + 注入按钮功能
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getBookmarks,
  syncFromServer,
  collectionLabels,
  collectionColors,
  type BookmarkItem,
} from './bookmarkStore';
import type { ReadingListItem } from './PaperCollector';

const READING_LIST_KEY = 'maxwell-reading-list';

function getReadingList(): ReadingListItem[] {
  try {
    const data = localStorage.getItem(READING_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReadingList(items: ReadingListItem[]) {
  localStorage.setItem(READING_LIST_KEY, JSON.stringify(items));
}

function extractArxivId(url: string): string | null {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
  return match ? match[1] : null;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type TabType = 'bookmarks' | 'reading';

export default function ContentHub() {
  // ========== 共享状态 ==========
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ========== 收藏状态 ==========
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // ========== 精读状态 ==========
  const [readingItems, setReadingItems] = useState<ReadingListItem[]>([]);
  const [injected, setInjected] = useState(false);

  // 加载数据
  useEffect(() => {
    setBookmarks(getBookmarks());
    setReadingItems(getReadingList());
    // 启动时尝试从服务端同步收藏（补充本地可能丢失的数据）
    syncFromServer().then(merged => {
      if (merged) setBookmarks(getBookmarks());
    }).catch(() => {});
  }, []);

  // 监听 localStorage 变化（其他组件修改时同步）
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'maxwell-bookmarks') {
        setBookmarks(getBookmarks());
      }
      if (e.key === READING_LIST_KEY) {
        setReadingItems(getReadingList());
      }
    };
    window.addEventListener('storage', handleStorage);

    // 同时轮询检测同一窗口内的修改
    const interval = setInterval(() => {
      setBookmarks(getBookmarks());
      setReadingItems(getReadingList());
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // ========== 精读功能（从 PaperCollector 移植） ==========
  const collectPaper = useCallback((arxivUrl: string, linkText: string) => {
    const arxivId = extractArxivId(arxivUrl);
    if (!arxivId) return;

    const current = getReadingList();
    if (current.some(item => item.arxivId === arxivId)) {
      showToast('已在精读队列中');
      return;
    }

    const title = linkText && linkText !== 'arXiv' && linkText !== 'PDF'
      ? linkText
      : `arXiv:${arxivId}`;

    const newItem: ReadingListItem = {
      id: generateId(),
      arxivId,
      arxivUrl: `https://arxiv.org/abs/${arxivId}`,
      title,
      source: document.title,
      sourceUrl: window.location.pathname,
      addedAt: new Date().toISOString(),
      status: 'pending',
    };

    const updated = [newItem, ...current];
    saveReadingList(updated);
    setReadingItems(updated);
    showToast(`已加入精读队列: ${arxivId}`);
  }, [showToast]);

  const removePaper = useCallback((id: string) => {
    const current = getReadingList();
    const updated = current.filter(item => item.id !== id);
    saveReadingList(updated);
    setReadingItems(updated);
  }, []);

  // ========== arXiv 链接扫描 + 按钮注入（保留 PaperCollector 逻辑） ==========
  useEffect(() => {
    if (injected) return;

    const injectButtons = () => {
      const contentArea = document.querySelector('.prose-custom');
      if (!contentArea) return;

      const links = contentArea.querySelectorAll('a[href*="arxiv.org"]');
      if (links.length === 0) return;

      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        const arxivId = extractArxivId(href);
        if (!arxivId) return;
        if (link.parentElement?.querySelector('.paper-collect-btn')) return;

        let paperTitle = '';
        const parentBlock = link.closest('p, li, h2, h3, h4');
        if (parentBlock) {
          const boldEl = parentBlock.querySelector('strong, b');
          if (boldEl && boldEl.textContent) {
            paperTitle = boldEl.textContent;
          }
          if (!paperTitle) {
            let sibling = parentBlock.previousElementSibling;
            while (sibling && !['H2', 'H3'].includes(sibling.tagName)) {
              sibling = sibling.previousElementSibling;
            }
            if (sibling?.textContent) {
              paperTitle = sibling.textContent;
            }
          }
        }

        const btn = document.createElement('button');
        btn.className = 'paper-collect-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
        btn.title = '加入精读队列';
        btn.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          margin-left: 4px;
          padding: 0;
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.08);
          color: rgb(139, 92, 246);
          cursor: pointer;
          vertical-align: middle;
          transition: all 0.2s;
          position: relative;
          top: -1px;
        `;

        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(139, 92, 246, 0.15)';
          btn.style.borderColor = 'rgba(139, 92, 246, 0.5)';
          btn.style.transform = 'scale(1.1)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(139, 92, 246, 0.08)';
          btn.style.borderColor = 'rgba(139, 92, 246, 0.3)';
          btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const currentList = getReadingList();
          if (currentList.some(item => item.arxivId === arxivId)) {
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
            btn.style.color = 'rgb(139, 92, 246)';
            showToast('已在精读队列中');
            return;
          }

          collectPaper(href, paperTitle || (link as HTMLAnchorElement).textContent || '');

          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
          btn.style.background = 'rgba(139, 92, 246, 0.2)';
          btn.style.color = 'rgb(139, 92, 246)';
          btn.title = '已加入精读队列';
        });

        const currentList = getReadingList();
        if (currentList.some(item => item.arxivId === arxivId)) {
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
          btn.style.background = 'rgba(139, 92, 246, 0.2)';
          btn.title = '已在精读队列中';
        }

        link.parentNode?.insertBefore(btn, link.nextSibling);
      });

      setInjected(true);
    };

    const timer = setTimeout(injectButtons, 500);
    return () => clearTimeout(timer);
  }, [injected, collectPaper, showToast]);

  // ========== 计数 ==========
  const bookmarkCount = bookmarks.length;
  const pendingCount = readingItems.filter(i => i.status === 'pending').length;
  const totalBadge = bookmarkCount + pendingCount;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            zIndex: 10001,
            padding: '10px 18px',
            borderRadius: '8px',
            background: 'rgba(17, 24, 39, 0.9)',
            color: 'white',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          {toast}
        </div>
      )}

      {/* 浮标按钮 */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 10000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
          transition: 'all 0.3s',
        }}
        title={`收藏 ${bookmarkCount} · 精读 ${pendingCount}`}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        {/* Star icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {totalBadge > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {totalBadge}
          </span>
        )}
      </button>

      {/* 弹出面板 */}
      {showPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            zIndex: 10000,
            width: '400px',
            maxHeight: '520px',
            borderRadius: '16px',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s ease',
          }}
          className="bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700"
        >
          {/* Tab 头部 */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'bookmarks'
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              收藏夹
              {bookmarkCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  {bookmarkCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reading')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'reading'
                  ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              精读队列
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab 内容 */}
          <div style={{ maxHeight: '430px', overflowY: 'auto' }}>
            {activeTab === 'bookmarks' ? (
              <BookmarksTab bookmarks={bookmarks} />
            ) : (
              <ReadingTab items={readingItems} onRemove={removePaper} />
            )}
          </div>

          {/* 底部操作 */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex justify-between items-center">
            <a
              href={activeTab === 'bookmarks' ? '/tools/bookmarks' : '/tools/reading-list'}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              管理全部 →
            </a>
            <button
              onClick={() => setShowPanel(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ========== 子组件：收藏 Tab ==========
function BookmarksTab({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  if (bookmarks.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
        <div className="text-slate-400 text-sm">还没有收藏</div>
        <div className="text-slate-400 text-xs mt-1">
          在文章标题旁点击星标按钮即可收藏
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      {bookmarks.slice(0, 15).map((item) => {
        const colors = collectionColors[item.collection] || collectionColors.unknown;
        return (
          <a
            key={item.id}
            href={item.url}
            className="block rounded-lg px-3 py-2.5 mb-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${colors.text} ${colors.bg}`}>
                {collectionLabels[item.collection]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="text-sm font-medium text-slate-900 dark:text-white leading-snug"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={item.title}
                >
                  {item.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </span>
                  {item.tags.length > 0 && (
                    <div className="flex gap-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0 rounded text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </a>
        );
      })}
      {bookmarks.length > 15 && (
        <a
          href="/tools/bookmarks"
          className="block text-center py-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          查看全部 {bookmarks.length} 条 →
        </a>
      )}
    </div>
  );
}

// ========== 子组件：精读队列 Tab ==========
function ReadingTab({ items, onRemove }: { items: ReadingListItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
        <div className="text-slate-400 text-sm">还没有收藏论文</div>
        <div className="text-slate-400 text-xs mt-1">
          点击文章中 arXiv 链接旁的书签图标即可收藏
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      {items.slice(0, 10).map((item) => (
        <div
          key={item.id}
          className="rounded-lg px-3 py-2.5 mb-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="text-sm font-medium text-slate-900 dark:text-white leading-snug"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={item.title}
              >
                {item.title}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <a
                  href={item.arxivUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {item.arxivId}
                </a>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">
                  {new Date(item.addedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
                {item.status === 'pending' && (
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>待精读</span>
                )}
                {item.status === 'processing' && (
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>精读中</span>
                )}
                {item.status === 'done' && (
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>已完成</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="text-slate-400 hover:text-red-500 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}
              title="移除"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {items.length > 10 && (
        <a
          href="/tools/reading-list"
          className="block text-center py-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
        >
          查看全部 {items.length} 篇 →
        </a>
      )}
    </div>
  );
}
