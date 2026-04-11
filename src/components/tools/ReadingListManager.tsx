/**
 * ReadingListManager — 精读队列管理页面
 *
 * 功能：
 * 1. 显示所有收藏的论文（从 localStorage 读取，合并仓库状态）
 * 2. 支持排序、筛选、删除、编辑备注
 * 3. 提供「同步到仓库」和「从仓库拉取」双向同步
 * 4. 手动添加 arXiv URL
 */
import { useState, useEffect, useCallback } from 'react';
import type { ReadingListItem } from './PaperCollector';

const STORAGE_KEY = 'maxwell-reading-list';

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

/**
 * 将仓库数据合并到本地：
 * - 仓库中有的条目，以仓库 status 为准（精读系统直接改 JSON）
 * - 本地有但仓库没有的条目保留（可能尚未同步）
 * - 仓库有但本地没有的条目也加入（可能是其他来源添加的）
 */
function mergeWithServer(local: ReadingListItem[], server: ReadingListItem[]): ReadingListItem[] {
  const serverMap = new Map(server.map(s => [s.arxivId, s]));
  const localMap = new Map(local.map(l => [l.arxivId, l]));

  // 更新本地已有条目的 status
  const merged = local.map(item => {
    const serverItem = serverMap.get(item.arxivId);
    if (serverItem && serverItem.status !== item.status) {
      return { ...item, status: serverItem.status };
    }
    return item;
  });

  // 加入仓库有但本地没有的条目
  for (const serverItem of server) {
    if (!localMap.has(serverItem.arxivId)) {
      merged.push(serverItem);
    }
  }

  return merged;
}

function extractArxivId(url: string): string | null {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d+\.\d+)/);
  return match ? match[1] : null;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'done' | 'failed';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待精读', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  processing: { label: '精读中', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  done: { label: '已完成', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
  failed: { label: '失败', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
};

interface Props {
  /** 构建时从 reading-list.json 注入的仓库数据 */
  serverData?: ReadingListItem[];
}

export default function ReadingListManager({ serverData }: Props) {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  // 初始化：从 localStorage 读取并与构建时注入的仓库数据合并
  useEffect(() => {
    const local = getReadingList();
    if (serverData && serverData.length > 0) {
      const merged = mergeWithServer(local, serverData);
      saveReadingList(merged);
      setItems(merged);
    } else {
      setItems(local);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(() => {
    setItems(getReadingList());
  }, []);

  // 手动添加论文
  const handleAdd = useCallback(() => {
    const url = addUrl.trim();
    if (!url) return;

    const arxivId = extractArxivId(url);
    if (!arxivId) {
      showToast('无效的 arXiv URL，请输入类似 https://arxiv.org/abs/2603.18534 的链接');
      return;
    }

    const current = getReadingList();
    if (current.some(item => item.arxivId === arxivId)) {
      showToast('该论文已在队列中');
      return;
    }

    const newItem: ReadingListItem = {
      id: generateId(),
      arxivId,
      arxivUrl: `https://arxiv.org/abs/${arxivId}`,
      title: addTitle.trim() || `arXiv:${arxivId}`,
      source: '手动添加',
      sourceUrl: '/tools/reading-list',
      addedAt: new Date().toISOString(),
      status: 'pending',
    };

    const updated = [newItem, ...current];
    saveReadingList(updated);
    setItems(updated);
    setAddUrl('');
    setAddTitle('');
    showToast(`已添加: ${arxivId}`);
  }, [addUrl, addTitle, showToast]);

  // 删除论文
  const handleRemove = useCallback((id: string) => {
    const updated = getReadingList().filter(item => item.id !== id);
    saveReadingList(updated);
    setItems(updated);
  }, []);

  // 保存备注
  const handleSaveNote = useCallback((id: string) => {
    const current = getReadingList();
    const updated = current.map(item =>
      item.id === id ? { ...item, note: editNote } : item
    );
    saveReadingList(updated);
    setItems(updated);
    setEditingId(null);
    setEditNote('');
  }, [editNote]);

  // 导出为 JSON（复制到剪贴板）
  const handleExportClipboard = useCallback(() => {
    const pending = items.filter(i => i.status === 'pending');
    const json = JSON.stringify(pending, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showToast(`已复制 ${pending.length} 篇待精读论文的 JSON 到剪贴板`);
    }).catch(() => {
      showToast('复制失败，请手动复制');
    });
  }, [items, showToast]);

  // 导出为 JSON 文件下载
  const handleExportFile = useCallback(() => {
    const pending = items.filter(i => i.status === 'pending');
    const json = JSON.stringify(pending, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reading-list.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(`已下载 ${pending.length} 篇待精读论文`);
  }, [items, showToast]);

  // 清空已完成
  const handleClearDone = useCallback(() => {
    const updated = getReadingList().filter(item => item.status !== 'done');
    saveReadingList(updated);
    setItems(updated);
    showToast('已清空所有已完成项');
  }, [showToast]);

  // 同步到仓库（POST 到服务端 API）
  const [syncing, setSyncing] = useState(false);
  const handleSyncToRepo = useCallback(async () => {
    setSyncing(true);
    try {
      const allItems = getReadingList();
      const resp = await fetch('/api/sync-reading-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allItems),
      });
      const result = await resp.json();
      if (result.ok) {
        showToast(`已同步 ${result.count} 篇到仓库${result.pushed ? '（已推送）' : ''}`);
      } else {
        showToast(`同步失败: ${result.error}`);
      }
    } catch (err) {
      showToast('同步失败: 无法连接服务端');
    } finally {
      setSyncing(false);
    }
  }, [showToast]);

  // 从仓库拉取最新状态（GET 服务端 API）
  const [pulling, setPulling] = useState(false);
  const handlePullFromRepo = useCallback(async () => {
    setPulling(true);
    try {
      throw new Error('同步功能仅在内网版可用');
      const result = await resp.json();
      if (result.ok && Array.isArray(result.items)) {
        const local = getReadingList();
        const merged = mergeWithServer(local, result.items);
        saveReadingList(merged);
        setItems(merged);
        const updated = merged.filter((m, i) => {
          const orig = local.find(l => l.arxivId === m.arxivId);
          return orig && orig.status !== m.status;
        }).length;
        showToast(updated > 0 ? `已更新 ${updated} 篇论文状态` : '状态已是最新');
      } else {
        showToast('拉取失败: 服务端返回异常');
      }
    } catch (err) {
      showToast('拉取失败: 无法连接服务端');
    } finally {
      setPulling(false);
    }
  }, [showToast]);

  // 筛选
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const counts = {
    all: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    processing: items.filter(i => i.status === 'processing').length,
    done: items.filter(i => i.status === 'done').length,
    failed: items.filter(i => i.status === 'failed').length,
  };

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
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{counts.all}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">总计</div>
        </div>
        <div className="card p-4 text-center border-amber-200 dark:border-amber-800">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.pending}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">待精读</div>
        </div>
        <div className="card p-4 text-center border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{counts.processing}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">精读中</div>
        </div>
        <div className="card p-4 text-center border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.done}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">已完成</div>
        </div>
      </div>

      {/* 手动添加区 */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">手动添加论文</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="arXiv URL，如 https://arxiv.org/abs/2603.18534"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="text"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            placeholder="论文标题（可选）"
            className="sm:w-60 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            添加
          </button>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 筛选标签 */}
        <div className="flex gap-1.5">
          {(['all', 'pending', 'processing', 'done', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === status
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? '全部' : statusConfig[status].label}
              {counts[status] > 0 && ` (${counts[status]})`}
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handlePullFromRepo}
            disabled={pulling}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pulling
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40'
            }`}
            title="从 Git 仓库拉取最新状态（精读完成后自动更新）"
          >
            {pulling ? '拉取中...' : '↓ 拉取状态'}
          </button>
          <button
            onClick={handleSyncToRepo}
            disabled={syncing || counts.pending === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              syncing || counts.pending === 0
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40'
            }`}
            title="将收藏列表同步到 Git 仓库，触发自动精读"
          >
            {syncing ? '同步中...' : '↑ 同步到仓库'}
          </button>
          <button
            onClick={handleExportClipboard}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="复制待精读论文的 JSON 到剪贴板"
          >
            复制 JSON
          </button>
          <button
            onClick={handleExportFile}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="下载待精读论文的 JSON 文件"
          >
            下载 JSON
          </button>
          {counts.done > 0 && (
            <button
              onClick={handleClearDone}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              清空已完成
            </button>
          )}
        </div>
      </div>

      {/* 论文列表 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              {filter === 'all' ? '精读队列为空' : `没有${statusConfig[filter]?.label || ''}的论文`}
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-xs mt-2">
              在专栏文章中点击 arXiv 链接旁的书签图标收藏论文，或在上方手动添加
            </div>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="card p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
              <div className="flex items-start gap-3">
                {/* 状态指示 */}
                <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${statusConfig[item.status]?.color || ''} ${statusConfig[item.status]?.bg || ''}`}>
                  {statusConfig[item.status]?.label || item.status}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors text-xs"
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <a
                      href={item.arxivUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      arXiv:{item.arxivId}
                    </a>
                    {item.status === 'done' && (
                      <a
                        href={`/research/${item.arxivId.replace('.', '-')}/`}
                        className="text-green-600 dark:text-green-400 hover:underline font-medium"
                      >
                        → 查看精读
                      </a>
                    )}
                    <span>来源: <a href={item.sourceUrl} className="hover:underline">{item.source}</a></span>
                    <span>{new Date(item.addedAt).toLocaleString('zh-CN', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  </div>

                  {/* 备注 */}
                  {editingId === item.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="添加备注..."
                        className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2 py-1 rounded text-xs bg-violet-600 text-white"
                      >
                        保存
                      </button>
                    </div>
                  ) : (
                    <div
                      className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={() => { setEditingId(item.id); setEditNote(item.note || ''); }}
                    >
                      {item.note || '+ 添加备注'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 使用说明 */}
      <div className="card p-5 bg-slate-50 dark:bg-slate-800/50 border-dashed">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">工作流程</h3>
        <ol className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
          <li>在专栏文章中，arXiv 链接旁会自动出现收藏按钮（书签图标）</li>
          <li>点击收藏后，论文会加入精读队列，也可以在上方手动添加</li>
          <li>点击「↑ 同步到仓库」将收藏列表推送到 Git，触发自动精读</li>
          <li>自动化每小时扫描一次队列，对待精读的论文执行深度精读</li>
          <li>精读完成后点击「↓ 拉取状态」获取最新进度（每次部署也会自动同步）</li>
        </ol>
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
