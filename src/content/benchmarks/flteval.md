---
title: "FLTEval：Lean 4 形式化证明工程评测"
description: "仓库级 Lean 4 形式化证明 benchmark，测试模型在真实 FLT 项目中完成证明和定义数学概念的能力"
date: 2026-03-16T09:00
benchName: "FLTEval"
version: "1.0"
org: "Mistral AI"
paper: ""
code: ""
venue: ""
website: "https://mistral.ai/news/leanstral"
category: "推理"
abilities: ["形式化证明", "Lean 4", "数学概念定义", "仓库级代码理解", "符号推理"]
dataSize: "FLT 项目 PR 级别任务集"
construction: "真实开源项目 (费马大定理 Lean 4 形式化)"
evalMethod: "Lean 编译器自动验证"
metric: "% PR 通过率"
topResults:
  - model: "Claude Opus 4.6"
    score: "39.6%"
    date: "2026-04"
  - model: "Claude Sonnet 4.6"
    score: "23.7%"
    date: "2026-04"
  - model: "Claude Haiku 4.5"
    score: "23.0%"
    date: "2026-04"
  - model: "Leanstral (Mistral)"
    score: "21.9%"
    date: "2026-03"
tags: ["形式化验证", "Lean 4", "数学证明", "定理证明", "FLT"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要

FLTEval 代表了 AI 形式化推理评测的新方向。与传统的竞赛数学证明不同，它要求模型在真实的费马大定理（Fermat's Last Theorem）Lean 4 形式化项目中工作——完成 PR 级别的证明补全和数学概念定义。由 Mistral AI 随 Leanstral 模型一同发布，是首个面向生产级形式化证明工程的 benchmark。

## 核心设计

- **仓库级**：模型需理解整个 FLT 项目的上下文，而非孤立的题目
- **PR 风格**：任务模拟真实的 Pull Request 工作流，包括证明补全和新概念定义
- **Lean 编译器验证**：不依赖 LLM 评判，由 Lean 4 编译器直接判定正确性，零歧义

## 关键发现

- **极高难度**：最强模型仅 39.6% 通过率，证明形式化推理仍是 AI 的重大挑战
- **Anthropic 领先**：Claude Opus 4.6 以 39.6% 大幅领先，比专门训练的 Leanstral 高出近 18 个百分点
- **中间集群密集**：第 2-4 名仅相差 1.8 个百分点（21.9%-23.7%），区分度有限
- 目前仅 4 个模型被评测，生态尚在早期

## 关联基准

- [FrontierMath](/benchmarks/frontiermath)：研究级数学推理
- [OmniMath](/benchmarks/omni-math)：开放式数学问题
- [MATH](/benchmarks/math-benchmark)：竞赛数学题集
