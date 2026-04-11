import { useState, useRef, useEffect, useCallback } from 'react';

// ======== 汉字部件数据 ========
// 常见偏旁部首及其语义
interface Radical {
  char: string;
  name: string;
  meaning: string;
  position: 'left' | 'right' | 'top' | 'bottom' | 'surround' | 'inner';
}

const RADICALS: Record<string, Radical[]> = {
  // 左右结构
  '明': [{ char: '日', name: '日字旁', meaning: '光明、时间', position: 'left' }, { char: '月', name: '月字旁', meaning: '月亮、身体', position: 'right' }],
  '好': [{ char: '女', name: '女字旁', meaning: '女性、美好', position: 'left' }, { char: '子', name: '子', meaning: '孩子、后代', position: 'right' }],
  '林': [{ char: '木', name: '木字旁', meaning: '树木、自然', position: 'left' }, { char: '木', name: '木', meaning: '树木、生长', position: 'right' }],
  '河': [{ char: '氵', name: '三点水', meaning: '水、流动', position: 'left' }, { char: '可', name: '可', meaning: '可以、许可', position: 'right' }],
  '他': [{ char: '亻', name: '单人旁', meaning: '人、行为', position: 'left' }, { char: '也', name: '也', meaning: '同样', position: 'right' }],
  '话': [{ char: '讠', name: '言字旁', meaning: '语言、说', position: 'left' }, { char: '舌', name: '舌', meaning: '舌头、味道', position: 'right' }],
  '时': [{ char: '日', name: '日字旁', meaning: '光明、时间', position: 'left' }, { char: '寸', name: '寸', meaning: '尺度、法度', position: 'right' }],
  '情': [{ char: '忄', name: '竖心旁', meaning: '心灵、情感', position: 'left' }, { char: '青', name: '青', meaning: '年轻、纯净', position: 'right' }],
  '理': [{ char: '王', name: '王字旁', meaning: '玉、珍贵', position: 'left' }, { char: '里', name: '里', meaning: '里面、道理', position: 'right' }],
  '做': [{ char: '亻', name: '单人旁', meaning: '人、行为', position: 'left' }, { char: '故', name: '故', meaning: '缘故、经历', position: 'right' }],
  '想': [{ char: '相', name: '相', meaning: '相互、观察', position: 'top' }, { char: '心', name: '心字底', meaning: '内心、思考', position: 'bottom' }],
  '花': [{ char: '艹', name: '草字头', meaning: '植物、花草', position: 'top' }, { char: '化', name: '化', meaning: '变化、转化', position: 'bottom' }],
  '安': [{ char: '宀', name: '宝盖头', meaning: '房屋、安宁', position: 'top' }, { char: '女', name: '女', meaning: '女性、安定', position: 'bottom' }],
  '字': [{ char: '宀', name: '宝盖头', meaning: '房屋、庇护', position: 'top' }, { char: '子', name: '子', meaning: '孩子、种子', position: 'bottom' }],
  '星': [{ char: '日', name: '日', meaning: '光明、发光', position: 'top' }, { char: '生', name: '生', meaning: '生命、诞生', position: 'bottom' }],
  '意': [{ char: '音', name: '音', meaning: '声音、表达', position: 'top' }, { char: '心', name: '心', meaning: '内心、想法', position: 'bottom' }],
  '思': [{ char: '田', name: '田', meaning: '田地、耕耘', position: 'top' }, { char: '心', name: '心', meaning: '内心、思考', position: 'bottom' }],
  '雷': [{ char: '雨', name: '雨字头', meaning: '天气、降水', position: 'top' }, { char: '田', name: '田', meaning: '田地、大地', position: 'bottom' }],
  '梦': [{ char: '林', name: '林', meaning: '茂密、繁多', position: 'top' }, { char: '夕', name: '夕', meaning: '夜晚、日暮', position: 'bottom' }],
  '爱': [{ char: '爫', name: '爪字头', meaning: '手、抓取', position: 'top' }, { char: '友', name: '友', meaning: '友谊、友善', position: 'bottom' }],
  '国': [{ char: '囗', name: '方框', meaning: '边界、围绕', position: 'surround' }, { char: '玉', name: '玉', meaning: '珍宝、美好', position: 'inner' }],
  '园': [{ char: '囗', name: '方框', meaning: '边界、围绕', position: 'surround' }, { char: '元', name: '元', meaning: '起始、本源', position: 'inner' }],
  '回': [{ char: '囗', name: '外框', meaning: '循环、重复', position: 'surround' }, { char: '口', name: '口', meaning: '嘴巴、出口', position: 'inner' }],
};

// 所有可用的部件
const ALL_PARTS = Array.from(new Set(
  Object.values(RADICALS).flatMap((rs) => rs.map((r) => ({ char: r.char, meaning: r.meaning, position: r.position })))
));

// 为不在字典中的字生成部件（确定性）
function getRadicalsForChar(char: string): Radical[] {
  if (RADICALS[char]) return RADICALS[char];

  const code = char.charCodeAt(0);
  if (code < 0x4e00 || code > 0x9fff) {
    return [{ char, name: char, meaning: '符号', position: 'left' }];
  }

  // 用码点确定性地选两个部件
  const idx1 = code % ALL_PARTS.length;
  const idx2 = (code * 7 + 13) % ALL_PARTS.length;
  const part1 = ALL_PARTS[idx1];
  const part2 = ALL_PARTS[idx2 === idx1 ? (idx2 + 1) % ALL_PARTS.length : idx2];

  const positions: Array<[Radical['position'], Radical['position']]> = [
    ['left', 'right'], ['top', 'bottom'], ['surround', 'inner'],
  ];
  const posIdx = (code >> 4) % 3;
  const [pos1, pos2] = positions[posIdx];

  return [
    { char: part1.char, name: part1.char, meaning: part1.meaning, position: pos1 },
    { char: part2.char, name: part2.char, meaning: part2.meaning, position: pos2 },
  ];
}

// 合成新字
function crossbreed(char1: string, char2: string): {
  parent1: Radical[];
  parent2: Radical[];
  child: Radical[];
  childName: string;
  childMeaning: string;
  pronunciation: string;
} {
  const p1 = getRadicalsForChar(char1);
  const p2 = getRadicalsForChar(char2);

  // 从每个亲本各取一个部件
  const code1 = char1.charCodeAt(0);
  const code2 = char2.charCodeAt(0);

  const pick1 = p1[code2 % p1.length];
  const pick2 = p2[code1 % p2.length];

  // 决定组合方式
  const combinedHash = (code1 + code2) % 3;
  let pos1: Radical['position'], pos2: Radical['position'];
  if (combinedHash === 0) { pos1 = 'left'; pos2 = 'right'; }
  else if (combinedHash === 1) { pos1 = 'top'; pos2 = 'bottom'; }
  else { pos1 = 'surround'; pos2 = 'inner'; }

  const child: Radical[] = [
    { ...pick1, position: pos1 },
    { ...pick2, position: pos2 },
  ];

  // 生成读音（取两字声母韵母杂交）
  const tones = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ū', 'ú', 'ǔ', 'ù'];
  const initials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
  const finals = ['an', 'en', 'in', 'un', 'ang', 'eng', 'ing', 'ong', 'ai', 'ei', 'ao', 'ou', 'ia', 'ie', 'iu', 'uo'];

  const initial = initials[(code1 + code2) % initials.length];
  const final = finals[(code1 * code2) % finals.length];
  const tone = tones[(code1 ^ code2) % tones.length];
  const pronunciation = `${initial}${final} (${tone})`;

  // 生成含义（组合两个部件的语义）
  const meanings = [
    `兼具${pick1.meaning.split('、')[0]}和${pick2.meaning.split('、')[0]}的特质`,
    `${pick1.meaning.split('、')[0]}中的${pick2.meaning.split('、')[0]}`,
    `像${pick1.meaning.split('、')[0]}一样的${pick2.meaning.split('、')[0]}`,
    `在${pick2.meaning.split('、')[0]}中寻找${pick1.meaning.split('、')[0]}`,
  ];
  const childMeaning = meanings[(code1 + code2) % meanings.length];

  const childName = `${pick1.char}+${pick2.char}`;

  return { parent1: p1, parent2: p2, child, childName, childMeaning, pronunciation };
}

export default function CharacterGenetics() {
  const [char1, setChar1] = useState('');
  const [char2, setChar2] = useState('');
  const [result, setResult] = useState<ReturnType<typeof crossbreed> | null>(null);
  const [animating, setAnimating] = useState(false);
  const childCanvasRef = useRef<HTMLCanvasElement>(null);

  const doCross = useCallback(() => {
    if (!char1.trim() || !char2.trim()) return;
    const c1 = char1.trim()[0];
    const c2 = char2.trim()[0];
    setAnimating(true);
    setTimeout(() => {
      setResult(crossbreed(c1, c2));
      setAnimating(false);
    }, 800);
  }, [char1, char2]);

  // 绘制新字
  useEffect(() => {
    if (!result || !childCanvasRef.current) return;
    const canvas = childCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    // 背景
    ctx.fillStyle = 'rgba(99,102,241,0.05)';
    ctx.fillRect(0, 0, size, size);

    // 米字格
    ctx.strokeStyle = 'rgba(99,102,241,0.15)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, 0); ctx.lineTo(size, size);
    ctx.moveTo(size, 0); ctx.lineTo(0, size);
    ctx.stroke();
    ctx.setLineDash([]);

    // 边框
    ctx.strokeStyle = 'rgba(99,102,241,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // 绘制组合字 (用两个部件的位置关系)
    const [part1, part2] = result.child;
    ctx.font = 'bold 60px "Noto Serif SC", "Source Han Serif SC", serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (part1.position === 'left' && part2.position === 'right') {
      ctx.fillStyle = 'rgb(99,102,241)';
      ctx.font = 'bold 52px "Noto Serif SC", "Source Han Serif SC", serif, system-ui';
      ctx.fillText(part1.char, size * 0.3, size * 0.5);
      ctx.fillStyle = 'rgb(236,72,153)';
      ctx.fillText(part2.char, size * 0.7, size * 0.5);
    } else if (part1.position === 'top' && part2.position === 'bottom') {
      ctx.fillStyle = 'rgb(99,102,241)';
      ctx.font = 'bold 48px "Noto Serif SC", "Source Han Serif SC", serif, system-ui';
      ctx.fillText(part1.char, size * 0.5, size * 0.32);
      ctx.fillStyle = 'rgb(236,72,153)';
      ctx.fillText(part2.char, size * 0.5, size * 0.68);
    } else {
      // surround + inner
      ctx.fillStyle = 'rgba(99,102,241,0.3)';
      ctx.font = 'bold 80px "Noto Serif SC", "Source Han Serif SC", serif, system-ui';
      ctx.fillText(part1.char, size * 0.5, size * 0.5);
      ctx.fillStyle = 'rgb(236,72,153)';
      ctx.font = 'bold 40px "Noto Serif SC", "Source Han Serif SC", serif, system-ui';
      ctx.fillText(part2.char, size * 0.5, size * 0.52);
    }
  }, [result]);

  const structureNames: Record<string, string> = {
    'left-right': '左右结构',
    'top-bottom': '上下结构',
    'surround-inner': '包围结构',
  };

  return (
    <div className="space-y-6">
      {/* 输入 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 justify-center">
          <div className="text-center">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">亲本 A</label>
            <input
              type="text"
              value={char1}
              onChange={(e) => setChar1(e.target.value)}
              maxLength={1}
              placeholder="输入一个字"
              className="w-24 h-24 text-center text-4xl font-bold bg-indigo-50 dark:bg-indigo-950 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="text-3xl text-slate-300 dark:text-slate-600 font-bold mt-6">×</div>

          <div className="text-center">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">亲本 B</label>
            <input
              type="text"
              value={char2}
              onChange={(e) => setChar2(e.target.value)}
              maxLength={1}
              placeholder="输入一个字"
              className="w-24 h-24 text-center text-4xl font-bold bg-pink-50 dark:bg-pink-950 border-2 border-pink-200 dark:border-pink-700 rounded-xl focus:ring-2 focus:ring-pink-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="text-3xl text-slate-300 dark:text-slate-600 font-bold mt-6">=</div>

          <div className="text-center">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">后代</label>
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              {animating ? (
                <div className="animate-spin text-2xl">🧬</div>
              ) : result ? (
                <canvas ref={childCanvasRef} className="w-full h-full" style={{ width: 96, height: 96 }} />
              ) : (
                <span className="text-slate-300 dark:text-slate-600 text-3xl">?</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={doCross}
            disabled={!char1.trim() || !char2.trim() || animating}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-40 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            {animating ? '基因重组中...' : '开始杂交'}
          </button>
        </div>
      </div>

      {/* 基因报告 */}
      {result && !animating && (
        <div className="space-y-4">
          {/* 亲本分析 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800 p-5">
              <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                亲本 A：「{char1.trim()[0]}」的基因
              </h3>
              <div className="space-y-2">
                {result.parent1.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{r.char}</span>
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{r.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({r.meaning})</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                      {r.position === 'left' ? '左' : r.position === 'right' ? '右' : r.position === 'top' ? '上' : r.position === 'bottom' ? '下' : r.position === 'surround' ? '外' : '内'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-pink-50 dark:bg-pink-950/50 rounded-xl border border-pink-200 dark:border-pink-800 p-5">
              <h3 className="text-sm font-semibold text-pink-600 dark:text-pink-400 mb-3">
                亲本 B：「{char2.trim()[0]}」的基因
              </h3>
              <div className="space-y-2">
                {result.parent2.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{r.char}</span>
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{r.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({r.meaning})</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400">
                      {r.position === 'left' ? '左' : r.position === 'right' ? '右' : r.position === 'top' ? '上' : r.position === 'bottom' ? '下' : r.position === 'surround' ? '外' : '内'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 后代基因报告 */}
          <div className="bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-indigo-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">后代基因报告</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <div className="text-sm text-slate-500 mb-1">结构</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {structureNames[`${result.child[0].position}-${result.child[1].position}`] || '复合结构'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <div className="text-sm text-slate-500 mb-1">推测读音</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{result.pronunciation}</div>
              </div>
              <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <div className="text-sm text-slate-500 mb-1">推测含义</div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{result.childMeaning}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-100/50 dark:bg-indigo-900/30">
                <span className="text-xl">{result.child[0].char}</span>
                <div className="text-sm">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">来自亲本 A</span>
                  <span className="text-slate-500 ml-1">· {result.child[0].meaning}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-100/50 dark:bg-pink-900/30">
                <span className="text-xl">{result.child[1].char}</span>
                <div className="text-sm">
                  <span className="text-pink-600 dark:text-pink-400 font-medium">来自亲本 B</span>
                  <span className="text-slate-500 ml-1">· {result.child[1].meaning}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        <p>输入两个汉字，它们的偏旁部首会像基因一样"杂交"，产生一个全新的文字</p>
        <p className="mt-1">汉字的造字法本身就是一种组合艺术——六书之中的形声、会意，都是古人的"基因工程"</p>
      </div>
    </div>
  );
}
