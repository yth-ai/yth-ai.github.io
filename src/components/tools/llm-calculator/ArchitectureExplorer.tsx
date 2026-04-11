// ============================================================
// Tab 1: Architecture Explorer — Transformer Blocks + MoE
// ============================================================

import { useMemo } from 'react';
import type { ModelConfig } from './types';
import { calculateParams, calculateMemory, formatNumber, formatBytes } from './calculations';

interface Props {
  config: ModelConfig;
  tiedEmbedding: boolean;
}

const COLORS: Record<string, { bg: string; text: string; dark: string }> = {
  embedding: { bg: 'bg-blue-100', text: 'text-blue-800', dark: 'dark:bg-blue-900/40 dark:text-blue-300' },
  attention: { bg: 'bg-emerald-100', text: 'text-emerald-800', dark: 'dark:bg-emerald-900/40 dark:text-emerald-300' },
  mlp:      { bg: 'bg-amber-100', text: 'text-amber-800', dark: 'dark:bg-amber-900/40 dark:text-amber-300' },
  router:   { bg: 'bg-violet-100', text: 'text-violet-800', dark: 'dark:bg-violet-900/40 dark:text-violet-300' },
  norm:     { bg: 'bg-slate-100', text: 'text-slate-600', dark: 'dark:bg-slate-800 dark:text-slate-400' },
  lmHead:   { bg: 'bg-purple-100', text: 'text-purple-800', dark: 'dark:bg-purple-900/40 dark:text-purple-300' },
};

function Block({ label, params, total, colorKey, formula }: {
  label: string; params: number; total: number; colorKey: string; formula?: string;
}) {
  const c = COLORS[colorKey] || COLORS.norm;
  const pct = total > 0 ? (params / total) * 100 : 0;
  const widthPct = Math.max(2, Math.min(pct, 100));
  return (
    <div className={`rounded-lg p-3 ${c.bg} ${c.dark} transition-all hover:scale-[1.01]`}
         style={{ flex: `${widthPct} 0 0` }}>
      <div className={`text-xs font-semibold ${c.text} mb-1`}>{label}</div>
      <div className={`text-lg font-bold font-mono ${c.text}`}>{formatNumber(params)}</div>
      <div className={`text-xs ${c.text} opacity-70`}>{pct.toFixed(1)}%</div>
      {formula && <div className={`text-xs ${c.text} opacity-50 mt-1 font-mono`}>{formula}</div>}
    </div>
  );
}

export default function ArchitectureExplorer({ config, tiedEmbedding }: Props) {
  const params = useMemo(() => calculateParams(config, tiedEmbedding), [config, tiedEmbedding]);
  const memory = useMemo(() => calculateMemory(params.totalParams), [params.totalParams]);

  const isMoE = config.isMoE;
  const numExperts = isMoE ? (config.numExperts || 8) : 1;
  const activeExperts = isMoE ? (config.activeExperts || 2) : 1;

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="text-sm font-medium text-indigo-200 mb-1">
            {isMoE ? '总参数量 (All Experts)' : '总参数量'}
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1">
            {formatNumber(params.totalParams)}
          </div>
          {isMoE && (
            <div className="mt-2 flex items-center gap-3">
              <div className="bg-white/15 rounded-lg px-3 py-1.5">
                <span className="text-xs text-indigo-200">推理激活</span>
                <span className="ml-2 text-xl font-bold">{formatNumber(params.activeParams)}</span>
              </div>
              <div className="text-xs text-indigo-300">
                {numExperts} experts, {activeExperts} active/layer
              </div>
            </div>
          )}
          <div className="text-xs text-indigo-300 mt-2 font-mono">
            Head Dim: {params.headDim} · GQA: {config.numHeads}/{config.numKVHeads}
            {tiedEmbedding && ' · 权重共享'}
            {config.note && <span className="ml-2 italic">({config.note})</span>}
          </div>
        </div>
      </div>

      {/* Transformer Building Blocks */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Transformer 积木图</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Block label="Embedding" params={params.embedding} total={params.totalParams}
                   colorKey="embedding" formula={`V(${formatNumber(config.vocabSize)}) × h(${config.hiddenSize})`} />
            {!tiedEmbedding && (
              <Block label="LM Head" params={params.lmHead} total={params.totalParams}
                     colorKey="lmHead" formula="V × h" />
            )}
          </div>
          <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">× {config.numLayers} layers</div>
            <div className="flex gap-2 flex-wrap">
              <Block label="Attention" params={params.attnPerLayer} total={params.perLayer} colorKey="attention" formula="Q+K+V+O" />
              {isMoE ? (
                <>
                  <Block label="Router" params={params.routerPerLayer} total={params.perLayer} colorKey="router" formula={`h × ${numExperts}`} />
                  <div className="rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 p-2 flex-1">
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                      MLP × {numExperts} experts ({activeExperts} active)
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(numExperts, 16) }).map((_, i) => (
                        <div key={i} className={`h-6 flex-1 rounded text-center text-[10px] leading-6 font-mono
                          ${i < activeExperts
                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-400 dark:text-amber-600 border border-dashed border-amber-200 dark:border-amber-800'
                          }`}>
                          {i < 16 ? `E${i}` : ''}
                        </div>
                      ))}
                      {numExperts > 16 && (
                        <div className="h-6 px-2 rounded text-center text-[10px] leading-6 text-amber-500">+{numExperts - 16}</div>
                      )}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-mono">
                      Each: {formatNumber(params.mlpPerLayer)} · Total: {formatNumber(params.mlpPerLayer * numExperts)}
                    </div>
                  </div>
                </>
              ) : (
                <Block label="MLP (SwiGLU)" params={params.mlpPerLayer} total={params.perLayer} colorKey="mlp" formula="3 × h × ffn" />
              )}
              <Block label="Norm" params={params.normPerLayer} total={params.perLayer} colorKey="norm" formula="2 × h" />
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Distribution + Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">参数分布</h3>
          <div className="space-y-2">
            {[
              { label: 'Embedding', value: params.embedding, color: 'bg-blue-500' },
              { label: `Attention × ${config.numLayers}`, value: params.attnPerLayer * config.numLayers, color: 'bg-emerald-500' },
              ...(isMoE ? [
                { label: `Router × ${config.numLayers}`, value: params.routerPerLayer * config.numLayers, color: 'bg-violet-500' },
                { label: `MLP × ${numExperts}E × ${config.numLayers}L`, value: params.totalMlpAllLayers, color: 'bg-amber-500' },
              ] : [
                { label: `MLP × ${config.numLayers}`, value: params.mlpPerLayer * config.numLayers, color: 'bg-amber-500' },
              ]),
              { label: `Norm × ${config.numLayers}`, value: params.normPerLayer * config.numLayers, color: 'bg-slate-400' },
              ...(!tiedEmbedding ? [{ label: 'LM Head', value: params.lmHead, color: 'bg-purple-500' }] : []),
            ].map((item, i) => {
              const pct = (item.value / params.totalParams) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{formatNumber(item.value)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <p>单层: {formatNumber(params.perLayer)} (Attn: {formatNumber(params.attnPerLayer)} + MLP: {formatNumber(params.mlpPerLayer)}{isMoE ? ` × ${numExperts}E` : ''})</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">推理显存 {isMoE && '(全部权重)'}</h3>
          <div className="space-y-2">
            {[
              { label: 'FP16/BF16', value: memory.fp16, color: 'bg-orange-500', desc: '半精度' },
              { label: 'INT8', value: memory.int8, color: 'bg-yellow-500', desc: '8位量化' },
              { label: 'INT4', value: memory.int4, color: 'bg-green-500', desc: '4位量化' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{formatBytes(item.value)}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">GPU 适配</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { gpu: 'H100 80GB', mem: 80e9 },
                { gpu: 'H200 141GB', mem: 141e9 },
                { gpu: '4090 24GB', mem: 24e9 },
                { gpu: 'MI300X 192GB', mem: 192e9 },
              ].map(({ gpu, mem }) => {
                const canFP16 = memory.fp16 <= mem * 0.85;
                const canINT8 = memory.int8 <= mem * 0.85;
                const canINT4 = memory.int4 <= mem * 0.85;
                const status = canFP16 ? 'FP16' : canINT8 ? 'INT8' : canINT4 ? 'INT4' : '不适配';
                const color = canFP16 ? 'text-green-600 dark:text-green-400' : canINT8 ? 'text-yellow-600 dark:text-yellow-400' : canINT4 ? 'text-orange-600 dark:text-orange-400' : 'text-red-500';
                return (
                  <div key={gpu} className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{gpu}</span>
                    <span className={`font-medium ${color}`}>{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {isMoE && (
            <div className="mt-3 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
              <div className="text-xs text-violet-700 dark:text-violet-300">
                <span className="font-semibold">MoE：</span>推理时需加载全部 {formatNumber(params.totalParams)} 参数，但每 token 只激活 {formatNumber(params.activeParams)} 参数。
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulas */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          公式参考 ↓
        </summary>
        <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 space-y-2 font-mono">
          <p>Dense: N = Embed + L × (Attn + MLP + Norm) + LM_Head</p>
          <p>MoE total: N = Embed + L × (Attn + Router + E×MLP + Norm) + LM_Head</p>
          <p>MoE active: N_a = Embed + L × (Attn + Router + A×MLP + Norm) + LM_Head</p>
          <p>Attention = Q(h×h) + K(h×kv_h×d) + V(h×kv_h×d) + O(h×h)</p>
          <p>MLP(SwiGLU) = 3 × h × ffn</p>
          <p>Router = h × num_experts (per layer)</p>
        </div>
      </details>
    </div>
  );
}
