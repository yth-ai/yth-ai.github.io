import { useState, useRef, useEffect, useCallback } from 'react';
import { CHAIN_PRESETS, type ChainNode, type ChainPreset } from './chainPresets';

// ============================================================
// Tab 3: 链式构建器 (Chain Builder)
// ============================================================

const NODE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  prompt:    { bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-400 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-300', glow: '#f59e0b' },
  transform: { bg: 'bg-cyan-50 dark:bg-cyan-950/30',    border: 'border-cyan-400 dark:border-cyan-600',   text: 'text-cyan-700 dark:text-cyan-300',   glow: '#06b6d4' },
  branch:    { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-400 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300', glow: '#8b5cf6' },
  merge:     { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-400 dark:border-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', glow: '#10b981' },
};

const TYPE_LABELS: Record<string, string> = {
  prompt: 'Prompt',
  transform: '转换',
  branch: '分支',
  merge: '合并',
};

const TYPE_ICONS: Record<string, string> = {
  prompt: '📝',
  transform: '🔄',
  branch: '🔀',
  merge: '🔗',
};

export default function ChainBuilder() {
  const [activePreset, setActivePreset] = useState(0);
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [activeNodeIdx, setActiveNodeIdx] = useState(-1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const runTimerRef = useRef<number | null>(null);

  const preset = CHAIN_PRESETS[activePreset];

  // Simulate execution animation
  const runChain = useCallback(() => {
    if (runState === 'running') return;
    setRunState('running');
    setActiveNodeIdx(0);
    setSelectedNode(null);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= preset.nodes.length) {
        clearInterval(interval);
        setRunState('done');
        setActiveNodeIdx(preset.nodes.length - 1);
      } else {
        setActiveNodeIdx(step);
      }
    }, 1200);
    runTimerRef.current = interval as unknown as number;
  }, [preset.nodes.length, runState]);

  const resetChain = useCallback(() => {
    if (runTimerRef.current) {
      clearInterval(runTimerRef.current);
    }
    setRunState('idle');
    setActiveNodeIdx(-1);
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    return () => { if (runTimerRef.current) clearInterval(runTimerRef.current); };
  }, []);

  useEffect(() => {
    resetChain();
  }, [activePreset, resetChain]);

  // Calculate SVG connection paths
  const nodeWidth = 160;
  const nodeHeight = 72;

  function getConnectionPath(from: ChainNode, to: ChainNode): string {
    const x1 = from.position.x + nodeWidth;
    const y1 = from.position.y + nodeHeight / 2;
    const x2 = to.position.x;
    const y2 = to.position.y + nodeHeight / 2;
    const cpx = (x1 + x2) / 2;
    return `M${x1},${y1} C${cpx},${y1} ${cpx},${y2} ${x2},${y2}`;
  }

  // Canvas dimensions
  const maxX = Math.max(...preset.nodes.map(n => n.position.x)) + nodeWidth + 40;
  const maxY = Math.max(...preset.nodes.map(n => n.position.y)) + nodeHeight + 40;

  return (
    <div className="space-y-5">
      {/* Preset selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {CHAIN_PRESETS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActivePreset(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activePreset === i
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
          >
            <span>{p.icon}</span>
            {p.name}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={runState === 'idle' ? runChain : resetChain}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            runState === 'idle'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {runState === 'idle' ? '▶ 模拟运行' : runState === 'running' ? '⏳ 运行中...' : '↺ 重置'}
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">{preset.description}</p>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto"
        style={{ minHeight: maxY + 20 }}
      >
        {/* SVG Connections */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={maxX}
          height={maxY + 20}
          style={{ minWidth: maxX }}
        >
          {preset.nodes.map(node =>
            node.connections.map(targetId => {
              const target = preset.nodes.find(n => n.id === targetId);
              if (!target) return null;
              const fromIdx = preset.nodes.indexOf(node);
              const toIdx = preset.nodes.indexOf(target);
              const isActive = runState !== 'idle' && fromIdx <= activeNodeIdx && toIdx <= activeNodeIdx;
              return (
                <path
                  key={`${node.id}-${targetId}`}
                  d={getConnectionPath(node, target)}
                  fill="none"
                  stroke={isActive ? NODE_COLORS[node.type].glow : '#cbd5e1'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={isActive ? 'none' : '6 4'}
                  className="transition-all duration-500"
                  opacity={isActive ? 1 : 0.4}
                />
              );
            })
          )}
          {/* Flow particles when running */}
          {runState === 'running' && preset.nodes.map((node, fromIdx) =>
            node.connections.map(targetId => {
              const target = preset.nodes.find(n => n.id === targetId);
              if (!target || fromIdx !== activeNodeIdx - 1) return null;
              return (
                <circle key={`particle-${node.id}-${targetId}`} r="4" fill={NODE_COLORS[node.type].glow}>
                  <animateMotion dur="1s" repeatCount="indefinite" path={getConnectionPath(node, target)} />
                </circle>
              );
            })
          )}
        </svg>

        {/* Nodes */}
        {preset.nodes.map((node, idx) => {
          const colors = NODE_COLORS[node.type];
          const isActive = runState !== 'idle' && idx <= activeNodeIdx;
          const isCurrent = runState === 'running' && idx === activeNodeIdx;
          const isSelected = selectedNode === node.id;

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(isSelected ? null : node.id)}
              className={`absolute cursor-pointer rounded-xl border-2 p-3 transition-all duration-300 ${colors.bg} ${
                isCurrent ? 'ring-2 ring-offset-2 ring-amber-500 dark:ring-offset-slate-900 scale-105' :
                isActive ? colors.border :
                isSelected ? 'border-amber-400 dark:border-amber-500' :
                'border-slate-200 dark:border-slate-700'
              } ${isCurrent ? 'shadow-lg' : isActive ? 'shadow-md' : 'shadow-sm hover:shadow-md'}`}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: nodeWidth,
                height: nodeHeight,
                zIndex: isCurrent ? 10 : 1,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{TYPE_ICONS[node.type]}</span>
                <span className={`text-xs font-bold ${colors.text}`}>{node.label}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{node.description}</div>
              {/* Type badge */}
              <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-[8px] font-bold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                {TYPE_LABELS[node.type]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Node detail / Mock data */}
      {selectedNode && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          {(() => {
            const node = preset.nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            const mock = preset.mockData[node.id];
            return (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span>{TYPE_ICONS[node.type]}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{node.label}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${NODE_COLORS[node.type].bg} ${NODE_COLORS[node.type].text}`}>
                    {TYPE_LABELS[node.type]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{node.description}</p>
                {node.template && (
                  <div className="mb-3">
                    <div className="text-[10px] font-medium text-slate-500 mb-1">Prompt 模板</div>
                    <pre className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{node.template}</pre>
                  </div>
                )}
                {mock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 mb-1">模拟输入</div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{mock.input}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 mb-1">模拟输出</div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{mock.output}</div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span>{TYPE_ICONS[type]}</span>
            <span className="font-medium">{label}</span>
          </div>
        ))}
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span>点击节点查看详情 · 点击「模拟运行」看数据流动</span>
      </div>
    </div>
  );
}
