import { useState, useRef, useEffect, useCallback } from 'react';

// ======== 天文计算 ========

// 儒略日计算
function toJulianDay(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

// 月相计算 (0=新月, 0.5=满月)
function getMoonPhase(year: number, month: number, day: number): number {
  const jd = toJulianDay(year, month, day);
  const daysSinceNew = jd - 2451550.1; // 2000-01-06 新月
  const synodicMonth = 29.530588853;
  const phase = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth;
  return phase / synodicMonth;
}

function getMoonPhaseName(phase: number): string {
  if (phase < 0.0625) return '新月';
  if (phase < 0.1875) return '蛾眉月';
  if (phase < 0.3125) return '上弦月';
  if (phase < 0.4375) return '盈凸月';
  if (phase < 0.5625) return '满月';
  if (phase < 0.6875) return '亏凸月';
  if (phase < 0.8125) return '下弦月';
  if (phase < 0.9375) return '残月';
  return '新月';
}

// 行星位置 (简化：用平均运动计算黄经)
interface PlanetInfo {
  name: string;
  symbol: string;
  color: string;
  period: number; // 轨道周期(地球年)
  distanceAU: number; // 平均日距(AU)
  epoch2000Lon: number; // J2000.0 黄经
}

const PLANETS: PlanetInfo[] = [
  { name: '水星', symbol: '☿', color: '#94a3b8', period: 0.2408467, distanceAU: 0.387, epoch2000Lon: 252.25 },
  { name: '金星', symbol: '♀', color: '#f59e0b', period: 0.61519726, distanceAU: 0.723, epoch2000Lon: 181.98 },
  { name: '地球', symbol: '⊕', color: '#3b82f6', period: 1.0000174, distanceAU: 1.0, epoch2000Lon: 100.46 },
  { name: '火星', symbol: '♂', color: '#ef4444', period: 1.8808158, distanceAU: 1.524, epoch2000Lon: 355.45 },
  { name: '木星', symbol: '♃', color: '#d97706', period: 11.862615, distanceAU: 5.203, epoch2000Lon: 34.40 },
  { name: '土星', symbol: '♄', color: '#a78bfa', period: 29.447498, distanceAU: 9.537, epoch2000Lon: 49.94 },
];

function getPlanetLongitude(planet: PlanetInfo, year: number, month: number, day: number): number {
  const jd = toJulianDay(year, month, day);
  const jd2000 = 2451545.0;
  const daysSince = jd - jd2000;
  const yearsSince = daysSince / 365.25;
  const lon = (planet.epoch2000Lon + (360 / planet.period) * yearsSince) % 360;
  return lon < 0 ? lon + 360 : lon;
}

// 88 个星座的亮星数据 (简化: 取最知名的50颗亮星)
interface Star {
  name: string; ra: number; dec: number; mag: number; constellation: string;
}

const BRIGHT_STARS: Star[] = [
  { name: '天狼星', ra: 101.29, dec: -16.72, mag: -1.46, constellation: '大犬座' },
  { name: '老人星', ra: 95.99, dec: -52.70, mag: -0.72, constellation: '船底座' },
  { name: '大角星', ra: 213.92, dec: 19.18, mag: -0.04, constellation: '牧夫座' },
  { name: '织女星', ra: 279.23, dec: 38.78, mag: 0.03, constellation: '天琴座' },
  { name: '五车二', ra: 79.17, dec: 46.00, mag: 0.08, constellation: '御夫座' },
  { name: '参宿七', ra: 78.63, dec: -8.20, mag: 0.12, constellation: '猎户座' },
  { name: '南河三', ra: 114.83, dec: 5.22, mag: 0.34, constellation: '小犬座' },
  { name: '水委一', ra: 24.43, dec: -57.24, mag: 0.46, constellation: '波江座' },
  { name: '参宿四', ra: 88.79, dec: 7.41, mag: 0.50, constellation: '猎户座' },
  { name: '马腹一', ra: 210.96, dec: -60.37, mag: 0.61, constellation: '半人马座' },
  { name: '牛郎星', ra: 297.70, dec: 8.87, mag: 0.77, constellation: '天鹰座' },
  { name: '十字架二', ra: 186.65, dec: -63.10, mag: 0.77, constellation: '南十字座' },
  { name: '毕宿五', ra: 68.98, dec: 16.51, mag: 0.85, constellation: '金牛座' },
  { name: '角宿一', ra: 201.30, dec: -11.16, mag: 0.97, constellation: '室女座' },
  { name: '心宿二', ra: 247.35, dec: -26.43, mag: 1.09, constellation: '天蝎座' },
  { name: '北落师门', ra: 344.41, dec: -29.62, mag: 1.16, constellation: '南鱼座' },
  { name: '北极星', ra: 37.95, dec: 89.26, mag: 1.98, constellation: '小熊座' },
  { name: '北河二', ra: 113.65, dec: 31.89, mag: 1.14, constellation: '双子座' },
  { name: '北河三', ra: 116.33, dec: 28.03, mag: 1.14, constellation: '双子座' },
  { name: '天津四', ra: 310.36, dec: 45.28, mag: 1.25, constellation: '天鹅座' },
  { name: '轩辕十四', ra: 152.09, dec: 11.97, mag: 1.35, constellation: '狮子座' },
  { name: '参宿五', ra: 81.28, dec: -1.94, mag: 1.70, constellation: '猎户座' },
  { name: '参宿一', ra: 83.00, dec: -0.30, mag: 1.70, constellation: '猎户座' },
  { name: '参宿二', ra: 83.86, dec: -2.40, mag: 1.77, constellation: '猎户座' },
];

// 恒星时计算 (简化)
function getLocalSiderealTime(jd: number, lonDeg: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + T * T * 0.000387933;
  gst = ((gst % 360) + 360) % 360;
  return ((gst + lonDeg) % 360 + 360) % 360;
}

// 距今光走了多远
function lightYearsTraveled(year: number, month: number, day: number): number {
  const now = new Date();
  const birth = new Date(year, month - 1, day);
  const diffMs = now.getTime() - birth.getTime();
  const years = diffMs / (365.25 * 24 * 3600 * 1000);
  return years; // 光年 = 年数 (光速走1年=1光年)
}

// 声波传播距离
function soundDistance(year: number, month: number, day: number): number {
  const now = new Date();
  const birth = new Date(year, month - 1, day);
  const diffSeconds = (now.getTime() - birth.getTime()) / 1000;
  return diffSeconds * 343; // 声速 343 m/s
}

export default function BirthdayUniverse() {
  const [birthStr, setBirthStr] = useState('');
  const [result, setResult] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const compute = useCallback(() => {
    if (!birthStr) return;
    const parts = birthStr.split('-').map(Number);
    if (parts.length !== 3) return;
    const [year, month, day] = parts;
    if (!year || !month || !day) return;

    const moonPhase = getMoonPhase(year, month, day);
    const moonPhaseName = getMoonPhaseName(moonPhase);

    // 行星位置
    const planetPositions = PLANETS.map((p) => ({
      ...p,
      longitude: getPlanetLongitude(p, year, month, day),
    }));

    // 地球黄经
    const earthLon = planetPositions.find((p) => p.name === '地球')!.longitude;

    // 距离地球最近的行星（除地球外）
    const otherPlanets = planetPositions.filter((p) => p.name !== '地球');
    // 简化：根据黄经差异估算距离
    let closestPlanet = otherPlanets[0];
    let minDist = Infinity;
    otherPlanets.forEach((p) => {
      // 简化距离计算：用轨道半径和角度差
      const angleDiff = Math.abs(p.longitude - earthLon);
      const angleRad = (Math.min(angleDiff, 360 - angleDiff) * Math.PI) / 180;
      const dist = Math.sqrt(1 + p.distanceAU * p.distanceAU - 2 * p.distanceAU * Math.cos(angleRad));
      if (dist < minDist) {
        minDist = dist;
        closestPlanet = p;
      }
    });

    const lightYears = lightYearsTraveled(year, month, day);
    const soundDist = soundDistance(year, month, day);
    const soundDistKm = soundDist / 1000;

    // 确定星座（太阳所在的黄道星座）
    const sunLon = (earthLon + 180) % 360;
    const zodiacSigns = [
      '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
      '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座',
    ];
    const zodiacIndex = Math.floor(sunLon / 30);
    const zodiac = zodiacSigns[zodiacIndex];

    // 生成诗意总结
    const summaries = [
      `你出生那天是${moonPhaseName}之夜，${closestPlanet.name}是离你最近的行星邻居。`,
      `那一刻，太阳正穿过${zodiac}的疆域。`,
    ];
    if (moonPhaseName === '满月') {
      summaries.push('满月的夜晚出生——传说这样的孩子注定不平凡。');
    }
    if (closestPlanet.name === '金星') {
      summaries.push('离你最近的是金星，爱与美的象征。');
    } else if (closestPlanet.name === '火星') {
      summaries.push('火星守护着你出生的夜空，勇气和行动力的化身。');
    } else if (closestPlanet.name === '木星') {
      summaries.push('木星在你头顶——幸运之星。');
    }

    setResult({
      year, month, day, moonPhase, moonPhaseName,
      planetPositions, closestPlanet, minDist,
      lightYears, soundDist, soundDistKm,
      zodiac, summaries,
    });
  }, [birthStr]);

  // 星空 Canvas
  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 深空背景
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#020617');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 随机星背景
    const jd = toJulianDay(result.year, result.month, result.day);
    let seed = Math.floor(jd);
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    for (let i = 0; i < 200; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = rng() * 1.5;
      const alpha = 0.3 + rng() * 0.7;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制亮星
    const lst = getLocalSiderealTime(jd, 116.4); // 北京经度
    const lat = 39.9; // 北京纬度

    BRIGHT_STARS.forEach((star) => {
      // 简化：将 RA/Dec 投影到画布
      const ha = ((lst - star.ra + 360) % 360);
      const haRad = (ha * Math.PI) / 180;
      const decRad = (star.dec * Math.PI) / 180;
      const latRad = (lat * Math.PI) / 180;

      const alt = Math.asin(Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad));
      if (alt < 0) return; // 地平线以下

      const az = Math.atan2(
        -Math.cos(decRad) * Math.sin(haRad),
        Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad),
      );

      // 立体投影
      const r = (Math.PI / 2 - alt) / (Math.PI / 2);
      const x = w / 2 + r * Math.sin(az) * (w * 0.45);
      const y = h / 2 - r * Math.cos(az) * (h * 0.45);

      if (x < 0 || x > w || y < 0 || y > h) return;

      const size = Math.max(1, 3 - star.mag);
      const alpha = Math.min(1, Math.max(0.3, 1 - star.mag / 3));

      ctx.fillStyle = `rgba(255,255,240,${alpha})`;
      ctx.shadowColor = 'rgba(255,255,240,0.5)';
      ctx.shadowBlur = size * 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 标注名字 (仅最亮的)
      if (star.mag < 0.5) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(star.name, x, y - size - 4);
      }
    });

    // 月亮
    const moonX = w * 0.8;
    const moonY = h * 0.2;
    const moonR = 20;

    ctx.fillStyle = '#fef3c7';
    ctx.shadowColor = '#fef3c7';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 月相遮罩
    const phase = result.moonPhase;
    if (phase < 0.5) {
      // 新月到满月：从右侧开始显示
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR + 1, 0, Math.PI * 2);
      // 画一个椭圆遮罩
      const maskOffset = moonR * 2 * (0.5 - phase);
      ctx.ellipse(moonX + maskOffset * 0.8, moonY, moonR * Math.abs(1 - phase * 2), moonR, 0, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
    }

    // 月相标签
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(result.moonPhaseName, moonX, moonY + moonR + 16);

    // 底部地平线
    const horizGrad = ctx.createLinearGradient(0, h - 40, 0, h);
    horizGrad.addColorStop(0, 'transparent');
    horizGrad.addColorStop(1, 'rgba(30,41,59,0.8)');
    ctx.fillStyle = horizGrad;
    ctx.fillRect(0, h - 40, w, 40);

  }, [result]);

  // 月相 SVG
  const renderMoonIcon = (phase: number) => {
    const illumination = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    return (
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-slate-700" />
        <div
          className="absolute inset-0 rounded-full bg-amber-100"
          style={{
            clipPath: phase < 0.5
              ? `inset(0 ${(1 - illumination) * 100}% 0 0)`
              : `inset(0 0 0 ${(1 - illumination) * 100}%)`,
          }}
        />
      </div>
    );
  };

  const formatNumber = (n: number) => {
    if (n > 1e9) return `${(n / 1e9).toFixed(1)} 十亿`;
    if (n > 1e6) return `${(n / 1e6).toFixed(1)} 百万`;
    if (n > 1e3) return `${(n / 1e3).toFixed(1)} 千`;
    return n.toFixed(0);
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
              min="1920-01-01"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={compute}
            disabled={!birthStr}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25"
          >
            探索那天的宇宙
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* 星空 */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
            <canvas
              ref={canvasRef}
              className="w-full h-80"
              style={{ display: 'block' }}
            />
            <div className="px-6 py-3 text-center text-sm text-slate-400">
              {result.year} 年 {result.month} 月 {result.day} 日 · 北京上空的星空（简化模拟）
            </div>
          </div>

          {/* 信息卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 月相 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="flex justify-center mb-3">{renderMoonIcon(result.moonPhase)}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{result.moonPhaseName}</h3>
              <p className="text-sm text-slate-500 mt-1">那天的月亮</p>
            </div>

            {/* 最近行星 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-4xl mb-2">{result.closestPlanet.symbol}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{result.closestPlanet.name}</h3>
              <p className="text-sm text-slate-500 mt-1">离地球最近的行星</p>
              <p className="text-xs text-slate-400 mt-1">约 {(result.minDist * 149.6).toFixed(0)} 百万公里</p>
            </div>

            {/* 星座 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-4xl mb-2">⭐</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{result.zodiac}</h3>
              <p className="text-sm text-slate-500 mt-1">太阳所在星座</p>
            </div>

            {/* 光传播距离 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-indigo-500 mb-1">{result.lightYears.toFixed(2)}</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">光年</h3>
              <p className="text-xs text-slate-500 mt-1">你出生那一刻的光，现在已经飞到了这么远</p>
            </div>

            {/* 声波传播距离 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-emerald-500 mb-1">{formatNumber(result.soundDistKm)} km</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">声波距离</h3>
              <p className="text-xs text-slate-500 mt-1">你的第一声啼哭，声波现在传到了这么远</p>
            </div>

            {/* 太阳系俯视图 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
              <div className="text-3xl font-bold text-amber-500 mb-1">{result.year}</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{result.month}月{result.day}日</h3>
              <p className="text-xs text-slate-500 mt-1">宇宙中独一无二的一天</p>
            </div>
          </div>

          {/* 诗意总结 */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-8 text-center">
            {result.summaries.map((s: string, i: number) => (
              <p key={i} className="text-lg text-slate-700 dark:text-slate-200 mb-2 last:mb-0">
                {s}
              </p>
            ))}
          </div>

          {/* 行星位置表 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">那天的行星位置（黄经）</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {result.planetPositions.map((p: any) => (
                <div key={p.name} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="text-2xl" style={{ color: p.color }}>{p.symbol}</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">{p.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{p.longitude.toFixed(1)}°</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        <p>天文数据基于简化天文算法，月相和行星位置为近似计算，仅供趣味参考</p>
      </div>
    </div>
  );
}
