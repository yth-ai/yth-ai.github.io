import { useState, useCallback } from 'react';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);

  const formatJson = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indentSize));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input, indentSize]);

  const compressJson = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input]);

  const copyOutput = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }, [output]);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const loadSample = useCallback(() => {
    const sample = JSON.stringify({
      name: "Maxwell",
      version: "1.0.0",
      description: "个人数字平台",
      features: ["文档", "工具", "博客"],
      config: { theme: "auto", lang: "zh-CN" }
    }, null, 2);
    setInput(sample);
    setError('');
  }, []);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={formatJson} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200">
          美化
        </button>
        <button onClick={compressJson} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          压缩
        </button>
        <button onClick={copyOutput} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          复制结果
        </button>
        <button onClick={clearAll} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          清空
        </button>
        <button onClick={loadSample} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          示例
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-slate-500 dark:text-slate-400">缩进:</label>
          <select
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
            <option value={8}>Tab</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          JSON 语法错误: {error}
        </div>
      )}

      {/* Input/Output panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">输入</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴 JSON 数据..."
            className="w-full h-80 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">输出</label>
          <textarea
            value={output}
            readOnly
            placeholder="格式化结果将显示在这里..."
            className="w-full h-80 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
