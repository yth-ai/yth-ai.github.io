---
title: "Codeforces Rating：竞赛编程评分"
description: "用 Codeforces 竞赛题评估模型的算法编程能力，以 Elo rating 衡量"
date: 2024-07-01
benchName: "Codeforces Rating"
org: "多个研究团队"
category: "代码生成"
subcategory: "竞赛编程"
abilities: ["竞赛编程", "算法", "数据结构", "数学", "Elo评分"]
dataSize: "持续更新"
evalMethod: "标准评测"
metric: "Elo Rating"
topResults:
  - model: "o3"
    score: "~2200 (Expert)"
  - model: "DeepSeek R1"
    score: "~1800 (Specialist)"
  - model: "Claude Opus 4"
    score: "~1600 (Specialist)"
  - model: "GPT-4o"
    score: "~1200 (Pupil)"
tags: ["竞赛编程", "Codeforces", "Elo"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Codeforces 是全球最大的编程竞赛平台，用 Elo Rating 衡量编程能力。直接在 Codeforces 上评测 LLM，得到的 Rating 可以与数百万人类程序员直接对比。

## 构建方式
1. 直接使用 Codeforces 竞赛题目（不需要构建——平台自带评测）
2. 模型提交代码 → 系统自动评判（与人类选手相同流程）
3. 根据通过的题目和竞赛结果计算 Elo Rating
4. Rating 分级：Newbie(<1200) → Expert(1600-1899) → Master(2100-2299) → Grandmaster(2400+)

## 任务示例
**Div 2 A**（简单）："给定数组 a，找到最小的 i 使得 a[i] > a[i+1]"
**Div 2 C**（中等）："构造一个满足给定约束条件的图"
**Div 1 D**（困难）：需要高级算法（线段树、网络流等）

## 关键发现
- o3 达到 ~2700 Rating（Grandmaster 级别），超过 99.9% 的人类选手
- DeepSeek R1 达到 ~2029 Rating（Candidate Master 级别）
- 推理模型的优势在 Codeforces 上体现最明显

## 关联基准
- [LiveCodeBench](/benchmarks/livecodebench)：同样基于竞赛平台的动态评测
- [USACO](/benchmarks/usaco)：更难的算法竞赛
- [AIME](/benchmarks/aime)：数学竞赛（类似的 Elo 概念）

## 不足与展望
- 偏向算法竞赛，与真实软件开发差距大
- 不测代码质量（只要能过就行）
- Elo 计算依赖竞赛参与人数，不同场次可能不可比
