// Attention mechanism evolution timeline data

export interface TimelineEntry {
  year: number;
  month?: number;
  name: string;
  shortName: string;
  authors: string;
  paper: string;
  description: string;
  representativeModels: string[];
  kvCacheCharacteristic: string;
  verdict: string;
  isCurrent?: boolean;
  color: string;
}

export const ATTENTION_TIMELINE: TimelineEntry[] = [
  {
    year: 2017,
    name: 'Multi-Head Attention (MHA)',
    shortName: 'MHA',
    authors: 'Vaswani et al.',
    paper: 'Attention Is All You Need',
    description: '每个 Head 拥有独立的 Q/K/V 投影矩阵。通过多个 Head 并行捕获不同子空间的信息，奠定了 Transformer 的基础架构。',
    representativeModels: ['GPT-2', 'BERT', 'OLMo', 'GPT-3'],
    kvCacheCharacteristic: 'KV Cache = 2 × n_heads × d_head × seq_len × layers',
    verdict: '经典基线，表达能力强但推理内存开销大',
    color: '#6366f1',
  },
  {
    year: 2019,
    name: 'Multi-Query Attention (MQA)',
    shortName: 'MQA',
    authors: 'Shazeer',
    paper: 'Fast Transformer Decoding: One Write-Head is All You Need',
    description: '所有 Query Head 共享同一组 Key-Value Head。极致的 KV 压缩，推理速度提升显著，但质量可能略有下降。',
    representativeModels: ['PaLM', 'StarCoder', 'Falcon'],
    kvCacheCharacteristic: 'KV Cache 降为 MHA 的 1/n_heads',
    verdict: '极致推理效率，质量牺牲可接受',
    color: '#f59e0b',
  },
  {
    year: 2020,
    name: 'Sparse Attention',
    shortName: 'Sparse',
    authors: 'Beltagy et al.',
    paper: 'Longformer: The Long-Document Transformer',
    description: '用局部窗口 + 全局 token 的组合替代完整 N×N 注意力矩阵，将复杂度从 O(N²) 降到 O(N)。',
    representativeModels: ['Longformer', 'BigBird', 'LED'],
    kvCacheCharacteristic: '只缓存窗口内和全局 token 的 KV',
    verdict: '长文档先驱，但被 Flash Attention 部分替代',
    color: '#64748b',
  },
  {
    year: 2022,
    name: 'Flash Attention',
    shortName: 'FlashAttn',
    authors: 'Dao et al.',
    paper: 'FlashAttention: Fast and Memory-Efficient Exact Attention',
    description: 'IO-aware 的精确注意力算法。通过分块计算和减少 HBM 访问次数，在不改变数学等价性的前提下实现 2-4× 加速。',
    representativeModels: ['几乎所有 2023+ 模型'],
    kvCacheCharacteristic: '不改变 KV Cache 大小，优化计算效率',
    verdict: '改变游戏规则的系统优化，成为事实标准',
    color: '#0ea5e9',
  },
  {
    year: 2023,
    name: 'Grouped-Query Attention (GQA)',
    shortName: 'GQA',
    authors: 'Ainslie et al.',
    paper: 'GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints',
    description: '多个 Query Head 分组共享 KV Head。MHA 与 MQA 的折中方案——既保留多样性又减少内存。',
    representativeModels: ['Llama 2 70B', 'Llama 3', 'Gemma 3', 'Mistral'],
    kvCacheCharacteristic: 'KV Cache = MHA 的 n_kv_heads/n_heads',
    verdict: '2024-2025 年最主流的选择',
    isCurrent: true,
    color: '#10b981',
  },
  {
    year: 2024,
    month: 5,
    name: 'Multi-head Latent Attention (MLA)',
    shortName: 'MLA',
    authors: 'DeepSeek AI',
    paper: 'DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model',
    description: '将 KV 投影到低维压缩潜在空间（~512 维），推理时从潜在表示解压。兼顾极低 Cache 和高质量输出。',
    representativeModels: ['DeepSeek V2', 'DeepSeek V3', 'Kimi K2'],
    kvCacheCharacteristic: 'KV Cache ≈ MHA 的 1/10~1/20',
    verdict: '创新路线，验证了压缩 KV 的可行性',
    isCurrent: true,
    color: '#ec4899',
  },
  {
    year: 2024,
    month: 12,
    name: 'Sliding Window Attention (SWA)',
    shortName: 'SWA',
    authors: '多团队',
    paper: 'Gemma 3 / Mistral / OLMo 3',
    description: '固定窗口大小的局部注意力，配合周期性全注意力层形成混合策略。长序列下显存可控。',
    representativeModels: ['Gemma 3', 'Mistral', 'OLMo 3'],
    kvCacheCharacteristic: '窗口外 KV 可驱逐，显存与序列长度脱钩',
    verdict: '长上下文的实用方案，常与 GQA 搭配',
    color: '#8b5cf6',
  },
  {
    year: 2025,
    name: 'Hybrid Attention (Mamba-2 + Attn)',
    shortName: 'Hybrid',
    authors: 'Gu & Dao, et al.',
    paper: 'Mamba-2 / Jamba / Zamba',
    description: '将 SSM（如 Mamba）层与标准 Attention 层交替堆叠。SSM 处理长程依赖，Attention 处理精确检索。',
    representativeModels: ['Jamba', 'Zamba-2', 'RecurrentGemma'],
    kvCacheCharacteristic: 'SSM 层无 KV Cache，仅 Attention 层有',
    verdict: '探索方向，尚未成为主流',
    color: '#a855f7',
  },
  {
    year: 2026,
    name: 'DeepSeek Sparse Attention (DSA)',
    shortName: 'DSA',
    authors: 'DeepSeek AI',
    paper: 'Native Sparse Attention for Long Context',
    description: '学习得到的稀疏注意力模式。结合 top-k 选择和局部窗口，在 64K+ 上下文下保持高效。',
    representativeModels: ['DeepSeek V3 (推理优化)'],
    kvCacheCharacteristic: '仅缓存 top-k 和窗口内 token 的 KV',
    verdict: '最新前沿，学习稀疏替代固定模式',
    color: '#e11d48',
  },
];
