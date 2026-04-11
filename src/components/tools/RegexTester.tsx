import { useState, useCallback, useMemo } from 'react';

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    if (!pattern || !testString) {
      setError('');
      return [];
    }
    try {
      const regex = new RegExp(pattern, flags);
      setError('');
      const results: { match: string; index: number; groups?: Record<string, string> }[] = [];
      let match;

      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups,
          });
          if (match[0] === '') {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups,
          });
        }
      }
      return results;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, [pattern, flags, testString]);

  const highlightedText = useMemo(() => {
    if (!pattern || !testString || error) return null;
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(testString)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: testString.slice(lastIndex, match.index), isMatch: false });
        }
        parts.push({ text: match[0], isMatch: true });
        lastIndex = match.index + match[0].length;
        if (match[0] === '') {
          regex.lastIndex++;
          if (regex.lastIndex > testString.length) break;
        }
      }
      if (lastIndex < testString.length) {
        parts.push({ text: testString.slice(lastIndex), isMatch: false });
      }
      return parts;
    } catch {
      return null;
    }
  }, [pattern, flags, testString, error]);

  const toggleFlag = useCallback((flag: string) => {
    setFlags((prev) => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  }, []);

  const loadSample = useCallback(() => {
    setPattern('\\b[A-Z][a-z]+\\b');
    setFlags('g');
    setTestString('Hello World, this is Maxwell Platform. Welcome to visit Beijing and Shanghai.');
  }, []);

  return (
    <div className="space-y-4">
      {/* Pattern input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">正则表达式</label>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-lg">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            spellCheck={false}
          />
          <span className="text-slate-400 font-mono text-lg">/</span>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="w-16 px-2 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Flags and actions */}
      <div className="flex flex-wrap items-center gap-2">
        {['g', 'i', 'm', 's'].map((flag) => (
          <button
            key={flag}
            onClick={() => toggleFlag(flag)}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-colors ${
              flags.includes(flag)
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {flag}
          </button>
        ))}
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
          g=全局 i=忽略大小写 m=多行 s=dotAll
        </span>
        <button onClick={loadSample} className="ml-auto px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          示例
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          正则表达式错误: {error}
        </div>
      )}

      {/* Test string input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">测试字符串</label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="输入要测试的文本..."
          className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          spellCheck={false}
        />
      </div>

      {/* Highlighted result */}
      {highlightedText && highlightedText.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">匹配结果高亮</label>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm whitespace-pre-wrap break-all">
            {highlightedText.map((part, i) =>
              part.isMatch ? (
                <mark key={i} className="bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200 rounded px-0.5">
                  {part.text}
                </mark>
              ) : (
                <span key={i} className="text-slate-700 dark:text-slate-300">{part.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {/* Match list */}
      {matches.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            匹配列表 ({matches.length} 个匹配)
          </label>
          <div className="space-y-1">
            {matches.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm">
                <span className="text-slate-400 dark:text-slate-500 font-mono w-6 text-right shrink-0">{i + 1}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">"{m.match}"</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto">index: {m.index}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
