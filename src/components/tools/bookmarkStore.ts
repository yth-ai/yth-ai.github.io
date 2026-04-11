/**
 * bookmarkStore — 全站收藏系统数据层
 *
 * localStorage key: maxwell-bookmarks
 * 备份 key: maxwell-bookmarks-backup
 * 支持收藏、标签、筛选、导出、服务端同步
 *
 * 安全机制：
 * 1. 读取异常时返回上次有效快照，不返回空数组
 * 2. 写入前自动备份上一版本
 * 3. 写入失败（QuotaExceeded）时提醒用户
 * 4. 支持通过 sync API 持久化到服务端
 */

export type CollectionType = 'articles' | 'column' | 'book' | 'research' | 'voices' | 'notes' | 'changelog' | 'unknown';

export interface BookmarkItem {
  id: string;
  url: string;           // 页面路径，如 /research/2603-14712/
  title: string;         // 页面标题
  collection: CollectionType;
  tags: string[];        // 用户自定义标签
  createdAt: string;     // ISO datetime
}

const STORAGE_KEY = 'maxwell-bookmarks';
const BACKUP_KEY = 'maxwell-bookmarks-backup';
const TAGS_KEY = 'maxwell-bookmark-tags'; // 最近使用的标签
const SYNC_API = '/api/sync-bookmarks';

// 内存缓存：防止 JSON 解析失败时丢数据
let _cachedBookmarks: BookmarkItem[] | null = null;

// ========== 基础操作 ==========

export function getBookmarks(): BookmarkItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        _cachedBookmarks = parsed;
        return parsed;
      }
    }
    return _cachedBookmarks || [];
  } catch {
    // JSON 解析失败 — 尝试从备份恢复
    console.warn('[bookmarkStore] 主数据解析失败，尝试从备份恢复');
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 用备份恢复主数据
          localStorage.setItem(STORAGE_KEY, backup);
          _cachedBookmarks = parsed;
          console.warn(`[bookmarkStore] 从备份恢复了 ${parsed.length} 条收藏`);
          return parsed;
        }
      }
    } catch {
      // 备份也坏了
    }
    // 最后的防线：返回内存缓存
    return _cachedBookmarks || [];
  }
}

export function saveBookmarks(items: BookmarkItem[]) {
  try {
    // 写入前先备份当前有效数据
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      try {
        const parsed = JSON.parse(current);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(BACKUP_KEY, current);
        }
      } catch {
        // 当前数据已损坏，不备份
      }
    }
    const json = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEY, json);
    _cachedBookmarks = items;
  } catch (err) {
    console.error('[bookmarkStore] 写入失败:', err);
    // QuotaExceededError 等 — 不覆盖，保留原数据
    if (typeof window !== 'undefined') {
      // 通知用户
      const event = new CustomEvent('bookmark-error', {
        detail: { message: '收藏数据保存失败，浏览器存储空间可能已满' }
      });
      window.dispatchEvent(event);
    }
  }
}

// ========== 服务端同步 ==========

let _syncTimer: ReturnType<typeof setTimeout> | null = null;

/** 防抖同步到服务端（写入后 3 秒触发） */
function debouncedSync() {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    syncToServer().catch(() => {});
  }, 3000);
}

/** 将当前收藏同步到服务端 */
export async function syncToServer(): Promise<boolean> {
  return false; // disabled on GitHub Pages
}

/** 从服务端拉取最新收藏（启动时调用） */
export async function syncFromServer(): Promise<boolean> {
  return false; // disabled on GitHub Pages
}

export function isBookmarked(url: string): boolean {
  return getBookmarks().some(item => item.url === url);
}

export function getBookmarkByUrl(url: string): BookmarkItem | undefined {
  return getBookmarks().find(item => item.url === url);
}

// ========== 收藏操作 ==========

export function addBookmark(url: string, title: string, collection: CollectionType): BookmarkItem {
  const items = getBookmarks();
  const existing = items.find(item => item.url === url);
  if (existing) return existing;

  const newItem: BookmarkItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    url,
    title,
    collection,
    tags: [],
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...items];
  saveBookmarks(updated);
  debouncedSync();
  return newItem;
}

export function removeBookmark(url: string) {
  const items = getBookmarks();
  const updated = items.filter(item => item.url !== url);
  saveBookmarks(updated);
  debouncedSync();
}

export function toggleBookmark(url: string, title: string, collection: CollectionType): boolean {
  if (isBookmarked(url)) {
    removeBookmark(url);
    return false; // 取消收藏
  } else {
    addBookmark(url, title, collection);
    return true; // 新增收藏
  }
}

// ========== 标签操作 ==========

export function addTagToBookmark(url: string, tag: string) {
  const items = getBookmarks();
  const updated = items.map(item => {
    if (item.url === url && !item.tags.includes(tag)) {
      return { ...item, tags: [...item.tags, tag] };
    }
    return item;
  });
  saveBookmarks(updated);
  recordRecentTag(tag);
  debouncedSync();
}

export function removeTagFromBookmark(url: string, tag: string) {
  const items = getBookmarks();
  const updated = items.map(item => {
    if (item.url === url) {
      return { ...item, tags: item.tags.filter(t => t !== tag) };
    }
    return item;
  });
  saveBookmarks(updated);
  debouncedSync();
}

export function setBookmarkTags(url: string, tags: string[]) {
  const items = getBookmarks();
  const updated = items.map(item => {
    if (item.url === url) {
      return { ...item, tags };
    }
    return item;
  });
  saveBookmarks(updated);
  tags.forEach(recordRecentTag);
  debouncedSync();
}

// 最近使用的标签（用于快捷选择）
export function getRecentTags(): string[] {
  try {
    const data = localStorage.getItem(TAGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function recordRecentTag(tag: string) {
  const tags = getRecentTags().filter(t => t !== tag);
  tags.unshift(tag);
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags.slice(0, 20)));
}

// ========== 查询 ==========

export function getAllTags(): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const item of getBookmarks()) {
    for (const tag of item.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getBookmarksByTag(tag: string): BookmarkItem[] {
  return getBookmarks().filter(item => item.tags.includes(tag));
}

export function getBookmarksByCollection(collection: CollectionType): BookmarkItem[] {
  return getBookmarks().filter(item => item.collection === collection);
}

// ========== 工具 ==========

export function detectCollection(url: string): CollectionType {
  if (url.startsWith('/articles/')) return 'articles';
  if (url.startsWith('/column/')) return 'column';
  if (url.startsWith('/book/')) return 'book';
  if (url.startsWith('/research/')) return 'research';
  if (url.startsWith('/voices/')) return 'voices';
  if (url.startsWith('/notes/')) return 'notes';
  if (url.startsWith('/changelog/')) return 'changelog';
  return 'unknown';
}

export const collectionLabels: Record<CollectionType, string> = {
  articles: '文章',
  column: '专栏',
  book: '书籍',
  research: '研究',
  voices: '声浪',
  notes: '笔记',
  changelog: '更新日志',
  unknown: '其他',
};

export const collectionColors: Record<CollectionType, { text: string; bg: string; border: string }> = {
  articles: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  column: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
  book: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  research: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800' },
  voices: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
  notes: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
  changelog: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' },
  unknown: { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' },
};

export function exportBookmarksMarkdown(): string {
  const items = getBookmarks();
  const byCollection = new Map<CollectionType, BookmarkItem[]>();
  for (const item of items) {
    const list = byCollection.get(item.collection) || [];
    list.push(item);
    byCollection.set(item.collection, list);
  }

  let md = `# Maxwell 收藏夹\n\n> 导出时间: ${new Date().toLocaleString('zh-CN')}\n> 共 ${items.length} 条收藏\n\n`;

  for (const [collection, list] of byCollection) {
    md += `## ${collectionLabels[collection]}\n\n`;
    for (const item of list) {
      const tags = item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : '';
      md += `- [${item.title}](${item.url})${tags}\n`;
    }
    md += '\n';
  }

  return md;
}
