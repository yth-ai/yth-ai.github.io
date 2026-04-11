import { useState, useCallback } from 'react';
import { TEMPLATES, CATEGORIES, CATEGORY_COLORS, type PromptTemplate } from './templates';
import { analyzePrompt } from './PromptAnalyzer';
import RadarChart from './RadarChart';

// ============================================================
// Tab 1: 模板工坊 (Template Workshop)
// ============================================================

interface TemplateWorkshopProps {
  onSelectTemplate?: (template: PromptTemplate) => void;
}

export default function TemplateWorkshop({ onSelectTemplate }: TemplateWorkshopProps) {
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate>(TEMPLATES[0]);
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    TEMPLATES[0].variables.forEach(v => (init[v.key] = v.defaultValue));
    return init;
  });
  const [freeformPrompt, setFreeformPrompt] = useState('');
  const [mode, setMode] = useState<'template' | 'freeform'>('template');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState(0);

  const selectTemplate = useCallback((t: PromptTemplate) => {
    setActiveTemplate(t);
    const newVars: Record<string, string> = {};
    t.variables.forEach(v => (newVars[v.key] = v.defaultValue));
    setVariables(newVars);
    setActivePreset(0);
    onSelectTemplate?.(t);
  }, [onSelectTemplate]);

  const applyPreset = useCallback((presetIdx: number) => {
    if (!activeTemplate.presets?.[presetIdx]) return;
    const pValues = activeTemplate.presets[presetIdx].values;
    setVariables(prev => ({ ...prev, ...pValues }));
    setActivePreset(presetIdx);
  }, [activeTemplate]);

  const renderedPrompt = mode === 'template'
    ? activeTemplate.template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`)
    : freeformPrompt;

  const analysis = analyzePrompt(renderedPrompt);

  const filteredTemplates = filterCat
    ? TEMPLATES.filter(t => t.category === filterCat)
    : TEMPLATES;

  return (
    <div className="space-y-5">
      {/* Mode Switch */}
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
          {(['template', 'freeform'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {m === 'template' ? '模板模式' : '自由编辑'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {TEMPLATES.length} 个模板 · {CATEGORIES.length} 个分类
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Template selector */}
        <div className="lg:col-span-1 space-y-4">
          {mode === 'template' ? (
            <>
              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCat(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !filterCat
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  全部 ({TEMPLATES.length})
                </button>
                {CATEGORIES.map(cat => {
                  const count = TEMPLATES.filter(t => t.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat === filterCat ? null : cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                        filterCat === cat
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Template list */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {filteredTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      activeTemplate.id === t.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: t.categoryColor }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{t.name}</span>
                          <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: t.categoryColor + '20', color: t.categoryColor }}>
                            {t.category}
                          </span>
                          {t.year && <span className="text-[10px] text-slate-400">{t.year}</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Preset quick switch */}
              {activeTemplate.presets && activeTemplate.presets.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800/30">
                  <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">快捷场景</div>
                  <div className="flex flex-wrap gap-2">
                    {activeTemplate.presets.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => applyPreset(i)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          activePreset === i
                            ? 'bg-amber-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Variable editor */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">变量填充</h3>
                <div className="space-y-3">
                  {activeTemplate.variables.map(v => (
                    <div key={v.key}>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        {v.label} <code className="text-amber-600 dark:text-amber-400">{`{{${v.key}}}`}</code>
                      </label>
                      {(v.type === 'multiline' || v.defaultValue.includes('\n')) ? (
                        <textarea
                          value={variables[v.key] || ''}
                          onChange={e => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                        />
                      ) : (
                        <input
                          type="text"
                          value={variables[v.key] || ''}
                          onChange={e => setVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                自由编写 Prompt
              </label>
              <textarea
                value={freeformPrompt}
                onChange={e => setFreeformPrompt(e.target.value)}
                placeholder="在这里编写你的 Prompt..."
                rows={20}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Right: Preview + Analysis */}
        <div className="lg:col-span-2 space-y-4">
          {/* Rendered Prompt Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white ml-2">渲染预览</h3>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(renderedPrompt)}
                className="px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
              >
                复制
              </button>
            </div>
            <div className="p-4 max-h-[350px] overflow-y-auto">
              <pre className="text-sm text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                {renderedPrompt.split(/(\{\{.*?\}\})/).map((part, i) => {
                  if (/^\{\{.*\}\}$/.test(part)) {
                    return <span key={i} className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded">{part}</span>;
                  }
                  // Bold keywords
                  return part.split(/(\[System\]|\[User\]|\[Assistant\]|##\s.+)/gi).map((seg, j) => {
                    if (/^\[system\]$/i.test(seg)) return <span key={`${i}-${j}`} className="text-green-600 dark:text-green-400 font-bold">{seg}</span>;
                    if (/^\[user\]$/i.test(seg)) return <span key={`${i}-${j}`} className="text-blue-600 dark:text-blue-400 font-bold">{seg}</span>;
                    if (/^\[assistant\]$/i.test(seg)) return <span key={`${i}-${j}`} className="text-purple-600 dark:text-purple-400 font-bold">{seg}</span>;
                    if (/^##\s.+/.test(seg)) return <span key={`${i}-${j}`} className="text-amber-700 dark:text-amber-300 font-bold">{seg}</span>;
                    return <span key={`${i}-${j}`}>{seg}</span>;
                  });
                })}
                {!renderedPrompt && <span className="text-slate-400">(\u7A7A)</span>}
              </pre>
            </div>
          </div>

          {/* Analysis Dashboard */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Prompt 深度分析</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Radar Chart */}
              <div className="flex justify-center">
                <RadarChart dimensions={analysis.dimensions} size={220} color="#f59e0b" />
              </div>

              {/* Score + Stats */}
              <div className="space-y-4">
                {/* Total score */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-700"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={analysis.totalScore >= 70 ? '#22c55e' : analysis.totalScore >= 50 ? '#eab308' : '#ef4444'}
                        strokeWidth="3" strokeDasharray={`${analysis.totalScore}, 100`} strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{analysis.totalScore}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">综合评分</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {analysis.totalScore >= 70 ? '优秀' : analysis.totalScore >= 50 ? '良好' : '基础'}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '字符', value: analysis.totalChars },
                    { label: 'Tokens', value: `~${analysis.totalTokensEst}` },
                    { label: '行数', value: analysis.lines },
                    { label: '有效行', value: analysis.nonEmptyLines },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{s.value}</div>
                      <div className="text-[10px] text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Techniques */}
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">检测到的技巧</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.techniques.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">优化建议</div>
              <div className="space-y-1.5">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">{i === 0 && analysis.totalScore >= 70 ? '✓' : '→'}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips */}
          {mode === 'template' && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-amber-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">{activeTemplate.name} 使用技巧</h3>
              <ul className="space-y-1.5">
                {activeTemplate.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-amber-500 mt-0.5">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
