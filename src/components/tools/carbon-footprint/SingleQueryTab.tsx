import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { AIModel, RegionInfo, CalcResult } from './types';
import { AI_MODELS, PRESET_SCENARIOS, CARBON_INTENSITY, WATER_PER_KWH, EQUIVALENTS } from './data';
import ParticleEarth from './ParticleEarth';
import BarChart from './BarChart';
import EquivalentCards from './EquivalentCards';

interface SingleQueryTabProps {
  onCalcChange?: (calc: CalcResult) => void;
}

export default function SingleQueryTab({ onCalcChange }: SingleQueryTabProps) {
  const [selectedModel, setSelectedModel] = useState('gpt4o');
  const [tokenCount, setTokenCount] = useState(800);
  const [customTokens, setCustomTokens] = useState('');
  const [region, setRegion] = useState('us');
  const [globalScale, setGlobalScale] = useState(false);
  const [dailyUsers, setDailyUsers] = useState(100_000_000);
  const [invertEquivalents, setInvertEquivalents] = useState(true);
  const [animatedCO2, setAnimatedCO2] = useState(0);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(0);

  const model = AI_MODELS.find(m => m.id === selectedModel)!;
  const regionInfo = CARBON_INTENSITY[region];

  const calc = useMemo(() => {
    const energyKWh = (tokenCount / 1_000_000) * model.energyPerMToken;
    const co2Grams = energyKWh * regionInfo.gCO2perKWh;
    const waterML = energyKWh * WATER_PER_KWH * 1000;
    const yearlyGlobalCO2 = globalScale ? co2Grams * dailyUsers * 365 / 1_000_000 : 0;
    const yearlyGlobalKWh = globalScale ? energyKWh * dailyUsers * 365 : 0;
    return { energyKWh, co2Grams, waterML, yearlyGlobalCO2, yearlyGlobalKWh };
  }, [tokenCount, model, regionInfo, globalScale, dailyUsers]);

  useEffect(() => {
    onCalcChange?.(calc);
  }, [calc, onCalcChange]);

  // Animate CO2 value
  useEffect(() => {
    const target = calc.co2Grams;
    const startVal = animatedCO2;
    const startTime = performance.now();
    const duration = 500;
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedCO2(startVal + (target - startVal) * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [calc.co2Grams]);

  const earthIntensity = Math.min(Math.log10(Math.max(calc.co2Grams, 0.001) + 1) / 3, 1);

  const modelComparison = useMemo(() => {
    return AI_MODELS.map(m => ({
      label: `${m.name}${m.isMoE ? ' ⚡' : ''}`,
      value: (tokenCount / 1_000_000) * m.energyPerMToken * regionInfo.gCO2perKWh,
      color: m.color,
      suffix: ' g',
    }));
  }, [tokenCount, regionInfo]);

  const maxModelCO2 = Math.max(...modelComparison.map(m => m.value), 0.001);

  const handleTokenChange = useCallback((tokens: number) => {
    setTokenCount(tokens);
    setCustomTokens('');
  }, []);

  return (
    <div className="space-y-8">
      {/* Header with earth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center gap-3">
          <ParticleEarth intensity={earthIntensity} />
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white transition-all">
              {animatedCO2 < 0.001 ? animatedCO2.toExponential(2) : animatedCO2 < 1 ? animatedCO2.toFixed(4) : animatedCO2.toFixed(2)}
              <span className="text-base font-normal text-slate-500 dark:text-slate-400 ml-1">gCO₂e</span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {regionInfo.label} · {model.name}
              {model.uncertaintyRange > 0 && (
                <span className="ml-1 text-amber-500 dark:text-amber-400">±{Math.round(model.uncertaintyRange * 100)}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="md:col-span-2 grid grid-cols-3 gap-3">
          {[
            {
              label: '电力消耗',
              value: calc.energyKWh < 0.001 ? `${(calc.energyKWh * 1000).toFixed(3)} Wh` : `${calc.energyKWh.toFixed(4)} kWh`,
              sub: `≈ ${(calc.energyKWh * 1000 / 15).toFixed(2)} 次充手机`,
              bgColor: 'rgba(245,158,11,0.08)',
              borderColor: 'rgba(245,158,11,0.2)',
            },
            {
              label: '碳排放',
              value: calc.co2Grams < 1 ? `${(calc.co2Grams * 1000).toFixed(1)} mg` : `${calc.co2Grams.toFixed(2)} g`,
              sub: `≈ 汽车行驶 ${(calc.co2Grams / 0.21).toFixed(1)} 米`,
              bgColor: 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.2)',
            },
            {
              label: '水消耗',
              value: calc.waterML < 1 ? `${calc.waterML.toFixed(3)} mL` : `${calc.waterML.toFixed(1)} mL`,
              sub: `≈ ${(calc.waterML / 30).toFixed(2)} 口水`,
              bgColor: 'rgba(59,130,246,0.08)',
              borderColor: 'rgba(59,130,246,0.2)',
            },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border"
              style={{ backgroundColor: stat.bgColor, borderColor: stat.borderColor }}>
              <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">{stat.value}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">选择模型</label>
          <div className="grid grid-cols-2 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
            {AI_MODELS.map(m => (
              <button key={m.id} onClick={() => setSelectedModel(m.id)}
                className={`px-3 py-2 rounded-lg text-xs text-left transition-all ${
                  selectedModel === m.id
                    ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={selectedModel === m.id ? {
                  backgroundColor: m.color + '18',
                  ringColor: m.color,
                } : undefined}>
                <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  {m.name}
                  {m.isMoE && <span className="text-[9px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-medium">MoE</span>}
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">{m.provider}</div>
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            <span className="text-amber-500">⚠</span> {model.notes}
            {model.activeParams && <span className="block mt-0.5 text-violet-500 dark:text-violet-400">激活参数: {model.activeParams}</span>}
          </div>
        </div>

        {/* Scenario + Region */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">使用场景</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_SCENARIOS.map(s => (
              <button key={s.label} onClick={() => handleTokenChange(s.tokens)}
                className={`px-3 py-2 rounded-lg text-xs text-left transition-all ${
                  tokenCount === s.tokens && !customTokens
                    ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                <span>{s.icon} {s.label}</span>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{s.description}</div>
              </button>
            ))}
          </div>

          {/* Custom tokens */}
          <div className="flex gap-2">
            <input type="number" placeholder="自定义 token 数"
              value={customTokens}
              onChange={e => {
                setCustomTokens(e.target.value);
                if (e.target.value) setTokenCount(parseInt(e.target.value) || 0);
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">数据中心区域（影响碳排放系数）</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CARBON_INTENSITY).map(([key, info]) => (
                <button key={key} onClick={() => setRegion(key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    region === key
                      ? 'text-white font-medium shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  style={region === key ? { backgroundColor: info.color } : undefined}>
                  {info.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              电网碳强度: {regionInfo.gCO2perKWh} gCO₂/kWh
            </div>
          </div>
        </div>
      </div>

      {/* Equivalents */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">等价物对比</h3>
          <label className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 cursor-pointer select-none">
            <input type="checkbox" checked={invertEquivalents} onChange={e => setInvertEquivalents(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500/50" />
            反转视角
          </label>
        </div>
        <EquivalentCards equivalents={EQUIVALENTS} co2Grams={calc.co2Grams} invertMode={invertEquivalents} />
        {invertEquivalents && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            &ldquo;反转视角&rdquo;告诉你：需要发多少次请求，才等于 1 个单位的日常活动碳排放
          </p>
        )}
      </div>

      {/* Model comparison */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          模型碳排放对比
          <span className="font-normal text-xs text-slate-400 dark:text-slate-500 ml-2">
            ({tokenCount.toLocaleString()} tokens · {regionInfo.label})
          </span>
        </h3>
        <BarChart data={modelComparison} maxValue={maxModelCO2} />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          <span className="text-violet-500">⚡</span> MoE = Mixture of Experts 架构，激活参数少，推理能效高
        </p>
      </div>

      {/* Global scale */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">全球视角</h3>
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
            <input type="checkbox" checked={globalScale} onChange={e => setGlobalScale(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500/50" />
            开启全球视角
          </label>
        </div>

        {globalScale ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">假设每天</span>
              <select value={dailyUsers} onChange={e => setDailyUsers(Number(e.target.value))}
                className="rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 border-0">
                <option value={1_000_000}>100 万人</option>
                <option value={10_000_000}>1000 万人</option>
                <option value={100_000_000}>1 亿人</option>
                <option value={1_000_000_000}>10 亿人</option>
              </select>
              <span className="text-slate-500 dark:text-slate-400">发送同样的请求</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: '年碳排放',
                  value: calc.yearlyGlobalCO2 < 1000
                    ? `${calc.yearlyGlobalCO2.toFixed(1)} 吨`
                    : `${(calc.yearlyGlobalCO2 / 1000).toFixed(1)} 千吨`,
                  sub: 'CO₂e',
                },
                {
                  label: '年用电量',
                  value: calc.yearlyGlobalKWh < 1_000_000
                    ? `${(calc.yearlyGlobalKWh / 1000).toFixed(0)} MWh`
                    : `${(calc.yearlyGlobalKWh / 1_000_000).toFixed(1)} GWh`,
                  sub: `≈ ${(calc.yearlyGlobalKWh / 3500).toFixed(0)} 户家庭年用电`,
                },
                {
                  label: '等效汽车',
                  value: (calc.yearlyGlobalCO2 / 4.6).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
                  sub: '辆汽车行驶一年',
                },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{item.value}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            如果全球每天有上亿人发送同样的请求，碳排放累积起来会怎样？打开看看。
          </p>
        )}
      </div>
    </div>
  );
}
