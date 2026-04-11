// ============================================================
// LLM Calculator 2.0 — Calculation Engine (Dense + MoE)
// ============================================================

import type { ModelConfig, ParamBreakdown, MemoryEstimate, KVCacheEstimate, InferenceEstimate, TrainingEstimate, GPUSpec } from './types';

// ---------- Formatting helpers ----------

export function formatNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(0);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(2) + ' TB';
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
  return (bytes / 1e3).toFixed(2) + ' KB';
}

export function formatCost(usd: number): string {
  if (usd >= 1e6) return '$' + (usd / 1e6).toFixed(1) + 'M';
  if (usd >= 1e3) return '$' + (usd / 1e3).toFixed(1) + 'K';
  return '$' + usd.toFixed(0);
}

// ---------- Parameter Calculation ----------

export function calculateParams(config: ModelConfig, tiedEmbedding = false): ParamBreakdown {
  const { hiddenSize: h, numLayers: L, numHeads, numKVHeads, intermediateSize: ffn, vocabSize: V } = config;
  const headDim = h / numHeads;

  const embedding = V * h;

  // Attention per layer
  const qProj = h * h;
  const kProj = h * (numKVHeads * headDim);
  const vProj = h * (numKVHeads * headDim);
  const oProj = h * h;
  const attnPerLayer = qProj + kProj + vProj + oProj;

  // MLP per layer (SwiGLU: gate + up + down)
  const mlpPerLayer = h * ffn * 3;

  // Norms
  const normPerLayer = 2 * h;

  // MoE
  const numExperts = config.isMoE ? (config.numExperts || 8) : 1;
  const activeExperts = config.isMoE ? (config.activeExperts || 2) : 1;
  const routerPerLayer = config.isMoE ? h * numExperts : 0;

  // Per-layer totals
  const perLayerTotal = attnPerLayer + normPerLayer + routerPerLayer + mlpPerLayer * numExperts;
  const perLayerActive = attnPerLayer + normPerLayer + routerPerLayer + mlpPerLayer * activeExperts;

  const allLayersTotal = perLayerTotal * L;

  const totalMlpAllLayers = mlpPerLayer * numExperts * L;
  const activeMlpAllLayers = mlpPerLayer * activeExperts * L;

  const finalNorm = h;
  const lmHead = tiedEmbedding ? 0 : V * h;

  const totalParams = embedding + allLayersTotal + finalNorm + lmHead;
  const activeParams = config.isMoE
    ? embedding + perLayerActive * L + finalNorm + lmHead
    : totalParams;

  return {
    embedding,
    attnPerLayer,
    mlpPerLayer,
    normPerLayer,
    routerPerLayer,
    perLayer: perLayerTotal,
    allLayers: allLayersTotal,
    finalNorm,
    lmHead,
    totalParams,
    activeParams,
    headDim,
    totalMlpAllLayers,
    activeMlpAllLayers,
    embeddingPct: (embedding / totalParams) * 100,
    attnPct: (attnPerLayer * L / totalParams) * 100,
    mlpPct: (totalMlpAllLayers / totalParams) * 100,
  };
}

// ---------- Memory ----------

export function calculateMemory(params: number): MemoryEstimate {
  return { fp32: params * 4, fp16: params * 2, int8: params * 1, int4: params * 0.5 };
}

// ---------- KV Cache ----------

export function calculateKVCache(config: ModelConfig, seqLen: number, batchSize: number, bytesPerParam = 2): KVCacheEstimate {
  const headDim = config.hiddenSize / config.numHeads;
  const perTokenBytes = 2 * config.numLayers * config.numKVHeads * headDim * bytesPerParam;
  const totalBytes = perTokenBytes * seqLen * batchSize;
  const fullMHAPerToken = 2 * config.numLayers * config.numHeads * headDim * bytesPerParam;
  const gqaSaving = fullMHAPerToken / perTokenBytes;
  return { perTokenBytes, totalBytes, gqaSaving };
}

// ---------- Inference ----------

export function calculateInference(
  config: ModelConfig,
  params: ParamBreakdown,
  gpu: GPUSpec,
  numGPUs: number,
  seqLen: number,
  batchSize: number,
  quantBits: number,
): InferenceEstimate {
  const modelWeightBytes = params.totalParams * quantBits;
  const kvCache = calculateKVCache(config, seqLen, batchSize);
  const kvCacheBytes = kvCache.totalBytes;
  const totalBytes = modelWeightBytes + kvCacheBytes;

  // Prefill: compute-bound
  const prefillFlops = 2 * params.activeParams * seqLen;
  const gpuFlopsPerSec = gpu.bf16Tflops * 1e12 * numGPUs * 0.5;
  const prefillTime = prefillFlops / gpuFlopsPerSec;
  const prefillTPS = seqLen / Math.max(prefillTime, 1e-9);

  // Decode: memory-bandwidth-bound
  const weightReadBytes = params.activeParams * quantBits;
  const bandwidthBytesPerSec = gpu.bandwidthTBs * 1e12 * numGPUs;
  const timePerToken = weightReadBytes / bandwidthBytesPerSec;
  const decodeTPS = batchSize / Math.max(timePerToken, 1e-9);

  const monthCostUSD = gpu.pricePerHour * numGPUs * 24 * 30;

  return { modelWeightBytes, kvCacheBytes, totalBytes, prefillTPS, decodeTPS, monthCostUSD };
}

// ---------- Training ----------

export function calculateTraining(
  params: ParamBreakdown,
  config: ModelConfig,
  numTokens: number,
  numGPUs: number,
  gpu: GPUSpec,
  mfu: number,
): TrainingEstimate {
  const flops = 6 * params.activeParams * numTokens;
  const gpuFlopsPerSec = gpu.bf16Tflops * 1e12;
  const effectiveFlops = gpuFlopsPerSec * numGPUs * mfu;
  const trainingSeconds = flops / effectiveFlops;
  const trainingDays = trainingSeconds / 86400;

  const modelMem = params.totalParams * 2;
  const gradMem = params.totalParams * 2;
  const optimMem = params.totalParams * 8;
  const activationMem = config.hiddenSize * Math.min(config.maxSeqLen, 4096) * config.numLayers * 2 * 34;
  const totalTrainingMem = modelMem + gradMem + optimMem + activationMem;
  const costUSD = gpu.pricePerHour * numGPUs * trainingDays * 24;

  return { flops, trainingDays, modelMem, gradMem, optimMem, activationMem, totalTrainingMem, mfu, costUSD };
}

// ---------- Scaling Strategies ----------

export interface ScalingStrategy {
  name: string;
  label: string;
  tokensForParams: (params: number) => number;
  color: string;
}

export const SCALING_STRATEGIES: ScalingStrategy[] = [
  { name: 'chinchilla', label: 'Chinchilla (D=20N)', tokensForParams: (n) => 20 * n, color: '#10b981' },
  { name: 'llama3', label: 'LLaMA-3 (D=200N small)', tokensForParams: (n) => n < 20e9 ? 200 * n : 50 * n, color: '#6366f1' },
  { name: 'overtrain', label: 'Over-train (D=100N)', tokensForParams: (n) => 100 * n, color: '#f59e0b' },
];

// ---------- GPU Presets ----------

export const GPU_PRESETS: GPUSpec[] = [
  { name: 'H100 80GB', memoryGB: 80, bf16Tflops: 989, fp8Tflops: 1979, bandwidthTBs: 3.35, pricePerHour: 2.5 },
  { name: 'H200 141GB', memoryGB: 141, bf16Tflops: 989, fp8Tflops: 1979, bandwidthTBs: 4.8, pricePerHour: 3.5 },
  { name: 'A100 80GB', memoryGB: 80, bf16Tflops: 312, fp8Tflops: 312, bandwidthTBs: 2.0, pricePerHour: 1.5 },
  { name: 'RTX 4090 24GB', memoryGB: 24, bf16Tflops: 330, fp8Tflops: 660, bandwidthTBs: 1.01, pricePerHour: 0.4 },
  { name: 'MI300X 192GB', memoryGB: 192, bf16Tflops: 1307, fp8Tflops: 2614, bandwidthTBs: 5.3, pricePerHour: 3.0 },
  { name: 'B200 192GB', memoryGB: 192, bf16Tflops: 2250, fp8Tflops: 4500, bandwidthTBs: 8.0, pricePerHour: 5.0 },
];
