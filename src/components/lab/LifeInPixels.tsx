import { useState, useMemo } from 'react';

// ======== 人生像素 ========
const TOTAL_YEARS = 80;
const WEEKS_PER_YEAR = 52;
const TOTAL_WEEKS = TOTAL_YEARS * WEEKS_PER_YEAR; // 4160

// 人生阶段
interface LifeStage {
  name: string;
  startAge: number;
  endAge: number;
  color: string;
  bgClass: string;
}

const LIFE_STAGES: LifeStage[] = [
  { name: '婴幼儿', startAge: 0, endAge: 3, color: '#fbbf24', bgClass: 'bg-amber-400' },
  { name: '童年', startAge: 3, endAge: 6, color: '#fb923c', bgClass: 'bg-orange-400' },
  { name: '小学', startAge: 6, endAge: 12, color: '#34d399', bgClass: 'bg-emerald-400' },
  { name: '中学', startAge: 12, endAge: 18, color: '#60a5fa', bgClass: 'bg-blue-400' },
  { name: '大学', startAge: 18, endAge: 22, color: '#818cf8', bgClass: 'bg-indigo-400' },
  { name: '青年工作', startAge: 22, endAge: 35, color: '#a78bfa', bgClass: 'bg-violet-400' },
  { name: '中年', startAge: 35, endAge: 55, color: '#f472b6', bgClass: 'bg-pink-400' },
  { name: '中晚年', startAge: 55, endAge: 65, color: '#fb7185', bgClass: 'bg-rose-400' },
  { name: '退休', startAge: 65, endAge: 80, color: '#94a3b8', bgClass: 'bg-slate-400' },
];

function getStageForWeek(weekNum: number): LifeStage {
  const age = weekNum / WEEKS_PER_YEAR;
  for (const stage of LIFE_STAGES) {
    if (age >= stage.startAge && age < stage.endAge) return stage;
  }
  return LIFE_STAGES[LIFE_STAGES.length - 1];
}

function weekToDate(birthDate: Date, weekNum: number): Date {
  const d = new Date(birthDate);
  d.setDate(d.getDate() + weekNum * 7);
  return d;
}

function getWeeksSinceBirth(birthDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
  return Math.floor(diffMs / (7 * 24 * 3600 * 1000));
}

export default function LifeInPixels() {
  const [birthStr, setBirthStr] = useState('');
  const [hoveredWeek, setHoveredWeek] = useState(-1);
  const [milestones, setMilestones] = useState<{ week: number; label: string }[]>([]);
  const [newMilestone, setNewMilestone] = useState('');

  const birthDate = useMemo(() => {
    if (!birthStr) return null;
    return new Date(birthStr);
  }, [birthStr]);

  const weeksPassed = useMemo(() => {
    if (!birthDate) return 0;
    return Math.min(getWeeksSinceBirth(birthDate), TOTAL_WEEKS);
  }, [birthDate]);

  const stats = useMemo(() => {
    if (!birthDate) return null;
    const now = new Date();
    const ageMs = now.getTime() - birthDate.getTime();
    const ageYears = ageMs / (365.25 * 24 * 3600 * 1000);
    const weekendsPassed = Math.floor(weeksPassed);
    const percentUsed = (weeksPassed / TOTAL_WEEKS * 100);
    const sleepWeeks = Math.floor(weeksPassed / 3); // 人生1/3在睡觉
    const workWeeks = Math.floor(Math.max(0, Math.min(ageYears, 65) - 22) * 50); // 工作约50周/年
    const remainingWeekends = TOTAL_WEEKS - weeksPassed;

    return {
      ageYears: ageYears.toFixed(1),
      weekendsPassed,
      percentUsed: percentUsed.toFixed(1),
      sleepWeeks,
      workWeeks,
      remainingWeekends,
    };
  }, [birthDate, weeksPassed]);

  const hoveredInfo = useMemo(() => {
    if (hoveredWeek < 0 || !birthDate) return null;
    const date = weekToDate(birthDate, hoveredWeek);
    const age = hoveredWeek / WEEKS_PER_YEAR;
    const stage = getStageForWeek(hoveredWeek);
    const isPast = hoveredWeek < weeksPassed;
    const milestone = milestones.find((m) => m.week === hoveredWeek);

    return {
      weekNum: hoveredWeek + 1,
      date: `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`,
      age: age.toFixed(1),
      stage: stage.name,
      isPast,
      milestone: milestone?.label,
    };
  }, [hoveredWeek, birthDate, weeksPassed, milestones]);

  const addMilestone = () => {
    if (!newMilestone.trim() || hoveredWeek < 0) return;
    setMilestones((prev) => [...prev.filter((m) => m.week !== hoveredWeek), { week: hoveredWeek, label: newMilestone.trim() }]);
    setNewMilestone('');
  };

  // 按年分组渲染像素
  const renderGrid = () => {
    const years = [];
    for (let y = 0; y < TOTAL_YEARS; y++) {
      const weeks = [];
      for (let w = 0; w < WEEKS_PER_YEAR; w++) {
        const weekNum = y * WEEKS_PER_YEAR + w;
        const isPast = weekNum < weeksPassed;
        const isCurrent = weekNum === weeksPassed;
        const stage = getStageForWeek(weekNum);
        const hasMilestone = milestones.some((m) => m.week === weekNum);

        weeks.push(
          <div
            key={w}
            className={`w-[6px] h-[6px] sm:w-2 sm:h-2 rounded-[1px] cursor-pointer transition-all duration-100 ${
              isCurrent ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''
            }`}
            style={{
              backgroundColor: isPast
                ? stage.color
                : isCurrent
                  ? '#ffffff'
                  : 'rgba(51,65,85,0.3)',
              opacity: isPast ? 0.8 : 0.3,
              transform: hoveredWeek === weekNum ? 'scale(2)' : hasMilestone ? 'scale(1.5)' : 'scale(1)',
              boxShadow: hasMilestone ? `0 0 4px ${stage.color}` : 'none',
            }}
            onMouseEnter={() => setHoveredWeek(weekNum)}
            onMouseLeave={() => setHoveredWeek(-1)}
            title={`第 ${weekNum + 1} 周`}
          />
        );
      }

      years.push(
        <div key={y} className="flex items-center gap-0">
          {y % 5 === 0 && (
            <span className="w-6 text-right text-[9px] text-slate-500 mr-1 shrink-0">{y}</span>
          )}
          {y % 5 !== 0 && <span className="w-6 mr-1 shrink-0" />}
          <div className="flex gap-[1px] sm:gap-[2px] flex-wrap">{weeks}</div>
        </div>
      );
    }
    return years;
  };

  return (
    <div className="space-y-6">
      {/* 输入 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">你的生日</label>
            <input
              type="date"
              value={birthStr}
              onChange={(e) => setBirthStr(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min="1940-01-01"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          {birthDate && stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.percentUsed}%</div>
              <div className="text-xs text-slate-500">已经走过</div>
            </div>
          )}
        </div>
      </div>

      {birthDate && stats && (
        <>
          {/* 统计 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{stats.weekendsPassed.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">已度过的周数</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.remainingWeekends.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">剩余的周数</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-indigo-500">{stats.sleepWeeks.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">花在睡觉上的周数</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-pink-500">{stats.workWeeks.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">花在工作上的周数</div>
            </div>
          </div>

          {/* 悬停信息 */}
          {hoveredInfo && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-slate-500">第 </span>
                  <span className="font-bold text-slate-900 dark:text-white">{hoveredInfo.weekNum}</span>
                  <span className="text-slate-500"> 周</span>
                </div>
                <div className="text-sm text-slate-500">{hoveredInfo.date}</div>
                <div className="text-sm text-slate-500">约 {hoveredInfo.age} 岁</div>
                <div className="text-sm font-medium" style={{ color: getStageForWeek(hoveredWeek).color }}>
                  {hoveredInfo.stage}
                </div>
                {hoveredInfo.milestone && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                    {hoveredInfo.milestone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
                  placeholder="添加里程碑..."
                  className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
            </div>
          )}

          {/* 像素网格 */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 sm:p-6 overflow-x-auto">
            <div className="space-y-[1px] sm:space-y-[2px] min-w-[400px]">
              {renderGrid()}
            </div>
          </div>

          {/* 图例 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {LIFE_STAGES.map((stage) => (
                <div key={stage.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {stage.name} ({stage.startAge}-{stage.endAge}岁)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 触动人心的结尾 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-8 text-center">
            <p className="text-slate-300 text-lg leading-relaxed">
              假设活到 80 岁，你的人生总共有 <strong className="text-white">{TOTAL_WEEKS.toLocaleString()}</strong> 个周。
            </p>
            <p className="text-slate-400 text-sm mt-3">
              每一个小格子都是一周。已经灰去的，再也回不来。还亮着的，就是你全部的可能性。
            </p>
          </div>
        </>
      )}

      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        <p>灵感来自 Tim Urban 的 "Your Life in Weeks" · 鼠标悬停查看每个像素代表的时间</p>
      </div>
    </div>
  );
}
