---
title: "LongFact：长文本事实性评测"
description: "Google 提出，评估 LLM 生成长篇回复时的事实准确性，覆盖 38 个主题"
date: 2024-03-01T00:00
benchName: "LongFact"
org: "Google DeepMind"
paper: "arXiv:2403.18802"
category: "长文本"
subcategory: "推理"
abilities: ["长文本生成", "事实准确性", "幻觉检测"]
dataSize: "2280 prompts / 38 topics"
construction: "专家设计"
evalMethod: "Search-Augmented Factuality Evaluator (SAFE)"
metric: "F1@K"
topResults:
  - model: "GPT-4 Turbo"
    score: "~73% F1@64"
    date: "2024-03"
tags: ["长文本", "事实性", "幻觉"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
Google 提出，评估 LLM 生成长篇回复时的事实准确性。用 SAFE 方法自动验证每个声明。

## 构建方式与示例
2280 prompts / 38 topics。例如："详细介绍 CRISPR 基因编辑的原理和应用"→ 验证回复中每个事实声明。

## 关联基准与展望
关联：[SimpleQA](/benchmarks/simpleqa)、[TruthfulQA](/benchmarks/truthfulqa)。不足：SAFE 验证器本身可能有误。
