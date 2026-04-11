---
title: "LiveBench：抗污染的动态月更评测"
description: "每月更新题目避免数据污染，覆盖数学/代码/推理/语言/数据分析/指令跟随六大维度，全自动评分"
date: 2024-06-15
benchName: "LiveBench"
version: "2026-03"
org: "Abacus.AI & CMU & UIUC"
paper: "arXiv:2406.19314"
code: "github.com/LiveBench/LiveBench"
venue: ""
website: "https://livebench.ai"
category: "综合"
subcategory: "抗污染综合"
abilities: ["数学推理", "代码生成", "语言理解", "数据分析", "指令跟随", "逻辑推理"]
dataSize: "~1000 题/月 (动态更新)"
construction: "每月自动生成新题目"
evalMethod: "客观答案匹配 (无 LLM Judge)"
metric: "Global Average (%)"
topResults:
  - model: "Claude Opus 4"
    score: "76.8%"
    date: "2026-03"
  - model: "GPT-5"
    score: "75.2%"
    date: "2026-03"
  - model: "Gemini 2.5 Pro"
    score: "73.1%"
    date: "2026-03"
  - model: "DeepSeek R1"
    score: "66.9%"
    date: "2026-03"
tags: ["综合评测", "抗污染", "动态更新", "月更", "自动评分"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
LiveBench 是首个**月更**的 LLM 评测基准——每月更新题目防止数据污染，且所有评分都是纯客观的（无 LLM Judge），是目前最"干净"的综合评测。

## 构建方式
1. 每月从 6 个类别生成新题目：数学、编码、推理、语言、数据分析、指令跟随
2. 题目设计确保有客观的正确答案（不依赖 LLM 评分）
3. 旧题在数月后退役，防止被训练数据收录
4. 公开透明——所有题目和评分代码都开源

## 任务示例
**数学**：需要多步推理的数学应用题（每月新出）
**编码**：基于最新编程竞赛题目的变体
**推理**：逻辑谜题和空间推理
**数据分析**：给一个数据表，回答特定的分析问题

## 关键发现
- 是检测模型"真实能力变化"最可靠的基准（因为每月更新）
- 多个模型在旧题 vs 新题上的差距证实了数据污染的普遍性
- 被 HuggingFace Open LLM Leaderboard v2 考虑采用

## 关联基准
- [LiveCodeBench](/benchmarks/livecodebench)：代码领域的类似"月更"设计
- [Arena-Hard](/benchmarks/arena-hard)：另一个高区分度评测
- [Open LLM Leaderboard](/benchmarks/openllm-leaderboard)：综合排行

## 不足与展望
- 月更意味着历史数据不可比（每期的题目不同）
- 6 个类别可能不够覆盖所有重要能力
- 依赖人工出题，扩展性有限
