import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// 「一句话画宇宙」—— 一句话展开成一个完整的数据叙事世界
// ============================================================

interface DataStory {
  id: string;
  oneLiner: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string;
  chapters: Chapter[];
}

interface Chapter {
  title: string;
  narrative: string;
  dataPoints: DataPoint[];
  insight: string;
  visualType: 'bar' | 'counter' | 'comparison' | 'pyramid' | 'flow' | 'scale';
}

interface DataPoint {
  label: string;
  value: number;
  unit: string;
  color?: string;
  sublabel?: string;
}

const STORIES: DataStory[] = [
  {
    id: 'internet-second',
    oneLiner: '互联网一秒钟发生了什么？',
    title: '一秒钟的互联网',
    subtitle: '你眨一次眼，这个世界已经发生了这些',
    icon: '⚡',
    color: '#3B82F6',
    gradient: 'from-blue-600 via-cyan-500 to-blue-400',
    chapters: [
      {
        title: '数据洪流',
        narrative: '每一秒，互联网产生的数据量超过了整个 2000 年之前人类文明积累的数据。这不是比喻——这是字面意思。',
        dataPoints: [
          { label: '电子邮件', value: 3400000, unit: '封', color: '#3B82F6' },
          { label: 'Google 搜索', value: 99000, unit: '次', color: '#10B981' },
          { label: '微信消息', value: 780000, unit: '条', color: '#84CC16' },
          { label: 'YouTube 上传', value: 500, unit: '小时视频', color: '#EF4444' },
          { label: 'Instagram 照片', value: 1400, unit: '张', color: '#D946EF' },
          { label: 'TikTok 观看', value: 167000, unit: '个视频', color: '#000' },
          { label: 'Spotify 歌曲', value: 4200, unit: '首被播放', color: '#22C55E' },
          { label: '在线交易', value: 120000, unit: '笔', color: '#F59E0B' },
        ],
        insight: '如果把一秒钟的数据刻在光盘上，叠起来的高度超过 5 个珠穆朗玛峰',
        visualType: 'bar',
      },
      {
        title: '比物理世界快多少',
        narrative: '这一秒钟的信息量，相当于物理世界多长时间的信息产出？',
        dataPoints: [
          { label: '340 万封邮件', value: 340, unit: '万', sublabel: '= 整个中国邮政一天的信件量', color: '#3B82F6' },
          { label: '500 小时视频', value: 500, unit: '小时', sublabel: '= 一个人不眠不休看 20 天', color: '#EF4444' },
          { label: '99000 次搜索', value: 99, unit: '千', sublabel: '= 图书管理员工作 2700 年', color: '#10B981' },
          { label: '12 万笔交易', value: 12, unit: '万', sublabel: '= 全球 ATM 机一周的交易量', color: '#F59E0B' },
        ],
        insight: '数字世界的一秒 ≈ 物理世界的 1000 年',
        visualType: 'comparison',
      },
      {
        title: '能量消耗',
        narrative: '支撑这一秒，需要消耗多少电力？全球数据中心此刻正在燃烧等量于一个中型城市的电力。',
        dataPoints: [
          { label: '全球数据中心功耗', value: 900, unit: 'GW·s', color: '#EF4444' },
          { label: '其中 AI 训练/推理', value: 150, unit: 'GW·s', color: '#8B5CF6' },
          { label: '比特币挖矿', value: 15, unit: 'GW·s', color: '#F59E0B' },
          { label: '海底光缆传输', value: 50, unit: 'GW·s', color: '#06B6D4' },
          { label: '你的手机', value: 0.005, unit: 'GW·s', color: '#84CC16' },
        ],
        insight: '支撑你这一秒的浏览，大约消耗了 0.3 度电——够给你手机充满 10 次',
        visualType: 'scale',
      },
    ],
  },
  {
    id: 'coffee-journey',
    oneLiner: '一杯咖啡走过多远？',
    title: '一杯咖啡的全球旅程',
    subtitle: '从埃塞俄比亚的泥土到你手中的杯子——28000 公里，14 个月，100 双手',
    icon: '☕',
    color: '#92400E',
    gradient: 'from-amber-800 via-amber-600 to-yellow-500',
    chapters: [
      {
        title: '种植与采摘',
        narrative: '一颗咖啡种子从种下到第一次结果需要 3-4 年。每颗咖啡樱桃只有两粒豆子，一杯咖啡需要约 70 颗樱桃——全部由人手一颗颗采摘。',
        dataPoints: [
          { label: '种子到结果', value: 3.5, unit: '年', color: '#22C55E' },
          { label: '每杯需要咖啡樱桃', value: 70, unit: '颗', color: '#EF4444' },
          { label: '每颗樱桃出豆', value: 2, unit: '粒', color: '#92400E' },
          { label: '采摘工人日薪', value: 3, unit: '美元', color: '#F59E0B' },
          { label: '年产量/棵树', value: 2, unit: 'kg', color: '#10B981' },
          { label: '海拔', value: 1800, unit: '米', color: '#6366F1' },
        ],
        insight: '你一杯 30 元的咖啡，种植者只拿到约 0.5 元',
        visualType: 'bar',
      },
      {
        title: '加工与运输',
        narrative: '采摘后的咖啡樱桃需要去皮、发酵、干燥、脱壳、分级。然后装进 60kg 的麻袋，坐上集装箱船，穿越印度洋和太平洋。',
        dataPoints: [
          { label: '产地到港口', value: 500, unit: 'km 卡车', color: '#F97316' },
          { label: '海运', value: 15000, unit: 'km', color: '#3B82F6' },
          { label: '港口到烘焙厂', value: 800, unit: 'km', color: '#EF4444' },
          { label: '烘焙厂到咖啡店', value: 200, unit: 'km', color: '#84CC16' },
          { label: '总行程', value: 28000, unit: 'km', color: '#000' },
          { label: '碳足迹', value: 0.21, unit: 'kg CO₂', color: '#6B7280' },
        ],
        insight: '一杯咖啡的旅程距离 = 绕赤道 70%',
        visualType: 'flow',
      },
      {
        title: '你手中的那一杯',
        narrative: '从泥土到杯子，这杯咖啡经过了至少 100 双手。但你只花 30 秒就喝完了它。',
        dataPoints: [
          { label: '涉及的人', value: 100, unit: '人+', color: '#92400E' },
          { label: '总时间跨度', value: 14, unit: '个月', color: '#6366F1' },
          { label: '你的零售价', value: 30, unit: '元', color: '#EF4444' },
          { label: '咖啡农收入', value: 0.5, unit: '元', color: '#F59E0B' },
          { label: '烘焙商', value: 3, unit: '元', color: '#F97316' },
          { label: '咖啡店利润', value: 18, unit: '元', color: '#10B981' },
        ],
        insight: '利润分配：咖啡农 1.7% vs 咖啡店 60%——全球化最真实的缩影',
        visualType: 'pyramid',
      },
    ],
  },
  {
    id: 'knowledge-compression',
    oneLiner: '如果把人类所有知识压缩',
    title: '人类知识的压缩史',
    subtitle: '从亚历山大图书馆到 GPT-5——知识的存储越来越小，理解越来越深',
    icon: '📚',
    color: '#7C3AED',
    gradient: 'from-violet-700 via-purple-500 to-fuchsia-400',
    chapters: [
      {
        title: '知识的物理体积',
        narrative: '人类积累了数千年的知识，但它的"物理尺寸"却在指数级缩小。同样的信息，从图书馆到芯片，体积缩小了 10 亿倍。',
        dataPoints: [
          { label: '亚历山大图书馆', value: 400000, unit: '卷', sublabel: '需要一栋大楼', color: '#92400E' },
          { label: '大英图书馆', value: 170000000, unit: '件', sublabel: '625 公里书架', color: '#EF4444' },
          { label: '维基百科全文', value: 22, unit: 'GB', sublabel: '一个 U 盘', color: '#3B82F6' },
          { label: '互联网归档', value: 100, unit: 'PB', sublabel: '一个数据中心', color: '#10B981' },
          { label: 'GPT-4 训练数据', value: 13, unit: 'T Token', sublabel: '几千张显卡', color: '#8B5CF6' },
          { label: 'GPT-4 模型权重', value: 1.8, unit: 'TB', sublabel: '两块硬盘', color: '#EC4899' },
        ],
        insight: '13 万亿 Token 的知识，"压缩"成 1.8TB 的模型权重——压缩比 7222:1',
        visualType: 'scale',
      },
      {
        title: '压缩的代价',
        narrative: '压缩不是免费的。把人类知识喂给模型，需要付出怎样的计算代价？',
        dataPoints: [
          { label: 'GPT-3 训练', value: 355, unit: 'GPU 年', color: '#10B981' },
          { label: 'GPT-4 训练', value: 8200, unit: 'GPU 年', color: '#3B82F6' },
          { label: 'GPT-5 训练(估)', value: 50000, unit: 'GPU 年', color: '#6366F1' },
          { label: '训练耗电', value: 50, unit: 'GWh', sublabel: '= 15000 个家庭一年用电', color: '#F59E0B' },
          { label: '训练费用(估)', value: 5, unit: '亿美元', color: '#EF4444' },
        ],
        insight: '训练 GPT-5 消耗的电量够一个小城市用一年——这是人类"理解自己"的代价',
        visualType: 'bar',
      },
      {
        title: '压缩的极限',
        narrative: '模型越来越大，训练数据也越来越多。但人类产生的高质量文本是有上限的。我们在接近"数据墙"。',
        dataPoints: [
          { label: '高质量英文文本', value: 9, unit: 'T Token', sublabel: '已接近用尽', color: '#EF4444' },
          { label: '高质量中文文本', value: 1.5, unit: 'T Token', sublabel: '严重不足', color: '#F97316' },
          { label: '高质量代码', value: 2, unit: 'T Token', sublabel: '增速放缓', color: '#3B82F6' },
          { label: 'GPT-5 需要', value: 20, unit: 'T Token', sublabel: '已超过总量', color: '#8B5CF6' },
          { label: '合成数据补缺', value: 50, unit: '%', sublabel: '2025 年趋势', color: '#10B981' },
        ],
        insight: '2026 年，模型训练的高质量自然数据可能耗尽——合成数据和数据效率成为关键',
        visualType: 'bar',
      },
    ],
  },
  {
    id: 'gpu-life',
    oneLiner: '一块 GPU 的一生',
    title: '一块 GPU 的一生',
    subtitle: '从台积电的无尘车间到电子垃圾场——一块 H100 的 5 年旅程',
    icon: '🔲',
    color: '#84CC16',
    gradient: 'from-green-600 via-lime-500 to-yellow-400',
    chapters: [
      {
        title: '诞生：台积电',
        narrative: '一块 H100 GPU 从一片 12 英寸硅晶圆开始。在台积电的无尘车间里，经过 1000+ 道工序，在 4nm 的尺度上雕刻出 800 亿个晶体管。',
        dataPoints: [
          { label: '晶体管数量', value: 80, unit: '十亿个', color: '#84CC16' },
          { label: '制程', value: 4, unit: 'nm', color: '#3B82F6' },
          { label: '工序数', value: 1000, unit: '道+', color: '#F59E0B' },
          { label: '制造时间', value: 3, unit: '个月', color: '#6366F1' },
          { label: '良品率', value: 50, unit: '%', sublabel: '约一半报废', color: '#EF4444' },
          { label: '裸芯面积', value: 814, unit: 'mm²', color: '#10B981' },
        ],
        insight: '800 亿个晶体管在指甲盖大的面积上——这是人类制造过的最精密的东西',
        visualType: 'bar',
      },
      {
        title: '工作：数据中心',
        narrative: '一块 H100 被安装在数据中心的服务器上。它会在 35°C 的环境中全天候运行，每秒执行近 2000 万亿次浮点运算。',
        dataPoints: [
          { label: 'FP16 算力', value: 1979, unit: 'TFLOPS', color: '#84CC16' },
          { label: '显存', value: 80, unit: 'GB HBM3', color: '#3B82F6' },
          { label: '功耗', value: 700, unit: '瓦', color: '#EF4444' },
          { label: '零售价', value: 40000, unit: '美元', color: '#F59E0B' },
          { label: '年电费', value: 5000, unit: '美元', color: '#F97316' },
          { label: '冷却成本', value: 1500, unit: '美元/年', color: '#06B6D4' },
        ],
        insight: '一块 H100 一年的电费 = 一个中国家庭两年的电费',
        visualType: 'bar',
      },
      {
        title: '归宿',
        narrative: '3-5 年后，当新一代芯片让它不再经济可行，它会被替换。幸运的话被回收提取稀有金属，不幸的话流入发展中国家的电子垃圾场。',
        dataPoints: [
          { label: '使用寿命', value: 4, unit: '年', color: '#84CC16' },
          { label: '一生处理数据', value: 500, unit: 'PB', color: '#3B82F6' },
          { label: '一生耗电', value: 24000, unit: 'kWh', color: '#EF4444' },
          { label: '一生碳排放', value: 12, unit: '吨 CO₂', color: '#6B7280' },
          { label: '可回收金属价值', value: 200, unit: '美元', color: '#F59E0B' },
          { label: '全球电子垃圾/年', value: 6200, unit: '万吨', color: '#EF4444' },
        ],
        insight: '它一生处理的数据够全人类看 5000 万年的电影——然后变成 200 美元的废金属',
        visualType: 'comparison',
      },
    ],
  },
  {
    id: 'china-population',
    oneLiner: '14 亿人意味着什么？',
    title: '14 亿人的维度',
    subtitle: '一个你以为理解、但从未真正感受过的数字',
    icon: '🧮',
    color: '#EF4444',
    gradient: 'from-red-600 via-rose-500 to-pink-400',
    chapters: [
      {
        title: '14 亿有多大',
        narrative: '14 亿是一个你说得出口、但大脑完全无法具象化的数字。让我们把它翻译成你能感受的东西。',
        dataPoints: [
          { label: '如果每人站 1m²', value: 1400, unit: 'km²', sublabel: '= 1.4 个香港', color: '#EF4444' },
          { label: '如果排成一队', value: 140, unit: '万 km', sublabel: '= 地球到月球 3.6 趟', color: '#3B82F6' },
          { label: '每秒数一个人', value: 44, unit: '年', sublabel: '不吃不喝不睡', color: '#F59E0B' },
          { label: '每人 1 元', value: 14, unit: '亿元', color: '#10B981' },
          { label: '每人 1 秒注视你', value: 44, unit: '年', sublabel: '你被看了一辈子', color: '#8B5CF6' },
          { label: '如果都在北京', value: 85000, unit: '人/km²', sublabel: '比现在密 4 倍', color: '#EC4899' },
        ],
        insight: '如果 14 亿人同时跺脚，产生的能量相当于 3.5 级地震',
        visualType: 'comparison',
      },
      {
        title: '14 亿人的日常',
        narrative: '这 14 亿人每天在做什么？这些数字每一秒都在更新。',
        dataPoints: [
          { label: '每天消耗大米', value: 39, unit: '万吨', color: '#F59E0B' },
          { label: '每天喝水', value: 28, unit: '亿升', color: '#3B82F6' },
          { label: '每天刷手机', value: 100, unit: '亿小时', color: '#6366F1' },
          { label: '每天外卖', value: 7000, unit: '万单', color: '#F97316' },
          { label: '每天新生儿', value: 27000, unit: '人', sublabel: '= 一个小镇', color: '#10B981' },
          { label: '每天去世', value: 29000, unit: '人', sublabel: '> 新生儿', color: '#6B7280' },
        ],
        insight: '中国每天出生 2.7 万人 vs 去世 2.9 万人——人口已经开始收缩',
        visualType: 'bar',
      },
      {
        title: '14 亿人的未来',
        narrative: '2100 年的中国可能只有 6-8 亿人。人口下降的速度超过所有人的预期。',
        dataPoints: [
          { label: '2026（现在）', value: 14.0, unit: '亿', color: '#EF4444' },
          { label: '2035（预测）', value: 13.2, unit: '亿', color: '#F97316' },
          { label: '2050（预测）', value: 11.5, unit: '亿', color: '#F59E0B' },
          { label: '2075（预测）', value: 9.0, unit: '亿', color: '#84CC16' },
          { label: '2100（预测）', value: 6.5, unit: '亿', color: '#3B82F6' },
          { label: '生育率', value: 1.0, unit: '', sublabel: '替代水平的一半', color: '#EF4444' },
        ],
        insight: '到 2100 年，中国人口可能减少一半——这意味着每两套房就有一套空着',
        visualType: 'pyramid',
      },
    ],
  },
];

export default function DataUniverse() {
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [revealedBars, setRevealedBars] = useState<Set<number>>(new Set());
  const [showInsight, setShowInsight] = useState(false);

  const story = STORIES.find(s => s.id === activeStory);

  const handleSelectStory = (id: string) => {
    setActiveStory(id);
    setActiveChapter(0);
    setRevealedBars(new Set());
    setShowInsight(false);
    // 逐步揭示数据
    const chapter = STORIES.find(s => s.id === id)?.chapters[0];
    if (chapter) {
      chapter.dataPoints.forEach((_, i) => {
        setTimeout(() => setRevealedBars(prev => new Set([...prev, i])), 200 + i * 150);
      });
      setTimeout(() => setShowInsight(true), 200 + chapter.dataPoints.length * 150 + 500);
    }
  };

  const handleChapterChange = (idx: number) => {
    setActiveChapter(idx);
    setRevealedBars(new Set());
    setShowInsight(false);
    const chapter = story?.chapters[idx];
    if (chapter) {
      chapter.dataPoints.forEach((_, i) => {
        setTimeout(() => setRevealedBars(prev => new Set([...prev, i])), 200 + i * 150);
      });
      setTimeout(() => setShowInsight(true), 200 + chapter.dataPoints.length * 150 + 500);
    }
  };

  // ===== 数据可视化渲染 =====
  const renderVisualization = (chapter: Chapter) => {
    const maxVal = Math.max(...chapter.dataPoints.map(d => d.value));
    return (
      <div className="space-y-3">
        {chapter.dataPoints.map((dp, i) => {
          const revealed = revealedBars.has(i);
          const pct = (dp.value / maxVal) * 100;
          return (
            <div key={i} className={`transition-all duration-500 ${revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/70 font-medium">{dp.label}</span>
                <span className="text-sm font-mono font-bold text-white">
                  {dp.value.toLocaleString()} <span className="text-white/40 text-xs">{dp.unit}</span>
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: revealed ? `${Math.max(2, pct)}%` : '0%',
                    backgroundColor: dp.color || story?.color || '#3B82F6',
                    transitionDelay: `${i * 100}ms`,
                  }} />
              </div>
              {dp.sublabel && (
                <p className="text-xs text-white/30 mt-0.5 ml-1">{dp.sublabel}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ===== 选择页面 =====
  if (!activeStory) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              一句话
            </h1>
            <h1 className="text-4xl md:text-6xl font-black text-white/90 mt-2 leading-tight">
              画整个宇宙
            </h1>
            <p className="text-white/40 mt-4 text-lg max-w-xl mx-auto">
              一句简单的话，展开成一个完整的数据叙事世界。<br />
              每个故事都有你从未想过的数字和洞察。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STORIES.map(s => (
              <button key={s.id} onClick={() => handleSelectStory(s.id)}
                className="group text-left p-6 rounded-2xl border border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className={`text-xl font-bold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent mb-2`}>
                  {s.oneLiner}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.subtitle}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                  <span>{s.chapters.length} 个章节</span>
                  <span>·</span>
                  <span>{s.chapters.reduce((sum, c) => sum + c.dataPoints.length, 0)} 个数据点</span>
                </div>
                <div className="mt-3 text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">
                  点击展开 →
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 text-center text-xs text-white/15">
            <p>每个故事都是一个完整的数据可视化叙事 · 数据来自公开来源</p>
            <p className="mt-1">5 个故事 · {STORIES.reduce((s, st) => s + st.chapters.length, 0)} 个章节 · {STORIES.reduce((s, st) => s + st.chapters.reduce((ss, c) => ss + c.dataPoints.length, 0), 0)} 个数据点 — 由 AI 一次生成</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== 故事页面 =====
  const chapter = story!.chapters[activeChapter];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-8">
        {/* 返回 + 标题 */}
        <div className="mb-8">
          <button onClick={() => setActiveStory(null)} className="text-sm text-white/30 hover:text-white/60 transition-colors mb-4">
            ← 返回故事列表
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{story!.icon}</span>
            <h1 className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${story!.gradient} bg-clip-text text-transparent`}>
              {story!.title}
            </h1>
          </div>
          <p className="text-white/40">{story!.subtitle}</p>
        </div>

        {/* 章节导航 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {story!.chapters.map((ch, i) => (
            <button key={i} onClick={() => handleChapterChange(i)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${activeChapter === i ? 'bg-white/15 text-white font-medium border border-white/15' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'}`}>
              {i + 1}. {ch.title}
            </button>
          ))}
        </div>

        {/* 叙事 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white/90 mb-3">{chapter.title}</h2>
          <p className="text-white/50 text-lg leading-relaxed">{chapter.narrative}</p>
        </div>

        {/* 数据可视化 */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 mb-8">
          {renderVisualization(chapter)}
        </div>

        {/* 洞察 */}
        <div className={`transition-all duration-700 ${showInsight ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className={`rounded-2xl p-6 border bg-gradient-to-r ${story!.gradient} bg-opacity-10`}
            style={{ borderColor: story!.color + '30', background: `linear-gradient(135deg, ${story!.color}15, ${story!.color}05)` }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="text-sm font-medium text-white/50 mb-1">核心洞察</h4>
                <p className="text-lg font-medium text-white/90 leading-relaxed">{chapter.insight}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 下一章 */}
        {activeChapter < story!.chapters.length - 1 && (
          <div className="mt-8 text-center">
            <button onClick={() => handleChapterChange(activeChapter + 1)}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all">
              下一章: {story!.chapters[activeChapter + 1].title} →
            </button>
          </div>
        )}

        {/* 结尾 */}
        {activeChapter === story!.chapters.length - 1 && (
          <div className="mt-8 text-center space-y-4">
            <p className="text-white/30 text-sm">— 故事结束 —</p>
            <button onClick={() => setActiveStory(null)}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all">
              看下一个故事 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
