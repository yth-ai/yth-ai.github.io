// KV Cache size calculator

export type Precision = 'fp16' | 'fp32' | 'fp8';

const PRECISION_BYTES: Record<Precision, number> = {
  fp16: 2,
  fp32: 4,
  fp8: 1,
};

export interface KVCacheParams {
  nKVHeads: number;
  dHead: number;
  seqLen: number;
  nLayers: number;
  precision: Precision;
}

/** Calculate KV Cache size in bytes */
export function calcKVCacheBytes(params: KVCacheParams): number {
  const { nKVHeads, dHead, seqLen, nLayers, precision } = params;
  // 2 for K and V, nKVHeads, dHead per head, seqLen tokens, nLayers
  return 2 * nKVHeads * dHead * seqLen * nLayers * PRECISION_BYTES[precision];
}

/** Calculate KV Cache for MLA (compressed latent) */
export function calcMLACacheBytes(seqLen: number, nLayers: number, precision: Precision, dCompressed: number = 512): number {
  // MLA stores compressed latent vectors instead of full KV
  return 2 * dCompressed * seqLen * nLayers * PRECISION_BYTES[precision];
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Calculate KV Cache for all 4 architectures given a base config */
export function calcAllArchitectures(config: {
  nHeads: number;
  nKVHeads: number;
  dHead: number;
  seqLen: number;
  nLayers: number;
  precision: Precision;
}) {
  const { nHeads, nKVHeads, dHead, seqLen, nLayers, precision } = config;

  const mha = calcKVCacheBytes({ nKVHeads: nHeads, dHead, seqLen, nLayers, precision });
  const gqa = calcKVCacheBytes({ nKVHeads, dHead, seqLen, nLayers, precision });
  const mqa = calcKVCacheBytes({ nKVHeads: 1, dHead, seqLen, nLayers, precision });
  const mla = calcMLACacheBytes(seqLen, nLayers, precision);

  return {
    MHA: { bytes: mha, label: formatBytes(mha), savingPct: 0 },
    GQA: { bytes: gqa, label: formatBytes(gqa), savingPct: ((mha - gqa) / mha) * 100 },
    MQA: { bytes: mqa, label: formatBytes(mqa), savingPct: ((mha - mqa) / mha) * 100 },
    MLA: { bytes: mla, label: formatBytes(mla), savingPct: ((mha - mla) / mha) * 100 },
  };
}

/** Estimate throughput (tokens/s) based on memory bandwidth constraints */
export function estimateThroughput(config: {
  kvCacheBytes: number;
  batchSize: number;
  nLayers: number;
  dModel: number;
  memoryBandwidthGBs?: number; // default A100 80GB HBM = 2039 GB/s
  gpuMemoryGB?: number; // default 80
}): { tokensPerSec: number; memoryUsedGB: number; fitsInMemory: boolean } {
  const {
    kvCacheBytes,
    batchSize,
    nLayers,
    dModel,
    memoryBandwidthGBs = 2039,
    gpuMemoryGB = 80,
  } = config;

  const totalKVBytes = kvCacheBytes * batchSize;
  const modelParamsBytes = nLayers * dModel * dModel * 4 * 2; // rough estimate
  const totalMemGB = (totalKVBytes + modelParamsBytes) / (1024 ** 3);

  const fitsInMemory = totalMemGB < gpuMemoryGB;

  // Simplified: throughput limited by memory bandwidth reading KV cache
  const bytesPerToken = totalKVBytes / 1024; // amortized
  const tokensPerSec = fitsInMemory
    ? (memoryBandwidthGBs * 1024 * 1024 * 1024) / Math.max(bytesPerToken, 1) / 1000
    : 0;

  return {
    tokensPerSec: Math.min(tokensPerSec, 50000), // cap at reasonable max
    memoryUsedGB: totalMemGB,
    fitsInMemory,
  };
}
