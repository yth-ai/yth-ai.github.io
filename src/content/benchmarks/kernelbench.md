---
title: "KernelBench：LLM 能写出高效 GPU 内核吗"
description: "评估 LLM 编写正确且高效的 CUDA GPU 内核的能力，250 个 PyTorch ML 工作负载，三级难度"
date: 2026-02-15
benchName: "KernelBench"
version: "v0.1"
org: "Stanford Scaling Intelligence Lab"
paper: "arXiv:2502.10517"
code: "github.com/ScalingIntelligence/KernelBench"
venue: "ICML 2025"
category: "代码生成"
subcategory: "领域特化"
abilities: ["CUDA 编程", "GPU 内核优化", "算子融合", "硬件感知优化"]
dataSize: "250 tasks (3 levels)"
construction: "专家手工构建"
evalMethod: "编译+正确性+性能实测"
metric: "fast_p"
topResults:
  - model: "KernelSkill (Multi-Agent)"
    score: "100% success, 5.44x"
    date: "2026-03"
  - model: "DeepSeek R1 (iterative)"
    score: "72% fast₁ (L2)"
    date: "2025-02"
  - model: "OpenAI o1"
    score: "24% fast₁ (L2)"
    date: "2025-02"
  - model: "Claude 3.5 Sonnet"
    score: "10% fast₁ (L1)"
    date: "2025-02"
  - model: "GPT-4o"
    score: "5% fast₁ (L2)"
    date: "2025-02"
tags: ["CUDA", "GPU", "内核优化", "代码生成", "性能"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
KernelBench 是首个评测 LLM 编写高效 GPU 内核能力的基准。250 个 PyTorch 算子 → 手写 CUDA kernel，不仅要功能正确还要比 PyTorch 参考实现快——这是从"会写代码"到"会写高性能代码"的关键跨越。

## 构建方式
1. 从 PyTorch 中选取 250 个常用算子（矩阵乘法、卷积、softmax 等）
2. 三级难度：Level 1（单算子）、Level 2（算子融合）、Level 3（完整模型块）
3. 评测指标 fast_p：生成的 CUDA kernel 是否比 PyTorch 参考实现更快
4. 支持迭代优化：给模型执行反馈和 profiling 信息，多轮改进

## 任务示例
**Level 1**："将 `torch.matmul(A, B)` 替换为等价的 CUDA kernel，要求比 PyTorch 快"
**Level 2**："将 LayerNorm + Linear + GELU 三个操作融合为一个 CUDA kernel"
**Level 3**："优化完整的 Transformer attention block 的 CUDA 实现"

## 关键发现
- DeepSeek R1 单次生成最佳：Level 2 fast₁=36%
- **迭代+反馈可达 72%**——证明执行反馈对代码优化至关重要
- 算子融合（Level 2）是 LLM 最擅长的优化类型
- KernelSkill（多 Agent）框架达到 100% 成功率、5.44x 平均加速

## 关联基准
- [SWE-bench](/benchmarks/swe-bench)：仓库级代码修复
- [SciCode](/benchmarks/scicode)：科学计算代码生成
- [BigCodeBench](/benchmarks/bigcodebench)：实用编程综合

## 不足与展望
- 仅覆盖 CUDA/NVIDIA GPU，不包含 ROCm/Intel 等平台
- 优化目标单一（速度），没有测内存效率、功耗等维度
- 250 题偏少，部分算子类型覆盖不足
- 后续 MultiKernelBench 已开始扩展到多平台
