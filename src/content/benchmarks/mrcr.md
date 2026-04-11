---
title: "MRCR：多轮检索与推理"
description: "Google 提出的多轮检索与推理基准，评估模型在长对话中追踪信息并推理的能力"
date: 2025-01-01T00:00
benchName: "MRCR"
org: "Google"
category: "长文本"
subcategory: "检索"
abilities: ["多轮检索", "信息追踪", "长对话理解"]
dataSize: "动态生成"
construction: "合成"
evalMethod: "精确匹配"
metric: "Accuracy (%)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "~85%"
    date: "2025-11"
  - model: "Claude Opus 4"
    score: "~78%"
    date: "2025-12"
tags: ["长文本", "多轮", "检索"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
MRCR 是 Google 提出的多轮检索与推理基准，与 RULER 互补：RULER 侧重单轮多样化检索，MRCR 侧重多轮对话中的信息追踪。被 AwesomeAgents 排行榜采用为核心长文本指标之一。

## 构建方式
1. 合成多轮对话，每轮引入新信息
2. 要求模型在后续轮次中准确引用前面的信息
3. 动态生成，支持不同长度级别

## 关联基准
- [RULER](/benchmarks/ruler)、[LongBench](/benchmarks/longbench)、[InfiniteBench](/benchmarks/infinitebench)

## 不足与展望
- 合成数据与真实多轮对话有差距
- 主要测检索，推理维度覆盖不足
