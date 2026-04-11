// ============================================================
// Tab 3: Model Duel — Side-by-Side Comparison
// ============================================================

import { useState, useMemo } from 'react';
import type { ModelConfig } from './types';
import { calculateParams, calculateMemory, calculateKVCache, calculateInference, formatNumber, formatBytes, GPU_PRESETS } from './calculations';
import { PRESETS, PRESET_GROUPS } from './presets';

function DuelSelector({ label, selected, onSelect }: {
  label: string; selected: string; onSelect: (k: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</div>
      <div className="space-y-1">
        {PRESET_GROUPS.map(group => (
          <div key={group.label}>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">{group.label}</div>
            <div className="flex flex-wrap gap-1">
              {group.keys.map(k => {
                const p = PRESETS[k];
                if (!p) return null;
                return (
                  <button key={k} onClick={() => onSelect(k)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                            selected === k
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CompRow {
  label: string;
  leftValue: string;
  rightValue: string;
  leftRaw: number;
  rightRaw: number;
  higherIsBetter?: boolean;
}

export default function ModelDuel() {
  const [leftKey, setLeftKey] = useState('llama3-8b');
  const [rightKey, setRightKey] = useState('deepseek-v3');

  const leftConfig = PRESETS[leftKey] || PRESETS['llama3-8b'];
  const rightConfig = PRESETS[rightKey] || PRESETS['deepseek-v3'];

  const comparison = useMemo(() => {
    const lp = calculateParams(leftConfig);
    const rp = calculateParams(rightConfig);
    const lm = calculateMemory(lp.totalParams);
    const rm = calculateMemory(rp.totalParams);
    const lkv = calculateKVCache(leftConfig, 4096, 1);
    const rkv = calculateKVCache(rightConfig, 4096, 1);
    const lkv128 = calculateKVCache(leftConfig, 131072, 1);
    const rkv128 = calculateKVCache(rightConfig, 131072, 1);

    const gpu = GPU_PRESETS[0]; // H100
    const li = calculateInference(leftConfig, lp, gpu, 1, 4096, 1, 2);
    const ri = calculateInference(rightConfig, rp, gpu, 1, 4096, 1, 2);

    const rows: CompRow[] = [
      { label: '总参数量', leftValue: formatNumber(lp.totalParams), rightValue: formatNumber(rp.totalParams), leftRaw: lp.totalParams, rightRaw: rp.totalParams },
      { label: '激活参数量', leftValue: formatNumber(lp.activeParams), rightValue: formatNumber(rp.activeParams), leftRaw: lp.activeParams, rightRaw: rp.activeParams },
      { label: 'FP16 显存', leftValue: formatBytes(lm.fp16), rightValue: formatBytes(rm.fp16), leftRaw: lm.fp16, rightRaw: rm.fp16 },
      { label: 'INT4 显存', leftValue: formatBytes(lm.int4), rightValue: formatBytes(rm.int4), leftRaw: lm.int4, rightRaw: rm.int4 },
      { label: 'KV Cache @4K', leftValue: formatBytes(lkv.totalBytes), rightValue: formatBytes(rkv.totalBytes), leftRaw: lkv.totalBytes, rightRaw: rkv.totalBytes },
      { label: 'KV Cache @128K', leftValue: formatBytes(lkv128.totalBytes), rightValue: formatBytes(rkv128.totalBytes), leftRaw: lkv128.totalBytes, rightRaw: rkv128.totalBytes },
      { label: 'GQA 倍数', leftValue: `${lkv.gqaSaving.toFixed(1)}×`, rightValue: `${rkv.gqaSaving.toFixed(1)}×`, leftRaw: lkv.gqaSaving, rightRaw: rkv.gqaSaving, higherIsBetter: true },
      { label: 'Decode (H100)', leftValue: `${formatNumber(li.decodeTPS)} tok/s`, rightValue: `${formatNumber(ri.decodeTPS)} tok/s`, leftRaw: li.decodeTPS, rightRaw: ri.decodeTPS, higherIsBetter: true },
      { label: '层数', leftValue: `${leftConfig.numLayers}`, rightValue: `${rightConfig.numLayers}`, leftRaw: leftConfig.numLayers, rightRaw: rightConfig.numLayers },
      { label: 'Hidden Size', leftValue: `${leftConfig.hiddenSize}`, rightValue: `${rightConfig.hiddenSize}`, leftRaw: leftConfig.hiddenSize, rightRaw: rightConfig.hiddenSize },
      { label: 'Head Dim', leftValue: `${lp.headDim}`, rightValue: `${rp.headDim}`, leftRaw: lp.headDim, rightRaw: rp.headDim },
      { label: 'Max Seq', leftValue: formatNumber(leftConfig.maxSeqLen), rightValue: formatNumber(rightConfig.maxSeqLen), leftRaw: leftConfig.maxSeqLen, rightRaw: rightConfig.maxSeqLen, higherIsBetter: true },
    ];

    const totalRatio = Math.max(lp.totalParams, rp.totalParams) / Math.min(lp.totalParams, rp.totalParams);
    const activeRatio = Math.max(lp.activeParams, rp.activeParams) / Math.min(lp.activeParams, rp.activeParams);

    let summary = '';
    if (leftConfig.isMoE !== rightConfig.isMoE) {
      const moe = leftConfig.isMoE ? leftConfig.name : rightConfig.name;
      const dense = leftConfig.isMoE ? rightConfig.name : leftConfig.name;
      summary = `${moe} (MoE) vs ${dense} (Dense)：总参数差 ${totalRatio.toFixed(1)}× 但激活参数差仅 ${activeRatio.toFixed(1)}×。`;
    } else {
      const bigger = lp.totalParams > rp.totalParams ? leftConfig.name : rightConfig.name;
      const smaller = lp.totalParams > rp.totalParams ? rightConfig.name : leftConfig.name;
      summary = `${bigger} 总参数是 ${smaller} 的 ${totalRatio.toFixed(1)} 倍。`;
    }

    return { rows, summary };
  }, [leftConfig, rightConfig]);

  function diffColor(row: CompRow, side: 'left' | 'right'): string {
    const { leftRaw, rightRaw, higherIsBetter } = row;
    if (leftRaw === rightRaw) return '';
    const ratio = Math.max(leftRaw, rightRaw) / Math.min(leftRaw, rightRaw);
    if (ratio < 1.1) return '';
    const isBetter = side === 'left'
      ? (higherIsBetter ? leftRaw > rightRaw : leftRaw < rightRaw)
      : (higherIsBetter ? rightRaw > leftRaw : rightRaw < leftRaw);
    if (ratio > 2) return isBetter ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-500 dark:text-red-400';
    return isBetter ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
          <DuelSelector label={`左侧: ${leftConfig.name}`} selected={leftKey} onSelect={setLeftKey} />
        </div>
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
          <DuelSelector label={`右侧: ${rightConfig.name}`} selected={rightKey} onSelect={setRightKey} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-1/3">指标</th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {leftConfig.name}
                {leftConfig.isMoE && <span className="ml-1 px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[10px]">MoE</span>}
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                {rightConfig.name}
                {rightConfig.isMoE && <span className="ml-1 px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[10px]">MoE</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row, i) => (
              <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'}`}>
                <td className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400">{row.label}</td>
                <td className={`px-4 py-2 text-center font-mono text-xs ${diffColor(row, 'left')}`}>{row.leftValue}</td>
                <td className={`px-4 py-2 text-center font-mono text-xs ${diffColor(row, 'right')}`}>{row.rightValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
        <div className="text-xs text-indigo-700 dark:text-indigo-300">
          <span className="font-semibold">总结：</span> {comparison.summary}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">快捷对比</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Dense vs MoE', left: 'llama3-70b', right: 'mixtral-8x7b' },
            { label: 'LLaMA 2→3', left: 'llama2-7b', right: 'llama3-8b' },
            { label: 'DSV3 vs 405B', left: 'deepseek-v3', right: 'llama31-405b' },
            { label: 'Scout vs Maverick', left: 'llama4-scout', right: 'llama4-maverick' },
          ].map(s => (
            <button key={s.label} onClick={() => { setLeftKey(s.left); setRightKey(s.right); }}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all">
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
