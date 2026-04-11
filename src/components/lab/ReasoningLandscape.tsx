import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============================================================
// Types & Data
// ============================================================

interface ReasoningStep {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized, higher = more correct
  text: string;
  isCorrect?: boolean;
}

interface ReasoningPath {
  id: string;
  label: string;
  color: string;
  steps: ReasoningStep[];
  description: string;
}

interface Puzzle {
  id: string;
  title: string;
  question: string;
  answer: string;
  paths: ReasoningPath[];
  insight: string;
}

// Pre-computed reasoning paths for 5 classic puzzles
const PUZZLES: Puzzle[] = [
  {
    id: 'coin-flip',
    title: '硬币翻转谜题',
    question: '一枚硬币正面朝上。翻转 1 次后正面朝上，翻转 2 次后反面朝上，翻转 3 次后正面朝上。请问：翻转 100 次后，哪面朝上？',
    answer: '翻转 100 次（偶数次），正面朝上。每次翻转改变一次状态，偶数次回到初始。',
    paths: [
      {
        id: 'cot',
        label: 'Chain-of-Thought',
        color: '#3b82f6',
        description: '逐步推理：先建立规律，再推广',
        steps: [
          { x: 0, y: 0.5, text: '初始状态：正面朝上' },
          { x: 0.12, y: 0.55, text: '翻转1次→反面。翻转2次→正面。发现模式...' },
          { x: 0.25, y: 0.6, text: '规律：奇数次→反面，偶数次→正面' },
          { x: 0.4, y: 0.7, text: '验证：翻转3次→反面 ✓ 翻转4次→正面 ✓' },
          { x: 0.55, y: 0.75, text: '100是偶数' },
          { x: 0.7, y: 0.85, text: '偶数次翻转回到初始状态' },
          { x: 0.85, y: 0.92, text: '所以100次后正面朝上' },
          { x: 1, y: 0.95, text: '答案：正面朝上 ✓', isCorrect: true },
        ],
      },
      {
        id: 'tot',
        label: 'Tree-of-Thought',
        color: '#8b5cf6',
        description: '多分支探索：同时考虑多种可能',
        steps: [
          { x: 0, y: 0.5, text: '分析问题结构' },
          { x: 0.1, y: 0.55, text: '分支A：数学归纳法 / 分支B：模拟法 / 分支C：奇偶性' },
          { x: 0.2, y: 0.62, text: '分支C最有前途：奇偶性分析' },
          { x: 0.35, y: 0.7, text: '评估：翻转操作的本质是状态切换' },
          { x: 0.5, y: 0.78, text: '合并：n次翻转后状态 = 初始状态 XOR (n%2)' },
          { x: 0.65, y: 0.88, text: '100%2=0，XOR 0 = 不变' },
          { x: 0.8, y: 0.93, text: '多分支验证一致' },
          { x: 1, y: 0.95, text: '答案：正面朝上 ✓', isCorrect: true },
        ],
      },
      {
        id: 'intuition',
        label: '直觉快答',
        color: '#ef4444',
        description: '快速响应，容易被表面信息误导',
        steps: [
          { x: 0, y: 0.5, text: '100次翻转...' },
          { x: 0.15, y: 0.45, text: '100太大了，翻这么多次...' },
          { x: 0.35, y: 0.35, text: '直觉：翻这么多次应该是随机的？' },
          { x: 0.55, y: 0.3, text: '掉入陷阱：大数字≠随机' },
          { x: 0.75, y: 0.25, text: '回答：无法确定 / 50%概率' },
          { x: 1, y: 0.2, text: '答案错误 ✗', isCorrect: false },
        ],
      },
    ],
    insight: 'CoT 通过发现"奇偶规律"绕开了大数字的迷惑性。Tree-of-Thought 则从数学本质出发，更快收敛到正确答案。直觉在面对大数字时容易错误地联想到随机性。',
  },
  {
    id: 'river-crossing',
    title: '狼羊菜过河',
    question: '一个农夫带着狼、羊和一棵白菜要过河。船一次只能带农夫和另一样东西。如果农夫不在，狼会吃羊，羊会吃白菜。如何安全过河？',
    answer: '1.带羊过河 → 2.空手回 → 3.带狼过河 → 4.带羊回 → 5.带白菜过河 → 6.空手回 → 7.带羊过河',
    paths: [
      {
        id: 'cot',
        label: 'Chain-of-Thought',
        color: '#3b82f6',
        description: '逐步约束消除',
        steps: [
          { x: 0, y: 0.5, text: '列出约束：狼+羊❌ 羊+菜❌' },
          { x: 0.12, y: 0.55, text: '第一步必须带羊（羊是冲突中心）' },
          { x: 0.25, y: 0.6, text: '第二步回来，带狼或菜都可以' },
          { x: 0.38, y: 0.65, text: '带狼过去，但狼和羊不能单独留...' },
          { x: 0.5, y: 0.55, text: '等等，带狼过去后羊在对岸...' },
          { x: 0.6, y: 0.65, text: '关键：需要把羊带回来！' },
          { x: 0.72, y: 0.78, text: '然后带白菜过去，狼和菜安全' },
          { x: 0.85, y: 0.88, text: '最后回来带羊' },
          { x: 1, y: 0.95, text: '完成！7步解决 ✓', isCorrect: true },
        ],
      },
      {
        id: 'tot',
        label: 'Tree-of-Thought',
        color: '#8b5cf6',
        description: '状态空间搜索',
        steps: [
          { x: 0, y: 0.5, text: '建模：状态=(左岸集合, 右岸集合, 船位)' },
          { x: 0.15, y: 0.6, text: '初始=(狼羊菜农, 空, 左)' },
          { x: 0.25, y: 0.7, text: '展开所有合法下一步...' },
          { x: 0.35, y: 0.75, text: '剪枝：排除违反约束的状态' },
          { x: 0.5, y: 0.82, text: 'BFS发现最短路径=7步' },
          { x: 0.65, y: 0.88, text: '两条解法路径（带狼先或带菜先）' },
          { x: 0.8, y: 0.92, text: '验证两条路径都合法' },
          { x: 1, y: 0.95, text: '找到所有最优解 ✓', isCorrect: true },
        ],
      },
      {
        id: 'intuition',
        label: '直觉快答',
        color: '#ef4444',
        description: '贪心策略容易陷入死胡同',
        steps: [
          { x: 0, y: 0.5, text: '先带最危险的狼？' },
          { x: 0.2, y: 0.4, text: '带狼过河...但羊会吃菜！' },
          { x: 0.4, y: 0.35, text: '那先带菜？...狼会吃羊！' },
          { x: 0.6, y: 0.45, text: '好吧先带羊，然后带狼...' },
          { x: 0.8, y: 0.35, text: '但不知道要把羊带回来这一步' },
          { x: 1, y: 0.3, text: '卡住了 ✗', isCorrect: false },
        ],
      },
    ],
    insight: '这道题的关键是"反直觉操作"——把已经运过去的羊带回来。CoT 在中途陷入过困难但通过约束检查自救。ToT 通过系统化搜索直接找到最优解。直觉的贪心策略（不走回头路）导致卡死。',
  },
  {
    id: 'hat-puzzle',
    title: '帽子颜色推理',
    question: 'A、B、C 三人排成一列，每人头上有红帽或蓝帽。C 能看到 A 和 B，B 能看到 A，A 什么都看不到。帽子分配：2红1蓝。C 说"我不知道"，B 说"我不知道"，问 A 的帽子什么颜色？',
    answer: '红色。C如果看到两顶蓝帽就能确定自己是红帽，C不知道→A和B不全是蓝→至少一顶红。B知道这个推理，如果B看到A是蓝帽，B就知道自己是红帽。B不知道→A不是蓝帽→A是红帽。',
    paths: [
      {
        id: 'cot',
        label: 'Chain-of-Thought',
        color: '#3b82f6',
        description: '逐层推理消除',
        steps: [
          { x: 0, y: 0.5, text: '从C的视角开始分析' },
          { x: 0.15, y: 0.55, text: 'C说不知道→C看到的A+B不全是蓝色' },
          { x: 0.28, y: 0.62, text: '也就是A和B至少有一顶红帽' },
          { x: 0.42, y: 0.7, text: '现在B知道C的推理结果' },
          { x: 0.55, y: 0.75, text: 'B看到A的帽子。如果A是蓝...' },
          { x: 0.68, y: 0.82, text: '...那"至少一顶红"就一定是B自己→B应该知道' },
          { x: 0.82, y: 0.9, text: '但B说不知道→A不是蓝色' },
          { x: 1, y: 0.95, text: 'A是红色 ✓', isCorrect: true },
        ],
      },
      {
        id: 'tot',
        label: 'Tree-of-Thought',
        color: '#8b5cf6',
        description: '穷举所有可能的帽子分配',
        steps: [
          { x: 0, y: 0.5, text: '2红1蓝，列举所有分配' },
          { x: 0.12, y: 0.58, text: 'A红B红C蓝 / A红B蓝C红 / A蓝B红C红' },
          { x: 0.28, y: 0.65, text: '检查每种情况下C能否判断...' },
          { x: 0.42, y: 0.72, text: 'A蓝B红C红→C看到蓝红→不确定 ✓' },
          { x: 0.55, y: 0.78, text: '但如果是A蓝B红→B看到A蓝→B知道自己红' },
          { x: 0.7, y: 0.85, text: 'B说不知道→排除A蓝B红C红' },
          { x: 0.85, y: 0.92, text: '剩下A红B红C蓝和A红B蓝C红' },
          { x: 1, y: 0.95, text: 'A都是红色 ✓', isCorrect: true },
        ],
      },
      {
        id: 'intuition',
        label: '直觉快答',
        color: '#ef4444',
        description: '忽略高阶推理',
        steps: [
          { x: 0, y: 0.5, text: '2红1蓝，A是红的概率更大...' },
          { x: 0.2, y: 0.48, text: '但C和B都不知道说明什么？' },
          { x: 0.4, y: 0.42, text: '直觉觉得信息不够...' },
          { x: 0.6, y: 0.38, text: '猜红色？但不确定推理链' },
          { x: 0.8, y: 0.4, text: '答案碰巧对了但推理不对' },
          { x: 1, y: 0.45, text: '答案对了但理由错误 ⚠', isCorrect: false },
        ],
      },
    ],
    insight: '这是经典的"共同知识"推理——每个人不仅知道自己看到的，还知道别人的推理过程。CoT 完美复现了这种逐层消除。直觉可能猜对答案，但无法给出正确推理过程——在需要解释"为什么"的场景中这很致命。',
  },
  {
    id: 'monty-hall',
    title: '蒙提霍尔问题',
    question: '你参加游戏节目。面前有3扇门，一扇后面是汽车（大奖），另两扇后面是山羊。你选了1号门。主持人打开了3号门露出山羊。主持人问：你要不要换到2号门？',
    answer: '换！不换中奖概率1/3，换了中奖概率2/3。你的初始选择有1/3概率对，所以奖品在另外两扇门后的概率是2/3。主持人帮你排除了一扇错误门，2/3集中到剩下那扇。',
    paths: [
      {
        id: 'cot',
        label: 'Chain-of-Thought',
        color: '#3b82f6',
        description: '概率推理',
        steps: [
          { x: 0, y: 0.5, text: '初始选择1号门，中奖概率1/3' },
          { x: 0.15, y: 0.52, text: '所以奖品在2号或3号的概率=2/3' },
          { x: 0.3, y: 0.58, text: '主持人知道答案，必定打开有山羊的门' },
          { x: 0.45, y: 0.65, text: '3号被排除，但2/3的概率没有消失' },
          { x: 0.6, y: 0.75, text: '2/3的概率现在全部集中在2号门' },
          { x: 0.75, y: 0.85, text: '换门：2/3 vs 不换：1/3' },
          { x: 0.88, y: 0.92, text: '换门的期望收益是不换的两倍' },
          { x: 1, y: 0.95, text: '应该换门 ✓', isCorrect: true },
        ],
      },
      {
        id: 'tot',
        label: 'Tree-of-Thought',
        color: '#8b5cf6',
        description: '穷举所有情况',
        steps: [
          { x: 0, y: 0.5, text: '列举：车在1/2/3号门，各概率1/3' },
          { x: 0.15, y: 0.58, text: '情况1：车在1号→不换赢' },
          { x: 0.3, y: 0.65, text: '情况2：车在2号→换赢' },
          { x: 0.45, y: 0.72, text: '情况3：车在3号→换赢（等等不对，3号被打开了）' },
          { x: 0.55, y: 0.78, text: '修正情况3：车在3号但主持人不会开3号→回到条件概率' },
          { x: 0.7, y: 0.85, text: '正确统计：换赢2/3，不换赢1/3' },
          { x: 0.85, y: 0.92, text: '多角度验证一致' },
          { x: 1, y: 0.95, text: '应该换门 ✓', isCorrect: true },
        ],
      },
      {
        id: 'intuition',
        label: '直觉快答',
        color: '#ef4444',
        description: '等概率错觉',
        steps: [
          { x: 0, y: 0.5, text: '3号门排除了...' },
          { x: 0.2, y: 0.48, text: '现在就两扇门，应该是50:50吧？' },
          { x: 0.4, y: 0.42, text: '换不换无所谓，各一半概率' },
          { x: 0.6, y: 0.35, text: '坚持最初选择——心理锚定效应' },
          { x: 0.8, y: 0.28, text: '不换！' },
          { x: 1, y: 0.25, text: '错过2倍优势 ✗', isCorrect: false },
        ],
      },
    ],
    insight: '蒙提霍尔问题是反直觉概率的经典案例。关键洞察：主持人的行为不是随机的——他一定会打开有山羊的门。这个"信息注入"使得概率不对称。直觉的"两扇门各50%"忽略了条件概率。数学家 Paul Erdős 最初也做错了这题。',
  },
  {
    id: 'water-jug',
    title: '量水问题',
    question: '你有一个5升壶和一个3升壶，需要精确量出4升水。怎么做？',
    answer: '1.装满5升壶 → 2.倒入3升壶直到满（5升壶剩2升）→ 3.倒掉3升壶 → 4.把2升倒入3升壶 → 5.装满5升壶 → 6.倒入3升壶直到满（只能再装1升）→ 5升壶剩4升',
    paths: [
      {
        id: 'cot',
        label: 'Chain-of-Thought',
        color: '#3b82f6',
        description: '正向模拟',
        steps: [
          { x: 0, y: 0.5, text: '4=5-1，所以需要得到1升' },
          { x: 0.12, y: 0.55, text: '1=3-2，所以需要得到2升' },
          { x: 0.25, y: 0.62, text: '2=5-3，倒满5升壶再倒入3升壶' },
          { x: 0.38, y: 0.68, text: '5升壶装满→倒入3升壶→5升壶剩2升' },
          { x: 0.5, y: 0.74, text: '清空3升壶，把2升倒进去' },
          { x: 0.62, y: 0.8, text: '再装满5升壶' },
          { x: 0.75, y: 0.88, text: '倒入3升壶（只能再装1升）→5升壶剩4升' },
          { x: 1, y: 0.95, text: '4升到手 ✓', isCorrect: true },
        ],
      },
      {
        id: 'tot',
        label: 'Tree-of-Thought',
        color: '#8b5cf6',
        description: '双向BFS搜索',
        steps: [
          { x: 0, y: 0.5, text: '状态空间：(5升壶水量, 3升壶水量)' },
          { x: 0.15, y: 0.6, text: '初始(0,0)→目标(4,*)' },
          { x: 0.3, y: 0.7, text: '操作：装满/倒空/互倒' },
          { x: 0.45, y: 0.78, text: 'BFS展开：(5,0)→(2,3)→(2,0)→(0,2)→(5,2)→(4,3)' },
          { x: 0.6, y: 0.85, text: '6步到达！同时发现另一条路径' },
          { x: 0.75, y: 0.9, text: '备选：(0,3)→(3,0)→(3,3)→(5,1)→(0,1)→(1,0)→(1,3)→(4,0)' },
          { x: 0.88, y: 0.93, text: '第一条路径更短' },
          { x: 1, y: 0.95, text: '最优解6步 ✓', isCorrect: true },
        ],
      },
      {
        id: 'intuition',
        label: '直觉快答',
        color: '#ef4444',
        description: '试错法',
        steps: [
          { x: 0, y: 0.5, text: '5-3=2...2+2=4？没有办法直接得到两个2' },
          { x: 0.2, y: 0.45, text: '随机尝试各种倒法...' },
          { x: 0.4, y: 0.4, text: '没有明确策略，在状态间打转' },
          { x: 0.6, y: 0.42, text: '可能偶然碰到答案，也可能循环' },
          { x: 0.8, y: 0.38, text: '效率极低，无法保证找到解' },
          { x: 1, y: 0.35, text: '运气好就对，运气差就死循环 ✗', isCorrect: false },
        ],
      },
    ],
    insight: 'CoT 的"目标分解"策略非常有效——4=5-1, 1=3-2, 2=5-3，逆向规划正向执行。ToT 把问题变成图搜索，保证找到最优解。随机试错虽然可能碰到答案，但没有系统性保证。这也是为什么 LLM 配合推理框架会比纯采样靠谱得多。',
  },
];

// Terrain generation: simple 2D noise for background
function generateTerrain(w: number, h: number): number[][] {
  const grid: number[][] = [];
  const scale = 0.015;
  // Simple pseudo-noise using sin
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      const v = (
        Math.sin(x * scale * 3.7 + y * scale * 2.3) * 0.3 +
        Math.sin(x * scale * 1.1 - y * scale * 4.1 + 1.5) * 0.25 +
        Math.sin((x + y) * scale * 2.8 + 0.7) * 0.2 +
        Math.cos(x * scale * 5.2 - y * scale * 1.7) * 0.15 +
        0.5
      );
      grid[y][x] = Math.max(0, Math.min(1, v));
    }
  }
  return grid;
}

// ============================================================
// Canvas Terrain Renderer
// ============================================================

function TerrainCanvas({
  width,
  height,
  paths,
  activeStep,
  activePath,
  onStepClick,
  isDark,
}: {
  width: number;
  height: number;
  paths: ReasoningPath[];
  activeStep: number;
  activePath: string;
  onStepClick: (pathId: string, stepIdx: number) => void;
  isDark: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrain = useMemo(() => generateTerrain(width, height), [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Draw terrain
    const imgData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = terrain[y][x];
        const idx = (y * width + x) * 4;
        if (isDark) {
          // Dark mode: low=dark blue, high=bright teal
          imgData.data[idx] = Math.floor(15 + v * 30);     // R
          imgData.data[idx + 1] = Math.floor(23 + v * 80); // G
          imgData.data[idx + 2] = Math.floor(42 + v * 60); // B
        } else {
          // Light mode: low=dark green-blue, high=light green-yellow
          imgData.data[idx] = Math.floor(200 + v * 50);     // R
          imgData.data[idx + 1] = Math.floor(210 + v * 40); // G
          imgData.data[idx + 2] = Math.floor(180 + v * 50); // B
        }
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Contour lines
    const contourLevels = [0.3, 0.45, 0.6, 0.75];
    ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.15)';
    ctx.lineWidth = 0.5;
    for (const level of contourLevels) {
      ctx.beginPath();
      for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
          const v = terrain[y][x];
          const vr = terrain[y][x + 1];
          const vb = terrain[y + 1]?.[x] ?? v;
          if ((v < level && vr >= level) || (v >= level && vr < level)) {
            ctx.moveTo(x + 0.5, y);
            ctx.lineTo(x + 0.5, y + 1);
          }
          if ((v < level && vb >= level) || (v >= level && vb < level)) {
            ctx.moveTo(x, y + 0.5);
            ctx.lineTo(x + 1, y + 0.5);
          }
        }
      }
      ctx.stroke();
    }

    // "Correct" region glow at top
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)');
    grd.addColorStop(0.4, 'transparent');
    grd.addColorStop(0.7, 'transparent');
    grd.addColorStop(1, isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    // Labels
    ctx.font = '10px system-ui';
    ctx.fillStyle = isDark ? 'rgba(34,197,94,0.5)' : 'rgba(22,163,74,0.6)';
    ctx.fillText('正确推理高地', 10, 16);
    ctx.fillStyle = isDark ? 'rgba(239,68,68,0.4)' : 'rgba(220,38,38,0.5)';
    ctx.fillText('错误推理低洼', 10, height - 8);

    // Draw paths
    const padding = { x: 40, y: 30 };
    const plotW = width - padding.x * 2;
    const plotH = height - padding.y * 2;

    for (const path of paths) {
      const steps = path.steps;
      const isActive = activePath === path.id;

      // Path line
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = isActive ? 3 : 1.5;
      ctx.globalAlpha = isActive ? 0.9 : 0.35;
      ctx.setLineDash(path.id === 'intuition' ? [4, 4] : []);

      for (let i = 0; i < steps.length; i++) {
        const sx = padding.x + steps[i].x * plotW;
        const sy = padding.y + (1 - steps[i].y) * plotH;
        if (i === 0) ctx.moveTo(sx, sy);
        else {
          // Smooth curve
          const prev = steps[i - 1];
          const px = padding.x + prev.x * plotW;
          const py = padding.y + (1 - prev.y) * plotH;
          const cx = (px + sx) / 2;
          ctx.bezierCurveTo(cx, py, cx, sy, sx, sy);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Step dots
      for (let i = 0; i < steps.length; i++) {
        const sx = padding.x + steps[i].x * plotW;
        const sy = padding.y + (1 - steps[i].y) * plotH;
        const isActiveStep = isActive && i <= activeStep;
        const isCurrentStep = isActive && i === activeStep;

        ctx.beginPath();
        ctx.arc(sx, sy, isCurrentStep ? 7 : isActiveStep ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isActiveStep ? path.color : (isDark ? '#334155' : '#cbd5e1');
        ctx.fill();

        if (isCurrentStep) {
          ctx.beginPath();
          ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          ctx.strokeStyle = path.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Final step marker
        if (i === steps.length - 1) {
          ctx.font = 'bold 12px system-ui';
          ctx.fillStyle = steps[i].isCorrect ? '#22c55e' : '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText(steps[i].isCorrect ? '✓' : '✗', sx, sy - 12);
          ctx.textAlign = 'start';
        }
      }
    }
  }, [terrain, paths, activeStep, activePath, width, height, isDark]);

  // Handle click on canvas to detect step
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const padding = { x: 40, y: 30 };
    const plotW = width - padding.x * 2;
    const plotH = height - padding.y * 2;

    let bestDist = 20;
    let bestPath = '';
    let bestStep = -1;

    for (const path of paths) {
      for (let i = 0; i < path.steps.length; i++) {
        const sx = padding.x + path.steps[i].x * plotW;
        const sy = padding.y + (1 - path.steps[i].y) * plotH;
        const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
        if (d < bestDist) {
          bestDist = d;
          bestPath = path.id;
          bestStep = i;
        }
      }
    }

    if (bestPath && bestStep >= 0) {
      onStepClick(bestPath, bestStep);
    }
  }, [paths, width, height, onStepClick]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: 'pointer' }}
      onClick={handleClick}
      className="rounded-xl"
    />
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ReasoningLandscape() {
  const [selectedPuzzle, setSelectedPuzzle] = useState(0);
  const [activePath, setActivePath] = useState('cot');
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const animTimer = useRef<ReturnType<typeof setTimeout>>(0);

  // Dark mode detection
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const puzzle = PUZZLES[selectedPuzzle];
  const currentPath = puzzle.paths.find(p => p.id === activePath)!;
  const currentStep = currentPath.steps[Math.min(activeStep, currentPath.steps.length - 1)];

  // Reset on puzzle change
  useEffect(() => {
    setActivePath('cot');
    setActiveStep(0);
    setShowAnswer(false);
    setIsAnimating(false);
    clearTimeout(animTimer.current);
  }, [selectedPuzzle]);

  // Animation: auto-advance steps
  const startAnimation = useCallback(() => {
    setActiveStep(0);
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    if (activeStep >= currentPath.steps.length - 1) {
      setIsAnimating(false);
      return;
    }
    animTimer.current = setTimeout(() => {
      setActiveStep(s => s + 1);
    }, 1200);
    return () => clearTimeout(animTimer.current);
  }, [isAnimating, activeStep, currentPath.steps.length]);

  const handleStepClick = useCallback((pathId: string, stepIdx: number) => {
    setActivePath(pathId);
    setActiveStep(stepIdx);
    setIsAnimating(false);
  }, []);

  // Canvas dimensions
  const canvasW = 640;
  const canvasH = 380;

  return (
    <div className="space-y-6">
      {/* Puzzle selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PUZZLES.map((p, i) => (
          <button key={p.id} onClick={() => setSelectedPuzzle(i)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              selectedPuzzle === i
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-300 dark:border-indigo-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
            }`}>
            {p.title}
          </button>
        ))}
      </div>

      {/* Question */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{puzzle.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{puzzle.question}</p>
      </div>

      {/* Terrain visualization */}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
        style={{ maxWidth: canvasW }}>
        <TerrainCanvas
          width={canvasW}
          height={canvasH}
          paths={puzzle.paths}
          activeStep={activeStep}
          activePath={activePath}
          onStepClick={handleStepClick}
          isDark={isDark}
        />
      </div>

      {/* Path selector + controls */}
      <div className="flex flex-wrap items-center gap-3">
        {puzzle.paths.map(p => (
          <button key={p.id}
            onClick={() => { setActivePath(p.id); setActiveStep(0); setIsAnimating(false); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activePath === p.id
                ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            style={activePath === p.id ? { backgroundColor: p.color, ringColor: p.color } : undefined}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activePath === p.id ? '#fff' : p.color }} />
            {p.label}
          </button>
        ))}

        <div className="flex-1" />

        <button onClick={startAnimation}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-all">
          {isAnimating ? '动画中...' : '播放路径'}
        </button>
      </div>

      {/* Current step info */}
      <div className="p-4 rounded-xl border-2 transition-all"
        style={{
          borderColor: currentPath.color + '40',
          backgroundColor: currentPath.color + '08',
        }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentPath.color }} />
          <span className="text-sm font-medium text-slate-900 dark:text-white">{currentPath.label}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            步骤 {Math.min(activeStep + 1, currentPath.steps.length)} / {currentPath.steps.length}
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300">{currentStep.text}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">{currentPath.description}</p>

        {/* Step navigation */}
        <div className="flex gap-1 mt-3">
          {currentPath.steps.map((_, i) => (
            <button key={i} onClick={() => { setActiveStep(i); setIsAnimating(false); }}
              className="w-6 h-1.5 rounded-full transition-all"
              style={{
                backgroundColor: i <= activeStep ? currentPath.color : (isDark ? '#334155' : '#e2e8f0'),
                opacity: i === activeStep ? 1 : 0.5,
              }} />
          ))}
        </div>
      </div>

      {/* Answer reveal */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <button onClick={() => setShowAnswer(!showAnswer)}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          {showAnswer ? '收起答案与洞察' : '查看答案与洞察 →'}
        </button>

        {showAnswer && (
          <div className="mt-3 space-y-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">正确答案</div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{puzzle.answer}</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
              <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">推理洞察</div>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">{puzzle.insight}</p>
            </div>
          </div>
        )}
      </div>

      {/* Educational footer */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">关于推理策略</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex gap-2">
            <span className="shrink-0 w-3 h-3 mt-0.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <span><strong className="text-slate-700 dark:text-slate-300">Chain-of-Thought</strong>——一步步推理，适合线性问题。路径最长但最稳妥。</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 w-3 h-3 mt-0.5 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
            <span><strong className="text-slate-700 dark:text-slate-300">Tree-of-Thought</strong>——多分支探索+回溯，适合需要搜索的问题。更快找到最优解。</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 w-3 h-3 mt-0.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span><strong className="text-slate-700 dark:text-slate-300">直觉快答</strong>——System 1 思维。快但容易掉入认知陷阱。对应无 CoT 的模型推理。</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
        灵感来源: TMLR 2026 "Landscape of Thoughts" · 推理路径为教学目的预计算，非真实模型输出
      </div>
    </div>
  );
}
