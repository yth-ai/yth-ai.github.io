---
title: "CNMO：中国数学奥林匹克"
description: "中国数学奥林匹克竞赛真题，考察高难度数学推理，DeepSeek 等中国模型的标志性基准"
date: 2024-01-01T00:00
benchName: "CNMO 2024"
org: "中国数学会"
category: "推理"
subcategory: "数学推理"
abilities: ["竞赛数学", "证明", "代数", "几何", "组合"]
dataSize: "6 题/年 (高难度)"
construction: "竞赛真题"
evalMethod: "步骤评分"
metric: "Score (%)"
topResults:
  - model: "DeepSeek R1"
    score: "67.6%"
    date: "2025-01"
  - model: "OpenAI o1"
    score: "~50%"
    date: "2024-12"
tags: ["数学", "竞赛", "中国", "奥赛"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
CNMO（中国数学奥林匹克）是中国的顶级数学竞赛，难度接近 IMO。DeepSeek R1 在 CNMO 2024 上达到 67.6%，成为中国模型在数学推理上的标志性成绩。

## 构建方式
1. 每年由中国数学会组织出题
2. 6 道证明/计算题，每题 21 分，总分 126 分
3. 题目涵盖代数、几何、数论、组合
4. 需要严格的数学证明（不是选择题）

## 任务示例
**示例**（2024 CNMO）："证明：对于所有正整数 n，存在一个 n 位数，使得其各位数字之和等于其最大素因子..."

## 关键发现
- DeepSeek R1 达到 67.6%（约 4 题能做对），是开源模型最好成绩
- OpenAI o1 约 50%——中国数学特色题目上国产模型有优势
- 证明题要求逻辑链完整，部分"直觉正确"的答案因证明不严格而失分

## 关联基准
- [AIME](/benchmarks/aime)：美国数学竞赛，难度接近
- [MATH](/benchmarks/math-benchmark)：更广的数学评测
- [FrontierMath](/benchmarks/frontiermath)：研究级数学

## 不足与展望
- 每年只有 6 题，样本量极小，方差大
- 评分需要数学专家人工判断证明是否严格
- 自动评分目前不可靠（证明类题目的自动化验证仍是挑战）
