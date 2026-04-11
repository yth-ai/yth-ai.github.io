import { useState, useRef, useEffect, useCallback } from 'react';

// ======== 文本 → 视觉映射 ========

// 情感色调映射
const WARM_WORDS = ['爱', '火', '热', '阳', '暖', '红', '快乐', '幸福', '开心', '激动', '热情', '光', '太阳', '夏', '温'];
const COLD_WORDS = ['冰', '雪', '冷', '蓝', '寒', '静', '安', '月', '夜', '水', '海', '深', '雨', '秋', '冬'];
const DARK_WORDS = ['黑', '暗', '死', '悲', '痛', '苦', '怒', '恨', '灰', '孤', '独', '泪', '碎'];
const BRIGHT_WORDS = ['光', '白', '明', '晴', '新', '春', '花', '笑', '梦', '星', '虹', '金', '灿'];

function analyzeSentiment(text: string): { warmth: number; brightness: number } {
  let warmScore = 0, coldScore = 0, darkScore = 0, brightScore = 0;

  for (const char of text) {
    if (WARM_WORDS.some((w) => w.includes(char))) warmScore++;
    if (COLD_WORDS.some((w) => w.includes(char))) coldScore++;
    if (DARK_WORDS.some((w) => w.includes(char))) darkScore++;
    if (BRIGHT_WORDS.some((w) => w.includes(char))) brightScore++;
  }

  const total = Math.max(1, warmScore + coldScore + darkScore + brightScore);
  const warmth = (warmScore - coldScore) / total;   // -1 ~ 1
  const brightness = (brightScore - darkScore) / total;  // -1 ~ 1

  return { warmth, brightness };
}

// 标点映射到形状
type Shape = 'circle' | 'curve' | 'sharp' | 'line' | 'dot' | 'wave';
function punctuationToShape(char: string): Shape | null {
  if ('。.'.includes(char)) return 'circle';
  if ('，,、'.includes(char)) return 'curve';
  if ('！!'.includes(char)) return 'sharp';
  if ('——…'.includes(char)) return 'line';
  if ('？?'.includes(char)) return 'wave';
  if ('：:；;'.includes(char)) return 'dot';
  return null;
}

// 确定性随机 (seeded)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// HSL 颜色
function hsl(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export default function TextToArt() {
  const [text, setText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [artGenerated, setArtGenerated] = useState(false);

  const generateArt = useCallback(() => {
    if (!text.trim() || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 800;
    const h = 600;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${w}/${h}`;
    ctx.scale(dpr, dpr);

    // 文本分析
    const { warmth, brightness } = analyzeSentiment(text);
    const charCount = text.length;
    const complexity = Math.min(charCount / 5, 20); // 字数→复杂度

    // 确定性种子
    let seedValue = 0;
    for (let i = 0; i < text.length; i++) seedValue += text.charCodeAt(i) * (i + 1);
    const rng = seededRandom(seedValue);

    // 色调：warmth 决定色相范围
    const baseHue = warmth > 0 ? 0 + warmth * 30 : 200 + Math.abs(warmth) * 40;
    const baseSat = 50 + Math.abs(warmth) * 30;
    const baseLit = brightness > 0 ? 50 + brightness * 20 : 30 + brightness * 10;

    // 背景
    const bgHue = (baseHue + 180) % 360;
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, hsl(bgHue, 15, brightness > 0 ? 95 : 12));
    bgGrad.addColorStop(1, hsl(bgHue, 20, brightness > 0 ? 88 : 5));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 收集标点形状
    const shapes: { shape: Shape; position: number }[] = [];
    text.split('').forEach((char, i) => {
      const s = punctuationToShape(char);
      if (s) shapes.push({ shape: s, position: i / text.length });
    });

    // 每个字符生成一个视觉元素
    const chars = text.split('');
    chars.forEach((char, i) => {
      const code = char.charCodeAt(0);
      const posRatio = i / chars.length;

      // 用字符码点作为随机种子偏移
      const x = (rng() * 0.6 + 0.2) * w;
      const y = (rng() * 0.6 + 0.2) * h;
      const size = 10 + rng() * complexity * 3;
      const hue = (baseHue + (code % 60) - 30 + 360) % 360;
      const sat = Math.max(20, baseSat + (rng() - 0.5) * 30);
      const lit = Math.max(20, Math.min(80, baseLit + (rng() - 0.5) * 20));
      const alpha = 0.15 + rng() * 0.5;

      ctx.fillStyle = hsl(hue, sat, lit, alpha);
      ctx.strokeStyle = hsl(hue, sat, lit, alpha * 0.5);
      ctx.lineWidth = 1 + rng() * 2;

      // 汉字 → 主要绘制抽象形状
      if (code >= 0x4e00 && code <= 0x9fff) {
        const strokeCount = (code % 5) + 3;
        // 笔画数决定形状复杂度
        if (strokeCount <= 4) {
          // 简单字 → 圆形
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        } else if (strokeCount <= 6) {
          // 中等字 → 多边形
          ctx.beginPath();
          const sides = strokeCount;
          for (let s = 0; s <= sides; s++) {
            const angle = (s / sides) * Math.PI * 2 - Math.PI / 2;
            const r = size * (0.8 + rng() * 0.4);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // 复杂字 → 不规则形状
          ctx.beginPath();
          for (let s = 0; s < 8; s++) {
            const angle = (s / 8) * Math.PI * 2;
            const r = size * (0.5 + rng() * 0.8);
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (s === 0) ctx.moveTo(px, py);
            else {
              const cpx = x + Math.cos(angle - 0.3) * r * 1.2;
              const cpy = y + Math.sin(angle - 0.3) * r * 1.2;
              ctx.quadraticCurveTo(cpx, cpy, px, py);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      // 标点 → 特殊形状
      const pShape = punctuationToShape(char);
      if (pShape) {
        ctx.strokeStyle = hsl(hue, sat, lit, 0.6);
        ctx.lineWidth = 2;
        switch (pShape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'curve':
            ctx.beginPath();
            ctx.moveTo(x - size, y);
            ctx.quadraticCurveTo(x, y - size * 2, x + size, y);
            ctx.stroke();
            break;
          case 'sharp':
            ctx.beginPath();
            ctx.moveTo(x, y - size * 2);
            ctx.lineTo(x - size * 0.5, y + size);
            ctx.lineTo(x + size * 0.5, y + size);
            ctx.closePath();
            ctx.stroke();
            break;
          case 'line':
            ctx.beginPath();
            ctx.moveTo(x - size * 2, y);
            ctx.lineTo(x + size * 2, y);
            ctx.stroke();
            break;
          case 'wave':
            ctx.beginPath();
            ctx.moveTo(x - size * 1.5, y);
            ctx.bezierCurveTo(x - size * 0.5, y - size, x + size * 0.5, y + size, x + size * 1.5, y);
            ctx.stroke();
            break;
          case 'dot':
            for (let d = 0; d < 3; d++) {
              ctx.beginPath();
              ctx.arc(x + d * size * 0.8, y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
      }
    });

    // 连接线（字符间的关系）
    ctx.globalAlpha = 0.05;
    const points: { x: number; y: number }[] = [];
    const rng2 = seededRandom(seedValue);
    chars.forEach(() => {
      points.push({
        x: (rng2() * 0.6 + 0.2) * w,
        y: (rng2() * 0.6 + 0.2) * h,
      });
    });

    ctx.strokeStyle = hsl(baseHue, 30, 50);
    ctx.lineWidth = 0.5;
    for (let i = 0; i < points.length - 1; i++) {
      if (rng2() > 0.5) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // 纹理层
    for (let i = 0; i < 50; i++) {
      const tx = rng() * w;
      const ty = rng() * h;
      ctx.fillStyle = hsl(baseHue, 10, 50, 0.02);
      ctx.beginPath();
      ctx.arc(tx, ty, rng() * 30 + 5, 0, Math.PI * 2);
      ctx.fill();
    }

    setArtGenerated(true);
  }, [text]);

  // 下载图片
  const downloadArt = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `art-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const { warmth, brightness } = text ? analyzeSentiment(text) : { warmth: 0, brightness: 0 };

  return (
    <div className="space-y-6">
      {/* 输入 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">输入一句话</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写点什么……任何一句话都会变成一幅独一无二的画"
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
        />

        {text.trim() && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-slate-500">
              <span>字数: {text.length}</span>
              <span>色温: <span className={warmth > 0 ? 'text-red-400' : 'text-blue-400'}>{warmth > 0 ? '暖' : warmth < 0 ? '冷' : '中性'}</span></span>
              <span>明度: <span className={brightness > 0 ? 'text-amber-400' : 'text-slate-400'}>{brightness > 0 ? '明亮' : brightness < 0 ? '深沉' : '平衡'}</span></span>
            </div>
            <button
              onClick={generateArt}
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
            >
              生成画作
            </button>
          </div>
        )}
      </div>

      {/* 画布 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: artGenerated ? 'block' : 'none' }}
        />
        {!artGenerated && (
          <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <p className="text-center">
              <span className="text-4xl block mb-2">🎨</span>
              写一句话，看它变成什么样的画
            </p>
          </div>
        )}
      </div>

      {artGenerated && (
        <div className="flex justify-center">
          <button
            onClick={downloadArt}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
          >
            下载图片
          </button>
        </div>
      )}

      {/* 规则说明 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">映射规则</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">情感 → 色调</h4>
            <ul className="space-y-1 text-slate-500">
              <li>温暖的字（爱、火、阳...）→ 暖色调（红/橙/黄）</li>
              <li>冷静的字（冰、雪、海...）→ 冷色调（蓝/青/紫）</li>
              <li>明亮的字（光、花、笑...）→ 高明度</li>
              <li>暗沉的字（黑、暗、悲...）→ 低明度</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">标点 → 形状</h4>
            <ul className="space-y-1 text-slate-500">
              <li>句号（。）→ 圆圈</li>
              <li>逗号（，）→ 曲线</li>
              <li>感叹号（！）→ 三角/尖锐线条</li>
              <li>破折号（——）→ 直线</li>
              <li>问号（？）→ 波浪</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">字数 → 复杂度</h4>
            <p className="text-slate-500">字越多，画面元素越丰富</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Unicode → 种子</h4>
            <p className="text-slate-500">每个字的编码决定元素的精确位置——同一句话永远生成同一幅画</p>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        <p>这不是 AI 生成的画——是纯数学映射。在 AI 生图泛滥的时代，确定性的美也有它的价值。</p>
      </div>
    </div>
  );
}
