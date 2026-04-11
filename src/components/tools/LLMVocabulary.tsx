import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import vocabData from '../../data/vocabulary.json';

// Types
interface VocabItem {
  id: string; term: string; phonetic?: string; translation: string;
  definition: string; example: string; exampleCn: string;
  category: string; difficulty: 'beginner' | 'intermediate' | 'advanced';
  related?: string[]; isNew?: boolean;
}
interface Expression {
  id: string; english: string; chinese: string; context: string; category: string;
}
interface CategoryInfo { name: string; emoji: string; group: string; }
type MarkStatus = 'learning' | 'familiar' | 'discarded';
interface CardState { interval: number; ease: number; nextReview: number; reviews: number; }
type Rating = 'again' | 'hard' | 'good' | 'easy';
type ViewMode = 'browse' | 'flashcard' | 'expressions' | 'quiz' | 'add' | 'dashboard';
interface ReviewLog { date: string; count: number; ratings: Record<Rating, number>; }

// Data from JSON
const CATS = vocabData.categories as Record<string, CategoryInfo>;
const BUILTIN_V = vocabData.vocabulary as VocabItem[];
const BUILTIN_E = vocabData.expressions as Expression[];

// Spaced repetition
function initCard(): CardState { return { interval: 0, ease: 2.5, nextReview: 0, reviews: 0 }; }
function rateCard(s: CardState, r: Rating): CardState {
  const n = { ...s, reviews: s.reviews + 1 };
  if (r === 'again') { n.interval = 0; n.ease = Math.max(1.3, s.ease - 0.2); n.nextReview = Date.now(); }
  else if (r === 'hard') { n.interval = Math.max(1, s.interval * 1.2); n.ease = Math.max(1.3, s.ease - 0.15); n.nextReview = Date.now() + n.interval * 864e5; }
  else if (r === 'good') { n.interval = s.interval === 0 ? 1 : s.interval * s.ease; n.nextReview = Date.now() + n.interval * 864e5; }
  else { n.interval = s.interval === 0 ? 4 : s.interval * s.ease * 1.3; n.ease = s.ease + 0.15; n.nextReview = Date.now() + n.interval * 864e5; }
  return n;
}

// Storage with quota awareness
const SK = 'maxwell-vocab';
let _storageWarnCb: ((msg: string) => void) | null = null;
function ld<T>(k: string, f: T): T { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } }
function sv(k: string, v: unknown) {
  try {
    const json = JSON.stringify(v);
    localStorage.setItem(k, json);
    // Check quota usage — warn at ~4MB (typical 5MB limit)
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) total += localStorage.getItem(key)!.length;
    }
    if (total > 4 * 1024 * 1024 && _storageWarnCb) {
      _storageWarnCb(`存储空间已使用 ${(total / 1024 / 1024).toFixed(1)}MB，接近浏览器限制。建议导出备份。`);
    }
  } catch (e) {
    if (_storageWarnCb) _storageWarnCb('存储写入失败——浏览器空间可能已满。请导出数据后清理。');
  }
}

// Merge helper for import
function mergeRecords<T extends Record<string, unknown>>(existing: T, incoming: T, pickHigher?: (a: unknown, b: unknown) => unknown): T {
  const result = { ...existing };
  for (const key of Object.keys(incoming)) {
    if (key in result && pickHigher) {
      (result as Record<string, unknown>)[key] = pickHigher(result[key], (incoming as Record<string, unknown>)[key]);
    } else {
      (result as Record<string, unknown>)[key] = (incoming as Record<string, unknown>)[key];
    }
  }
  return result;
}
function mergeArrayById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map(item => [item.id, item]));
  for (const item of incoming) { if (!map.has(item.id)) map.set(item.id, item); }
  return Array.from(map.values());
}

// TTS — pick best English voice
let _enVoice: SpeechSynthesisVoice | null = null;
let _voiceReady = false;
function pickEnVoice(): SpeechSynthesisVoice | null {
  if (_enVoice) return _enVoice;
  const voices = window.speechSynthesis?.getVoices() || [];
  // Preference order: premium native voices > Google > any en-US > any en
  const prefs = [
    /Samantha/i, /Karen/i, /Daniel/i, /Moira/i, /Rishi/i,        // macOS native (high quality)
    /Google US English/i, /Google UK English/i,                     // Chrome Google voices
    /Microsoft.*English/i,                                          // Windows
  ];
  for (const re of prefs) {
    const v = voices.find(v => re.test(v.name) && /en/i.test(v.lang));
    if (v) { _enVoice = v; return v; }
  }
  // Fallback: any en-US, then any en-*
  const enUS = voices.find(v => v.lang === 'en-US');
  if (enUS) { _enVoice = enUS; return enUS; }
  const enAny = voices.find(v => v.lang.startsWith('en'));
  if (enAny) { _enVoice = enAny; return enAny; }
  return null;
}
// Voices may load async — listen once
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { _enVoice = null; _voiceReady = true; pickEnVoice(); };
  // Some browsers fire synchronously
  if (window.speechSynthesis.getVoices().length > 0) { _voiceReady = true; pickEnVoice(); }
}

function speakWithSynth(t: string, rate: number) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'en-US';
  u.rate = rate;
  const voice = pickEnVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

function speak(t: string) {
  if (!t.includes(' ')) {
    // Single word: prefer Youdao real-person audio
    const a = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(t)}&type=1`);
    a.play().catch(() => speakWithSynth(t, 0.9));
  } else {
    speakWithSynth(t, 0.88);
  }
}

const DIFF: Record<string, { label: string; color: string }> = {
  beginner: { label: '入门', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  intermediate: { label: '进阶', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  advanced: { label: '高级', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};
const MARKS: Record<MarkStatus, { label: string; icon: string; bg: string }> = {
  learning: { label: '学习中', icon: '📖', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  familiar: { label: '已熟悉', icon: '✅', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  discarded: { label: '已跳过', icon: '⏭️', bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

// SVG icon components
const SpeakerIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>;
const StarIcon = ({ filled }: { filled: boolean }) => <svg className={`w-4 h-4 ${filled ? 'fill-amber-400 text-amber-400' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const SearchIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CloseIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export default function LLMVocabulary() {
  const [mode, setMode] = useState<ViewMode>('browse');
  const [selCat, setSelCat] = useState('all');
  const [selDiff, setSelDiff] = useState('all');
  const [search, setSearch] = useState('');
  const [markFilter, setMarkFilter] = useState<'all' | MarkStatus | 'unmarked'>('all');
  const [userV, setUserV] = useState<VocabItem[]>([]);
  const [userE, setUserE] = useState<Expression[]>([]);
  const [marks, setMarks] = useState<Record<string, MarkStatus>>({});
  const [prog, setProg] = useState<Record<string, CardState>>({});
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [exprCat, setExprCat] = useState('all');
  const [exprFavs, setExprFavs] = useState<Set<string>>(new Set());
  const [exprFavOnly, setExprFavOnly] = useState(false);
  const [quiz, setQuiz] = useState<{ q: VocabItem; opts: string[]; sel: number | null; cor: number } | null>(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [addType, setAddType] = useState<'vocab' | 'expr'>('vocab');
  const [af, setAf] = useState({ term: '', phonetic: '', translation: '', definition: '', example: '', exampleCn: '', category: 'general', difficulty: 'beginner' as const });
  const [ef, setEf] = useState({ english: '', chinese: '', context: '', category: '论文写作' });
  const [showIO, setShowIO] = useState(false);
  const [daily, setDaily] = useState<VocabItem | null>(null);
  const [showDaily, setShowDaily] = useState(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewLog[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const allV = useMemo(() => [...BUILTIN_V, ...userV], [userV]);
  const allE = useMemo(() => [...BUILTIN_E, ...userE], [userE]);

  useEffect(() => {
    _storageWarnCb = (msg: string) => setStorageWarning(msg);
    setProg(ld(SK + '-prog', {}));
    setMarks(ld(SK + '-marks', {}));
    setUserV(ld(SK + '-uv', []));
    setUserE(ld(SK + '-ue', []));
    setFavs(new Set(ld<string[]>(SK + '-fav', [])));
    setExprFavs(new Set(ld<string[]>(SK + '-efav', [])));
    setReviewHistory(ld<ReviewLog[]>(SK + '-rh', []));
    const d = new Date(); const i = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % BUILTIN_V.length;
    setDaily(BUILTIN_V[i]);
    return () => { _storageWarnCb = null; };
  }, []);

  const filtered = useMemo(() => allV.filter(v => {
    if (favOnly && !favs.has(v.id)) return false;
    if (selCat !== 'all' && v.category !== selCat) return false;
    if (selDiff !== 'all' && v.difficulty !== selDiff) return false;
    if (markFilter !== 'all') { const m = marks[v.id]; if (markFilter === 'unmarked' ? m : m !== markFilter) return false; }
    if (search) { const q = search.toLowerCase(); return v.term.toLowerCase().includes(q) || v.translation.includes(q) || v.definition.toLowerCase().includes(q); }
    return true;
  }), [allV, selCat, selDiff, search, favOnly, favs, markFilter, marks]);

  const review = useMemo(() => { const now = Date.now(); return allV.filter(v => { if (marks[v.id] === 'familiar' || marks[v.id] === 'discarded') return false; const s = prog[v.id]; return !s || s.nextReview <= now; }); }, [allV, prog, marks]);
  const deck = useMemo(() => selCat === 'all' ? review : review.filter(v => v.category === selCat), [review, selCat]);

  const stats = useMemo(() => ({
    total: allV.length,
    learning: Object.values(marks).filter(m => m === 'learning').length,
    familiar: Object.values(marks).filter(m => m === 'familiar').length,
    due: review.length,
    custom: userV.length + userE.length,
  }), [allV, marks, review, userV, userE]);

  const setMark = useCallback((id: string, st: MarkStatus | null) => {
    setMarks(p => { const n = { ...p }; st === null ? delete n[id] : n[id] = st; sv(SK + '-marks', n); return n; });
  }, []);
  const toggleFav = useCallback((id: string) => {
    setFavs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); sv(SK + '-fav', [...n]); return n; });
  }, []);
  const rate = useCallback((r: Rating) => {
    if (!deck[ci]) return;
    const id = deck[ci].id, cur = prog[id] || initCard(), next = rateCard(cur, r);
    const np = { ...prog, [id]: next }; setProg(np); sv(SK + '-prog', np);
    // Log review for heatmap
    const today = new Date().toISOString().slice(0, 10);
    setReviewHistory(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(l => l.date === today);
      if (idx >= 0) {
        copy[idx] = { ...copy[idx], count: copy[idx].count + 1, ratings: { ...copy[idx].ratings, [r]: (copy[idx].ratings[r] || 0) + 1 } };
      } else {
        copy.push({ date: today, count: 1, ratings: { again: 0, hard: 0, good: 0, easy: 0, [r]: 1 } });
      }
      // Keep last 180 days only
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 180);
      const filtered = copy.filter(l => l.date >= cutoff.toISOString().slice(0, 10));
      sv(SK + '-rh', filtered);
      return filtered;
    });
    setFlipped(false); setCi(i => i < deck.length - 1 ? i + 1 : 0);
  }, [ci, deck, prog]);

  const genQuiz = useCallback(() => {
    const pool = selCat === 'all' ? allV : allV.filter(v => v.category === selCat);
    if (pool.length < 4) return;
    const qi = Math.floor(Math.random() * pool.length), q = pool[qi];
    const wrong = pool.filter((_, i) => i !== qi).sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.translation);
    const c = Math.floor(Math.random() * 4); const opts = [...wrong]; opts.splice(c, 0, q.translation);
    setQuiz({ q, opts, sel: null, cor: c });
  }, [selCat, allV]);

  const ansQuiz = useCallback((i: number) => {
    if (!quiz || quiz.sel !== null) return;
    setQuiz(p => p ? { ...p, sel: i } : null);
    setScore(p => ({ c: p.c + (i === quiz.cor ? 1 : 0), t: p.t + 1 }));
  }, [quiz]);

  const addVocab = useCallback(() => {
    if (!af.term.trim() || !af.translation.trim()) return;
    const item: VocabItem = { ...af, id: 'u-' + Date.now(), related: [], isNew: true };
    const n = [...userV, item]; setUserV(n); sv(SK + '-uv', n);
    setAf({ term: '', phonetic: '', translation: '', definition: '', example: '', exampleCn: '', category: 'general', difficulty: 'beginner' });
  }, [af, userV]);

  const addExpr = useCallback(() => {
    if (!ef.english.trim() || !ef.chinese.trim()) return;
    const item: Expression = { ...ef, id: 'ue-' + Date.now() };
    const n = [...userE, item]; setUserE(n); sv(SK + '-ue', n);
    setEf({ english: '', chinese: '', context: '', category: '论文写作' });
  }, [ef, userE]);

  const doExport = useCallback(() => {
    const d = { marks, prog, favs: [...favs], userV, userE, exprFavs: [...exprFavs], reviewHistory, at: new Date().toISOString() };
    const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = `vocab-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }, [marks, prog, favs, userV, userE, exprFavs, reviewHistory]);

  const doImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { try {
      const d = JSON.parse(ev.target?.result as string);
      // Incremental merge: keep higher-progress data, append new items
      if (d.marks) {
        setMarks(prev => {
          const merged = mergeRecords(prev, d.marks);
          sv(SK + '-marks', merged); return merged;
        });
      }
      if (d.prog) {
        setProg(prev => {
          const merged = mergeRecords(prev, d.prog, (a, b) => {
            const ca = a as CardState, cb = b as CardState;
            return (ca.reviews >= cb.reviews) ? ca : cb; // keep higher review count
          });
          sv(SK + '-prog', merged); return merged;
        });
      }
      if (d.favs) {
        setFavs(prev => {
          const merged = new Set([...prev, ...d.favs]);
          sv(SK + '-fav', [...merged]); return merged;
        });
      }
      if (d.userV) {
        setUserV(prev => {
          const merged = mergeArrayById(prev, d.userV);
          sv(SK + '-uv', merged); return merged;
        });
      }
      if (d.userE) {
        setUserE(prev => {
          const merged = mergeArrayById(prev, d.userE);
          sv(SK + '-ue', merged); return merged;
        });
      }
      if (d.exprFavs) {
        setExprFavs(prev => {
          const merged = new Set([...prev, ...d.exprFavs]);
          sv(SK + '-efav', [...merged]); return merged;
        });
      }
      if (d.reviewHistory) {
        setReviewHistory(prev => {
          const map = new Map(prev.map(l => [l.date, l]));
          for (const log of d.reviewHistory as ReviewLog[]) {
            const existing = map.get(log.date);
            if (existing) {
              map.set(log.date, { date: log.date, count: Math.max(existing.count, log.count), ratings: {
                again: Math.max(existing.ratings.again || 0, log.ratings.again || 0),
                hard: Math.max(existing.ratings.hard || 0, log.ratings.hard || 0),
                good: Math.max(existing.ratings.good || 0, log.ratings.good || 0),
                easy: Math.max(existing.ratings.easy || 0, log.ratings.easy || 0),
              }});
            } else { map.set(log.date, log); }
          }
          const merged = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
          sv(SK + '-rh', merged); return merged;
        });
      }
      alert('导入成功（增量合并，已有进度已保留）');
    } catch { alert('格式错误'); } };
    r.readAsText(f); e.target.value = '';
  }, []);

  const catGroups = useMemo(() => {
    const g: Record<string, { k: string; i: CategoryInfo }[]> = {};
    Object.entries(CATS).forEach(([k, i]) => { const gn = i.group || '其他'; if (!g[gn]) g[gn] = []; g[gn].push({ k, i }); });
    return g;
  }, []);
  const eCats = useMemo(() => [...new Set(allE.map(e => e.category))], [allE]);
  const filtE = useMemo(() => allE.filter(e => {
    if (exprFavOnly && !exprFavs.has(e.id)) return false;
    if (exprCat !== 'all' && e.category !== exprCat) return false;
    return true;
  }), [allE, exprCat, exprFavOnly, exprFavs]);

  useEffect(() => {
    if (mode !== 'flashcard') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      if (flipped) { if (e.key === '1') rate('again'); if (e.key === '2') rate('hard'); if (e.key === '3') rate('good'); if (e.key === '4') rate('easy'); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [mode, flipped, rate]);

  // --- Render helpers ---
  const markBtns = (id: string) => (
    <div className="flex items-center gap-1">
      {(Object.entries(MARKS) as [MarkStatus, typeof MARKS[MarkStatus]][]).map(([st, cfg]) => (
        <button key={st} onClick={e => { e.stopPropagation(); setMark(id, marks[id] === st ? null : st); }}
          title={marks[id] === st ? `取消${cfg.label}` : cfg.label}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all border ${marks[id] === st ? cfg.bg : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}>
          {cfg.icon}{marks[id] === st && <span className="ml-0.5">{cfg.label}</span>}
        </button>
      ))}
    </div>
  );

  const vCard = (v: VocabItem, green = false) => {
    const cat = CATS[v.category], d = DIFF[v.difficulty], fav = favs.has(v.id), cs = prog[v.id], isU = v.id.startsWith('u-');
    return (
      <div key={v.id} className={`group rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md ${
        green ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
        : marks[v.id] === 'discarded' ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
      }`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{v.term}</h3>
                {v.phonetic && <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">{v.phonetic}</span>}
                <button onClick={e => { e.stopPropagation(); speak(v.term); }} title="朗读"
                  className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><SpeakerIcon /></button>
                {v.isNew && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">✨ 新</span>}
                {isU && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">手动</span>}
              </div>
              <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{v.translation}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {d && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.color}`}>{d.label}</span>}
              {cat && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{cat.emoji} {cat.name}</span>}
              <button onClick={() => toggleFav(v.id)} className={`p-1 rounded-lg transition-colors ${fav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}>
                <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{v.definition}</p>
          {(v.example || v.exampleCn) && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-3">
              {v.example && <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-mono text-indigo-500 mr-1.5">EN</span><span className="italic">{v.example}</span></p>}
              {v.exampleCn && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5"><span className="font-mono text-pink-500 mr-1.5">CN</span>{v.exampleCn}</p>}
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {v.related && v.related.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400">相关:</span>
                {v.related.map(r => <span key={r} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-400">{r}</span>)}
              </div>
            )}
            {markBtns(v.id)}
          </div>
          {cs && cs.reviews > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <span className="text-xs text-slate-400">已复习 {cs.reviews} 次 · 下次: {cs.interval < 1 ? '今天' : `${Math.round(cs.interval)}天后`}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // input helper
  const inp = (val: string, set: (v: string) => void, ph: string, cls = '') =>
    <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
      className={`w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${cls}`} />;

  const sel = (val: string, set: (v: string) => void, opts: [string, string][]) =>
    <select value={val} onChange={e => set(e.target.value)}
      className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>;

  const tabBtn = (key: ViewMode, label: string, onClick?: () => void) =>
    <button key={key} onClick={() => { setMode(key); onClick?.(); }}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${mode === key ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
      {label}
    </button>;

  // ============================================================
  return (
    <div className="space-y-6">
      {/* Storage Warning */}
      {storageWarning && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 text-sm"><span className="text-lg">⚠️</span>{storageWarning}</div>
          <button onClick={() => setStorageWarning(null)} className="shrink-0 text-amber-500 hover:text-amber-700"><CloseIcon /></button>
        </div>
      )}
      {/* Daily Word */}
      {showDaily && daily && mode === 'browse' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-3"><span className="text-lg">✨</span><span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">今日词汇</span></div>
              <button onClick={() => setShowDaily(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><CloseIcon /></button>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{daily.term}</span>
              {daily.phonetic && <span className="text-sm text-slate-400 font-mono">{daily.phonetic}</span>}
              <button onClick={() => speak(daily.term)} className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"><SpeakerIcon /></button>
            </div>
            <p className="text-base font-medium text-indigo-600 dark:text-indigo-400 mb-2">{daily.translation}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{daily.definition}</p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{daily.example}"</p>
              <p className="text-xs text-slate-500 mt-1">{daily.exampleCn}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { l: '总词汇', v: stats.total, i: '📚', c: 'text-slate-900 dark:text-slate-100' },
          { l: '学习中', v: stats.learning, i: '📖', c: 'text-blue-600 dark:text-blue-400' },
          { l: '已熟悉', v: stats.familiar, i: '✅', c: 'text-emerald-600 dark:text-emerald-400' },
          { l: '待复习', v: stats.due, i: '🔄', c: 'text-amber-600 dark:text-amber-400' },
          { l: '手动添加', v: stats.custom, i: '✏️', c: 'text-violet-600 dark:text-violet-400' },
        ].map((s, idx) => (
          <div key={idx} className="p-3 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-center">
            <span className="text-lg">{s.i}</span>
            <div className={`text-xl font-bold font-mono mt-1 ${s.c}`}>{s.v}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabBtn('browse', '📖 浏览')}
        {tabBtn('flashcard', '🃏 闪卡', () => { setCi(0); setFlipped(false); })}
        {tabBtn('expressions', '💬 表达')}
        {tabBtn('quiz', '🧠 测验', () => { setScore({ c: 0, t: 0 }); genQuiz(); })}
        {tabBtn('add', '✏️ 添加')}
        {tabBtn('dashboard', '📊 仪表盘')}
        <div className="ml-auto">
          <button onClick={() => setShowIO(v => !v)} className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">⚙️ 数据</button>
        </div>
      </div>
      {showIO && (
        <div className="flex gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <button onClick={doExport} className="px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-200">📤 导出</button>
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-200">📥 导入</button>
          <input ref={fileRef} type="file" accept=".json" onChange={doImport} className="hidden" />
          <span className="text-xs text-slate-400 self-center">导出/导入学习状态和自定义词汇</span>
        </div>
      )}

      {/* BROWSE */}
      {mode === 'browse' && (<>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></div>
            {inp(search, setSearch, '搜索词汇...', 'pl-10')}
          </div>
          <select value={selCat} onChange={e => setSelCat(e.target.value)} className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option value="all">全部分类</option>
            {Object.entries(catGroups).map(([g, cs]) => <optgroup key={g} label={g}>{cs.map(c => <option key={c.k} value={c.k}>{c.i.emoji} {c.i.name}</option>)}</optgroup>)}
          </select>
          {sel(selDiff, setSelDiff, [['all', '全部难度'], ['beginner', '入门'], ['intermediate', '进阶'], ['advanced', '高级']])}
          {sel(markFilter, v => setMarkFilter(v as typeof markFilter), [['all', '全部状态'], ['learning', '📖 学习中'], ['familiar', '✅ 已熟悉'], ['discarded', '⏭️ 已跳过'], ['unmarked', '未标注']])}
          <button onClick={() => setFavOnly(v => !v)} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${favOnly ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 text-amber-700 dark:text-amber-300' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-300 hover:text-amber-500'}`}>
            <StarIcon filled={favOnly} />{favOnly ? `收藏 (${favs.size})` : '收藏'}
          </button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">共 {filtered.length} 个词汇</div>

        {/* New words section */}
        {(() => {
          const nw = filtered.filter(v => v.isNew);
          if (!nw.length || search || markFilter !== 'all') return null;
          return (<div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"><PlusIcon /> 最新收录</span>
              <span className="text-xs text-slate-400">{nw.length} 个</span>
            </div>
            <div className="grid gap-3 pl-1 border-l-2 border-emerald-200 dark:border-emerald-800">{nw.map(v => vCard(v, true))}</div>
            <div className="mt-4 mb-2 border-t border-slate-100 dark:border-slate-700/50 pt-4"><span className="text-xs text-slate-400 font-medium">全部词汇</span></div>
          </div>);
        })()}

        <div className="grid gap-4">{filtered.map(v => vCard(v))}</div>
        {!filtered.length && <div className="text-center py-12"><span className="text-4xl mb-4 block">🔍</span><p className="text-slate-500">没有匹配的词汇</p></div>}
      </>)}

      {/* FLASHCARD */}
      {mode === 'flashcard' && (<div className="max-w-xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button onClick={() => { setSelCat('all'); setCi(0); setFlipped(false); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selCat === 'all' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>全部</button>
          {Object.entries(CATS).map(([k, c]) => <button key={k} onClick={() => { setSelCat(k); setCi(0); setFlipped(false); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selCat === k ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>{c.emoji} {c.name}</button>)}
        </div>
        {deck.length > 0 ? (<>
          <div className="text-center text-sm text-slate-500 mb-4">{ci + 1} / {deck.length}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2"><div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${((ci + 1) / deck.length) * 100}%` }} /></div>
          </div>
          <div ref={cardRef} onClick={() => setFlipped(f => !f)} className="relative cursor-pointer select-none" style={{ perspective: '1000px' }}>
            <div className="relative w-full transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '320px' }}>
              <div className="absolute inset-0 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 p-8 flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{deck[ci]?.term}</div>
                    <button onClick={e => { e.stopPropagation(); if (deck[ci]) speak(deck[ci].term); }} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg></button>
                  </div>
                  {deck[ci]?.phonetic && <div className="text-sm text-slate-400 font-mono mb-4">{deck[ci].phonetic}</div>}
                  <div className="text-sm text-slate-400 mt-8">点击或按空格查看答案</div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800 p-6 overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                {deck[ci] && (<div className="space-y-3">
                  <div className="text-center"><h3 className="text-xl font-bold text-slate-900 dark:text-white">{deck[ci].term}</h3><p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{deck[ci].translation}</p></div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">{deck[ci].definition}</p>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3"><p className="text-sm text-slate-700 dark:text-slate-300 italic">"{deck[ci].example}"</p><p className="text-xs text-slate-500 mt-1">{deck[ci].exampleCn}</p></div>
                  <div className="flex justify-center">{markBtns(deck[ci].id)}</div>
                </div>)}
              </div>
            </div>
          </div>
          {flipped && (<div className="flex gap-2 mt-6 justify-center">
            {[{ r: 'again' as Rating, l: '忘了', k: '1', c: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200' },
              { r: 'hard' as Rating, l: '模糊', k: '2', c: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200' },
              { r: 'good' as Rating, l: '记住了', k: '3', c: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' },
              { r: 'easy' as Rating, l: '太简单', k: '4', c: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200' },
            ].map(b => <button key={b.r} onClick={e => { e.stopPropagation(); rate(b.r); }} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${b.c}`}>{b.l}<span className="block text-xs opacity-60 mt-0.5">({b.k})</span></button>)}
          </div>)}
          <div className="text-center text-xs text-slate-400 mt-4">空格=翻转 · 1~4=评分</div>
        </>) : (<div className="text-center py-16"><span className="text-5xl mb-4 block">🎉</span><p className="text-lg font-semibold text-slate-900 dark:text-white">复习完成！</p></div>)}
      </div>)}

      {/* EXPRESSIONS */}
      {mode === 'expressions' && (<>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setExprCat('all'); setExprFavOnly(false); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${exprCat === 'all' && !exprFavOnly ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>全部</button>
          {eCats.map(c => <button key={c} onClick={() => { setExprCat(c); setExprFavOnly(false); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${exprCat === c && !exprFavOnly ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>{c}</button>)}
          <button onClick={() => setExprFavOnly(v => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${exprFavOnly ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 border border-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            <StarIcon filled={exprFavOnly} />{exprFavOnly ? `收藏 (${exprFavs.size})` : '收藏'}
          </button>
        </div>
        <div className="grid gap-3">
          {filtE.map(ex => (
            <div key={ex.id} className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
              <div className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-medium">{ex.category}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">{ex.english}</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1.5">{ex.chinese}</p>
                  <p className="text-xs text-slate-400 mt-1.5 italic">场景: {ex.context}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => speak(ex.english)} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors"><SpeakerIcon /></button>
                  <button onClick={() => { setExprFavs(p => { const n = new Set(p); n.has(ex.id) ? n.delete(ex.id) : n.add(ex.id); sv(SK + '-efav', [...n]); return n; }); }}
                    className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"><StarIcon filled={exprFavs.has(ex.id)} /></button>
                </div>
              </div>
            </div>
          ))}
          {!filtE.length && <div className="text-center py-12 text-slate-400"><p className="text-4xl mb-3">⭐</p><p className="text-sm">{exprFavOnly ? '还没有收藏' : '无匹配表达'}</p></div>}
        </div>
      </>)}

      {/* QUIZ */}
      {mode === 'quiz' && (<div className="max-w-xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button onClick={() => { setSelCat('all'); setScore({ c: 0, t: 0 }); genQuiz(); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selCat === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>全部</button>
          {Object.entries(CATS).map(([k, c]) => <button key={k} onClick={() => { setSelCat(k); setScore({ c: 0, t: 0 }); genQuiz(); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selCat === k ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{c.emoji} {c.name}</button>)}
        </div>
        {score.t > 0 && <div className="text-center mb-4"><span className="text-sm text-slate-500">得分: <span className="font-bold text-indigo-600">{score.c}</span> / {score.t}{score.t >= 5 && <span className="ml-2">({Math.round(score.c / score.t * 100)}%)</span>}</span></div>}
        {quiz && (<div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8">
          <div className="text-center mb-6"><p className="text-sm text-slate-400 mb-3">中文翻译是？</p><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{quiz.q.term}</h3>{quiz.q.phonetic && <p className="text-sm text-slate-400 font-mono mt-1">{quiz.q.phonetic}</p>}</div>
          <div className="grid gap-3">{quiz.opts.map((o, i) => {
            let st = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer';
            if (quiz.sel !== null) { if (i === quiz.cor) st = 'bg-emerald-50 border-emerald-500 text-emerald-700'; else if (i === quiz.sel) st = 'bg-red-50 border-red-500 text-red-700'; else st = 'bg-slate-50 border-slate-200 opacity-50'; }
            return <button key={i} onClick={() => ansQuiz(i)} disabled={quiz.sel !== null} className={`w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${st}`}><span className="text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>{o}</button>;
          })}</div>
          {quiz.sel !== null && (<div className="mt-6">
            <div className={`p-4 rounded-xl mb-4 ${quiz.sel === quiz.cor ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-semibold ${quiz.sel === quiz.cor ? 'text-emerald-700' : 'text-red-700'}`}>{quiz.sel === quiz.cor ? '✅ 正确！' : '❌ 不对哦'}</p>
              <p className="text-sm text-slate-600 mt-2">{quiz.q.definition}</p>
            </div>
            <button onClick={genQuiz} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all">下一题 →</button>
          </div>)}
        </div>)}
      </div>)}

      {/* ADD */}
      {mode === 'add' && (<div className="max-w-2xl mx-auto space-y-6">
        <div className="flex gap-2">
          <button onClick={() => setAddType('vocab')} className={`px-4 py-2 rounded-xl text-sm font-medium ${addType === 'vocab' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>📝 添加词汇</button>
          <button onClick={() => setAddType('expr')} className={`px-4 py-2 rounded-xl text-sm font-medium ${addType === 'expr' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>💬 添加表达</button>
        </div>
        {addType === 'vocab' ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">添加新词汇</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-500 mb-1">英文 *</label>{inp(af.term, v => setAf(p => ({ ...p, term: v })), 'e.g. Attention')}</div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">音标</label>{inp(af.phonetic, v => setAf(p => ({ ...p, phonetic: v })), '/əˈtenʃn/')}</div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">中文 *</label>{inp(af.translation, v => setAf(p => ({ ...p, translation: v })), '注意力')}</div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">分类</label>
                <select value={af.category} onChange={e => setAf(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  {Object.entries(CATS).map(([k, c]) => <option key={k} value={k}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">英文释义</label>
              <textarea value={af.definition} onChange={e => setAf(p => ({ ...p, definition: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-500 mb-1">例句(EN)</label>{inp(af.example, v => setAf(p => ({ ...p, example: v })), '')}</div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">例句(CN)</label>{inp(af.exampleCn, v => setAf(p => ({ ...p, exampleCn: v })), '')}</div>
            </div>
            <button onClick={addVocab} disabled={!af.term.trim() || !af.translation.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">添加词汇</button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">添加新表达</h3>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">英文 *</label>{inp(ef.english, v => setEf(p => ({ ...p, english: v })), 'e.g. The trade-off here is...')}</div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">中文 *</label>{inp(ef.chinese, v => setEf(p => ({ ...p, chinese: v })), '')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-500 mb-1">场景</label>{inp(ef.context, v => setEf(p => ({ ...p, context: v })), '使用场景')}</div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">分类</label>{inp(ef.category, v => setEf(p => ({ ...p, category: v })), '论文写作')}</div>
            </div>
            <button onClick={addExpr} disabled={!ef.english.trim() || !ef.chinese.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">添加表达</button>
          </div>
        )}
        {/* User-added list */}
        {(userV.length > 0 || userE.length > 0) && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">已添加 ({userV.length} 词汇, {userE.length} 表达)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {userV.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div><span className="font-medium text-sm text-slate-900 dark:text-white">{v.term}</span><span className="text-sm text-slate-500 ml-2">{v.translation}</span></div>
                  <button onClick={() => { const n = userV.filter(x => x.id !== v.id); setUserV(n); sv(SK + '-uv', n); }} className="text-xs text-red-500 hover:text-red-700">删除</button>
                </div>
              ))}
              {userE.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div><span className="font-medium text-sm text-slate-900 dark:text-white">{e.english}</span><span className="text-sm text-slate-500 ml-2">{e.chinese}</span></div>
                  <button onClick={() => { const n = userE.filter(x => x.id !== e.id); setUserE(n); sv(SK + '-ue', n); }} className="text-xs text-red-500 hover:text-red-700">删除</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>)}

      {/* DASHBOARD */}
      {mode === 'dashboard' && (() => {
        // --- Heatmap data: last 16 weeks ---
        const today = new Date();
        const heatmapWeeks = 16;
        const heatmapDays: { date: string; count: number; dow: number; weekIdx: number }[] = [];
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (heatmapWeeks * 7 - 1) - startDate.getDay());
        const rhMap = new Map(reviewHistory.map(l => [l.date, l.count]));
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          const ds = d.toISOString().slice(0, 10);
          const dow = d.getDay();
          const weekIdx = Math.floor((d.getTime() - startDate.getTime()) / (7 * 864e5));
          heatmapDays.push({ date: ds, count: rhMap.get(ds) || 0, dow, weekIdx });
        }
        const maxCount = Math.max(1, ...heatmapDays.map(d => d.count));
        const heatColor = (count: number) => {
          if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
          const intensity = count / maxCount;
          if (intensity < 0.25) return 'bg-indigo-200 dark:bg-indigo-900/40';
          if (intensity < 0.5) return 'bg-indigo-300 dark:bg-indigo-800/60';
          if (intensity < 0.75) return 'bg-indigo-400 dark:bg-indigo-700';
          return 'bg-indigo-500 dark:bg-indigo-600';
        };

        // --- Category mastery ---
        const catMastery = Object.entries(CATS).map(([catKey, catInfo]) => {
          const catVocab = allV.filter(v => v.category === catKey);
          if (catVocab.length === 0) return { key: catKey, info: catInfo, total: 0, familiar: 0, learning: 0, reviewed: 0, pct: 0 };
          const familiar = catVocab.filter(v => marks[v.id] === 'familiar').length;
          const learning = catVocab.filter(v => marks[v.id] === 'learning').length;
          const reviewed = catVocab.filter(v => prog[v.id] && prog[v.id].reviews > 0).length;
          return { key: catKey, info: catInfo, total: catVocab.length, familiar, learning, reviewed, pct: Math.round((familiar / catVocab.length) * 100) };
        });

        // --- Radar chart (SVG) ---
        const radarSize = 240;
        const radarCenter = radarSize / 2;
        const radarRadius = radarSize / 2 - 30;
        const radarCats = catMastery.filter(c => c.total > 0);
        const radarAngle = (i: number) => (Math.PI * 2 * i) / radarCats.length - Math.PI / 2;
        const radarPoint = (i: number, pct: number) => {
          const a = radarAngle(i);
          return { x: radarCenter + radarRadius * (pct / 100) * Math.cos(a), y: radarCenter + radarRadius * (pct / 100) * Math.sin(a) };
        };

        // --- Review streak ---
        let streak = 0;
        const todayStr = today.toISOString().slice(0, 10);
        for (let d = new Date(today); ; d.setDate(d.getDate() - 1)) {
          const ds = d.toISOString().slice(0, 10);
          if (rhMap.has(ds)) { streak++; } else if (ds !== todayStr) { break; } else { break; }
        }

        // --- Total reviews ---
        const totalReviews = reviewHistory.reduce((s, l) => s + l.count, 0);
        const totalRatings = reviewHistory.reduce((s, l) => ({
          again: s.again + (l.ratings.again || 0), hard: s.hard + (l.ratings.hard || 0),
          good: s.good + (l.ratings.good || 0), easy: s.easy + (l.ratings.easy || 0),
        }), { again: 0, hard: 0, good: 0, easy: 0 });

        return (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: '总复习次数', v: totalReviews, i: '🔁', c: 'text-indigo-600 dark:text-indigo-400' },
                { l: '连续天数', v: streak, i: '🔥', c: 'text-orange-600 dark:text-orange-400' },
                { l: '已掌握', v: Object.values(marks).filter(m => m === 'familiar').length, i: '✅', c: 'text-emerald-600 dark:text-emerald-400' },
                { l: '记忆正确率', v: totalReviews > 0 ? Math.round(((totalRatings.good + totalRatings.easy) / totalReviews) * 100) + '%' : '-', i: '🎯', c: 'text-violet-600 dark:text-violet-400' },
              ].map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-xl">{s.i}</span>
                  <div className={`text-2xl font-bold font-mono mt-1 ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div className="rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">复习热力图</h3>
              <div className="overflow-x-auto">
                <div className="inline-grid gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gridAutoColumns: '14px' }}>
                  {heatmapDays.map((d, i) => (
                    <div key={i} className={`w-[14px] h-[14px] rounded-[3px] ${heatColor(d.count)} transition-colors`}
                      title={`${d.date}: ${d.count} 次复习`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span>少</span>
                {['bg-slate-100 dark:bg-slate-800', 'bg-indigo-200 dark:bg-indigo-900/40', 'bg-indigo-300 dark:bg-indigo-800/60', 'bg-indigo-400 dark:bg-indigo-700', 'bg-indigo-500 dark:bg-indigo-600'].map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
                ))}
                <span>多</span>
              </div>
            </div>

            {/* Category mastery + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar chart */}
              {radarCats.length >= 3 && (
                <div className="rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">分类掌握度</h3>
                  <div className="flex justify-center">
                    <svg width={radarSize} height={radarSize} className="text-slate-300 dark:text-slate-600">
                      {/* Grid circles */}
                      {[25, 50, 75, 100].map(pct => (
                        <circle key={pct} cx={radarCenter} cy={radarCenter} r={radarRadius * pct / 100}
                          fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.3} />
                      ))}
                      {/* Axis lines */}
                      {radarCats.map((_, i) => {
                        const p = radarPoint(i, 100);
                        return <line key={i} x1={radarCenter} y1={radarCenter} x2={p.x} y2={p.y}
                          stroke="currentColor" strokeWidth={0.5} opacity={0.3} />;
                      })}
                      {/* Data polygon */}
                      <polygon
                        points={radarCats.map((c, i) => { const p = radarPoint(i, Math.max(5, c.pct)); return `${p.x},${p.y}`; }).join(' ')}
                        fill="rgba(99, 102, 241, 0.2)" stroke="rgb(99, 102, 241)" strokeWidth={2}
                      />
                      {/* Data points */}
                      {radarCats.map((c, i) => {
                        const p = radarPoint(i, Math.max(5, c.pct));
                        return <circle key={i} cx={p.x} cy={p.y} r={4} fill="rgb(99, 102, 241)" />;
                      })}
                      {/* Labels */}
                      {radarCats.map((c, i) => {
                        const p = radarPoint(i, 120);
                        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                          className="fill-slate-600 dark:fill-slate-400 text-[10px]">{c.info.emoji} {c.pct}%</text>;
                      })}
                    </svg>
                  </div>
                </div>
              )}

              {/* Category bars */}
              <div className="rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">各分类进度</h3>
                <div className="space-y-3">
                  {catMastery.filter(c => c.total > 0).map(c => (
                    <div key={c.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{c.info.emoji} {c.info.name}</span>
                        <span className="text-xs text-slate-400">{c.familiar}/{c.total} 已掌握</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                          style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rating distribution */}
            {totalReviews > 0 && (
              <div className="rounded-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">评分分布</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '忘了', count: totalRatings.again, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
                    { label: '模糊', count: totalRatings.hard, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
                    { label: '记住了', count: totalRatings.good, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
                    { label: '太简单', count: totalRatings.easy, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
                  ].map(r => (
                    <div key={r.label} className="text-center">
                      <div className="relative w-full h-24 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                        <div className={`absolute bottom-0 w-full ${r.color} rounded-lg transition-all duration-500`}
                          style={{ height: `${totalReviews > 0 ? (r.count / totalReviews) * 100 : 0}%` }} />
                      </div>
                      <div className={`text-sm font-bold font-mono mt-2 ${r.textColor}`}>{r.count}</div>
                      <div className="text-xs text-slate-400">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
