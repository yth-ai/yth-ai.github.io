import { useState, useCallback } from 'react';
import { TECHNIQUES, TIMELINE, DECISION_TREE, type DecisionNode } from './techniques';

// ============================================================
// Tab 4: 技术图鉴 (Technique Atlas)
// ============================================================

type View = 'cards' | 'decision' | 'timeline';

export default function TechniqueAtlas() {
  const [view, setView] = useState<View>('cards');
  const [expandedTech, setExpandedTech] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  // Decision tree state
  const [treePath, setTreePath] = useState<string[]>(['root']);
  const currentNode = DECISION_TREE.find(n => n.id === treePath[treePath.length - 1])!;

  const answerDecision = useCallback((choice: 'yes' | 'no') => {
    const nextId = choice === 'yes' ? currentNode.yes : currentNode.no;
    if (nextId) setTreePath(prev => [...prev, nextId]);
  }, [currentNode]);

  const resetTree = useCallback(() => setTreePath(['root']), []);

  const categories = [...new Set(TECHNIQUES.map(t => t.category))];
  const filteredTechs = filterCat ? TECHNIQUES.filter(t => t.category === filterCat) : TECHNIQUES;

  return (
    <div className="space-y-5">
      {/* View switch */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { id: 'cards' as View, label: '技术卡片', icon: '📋' },
          { id: 'decision' as View, label: '决策向导', icon: '🧭' },
          { id: 'timeline' as View, label: '演化时间线', icon: '📈' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              view === v.id
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
          >
            <span>{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* ===== Cards View ===== */}
      {view === 'cards' && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${!filterCat ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
            >
              全部 ({TECHNIQUES.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat === filterCat ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filterCat === cat ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTechs.map(tech => {
              const isExpanded = expandedTech === tech.id;
              return (
                <div
                  key={tech.id}
                  onClick={() => setExpandedTech(isExpanded ? null : tech.id)}
                  className={`group cursor-pointer bg-white dark:bg-slate-800 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-amber-400 dark:border-amber-600 shadow-lg col-span-1 md:col-span-2'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                  }`}
                >
                  {/* Color top bar */}
                  <div className="h-1" style={{ backgroundColor: tech.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tech.name}</h4>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tech.nameEn} · {tech.year}</div>
                      </div>
                      {/* Difficulty stars */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-xs ${i < tech.difficulty ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium" style={{ color: tech.color }}>{tech.oneLiner}</p>

                    {isExpanded && (
                      <div className="space-y-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tech.description}</p>
                        {tech.paper && (
                          <div className="text-[10px] text-slate-500">
                            <span className="font-medium">出处:</span> {tech.paper}
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] font-medium text-slate-500 mb-1">适用场景</div>
                          <div className="flex flex-wrap gap-1">
                            {tech.useCases.map(uc => (
                              <span key={uc} className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: tech.color + '15', color: tech.color }}>
                                {uc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Use cases preview */}
                    {!isExpanded && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tech.useCases.slice(0, 3).map(uc => (
                          <span key={uc} className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                            {uc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== Decision Tree View ===== */}
      {view === 'decision' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {treePath.map((nodeId, i) => {
                const node = DECISION_TREE.find(n => n.id === nodeId)!;
                return (
                  <div key={nodeId} className="flex items-center gap-2">
                    {i > 0 && <span className="text-slate-300 dark:text-slate-600">→</span>}
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === treePath.length - 1
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {node.result ? '✓' : i + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Current question or result */}
            {currentNode.result ? (
              <div className="text-center space-y-4">
                <div className="text-4xl">🎯</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  推荐使用：{currentNode.resultLabel}
                </h3>
                {(() => {
                  const tech = TECHNIQUES.find(t => t.id === currentNode.result);
                  if (!tech) return null;
                  return (
                    <div className="text-left bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2" style={{ color: tech.color }}>{tech.oneLiner}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{tech.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {tech.useCases.map(uc => (
                          <span key={uc} className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: tech.color + '15', color: tech.color }}>
                            {uc}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <button onClick={resetTree} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
                  重新诊断
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">
                  {currentNode.question}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => answerDecision('yes')}
                    className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl text-center hover:border-emerald-400 transition-colors"
                  >
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">是</div>
                  </button>
                  <button
                    onClick={() => answerDecision('no')}
                    className="p-4 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-800 rounded-xl text-center hover:border-rose-400 transition-colors"
                  >
                    <div className="text-2xl mb-1">❌</div>
                    <div className="text-sm font-medium text-rose-700 dark:text-rose-400">否</div>
                  </button>
                </div>
                {treePath.length > 1 && (
                  <button
                    onClick={() => setTreePath(prev => prev.slice(0, -1))}
                    className="block mx-auto text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    ← 返回上一步
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Timeline View ===== */}
      {view === 'timeline' && (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-amber-400" />

          {TIMELINE.map((event, i) => (
            <div key={i} className="relative mb-6 last:mb-0">
              {/* Dot */}
              <div
                className={`absolute -left-5 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${
                  event.impact === 'high' ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900' : ''
                }`}
                style={{
                  backgroundColor: event.color,
                  ringColor: event.impact === 'high' ? event.color : undefined,
                }}
              >
                {event.impact === 'high' && <span className="text-[8px] text-white font-bold">★</span>}
              </div>

              {/* Content */}
              <div className="ml-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: event.color }}>
                    {event.year}{event.month ? `.${String(event.month).padStart(2, '0')}` : ''}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{event.name}</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: event.color + '15', color: event.color }}>
                    {event.category}
                  </span>
                  {event.impact === 'high' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium">
                      里程碑
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
