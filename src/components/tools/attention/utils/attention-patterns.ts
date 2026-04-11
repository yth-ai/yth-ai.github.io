// Attention pattern generators (8 patterns)

export type PatternType = 'local' | 'global' | 'syntactic' | 'causal' | 'semantic' | 'diagonal' | 'stride' | 'sink';

export interface PatternInfo {
  id: PatternType;
  label: string;
  labelEn: string;
  description: string;
}

export const PATTERN_CATALOG: PatternInfo[] = [
  { id: 'local', label: '局部注意力', labelEn: 'Local', description: '关注相邻 token，捕捉局部依赖' },
  { id: 'global', label: '全局注意力', labelEn: 'Global', description: '关注特殊 token（BOS/EOS/标点）' },
  { id: 'syntactic', label: '句法注意力', labelEn: 'Syntactic', description: '关注句法相关 token（主谓宾）' },
  { id: 'causal', label: '因果注意力', labelEn: 'Causal', description: '只看前面的 token（自回归掩码）' },
  { id: 'semantic', label: '语义注意力', labelEn: 'Semantic', description: '关注语义相似的 token' },
  { id: 'diagonal', label: '对角线注意力', labelEn: 'Diagonal', description: '自指注意力——每个 token 主要关注自身' },
  { id: 'stride', label: '间隔注意力', labelEn: 'Stride', description: '每隔 k 个 token 关注一次（稀疏注意力）' },
  { id: 'sink', label: '注意力汇聚', labelEn: 'Sink', description: '首 token 吸收大量注意力（StreamingLLM）' },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function generateAttentionPattern(
  tokens: string[],
  seed: number,
  pattern: PatternType,
): number[][] {
  const n = tokens.length;
  const rng = seededRandom(seed);
  const weights: number[][] = [];

  for (let i = 0; i < n; i++) {
    const logits = new Array(n).fill(0);

    switch (pattern) {
      case 'local':
        for (let j = 0; j < n; j++) {
          const dist = Math.abs(i - j);
          logits[j] = -dist * 1.5 + rng() * 0.5;
        }
        break;

      case 'global':
        for (let j = 0; j < n; j++) {
          logits[j] = rng() * 0.3;
          if (j === 0) logits[j] += 2;
          if (j === n - 1) logits[j] += 1.5;
          if ([',', '.', '，', '。', '的', '了'].includes(tokens[j])) logits[j] += 1;
        }
        break;

      case 'syntactic':
        for (let j = 0; j < n; j++) {
          logits[j] = rng() * 0.5 - 1;
          if (Math.abs(i - j) <= 2) logits[j] += 1.5;
          if (Math.abs(i - j) === 0) logits[j] += 0.5;
        }
        break;

      case 'causal':
        for (let j = 0; j < n; j++) {
          if (j > i) {
            logits[j] = -1e9;
          } else {
            logits[j] = rng() * 2 - (i - j) * 0.3;
            if (j === 0) logits[j] += 1;
          }
        }
        break;

      case 'semantic':
        for (let j = 0; j < n; j++) {
          logits[j] = rng() * 0.5 - 1;
          if (tokens[i].length > 1 && tokens[j].length > 1) logits[j] += 0.8;
          if (i === j) logits[j] += 0.3;
        }
        break;

      case 'diagonal':
        for (let j = 0; j < n; j++) {
          logits[j] = rng() * 0.3 - 2;
          if (i === j) logits[j] = 3 + rng() * 0.5;
        }
        break;

      case 'stride':
        for (let j = 0; j < n; j++) {
          const strideK = 3;
          logits[j] = rng() * 0.3 - 1;
          if (j % strideK === i % strideK) logits[j] += 2;
          if (i === j) logits[j] += 1;
        }
        break;

      case 'sink':
        for (let j = 0; j < n; j++) {
          logits[j] = rng() * 0.5 - 1;
          if (j === 0) logits[j] += 4; // strong sink to first token
          if (j <= 2) logits[j] += 1.5; // mild sink to early tokens
          if (j > i) logits[j] = -1e9; // causal mask
        }
        break;

      default:
        for (let j = 0; j < n; j++) logits[j] = rng() * 3;
    }

    weights.push(softmax(logits));
  }
  return weights;
}

/** Generate multi-layer multi-head attention for bird's-eye view */
export function generateMultiLayerAttention(
  tokens: string[],
  nLayers: number,
  nHeads: number,
  baseSeed: number,
): number[][][][] {
  // Returns [layer][head][query][key]
  const allPatterns: PatternType[] = ['local', 'global', 'syntactic', 'causal', 'semantic', 'diagonal', 'stride', 'sink'];
  const result: number[][][][] = [];

  for (let l = 0; l < nLayers; l++) {
    const layerHeads: number[][][] = [];
    for (let h = 0; h < nHeads; h++) {
      const patIdx = (l * nHeads + h) % allPatterns.length;
      const seed = baseSeed + l * 1000 + h * 37;
      // Shallow layers lean toward local/syntactic; deep layers lean toward global/semantic
      const adjustedPatIdx = l < nLayers / 2
        ? patIdx % 4 // first half: local, global, syntactic, causal
        : (patIdx % 4) + 4; // second half: semantic, diagonal, stride, sink
      const pat = allPatterns[adjustedPatIdx < allPatterns.length ? adjustedPatIdx : patIdx % allPatterns.length];
      layerHeads.push(generateAttentionPattern(tokens, seed, pat));
    }
    result.push(layerHeads);
  }

  return result;
}

/** Classify a head's pattern based on weight statistics */
export function classifyHeadPattern(weights: number[][]): { type: PatternType; confidence: number } {
  const n = weights.length;
  if (n === 0) return { type: 'local', confidence: 0 };

  // Compute entropy
  let totalEntropy = 0;
  for (const row of weights) {
    let h = 0;
    for (const w of row) {
      if (w > 1e-10) h -= w * Math.log2(w);
    }
    totalEntropy += h;
  }
  const avgEntropy = totalEntropy / n;

  // Diagonal ratio (self-attention)
  let diagSum = 0;
  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      totalSum += weights[i][j];
      if (i === j) diagSum += weights[i][j];
    }
  }
  const diagRatio = diagSum / Math.max(totalSum, 1e-10);

  // First token concentration (sink)
  let sinkSum = 0;
  for (let i = 0; i < n; i++) sinkSum += weights[i][0];
  const sinkRatio = sinkSum / Math.max(totalSum, 1e-10);

  // Local concentration (within distance 2)
  let localSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(i - j) <= 2) localSum += weights[i][j];
    }
  }
  const localRatio = localSum / Math.max(totalSum, 1e-10);

  // Classify
  if (diagRatio > 0.4) return { type: 'diagonal', confidence: diagRatio };
  if (sinkRatio > 0.35) return { type: 'sink', confidence: sinkRatio };
  if (localRatio > 0.7) return { type: 'local', confidence: localRatio };
  if (avgEntropy < 1.5) return { type: 'causal', confidence: 1 - avgEntropy / Math.log2(n) };
  if (avgEntropy > Math.log2(n) * 0.8) return { type: 'global', confidence: avgEntropy / Math.log2(n) };

  return { type: 'semantic', confidence: 0.5 };
}
