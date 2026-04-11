---
title: "FrontierMath：前沿数学研究级问题"
description: "数百道研究级数学问题，最强模型正确率不到 2%（o3 除外）"
date: 2024-11-01
benchName: "FrontierMath"
org: "Epoch AI"
paper: ""
category: "推理"
subcategory: "数学推理"
abilities: ["研究级数学", "证明", "数论"]
dataSize: "数百道 (非公开)"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "OpenAI o3"
    score: "~25%"
  - model: "其他模型"
    score: "<2%"
tags: ["数学", "极难", "非公开"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

当 AIME 被 o3 做到 96.7%、MATH 被做到 97% 时，FrontierMath 证明了"数学推理的天花板还远着"。这些题目来自真正的数学研究前沿——组合、数论、代数几何等——即使是人类专家也需要数小时甚至数天才能解答。

## 构建方式

1. 由 60+ 位数学家设计，覆盖数论、代数几何、组合数学等领域
2. 每道题的答案是可程序验证的（整数、有理数、多项式等）——避免了主观评判
3. **非公开题目**：为防止数据污染，题目不公开发布
4. 题目横跨本科到前沿研究水平

## 任务示例（公开的示例题）

**示例 1**（数论）：
> "设 p 是满足某个特定丢番图方程的最小素数..."（需要数论深度推理）

**示例 2**（代数几何）：
> "计算某个代数簇的欧拉特征数..."（需要研究级代数几何知识）

具体题目不公开，但 Epoch AI 描述："数学家通常需要数小时到数天才能解决，有些题目出自尚未发表的研究成果。"

## 关键发现

- o3 是唯一超过 2% 的模型，达到 ~25%——说明 scaling test-time compute 对困难推理有效
- 其他所有模型（包括 GPT-4o、Claude 3.5）都低于 2%
