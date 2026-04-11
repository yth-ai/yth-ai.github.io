import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DayActivity } from './types';
import { AI_MODELS, TASK_TYPES, CARBON_INTENSITY, WATER_PER_KWH, DAY_PRESETS, EQUIVALENTS } from './data';

let activityIdCounter = 0;
function nextId() { return `act-${++activityIdCounter}`; }

export default function MyAIDayTab() {
  const [region, setRegion] = useState('us');
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const regionInfo = CARBON_INTENSITY[region];

  // Load preset
  const loadPreset = useCallback((presetKey: string) => {
    const preset = DAY_PRESETS[presetKey];
    if (!preset) return;
    setActivePreset(presetKey);
    setActivities(preset.activities.map(a => ({ ...a, id: nextId() })));
  }, []);

  // Load default preset on mount
  useEffect(() => {
    if (activities.length === 0) loadPreset('moderate');
  }, []);

  const addActivity = useCallback(() => {
    setActivities(prev => [...prev, {
      id: nextId(),
      taskTypeId: 'chat',
      modelId: 'gpt4o',
      quantity: 10,
      label: '新活动',
    }]);
    setActivePreset(null);
  }, []);

  const removeActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    setActivePreset(null);
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<DayActivity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    setActivePreset(null);
  }, []);

  // Compute daily / monthly / yearly totals
  const totals = useMemo(() => {
    let dailyCO2 = 0;
    let dailyKWh = 0;
    let dailyWaterML = 0;

    const breakdown = activities.map(act => {
      const task = TASK_TYPES.find(t => t.id === act.taskTypeId);
      const model = AI_MODELS.find(m => m.id === act.modelId);
      if (!task || !model) return { ...act, co2: 0, kwh: 0, water: 0 };

      const totalTokens = task.tokensEquivalent * act.quantity;
      const kwh = (totalTokens / 1_000_000) * model.energyPerMToken;
      const co2 = kwh * regionInfo.gCO2perKWh;
      const water = kwh * WATER_PER_KWH * 1000;

      dailyCO2 += co2;
      dailyKWh += kwh;
      dailyWaterML += water;

      return { ...act, co2, kwh, water, modelName: model.name, taskLabel: task.label };
    });

    const monthlyCO2 = dailyCO2 * 30;
    const yearlyCO2 = dailyCO2 * 365;

    // Comparisons for yearly scale
    const yearlyKgCO2 = yearlyCO2 / 1000;
    const carKm = yearlyCO2 / 0.21; // gCO2/meter → meters → km
    const flights = yearlyKgCO2 / 250; // ~250kg CO2 per Beijing-Shanghai flight
    const netflix = yearlyCO2 / (36 * 0.03 * regionInfo.gCO2perKWh); // ~36Wh per hour streaming
    const coffees = yearlyCO2 / 21; // 21g CO2 per cup

    return {
      breakdown,
      daily: { co2: dailyCO2, kwh: dailyKWh, water: dailyWaterML },
      monthly: { co2: monthlyCO2 },
      yearly: { co2: yearlyCO2, kgCO2: yearlyKgCO2 },
      comparisons: { carKm: carKm / 1000, flights, netflix, coffees },
    };
  }, [activities, regionInfo]);

  // Background gradient based on intensity — clean blue-green to warm orange-red
  const bgIntensity = Math.min(totals.daily.co2 / 50, 1); // 50g CO2/day = max warm
  const bgHue = 180 - bgIntensity * 160; // 180 (teal) → 20 (warm)
  const bgSat = 30 + bgIntensity * 30;
  const bgLight = 97 - bgIntensity * 4; // very subtle
  const bgLightDark = 8 + bgIntensity * 3;

  return (
    <div className="space-y-6 transition-colors duration-1000 rounded-2xl p-1 -m-1"
      style={{
        background: `linear-gradient(135deg, hsl(${bgHue}, ${bgSat}%, ${bgLight}%) 0%, hsl(${bgHue - 20}, ${bgSat - 10}%, ${bgLight + 1}%) 100%)`,
      }}>

      {/* Dark mode overlay */}
      <div className="hidden dark:block absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-1000"
        style={{
          background: `linear-gradient(135deg, hsl(${bgHue}, ${bgSat * 0.3}%, ${bgLightDark}%) 0%, hsl(${bgHue - 20}, ${bgSat * 0.2}%, ${bgLightDark - 1}%) 100%)`,
        }} />

      {/* Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">选择画像 或 自定义</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DAY_PRESETS).map(([key, preset]) => (
            <button key={key} onClick={() => loadPreset(key)}
              className={`px-3 py-2 rounded-lg text-xs transition-all ${
                activePreset === key
                  ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 font-medium'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}>
              <div className="font-medium">{preset.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Region selector */}
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">数据中心区域</label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CARBON_INTENSITY).map(([key, info]) => (
            <button key={key} onClick={() => setRegion(key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                region === key
                  ? 'text-white font-medium shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
              }`}
              style={region === key ? { backgroundColor: info.color } : undefined}>
              {info.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">我的一天</label>
          <button onClick={addActivity}
            className="text-xs px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
            + 添加活动
          </button>
        </div>

        <div className="space-y-2">
          {activities.map(act => {
            const task = TASK_TYPES.find(t => t.id === act.taskTypeId);
            const model = AI_MODELS.find(m => m.id === act.modelId);
            const bd = totals.breakdown.find(b => b.id === act.id);
            return (
              <div key={act.id} className="flex items-center gap-2 p-3 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {/* Task type */}
                <select value={act.taskTypeId}
                  onChange={e => updateActivity(act.id, { taskTypeId: e.target.value })}
                  className="text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-slate-700 dark:text-slate-300 w-24">
                  {TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>

                {/* Quantity */}
                <div className="flex items-center gap-1">
                  <input type="number" min={1} max={200} value={act.quantity}
                    onChange={e => updateActivity(act.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-14 text-center text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-1.5 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs text-slate-400 dark:text-slate-500">次</span>
                </div>

                {/* Model */}
                <select value={act.modelId}
                  onChange={e => updateActivity(act.id, { modelId: e.target.value })}
                  className="text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-slate-700 dark:text-slate-300 flex-1 min-w-0">
                  {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>

                {/* CO2 badge */}
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 w-20 text-right shrink-0">
                  {bd && bd.co2 < 1 ? `${(bd.co2 * 1000).toFixed(0)} mg` : bd ? `${bd.co2.toFixed(2)} g` : '-'}
                </div>

                {/* Delete */}
                <button onClick={() => removeActivity(act.id)}
                  className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals dashboard */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400">每天</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totals.daily.co2 < 1 ? `${(totals.daily.co2 * 1000).toFixed(0)} mg` : `${totals.daily.co2.toFixed(1)} g`}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">CO₂e</div>
        </div>
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400">每月</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totals.monthly.co2 < 1000 ? `${totals.monthly.co2.toFixed(0)} g` : `${(totals.monthly.co2 / 1000).toFixed(2)} kg`}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">CO₂e</div>
        </div>
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400">每年</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totals.yearly.kgCO2 < 1 ? `${totals.yearly.co2.toFixed(0)} g` : `${totals.yearly.kgCO2.toFixed(1)} kg`}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">CO₂e</div>
        </div>
      </div>

      {/* Yearly comparisons */}
      <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">你的年度 AI 碳排放相当于...</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🚗', value: `${totals.comparisons.carKm.toFixed(1)} km`, label: '汽车行驶' },
            { icon: '✈️', value: totals.comparisons.flights < 0.01 ? `${(totals.comparisons.flights * 100).toFixed(1)}%` : `${totals.comparisons.flights.toFixed(2)} 次`, label: '京沪航班' },
            { icon: '📺', value: `${totals.comparisons.netflix.toFixed(0)} 小时`, label: '流媒体观看' },
            { icon: '☕', value: `${totals.comparisons.coffees.toFixed(0)} 杯`, label: '咖啡' },
          ].map((item, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{item.value}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Switch model savings */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
        <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
          如果全部换成最省的模型...
        </h3>
        <SavingsCalculator activities={activities} regionInfo={regionInfo} />
      </div>
    </div>
  );
}

// Sub-component: show savings if switching all to the most efficient model
function SavingsCalculator({ activities, regionInfo }: { activities: DayActivity[]; regionInfo: { gCO2perKWh: number } }) {
  const result = useMemo(() => {
    // Find the most efficient model
    const minModel = AI_MODELS.reduce((best, m) => m.energyPerMToken < best.energyPerMToken ? m : best);

    let currentYearlyCO2 = 0;
    let efficientYearlyCO2 = 0;

    for (const act of activities) {
      const task = TASK_TYPES.find(t => t.id === act.taskTypeId);
      const model = AI_MODELS.find(m => m.id === act.modelId);
      if (!task || !model) continue;

      const totalTokens = task.tokensEquivalent * act.quantity;
      const currentKwh = (totalTokens / 1_000_000) * model.energyPerMToken;
      const efficientKwh = (totalTokens / 1_000_000) * minModel.energyPerMToken;

      currentYearlyCO2 += currentKwh * regionInfo.gCO2perKWh * 365;
      efficientYearlyCO2 += efficientKwh * regionInfo.gCO2perKWh * 365;
    }

    const savedCO2 = currentYearlyCO2 - efficientYearlyCO2;
    const savedPercent = currentYearlyCO2 > 0 ? (savedCO2 / currentYearlyCO2) * 100 : 0;

    return { minModel, savedCO2, savedPercent, currentYearlyCO2, efficientYearlyCO2 };
  }, [activities, regionInfo]);

  if (result.savedCO2 <= 0) {
    return <p className="text-xs text-green-600 dark:text-green-400">你已经在使用最高效的模型了。</p>;
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex-1">
        <p className="text-green-700 dark:text-green-300">
          全部切换到 <strong>{result.minModel.name}</strong>，一年可以省下{' '}
          <span className="font-bold font-mono text-base text-green-800 dark:text-green-200">
            {result.savedCO2 < 1000 ? `${result.savedCO2.toFixed(0)} g` : `${(result.savedCO2 / 1000).toFixed(1)} kg`}
          </span>{' '}
          CO₂ ({result.savedPercent.toFixed(0)}%)
        </p>
        <p className="text-green-600 dark:text-green-500 mt-1">
          相当于少开 {(result.savedCO2 / 0.21 / 1000000).toFixed(1)} 公里车，或少喝 {(result.savedCO2 / 21).toFixed(0)} 杯咖啡
        </p>
      </div>
    </div>
  );
}
