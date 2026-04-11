// Model presets for architecture comparison

export interface ModelPreset {
  name: string;
  architecture: 'MHA' | 'GQA' | 'MQA' | 'MLA';
  nHeads: number;
  nKVHeads: number;
  dModel: number;
  dHead: number;
  nLayers: number;
  defaultSeqLen: number;
  notes: string;
}

export const MODEL_PRESETS: Record<string, ModelPreset> = {
  'gpt2': {
    name: 'GPT-2 (117M)',
    architecture: 'MHA',
    nHeads: 12,
    nKVHeads: 12,
    dModel: 768,
    dHead: 64,
    nLayers: 12,
    defaultSeqLen: 1024,
    notes: '经典 MHA，每个 Head 独立 QKV',
  },
  'llama3-8b': {
    name: 'Llama 3 8B',
    architecture: 'GQA',
    nHeads: 32,
    nKVHeads: 8,
    dModel: 4096,
    dHead: 128,
    nLayers: 32,
    defaultSeqLen: 8192,
    notes: 'GQA 4:1 分组，4 个 Q Head 共享 1 组 KV',
  },
  'llama3-70b': {
    name: 'Llama 3 70B',
    architecture: 'GQA',
    nHeads: 64,
    nKVHeads: 8,
    dModel: 8192,
    dHead: 128,
    nLayers: 80,
    defaultSeqLen: 8192,
    notes: 'GQA 8:1，极致 KV 压缩',
  },
  'deepseek-v3': {
    name: 'DeepSeek V3',
    architecture: 'MLA',
    nHeads: 128,
    nKVHeads: 1,
    dModel: 7168,
    dHead: 128,
    nLayers: 61,
    defaultSeqLen: 131072,
    notes: 'MLA: 低秩压缩 KV 到 512 维潜在空间',
  },
  'gemma3-27b': {
    name: 'Gemma 3 27B',
    architecture: 'GQA',
    nHeads: 32,
    nKVHeads: 16,
    dModel: 4608,
    dHead: 128,
    nLayers: 46,
    defaultSeqLen: 8192,
    notes: 'GQA 2:1 + SWA 混合策略',
  },
  'palm': {
    name: 'PaLM 540B',
    architecture: 'MQA',
    nHeads: 48,
    nKVHeads: 1,
    dModel: 18432,
    dHead: 256,
    nLayers: 118,
    defaultSeqLen: 2048,
    notes: 'MQA: 所有 Q Head 共享同一组 KV',
  },
  'starcoder': {
    name: 'StarCoder2 15B',
    architecture: 'MQA',
    nHeads: 48,
    nKVHeads: 1,
    dModel: 6144,
    dHead: 128,
    nLayers: 40,
    defaultSeqLen: 16384,
    notes: 'MQA 用于代码模型的高吞吐推理',
  },
  'gpt4-est': {
    name: 'GPT-4 (推测)',
    architecture: 'MHA',
    nHeads: 96,
    nKVHeads: 96,
    dModel: 12288,
    dHead: 128,
    nLayers: 120,
    defaultSeqLen: 8192,
    notes: '参数为社区推测值，非官方数据',
  },
};

export const ARCHITECTURE_INFO: Record<string, { label: string; color: string; darkColor: string; description: string; kvFormula: string }> = {
  MHA: {
    label: 'Multi-Head Attention',
    color: '#6366f1',
    darkColor: '#818cf8',
    description: '每个 Head 独立拥有 Q/K/V 投影。参数最多，KV Cache 最大，但表达能力最强。',
    kvFormula: '2 × n_heads × d_head × seq_len × n_layers × precision',
  },
  GQA: {
    label: 'Grouped-Query Attention',
    color: '#10b981',
    darkColor: '#34d399',
    description: '多个 Query Head 共享一组 KV Head。在保持质量的同时显著减少 KV Cache。Llama 3 / Gemma 3 的选择。',
    kvFormula: '2 × n_kv_heads × d_head × seq_len × n_layers × precision',
  },
  MQA: {
    label: 'Multi-Query Attention',
    color: '#f59e0b',
    darkColor: '#fbbf24',
    description: '所有 Query Head 共享同一组 KV。KV Cache 最小，推理最快，但质量可能下降。',
    kvFormula: '2 × 1 × d_head × seq_len × n_layers × precision',
  },
  MLA: {
    label: 'Multi-head Latent Attention',
    color: '#ec4899',
    darkColor: '#f472b6',
    description: '将 KV 压缩到低维潜在空间，推理时解压。DeepSeek V2/V3 的创新，兼顾极低 Cache 和高质量。',
    kvFormula: '2 × d_compressed × seq_len × n_layers × precision (d_compressed ≈ 512)',
  },
};
