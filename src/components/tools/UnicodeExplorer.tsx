import { useState, useMemo, useCallback } from 'react';

// ============================================================
// Unicode Explorer — Character Encoding Deep Analyzer
// ============================================================

interface CharInfo {
  char: string;
  codePoint: number;
  codePointHex: string;
  utf8Bytes: number[];
  utf16Units: number[];
  block: string;
  category: string;
  name: string;
}

// Unicode block ranges
function getUnicodeBlock(cp: number): string {
  if (cp >= 0x0000 && cp <= 0x007F) return 'Basic Latin';
  if (cp >= 0x0080 && cp <= 0x00FF) return 'Latin-1 Supplement';
  if (cp >= 0x0100 && cp <= 0x024F) return 'Latin Extended';
  if (cp >= 0x0370 && cp <= 0x03FF) return 'Greek and Coptic';
  if (cp >= 0x0400 && cp <= 0x04FF) return 'Cyrillic';
  if (cp >= 0x0530 && cp <= 0x058F) return 'Armenian';
  if (cp >= 0x0590 && cp <= 0x05FF) return 'Hebrew';
  if (cp >= 0x0600 && cp <= 0x06FF) return 'Arabic';
  if (cp >= 0x0900 && cp <= 0x097F) return 'Devanagari';
  if (cp >= 0x0E00 && cp <= 0x0E7F) return 'Thai';
  if (cp >= 0x1100 && cp <= 0x11FF) return 'Hangul Jamo';
  if (cp >= 0x2000 && cp <= 0x206F) return 'General Punctuation';
  if (cp >= 0x2070 && cp <= 0x209F) return 'Superscripts & Subscripts';
  if (cp >= 0x20A0 && cp <= 0x20CF) return 'Currency Symbols';
  if (cp >= 0x2100 && cp <= 0x214F) return 'Letterlike Symbols';
  if (cp >= 0x2150 && cp <= 0x218F) return 'Number Forms';
  if (cp >= 0x2190 && cp <= 0x21FF) return 'Arrows';
  if (cp >= 0x2200 && cp <= 0x22FF) return 'Mathematical Operators';
  if (cp >= 0x2300 && cp <= 0x23FF) return 'Miscellaneous Technical';
  if (cp >= 0x2500 && cp <= 0x257F) return 'Box Drawing';
  if (cp >= 0x2580 && cp <= 0x259F) return 'Block Elements';
  if (cp >= 0x25A0 && cp <= 0x25FF) return 'Geometric Shapes';
  if (cp >= 0x2600 && cp <= 0x26FF) return 'Miscellaneous Symbols';
  if (cp >= 0x2700 && cp <= 0x27BF) return 'Dingbats';
  if (cp >= 0x2E80 && cp <= 0x2EFF) return 'CJK Radicals Supplement';
  if (cp >= 0x2F00 && cp <= 0x2FDF) return 'Kangxi Radicals';
  if (cp >= 0x3000 && cp <= 0x303F) return 'CJK Symbols & Punctuation';
  if (cp >= 0x3040 && cp <= 0x309F) return 'Hiragana';
  if (cp >= 0x30A0 && cp <= 0x30FF) return 'Katakana';
  if (cp >= 0x3100 && cp <= 0x312F) return 'Bopomofo';
  if (cp >= 0x3130 && cp <= 0x318F) return 'Hangul Compatibility Jamo';
  if (cp >= 0x3400 && cp <= 0x4DBF) return 'CJK Unified Ext. A';
  if (cp >= 0x4E00 && cp <= 0x9FFF) return 'CJK Unified Ideographs';
  if (cp >= 0xAC00 && cp <= 0xD7AF) return 'Hangul Syllables';
  if (cp >= 0xE000 && cp <= 0xF8FF) return 'Private Use Area';
  if (cp >= 0xF900 && cp <= 0xFAFF) return 'CJK Compatibility Ideographs';
  if (cp >= 0xFB00 && cp <= 0xFB06) return 'Alphabetic Presentation Forms';
  if (cp >= 0xFE30 && cp <= 0xFE4F) return 'CJK Compatibility Forms';
  if (cp >= 0xFE50 && cp <= 0xFE6F) return 'Small Form Variants';
  if (cp >= 0xFF00 && cp <= 0xFFEF) return 'Halfwidth & Fullwidth Forms';
  if (cp >= 0x10000 && cp <= 0x1007F) return 'Linear B Syllabary';
  if (cp >= 0x1D400 && cp <= 0x1D7FF) return 'Mathematical Alphanumeric';
  if (cp >= 0x1F300 && cp <= 0x1F5FF) return 'Miscellaneous Symbols & Pictographs';
  if (cp >= 0x1F600 && cp <= 0x1F64F) return 'Emoticons';
  if (cp >= 0x1F680 && cp <= 0x1F6FF) return 'Transport & Map Symbols';
  if (cp >= 0x1F900 && cp <= 0x1F9FF) return 'Supplemental Symbols & Pictographs';
  if (cp >= 0x1FA00 && cp <= 0x1FA6F) return 'Chess Symbols';
  if (cp >= 0x1FA70 && cp <= 0x1FAFF) return 'Symbols & Pictographs Extended-A';
  if (cp >= 0x20000 && cp <= 0x2A6DF) return 'CJK Unified Ext. B';
  return 'Other';
}

function getCharCategory(cp: number): string {
  if (cp >= 0x41 && cp <= 0x5A) return 'Lu (大写字母)';
  if (cp >= 0x61 && cp <= 0x7A) return 'Ll (小写字母)';
  if (cp >= 0x30 && cp <= 0x39) return 'Nd (数字)';
  if (cp === 0x20) return 'Zs (空格)';
  if (cp === 0x0A) return 'Cc (换行 LF)';
  if (cp === 0x0D) return 'Cc (回车 CR)';
  if (cp === 0x09) return 'Cc (制表符 TAB)';
  if (cp < 0x20) return 'Cc (控制字符)';
  if (cp >= 0x4E00 && cp <= 0x9FFF) return 'Lo (CJK 汉字)';
  if (cp >= 0x3400 && cp <= 0x4DBF) return 'Lo (CJK 汉字扩展)';
  if (cp >= 0x3040 && cp <= 0x309F) return 'Lo (平假名)';
  if (cp >= 0x30A0 && cp <= 0x30FF) return 'Lo (片假名)';
  if (cp >= 0xAC00 && cp <= 0xD7AF) return 'Lo (韩文音节)';
  if (cp >= 0x1F600 && cp <= 0x1F64F) return 'So (Emoji 表情)';
  if (cp >= 0x1F300 && cp <= 0x1F5FF) return 'So (Emoji 符号)';
  if (cp >= 0x1F680 && cp <= 0x1F6FF) return 'So (Emoji 交通)';
  if (/\p{P}/u.test(String.fromCodePoint(cp))) return 'P (标点符号)';
  if (/\p{S}/u.test(String.fromCodePoint(cp))) return 'S (符号)';
  if (/\p{L}/u.test(String.fromCodePoint(cp))) return 'L (字母)';
  if (/\p{N}/u.test(String.fromCodePoint(cp))) return 'N (数字)';
  return 'Other';
}

function analyzeChar(char: string): CharInfo {
  const codePoint = char.codePointAt(0)!;
  const utf8Bytes = Array.from(new TextEncoder().encode(char));
  
  // UTF-16 encoding
  const utf16Units: number[] = [];
  for (let i = 0; i < char.length; i++) {
    utf16Units.push(char.charCodeAt(i));
  }
  
  return {
    char,
    codePoint,
    codePointHex: 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0'),
    utf8Bytes,
    utf16Units,
    block: getUnicodeBlock(codePoint),
    category: getCharCategory(codePoint),
    name: getCharName(codePoint),
  };
}

function getCharName(cp: number): string {
  // Common character names
  const names: Record<number, string> = {
    0x20: 'SPACE', 0x09: 'TAB', 0x0A: 'LINE FEED', 0x0D: 'CARRIAGE RETURN',
    0x200B: 'ZERO WIDTH SPACE', 0x200C: 'ZERO WIDTH NON-JOINER',
    0x200D: 'ZERO WIDTH JOINER', 0xFEFF: 'BOM / ZERO WIDTH NO-BREAK SPACE',
    0x00A0: 'NO-BREAK SPACE', 0x3000: 'IDEOGRAPHIC SPACE',
    0xFF01: 'FULLWIDTH EXCLAMATION MARK', 0xFF1F: 'FULLWIDTH QUESTION MARK',
  };
  if (names[cp]) return names[cp];
  if (cp >= 0x41 && cp <= 0x5A) return `LATIN CAPITAL LETTER ${String.fromCodePoint(cp)}`;
  if (cp >= 0x61 && cp <= 0x7A) return `LATIN SMALL LETTER ${String.fromCodePoint(cp)}`;
  if (cp >= 0x30 && cp <= 0x39) return `DIGIT ${String.fromCodePoint(cp)}`;
  if (cp >= 0x4E00 && cp <= 0x9FFF) return `CJK UNIFIED IDEOGRAPH-${cp.toString(16).toUpperCase()}`;
  return `CHARACTER ${cp.toString(16).toUpperCase()}`;
}

const BYTE_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
];

export default function UnicodeExplorer() {
  const [text, setText] = useState('');
  const [selectedCharIdx, setSelectedCharIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Split into characters (handle surrogate pairs)
  const chars = useMemo(() => {
    return [...text].map(analyzeChar);
  }, [text]);

  const selectedChar = selectedCharIdx !== null ? chars[selectedCharIdx] : null;

  // Block distribution
  const blockStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of chars) {
      map.set(c.block, (map.get(c.block) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [chars]);

  // Encoding stats
  const encodingStats = useMemo(() => {
    if (chars.length === 0) return null;
    const utf8Total = chars.reduce((a, c) => a + c.utf8Bytes.length, 0);
    const utf16Total = chars.reduce((a, c) => a + c.utf16Units.length * 2, 0);
    const utf32Total = chars.length * 4;
    return { utf8Total, utf16Total, utf32Total, charCount: chars.length };
  }, [chars]);

  const loadSample = useCallback((key: string) => {
    const samples: Record<string, string> = {
      'multilingual': 'Hello 你好 こんにちは 안녕하세요 مرحبا Привет',
      'special': 'Zero-width: ​|\u200B|\u200C|\u200D|\uFEFF| Spaces: | |\u00A0|\u3000|',
      'emoji': '👨‍💻 = 👨 + ZWJ + 💻\n🇨🇳 = 🇨 + 🇳\n👩‍👩‍👧‍👦 Family',
      'math': '∀x ∈ ℝ: x² ≥ 0, ∑(aₙ) → ∞, ∫f(x)dx = F(x) + C',
      'fullwidth': 'Ｈｅｌｌｏ！你好！（全角 vs 半角）',
    };
    setText(samples[key] || '');
  }, []);

  return (
    <div className="space-y-6">
      {/* Samples & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">示例:</span>
        {[
          { key: 'multilingual', label: '多语言' },
          { key: 'special', label: '特殊字符' },
          { key: 'emoji', label: 'Emoji' },
          { key: 'math', label: '数学符号' },
          { key: 'fullwidth', label: '全角/半角' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => loadSample(key)}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'table' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            表格
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            网格
          </button>
          <button onClick={() => { setText(''); setSelectedCharIdx(null); }}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            清空
          </button>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">输入文本</label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setSelectedCharIdx(null); }}
          placeholder="输入任意文本，查看每个字符的 Unicode 编码详情..."
          className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          spellCheck={false}
        />
      </div>

      {/* Encoding Stats */}
      {encodingStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '字符数', value: encodingStats.charCount },
            { label: 'UTF-8 字节', value: `${encodingStats.utf8Total} B` },
            { label: 'UTF-16 字节', value: `${encodingStats.utf16Total} B` },
            { label: 'UTF-32 字节', value: `${encodingStats.utf32Total} B` },
          ].map((stat, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Character Grid / Table */}
      {chars.length > 0 && (
        viewMode === 'grid' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">字符网格 (点击查看详情)</label>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-1">
                {chars.map((c, i) => {
                  const byteCount = c.utf8Bytes.length;
                  const colorClass = BYTE_COLORS[Math.min(byteCount - 1, 3)];
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedCharIdx(i)}
                      className={`px-2 py-1 rounded border font-mono text-sm transition-all duration-150 ${colorClass} ${
                        selectedCharIdx === i ? 'ring-2 ring-primary-500 scale-110' : 'hover:scale-105'
                      }`}
                      title={`${c.codePointHex} · ${c.utf8Bytes.length}B UTF-8`}
                    >
                      {c.char === ' ' ? '␣' : c.char === '\n' ? '↵' : c.char === '\t' ? '→' : c.char === '\r' ? '⏎' : c.char.trim() === '' ? '·' : c.char}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                {['1 字节 (ASCII)', '2 字节', '3 字节 (CJK)', '4 字节 (Emoji)'].map((label, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded ${BYTE_COLORS[i].split(' ')[0]}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">字符详情表</label>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">字符</th>
                    <th className="text-left py-2 px-3">码点</th>
                    <th className="text-left py-2 px-3">UTF-8 (hex)</th>
                    <th className="text-left py-2 px-3">UTF-16 (hex)</th>
                    <th className="text-left py-2 px-3">字节</th>
                    <th className="text-left py-2 px-3">Block</th>
                    <th className="text-left py-2 px-3">类别</th>
                  </tr>
                </thead>
                <tbody>
                  {chars.slice(0, 100).map((c, i) => {
                    const byteCount = c.utf8Bytes.length;
                    return (
                      <tr
                        key={i}
                        className={`border-t border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                          selectedCharIdx === i ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => setSelectedCharIdx(i)}
                      >
                        <td className="py-1.5 px-3 text-slate-400">{i}</td>
                        <td className="py-1.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded ${BYTE_COLORS[Math.min(byteCount - 1, 3)]}`}>
                            {c.char === ' ' ? '␣' : c.char === '\n' ? '↵' : c.char === '\t' ? '→' : c.char.trim() === '' ? '·' : c.char}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-blue-600 dark:text-blue-400">{c.codePointHex}</td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                          {c.utf8Bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                          {c.utf16Units.map(u => u.toString(16).padStart(4, '0')).join(' ')}
                        </td>
                        <td className="py-1.5 px-3 text-slate-500">{byteCount}</td>
                        <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{c.block}</td>
                        <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{c.category}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {chars.length > 100 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 p-2 text-center">
                  仅显示前 100 个字符（共 {chars.length} 个）
                </p>
              )}
            </div>
          </div>
        )
      )}

      {/* Selected Character Detail */}
      {selectedChar && (
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-4">
            <div className="text-5xl font-mono bg-white dark:bg-slate-800 w-20 h-20 rounded-xl flex items-center justify-center border border-primary-200 dark:border-primary-700 shrink-0">
              {selectedChar.char.trim() || '·'}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-sm font-medium text-slate-900 dark:text-white">{selectedChar.name}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div><span className="text-slate-500 dark:text-slate-400">码点: </span><span className="font-mono text-blue-600 dark:text-blue-400">{selectedChar.codePointHex}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">十进制: </span><span className="font-mono">{selectedChar.codePoint}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Block: </span><span>{selectedChar.block}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">类别: </span><span>{selectedChar.category}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">UTF-8: </span><span className="font-mono">{selectedChar.utf8Bytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">UTF-16: </span><span className="font-mono">{selectedChar.utf16Units.map(u => '0x' + u.toString(16).padStart(4, '0')).join(' ')}</span></div>
              </div>
              {/* UTF-8 binary breakdown */}
              <div className="mt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">UTF-8 二进制:</div>
                <div className="flex gap-2">
                  {selectedChar.utf8Bytes.map((b, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {b.toString(2).padStart(8, '0')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Distribution */}
      {blockStats.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Unicode Block 分布</h3>
          <div className="space-y-2">
            {blockStats.slice(0, 8).map(([block, count]) => {
              const pct = (count / chars.length) * 100;
              return (
                <div key={block}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{block}</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!text && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-500 font-mono text-lg font-bold">
            U+
          </div>
          <p className="text-slate-500 dark:text-slate-400">输入文本探索 Unicode 编码</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">查看每个字符的码点、UTF-8/16 编码和所属 Block</p>
        </div>
      )}
    </div>
  );
}
