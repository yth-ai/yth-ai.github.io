import { useState, useRef, useCallback, useEffect } from 'react';

// ======== 笔画 → 音符映射 ========
// 汉字基本笔画: 横(héng)=1, 竖(shù)=2, 撇(piě)=3, 捺(nà)=4, 点(diǎn)=5
// 折(zhé)=6, 钩(gōu)=7, 提(tí)=8
// 映射到音阶: C4, D4, E4, F4, G4, A4, B4, C5

const STROKE_NOTES: Record<number, { note: string; freq: number; solfege: string }> = {
  1: { note: 'C4', freq: 261.63, solfege: 'do' },
  2: { note: 'D4', freq: 293.66, solfege: 're' },
  3: { note: 'E4', freq: 329.63, solfege: 'mi' },
  4: { note: 'F4', freq: 349.23, solfege: 'fa' },
  5: { note: 'G4', freq: 392.0, solfege: 'sol' },
  6: { note: 'A4', freq: 440.0, solfege: 'la' },
  7: { note: 'B4', freq: 493.88, solfege: 'si' },
  8: { note: 'C5', freq: 523.25, solfege: 'do\'' },
};

// 常用汉字的笔画序列数据 (简化版: 用 Unicode 码点 hash 模拟)
// 真实笔画太多无法全覆盖，这里用确定性算法从字的编码生成合理的笔画序列
function getStrokeSequence(char: string): number[] {
  const code = char.charCodeAt(0);
  if (code < 0x4e00 || code > 0x9fff) {
    // 不是汉字，用简单映射
    return [(code % 8) + 1];
  }
  // 用码点生成确定性的笔画序列 (5-12 笔)
  const strokeCount = 5 + (code % 8);
  const strokes: number[] = [];
  let seed = code;
  for (let i = 0; i < strokeCount; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    strokes.push((seed % 8) + 1);
  }
  return strokes;
}

// 音色配置
const TIMBRES = {
  piano: { name: '钢琴', type: 'triangle' as OscillatorType, attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.3 },
  guzheng: { name: '古筝', type: 'sawtooth' as OscillatorType, attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.6 },
  chiptune: { name: '8-bit', type: 'square' as OscillatorType, attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.1 },
  organ: { name: '风琴', type: 'sine' as OscillatorType, attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.4 },
};

type TimbreKey = keyof typeof TIMBRES;

interface NoteInfo {
  char: string;
  strokeIndex: number;
  stroke: number;
  freq: number;
  solfege: string;
  note: string;
}

export default function NameToMusic() {
  const [name, setName] = useState('');
  const [timbre, setTimbre] = useState<TimbreKey>('piano');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);
  const [notes, setNotes] = useState<NoteInfo[]>([]);
  const [charStrokes, setCharStrokes] = useState<{ char: string; strokes: number[] }[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 解析名字为笔画音符序列
  const parseName = useCallback((n: string) => {
    const chars = n.split('').filter((c) => c.trim());
    const allNotes: NoteInfo[] = [];
    const strokeData: { char: string; strokes: number[] }[] = [];

    chars.forEach((char) => {
      const strokes = getStrokeSequence(char);
      strokeData.push({ char, strokes });
      strokes.forEach((s, i) => {
        const noteInfo = STROKE_NOTES[s] || STROKE_NOTES[1];
        allNotes.push({
          char,
          strokeIndex: i,
          stroke: s,
          freq: noteInfo.freq,
          solfege: noteInfo.solfege,
          note: noteInfo.note,
        });
      });
    });

    setNotes(allNotes);
    setCharStrokes(strokeData);
    return allNotes;
  }, []);

  useEffect(() => {
    if (name.trim()) parseName(name);
    else {
      setNotes([]);
      setCharStrokes([]);
    }
  }, [name, parseName]);

  // 画简谱可视化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || notes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const noteWidth = Math.min(40, (w - 40) / notes.length);
    const startX = (w - notes.length * noteWidth) / 2;

    // 背景五线谱
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = 30 + i * ((h - 60) / 7);
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    // 音符标签
    const solfeges = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do\''];
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.textAlign = 'right';
    for (let i = 0; i < 8; i++) {
      const y = 30 + (7 - i) * ((h - 60) / 7);
      ctx.fillText(solfeges[i], 16, y + 3);
    }

    // 画音符
    notes.forEach((note, idx) => {
      const x = startX + idx * noteWidth + noteWidth / 2;
      const noteIdx = note.stroke - 1; // 0-7
      const y = 30 + (7 - noteIdx) * ((h - 60) / 7);

      const isActive = idx === currentNoteIdx;
      const isPast = idx < currentNoteIdx;

      // 音符颜色 - 每个字一个颜色
      const charColors = [
        'rgb(99,102,241)', // indigo
        'rgb(236,72,153)', // pink
        'rgb(16,185,129)', // emerald
        'rgb(245,158,11)', // amber
        'rgb(139,92,246)', // violet
        'rgb(6,182,212)', // cyan
      ];
      const charIdx = charStrokes.findIndex((cs) => cs.char === note.char);
      const baseColor = charColors[charIdx % charColors.length];

      if (isActive) {
        // 发光效果
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = isPast ? baseColor : 'rgba(148,163,184,0.4)';
        ctx.globalAlpha = isPast ? 0.6 : 0.4;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 顶部字符标注（每个字第一个笔画时标）
      if (note.strokeIndex === 0) {
        ctx.fillStyle = isActive || isPast ? baseColor : 'rgba(148,163,184,0.5)';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(note.char, x, 18);
      }
    });
  }, [notes, currentNoteIdx, charStrokes]);

  // 播放
  const play = useCallback(async () => {
    if (notes.length === 0) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    playingRef.current = true;
    setIsPlaying(true);

    const timbreConfig = TIMBRES[timbre];
    const noteDuration = timbre === 'chiptune' ? 0.15 : 0.25;

    for (let i = 0; i < notes.length; i++) {
      if (!playingRef.current) break;

      setCurrentNoteIdx(i);
      const note = notes[i];

      // 创建振荡器
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = timbreConfig.type;
      osc.frequency.value = note.freq;

      // ADSR 包络
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + timbreConfig.attack);
      gain.gain.linearRampToValueAtTime(0.3 * timbreConfig.sustain, now + timbreConfig.attack + timbreConfig.decay);
      gain.gain.linearRampToValueAtTime(0, now + noteDuration + timbreConfig.release);

      // 古筝音色：加入轻微的颤音
      if (timbre === 'guzheng') {
        const vibrato = audioCtx.createOscillator();
        const vibratoGain = audioCtx.createGain();
        vibrato.frequency.value = 5;
        vibratoGain.gain.value = 3;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(now);
        vibrato.stop(now + noteDuration + timbreConfig.release + 0.1);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + noteDuration + timbreConfig.release + 0.1);

      await new Promise((r) => setTimeout(r, noteDuration * 1000));
    }

    playingRef.current = false;
    setIsPlaying(false);
    setCurrentNoteIdx(-1);
  }, [notes, timbre]);

  const stop = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentNoteIdx(-1);
  }, []);

  const strokeNames = ['', '横', '竖', '撇', '捺', '点', '折', '钩', '提'];

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              输入你的名字
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入中文名字..."
              maxLength={8}
              className="w-full px-4 py-3 text-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              音色
            </label>
            <div className="flex gap-2">
              {(Object.keys(TIMBRES) as TimbreKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTimbre(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    timbre === key
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {TIMBRES[key].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {name.trim() && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={isPlaying ? stop : play}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25'
              }`}
            >
              {isPlaying ? '⏹ 停止' : '▶ 播放你的名字'}
            </button>
          </div>
        )}
      </div>

      {/* 简谱可视化 */}
      {notes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">简谱可视化</h3>
          <canvas
            ref={canvasRef}
            className="w-full h-48 rounded-lg bg-slate-50 dark:bg-slate-900"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      )}

      {/* 笔画分析 */}
      {charStrokes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">笔画 → 音符映射</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {charStrokes.map((cs, idx) => {
              const charColors = [
                'border-indigo-300 dark:border-indigo-600',
                'border-pink-300 dark:border-pink-600',
                'border-emerald-300 dark:border-emerald-600',
                'border-amber-300 dark:border-amber-600',
                'border-violet-300 dark:border-violet-600',
                'border-cyan-300 dark:border-cyan-600',
              ];
              return (
                <div
                  key={idx}
                  className={`rounded-lg border-2 ${charColors[idx % charColors.length]} p-4`}
                >
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{cs.char}</div>
                  <div className="flex flex-wrap gap-1">
                    {cs.strokes.map((s, si) => (
                      <span
                        key={si}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs"
                      >
                        <span className="text-slate-500 dark:text-slate-400">{strokeNames[s]}</span>
                        <span className="font-mono font-medium text-slate-900 dark:text-white">
                          {STROKE_NOTES[s]?.solfege}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        <p>每个汉字被拆解为笔画序列，每种笔画对应一个音符：横→do, 竖→re, 撇→mi, 捺→fa, 点→sol, 折→la, 钩→si, 提→do'</p>
        <p className="mt-1">同一个名字永远会产生同一段旋律 — 这是属于你的音乐签名</p>
      </div>
    </div>
  );
}
