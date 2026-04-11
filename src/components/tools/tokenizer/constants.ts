// ============================================================
// Tokenizer Visualizer - Constants & Presets
// ============================================================

export interface TokenizerPreset {
  name: string;
  description: string;
  vocabSize: number;
  specialTokens: Record<string, number>;
}

export const TOKENIZER_PRESETS: Record<string, TokenizerPreset> = {
  'gpt4': {
    name: 'GPT-4 (cl100k_base)',
    description: 'OpenAI GPT-4/ChatGPT 使用的 tokenizer，词表 100K',
    vocabSize: 100277,
    specialTokens: { '<|endoftext|>': 100257, '<|fim_prefix|>': 100258, '<|fim_middle|>': 100259, '<|fim_suffix|>': 100260 },
  },
  'gpt4o': {
    name: 'GPT-4o (o200k_base)',
    description: 'OpenAI GPT-4o 使用的 tokenizer，词表 200K，对非英语语言压缩率更优',
    vocabSize: 200019,
    specialTokens: { '<|endoftext|>': 199999, '<|fim_prefix|>': 200000, '<|fim_middle|>': 200001, '<|fim_suffix|>': 200002 },
  },
  'llama': {
    name: 'LLaMA (SentencePiece)',
    description: 'Meta LLaMA 系列使用的 SentencePiece BPE tokenizer，词表 32K',
    vocabSize: 32000,
    specialTokens: { '<s>': 1, '</s>': 2, '<unk>': 0 },
  },
  'chinese': {
    name: 'Chinese-optimized',
    description: '中文优化 tokenizer，对中文字符压缩率更高，词表 64K',
    vocabSize: 64000,
    specialTokens: { '[CLS]': 101, '[SEP]': 102, '[PAD]': 0, '[UNK]': 100 },
  },
  'qwen': {
    name: 'Qwen (tiktoken)',
    description: '通义千问系列 tokenizer，对中英文均有优化，词表 152K',
    vocabSize: 152064,
    specialTokens: { '<|endoftext|>': 151643, '<|im_start|>': 151644, '<|im_end|>': 151645 },
  },
};

// Color palette for token highlighting (20 distinct colors)
export const TOKEN_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.25)', border: 'rgba(59, 130, 246, 0.5)' },
  { bg: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 0.5)' },
  { bg: 'rgba(245, 158, 11, 0.25)', border: 'rgba(245, 158, 11, 0.5)' },
  { bg: 'rgba(239, 68, 68, 0.25)', border: 'rgba(239, 68, 68, 0.5)' },
  { bg: 'rgba(168, 85, 247, 0.25)', border: 'rgba(168, 85, 247, 0.5)' },
  { bg: 'rgba(236, 72, 153, 0.25)', border: 'rgba(236, 72, 153, 0.5)' },
  { bg: 'rgba(6, 182, 212, 0.25)', border: 'rgba(6, 182, 212, 0.5)' },
  { bg: 'rgba(132, 204, 22, 0.25)', border: 'rgba(132, 204, 22, 0.5)' },
  { bg: 'rgba(251, 146, 60, 0.25)', border: 'rgba(251, 146, 60, 0.5)' },
  { bg: 'rgba(99, 102, 241, 0.25)', border: 'rgba(99, 102, 241, 0.5)' },
  { bg: 'rgba(20, 184, 166, 0.25)', border: 'rgba(20, 184, 166, 0.5)' },
  { bg: 'rgba(244, 63, 94, 0.25)', border: 'rgba(244, 63, 94, 0.5)' },
  { bg: 'rgba(34, 197, 94, 0.25)', border: 'rgba(34, 197, 94, 0.5)' },
  { bg: 'rgba(234, 179, 8, 0.25)', border: 'rgba(234, 179, 8, 0.5)' },
  { bg: 'rgba(139, 92, 246, 0.25)', border: 'rgba(139, 92, 246, 0.5)' },
  { bg: 'rgba(14, 165, 233, 0.25)', border: 'rgba(14, 165, 233, 0.5)' },
  { bg: 'rgba(217, 70, 239, 0.25)', border: 'rgba(217, 70, 239, 0.5)' },
  { bg: 'rgba(249, 115, 22, 0.25)', border: 'rgba(249, 115, 22, 0.5)' },
  { bg: 'rgba(52, 211, 153, 0.25)', border: 'rgba(52, 211, 153, 0.5)' },
  { bg: 'rgba(96, 165, 250, 0.25)', border: 'rgba(96, 165, 250, 0.5)' },
];

export const SAMPLE_TEXTS = {
  'chinese': '大语言模型的训练需要海量高质量数据。中训练阶段通过精心筛选的数据集来提升模型在特定领域的能力，这是预训练和微调之间的重要桥梁。',
  'english': 'Large language models require massive amounts of high-quality training data. The pre-training phase uses carefully curated datasets to build foundational capabilities.',
  'code': 'def attention(query, key, value, mask=None):\n    d_k = query.size(-1)\n    scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(d_k)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    return torch.matmul(F.softmax(scores, dim=-1), value)',
  'mixed': '根据 Scaling Laws，模型参数量 N 和训练数据量 D 需要满足 N ∝ D^0.74 的比例关系。GPT-4 大约使用了 13T tokens 进行训练。',
};

// BPE learning mode presets
export const BPE_CORPUS_PRESETS = {
  simple: {
    label: '简单英文',
    text: 'the cat sat on the mat the cat ate the rat',
    description: '经典示例：大量重复的短单词，便于观察高频 pair 合并',
  },
  code: {
    label: 'Python 代码',
    text: 'def add(a, b): return a + b\ndef sub(a, b): return a - b',
    description: '代码片段：观察函数名、关键词和符号的合并模式',
  },
  mixed: {
    label: '中英混合',
    text: 'AI模型训练需要data数据和model模型',
    description: '混合文本：观察中英文字符在 BPE 中的不同合并策略',
  },
};
