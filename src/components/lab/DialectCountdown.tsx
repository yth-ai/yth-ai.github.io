import { useState, useRef, useEffect, useMemo } from 'react';

// ======== 方言数据 ========
interface Dialect {
  name: string;
  region: string;
  speakers: number; // 万人
  trend: number; // 年下降率 %
  lat: number;
  lng: number;
  sample: string; // 示例短语
  standardEquiv: string; // 普通话对照
  status: 'safe' | 'vulnerable' | 'endangered' | 'critical';
  notes: string;
}

const DIALECTS: Dialect[] = [
  { name: '粤语', region: '广东、广西、港澳', speakers: 8000, trend: 0.5, lat: 23.1, lng: 113.2, sample: '你食咗饭未？', standardEquiv: '你吃了饭没有？', status: 'safe', notes: '虽使用人数多，但年轻一代使用意愿持续下降' },
  { name: '吴语', region: '上海、浙江、江苏南部', speakers: 7700, trend: 1.2, lat: 31.2, lng: 121.5, sample: '侬好伐？', standardEquiv: '你好吗？', status: 'vulnerable', notes: '上海话在年轻人中流失严重，郊区方言消亡更快' },
  { name: '闽南语', region: '福建、台湾、东南亚', speakers: 4800, trend: 0.8, lat: 24.5, lng: 118.1, sample: '汝好无？', standardEquiv: '你好吗？', status: 'vulnerable', notes: '台湾地区保存较好，大陆年轻人使用率快速下降' },
  { name: '客家话', region: '广东、福建、江西', speakers: 4200, trend: 1.5, lat: 24.8, lng: 116.1, sample: '你好冇？', standardEquiv: '你好吗？', status: 'endangered', notes: '客家年轻人多已转用普通话或粤语' },
  { name: '赣语', region: '江西', speakers: 4800, trend: 1.0, lat: 28.7, lng: 115.9, sample: '你恰了饭冒？', standardEquiv: '你吃了饭没？', status: 'vulnerable', notes: '城市化导致方言使用场景急剧减少' },
  { name: '湘语', region: '湖南', speakers: 3600, trend: 1.3, lat: 28.2, lng: 112.9, sample: '恰了饭冒？', standardEquiv: '吃了饭没？', status: 'vulnerable', notes: '长沙话影响力尚存，但农村方言快速消亡' },
  { name: '晋语', region: '山西、内蒙古', speakers: 6300, trend: 0.8, lat: 37.9, lng: 112.5, sample: '你歇了么？', standardEquiv: '你休息了吗？', status: 'vulnerable', notes: '入声保留是最大特征，年轻人正在失去' },
  { name: '徽语', region: '安徽南部', speakers: 460, trend: 2.0, lat: 29.7, lng: 118.3, sample: '你好𠲎？', standardEquiv: '你好吗？', status: 'endangered', notes: '分片极多，互不相通，且使用人口急剧减少' },
  { name: '平话', region: '广西', speakers: 380, trend: 2.5, lat: 22.8, lng: 108.3, sample: '你好啵？', standardEquiv: '你好吗？', status: 'critical', notes: '使用人口很少，年轻人几乎不会说' },
  { name: '温州话', region: '浙江温州', speakers: 600, trend: 1.8, lat: 28.0, lng: 120.7, sample: '尔好否？', standardEquiv: '你好吗？', status: 'endangered', notes: '曾被称为"最难懂的方言"，正面临断代危机' },
  { name: '潮汕话', region: '广东潮汕', speakers: 3400, trend: 1.0, lat: 23.4, lng: 116.7, sample: '汝食未？', standardEquiv: '你吃了没？', status: 'vulnerable', notes: '东南亚华侨社区有助于保存，但大陆年轻人使用减少' },
  { name: '东北话', region: '黑龙江、吉林、辽宁', speakers: 9800, trend: 0.3, lat: 45.8, lng: 126.5, sample: '你咋地了？', standardEquiv: '你怎么了？', status: 'safe', notes: '小品和短视频帮助了传播，但独特词汇仍在消失' },
  { name: '四川话', region: '四川、重庆', speakers: 12000, trend: 0.3, lat: 30.6, lng: 104.1, sample: '你在爪子？', standardEquiv: '你在干嘛？', status: 'safe', notes: '使用人口最多的方言之一，但城市年轻人"方言淡化"明显' },
  { name: '苏州话', region: '江苏苏州', speakers: 600, trend: 2.2, lat: 31.3, lng: 120.6, sample: '耐好𠲎？', standardEquiv: '你好吗？', status: 'endangered', notes: '曾经的"最动听方言"，现在小学生已基本不会' },
  { name: '藏语', region: '西藏、青海、四川', speakers: 600, trend: 1.5, lat: 29.6, lng: 91.1, sample: 'བཀྲ་ཤིས་བདེ་ལེགས།', standardEquiv: '扎西德勒/吉祥如意', status: 'endangered', notes: '藏区教育语言转换，很多年轻藏族已不能流利使用' },
  { name: '维吾尔语', region: '新疆', speakers: 1100, trend: 0.8, lat: 39.5, lng: 76.0, sample: 'ياخشىمۇسىز', standardEquiv: '你好', status: 'vulnerable', notes: '学校双语教育政策影响下一代语言选择' },
  { name: '蒙古语', region: '内蒙古', speakers: 420, trend: 1.8, lat: 40.8, lng: 111.7, sample: 'ᠰᠠᠢᠨ ᠪᠠᠢᠨ᠎ᠠ ᠤᠤ', standardEquiv: '你好', status: 'endangered', notes: '城市蒙古族青年多已转用普通话' },
];

// 计算消亡年份
function yearsToExtinction(speakers: number, trendPercent: number): number | null {
  if (trendPercent <= 0) return null;
  // 假设低于10万人时算"功能性消亡"
  const threshold = 10; // 万人
  if (speakers <= threshold) return 0;
  // 指数衰减: N(t) = N0 * (1 - r)^t
  const t = Math.log(threshold / speakers) / Math.log(1 - trendPercent / 100);
  return Math.ceil(t);
}

const statusColors = {
  safe: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: '#10b981', label: '相对安全' },
  vulnerable: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: '#f59e0b', label: '脆弱' },
  endangered: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: '#f97316', label: '濒危' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: '#ef4444', label: '极度濒危' },
};

export default function DialectCountdown() {
  const [selected, setSelected] = useState<Dialect | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 多样性指数
  const diversityData = useMemo(() => {
    // 模拟历史数据
    const years = [];
    for (let y = 1950; y <= 2060; y += 10) {
      const factor = y <= 2000 ? 1 - (y - 1950) * 0.003 : 1 - (2000 - 1950) * 0.003 - (y - 2000) * 0.008;
      years.push({ year: y, index: Math.max(0.1, factor) });
    }
    return years;
  }, []);

  // 绘制地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 中国地图范围 (大致)
    const minLat = 18, maxLat = 54, minLng = 72, maxLng = 136;
    const projX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * (w - 40) + 20;
    const projY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * (h - 40) + 20;

    // 背景
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // 简化中国轮廓
    ctx.fillStyle = 'rgba(30,41,59,0.6)';
    ctx.beginPath();
    const outline = [
      [49, 88], [53, 120], [48, 135], [42, 131], [39, 125], [38, 118],
      [35, 119], [32, 122], [30, 122], [27, 120], [24, 118], [22, 114],
      [21, 110], [22, 108], [22, 106], [18, 109], [21, 100], [24, 98],
      [28, 97], [29, 92], [27, 89], [35, 76], [37, 75], [40, 73],
      [45, 81], [48, 87],
    ];
    outline.forEach(([lat, lng], i) => {
      const x = projX(lng), y = projY(lat);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // 方言点
    DIALECTS.forEach((d) => {
      const x = projX(d.lng);
      const y = projY(d.lat);
      const color = statusColors[d.status].dot;
      const isSelected = selected?.name === d.name;

      // 使用范围圆
      const radius = Math.sqrt(d.speakers / 100) * 1.5;
      ctx.fillStyle = color + '30';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 中心点
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isSelected ? 15 : 5;
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 标签
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `${isSelected ? '12' : '10'}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(d.name, x, y - 8);
    });
  }, [selected]);

  return (
    <div className="space-y-6">
      {/* 地图 */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
        <canvas
          ref={canvasRef}
          className="w-full h-72 sm:h-96 cursor-pointer"
          style={{ display: 'block' }}
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const w = rect.width, h = rect.height;
            const minLat = 18, maxLat = 54, minLng = 72, maxLng = 136;

            let closest: Dialect | null = null;
            let minDist = Infinity;
            DIALECTS.forEach((d) => {
              const px = ((d.lng - minLng) / (maxLng - minLng)) * (w - 40) + 20;
              const py = ((maxLat - d.lat) / (maxLat - minLat)) * (h - 40) + 20;
              const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
              if (dist < 30 && dist < minDist) { minDist = dist; closest = d; }
            });
            setSelected(closest);
          }}
        />
      </div>

      {/* 选中的方言详情 */}
      {selected && (
        <div className={`rounded-xl border p-6 ${statusColors[selected.status].bg} border-current/20`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selected.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{selected.region}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[selected.status].text} ${statusColors[selected.status].bg}`}>
              {statusColors[selected.status].label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{selected.speakers.toLocaleString()} 万</div>
              <div className="text-xs text-slate-500">使用人口</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">-{selected.trend}%/年</div>
              <div className="text-xs text-slate-500">下降速度</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">
                {yearsToExtinction(selected.speakers, selected.trend)
                  ? `~${2026 + yearsToExtinction(selected.speakers, selected.trend)!}`
                  : '—'}
              </div>
              <div className="text-xs text-slate-500">预计功能性消亡</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-serif">{selected.sample}</div>
              <div className="text-xs text-slate-500">{selected.standardEquiv}</div>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">{selected.notes}</p>
        </div>
      )}

      {/* 倒计时列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">消亡倒计时</h3>
        <div className="space-y-2">
          {DIALECTS
            .filter((d) => d.trend > 0)
            .sort((a, b) => {
              const ya = yearsToExtinction(a.speakers, a.trend) ?? Infinity;
              const yb = yearsToExtinction(b.speakers, b.trend) ?? Infinity;
              return ya - yb;
            })
            .map((d) => {
              const extinctYear = yearsToExtinction(d.speakers, d.trend);
              const barWidth = extinctYear ? Math.min(100, (extinctYear / 500) * 100) : 100;

              return (
                <div
                  key={d.name}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selected?.name === d.name ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  onClick={() => setSelected(d)}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: statusColors[d.status].dot }} />
                  <div className="w-20 shrink-0 text-sm font-medium text-slate-900 dark:text-white">{d.name}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: statusColors[d.status].dot,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm">
                    {extinctYear ? (
                      <span className="text-slate-900 dark:text-white font-mono">
                        ~{2026 + extinctYear} 年
                      </span>
                    ) : (
                      <span className="text-slate-400">稳定</span>
                    )}
                  </div>
                  <div className="w-16 text-right text-xs text-slate-500">{d.speakers.toLocaleString()}万</div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 多样性指数 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">语言多样性指数 (模拟)</h3>
        <div className="flex items-end gap-1 h-32">
          {diversityData.map((d, i) => (
            <div key={d.year} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${d.index * 100}%`,
                  backgroundColor: d.year <= 2026
                    ? `hsl(${d.index * 120}, 70%, 50%)`
                    : 'rgba(148,163,184,0.3)',
                  borderStyle: d.year > 2026 ? 'dashed' : 'solid',
                  borderWidth: d.year > 2026 ? 1 : 0,
                  borderColor: 'rgba(148,163,184,0.5)',
                }}
              />
              <span className="text-[9px] text-slate-500">{d.year}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">虚线部分为趋势预测</p>
      </div>

      {/* 结语 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-8 text-center">
        <p className="text-slate-300 text-lg leading-relaxed italic">
          "一种语言消亡时，一种思维方式就永远消失了。"
        </p>
        <p className="text-slate-500 text-sm mt-3">
          中国有超过 130 种语言/方言，其中近半数面临不同程度的消亡威胁。<br />
          数据基于语言学研究的估算和趋势推测，仅供思考参考。
        </p>
      </div>
    </div>
  );
}
