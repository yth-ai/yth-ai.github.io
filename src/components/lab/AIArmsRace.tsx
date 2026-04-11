import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============================================================
// 「全球 AI 军备竞赛」—— 战情室级态势感知仪表盘
// ============================================================

interface OrgData {
  id: string;
  name: string;
  nameZh: string;
  country: string;
  type: 'company' | 'lab' | 'startup';
  founded: number;
  valuation: number; // 十亿美元
  employees: number;
  gpuCount: number; // 估算 GPU 数量（千卡）
  flagshipModel: string;
  flagshipParams: number; // B
  flagshipMMLU: number;
  openSourceModels: number;
  papers2024: number;
  funding: number; // 总融资(亿美元)
  keyFigure: string;
  lat: number;
  lng: number;
  color: string;
  events: { date: string; text: string }[];
}

const ORGS: OrgData[] = [
  {
    id: 'openai', name: 'OpenAI', nameZh: 'OpenAI', country: 'US', type: 'company', founded: 2015, valuation: 300,
    employees: 3200, gpuCount: 80, flagshipModel: 'GPT-5', flagshipParams: 2000, flagshipMMLU: 96,
    openSourceModels: 0, papers2024: 42, funding: 266, keyFigure: 'Sam Altman',
    lat: 37.78, lng: -122.41, color: '#10B981',
    events: [{ date: '2022-11', text: 'ChatGPT 发布，2 个月破亿' }, { date: '2023-03', text: 'GPT-4 发布，多模态时代' }, { date: '2024-09', text: 'o1 推理模型' }, { date: '2025-08', text: 'GPT-5 发布' }],
  },
  {
    id: 'google', name: 'Google DeepMind', nameZh: '谷歌 DeepMind', country: 'US', type: 'company', founded: 2010, valuation: 2000,
    employees: 5000, gpuCount: 200, flagshipModel: 'Gemini 2.5 Pro', flagshipParams: 1500, flagshipMMLU: 94,
    openSourceModels: 4, papers2024: 380, funding: 0, keyFigure: 'Demis Hassabis',
    lat: 37.42, lng: -122.08, color: '#3B82F6',
    events: [{ date: '2023-12', text: 'Gemini 发布' }, { date: '2024-02', text: '100 万 Token 上下文' }, { date: '2025-03', text: 'Gemini 2.5 Pro' }],
  },
  {
    id: 'anthropic', name: 'Anthropic', nameZh: 'Anthropic', country: 'US', type: 'startup', founded: 2021, valuation: 60,
    employees: 1500, gpuCount: 50, flagshipModel: 'Claude Opus 4', flagshipParams: 600, flagshipMMLU: 95,
    openSourceModels: 0, papers2024: 85, funding: 150, keyFigure: 'Dario Amodei',
    lat: 37.77, lng: -122.42, color: '#D97706',
    events: [{ date: '2024-03', text: 'Claude 3 超越 GPT-4' }, { date: '2024-06', text: 'Sonnet 3.5 编程碾压' }, { date: '2025-06', text: 'Claude 4 长时自主' }],
  },
  {
    id: 'meta', name: 'Meta AI', nameZh: 'Meta AI', country: 'US', type: 'company', founded: 2004, valuation: 1500,
    employees: 3000, gpuCount: 150, flagshipModel: 'Llama 4 Maverick', flagshipParams: 400, flagshipMMLU: 90,
    openSourceModels: 12, papers2024: 250, funding: 0, keyFigure: 'Yann LeCun',
    lat: 37.48, lng: -122.15, color: '#6366F1',
    events: [{ date: '2023-02', text: 'LLaMA 开源运动开端' }, { date: '2024-04', text: 'Llama 3 15T Token' }, { date: '2024-07', text: '405B 最大开源' }, { date: '2025-04', text: 'Llama 4 MoE' }],
  },
  {
    id: 'deepseek', name: 'DeepSeek', nameZh: '深度求索', country: 'CN', type: 'startup', founded: 2023, valuation: 10,
    employees: 300, gpuCount: 12, flagshipModel: 'DeepSeek R1', flagshipParams: 671, flagshipMMLU: 90,
    openSourceModels: 15, papers2024: 28, funding: 5, keyFigure: '梁文锋',
    lat: 39.99, lng: 116.33, color: '#EF4444',
    events: [{ date: '2024-05', text: 'V2 MLA 革新' }, { date: '2024-12', text: 'V3 FP8 训练' }, { date: '2025-01', text: 'R1 GRPO 震撼全球' }],
  },
  {
    id: 'alibaba', name: 'Alibaba / Qwen', nameZh: '阿里 / 通义千问', country: 'CN', type: 'company', founded: 1999, valuation: 220,
    employees: 2000, gpuCount: 60, flagshipModel: 'Qwen 3', flagshipParams: 235, flagshipMMLU: 92,
    openSourceModels: 20, papers2024: 120, funding: 0, keyFigure: '周靖人',
    lat: 30.27, lng: 120.15, color: '#F97316',
    events: [{ date: '2024-06', text: 'Qwen 2 开源' }, { date: '2024-09', text: 'Qwen 2.5 中文最强' }, { date: '2025-04', text: 'Qwen 3 思考模式' }],
  },
  {
    id: 'mistral', name: 'Mistral AI', nameZh: 'Mistral AI', country: 'EU', type: 'startup', founded: 2023, valuation: 6,
    employees: 600, gpuCount: 8, flagshipModel: 'Mistral Large 2', flagshipParams: 123, flagshipMMLU: 84,
    openSourceModels: 5, papers2024: 12, funding: 22, keyFigure: 'Arthur Mensch',
    lat: 48.86, lng: 2.35, color: '#8B5CF6',
    events: [{ date: '2023-09', text: '7B 掀起小模型革命' }, { date: '2023-12', text: 'Mixtral 开源 MoE' }, { date: '2024-07', text: 'Large 2 商业竞争' }],
  },
  {
    id: 'xai', name: 'xAI', nameZh: 'xAI', country: 'US', type: 'startup', founded: 2023, valuation: 50,
    employees: 400, gpuCount: 100, flagshipModel: 'Grok-3', flagshipParams: 1000, flagshipMMLU: 93,
    openSourceModels: 1, papers2024: 5, funding: 120, keyFigure: 'Elon Musk',
    lat: 30.27, lng: -97.74, color: '#64748B',
    events: [{ date: '2023-11', text: 'Grok-1 发布' }, { date: '2025-02', text: 'Grok-3 10 万 H100' }],
  },
  {
    id: 'nvidia', name: 'NVIDIA', nameZh: '英伟达', country: 'US', type: 'company', founded: 1993, valuation: 3200,
    employees: 800, gpuCount: 30, flagshipModel: 'Nemotron-5', flagshipParams: 8, flagshipMMLU: 74,
    openSourceModels: 6, papers2024: 150, funding: 0, keyFigure: 'Jensen Huang',
    lat: 37.37, lng: -121.96, color: '#84CC16',
    events: [{ date: '2024-06', text: 'Nemotron 合成数据管线' }, { date: '2025-03', text: 'B300 芯片发布' }],
  },
  {
    id: 'microsoft', name: 'Microsoft', nameZh: '微软', country: 'US', type: 'company', founded: 1975, valuation: 3100,
    employees: 1200, gpuCount: 40, flagshipModel: 'Phi-4', flagshipParams: 14, flagshipMMLU: 84,
    openSourceModels: 8, papers2024: 200, funding: 0, keyFigure: 'Satya Nadella',
    lat: 47.64, lng: -122.13, color: '#0EA5E9',
    events: [{ date: '2023-12', text: 'Phi-2 教科书数据' }, { date: '2024-12', text: 'Phi-4 合成数据驱动' }],
  },
  {
    id: 'baidu', name: 'Baidu', nameZh: '百度', country: 'CN', type: 'company', founded: 2000, valuation: 45,
    employees: 1500, gpuCount: 30, flagshipModel: 'ERNIE 4.5', flagshipParams: 500, flagshipMMLU: 85,
    openSourceModels: 2, papers2024: 80, funding: 0, keyFigure: '李彦宏',
    lat: 40.06, lng: 116.31, color: '#2563EB',
    events: [{ date: '2023-03', text: '文心一言首发' }, { date: '2025-06', text: 'ERNIE 4.5 开源 MoE' }],
  },
  {
    id: 'zhipu', name: 'Zhipu AI', nameZh: '智谱 AI', country: 'CN', type: 'startup', founded: 2019, valuation: 4,
    employees: 800, gpuCount: 10, flagshipModel: 'GLM-4-Plus', flagshipParams: 200, flagshipMMLU: 83,
    openSourceModels: 6, papers2024: 35, funding: 15, keyFigure: '唐杰',
    lat: 40.00, lng: 116.32, color: '#7C3AED',
    events: [{ date: '2024-01', text: 'GLM-4 发布' }, { date: '2024-08', text: 'GLM-4-Plus' }],
  },
  {
    id: 'kimi', name: 'Moonshot AI', nameZh: '月之暗面', country: 'CN', type: 'startup', founded: 2023, valuation: 3,
    employees: 400, gpuCount: 8, flagshipModel: 'Kimi k1.5', flagshipParams: 200, flagshipMMLU: 86,
    openSourceModels: 0, papers2024: 10, funding: 12, keyFigure: '杨植麟',
    lat: 39.92, lng: 116.46, color: '#06B6D4',
    events: [{ date: '2024-03', text: 'Kimi 200K 上下文' }, { date: '2025-01', text: 'k1.5 推理模型' }],
  },
  {
    id: 'bytedance', name: 'ByteDance', nameZh: '字节跳动', country: 'CN', type: 'company', founded: 2012, valuation: 300,
    employees: 2500, gpuCount: 50, flagshipModel: 'Doubao 1.5 Pro', flagshipParams: 300, flagshipMMLU: 88,
    openSourceModels: 1, papers2024: 95, funding: 0, keyFigure: '张一鸣',
    lat: 39.98, lng: 116.37, color: '#06B6D4',
    events: [{ date: '2024-05', text: '豆包发布' }, { date: '2025-02', text: 'Doubao 1.5 推理' }],
  },
  {
    id: 'tencent', name: 'Tencent', nameZh: '腾讯', country: 'CN', type: 'company', founded: 1998, valuation: 450,
    employees: 1500, gpuCount: 40, flagshipModel: 'Hunyuan-Large', flagshipParams: 389, flagshipMMLU: 82,
    openSourceModels: 3, papers2024: 90, funding: 0, keyFigure: '马化腾',
    lat: 22.54, lng: 113.95, color: '#3B82F6',
    events: [{ date: '2024-11', text: 'Hunyuan-Large MoE 开源' }],
  },
  {
    id: '01ai', name: '01.AI', nameZh: '零一万物', country: 'CN', type: 'startup', founded: 2023, valuation: 2,
    employees: 500, gpuCount: 6, flagshipModel: 'Yi-Lightning', flagshipParams: 100, flagshipMMLU: 85,
    openSourceModels: 5, papers2024: 15, funding: 10, keyFigure: '李开复',
    lat: 39.91, lng: 116.39, color: '#EC4899',
    events: [{ date: '2023-11', text: 'Yi-34B 开源' }, { date: '2024-10', text: 'Yi-Lightning' }],
  },
  {
    id: 'cohere', name: 'Cohere', nameZh: 'Cohere', country: 'US', type: 'startup', founded: 2019, valuation: 5.5,
    employees: 500, gpuCount: 5, flagshipModel: 'Command A', flagshipParams: 111, flagshipMMLU: 82,
    openSourceModels: 3, papers2024: 20, funding: 9, keyFigure: 'Aidan Gomez',
    lat: 43.65, lng: -79.38, color: '#14B8A6',
    events: [{ date: '2024-04', text: 'Command R+ RAG 优化' }, { date: '2025-03', text: 'Command A' }],
  },
  {
    id: 'tii', name: 'TII', nameZh: '阿联酋技术创新院', country: 'AE', type: 'lab', founded: 2020, valuation: 1,
    employees: 400, gpuCount: 8, flagshipModel: 'Falcon 2', flagshipParams: 11, flagshipMMLU: 62,
    openSourceModels: 4, papers2024: 18, funding: 30, keyFigure: 'Faisal Al Bannai',
    lat: 24.45, lng: 54.65, color: '#EAB308',
    events: [{ date: '2023-09', text: 'Falcon 180B 开源' }],
  },
];

// 时间轴数据 — 2020-2026 全球 AI 大事件
const TIMELINE_EVENTS = [
  { date: '2020-06', text: 'GPT-3 发布 (175B)', importance: 3, org: 'openai' },
  { date: '2021-01', text: 'DALL-E 图像生成', importance: 2, org: 'openai' },
  { date: '2022-04', text: 'PaLM 540B', importance: 2, org: 'google' },
  { date: '2022-07', text: 'Chinchilla 论文', importance: 3, org: 'google' },
  { date: '2022-11', text: 'ChatGPT 发布', importance: 3, org: 'openai' },
  { date: '2023-02', text: 'LLaMA 开源', importance: 3, org: 'meta' },
  { date: '2023-03', text: 'GPT-4 多模态', importance: 3, org: 'openai' },
  { date: '2023-03', text: '文心一言发布', importance: 2, org: 'baidu' },
  { date: '2023-07', text: 'Llama 2 真开源', importance: 2, org: 'meta' },
  { date: '2023-09', text: 'Mistral 7B', importance: 2, org: 'mistral' },
  { date: '2023-12', text: 'Gemini 1.0', importance: 2, org: 'google' },
  { date: '2023-12', text: 'Mixtral MoE', importance: 2, org: 'mistral' },
  { date: '2024-01', text: 'DeepSeek V1', importance: 2, org: 'deepseek' },
  { date: '2024-03', text: 'Claude 3 超越 GPT-4', importance: 3, org: 'anthropic' },
  { date: '2024-04', text: 'Llama 3 15T Token', importance: 2, org: 'meta' },
  { date: '2024-05', text: 'GPT-4o Omni', importance: 3, org: 'openai' },
  { date: '2024-05', text: 'DeepSeek V2 MLA', importance: 2, org: 'deepseek' },
  { date: '2024-06', text: 'Claude 3.5 Sonnet', importance: 3, org: 'anthropic' },
  { date: '2024-09', text: 'Qwen 2.5 中文最强', importance: 2, org: 'alibaba' },
  { date: '2024-09', text: 'o1 推理革命', importance: 3, org: 'openai' },
  { date: '2024-12', text: 'DeepSeek V3', importance: 3, org: 'deepseek' },
  { date: '2025-01', text: 'DeepSeek R1 GRPO', importance: 3, org: 'deepseek' },
  { date: '2025-02', text: 'Grok-3 10万H100', importance: 2, org: 'xai' },
  { date: '2025-03', text: 'Gemini 2.5 Pro', importance: 3, org: 'google' },
  { date: '2025-04', text: 'Qwen 3 + Llama 4', importance: 3, org: 'alibaba' },
  { date: '2025-06', text: 'Claude Opus 4', importance: 3, org: 'anthropic' },
  { date: '2025-08', text: 'GPT-5', importance: 3, org: 'openai' },
];

// 维度定义
type Dimension = 'model' | 'compute' | 'talent' | 'openSource';
const DIM_NAMES: Record<Dimension, string> = { model: '模型能力', compute: '算力储备', talent: '人才密度', openSource: '开源贡献' };

// 计算四维得分
function calcDimScores(org: OrgData): Record<Dimension, number> {
  return {
    model: Math.min(100, org.flagshipMMLU),
    compute: Math.min(100, Math.sqrt(org.gpuCount) * 15),
    talent: Math.min(100, (org.papers2024 / 4) + (org.employees / 60)),
    openSource: Math.min(100, org.openSourceModels * 7),
  };
}

type Tab = 'map' | 'radar' | 'timeline' | 'versus';

export default function AIArmsRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<Tab>('map');
  const [selectedOrg, setSelectedOrg] = useState<OrgData | null>(null);
  const [hoveredOrg, setHoveredOrg] = useState<OrgData | null>(null);
  const [vsOrg1, setVsOrg1] = useState<string>('openai');
  const [vsOrg2, setVsOrg2] = useState<string>('deepseek');
  const [timelineYear, setTimelineYear] = useState(2025);
  const nodePositions = useRef<Map<string, { x: number; y: number; r: number }>>(new Map());

  // ===== 世界地图 Canvas =====
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    // 深色背景 + 网格
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // 经纬网格
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 18; i++) {
      const x = (i / 18) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const y = (i / 9) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // 简化大陆轮廓（关键坐标点）
    const toXY = (lat: number, lng: number) => ({
      x: ((lng + 180) / 360) * W,
      y: ((90 - lat) / 180) * H,
    });

    // 绘制简化大陆
    const drawContinent = (points: [number, number][]) => {
      ctx.beginPath();
      points.forEach(([lat, lng], i) => {
        const { x, y } = toXY(lat, lng);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    // 简化大陆轮廓
    drawContinent([[70,-130],[50,-125],[30,-120],[25,-80],[30,-65],[45,-60],[50,-55],[70,-60]]); // 北美
    drawContinent([[10,-80],[5,-77],[-5,-80],[-15,-75],[-35,-70],[-55,-65],[-55,-70],[-35,-60],[-5,-35],[5,-50],[10,-75]]); // 南美
    drawContinent([[38,-10],[48,0],[55,10],[60,30],[55,40],[70,30],[70,50],[55,50],[42,30],[35,28],[35,10],[38,0]]); // 欧洲
    drawContinent([[35,-10],[32,0],[30,10],[25,35],[10,42],[5,50],[-5,40],[-15,40],[-35,25],[-35,18],[0,-5],[10,-15],[30,-10]]); // 非洲
    drawContinent([[70,60],[60,60],[50,70],[40,60],[35,45],[25,50],[20,70],[10,80],[5,100],[-8,115],[0,130],[25,120],[35,105],[40,80],[45,90],[50,100],[55,120],[60,140],[65,170],[70,180],[70,60]]); // 亚洲
    drawContinent([[-10,115],[-20,115],[-25,115],[-35,140],[-40,145],[-35,150],[-25,150],[-15,130],[-10,120]]); // 澳洲

    // 绘制组织节点
    const positions = new Map<string, { x: number; y: number; r: number }>();
    ORGS.forEach(org => {
      const { x, y } = toXY(org.lat, org.lng);
      const r = Math.max(8, Math.min(28, Math.sqrt(org.gpuCount) * 3));
      positions.set(org.id, { x, y, r });

      const isHovered = hoveredOrg?.id === org.id;
      const isSelected = selectedOrg?.id === org.id;
      const drawR = r * (isHovered ? 1.3 : 1) * (isSelected ? 1.4 : 1);

      // 脉冲光环
      ctx.save();
      const pulse = ctx.createRadialGradient(x, y, 0, x, y, drawR * 4);
      pulse.addColorStop(0, org.color + '30');
      pulse.addColorStop(0.5, org.color + '10');
      pulse.addColorStop(1, org.color + '00');
      ctx.fillStyle = pulse;
      ctx.beginPath();
      ctx.arc(x, y, drawR * 4, 0, Math.PI * 2);
      ctx.fill();

      // 主体
      const grad = ctx.createRadialGradient(x, y, 0, x, y, drawR);
      grad.addColorStop(0, org.color + 'FF');
      grad.addColorStop(0.7, org.color + 'CC');
      grad.addColorStop(1, org.color + '80');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, drawR, 0, Math.PI * 2);
      ctx.fill();

      // 边框
      ctx.strokeStyle = isHovered || isSelected ? '#fff' : org.color;
      ctx.lineWidth = isHovered || isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, y, drawR, 0, Math.PI * 2);
      ctx.stroke();

      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = `${isHovered || isSelected ? 'bold ' : ''}${Math.max(9, drawR * 0.65)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(org.nameZh, x, y + drawR + 14);

      // GPU 数量
      if (drawR > 12) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = `bold ${Math.max(8, drawR * 0.5)}px system-ui`;
        ctx.fillText(`${org.gpuCount}K`, x, y + 4);
      }
      ctx.restore();
    });
    nodePositions.current = positions;

    // 标题
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('圆点大小 = GPU 算力储备 · 点击探索 · 数据截至 2026-03', 15, H - 15);

  }, [hoveredOrg, selectedOrg]);

  useEffect(() => {
    if (tab !== 'map') return;
    drawMap();
    const resizeObs = new ResizeObserver(() => drawMap());
    if (canvasRef.current) resizeObs.observe(canvasRef.current);
    return () => resizeObs.disconnect();
  }, [tab, drawMap]);

  const handleMapMouse = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let found: OrgData | null = null;
    for (const org of ORGS) {
      const pos = nodePositions.current.get(org.id);
      if (!pos) continue;
      const dx = mx - pos.x, dy = my - pos.y;
      if (dx * dx + dy * dy < (pos.r + 8) * (pos.r + 8)) { found = org; break; }
    }
    setHoveredOrg(found);
    canvas.style.cursor = found ? 'pointer' : 'default';
  }, []);

  const handleMapClick = useCallback(() => {
    if (hoveredOrg) setSelectedOrg(prev => prev?.id === hoveredOrg.id ? null : hoveredOrg);
    else setSelectedOrg(null);
  }, [hoveredOrg]);

  // ===== 雷达对比 =====
  const renderRadar = () => {
    const top8 = [...ORGS].sort((a, b) => b.flagshipMMLU - a.flagshipMMLU).slice(0, 8);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top8.map(org => {
            const scores = calcDimScores(org);
            return (
              <div key={org.id} onClick={() => setSelectedOrg(org)}
                className={`bg-white/5 rounded-xl p-4 border transition-all cursor-pointer ${selectedOrg?.id === org.id ? 'border-white/20' : 'border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: org.color }} />
                  <span className="font-bold text-white">{org.nameZh}</span>
                  <span className="text-xs text-white/30">{org.name}</span>
                </div>
                <div className="space-y-2">
                  {(Object.entries(scores) as [Dimension, number][]).map(([dim, score]) => (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="text-xs w-16 text-white/50">{DIM_NAMES[dim]}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: org.color }} />
                      </div>
                      <span className="text-xs font-mono w-8 text-right text-white/50">{Math.round(score)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-white/40">
                  <span>旗舰: {org.flagshipModel}</span>
                  <span>GPU: {org.gpuCount}K 卡</span>
                  <span>估值: ${org.valuation}B</span>
                  <span>开源: {org.openSourceModels} 模型</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== 时间线 =====
  const renderTimeline = () => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const filtered = TIMELINE_EVENTS.filter(e => parseInt(e.date.split('-')[0]) <= timelineYear);
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <input type="range" min={2020} max={2025} value={timelineYear} onChange={e => setTimelineYear(Number(e.target.value))}
            className="flex-1 accent-blue-500" />
          <span className="text-2xl font-black text-white/80 w-16">{timelineYear}</span>
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {filtered.map((evt, i) => {
            const org = ORGS.find(o => o.id === evt.org);
            return (
              <div key={i} className={`flex items-start gap-3 py-2 px-3 rounded-lg ${evt.importance === 3 ? 'bg-white/5' : ''}`}>
                <span className="text-xs text-white/30 w-16 shrink-0 pt-0.5">{evt.date}</span>
                <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: org?.color || '#666' }} />
                <div className="flex-1">
                  <span className={`text-sm ${evt.importance === 3 ? 'text-white font-medium' : 'text-white/60'}`}>{evt.text}</span>
                  {org && <span className="text-xs text-white/30 ml-2">{org.nameZh}</span>}
                </div>
                {evt.importance === 3 && <span className="text-amber-400 text-xs">★ 里程碑</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== 对决模式 =====
  const renderVersus = () => {
    const org1 = ORGS.find(o => o.id === vsOrg1)!;
    const org2 = ORGS.find(o => o.id === vsOrg2)!;
    const s1 = calcDimScores(org1);
    const s2 = calcDimScores(org2);

    const metrics = [
      { label: '旗舰模型', v1: org1.flagshipModel, v2: org2.flagshipModel },
      { label: '旗舰参数', v1: `${org1.flagshipParams}B`, v2: `${org2.flagshipParams}B`, n1: org1.flagshipParams, n2: org2.flagshipParams },
      { label: 'MMLU', v1: org1.flagshipMMLU, v2: org2.flagshipMMLU, n1: org1.flagshipMMLU, n2: org2.flagshipMMLU },
      { label: 'GPU 储备', v1: `${org1.gpuCount}K`, v2: `${org2.gpuCount}K`, n1: org1.gpuCount, n2: org2.gpuCount },
      { label: '员工', v1: org1.employees, v2: org2.employees, n1: org1.employees, n2: org2.employees },
      { label: '估值($B)', v1: org1.valuation, v2: org2.valuation, n1: org1.valuation, n2: org2.valuation },
      { label: '开源模型', v1: org1.openSourceModels, v2: org2.openSourceModels, n1: org1.openSourceModels, n2: org2.openSourceModels },
      { label: '2024 论文', v1: org1.papers2024, v2: org2.papers2024, n1: org1.papers2024, n2: org2.papers2024 },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 justify-center">
          <select value={vsOrg1} onChange={e => setVsOrg1(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-center font-bold">
            {ORGS.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.nameZh}</option>)}
          </select>
          <span className="text-3xl font-black text-white/20">VS</span>
          <select value={vsOrg2} onChange={e => setVsOrg2(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-center font-bold">
            {ORGS.map(o => <option key={o.id} value={o.id} className="bg-gray-900">{o.nameZh}</option>)}
          </select>
        </div>

        {/* 四维雷达对比 */}
        <div className="flex justify-center gap-8">
          {(Object.keys(s1) as Dimension[]).map(dim => {
            const v1 = s1[dim], v2 = s2[dim];
            return (
              <div key={dim} className="text-center">
                <div className="text-xs text-white/40 mb-2">{DIM_NAMES[dim]}</div>
                <div className="relative w-16 h-24">
                  <div className="absolute bottom-0 left-1 w-5 rounded-t" style={{ height: `${v1}%`, backgroundColor: org1.color + 'CC' }} />
                  <div className="absolute bottom-0 right-1 w-5 rounded-t" style={{ height: `${v2}%`, backgroundColor: org2.color + 'CC' }} />
                </div>
                <div className="flex justify-between text-xs mt-1 w-16">
                  <span style={{ color: org1.color }}>{Math.round(v1)}</span>
                  <span style={{ color: org2.color }}>{Math.round(v2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 详细对比表 */}
        <div className="space-y-1">
          {metrics.map((m, i) => {
            const winner = m.n1 !== undefined ? (m.n1 > m.n2! ? 'left' : m.n1 < m.n2! ? 'right' : 'tie') : 'tie';
            return (
              <div key={i} className="grid grid-cols-3 gap-4 items-center py-2 px-3 rounded-lg hover:bg-white/5">
                <div className={`text-right text-sm font-mono ${winner === 'left' ? 'text-white font-bold' : 'text-white/50'}`}>
                  {winner === 'left' && <span className="text-emerald-400 mr-1">◀</span>}
                  {String(m.v1)}
                </div>
                <div className="text-center text-xs text-white/30">{m.label}</div>
                <div className={`text-left text-sm font-mono ${winner === 'right' ? 'text-white font-bold' : 'text-white/50'}`}>
                  {String(m.v2)}
                  {winner === 'right' && <span className="text-emerald-400 ml-1">▶</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 胜负总结 */}
        <div className="text-center text-sm text-white/40">
          {(() => {
            let w1 = 0, w2 = 0;
            metrics.forEach(m => { if (m.n1 !== undefined && m.n1 > m.n2!) w1++; if (m.n1 !== undefined && m.n1 < m.n2!) w2++; });
            return `${org1.nameZh} ${w1} 项领先  ·  ${org2.nameZh} ${w2} 项领先`;
          })()}
        </div>
      </div>
    );
  };

  // ===== 组织详情面板 =====
  const renderOrgDetail = () => {
    if (!selectedOrg) return null;
    const o = selectedOrg;
    const scores = calcDimScores(o);
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: o.color }} />
              <h3 className="text-xl font-bold text-white">{o.nameZh}</h3>
              <span className="text-sm text-white/30">{o.name}</span>
            </div>
            <p className="text-sm text-white/40 mt-1">
              {o.country} · {o.type === 'company' ? '科技巨头' : o.type === 'lab' ? '研究机构' : '创业公司'} · 成立 {o.founded}
            </p>
          </div>
          <button onClick={() => setSelectedOrg(null)} className="text-white/30 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '估值', value: `$${o.valuation}B` },
            { label: 'GPU 储备', value: `${o.gpuCount}K 卡` },
            { label: '旗舰模型', value: o.flagshipModel },
            { label: 'MMLU', value: o.flagshipMMLU },
            { label: '员工', value: o.employees },
            { label: '开源模型', value: o.openSourceModels },
            { label: '2024 论文', value: o.papers2024 },
            { label: '关键人物', value: o.keyFigure },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-2.5">
              <div className="text-xs text-white/30">{item.label}</div>
              <div className="text-sm font-medium text-white/80">{item.value}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">关键事件</h4>
          <div className="space-y-1.5">
            {o.events.map((evt, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-white/30 w-16">{evt.date}</span>
                <span className="text-white/60">{evt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            GLOBAL AI SITUATION ROOM
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">
            全球 AI 军备竞赛
          </h1>
          <p className="text-white/40 mt-2 text-lg">
            {ORGS.length} 家机构 · {TIMELINE_EVENTS.length} 个关键事件 · 实时态势感知
          </p>
        </div>

        {/* 全局统计 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '总 GPU 算力', value: `${Math.round(ORGS.reduce((s, o) => s + o.gpuCount, 0))}K 卡`, desc: '估算全球 AI 训练算力', color: 'from-green-500 to-emerald-500' },
            { label: '总估值', value: `$${Math.round(ORGS.reduce((s, o) => s + o.valuation, 0) / 1000 * 10) / 10}T`, desc: '18 家机构总估值', color: 'from-amber-500 to-orange-500' },
            { label: '开源模型', value: ORGS.reduce((s, o) => s + o.openSourceModels, 0), desc: '全球主要开源大模型', color: 'from-blue-500 to-cyan-500' },
            { label: '2024 论文', value: `${Math.round(ORGS.reduce((s, o) => s + o.papers2024, 0))}+`, desc: 'AI 顶会 + arXiv', color: 'from-purple-500 to-pink-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className={`text-2xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
              <div className="text-xs text-white/60 font-medium mt-1">{s.label}</div>
              <div className="text-xs text-white/25 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* 标签页 */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-6 w-fit mx-auto">
          {([
            { key: 'map', label: '全球态势', icon: '🌐' },
            { key: 'radar', label: '四维雷达', icon: '📡' },
            { key: 'timeline', label: '大事记', icon: '⏤' },
            { key: 'versus', label: '对决', icon: '⚔️' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm transition-all ${tab === t.key ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white/70'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 主视图 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {tab === 'map' && (
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <canvas ref={canvasRef} className="w-full" style={{ height: 500 }}
                  onMouseMove={handleMapMouse} onClick={handleMapClick} onMouseLeave={() => setHoveredOrg(null)} />
              </div>
            )}
            {tab === 'radar' && (
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6">
                {renderRadar()}
              </div>
            )}
            {tab === 'timeline' && (
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white/80 mb-4">AI 军备大事记 · 2020-{timelineYear}</h3>
                {renderTimeline()}
              </div>
            )}
            {tab === 'versus' && (
              <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white/80 mb-4 text-center">⚔️ 对决模式</h3>
                {renderVersus()}
              </div>
            )}
          </div>

          {/* 右侧面板 */}
          <div className="lg:col-span-1">
            {selectedOrg ? renderOrgDetail() : (
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
                <div className="text-4xl text-center opacity-30">🎯</div>
                <p className="text-white/40 text-sm text-center">点击地图上的节点查看详细信息</p>
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">力量排行 (综合)</h4>
                  {[...ORGS].sort((a, b) => {
                    const sa = calcDimScores(a), sb = calcDimScores(b);
                    const ta = Object.values(sa).reduce((s, v) => s + v, 0);
                    const tb = Object.values(sb).reduce((s, v) => s + v, 0);
                    return tb - ta;
                  }).slice(0, 10).map((org, i) => {
                    const total = Object.values(calcDimScores(org)).reduce((s, v) => s + v, 0);
                    return (
                      <button key={org.id} onClick={() => setSelectedOrg(org)}
                        className="flex items-center gap-2 w-full text-left hover:bg-white/5 rounded-lg py-1 px-2 transition-colors">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'text-white/30'}`}>{i + 1}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: org.color }} />
                        <span className="text-sm text-white/70 flex-1">{org.nameZh}</span>
                        <span className="text-xs font-mono text-white/30">{Math.round(total)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="mt-8 text-center text-xs text-white/20">
          <p>数据为公开信息综合估算 · GPU 数量、估值等数据可能与实际有出入</p>
          <p className="mt-1">这个「战情室」—— 18 家机构数据、4 种分析视图、全部交互 —— 由 AI 一次生成</p>
        </div>
      </div>
    </div>
  );
}
