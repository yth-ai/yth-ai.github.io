import { useState, useRef, useEffect, useCallback } from 'react';

// ===================== 类型定义 =====================

interface SubjectScore {
  human_top: number;    // 人类顶尖 (满分百分比)
  human_avg: number;    // 普通考生
  gpt4: number;
  claude: number;
  deepseek: number;
  llama: number;
}

interface SubSkill {
  name: string;
  humanAdvantage: boolean; // true = 人类更强, false = AI更强
  aiScore: number;        // AI 平均得分 0-100
  humanScore: number;     // 人类平均得分 0-100
  insight: string;
}

interface Subject {
  name: string;
  icon: string;
  color: string;
  scores: SubjectScore;
  subSkills: SubSkill[];
  insight: string;
  aiStrength: string;
  aiWeakness: string;
  bookLink?: string;
}

interface QuizQuestion {
  subject: string;
  question: string;
  difficulty: '简单' | '中等' | '困难';
  canGPT4Solve: boolean;
  canClaudeSolve: boolean;
  canDeepSeekSolve: boolean;
  canLlamaSolve: boolean;
  explanation: string;
  humanAccuracy: number;
}

// ===================== 数据 =====================

const subjects: Subject[] = [
  {
    name: '数学', icon: '📐', color: '#6366f1',
    scores: { human_top: 98, human_avg: 72, gpt4: 92, claude: 90, deepseek: 95, llama: 78 },
    subSkills: [
      { name: '代数计算', humanAdvantage: false, aiScore: 96, humanScore: 78, insight: 'AI 的绝对优势领域，多步计算几乎不出错' },
      { name: '几何证明', humanAdvantage: true, aiScore: 72, humanScore: 85, insight: '需要空间想象力和创造性构造辅助线' },
      { name: '函数分析', humanAdvantage: false, aiScore: 91, humanScore: 70, insight: '模式匹配能力强，快速识别函数性质' },
      { name: '概率统计', humanAdvantage: false, aiScore: 94, humanScore: 65, insight: '组合计算是 AI 强项，贝叶斯推理尤其擅长' },
      { name: '压轴题', humanAdvantage: true, aiScore: 65, humanScore: 40, insight: '需要多步创造性推理，AI 容易在长链推理中出错' },
    ],
    insight: '数学是 AI 碾压普通人但仍被顶尖选手压制的学科。DeepSeek-R1 的 GRPO 训练专门针对数学推理优化。',
    aiStrength: '计算精度、模式识别、标准题型',
    aiWeakness: '创造性证明、超长链推理、新颖构造',
    bookLink: '/books/llm-complete/chapter-10',
  },
  {
    name: '英语', icon: '🔤', color: '#0ea5e9',
    scores: { human_top: 96, human_avg: 85, gpt4: 97, claude: 98, deepseek: 88, llama: 85 },
    subSkills: [
      { name: '阅读理解', humanAdvantage: false, aiScore: 98, humanScore: 82, insight: '长文本理解是 LLM 天生优势，信息检索极快' },
      { name: '完形填空', humanAdvantage: false, aiScore: 96, humanScore: 78, insight: 'BERT 式遮盖预测本质上就是完形填空训练' },
      { name: '语法改错', humanAdvantage: false, aiScore: 95, humanScore: 70, insight: '大量英语语料预训练使语法判断几乎完美' },
      { name: '作文', humanAdvantage: true, aiScore: 88, humanScore: 90, insight: 'AI 写得流畅但缺乏真实情感和独特观点' },
      { name: '听力理解', humanAdvantage: true, aiScore: 0, humanScore: 80, insight: '纯文本 LLM 无法处理音频（多模态模型正在改变这点）' },
    ],
    insight: '英语是 AI 的母语。预训练语料中英语占比 40-60%，这让英语能力成为所有模型的默认优势。',
    aiStrength: '词汇量无穷、语法完美、阅读速度无限',
    aiWeakness: '听力（纯文本模型）、真实情感表达、文化微妙性',
    bookLink: '/books/data-engineering/de-ch06-data-mixing',
  },
  {
    name: '语文', icon: '📝', color: '#f43f5e',
    scores: { human_top: 95, human_avg: 78, gpt4: 75, claude: 78, deepseek: 72, llama: 60 },
    subSkills: [
      { name: '古文翻译', humanAdvantage: true, aiScore: 70, humanScore: 82, insight: '古文训练语料稀少，AI 常犯低级古文错误' },
      { name: '诗词鉴赏', humanAdvantage: true, aiScore: 62, humanScore: 78, insight: '需要文化语境、审美感受和情感共鸣' },
      { name: '现代文阅读', humanAdvantage: false, aiScore: 85, humanScore: 75, insight: '信息提取能力强，但深层理解有时流于表面' },
      { name: '作文', humanAdvantage: true, aiScore: 68, humanScore: 82, insight: 'AI 作文"正确但无趣"——缺少个人体验和独特视角' },
      { name: '成语病句', humanAdvantage: false, aiScore: 82, humanScore: 70, insight: '规则匹配类题目，AI 学习了大量语料中的用法模式' },
    ],
    insight: '语文是 AI 最吃亏的学科之一。中文预训练语料质量参差不齐，古文资源尤其稀缺。作文需要"人味"——这恰恰是 AI 最缺的。',
    aiStrength: '信息检索、规则判断、知识覆盖面广',
    aiWeakness: '古文理解、审美鉴赏、真情实感作文',
    bookLink: '/books/data-engineering/de-ch02-data-sources',
  },
  {
    name: '物理', icon: '⚛️', color: '#8b5cf6',
    scores: { human_top: 97, human_avg: 62, gpt4: 82, claude: 80, deepseek: 88, llama: 65 },
    subSkills: [
      { name: '力学计算', humanAdvantage: false, aiScore: 90, humanScore: 65, insight: '公式套用是 AI 强项，受力分析准确率高' },
      { name: '电磁学', humanAdvantage: false, aiScore: 85, humanScore: 58, insight: '复杂电路分析 AI 表现优异' },
      { name: '实验设计', humanAdvantage: true, aiScore: 55, humanScore: 72, insight: '需要动手经验和物理直觉，AI 只有书本知识' },
      { name: '综合大题', humanAdvantage: true, aiScore: 68, humanScore: 50, insight: '多步骤物理过程分析容易在中间环节出错' },
      { name: '物理直觉', humanAdvantage: true, aiScore: 45, humanScore: 70, insight: 'AI 没有"物理直觉"，无法感知重力、摩擦力、惯性' },
    ],
    insight: '物理暴露了 AI 的根本局限：它没有身体，无法感知物理世界。但在纯计算题上，DeepSeek 的推理能力已经非常强。',
    aiStrength: '公式计算、电路分析、标准题型',
    aiWeakness: '实验设计、物理直觉、创新建模',
    bookLink: '/books/llm-complete/chapter-16',
  },
  {
    name: '化学', icon: '🧪', color: '#10b981',
    scores: { human_top: 96, human_avg: 68, gpt4: 80, claude: 78, deepseek: 82, llama: 62 },
    subSkills: [
      { name: '化学方程式', humanAdvantage: false, aiScore: 92, humanScore: 72, insight: '海量化学知识记忆是 AI 的优势' },
      { name: '有机推断', humanAdvantage: true, aiScore: 70, humanScore: 75, insight: '需要空间想象力和反应机理的深度理解' },
      { name: '实验题', humanAdvantage: true, aiScore: 58, humanScore: 70, insight: '实验现象描述需要真实观察经验' },
      { name: '计算题', humanAdvantage: false, aiScore: 88, humanScore: 65, insight: '摩尔计算、溶液配制等定量问题是 AI 强项' },
      { name: '工业流程', humanAdvantage: false, aiScore: 82, humanScore: 60, insight: '信息提取和流程分析，AI 阅读能力强' },
    ],
    insight: '化学和物理类似——理论和计算 AI 强，但实验相关题目暴露了 AI 缺乏真实世界经验的短板。',
    aiStrength: '知识记忆、方程式配平、定量计算',
    aiWeakness: '实验现象、有机空间结构、创新实验设计',
  },
  {
    name: '生物', icon: '🧬', color: '#f59e0b',
    scores: { human_top: 95, human_avg: 70, gpt4: 88, claude: 86, deepseek: 84, llama: 70 },
    subSkills: [
      { name: '分子生物学', humanAdvantage: false, aiScore: 92, humanScore: 68, insight: 'DNA/RNA/蛋白质知识 AI 储备极其丰富' },
      { name: '遗传计算', humanAdvantage: false, aiScore: 90, humanScore: 62, insight: '概率计算 + 遗传规律，AI 非常擅长' },
      { name: '实验分析', humanAdvantage: true, aiScore: 72, humanScore: 75, insight: '实验变量控制和结果分析需要科学素养' },
      { name: '生态与进化', humanAdvantage: true, aiScore: 78, humanScore: 80, insight: '开放性分析题需要综合判断能力' },
      { name: '图表读取', humanAdvantage: false, aiScore: 85, humanScore: 72, insight: '多模态模型在图表理解上进步迅速' },
    ],
    insight: '生物是知识密集型学科，AI 的海量记忆是巨大优势。但高考生物考的不只是记忆，还有实验分析和综合判断。',
    aiStrength: '知识覆盖、遗传计算、分子生物学细节',
    aiWeakness: '实验设计、生态分析、开放题',
  },
  {
    name: '历史', icon: '📜', color: '#ec4899',
    scores: { human_top: 94, human_avg: 72, gpt4: 82, claude: 85, deepseek: 78, llama: 65 },
    subSkills: [
      { name: '史实记忆', humanAdvantage: false, aiScore: 95, humanScore: 70, insight: '年代、事件、人物——AI 的记忆力无上限' },
      { name: '史料分析', humanAdvantage: true, aiScore: 72, humanScore: 78, insight: '解读原始史料需要历史语境和批判性思维' },
      { name: '论述题', humanAdvantage: true, aiScore: 68, humanScore: 80, insight: '论点-论据-逻辑链，需要历史观和价值判断' },
      { name: '时间线排序', humanAdvantage: false, aiScore: 92, humanScore: 65, insight: '事件时序是结构化知识，AI 极其擅长' },
      { name: '比较评价', humanAdvantage: true, aiScore: 70, humanScore: 75, insight: '多角度评价历史事件需要批判性思维' },
    ],
    insight: '历史的记忆部分 AI 碾压，但高分需要"历史思维"——理解因果、评价功过、从史料中读出弦外之音。Claude 在人文领域表现尤其出色。',
    aiStrength: '事件记忆、时间线、知识广度',
    aiWeakness: '史料解读、价值判断、论述深度',
  },
  {
    name: '地理', icon: '🌏', color: '#14b8a6',
    scores: { human_top: 95, human_avg: 68, gpt4: 78, claude: 80, deepseek: 75, llama: 62 },
    subSkills: [
      { name: '自然地理', humanAdvantage: false, aiScore: 85, humanScore: 70, insight: '气候、地貌等系统知识 AI 掌握良好' },
      { name: '人文地理', humanAdvantage: true, aiScore: 72, humanScore: 75, insight: '区域分析需要综合多因素，开放性强' },
      { name: '地图判读', humanAdvantage: true, aiScore: 55, humanScore: 78, insight: '等高线、区域图——纯文本模型的盲区' },
      { name: '计算题', humanAdvantage: false, aiScore: 88, humanScore: 62, insight: '时区计算、日照时间等定量问题' },
      { name: '综合分析', humanAdvantage: true, aiScore: 65, humanScore: 72, insight: '区域综合分析需要多维度知识整合' },
    ],
    insight: '地理是"文理交叉"学科。AI 在定量计算和知识回忆上占优，但地图判读和区域综合分析是短板——特别是纯文本模型看不到图。',
    aiStrength: '知识储备、时区计算、气候分类',
    aiWeakness: '地图读取、区域综合分析、实地感知',
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    subject: '数学',
    question: '已知 f(x) = x³ - 3x + 1，求 f(x) 在 [-2, 2] 上的最大值和最小值。',
    difficulty: '中等',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: true,
    explanation: '标准求导求极值问题，所有主流模型都能准确解答。f\'(x)=3x²-3=0 → x=±1，代入比较即可。',
    humanAccuracy: 75,
  },
  {
    subject: '语文',
    question: '阅读苏轼《定风波·莫听穿林打叶声》，分析"一蓑烟雨任平生"中的人生态度，结合作者经历，写 300 字赏析。',
    difficulty: '困难',
    canGPT4Solve: false, canClaudeSolve: false, canDeepSeekSolve: false, canLlamaSolve: false,
    explanation: 'AI 能写出"正确"的赏析，但往往千篇一律、缺乏个人感悟。高考阅卷老师能一眼看出"AI 味"——流畅但空洞。',
    humanAccuracy: 60,
  },
  {
    subject: '英语',
    question: 'The company\'s decision to ___ (lay off / lay out / lay down / lay up) 500 workers sparked widespread protest.',
    difficulty: '简单',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: true,
    explanation: 'lay off（裁员）是基础短语搭配。英语是 LLM 的优势语言，这类题几乎不可能错。',
    humanAccuracy: 82,
  },
  {
    subject: '物理',
    question: '一质量 m 的小球从高度 h 处自由落下，落入沙坑深度 d，求沙坑对小球的平均阻力。',
    difficulty: '中等',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: false,
    explanation: '能量守恒：mgh = F·d - mg·d → F = mg(h+d)/d。主流模型能解，但开源小模型可能在物理公式推导中出错。',
    humanAccuracy: 58,
  },
  {
    subject: '化学',
    question: '实验室制备乙酸乙酯时，为什么要用饱和碳酸钠溶液收集？请从三个角度解释。',
    difficulty: '中等',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: false,
    explanation: '①溶解乙醇 ②反应除去乙酸 ③降低乙酸乙酯溶解度。需要化学知识的组合运用，大模型储备丰富。',
    humanAccuracy: 62,
  },
  {
    subject: '历史',
    question: '有学者认为"洋务运动是一场失败的成功"。请你对这一观点进行评述。（15 分）',
    difficulty: '困难',
    canGPT4Solve: false, canClaudeSolve: false, canDeepSeekSolve: false, canLlamaSolve: false,
    explanation: 'AI 能给出结构化答案，但高考评卷看重独到见解和论证逻辑。AI 倾向于"两方面看"的中庸套路，缺乏锐利的历史洞见。',
    humanAccuracy: 45,
  },
  {
    subject: '数学',
    question: '在三角形 ABC 中，若 a² = b² + c² + bc，求角 A 的大小。',
    difficulty: '简单',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: true,
    explanation: '余弦定理变形：a²=b²+c²-2bc·cosA → bc = -2bc·cosA → cosA = -1/2 → A = 2π/3。标准套路题。',
    humanAccuracy: 70,
  },
  {
    subject: '生物',
    question: '设计实验验证光合作用产生氧气需要光照。写出实验步骤、预期结果和结论。',
    difficulty: '中等',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: false, canLlamaSolve: false,
    explanation: '实验设计类。GPT-4/Claude 能写出规范步骤，但 AI 的实验描述有时过于"教科书化"，缺乏实际操作细节。',
    humanAccuracy: 55,
  },
  {
    subject: '地理',
    question: '下图为某地等高线地形图（等高距 100m）。判断 A、B 两地之间能否通视，并说明理由。',
    difficulty: '困难',
    canGPT4Solve: false, canClaudeSolve: false, canDeepSeekSolve: false, canLlamaSolve: false,
    explanation: '需要读取等高线地形图——纯文本 LLM 完全无法处理。即使是多模态模型，等高线判读仍是极大挑战。',
    humanAccuracy: 50,
  },
  {
    subject: '物理',
    question: '请设计一个实验，用一把刻度尺和一个已知质量的砝码，测量一根轻弹簧的劲度系数。',
    difficulty: '中等',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: false,
    explanation: '挂砝码测伸长量，k=mg/Δx。看似简单但 AI 经常遗漏实际操作细节：如何固定弹簧、如何读数、误差分析。',
    humanAccuracy: 68,
  },
  {
    subject: '语文',
    question: '将"落霞与孤鹜齐飞，秋水共长天一色"翻译成现代汉语，并分析其写作手法。',
    difficulty: '中等',
    canGPT4Solve: true, canClaudeSolve: true, canDeepSeekSolve: true, canLlamaSolve: false,
    explanation: '翻译部分 AI 能做，但鉴赏手法的分析深度有限。AI 能说出"对仗""动静结合"，但难以传达美感。',
    humanAccuracy: 72,
  },
  {
    subject: '英语',
    question: 'Write a short essay (120 words) about your most memorable travel experience. Use specific details and sensory descriptions.',
    difficulty: '中等',
    canGPT4Solve: false, canClaudeSolve: false, canDeepSeekSolve: false, canLlamaSolve: false,
    explanation: 'AI 无法写"你的"旅行经历——它会编造一个虚假但流畅的故事。高考作文要真情实感，AI 永远是在"表演"。',
    humanAccuracy: 78,
  },
];

// ===================== 工具函数 =====================

const modelColors = {
  human_top: '#f59e0b',
  human_avg: '#94a3b8',
  gpt4: '#10b981',
  claude: '#8b5cf6',
  deepseek: '#3b82f6',
  llama: '#f43f5e',
};

const modelNames = {
  human_top: '人类顶尖',
  human_avg: '普通考生',
  gpt4: 'GPT-4o',
  claude: 'Claude 3.5',
  deepseek: 'DeepSeek V3',
  llama: 'LLaMA 3 70B',
};

type ModelKey = keyof typeof modelColors;

// ===================== 雷达图 Canvas =====================

function drawRadar(
  canvas: HTMLCanvasElement,
  subjects: Subject[],
  selectedModels: ModelKey[],
  hoveredSubject: number | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 50;
  const n = subjects.length;
  const angleStep = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, w, h);

  // 网格
  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius * ring) / 5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 刻度标签
    if (ring % 2 === 0) {
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(`${ring * 20}`, cx - 6, cy - r + 4);
    }
  }

  // 轴线 + 标签
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 学科标签
    const labelR = radius + 28;
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isHovered = hoveredSubject === i;
    ctx.font = isHovered ? 'bold 15px system-ui' : '13px system-ui';
    ctx.fillStyle = isHovered ? subjects[i].color : 'rgba(148,163,184,0.8)';
    ctx.fillText(`${subjects[i].icon} ${subjects[i].name}`, lx, ly);
  }

  // 数据多边形
  selectedModels.forEach((model) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = -Math.PI / 2 + idx * angleStep;
      const value = subjects[idx].scores[model as keyof SubjectScore] as number;
      const r = (radius * value) / 100;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    const color = modelColors[model];
    ctx.fillStyle = color + '18';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const value = subjects[i].scores[model as keyof SubjectScore] as number;
      const r = (radius * value) / 100;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, hoveredSubject === i ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
}

// ===================== 主组件 =====================

export default function GaokaoAI() {
  const [activeTab, setActiveTab] = useState<'radar' | 'detail' | 'quiz'>('radar');
  const [selectedModels, setSelectedModels] = useState<ModelKey[]>(['human_avg', 'gpt4', 'deepseek']);
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userGuesses, setUserGuesses] = useState<Record<number, Record<string, boolean>>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawRadar(canvasRef.current, subjects, selectedModels, hoveredSubject);
    }
  }, [selectedModels, hoveredSubject]);

  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [redraw]);

  const toggleModel = (m: ModelKey) => {
    setSelectedModels(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  // 出题逻辑
  const currentQ = quizQuestions[quizIndex];
  const modelKeys: (keyof QuizQuestion)[] = ['canGPT4Solve', 'canClaudeSolve', 'canDeepSeekSolve', 'canLlamaSolve'];
  const modelLabels = ['GPT-4o', 'Claude 3.5', 'DeepSeek V3', 'LLaMA 3 70B'];
  const modelKeyShort = ['gpt4', 'claude', 'deepseek', 'llama'];

  const handleGuess = (modelIdx: number, canSolve: boolean) => {
    setUserGuesses(prev => ({
      ...prev,
      [quizIndex]: { ...(prev[quizIndex] || {}), [modelKeyShort[modelIdx]]: canSolve }
    }));
  };

  const handleReveal = () => {
    setShowAnswer(true);
    // 计分
    const guesses = userGuesses[quizIndex] || {};
    let correct = 0;
    modelKeys.forEach((k, i) => {
      const actual = currentQ[k] as boolean;
      if (guesses[modelKeyShort[i]] === actual) correct++;
    });
    setQuizScore(prev => prev + correct);
    setQuizTotal(prev => prev + 4);
  };

  const nextQuestion = () => {
    setQuizIndex(prev => (prev + 1) % quizQuestions.length);
    setShowAnswer(false);
  };

  // 计算总分
  const calcTotal = (model: ModelKey) => {
    const total = subjects.reduce((sum, s) => sum + (s.scores[model as keyof SubjectScore] as number), 0);
    return Math.round(total / subjects.length * 7.5); // 满分 750
  };

  const tabs = [
    { key: 'radar' as const, label: '🎯 能力雷达', desc: '8 学科对比' },
    { key: 'detail' as const, label: '🔬 学科详情', desc: '细分能力拆解' },
    { key: 'quiz' as const, label: '🎮 出题挑战', desc: '你猜 AI 能答对吗' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div>{t.label}</div>
            <div className="text-xs mt-0.5 opacity-70">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ===== 雷达图标签页 ===== */}
      {activeTab === 'radar' && (
        <div>
          {/* 模型选择 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(Object.keys(modelColors) as ModelKey[]).map(m => (
              <button
                key={m}
                onClick={() => toggleModel(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedModels.includes(m)
                    ? 'text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-50'
                }`}
                style={selectedModels.includes(m) ? { backgroundColor: modelColors[m] } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: modelColors[m] }} />
                {modelNames[m]}
              </button>
            ))}
          </div>

          {/* 雷达图 */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: '420px' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                let angle = Math.atan2(y, x) + Math.PI / 2;
                if (angle < 0) angle += Math.PI * 2;
                const idx = Math.round((angle / (Math.PI * 2)) * subjects.length) % subjects.length;
                setHoveredSubject(idx);
              }}
              onMouseLeave={() => setHoveredSubject(null)}
              onClick={() => {
                if (hoveredSubject !== null) {
                  setSelectedSubject(hoveredSubject);
                  setActiveTab('detail');
                }
              }}
            />
          </div>

          {/* 总分排行 */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📊 高考总分估算（满分 750）</h3>
            <div className="space-y-3">
              {(Object.keys(modelColors) as ModelKey[])
                .sort((a, b) => calcTotal(b) - calcTotal(a))
                .map((m, i) => {
                  const score = calcTotal(m);
                  return (
                    <div key={m} className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold" style={{ color: modelColors[m] }}>
                        {i + 1}
                      </span>
                      <span className="w-24 text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">
                        {modelNames[m]}
                      </span>
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${(score / 750) * 100}%`,
                            backgroundColor: modelColors[m],
                          }}
                        >
                          <span className="text-xs font-bold text-white">{score}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              * 基于各学科百分制得分按等比例换算为 750 分制。实际高考中各科分值不同（语数英各 150，理综/文综 300），此处简化处理。
            </p>
          </div>

          {/* 洞察卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-5 border border-green-200/50 dark:border-green-800/30">
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-bold text-green-800 dark:text-green-300 mb-1">AI 碾压区</h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                英语阅读 (98/100)、史实记忆 (95/100)、代数计算 (96/100)。标准化的知识和计算是 AI 的绝对主场。
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-xl p-5 border border-red-200/50 dark:border-red-800/30">
              <div className="text-2xl mb-2">👤</div>
              <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">人类优势区</h4>
              <p className="text-sm text-red-700 dark:text-red-400">
                地图判读 (AI 55/100)、物理直觉 (AI 45/100)、作文真情 (AI 68/100)。感知、创造、真实体验——AI 还差得远。
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-xl p-5 border border-indigo-200/50 dark:border-indigo-800/30">
              <div className="text-2xl mb-2">💡</div>
              <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1">核心发现</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                AI 能考上 985，但考不上清北。顶尖学生靠的不是知识量，而是创造力、深度思维和真实感受——这些恰恰是 AI 最难习得的。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 学科详情标签页 ===== */}
      {activeTab === 'detail' && (
        <div>
          {/* 学科选择 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {subjects.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedSubject(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedSubject === i
                    ? 'text-white shadow-lg'
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
                style={selectedSubject === i ? { backgroundColor: subjects[i].color } : {}}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>

          {/* 学科卡片 */}
          {(() => {
            const subj = subjects[selectedSubject];
            return (
              <div className="space-y-6">
                {/* 概览 */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{subj.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{subj.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{subj.insight}</p>
                    </div>
                  </div>
                  {/* 模型得分条 */}
                  <div className="space-y-2 mt-4">
                    {(Object.keys(modelColors) as ModelKey[]).map(m => {
                      const score = subj.scores[m as keyof SubjectScore] as number;
                      return (
                        <div key={m} className="flex items-center gap-2">
                          <span className="w-20 text-xs text-right text-slate-500 dark:text-slate-400 shrink-0">{modelNames[m]}</span>
                          <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1.5"
                              style={{ width: `${score}%`, backgroundColor: modelColors[m] }}
                            >
                              <span className="text-[10px] font-bold text-white">{score}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 细分能力 */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">🔬 细分能力拆解</h4>
                  <div className="space-y-4">
                    {subj.subSkills.map((sk, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{sk.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sk.humanAdvantage
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                          }`}>
                            {sk.humanAdvantage ? '👤 人类更强' : '🤖 AI 更强'}
                          </span>
                        </div>
                        {/* 双条对比 */}
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-8 text-right text-slate-400">AI</span>
                            <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${sk.aiScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] w-6 text-slate-500">{sk.aiScore}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-8 text-right text-slate-400">人类</span>
                            <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                style={{ width: `${sk.humanScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] w-6 text-slate-500">{sk.humanScore}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{sk.insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI 优劣势总结 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-5 border border-green-200/50 dark:border-green-800/30">
                    <h4 className="font-bold text-green-800 dark:text-green-300 mb-2">🤖 AI 的强项</h4>
                    <p className="text-sm text-green-700 dark:text-green-400">{subj.aiStrength}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-xl p-5 border border-red-200/50 dark:border-red-800/30">
                    <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">👤 AI 的弱项</h4>
                    <p className="text-sm text-red-700 dark:text-red-400">{subj.aiWeakness}</p>
                  </div>
                </div>

                {subj.bookLink && (
                  <div className="text-center">
                    <a
                      href={subj.bookLink}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      📖 在《大模型全书》中深入了解
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== 出题挑战标签页 ===== */}
      {activeTab === 'quiz' && (
        <div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6">
            {/* 进度 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: subjects.find(s => s.name === currentQ.subject)?.color + '20', color: subjects.find(s => s.name === currentQ.subject)?.color }}>
                  {currentQ.subject}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  currentQ.difficulty === '简单' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  currentQ.difficulty === '中等' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                第 {quizIndex + 1} / {quizQuestions.length} 题
                {quizTotal > 0 && ` · 准确率 ${Math.round(quizScore / quizTotal * 100)}%`}
              </span>
            </div>

            {/* 题目 */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 mb-6">
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{currentQ.question}</p>
              <p className="text-xs text-slate-400 mt-2">人类平均正确率：{currentQ.humanAccuracy}%</p>
            </div>

            {/* 猜测区 */}
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">你觉得各模型能答对吗？</h4>
            <div className="space-y-3 mb-6">
              {modelLabels.map((label, i) => {
                const guess = userGuesses[quizIndex]?.[modelKeyShort[i]];
                const actual = currentQ[modelKeys[i]] as boolean;
                const isCorrectGuess = showAnswer && guess === actual;
                const isWrongGuess = showAnswer && guess !== undefined && guess !== actual;

                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    isCorrectGuess ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-400' :
                    isWrongGuess ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400' :
                    'bg-slate-50 dark:bg-slate-700/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: modelColors[modelKeyShort[i] as ModelKey] }} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => !showAnswer && handleGuess(i, true)}
                        disabled={showAnswer}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          guess === true
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                      >
                        ✅ 能
                      </button>
                      <button
                        onClick={() => !showAnswer && handleGuess(i, false)}
                        disabled={showAnswer}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          guess === false
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                      >
                        ❌ 不能
                      </button>
                      {showAnswer && (
                        <span className={`text-xs py-1 px-2 rounded-lg font-medium ${
                          actual ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {actual ? '实际能解' : '实际不能'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 揭晓/下一题 */}
            {!showAnswer ? (
              <button
                onClick={handleReveal}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                🎯 揭晓答案
              </button>
            ) : (
              <div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4 border border-indigo-200/50 dark:border-indigo-800/30">
                  <h5 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1">💡 解析</h5>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">{currentQ.explanation}</p>
                </div>
                <button
                  onClick={nextQuestion}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  下一题 →
                </button>
              </div>
            )}
          </div>

          {/* 统计 */}
          {quizTotal > 0 && (
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">📊 你的判断力</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {Math.round(quizScore / quizTotal * 100)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">准确率</div>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(quizScore / quizTotal) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>猜对 {quizScore} / {quizTotal} 个判断</span>
                    <span>
                      {quizScore / quizTotal >= 0.8 ? '🏆 AI 认知专家！' :
                       quizScore / quizTotal >= 0.6 ? '💪 了解 AI 的边界' :
                       '🤔 AI 的能力可能超出你的想象'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部信息 */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          数据基于 2025 年各模型在学科类 Benchmark 上的表现估算（MMLU、C-Eval、GAOKAO-Bench、AGIEval 等），仅供参考。
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <a href="/books/llm-complete/chapter-11" className="text-indigo-500 hover:text-indigo-600 transition-colors">📖 评估与 Benchmark →</a>
          <a href="/books/llm-complete/chapter-10" className="text-indigo-500 hover:text-indigo-600 transition-colors">📖 RLHF 与偏好对齐 →</a>
          <a href="/tools/data-quality-game" className="text-indigo-500 hover:text-indigo-600 transition-colors">🎲 训练数据猜猜乐 →</a>
        </div>
      </div>
    </div>
  );
}
