import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================================
// Types & Constants
// ============================================================

interface TokenizerPreset {
  name: string;
  description: string;
  vocabSize: number;
  releaseYear: number;
  specialTokens: Record<string, number>;
  features: string[];
}

interface TokenResult {
  token: string;
  id: number;
  bytes: number[];
}

interface BPEStep {
  tokens: string[];
  mergedPair: [string, string] | null;
  pairFreqs: Map<string, number>;
  vocabSize: number;
}

interface ModelPricing {
  name: string;
  inputPer1M: number;
  outputPer1M: number;
  color: string;
}

// ============================================================
// Model Presets (2026 Q1)
// ============================================================

const TOKENIZER_PRESETS: Record<string, TokenizerPreset> = {
  'gpt4o': {
    name: 'GPT-4o (o200k_base)',
    description: 'OpenAI GPT-4o/GPT-5 系列使用的 tokenizer，词表 200K，显著提升多语言效率',
    vocabSize: 200019,
    releaseYear: 2024,
    specialTokens: { '<|endoftext|>': 199999, '<|fim_prefix|>': 200000, '<|fim_middle|>': 200001 },
    features: ['多语言优化', 'BPE', '200K 词表'],
  },
  'llama4': {
    name: 'Llama 4 (128K)',
    description: 'Meta Llama 4 系列 tokenizer，从 Llama 1 的 32K 大幅扩展到 128K 词表',
    vocabSize: 128256,
    releaseYear: 2025,
    specialTokens: { '<|begin_of_text|>': 128000, '<|end_of_text|>': 128001, '<|eot_id|>': 128009 },
    features: ['SentencePiece BPE', '128K 词表', '多语言'],
  },
  'qwen3': {
    name: 'Qwen 3 (152K)',
    description: 'Qwen 3 中文优化 tokenizer，152K 词表，中文压缩率业界领先',
    vocabSize: 152064,
    releaseYear: 2025,
    specialTokens: { '<|endoftext|>': 151643, '<|im_start|>': 151644, '<|im_end|>': 151645 },
    features: ['中文优化', 'BPE', '152K 词表'],
  },
  'deepseek': {
    name: 'DeepSeek V3 (128K)',
    description: 'DeepSeek V3/R1 使用的 tokenizer，128K 词表，中英代码均衡优化',
    vocabSize: 128000,
    releaseYear: 2025,
    specialTokens: { '<|begin▁of▁sentence|>': 0, '<|end▁of▁sentence|>': 1 },
    features: ['中英均衡', 'BPE', '128K 词表'],
  },
  'gemini3': {
    name: 'Gemini 3 (256K)',
    description: 'Google Gemini 3 系列 SentencePiece tokenizer，256K 超大词表',
    vocabSize: 256000,
    releaseYear: 2025,
    specialTokens: { '<bos>': 1, '<eos>': 2, '<pad>': 0 },
    features: ['SentencePiece', '256K 词表', '多模态'],
  },
  'chinese': {
    name: '中文优化 (64K)',
    description: '面向中文场景深度优化的 tokenizer，64K 词表，单字粒度 + 常见词组合并',
    vocabSize: 64000,
    releaseYear: 2024,
    specialTokens: { '[CLS]': 101, '[SEP]': 102, '[PAD]': 0, '[UNK]': 100 },
    features: ['中文单字', '词组合并', '64K 词表'],
  },
};

// API 定价 (2026 Q1, USD per 1M tokens)
const MODEL_PRICING: ModelPricing[] = [
  { name: 'GPT-4o', inputPer1M: 2.5, outputPer1M: 10, color: '#10b981' },
  { name: 'GPT-4o mini', inputPer1M: 0.15, outputPer1M: 0.6, color: '#6ee7b7' },
  { name: 'Claude Sonnet 4', inputPer1M: 3, outputPer1M: 15, color: '#d4a574' },
  { name: 'Claude Haiku 3.5', inputPer1M: 0.8, outputPer1M: 4, color: '#fbbf24' },
  { name: 'Gemini 2.5 Pro', inputPer1M: 1.25, outputPer1M: 10, color: '#4285f4' },
  { name: 'Gemini 2.5 Flash', inputPer1M: 0.15, outputPer1M: 0.6, color: '#34a853' },
  { name: 'DeepSeek V3', inputPer1M: 0.27, outputPer1M: 1.1, color: '#6366f1' },
  { name: 'Llama 4 (Together)', inputPer1M: 0.8, outputPer1M: 0.8, color: '#0084ff' },
];

// Token color palette
const TOKEN_COLORS = [
  { bg: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.5)' },
  { bg: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.5)' },
  { bg: 'rgba(245,158,11,0.25)', border: 'rgba(245,158,11,0.5)' },
  { bg: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.5)' },
  { bg: 'rgba(168,85,247,0.25)', border: 'rgba(168,85,247,0.5)' },
  { bg: 'rgba(236,72,153,0.25)', border: 'rgba(236,72,153,0.5)' },
  { bg: 'rgba(6,182,212,0.25)', border: 'rgba(6,182,212,0.5)' },
  { bg: 'rgba(132,204,22,0.25)', border: 'rgba(132,204,22,0.5)' },
  { bg: 'rgba(251,146,60,0.25)', border: 'rgba(251,146,60,0.5)' },
  { bg: 'rgba(99,102,241,0.25)', border: 'rgba(99,102,241,0.5)' },
  { bg: 'rgba(20,184,166,0.25)', border: 'rgba(20,184,166,0.5)' },
  { bg: 'rgba(244,63,94,0.25)', border: 'rgba(244,63,94,0.5)' },
  { bg: 'rgba(34,197,94,0.25)', border: 'rgba(34,197,94,0.5)' },
  { bg: 'rgba(234,179,8,0.25)', border: 'rgba(234,179,8,0.5)' },
  { bg: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.5)' },
  { bg: 'rgba(14,165,233,0.25)', border: 'rgba(14,165,233,0.5)' },
  { bg: 'rgba(217,70,239,0.25)', border: 'rgba(217,70,239,0.5)' },
  { bg: 'rgba(249,115,22,0.25)', border: 'rgba(249,115,22,0.5)' },
  { bg: 'rgba(52,211,153,0.25)', border: 'rgba(52,211,153,0.5)' },
  { bg: 'rgba(96,165,250,0.25)', border: 'rgba(96,165,250,0.5)' },
];

const SAMPLE_TEXTS = {
  chinese: '大语言模型的训练需要海量高质量数据。中训练阶段通过精心筛选的数据集来提升模型在特定领域的能力，这是预训练和微调之间的重要桥梁。',
  english: 'Large language models require massive amounts of high-quality training data. The pre-training phase uses carefully curated datasets to build foundational capabilities.',
  code: 'def attention(query, key, value, mask=None):\n    d_k = query.size(-1)\n    scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(d_k)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    return torch.matmul(F.softmax(scores, dim=-1), value)',
  mixed: '根据 Scaling Laws，模型参数量 N 和训练数据量 D 需要满足 N ∝ D^0.74 的比例关系。GPT-4 大约使用了 13T tokens 进行训练。',
};

const BPE_SAMPLE_TEXTS = {
  simple: 'the cat sat on the mat the cat ate the rat',
  code: 'function getData() { return getData(); }',
  chinese: '机器学习深度学习机器翻译',
};

// ============================================================
// Tokenization Engine (simulated)
// ============================================================

function hashToken(token: string, vocabSize: number): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % (vocabSize - 1000) + 256;
}

function splitWordBPE(word: string, preset: string): string[] {
  if (word.length <= 1) return [word];

  const commonSubwords = new Set([
    'the', 'ing', 'tion', 'ment', 'ness', 'able', 'ful', 'less', 'ous',
    'er', 'ed', 'ly', 'al', 'en', 'es', 'or', 'an', 'on', 'in', 'is',
    'it', 'at', 'to', 'of', 'and', 'for', 'are', 'not', 'you', 'all',
    'was', 'her', 'can', 'had', 'but', 'one', 'our', 'out', 'has', 'his',
    'pre', 'pro', 'com', 'con', 'dis', 'un', 're', 'de', 'ex', 'over',
    'under', 'inter', 'trans', 'super', 'sub', 'anti', 'auto', 'semi',
    'multi', 'non', 'self', 'cross', 'post', 'mid', 'mis',
    'model', 'train', 'data', 'learn', 'deep', 'neural', 'network',
    'token', 'embed', 'attention', 'transform', 'layer', 'param',
    'batch', 'loss', 'gradient', 'weight', 'bias', 'norm', 'drop',
    'input', 'output', 'hidden', 'vocab', 'encode', 'decode',
    'function', 'return', 'const', 'import', 'export', 'class',
  ]);

  if (word.length <= 6 || commonSubwords.has(word.toLowerCase())) return [word];

  if ((preset === 'llama4' || preset === 'gemini3') && word.startsWith('\u2581')) {
    const rest = word.slice(1);
    if (rest.length <= 6) return [word];
    const parts = splitWordBPE(rest, preset);
    parts[0] = '\u2581' + parts[0];
    return parts;
  }

  if (/[\u4e00-\u9fff]/.test(word)) return [...word];

  const suffixes = ['tion', 'ment', 'ness', 'able', 'ible', 'ful', 'less', 'ous', 'ive',
    'ing', 'ism', 'ist', 'ity', 'ize', 'ise', 'ent', 'ant', 'ure', 'ence',
    'ance', 'ers', 'est', 'ern', 'age', 'ate', 'ory'];
  const prefixes = ['pre', 'pro', 'com', 'con', 'dis', 'un', 're', 'de', 'ex', 'over',
    'under', 'inter', 'trans', 'super', 'sub', 'anti', 'auto', 'semi', 'multi', 'non', 'self'];

  const lowerWord = word.toLowerCase();
  let bestSplit: string[] | null = null;

  for (const prefix of prefixes) {
    if (lowerWord.startsWith(prefix) && word.length > prefix.length + 2) {
      bestSplit = [word.slice(0, prefix.length), ...splitWordBPE(word.slice(prefix.length), preset)];
      break;
    }
  }

  if (!bestSplit) {
    for (const suffix of suffixes) {
      if (lowerWord.endsWith(suffix) && word.length > suffix.length + 2) {
        bestSplit = [...splitWordBPE(word.slice(0, word.length - suffix.length), preset), word.slice(word.length - suffix.length)];
        break;
      }
    }
  }

  if (!bestSplit) {
    bestSplit = [];
    let i = 0;
    while (i < word.length) {
      const chunkSize = Math.min(i === 0 ? 4 : 3, word.length - i);
      bestSplit.push(word.slice(i, i + chunkSize));
      i += chunkSize;
    }
  }

  return bestSplit;
}

function tokenize(text: string, preset: string): TokenResult[] {
  if (!text) return [];

  const tokens: TokenResult[] = [];
  const encoder = new TextEncoder();
  const presetInfo = TOKENIZER_PRESETS[preset];
  const vocabSize = presetInfo?.vocabSize || 100000;

  const isSentencePiece = preset === 'llama4' || preset === 'gemini3';
  const isChinese = preset === 'chinese' || preset === 'qwen3';

  if (isChinese) {
    const cjkCommonWords = new Set([
      '的', '了', '在', '是', '我', '你', '他', '她', '它', '们',
      '不', '有', '这', '那', '人', '大', '一个', '中国', '可以',
      '什么', '没有', '因为', '所以', '但是', '如果', '虽然',
      '已经', '一些', '这个', '那个', '自己', '知道', '时候',
      '非常', '现在', '应该', '能够', '模型', '训练', '数据',
      '学习', '深度', '算法', '参数', '预训', '语言', '推理',
      '注意力', '机制', '优化', '损失', '梯度', '权重',
    ]);
    let i = 0;
    while (i < text.length) {
      let matched = false;
      for (let len = 4; len >= 2; len--) {
        const substr = text.slice(i, i + len);
        if (cjkCommonWords.has(substr)) {
          tokens.push({ token: substr, id: hashToken(substr, vocabSize), bytes: Array.from(encoder.encode(substr)) });
          i += len;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const char = text[i];
      const code = char.codePointAt(0) || 0;
      if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF)) {
        tokens.push({ token: char, id: hashToken(char, vocabSize), bytes: Array.from(encoder.encode(char)) });
        i++;
      } else if (/[a-zA-Z]/.test(char)) {
        let word = '';
        while (i < text.length && /[a-zA-Z]/.test(text[i])) { word += text[i]; i++; }
        for (const sw of splitWordBPE(word, preset)) {
          tokens.push({ token: sw, id: hashToken(sw, vocabSize), bytes: Array.from(encoder.encode(sw)) });
        }
      } else if (/[0-9]/.test(char)) {
        // Number grouping: 1-3 digits per token
        let num = '';
        while (i < text.length && /[0-9]/.test(text[i])) { num += text[i]; i++; }
        let j = 0;
        while (j < num.length) {
          const chunk = num.slice(j, j + Math.min(3, num.length - j));
          tokens.push({ token: chunk, id: hashToken(chunk, vocabSize), bytes: Array.from(encoder.encode(chunk)) });
          j += chunk.length;
        }
      } else {
        tokens.push({ token: char, id: hashToken(char, vocabSize), bytes: Array.from(encoder.encode(char)) });
        i++;
      }
    }
  } else if (isSentencePiece) {
    const words = text.split(/(?=\s)|(?<=\s)/);
    for (const word of words) {
      if (!word) continue;
      if (/^\s+$/.test(word)) continue;
      const prefix = tokens.length === 0 ? '' : '\u2581';
      const fullWord = prefix + word.replace(/^\s+/, '');
      for (const sw of splitWordBPE(fullWord, preset)) {
        tokens.push({ token: sw, id: hashToken(sw, vocabSize), bytes: Array.from(encoder.encode(sw)) });
      }
    }
  } else {
    // GPT-4o / DeepSeek style: byte-level BPE
    const pattern = /('s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/gu;
    const wordPieces = text.match(pattern) || [text];
    for (const piece of wordPieces) {
      for (const sw of splitWordBPE(piece, preset)) {
        tokens.push({ token: sw, id: hashToken(sw, vocabSize), bytes: Array.from(encoder.encode(sw)) });
      }
    }
  }

  return tokens;
}

// ============================================================
// Mini BPE Engine (real algorithm for learning mode)
// ============================================================

function runBPE(text: string, maxSteps: number = 200): BPEStep[] {
  // Start from character-level tokens
  let currentTokens = text.split('');
  const steps: BPEStep[] = [];

  // Initial state
  const initFreqs = countPairs(currentTokens);
  steps.push({
    tokens: [...currentTokens],
    mergedPair: null,
    pairFreqs: initFreqs,
    vocabSize: new Set(currentTokens).size,
  });

  for (let step = 0; step < maxSteps; step++) {
    const freqs = countPairs(currentTokens);
    if (freqs.size === 0) break;

    // Find highest frequency pair
    let bestPair: [string, string] | null = null;
    let bestFreq = 0;
    for (const [pair, freq] of freqs) {
      if (freq > bestFreq) {
        const [a, b] = pair.split('\x00');
        bestFreq = freq;
        bestPair = [a, b];
      }
    }

    if (!bestPair || bestFreq < 2) break;

    // Merge the pair
    const merged = bestPair[0] + bestPair[1];
    const newTokens: string[] = [];
    let i = 0;
    while (i < currentTokens.length) {
      if (i < currentTokens.length - 1 &&
          currentTokens[i] === bestPair![0] &&
          currentTokens[i + 1] === bestPair![1]) {
        newTokens.push(merged);
        i += 2;
      } else {
        newTokens.push(currentTokens[i]);
        i++;
      }
    }

    currentTokens = newTokens;
    const newFreqs = countPairs(currentTokens);

    steps.push({
      tokens: [...currentTokens],
      mergedPair: bestPair,
      pairFreqs: newFreqs,
      vocabSize: new Set(currentTokens).size,
    });
  }

  return steps;
}

function countPairs(tokens: string[]): Map<string, number> {
  const freqs = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = tokens[i] + '\x00' + tokens[i + 1];
    freqs.set(key, (freqs.get(key) || 0) + 1);
  }
  return freqs;
}

// ============================================================
// Sub-components
// ============================================================

function BPELearner() {
  const [bpeText, setBpeText] = useState('');
  const [steps, setSteps] = useState<BPEStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBPE = useCallback((text: string) => {
    setBpeText(text);
    const result = runBPE(text, 100);
    setSteps(result);
    setCurrentStep(0);
    setIsPlaying(false);
    if (playRef.current) clearInterval(playRef.current);
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            if (playRef.current) clearInterval(playRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 600);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying, steps.length, currentStep]);

  const step = steps[currentStep];

  // Get top pairs for display
  const topPairs = useMemo(() => {
    if (!step) return [];
    const entries = Array.from(step.pairFreqs.entries())
      .map(([k, v]) => ({ pair: k.split('\x00') as [string, string], freq: v }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 8);
    return entries;
  }, [step]);

  const nextMergePair = topPairs[0]?.pair;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
        <span className="shrink-0 mt-0.5 text-amber-500">i</span>
        <span className="text-amber-800 dark:text-amber-200">
          BPE 学习模式：从字符级开始，每步合并最高频的相邻对，逐步构建词表。这是真实 BPE 训练过程的简化版本。
        </span>
      </div>

      {/* Sample selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">选择语料：</span>
        {Object.entries(BPE_SAMPLE_TEXTS).map(([key, val]) => (
          <button key={key} onClick={() => startBPE(val)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              bpeText === val
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            {{ simple: '英文简单', code: '代码片段', chinese: '中文' }[key]}
          </button>
        ))}
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">或输入自定义文本：</span>
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="输入短文本用于 BPE 演示（建议 20-60 字符）"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') startBPE((e.target as HTMLInputElement).value);
          }}
        />
        <button
          onClick={(e) => {
            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
            if (input.value) startBPE(input.value);
          }}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          开始
        </button>
      </div>

      {steps.length > 0 && step && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} disabled={currentStep === 0}
              className="px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors">
              Reset
            </button>
            <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}
              className="px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors">
              ◄ Prev
            </button>
            <button
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                }
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              }`}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))} disabled={currentStep >= steps.length - 1}
              className="px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors">
              Next ►
            </button>
            <button onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 10))} disabled={currentStep >= steps.length - 1}
              className="px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 transition-colors">
              +10
            </button>
            <button onClick={() => { setCurrentStep(steps.length - 1); setIsPlaying(false); }}
              className="px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              Finish
            </button>
            <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-mono">
              Step {currentStep}/{steps.length - 1} · {step.tokens.length} tokens · 词表 {step.vocabSize}
            </div>
          </div>

          {/* Merge info */}
          {step.mergedPair && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">本步合并：</span>
              <code className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-mono text-xs">
                "{step.mergedPair[0]}" + "{step.mergedPair[1]}"
              </code>
              <span className="text-slate-400 dark:text-slate-500">→</span>
              <code className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-mono text-xs font-bold">
                "{step.mergedPair[0]}{step.mergedPair[1]}"
              </code>
            </div>
          )}

          {/* Token display */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[60px]">
            <div className="flex flex-wrap gap-0.5">
              {step.tokens.map((t, i) => {
                const color = TOKEN_COLORS[Math.abs(hashToken(t, 20)) % TOKEN_COLORS.length];
                const isNextMergeLeft = nextMergePair && currentStep < steps.length - 1 &&
                  i < step.tokens.length - 1 &&
                  step.tokens[i] === nextMergePair[0] &&
                  step.tokens[i + 1] === nextMergePair[1];
                const isNextMergeRight = nextMergePair && currentStep < steps.length - 1 &&
                  i > 0 &&
                  step.tokens[i - 1] === nextMergePair[0] &&
                  step.tokens[i] === nextMergePair[1];
                const highlight = isNextMergeLeft || isNextMergeRight;

                return (
                  <span key={i}
                    className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-mono transition-all duration-300 ${
                      highlight ? 'ring-2 ring-orange-400 dark:ring-orange-500 scale-105' : ''
                    }`}
                    style={{ backgroundColor: color.bg, borderBottom: `2px solid ${color.border}` }}>
                    <span className="text-slate-800 dark:text-slate-200">
                      {t.replace(/ /g, '\u2423').replace(/\n/g, '\u21B5')}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Pair frequency sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                相邻对频率 Top 8 {currentStep < steps.length - 1 && '(下一步将合并 #1)'}
              </h4>
              {topPairs.length === 0 ? (
                <p className="text-xs text-slate-400">无可合并的相邻对</p>
              ) : (
                <div className="space-y-1">
                  {topPairs.map((p, i) => {
                    const maxFreq = topPairs[0]?.freq || 1;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <code className={`font-mono shrink-0 px-1.5 py-0.5 rounded ${
                          i === 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {p.pair[0].replace(/ /g, '\u2423')}{p.pair[1].replace(/ /g, '\u2423')}
                        </code>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${
                            i === 0 ? 'bg-orange-500' : 'bg-slate-400 dark:bg-slate-500'
                          }`} style={{ width: `${(p.freq / maxFreq) * 100}%` }} />
                        </div>
                        <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0 w-6 text-right">{p.freq}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compression curve */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                压缩曲线
              </h4>
              <div className="h-32 flex items-end gap-px">
                {steps.slice(0, currentStep + 1).map((s, i) => {
                  const maxTokens = steps[0]?.tokens.length || 1;
                  const height = (s.tokens.length / maxTokens) * 100;
                  return (
                    <div key={i}
                      className={`flex-1 min-w-[2px] max-w-[6px] rounded-t transition-all duration-200 ${
                        i === currentStep ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`Step ${i}: ${s.tokens.length} tokens`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>{steps[0]?.tokens.length} tokens</span>
                <span>→ {step.tokens.length} tokens</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                压缩率: {steps[0] ? ((1 - step.tokens.length / steps[0].tokens.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </>
      )}

      {steps.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 dark:text-slate-500 text-sm">选择预设语料或输入自定义文本开始 BPE 学习</p>
        </div>
      )}
    </div>
  );
}

function CostCalculator({ tokenCount }: { tokenCount: number }) {
  const [batchSize, setBatchSize] = useState(1);

  const costs = useMemo(() => {
    return MODEL_PRICING.map(m => ({
      ...m,
      inputCost: (tokenCount * batchSize / 1_000_000) * m.inputPer1M,
      outputCost: (tokenCount * batchSize / 1_000_000) * m.outputPer1M,
    }));
  }, [tokenCount, batchSize]);

  const maxCost = Math.max(...costs.map(c => c.inputCost), 0.001);

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          API 成本估算
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(2026 Q1 定价)</span>
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">批量：</span>
          <select
            value={batchSize}
            onChange={e => setBatchSize(Number(e.target.value))}
            className="rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 border-0 focus:ring-1 focus:ring-orange-500"
          >
            <option value={1}>1 次</option>
            <option value={1000}>1K 次</option>
            <option value={100000}>100K 次</option>
            <option value={1000000}>1M 次</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        {costs.map(c => (
          <div key={c.name} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-slate-600 dark:text-slate-400 truncate" title={c.name}>{c.name}</span>
            <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max((c.inputCost / maxCost) * 100, 2)}%`, backgroundColor: c.color }} />
            </div>
            <span className="w-20 text-right font-mono text-slate-700 dark:text-slate-300 shrink-0">
              ${c.inputCost < 0.001 ? c.inputCost.toExponential(1) : c.inputCost < 1 ? c.inputCost.toFixed(4) : c.inputCost.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
        基于 {tokenCount.toLocaleString()} tokens × {batchSize.toLocaleString()} 次 = {(tokenCount * batchSize).toLocaleString()} tokens (仅输入成本)
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

type Tab = 'tokenizer' | 'bpe';

export default function TokenizerVisualizer() {
  const [activeTab, setActiveTab] = useState<Tab>('tokenizer');
  const [text, setText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('gpt4o');
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  const [showBytes, setShowBytes] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const tokens = useMemo(() => tokenize(text, selectedPreset), [text, selectedPreset]);

  const compareTokens = useMemo(() => {
    if (!compareMode) return {};
    const result: Record<string, TokenResult[]> = {};
    for (const key of Object.keys(TOKENIZER_PRESETS)) {
      if (key !== selectedPreset) {
        result[key] = tokenize(text, key);
      }
    }
    return result;
  }, [text, selectedPreset, compareMode]);

  const stats = useMemo(() => {
    if (!tokens.length) return null;
    const totalBytes = new TextEncoder().encode(text).length;
    const totalTokens = tokens.length;
    return {
      totalTokens,
      totalChars: text.length,
      totalBytes,
      avgTokenLen: (text.length / totalTokens).toFixed(2),
      compressionRatio: (totalBytes / totalTokens).toFixed(2),
      uniqueTokens: new Set(tokens.map(t => t.token)).size,
      charsPerToken: (text.length / totalTokens).toFixed(1),
    };
  }, [tokens, text]);

  const loadSample = useCallback((key: string) => {
    setText(SAMPLE_TEXTS[key as keyof typeof SAMPLE_TEXTS] || '');
  }, []);

  const renderTokens = (tokenList: TokenResult[], label?: string) => (
    <div>
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">({tokenList.length} tokens)</span>
        </div>
      )}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[80px]">
        <div className="flex flex-wrap gap-1">
          {tokenList.map((t, i) => {
            const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
            const isHovered = hoveredToken === i;
            return (
              <span key={i}
                className="relative inline-flex items-center px-1.5 py-0.5 rounded text-sm font-mono cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: color.bg,
                  borderBottom: `2px solid ${color.border}`,
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  zIndex: isHovered ? 10 : 1,
                }}
                onMouseEnter={() => setHoveredToken(i)}
                onMouseLeave={() => setHoveredToken(null)}
                title={`Token: "${t.token}" | ID: ${t.id} | Bytes: [${t.bytes.join(', ')}] | ${t.bytes.length} bytes`}>
                <span className="text-slate-800 dark:text-slate-200">
                  {t.token.replace(/ /g, '\u2423').replace(/\n/g, '\u21B5').replace(/\t/g, '\u2192')}
                </span>
                {isHovered && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs whitespace-nowrap shadow-lg z-20 flex flex-col items-center leading-tight">
                    <span>ID: {t.id} · {t.bytes.length} bytes</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                      [{t.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}]
                    </span>
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
        <button onClick={() => setActiveTab('tokenizer')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'tokenizer'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          分词器
        </button>
        <button onClick={() => setActiveTab('bpe')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'bpe'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          BPE 学习
        </button>
      </div>

      {activeTab === 'bpe' ? (
        <BPELearner />
      ) : (
        <>
          {/* Simulation notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
            <span className="shrink-0">ℹ</span>
            <span>
              本工具使用启发式规则模拟 BPE 分词效果，结果与真实 tokenizer 存在差异。精确结果请参考各模型官方工具。
            </span>
          </div>

          {/* Tokenizer selection */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(TOKENIZER_PRESETS).map(([key, preset]) => (
              <button key={key} onClick={() => setSelectedPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedPreset === key
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                {preset.name}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500/50" />
                对比
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={showBytes} onChange={e => setShowBytes(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500/50" />
                字节
              </label>
            </div>
          </div>

          {/* Preset info */}
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-2.5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span>{TOKENIZER_PRESETS[selectedPreset].description}</span>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                {TOKENIZER_PRESETS[selectedPreset].releaseYear}
              </span>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {TOKENIZER_PRESETS[selectedPreset].features.map((f, i) => (
                <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Sample buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">快速示例:</span>
            {[
              { key: 'chinese', label: '中文' },
              { key: 'english', label: '英文' },
              { key: 'code', label: '代码' },
              { key: 'mixed', label: '中英混合' },
            ].map(s => (
              <button key={s.key} onClick={() => loadSample(s.key)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                {s.label}
              </button>
            ))}
            <button onClick={() => { setText(''); setHoveredToken(null); }}
              className="ml-auto px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              清空
            </button>
          </div>

          {/* Text input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">输入文本</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="在此输入任意文本，实时查看分词结果..."
              className="w-full h-36 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              spellCheck={false} />
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Token 数', value: stats.totalTokens, highlight: true },
                { label: '字符数', value: stats.totalChars },
                { label: '字节数', value: stats.totalBytes },
                { label: '字符/Token', value: stats.charsPerToken },
                { label: 'bytes/token', value: stats.compressionRatio },
                { label: '唯一 Token', value: stats.uniqueTokens },
              ].map((stat, i) => (
                <div key={i}
                  className={`p-3 rounded-lg border text-center ${
                    stat.highlight
                      ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}>
                  <div className={`text-lg font-bold font-mono ${
                    stat.highlight ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'
                  }`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Token output */}
          {tokens.length > 0 && (
            <>
              {renderTokens(tokens, `${TOKENIZER_PRESETS[selectedPreset].name} 分词结果`)}

              {/* Cost calculator */}
              <CostCalculator tokenCount={tokens.length} />

              {/* Byte view */}
              {showBytes && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">字节级视图</label>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-slate-500 dark:text-slate-400">
                          <th className="text-left py-1 pr-4">Token</th>
                          <th className="text-left py-1 pr-4">ID</th>
                          <th className="text-left py-1 pr-4">字节 (hex)</th>
                          <th className="text-left py-1">UTF-8 字节数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokens.slice(0, 50).map((t, i) => {
                          const color = TOKEN_COLORS[i % TOKEN_COLORS.length];
                          return (
                            <tr key={i}
                              className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                              onMouseEnter={() => setHoveredToken(i)}
                              onMouseLeave={() => setHoveredToken(null)}>
                              <td className="py-1.5 pr-4">
                                <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: color.bg, borderBottom: `2px solid ${color.border}` }}>
                                  {t.token.replace(/ /g, '\u2423').replace(/\n/g, '\u21B5')}
                                </span>
                              </td>
                              <td className="py-1.5 pr-4 text-slate-500 dark:text-slate-400">{t.id}</td>
                              <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                                {t.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}
                              </td>
                              <td className="py-1.5 text-slate-500 dark:text-slate-400">{t.bytes.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {tokens.length > 50 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                        仅显示前 50 个 token（共 {tokens.length} 个）
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Compare mode */}
              {compareMode && Object.keys(compareTokens).length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tokenizer 对比</h3>
                  {Object.entries(compareTokens).map(([key, toks]) => (
                    <div key={key}>
                      {renderTokens(toks, TOKENIZER_PRESETS[key].name)}
                    </div>
                  ))}

                  {/* Comparison table */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 dark:text-slate-400">
                          <th className="text-left py-2 pr-4 font-medium">Tokenizer</th>
                          <th className="text-right py-2 px-4 font-medium">Token 数</th>
                          <th className="text-right py-2 px-4 font-medium">bytes/token</th>
                          <th className="text-right py-2 px-4 font-medium">chars/token</th>
                          <th className="text-right py-2 pl-4 font-medium">唯一 Token</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: selectedPreset, toks: tokens },
                          ...Object.entries(compareTokens).map(([key, toks]) => ({ key, toks })),
                        ].map(({ key, toks }) => {
                          const totalBytes = new TextEncoder().encode(text).length;
                          const best = [tokens, ...Object.values(compareTokens)].reduce((min, t) => t.length < min ? t.length : min, Infinity);
                          const isBest = toks.length === best;
                          return (
                            <tr key={key} className="border-t border-slate-200 dark:border-slate-700">
                              <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                                {TOKENIZER_PRESETS[key].name}
                                {key === selectedPreset && <span className="ml-1 text-xs text-primary-500">(当前)</span>}
                              </td>
                              <td className={`py-2 px-4 text-right font-mono ${isBest ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
                                {toks.length}
                                {isBest && <span className="ml-1 text-xs">✓</span>}
                              </td>
                              <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                {(totalBytes / toks.length).toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                {(text.length / toks.length).toFixed(2)}
                              </td>
                              <td className="py-2 pl-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                {new Set(toks.map(t => t.token)).size}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!text && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400">输入文本查看分词结果</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">支持 6 种 tokenizer 预设，覆盖 2024-2025 年主流模型</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
