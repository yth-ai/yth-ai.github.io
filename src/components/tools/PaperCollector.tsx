/**
 * PaperCollector — 专栏页面内嵌的论文收藏组件
 *
 * 功能：
 * 1. 自动扫描页面中所有 arXiv 链接
 * 2. 在每个 arXiv 链接旁注入「📌 加入精读」按钮
 * 3. 右下角浮标显示精读队列数量，点击展开队列预览
 * 4. 数据持久化到 localStorage
 */
import { useState, useEffect, useCallback, useRef } from 'react';

// ========== 类型定义 ==========
export interface ReadingListItem {
  id: string;
  arxivId: string;
  arxivUrl: string;
  title: string;
  source: string; // 来源页面标题
  sourceUrl: string; // 来源页面 URL
  addedAt: string; // ISO datetime
  status: 'pending' | 'processing' | 'done' | 'failed';
  note?: string;
}

const STORAGE_KEY = 'maxwell-reading-list';

// ========== 工具函数 ==========
function extractArxivId(url: string): string | null {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
  return match ? match[1] : null;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getReadingList(): ReadingListItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReadingList(items: ReadingListItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ========== 主组件 ==========
export default function PaperCollector() {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [injected, setInjected] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 加载 localStorage 数据
  useEffect(() => {
    setItems(getReadingList());
  }, []);

  // Toast 自动消失
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // 收藏论文
  const collectPaper = useCallback((arxivUrl: string, linkText: string) => {
    const arxivId = extractArxivId(arxivUrl);
    if (!arxivId) return;

    const current = getReadingList();
    if (current.some(item => item.arxivId === arxivId)) {
      showToast('已在精读队列中');
      return;
    }

    // 尝试从链接上下文提取论文标题
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
    setItems(updated);
    showToast(`已加入精读队列: ${arxivId}`);
  }, [showToast]);

  // 移除论文
  const removePaper = useCallback((id: string) => {
    const current = getReadingList();
    const updated = current.filter(item => item.id !== id);
    saveReadingList(updated);
    setItems(updated);
  }, []);

  // 扫描页面并注入按钮
  useEffect(() => {
    if (injected) return;

    const injectButtons = () => {
      // 选择内容区域中的所有链接
      const contentArea = document.querySelector('.prose-custom');
      if (!contentArea) return;

      const links = contentArea.querySelectorAll('a[href*="arxiv.org"]');
      if (links.length === 0) return;

      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        const arxivId = extractArxivId(href);
        if (!arxivId) return;

        // 避免重复注入
        if (link.parentElement?.querySelector('.paper-collect-btn')) return;

        // 查找论文标题——向上找最近的段落/标题中的粗体文本
        let paperTitle = '';
        const parentBlock = link.closest('p, li, h2, h3, h4');
        if (parentBlock) {
          // 先找同区块内的 strong/b 标签
          const boldEl = parentBlock.querySelector('strong, b');
          if (boldEl && boldEl.textContent) {
            paperTitle = boldEl.textContent;
          }
          // 或者向上找 h2/h3 标题
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
            // 已收藏 → 变成已收藏状态
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
            btn.style.color = 'rgb(139, 92, 246)';
            showToast('已在精读队列中');
            return;
          }

          collectPaper(href, paperTitle || (link as HTMLAnchorElement).textContent || '');

          // 视觉反馈：变为已收藏状态
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
          btn.style.background = 'rgba(139, 92, 246, 0.2)';
          btn.style.color = 'rgb(139, 92, 246)';
          btn.title = '已加入精读队列';
        });

        // 检查是否已收藏
        const currentList = getReadingList();
        if (currentList.some(item => item.arxivId === arxivId)) {
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
          btn.style.background = 'rgba(139, 92, 246, 0.2)';
          btn.title = '已在精读队列中';
        }

        // 插入按钮到链接后面
        link.parentNode?.insertBefore(btn, link.nextSibling);
      });

      setInjected(true);
    };

    // 等待内容渲染完成
    const timer = setTimeout(injectButtons, 500);
    return () => clearTimeout(timer);
  }, [injected, collectPaper, showToast]);

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const totalCount = items.length;

  return (
    <>
      {/* Toast 提示 */}
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
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
          transition: 'all 0.3s',
          fontSize: '20px',
        }}
        title={`精读队列 (${pendingCount} 篇待精读)`}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
        {pendingCount > 0 && (
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
            {pendingCount}
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
            width: '380px',
            maxHeight: '480px',
            borderRadius: '12px',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s ease',
          }}
          className="dark:!bg-slate-800"
        >
          {/* 面板头部 */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>精读队列</div>
              <div style={{ fontSize: '12px', opacity: 0.85 }}>
                {pendingCount} 篇待精读 · {totalCount} 篇总计
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="/tools/reading-list"
                style={{
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.2)',
                  textDecoration: 'none',
                }}
              >
                管理
              </a>
              <button
                onClick={() => setShowPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* 面板内容 */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
            {items.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
                <div>还没有收藏论文</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  点击文章中 arXiv 链接旁的书签图标即可收藏
                </div>
              </div>
            ) : (
              items.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    transition: 'background 0.2s',
                    cursor: 'default',
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        className="text-slate-900 dark:text-white"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11px' }}>
                        <a
                          href={item.arxivUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#8b5cf6', textDecoration: 'none' }}
                        >
                          {item.arxivId}
                        </a>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400">
                          {new Date(item.addedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </span>
                        {item.status === 'pending' && (
                          <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 600 }}>待精读</span>
                        )}
                        {item.status === 'processing' && (
                          <span style={{ color: '#3b82f6', fontSize: '10px', fontWeight: 600 }}>精读中</span>
                        )}
                        {item.status === 'done' && (
                          <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 600 }}>已完成</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removePaper(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: '#94a3b8',
                        fontSize: '14px',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                      title="移除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
            {items.length > 10 && (
              <a
                href="/tools/reading-list"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '8px',
                  fontSize: '13px',
                  color: '#8b5cf6',
                  textDecoration: 'none',
                }}
              >
                查看全部 {totalCount} 篇 →
              </a>
            )}
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
