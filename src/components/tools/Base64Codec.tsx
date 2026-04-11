import { useState, useCallback } from 'react';

export default function Base64Codec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');

  const processInput = useCallback((text: string, currentMode: 'encode' | 'decode') => {
    if (!text.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      if (currentMode === 'encode') {
        // Handle Unicode properly
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const binary = String.fromCharCode(...data);
        setOutput(btoa(binary));
      } else {
        const binary = atob(text.trim());
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const decoder = new TextDecoder();
        setOutput(decoder.decode(bytes));
      }
      setError('');
    } catch (e: any) {
      setError(currentMode === 'decode' ? '无效的 Base64 字符串' : e.message);
      setOutput('');
    }
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    processInput(text, mode);
  }, [mode, processInput]);

  const switchMode = useCallback(() => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    // Swap input/output
    const newInput = output;
    setInput(newInput);
    processInput(newInput, newMode);
  }, [mode, output, processInput]);

  const copyOutput = useCallback(() => {
    if (output) navigator.clipboard.writeText(output);
  }, [output]);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const loadSample = useCallback(() => {
    const sample = 'Hello Maxwell! 你好，Maxwell 平台！';
    setInput(sample);
    processInput(sample, mode);
  }, [mode, processInput]);

  return (
    <div className="space-y-4">
      {/* Mode & Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => { setMode('encode'); processInput(input, 'encode'); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'encode'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            编码
          </button>
          <button
            onClick={() => { setMode('decode'); processInput(input, 'decode'); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'decode'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            解码
          </button>
        </div>
        <button onClick={switchMode} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="交换输入输出">
          ⇄ 交换
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
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {mode === 'encode' ? '原始文本' : 'Base64 字符串'}
          </label>
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
            className="w-full h-64 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {mode === 'encode' ? 'Base64 结果' : '解码结果'}
          </label>
          <textarea
            value={output}
            readOnly
            placeholder="结果将显示在这里..."
            className="w-full h-64 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Stats */}
      {(input || output) && (
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <span>输入长度: {input.length} 字符</span>
          <span>输出长度: {output.length} 字符</span>
          {mode === 'encode' && output && (
            <span>膨胀率: {((output.length / input.length - 1) * 100).toFixed(1)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
