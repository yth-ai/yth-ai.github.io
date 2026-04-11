---
title: "IFEval：指令跟随精确评测"
description: "541 个带可验证约束的指令，纯自动评分"
date: 2023-11-01
benchName: "IFEval"
org: "Google"
paper: "arXiv:2311.07911"
category: "对齐与安全"
subcategory: "指令跟随"
abilities: ["指令跟随", "格式约束"]
dataSize: "541 prompts"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "92.4%"
  - model: "Claude Opus 4"
    score: "90.1%"
  - model: "GPT-4o"
    score: "84.4%"
tags: ["指令跟随", "格式约束"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
IFEval 解决了一个被忽视的问题：模型能不能**精确**遵循格式指令？比如"回答必须恰好 3 个段落"、"必须包含关键词 X"、"不得超过 100 个词"。在实际应用中（API 调用、结构化输出、自动化流水线），指令跟随的精确性至关重要。

## 构建方式
1. 设计 25 种可验证的约束类型（段落数、词数、关键词、大小写、语言等）
2. 541 个 prompt，每个包含 1-3 个约束
3. 评测方式：纯规则检查器（不依赖 LLM Judge），如 `len(paragraphs) == 3`
4. 两个指标：Instruction-level Accuracy（每条约束是否满足）和 Prompt-level Accuracy（所有约束都满足）

## 任务示例
**示例 1**："用恰好 3 个段落解释量子计算，每个段落不超过 50 个词，最后一段必须包含'未来'这个词"
**示例 2**："列出 5 个编程语言，用全大写，以项目符号格式"
**示例 3**："写一首四行诗，每行恰好 7 个词，不使用字母 e"

## 关键发现
- GPT-5 达 92.4%，但仍有 ~8% 的格式约束做不到
- 模型最容易失败的约束类型：精确词数控制、多约束组合
- 被 HuggingFace Open LLM Leaderboard v2 采用为核心基准之一

## 关联基准
- [AlpacaEval](/benchmarks/alpacaeval)：更宽泛的指令跟随质量
- [MT-Bench](/benchmarks/mt-bench)：多轮对话的指令跟随
- [Arena-Hard](/benchmarks/arena-hard)：高难度指令

## 不足与展望
- 约束类型相对简单（格式层面），没有测语义级约束（如"回答要有建设性"）
- 541 题可能不够——细分到每种约束类型时样本较少
- 实际应用中的格式约束更复杂（JSON schema、XML 格式等）——可能需要更专业的评测
