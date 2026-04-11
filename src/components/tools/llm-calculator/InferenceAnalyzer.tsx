// Tab 2: KV Cache & Inference Analyzer
import { useState, useMemo } from 'react';
import type { ModelConfig, ParamBreakdown } from './types';
import { calculateKVCache, calculateInference, calculateTraining, formatNumber, formatBytes, formatCost, GPU_PRESETS, SCALING_STRATEGIES } from './calculations';

interface Props { config: ModelConfig; params: ParamBreakdown; }
const SL = [1024, 4096, 8192, 16384, 32768, 65536, 131072];

function SC({ label, value, sub, highlight, small }: { label: string; value: string; sub?: string; highlight?: boolean; small?: boolean }) {
  return (<div className={`p-3 rounded-lg border text-center ${highlight ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}><div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</div><div className={`font-bold font-mono ${small ? 'text-sm' : 'text-lg'} ${highlight ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</div>{sub && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}</div>);
}

export default function InferenceAnalyzer({ config, params }: Props) {
  const [seqLen, setSeqLen] = useState(4096);
  const [bs, setBs] = useState(1);
  const [gi, setGi] = useState(0);
  const [ng, setNg] = useState(1);
  const [qb, setQb] = useState(2);
  const [mfu, setMfu] = useState(0.4);
  const [nt, setNt] = useState(2e12);
  const gpu = GPU_PRESETS[gi];

  const kvC = useMemo(() => SL.filter(s => s <= config.maxSeqLen * 2).map(s => ({ seqLen: s, ...calculateKVCache(config, s, bs) })), [config, bs]);
  const kv = useMemo(() => calculateKVCache(config, seqLen, bs), [config, seqLen, bs]);
  const inf = useMemo(() => calculateInference(config, params, gpu, ng, seqLen, bs, qb), [config, params, gpu, ng, seqLen, bs, qb]);
  const tr = useMemo(() => calculateTraining(params, config, nt, ng, gpu, mfu), [params, config, nt, ng, gpu, mfu]);
  const sd = useMemo(() => SCALING_STRATEGIES.map(s => ({ ...s, opt: s.tokensForParams(params.activeParams) })), [params.activeParams]);

  const sel = "w-full px-2 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100";
  const inp = "w-full px-2 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100";
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div><label className={lbl}>GPU</label><select value={gi} onChange={e => setGi(Number(e.target.value))} className={sel}>{GPU_PRESETS.map((g, i) => <option key={i} value={i}>{g.name}</option>)}</select></div>
        <div><label className={lbl}>GPU 数量</label><input type="number" value={ng} min={1} onChange={e => setNg(Math.max(1, parseInt(e.target.value) || 1))} className={inp} /></div>
        <div><label className={lbl}>量化</label><select value={qb} onChange={e => setQb(Number(e.target.value))} className={sel}><option value={2}>FP16/BF16</option><option value={1}>INT8</option><option value={0.5}>INT4</option></select></div>
        <div><label className={lbl}>序列长度</label><select value={seqLen} onChange={e => setSeqLen(Number(e.target.value))} className={sel}>{SL.map(s => <option key={s} value={s}>{formatNumber(s)}</option>)}</select></div>
        <div><label className={lbl}>Batch</label><input type="number" value={bs} min={1} onChange={e => setBs(Math.max(1, parseInt(e.target.value) || 1))} className={inp} /></div>
        <div><label className={lbl}>MFU</label><select value={mfu} onChange={e => setMfu(Number(e.target.value))} className={sel}>{[0.2,0.3,0.4,0.5,0.6].map(v => <option key={v} value={v}>{(v*100).toFixed(0)}%</option>)}</select></div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">KV Cache 分析</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <SC label="每 Token" value={formatBytes(kv.perTokenBytes)} sub={`${config.numKVHeads} KV × ${params.headDim}d`} />
          <SC label={`@${formatNumber(seqLen)}`} value={formatBytes(kv.totalBytes)} sub={`batch=${bs}`} />
          <SC label="GQA 节省" value={`${kv.gqaSaving.toFixed(1)}×`} sub={`vs ${config.numHeads}-head`} highlight={kv.gqaSaving > 1} />
          <SC label="公式" value="2LHd" sub="2×L×kv_heads×d×B" small />
        </div>
        <div className="mt-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">KV Cache 增长</div>
          <div className="flex items-end gap-1 h-32">
            {kvC.map((d, i) => {
              const mx = kvC[kvC.length-1]?.totalBytes || 1;
              const hp = (d.totalBytes / mx) * 100;
              return (
                <button key={i} onClick={() => setSeqLen(d.seqLen)}
                  className={`flex-1 rounded-t transition-all relative group ${d.seqLen === seqLen ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-300 dark:bg-slate-600 hover:bg-indigo-300 dark:hover:bg-indigo-700'}`}
                  style={{ height: `${Math.max(hp, 4)}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100">{formatBytes(d.totalBytes)}</div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1">{kvC.map((d, i) => <div key={i} className="flex-1 text-center text-[10px] text-slate-400 font-mono">{formatNumber(d.seqLen)}</div>)}</div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">推理显存</h3>
        <div className="mb-4">
          <div className="flex h-8 rounded-lg overflow-hidden">
            <div className="bg-indigo-500 flex items-center justify-center text-[10px] text-white font-mono" style={{ width: `${(inf.modelWeightBytes / inf.totalBytes) * 100}%` }}>
              {(inf.modelWeightBytes / inf.totalBytes) * 100 > 15 ? `权重 ${formatBytes(inf.modelWeightBytes)}` : ''}
            </div>
            <div className="bg-emerald-500 flex items-center justify-center text-[10px] text-white font-mono" style={{ width: `${(inf.kvCacheBytes / inf.totalBytes) * 100}%` }}>
              {(inf.kvCacheBytes / inf.totalBytes) * 100 > 10 ? `KV ${formatBytes(inf.kvCacheBytes)}` : ''}
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>总计: {formatBytes(inf.totalBytes)}</span>
            <span>{gpu.name} × {ng} = {gpu.memoryGB * ng} GB</span>
          </div>
          {inf.totalBytes > gpu.memoryGB * 1e9 * ng && <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">显存不足</div>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SC label="Prefill" value={`${formatNumber(inf.prefillTPS)} tok/s`} sub="Compute-bound" />
          <SC label="Decode" value={`${formatNumber(inf.decodeTPS)} tok/s`} sub="Memory-BW" />
          <SC label="GPU 月租" value={formatCost(inf.monthCostUSD)} sub={`${gpu.name}×${ng}`} />
          <SC label="带宽" value={`${(gpu.bandwidthTBs * ng).toFixed(1)} TB/s`} sub="Bandwidth" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">训练成本</h3>
        <div className="mb-4">
          <label className={lbl}>训练 Tokens</label>
          <div className="flex flex-wrap gap-2">
            {[1e11, 3e11, 1e12, 2e12, 5e12, 1e13, 1.5e13].map(t => (
              <button key={t} onClick={() => setNt(t)} className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${nt === t ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{formatNumber(t)}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <SC label="FLOPs" value={formatNumber(tr.flops)} sub={`6×${formatNumber(params.activeParams)}×${formatNumber(nt)}`} />
          <SC label="时间" value={tr.trainingDays < 1 ? `${(tr.trainingDays * 24).toFixed(1)}h` : `${tr.trainingDays.toFixed(1)}天`} sub={`${ng}×${gpu.name}`} />
          <SC label="显存/卡" value={formatBytes(tr.totalTrainingMem / ng)} sub="模型+梯度+Adam" />
          <SC label="成本" value={formatCost(tr.costUSD)} sub={`$${gpu.pricePerHour}/hr`} highlight />
        </div>
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Scaling 策略</div>
          <div className="space-y-1.5">
            {sd.map(s => {
              const r = nt / s.opt;
              return (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600 dark:text-slate-400 w-44">{s.label}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{formatNumber(s.opt)}</span>
                  {r > 0.5 && r < 2 ? <span className="text-green-600 dark:text-green-400 font-medium">匹配</span> : r < 0.5 ? <span className="text-amber-600 dark:text-amber-400">Under</span> : <span className="text-blue-600 dark:text-blue-400">Over</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
