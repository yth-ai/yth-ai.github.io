/**
 * Embedding 全景工作台 — 降维算法
 * PCA (power iteration) + t-SNE + 简化版 UMAP
 */

// ================================================================
// PCA — 幂迭代求 Top-2 主成分
// ================================================================

export function pca2D(data: number[][]): number[][] {
  const n = data.length;
  const d = data[0].length;

  const mean = new Array(d).fill(0);
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j] / n;
  const centered = data.map((row) => row.map((v, j) => v - mean[j]));

  function topEig(mat: number[][], deflated?: number[]): number[] {
    let v = Array.from({ length: d }, (_, i) => Math.sin(i + 1));
    const norm = (arr: number[]) => Math.sqrt(arr.reduce((s, x) => s + x * x, 0));
    let vn = norm(v);
    v = v.map((x) => x / vn);

    for (let iter = 0; iter < 100; iter++) {
      const newV = new Array(d).fill(0);
      for (const row of mat) {
        const dot = row.reduce((s, x, j) => s + x * v[j], 0);
        for (let j = 0; j < d; j++) newV[j] += row[j] * dot;
      }
      if (deflated) {
        const proj = newV.reduce((s, x, j) => s + x * deflated[j], 0);
        for (let j = 0; j < d; j++) newV[j] -= proj * deflated[j];
      }
      vn = norm(newV);
      if (vn < 1e-10) break;
      v = newV.map((x) => x / vn);
    }
    return v;
  }

  const pc1 = topEig(centered);
  const pc2 = topEig(centered, pc1);

  return centered.map((row) => [
    row.reduce((s, x, j) => s + x * pc1[j], 0),
    row.reduce((s, x, j) => s + x * pc2[j], 0),
  ]);
}

// ================================================================
// t-SNE — 简化版（适用于 ≤ 200 点）
// ================================================================

export function tsne2D(data: number[][], perplexity = 15, iterations = 500): number[][] {
  const n = data.length;
  const dim = data[0].length;

  const dist2 = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let d = 0;
      for (let k = 0; k < dim; k++) d += (data[i][k] - data[j][k]) ** 2;
      dist2[i][j] = d;
      dist2[j][i] = d;
    }
  }

  const P = Array.from({ length: n }, () => new Float64Array(n));
  const targetH = Math.log(perplexity);

  for (let i = 0; i < n; i++) {
    let lo = 1e-10, hi = 1e4, beta = 1;
    for (let iter = 0; iter < 50; iter++) {
      let sumP = 0, H = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const pj = Math.exp(-dist2[i][j] * beta);
        P[i][j] = pj;
        sumP += pj;
      }
      for (let j = 0; j < n; j++) {
        if (j === i) { P[i][j] = 0; continue; }
        P[i][j] /= sumP;
        if (P[i][j] > 1e-10) H -= P[i][j] * Math.log(P[i][j]);
      }
      if (Math.abs(H - targetH) < 1e-5) break;
      if (H > targetH) { lo = beta; beta = hi === 1e4 ? beta * 2 : (beta + hi) / 2; }
      else { hi = beta; beta = (beta + lo) / 2; }
    }
  }

  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const val = (P[i][j] + P[j][i]) / (2 * n);
      P[i][j] = val;
      P[j][i] = val;
    }

  const Y = pca2D(data).map(([x, y]) => [x * 0.01, y * 0.01]);
  const gains = Array.from({ length: n }, () => [1, 1]);
  const iY = Array.from({ length: n }, () => [0, 0]);
  const lr = 100;
  const momentum0 = 0.5, momentumF = 0.8;

  for (let t = 0; t < iterations; t++) {
    const mom = t < 250 ? momentum0 : momentumF;
    const qNum = Array.from({ length: n }, () => new Float64Array(n));
    let sumQ = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d2 = (Y[i][0] - Y[j][0]) ** 2 + (Y[i][1] - Y[j][1]) ** 2;
        const q = 1 / (1 + d2);
        qNum[i][j] = q;
        qNum[j][i] = q;
        sumQ += 2 * q;
      }

    for (let i = 0; i < n; i++) {
      let gx = 0, gy = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const mult = 4 * (P[i][j] - qNum[i][j] / sumQ) * qNum[i][j];
        gx += mult * (Y[i][0] - Y[j][0]);
        gy += mult * (Y[i][1] - Y[j][1]);
      }
      for (let d = 0; d < 2; d++) {
        const g = d === 0 ? gx : gy;
        gains[i][d] = Math.sign(g) !== Math.sign(iY[i][d]) ? gains[i][d] + 0.2 : gains[i][d] * 0.8;
        if (gains[i][d] < 0.01) gains[i][d] = 0.01;
      }
      iY[i][0] = mom * iY[i][0] - lr * gains[i][0] * gx;
      iY[i][1] = mom * iY[i][1] - lr * gains[i][1] * gy;
      Y[i][0] += iY[i][0];
      Y[i][1] += iY[i][1];
    }

    let mx = 0, my = 0;
    for (let i = 0; i < n; i++) { mx += Y[i][0]; my += Y[i][1]; }
    mx /= n; my /= n;
    for (let i = 0; i < n; i++) { Y[i][0] -= mx; Y[i][1] -= my; }
  }

  return Y;
}

// ================================================================
// UMAP — 简化版（k-NN 图 + 力导向布局）
// ================================================================

export function umap2D(data: number[][], k = 15, iterations = 200): number[][] {
  const n = data.length;
  const dim = data[0].length;

  // 欧氏距离
  function dist(a: number[], b: number[]): number {
    let s = 0;
    for (let i = 0; i < dim; i++) s += (a[i] - b[i]) ** 2;
    return Math.sqrt(s);
  }

  // k-NN 图
  const knn: number[][] = [];
  const knnDist: number[][] = [];
  for (let i = 0; i < n; i++) {
    const dists: { j: number; d: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      dists.push({ j, d: dist(data[i], data[j]) });
    }
    dists.sort((a, b) => a.d - b.d);
    const topK = dists.slice(0, k);
    knn.push(topK.map((x) => x.j));
    knnDist.push(topK.map((x) => x.d));
  }

  // 计算 sigma (smooth kNN distances)
  const sigma: number[] = [];
  for (let i = 0; i < n; i++) {
    const rho = knnDist[i][0]; // distance to nearest neighbor
    let lo = 1e-10, hi = 100, mid = 1;
    const target = Math.log2(k);
    for (let iter = 0; iter < 64; iter++) {
      mid = (lo + hi) / 2;
      let sum = 0;
      for (let j = 0; j < k; j++) {
        const d = Math.max(knnDist[i][j] - rho, 0);
        sum += Math.exp(-d / mid);
      }
      if (Math.abs(sum - target) < 1e-5) break;
      if (sum > target) hi = mid;
      else lo = mid;
    }
    sigma.push(mid);
  }

  // 构建高维权重矩阵（稀疏，仅 k-NN 边）
  const W = new Map<string, number>();
  const edgeKey = (i: number, j: number) => i < j ? `${i}-${j}` : `${j}-${i}`;
  
  for (let i = 0; i < n; i++) {
    const rho = knnDist[i][0];
    for (let idx = 0; idx < k; idx++) {
      const j = knn[i][idx];
      const d = Math.max(knnDist[i][idx] - rho, 0);
      const w = Math.exp(-d / sigma[i]);
      const key = edgeKey(i, j);
      const existing = W.get(key) || 0;
      // Fuzzy union: w_ij + w_ji - w_ij * w_ji
      W.set(key, existing + w - existing * w);
    }
  }

  // 初始化用 PCA
  const Y = pca2D(data).map(([x, y]) => [x * 0.1, y * 0.1]);

  // 力导向优化
  const a = 1.0, b = 1.0;
  const lr0 = 1.0;

  const edges = Array.from(W.entries()).map(([key, weight]) => {
    const [i, j] = key.split('-').map(Number);
    return { i, j, w: weight };
  });

  for (let t = 0; t < iterations; t++) {
    const lr = lr0 * (1 - t / iterations);
    if (lr < 0.001) break;

    // Attractive forces (along edges)
    for (const { i, j, w } of edges) {
      const dx = Y[i][0] - Y[j][0];
      const dy = Y[i][1] - Y[j][1];
      const d2 = dx * dx + dy * dy + 1e-4;
      const d = Math.sqrt(d2);
      const grad = (-2 * a * b * Math.pow(d2, (b - 1) / 2)) / (1 + a * Math.pow(d2, b));
      const fx = grad * dx * w * lr;
      const fy = grad * dy * w * lr;
      Y[i][0] += fx;
      Y[i][1] += fy;
      Y[j][0] -= fx;
      Y[j][1] -= fy;
    }

    // Repulsive forces (negative sampling)
    for (let i = 0; i < n; i++) {
      for (let s = 0; s < 5; s++) {
        const j = Math.floor(Math.random() * n);
        if (j === i) continue;
        const dx = Y[i][0] - Y[j][0];
        const dy = Y[i][1] - Y[j][1];
        const d2 = dx * dx + dy * dy + 1e-4;
        const grad = (2 * b) / ((0.001 + d2) * (1 + a * Math.pow(d2, b)));
        const clipped = Math.min(grad, 4);
        Y[i][0] += clipped * dx * lr * 0.1;
        Y[i][1] += clipped * dy * lr * 0.1;
      }
    }

    // Re-center
    let mx = 0, my = 0;
    for (let i = 0; i < n; i++) { mx += Y[i][0]; my += Y[i][1]; }
    mx /= n; my /= n;
    for (let i = 0; i < n; i++) { Y[i][0] -= mx; Y[i][1] -= my; }
  }

  return Y;
}

// ================================================================
// 工具函数
// ================================================================

/** 归一化到 [0, 1] */
export function normalize2D(coords: number[][]): number[][] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;
  return coords.map(([x, y]) => [(x - minX) / rx, (y - minY) / ry]);
}
