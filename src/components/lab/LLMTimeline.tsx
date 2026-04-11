import { useState, useRef, useEffect, useCallback } from 'react';

// ============ 时间线事件数据 ============
interface TimelineEvent {
  id: string;
  date: string;
  year: number;
  month: number;
  title: string;
  subtitle: string;
  description: string;
  impact: string;
  category: 'architecture' | 'scaling' | 'alignment' | 'opensource' | 'reasoning' | 'agent' | 'data';
  significance: 1 | 2 | 3; // 1=重要 2=里程碑 3=革命性
  links?: { label: string; href: string }[];
  techDetails?: string;
}

const categoryConfig: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  architecture: { label: '架构创新', color: '#818cf8', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', glow: 'rgba(129,140,248,0.4)' },
  scaling: { label: 'Scaling', color: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'rgba(52,211,153,0.4)' },
  alignment: { label: '对齐与安全', color: '#f472b6', bg: 'bg-pink-500/10', border: 'border-pink-500/30', glow: 'rgba(244,114,182,0.4)' },
  opensource: { label: '开源生态', color: '#fb923c', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'rgba(251,146,60,0.4)' },
  reasoning: { label: '推理革命', color: '#a78bfa', bg: 'bg-violet-500/10', border: 'border-violet-500/30', glow: 'rgba(167,139,250,0.4)' },
  agent: { label: 'Agent', color: '#22d3ee', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'rgba(34,211,238,0.4)' },
  data: { label: '数据工程', color: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'rgba(251,191,36,0.4)' },
};

const events: TimelineEvent[] = [
  {
    id: 'transformer',
    date: '2017.06',
    year: 2017,
    month: 6,
    title: 'Attention Is All You Need',
    subtitle: 'Transformer 架构诞生',
    description: 'Vaswani 等人在 Google 提出 Transformer，用纯注意力机制取代 RNN/CNN。这篇论文的标题成了整个时代的宣言。',
    impact: '奠定了此后所有大语言模型的架构基础，引用量超 13 万',
    category: 'architecture',
    significance: 3,
    techDetails: '多头自注意力（MHA）+ 位置编码 + 编码器-解码器结构',
    links: [
      { label: '第一章：注意力就是一切', href: '/books/key-moments/key-moments-ch1' },
      { label: '第二章：Transformer 架构详解', href: '/books/llm-complete/chapter-02-transformer' },
    ],
  },
  {
    id: 'gpt1',
    date: '2018.06',
    year: 2018,
    month: 6,
    title: 'GPT-1',
    subtitle: '预训练 + 微调范式开启',
    description: 'OpenAI 发布 GPT-1（1.17 亿参数），证明了「无监督预训练 + 有监督微调」的范式在 NLP 任务上的有效性。',
    impact: '开创了生成式预训练的技术路线',
    category: 'scaling',
    significance: 1,
    techDetails: '12 层 Transformer Decoder，BookCorpus 预训练',
  },
  {
    id: 'bert',
    date: '2018.10',
    year: 2018,
    month: 10,
    title: 'BERT',
    subtitle: '双向编码器的统治',
    description: 'Google 推出 BERT，在 11 项 NLP 基准上刷新 SOTA。MLM + NSP 预训练策略影响深远。',
    impact: 'NLP 进入预训练时代，但后来被 GPT 路线超越',
    category: 'architecture',
    significance: 2,
    techDetails: 'Masked Language Model + Next Sentence Prediction',
  },
  {
    id: 'gpt2',
    date: '2019.02',
    year: 2019,
    month: 2,
    title: 'GPT-2',
    subtitle: '"Too Dangerous to Release"',
    description: 'OpenAI 的 15 亿参数模型展现出惊人的文本生成能力，以"太危险"为由延迟开源，引发 AI 安全大讨论。',
    impact: '首次让公众意识到语言模型的潜力与风险',
    category: 'scaling',
    significance: 2,
    techDetails: '48 层，1.5B 参数，WebText 数据集',
  },
  {
    id: 'scaling-laws',
    date: '2020.01',
    year: 2020,
    month: 1,
    title: 'Kaplan Scaling Laws',
    subtitle: '幂律揭示规模的魔力',
    description: 'OpenAI 发现模型性能与参数量、数据量、计算量之间存在幂律关系——只要堆规模，Loss 就会可预测地下降。',
    impact: '为大模型军备竞赛提供了理论基础',
    category: 'scaling',
    significance: 3,
    techDetails: 'L(N) ∝ N^{-0.076}, L(D) ∝ D^{-0.095}',
    links: [
      { label: '第三章：Scaling Laws', href: '/books/key-moments/key-moments-ch3' },
      { label: 'Scaling Laws 游乐场', href: '/tools/scaling-laws-playground' },
    ],
  },
  {
    id: 'gpt3',
    date: '2020.05',
    year: 2020,
    month: 5,
    title: 'GPT-3',
    subtitle: '1750 亿参数的涌现',
    description: '175B 参数，Few-shot Learning 能力震惊学界。无需微调，仅靠 prompt 即可完成各种任务。',
    impact: '证明了足够大的模型会涌现出意想不到的能力',
    category: 'scaling',
    significance: 3,
    techDetails: '96 层，175B 参数，300B tokens 训练',
  },
  {
    id: 'rope',
    date: '2021.04',
    year: 2021,
    month: 4,
    title: 'RoPE 位置编码',
    subtitle: '旋转的力量',
    description: 'Su Jianlin 提出旋转位置编码（RoPE），优雅地将相对位置信息编码进注意力计算，成为后来几乎所有开源模型的标配。',
    impact: '从小众论文到行业基石，支撑了百万级上下文窗口',
    category: 'architecture',
    significance: 2,
    techDetails: '通过旋转矩阵将位置信息注入 Q、K 向量',
    links: [
      { label: '第四章：架构暗战', href: '/books/key-moments/key-moments-ch3b' },
    ],
  },
  {
    id: 'instructgpt',
    date: '2022.01',
    year: 2022,
    month: 1,
    title: 'InstructGPT / RLHF',
    subtitle: '人类偏好对齐',
    description: 'OpenAI 提出 InstructGPT，通过 RLHF（基于人类反馈的强化学习）让模型学会遵循人类指令，开启对齐时代。',
    impact: 'RLHF 成为后训练标配，对齐问题进入主流视野',
    category: 'alignment',
    significance: 2,
    techDetails: 'SFT → Reward Model → PPO 三阶段训练',
    links: [
      { label: 'RLHF 到 DPO 技术演进', href: '/articles/rlhf-to-dpo' },
    ],
  },
  {
    id: 'chinchilla',
    date: '2022.03',
    year: 2022,
    month: 3,
    title: 'Chinchilla',
    subtitle: '数据比参数更重要',
    description: 'DeepMind 的 Chinchilla 证明：当时的模型普遍"参数过多、数据不足"。70B 模型用足够多的数据能打败 280B 的 Gopher。',
    impact: '改写了大模型训练的经济学，让行业重新重视数据',
    category: 'scaling',
    significance: 3,
    techDetails: '最优配比 N:D ≈ 1:20（每参数 20 个 token）',
    links: [
      { label: '第五章：Scaling Laws', href: '/books/llm-complete/chapter-05-scaling-laws' },
      { label: '数据配比模拟器', href: '/tools/data-mix-simulator' },
    ],
  },
  {
    id: 'flash-attention',
    date: '2022.05',
    year: 2022,
    month: 5,
    title: 'FlashAttention',
    subtitle: '一个人改变行业效率',
    description: 'Tri Dao 提出 FlashAttention，通过 IO-aware 算法将注意力计算速度提升 2-4 倍，使长序列训练成为可能。',
    impact: '几乎所有训练框架和推理引擎都集成了 FlashAttention',
    category: 'architecture',
    significance: 2,
    techDetails: '分块计算 + 重计算策略，避免 O(n²) 显存占用',
    links: [
      { label: '第四章：架构暗战', href: '/books/key-moments/key-moments-ch3b' },
    ],
  },
  {
    id: 'chatgpt',
    date: '2022.11',
    year: 2022,
    month: 11,
    title: 'ChatGPT',
    subtitle: '改变世界的对话',
    description: '基于 GPT-3.5-turbo 的对话产品上线，5 天 100 万用户，2 个月 1 亿用户。AI 从实验室走向大众。',
    impact: '人类历史上增长最快的消费产品，引爆全球 AI 投资热潮',
    category: 'scaling',
    significance: 3,
    links: [
      { label: '第二章：ChatGPT 时刻', href: '/books/key-moments/key-moments-ch2' },
    ],
  },
  {
    id: 'llama',
    date: '2023.02',
    year: 2023,
    month: 2,
    title: 'LLaMA',
    subtitle: '开源觉醒',
    description: 'Meta 发布 LLaMA 系列（7B-65B），证明开源小模型经过精细训练可以接近 GPT-3。模型权重泄露后引发开源 LLM 爆发。',
    impact: '开启了开源大模型的黄金时代，架构成为开源标准',
    category: 'opensource',
    significance: 3,
    techDetails: 'RoPE + RMSNorm + SwiGLU + GQA，1.4T tokens 训练',
    links: [
      { label: '第五章：开源觉醒', href: '/books/key-moments/key-moments-ch4' },
    ],
  },
  {
    id: 'gpt4',
    date: '2023.03',
    year: 2023,
    month: 3,
    title: 'GPT-4',
    subtitle: '多模态与涌现的巅峰',
    description: 'OpenAI 发布 GPT-4，在律师考试、SAT 等专业考试中达到人类前 10% 水平，支持图像输入。',
    impact: 'AGI 讨论升温，"GPT-4 是否有通用智能"成为热门话题',
    category: 'scaling',
    significance: 2,
    techDetails: '据传 MoE 架构，8×220B 专家',
  },
  {
    id: 'dpo',
    date: '2023.05',
    year: 2023,
    month: 5,
    title: 'DPO',
    subtitle: '告别奖励模型',
    description: 'Rafailov 等人提出 Direct Preference Optimization，将 RLHF 简化为一个简单的二元交叉熵损失，训练效率大幅提升。',
    impact: '降低了对齐训练的门槛，成为开源社区的首选方案',
    category: 'alignment',
    significance: 2,
    techDetails: '直接从偏好对中学习，无需训练 Reward Model',
    links: [
      { label: 'RLHF 到 DPO 技术演进', href: '/articles/rlhf-to-dpo' },
    ],
  },
  {
    id: 'llama2',
    date: '2023.07',
    year: 2023,
    month: 7,
    title: 'Llama 2',
    subtitle: '开源商用的里程碑',
    description: 'Meta 开放 Llama 2 商用许可，7B/13B/70B 全系列。附带了详细的 RLHF 训练报告，开源社区的标准底座。',
    impact: '真正的商用级开源大模型，推动了行业民主化',
    category: 'opensource',
    significance: 2,
    techDetails: '2T tokens 预训练，GQA，100K+ RLHF 标注',
  },
  {
    id: 'mixtral',
    date: '2023.12',
    year: 2023,
    month: 12,
    title: 'Mixtral 8×7B',
    subtitle: 'MoE 的开源验证',
    description: 'Mistral AI 发布 Mixtral，用 8 个 7B 专家的 MoE 架构，在只激活 2 个专家的情况下匹敌 Llama 2 70B 的性能。',
    impact: '证明 MoE 是提高效率的正确方向，MoE 从异端变正统',
    category: 'architecture',
    significance: 2,
    techDetails: '8 专家 × 7B，Top-2 路由，实际推理仅用 12.9B 参数',
    links: [
      { label: '第四章：架构暗战', href: '/books/key-moments/key-moments-ch3b' },
    ],
  },
  {
    id: 'deepseek-v2',
    date: '2024.05',
    year: 2024,
    month: 5,
    title: 'DeepSeek-V2',
    subtitle: 'MLA + MoE 的完美融合',
    description: 'DeepSeek 推出 Multi-head Latent Attention（MLA），将 KV Cache 压缩 93.3%，配合 MoE 实现了极致的推理效率。',
    impact: '刷新了"中国大模型只会跟随"的偏见，引领架构创新',
    category: 'architecture',
    significance: 2,
    techDetails: 'MLA（低秩压缩 KV）+ DeepSeekMoE（细粒度 + 共享专家）',
    links: [
      { label: 'DeepSeek 系列技术解读', href: '/research/deepseek-technical-report' },
    ],
  },
  {
    id: 'llama3',
    date: '2024.07',
    year: 2024,
    month: 7,
    title: 'Llama 3.1 405B',
    subtitle: '开源追赶闭源',
    description: 'Meta 发布 405B 参数的 Llama 3.1，性能接近 GPT-4，首次让开源模型站到了闭源模型的同一水平线。',
    impact: '证明开源路线的可行性，压缩了闭源的护城河',
    category: 'opensource',
    significance: 2,
    techDetails: '15.6T tokens 训练，128K 上下文，over-training 策略',
  },
  {
    id: 'deepseek-v3',
    date: '2024.12',
    year: 2024,
    month: 12,
    title: 'DeepSeek-V3',
    subtitle: '557 万美元的奇迹',
    description: '671B 参数的 MoE 模型，训练成本仅 557 万美元（约为 GPT-4 的 1/20），性能达到 GPT-4o 水平。FP8 混合精度训练 + 无辅助损失负载均衡。',
    impact: '彻底改变了行业对训练成本的认知，"暴力规模"不再是唯一路径',
    category: 'scaling',
    significance: 3,
    techDetails: '256 路由专家 + 1 共享专家，14.8T tokens，FP8 训练',
    links: [
      { label: 'DeepSeek 系列技术解读', href: '/research/deepseek-technical-report' },
    ],
  },
  {
    id: 'deepseek-r1',
    date: '2025.01',
    year: 2025,
    month: 1,
    title: 'DeepSeek-R1',
    subtitle: '推理模型的民主化',
    description: 'R1-Zero 实验证明：纯 RL 训练（GRPO）即可让模型涌现出 Chain-of-Thought 推理能力，不需要人工标注的推理过程数据。',
    impact: '打破 o1 的神秘感，推理模型不再是 OpenAI 独家秘技',
    category: 'reasoning',
    significance: 3,
    techDetails: 'GRPO（不需要 Critic 网络的 RL），可验证奖励，蒸馏至小模型',
    links: [
      { label: '第六章：推理革命', href: '/books/key-moments/key-moments-ch5' },
    ],
  },
  {
    id: 'mcp',
    date: '2025.03',
    year: 2025,
    month: 3,
    title: 'MCP 标准化',
    subtitle: '工具使用的 USB 时刻',
    description: 'Anthropic 提出的 Model Context Protocol 被行业广泛采纳，为 AI Agent 与外部工具的交互提供了统一标准。',
    impact: 'AI Agent 生态开始成型，模型从"对话"走向"行动"',
    category: 'agent',
    significance: 2,
    techDetails: 'JSON-RPC 2.0 + 标准化工具描述 + 资源管理',
    links: [
      { label: '第七章：从对话到行动', href: '/books/key-moments/key-moments-ch6' },
    ],
  },
  {
    id: 'future',
    date: '2026+',
    year: 2026,
    month: 6,
    title: '未完的革命',
    subtitle: '下一个转折点在哪里？',
    description: '数据墙、合成数据第二代、多模态统一、Agent 协作……大模型的故事远未结束。',
    impact: '你正在见证的，可能就是下一个关键时刻',
    category: 'agent',
    significance: 1,
    links: [
      { label: '第八章：未完的战争', href: '/books/key-moments/key-moments-ch7' },
    ],
  },
];

// ============ 粒子系统 ============
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

function createParticle(w: number, h: number, color: string): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.1,
    color,
    life: 0,
    maxLife: Math.random() * 300 + 200,
  };
}

// ============ 主组件 ============
export default function LLMTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<TimelineEvent | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const [filter, setFilter] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // 检测暗色模式
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 粒子动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // 初始化粒子
    const colors = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#22d3ee', '#a78bfa'];
    for (let i = 0; i < 60; i++) {
      particlesRef.current.push(createParticle(canvas.width, canvas.height, colors[i % colors.length]));
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 进度渐变背景光晕
      const progress = scrollProgress;
      const hue1 = 220 + progress * 30; // 蓝→紫
      const hue2 = 280 + progress * 40; // 紫→金
      const grd = ctx.createRadialGradient(
        canvas.width * (0.3 + progress * 0.4), canvas.height * 0.5,
        0,
        canvas.width * 0.5, canvas.height * 0.5,
        canvas.width * 0.6
      );
      grd.addColorStop(0, `hsla(${hue1}, 60%, 60%, ${isDark ? 0.06 : 0.04})`);
      grd.addColorStop(0.5, `hsla(${hue2}, 50%, 50%, ${isDark ? 0.03 : 0.02})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 更新和绘制粒子
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife || p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) {
          particlesRef.current[i] = createParticle(canvas.width, canvas.height, colors[Math.floor(Math.random() * colors.length)]);
          return;
        }

        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(lifeRatio * 5, 1);
        const fadeOut = Math.max(1 - (lifeRatio - 0.8) * 5, 0);
        const alpha = p.opacity * fadeIn * (lifeRatio > 0.8 ? fadeOut : 1);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');

        // 简化: 直接设置 globalAlpha
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 粒子之间的连线
      const maxDist = 100;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = isDark ? `rgba(148,163,184,${0.06 * (1 - dist / maxDist)})` : `rgba(100,116,139,${0.04 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [scrollProgress, isDark]);

  // 滚动进度
  const handleScroll = useCallback(() => {
    if (!timelineRef.current) return;
    const el = timelineRef.current;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(el.scrollLeft / maxScroll);
    }
  }, []);

  // 过滤后的事件
  const filteredEvents = filter ? events.filter(e => e.category === filter) : events;

  // 年份标记
  const years = [...new Set(events.map(e => e.year))];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* Canvas 粒子背景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div className="relative z-10">
        {/* 标题区 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                LLM 编年史
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              从 Transformer 到 Agent —— 九年间改变世界的 {events.length} 个关键时刻
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              水平滚动探索 · 点击节点查看详情
            </p>
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !filter
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              全部 ({events.length})
            </button>
            {Object.entries(categoryConfig).map(([key, cfg]) => {
              const count = events.filter(e => e.category === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(filter === key ? null : key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filter === key
                      ? 'text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  style={filter === key ? { backgroundColor: cfg.color } : undefined}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 时间线主体 - 水平滚动 */}
        <div
          ref={timelineRef}
          onScroll={handleScroll}
          className="overflow-x-auto pb-8 scrollbar-thin"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="relative px-8 sm:px-12" style={{ minWidth: `${Math.max(filteredEvents.length * 260, 1200)}px` }}>
            {/* 年份标记 */}
            <div className="flex items-center h-8 mb-2">
              {years.map(year => {
                const firstEvent = filteredEvents.find(e => e.year === year);
                if (!firstEvent) return null;
                const idx = filteredEvents.indexOf(firstEvent);
                return (
                  <div
                    key={year}
                    className="absolute text-xs font-bold text-slate-400 dark:text-slate-500"
                    style={{ left: `${idx * 260 + 20}px` }}
                  >
                    {year}
                  </div>
                );
              })}
            </div>

            {/* 时间轴线 */}
            <div className="relative h-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full mb-8">
              {/* 进度条 */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${scrollProgress * 100}%` }}
              />

              {/* 事件节点 */}
              {filteredEvents.map((event, idx) => {
                const cfg = categoryConfig[event.category];
                const isActive = activeEvent?.id === event.id;
                const isHovered = hoveredId === event.id;
                const size = event.significance === 3 ? 20 : event.significance === 2 ? 16 : 12;

                return (
                  <button
                    key={event.id}
                    onClick={() => setActiveEvent(isActive ? null : event)}
                    onMouseEnter={() => setHoveredId(event.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-all duration-300 group"
                    style={{
                      left: `${(idx / (filteredEvents.length - 1)) * 100}%`,
                      zIndex: isActive || isHovered ? 30 : 10,
                    }}
                  >
                    {/* 光晕效果 */}
                    {(isActive || isHovered || event.significance === 3) && (
                      <div
                        className={`absolute inset-0 rounded-full ${isActive ? 'animate-ping' : 'animate-pulse'}`}
                        style={{
                          width: size + 12,
                          height: size + 12,
                          left: -(size + 12 - size) / 2,
                          top: -(size + 12 - size) / 2,
                          backgroundColor: cfg.glow,
                          opacity: isActive ? 0.6 : 0.3,
                        }}
                      />
                    )}

                    {/* 节点 */}
                    <div
                      className={`rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? 'scale-150 shadow-lg'
                          : isHovered
                            ? 'scale-125 shadow-md'
                            : 'hover:scale-110'
                      }`}
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: cfg.color,
                        borderColor: isActive ? '#fff' : cfg.color,
                        boxShadow: isActive ? `0 0 20px ${cfg.glow}` : 'none',
                      }}
                    />

                    {/* 日期标签 */}
                    <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono transition-all duration-200 ${
                      isActive || isHovered ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {event.date}
                    </div>

                    {/* 标题浮动标签 */}
                    <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-200 ${
                      isActive || isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    }`}>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-semibold shadow-xl backdrop-blur-sm">
                        {event.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 事件卡片 */}
            <div className="flex gap-4 pt-8">
              {filteredEvents.map((event) => {
                const cfg = categoryConfig[event.category];
                const isActive = activeEvent?.id === event.id;

                return (
                  <div
                    key={event.id}
                    className={`flex-shrink-0 w-[240px] transition-all duration-500 cursor-pointer ${
                      isActive ? 'scale-105' : 'hover:scale-[1.02]'
                    }`}
                    onClick={() => setActiveEvent(isActive ? null : event)}
                  >
                    <div className={`h-full rounded-xl border transition-all duration-300 ${
                      isActive
                        ? `border-2 shadow-xl ${cfg.border}`
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md'
                    } bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden`}
                      style={isActive ? { boxShadow: `0 8px 30px ${cfg.glow}` } : undefined}
                    >
                      {/* 顶部渐变条 */}
                      <div className="h-1" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

                      <div className="p-4">
                        {/* 分类和日期 */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} border ${cfg.border}`} style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {event.date}
                          </span>
                        </div>

                        {/* 标题 */}
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 leading-snug">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">
                          {event.subtitle}
                        </p>

                        {/* 重要性指示 */}
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i <= event.significance ? '' : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                              style={i <= event.significance ? { backgroundColor: cfg.color } : undefined}
                            />
                          ))}
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-1">
                            {event.significance === 3 ? '革命性' : event.significance === 2 ? '里程碑' : '重要'}
                          </span>
                        </div>

                        {/* 展开详情 */}
                        <div className={`transition-all duration-500 overflow-hidden ${
                          isActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-1 space-y-3">
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {event.description}
                            </p>

                            {/* 影响 */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">影响</div>
                              <p className="text-xs text-slate-700 dark:text-slate-300">{event.impact}</p>
                            </div>

                            {/* 技术细节 */}
                            {event.techDetails && (
                              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">技术要点</div>
                                <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{event.techDetails}</p>
                              </div>
                            )}

                            {/* 站内链接 */}
                            {event.links && event.links.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">深入阅读</div>
                                {event.links.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link.href}
                                    className="block text-xs px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    style={{ color: cfg.color }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    → {link.label}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 折叠指示 */}
                        {!isActive && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部统计 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '关键事件', value: events.length, suffix: '个' },
              { label: '时间跨度', value: '9', suffix: '年' },
              { label: '革命性突破', value: events.filter(e => e.significance === 3).length, suffix: '次' },
              { label: '技术领域', value: Object.keys(categoryConfig).length, suffix: '个' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 推荐阅读 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">想了解完整的故事？</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="/books/key-moments"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                阅读《大模型的关键时刻》
              </a>
              <a
                href="/books/llm-complete"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
              >
                阅读《大模型全书》
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
