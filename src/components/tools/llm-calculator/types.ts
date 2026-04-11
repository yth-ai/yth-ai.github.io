// ============================================================
// LLM Calculator 2.0 — Type Definitions
// ============================================================

export interface ModelConfig {
  name: string;
  hiddenSize: number;
  numLayers: number;
  numHeads: number;
  numKVHeads: number;
  intermediateSize: number;
  vocabSize: number;
  maxSeqLen: number;
  // MoE fields
  isMoE: boolean;
  numExperts?: number;
  activeExperts?: number;
  // Metadata
  year?: number;
  note?: string;
}

export interface ParamBreakdown {
  embedding: number;
  attnPerLayer: number;
  mlpPerLayer: number;
  normPerLayer: number;
  routerPerLayer: number;
  perLayer: number;
  allLayers: number;
  finalNorm: number;
  lmHead: number;
  totalParams: number;
  activeParams: number;
  headDim: number;
  totalMlpAllLayers: number;
  activeMlpAllLayers: number;
  embeddingPct: number;
  attnPct: number;
  mlpPct: number;
}

export interface MemoryEstimate {
  fp32: number;
  fp16: number;
  int8: number;
  int4: number;
}

export interface KVCacheEstimate {
  perTokenBytes: number;
  totalBytes: number;
  gqaSaving: number;
}

export interface InferenceEstimate {
  modelWeightBytes: number;
  kvCacheBytes: number;
  totalBytes: number;
  prefillTPS: number;
  decodeTPS: number;
  monthCostUSD: number;
}

export interface TrainingEstimate {
  flops: number;
  trainingDays: number;
  modelMem: number;
  gradMem: number;
  optimMem: number;
  activationMem: number;
  totalTrainingMem: number;
  mfu: number;
  costUSD: number;
}

export interface GPUSpec {
  name: string;
  memoryGB: number;
  bf16Tflops: number;
  fp8Tflops: number;
  bandwidthTBs: number;
  pricePerHour: number;
}
