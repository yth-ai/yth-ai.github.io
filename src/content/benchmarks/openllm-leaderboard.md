---
title: "Open LLM Leaderboard：开源模型排行"
description: "HuggingFace 维护的开源 LLM 排行榜，v2 使用 6 个核心基准评测"
date: 2024-06-01T00:00
benchName: "Open LLM Leaderboard"
version: "v2"
org: "HuggingFace"
website: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard"
category: "综合"
subcategory: "排行榜"
abilities: ["综合能力", "指令跟随", "推理", "知识"]
dataSize: "6 个核心基准"
construction: "整合已有基准"
evalMethod: "多基准加权"
metric: "Average Score (%)"
topResults:
  - model: "Qwen2.5-72B"
    score: "~72%"
    date: "2025-06"
tags: ["排行榜", "开源", "综合"]
status: "active"
importance: 4
---
## 为什么重要
HuggingFace 维护的开源 LLM 排行榜。v2 使用 6 个核心基准（IFEval、BBH、MATH Hard、GPQA、MuSR、MMLU-Pro），是开源模型选型的核心参考。

## 构建方式
1. 整合 6 个高区分度基准
2. 自动化评测流程（任何人都可以提交模型）
3. 统一的评测框架（lm-evaluation-harness）

## 关联基准
组成基准：[IFEval](/benchmarks/ifeval)、[BBH](/benchmarks/bbh)、[MATH](/benchmarks/math-benchmark)、[GPQA](/benchmarks/gpqa)、[MuSR](/benchmarks/musr)、[MMLU-Pro](/benchmarks/mmlu-pro)

## 不足与展望
- 只测开源模型（闭源模型不参与）
- 6 个基准可能不够覆盖所有能力
- 存在过拟合风险——有些模型专门针对这 6 个基准优化
