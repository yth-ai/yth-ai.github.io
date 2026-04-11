// ============================================================
// LLM Calculator 2.0 — Model Presets (Dense + MoE)
// ============================================================

import type { ModelConfig } from './types';

export const PRESETS: Record<string, ModelConfig> = {
  'custom': {
    name: '自定义', hiddenSize: 4096, numLayers: 32, numHeads: 32, numKVHeads: 32,
    intermediateSize: 11008, vocabSize: 32000, maxSeqLen: 4096, isMoE: false,
  },

  // === Dense ===
  'llama2-7b': {
    name: 'LLaMA-2 7B', hiddenSize: 4096, numLayers: 32, numHeads: 32, numKVHeads: 32,
    intermediateSize: 11008, vocabSize: 32000, maxSeqLen: 4096, isMoE: false, year: 2023,
  },
  'llama2-70b': {
    name: 'LLaMA-2 70B', hiddenSize: 8192, numLayers: 80, numHeads: 64, numKVHeads: 8,
    intermediateSize: 28672, vocabSize: 32000, maxSeqLen: 4096, isMoE: false, year: 2023,
  },
  'llama3-8b': {
    name: 'LLaMA-3 8B', hiddenSize: 4096, numLayers: 32, numHeads: 32, numKVHeads: 8,
    intermediateSize: 14336, vocabSize: 128256, maxSeqLen: 8192, isMoE: false, year: 2024,
  },
  'llama3-70b': {
    name: 'LLaMA-3 70B', hiddenSize: 8192, numLayers: 80, numHeads: 64, numKVHeads: 8,
    intermediateSize: 28672, vocabSize: 128256, maxSeqLen: 8192, isMoE: false, year: 2024,
  },
  'llama31-405b': {
    name: 'LLaMA-3.1 405B', hiddenSize: 16384, numLayers: 126, numHeads: 128, numKVHeads: 8,
    intermediateSize: 53248, vocabSize: 128256, maxSeqLen: 131072, isMoE: false, year: 2024,
  },
  'qwen3-8b': {
    name: 'Qwen-3 8B', hiddenSize: 4096, numLayers: 36, numHeads: 32, numKVHeads: 8,
    intermediateSize: 14336, vocabSize: 151936, maxSeqLen: 32768, isMoE: false, year: 2025,
  },
  'qwen25-72b': {
    name: 'Qwen-2.5 72B', hiddenSize: 8192, numLayers: 80, numHeads: 64, numKVHeads: 8,
    intermediateSize: 29568, vocabSize: 152064, maxSeqLen: 131072, isMoE: false, year: 2025,
  },
  'mistral-7b': {
    name: 'Mistral 7B', hiddenSize: 4096, numLayers: 32, numHeads: 32, numKVHeads: 8,
    intermediateSize: 14336, vocabSize: 32000, maxSeqLen: 32768, isMoE: false, year: 2023,
  },
  'gemma2-27b': {
    name: 'Gemma-2 27B', hiddenSize: 4608, numLayers: 46, numHeads: 32, numKVHeads: 16,
    intermediateSize: 36864, vocabSize: 256000, maxSeqLen: 8192, isMoE: false, year: 2024,
  },
  'gpt3-175b': {
    name: 'GPT-3 175B', hiddenSize: 12288, numLayers: 96, numHeads: 96, numKVHeads: 96,
    intermediateSize: 49152, vocabSize: 50257, maxSeqLen: 2048, isMoE: false, year: 2020,
  },

  // === MoE ===
  'llama4-scout': {
    name: 'Llama 4 Scout', hiddenSize: 5120, numLayers: 48, numHeads: 40, numKVHeads: 8,
    intermediateSize: 13824, vocabSize: 202400, maxSeqLen: 131072,
    isMoE: true, numExperts: 16, activeExperts: 1, year: 2025,
    note: '109B total (推测)',
  },
  'llama4-maverick': {
    name: 'Llama 4 Maverick', hiddenSize: 5120, numLayers: 48, numHeads: 40, numKVHeads: 8,
    intermediateSize: 13824, vocabSize: 202400, maxSeqLen: 131072,
    isMoE: true, numExperts: 128, activeExperts: 1, year: 2025,
    note: '400B total (推测)',
  },
  'deepseek-v3': {
    name: 'DeepSeek-V3', hiddenSize: 7168, numLayers: 61, numHeads: 128, numKVHeads: 128,
    intermediateSize: 18432, vocabSize: 129280, maxSeqLen: 131072,
    isMoE: true, numExperts: 256, activeExperts: 8, year: 2025,
    note: '671B total / ~37B active',
  },
  'deepseek-r1': {
    name: 'DeepSeek-R1', hiddenSize: 7168, numLayers: 61, numHeads: 128, numKVHeads: 128,
    intermediateSize: 18432, vocabSize: 129280, maxSeqLen: 131072,
    isMoE: true, numExperts: 256, activeExperts: 8, year: 2025,
    note: '同 V3 架构',
  },
  'mixtral-8x7b': {
    name: 'Mixtral 8x7B', hiddenSize: 4096, numLayers: 32, numHeads: 32, numKVHeads: 8,
    intermediateSize: 14336, vocabSize: 32000, maxSeqLen: 32768,
    isMoE: true, numExperts: 8, activeExperts: 2, year: 2024,
  },
};

export const PRESET_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Dense',
    keys: ['llama2-7b', 'llama2-70b', 'llama3-8b', 'llama3-70b', 'llama31-405b',
           'qwen3-8b', 'qwen25-72b', 'mistral-7b', 'gemma2-27b', 'gpt3-175b'],
  },
  {
    label: 'MoE',
    keys: ['llama4-scout', 'llama4-maverick', 'deepseek-v3', 'deepseek-r1', 'mixtral-8x7b'],
  },
];
