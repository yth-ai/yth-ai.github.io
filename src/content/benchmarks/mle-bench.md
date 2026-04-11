---
title: "MLE-bench：Kaggle 竞赛级 ML 工程"
description: "从 75 个 Kaggle 竞赛构建，测试 Agent 独立完成 ML 全流程"
date: 2024-10-01
benchName: "MLE-bench"
org: "OpenAI"
paper: "arXiv:2410.07095"
category: "Agent"
subcategory: "Science Agent"
abilities: ["ML工程", "数据分析", "特征工程"]
dataSize: "75 Kaggle competitions"
evalMethod: "标准评测"
metric: "Medal Rate (%)"
topResults:
  - model: "o1 + AIDE"
    score: "16.9% gold"
  - model: "Claude 3.5 + AIDE"
    score: "14.0% gold"
tags: ["ML工程", "Kaggle", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评估 Agent 独立完成 Kaggle 竞赛的能力——理解数据、特征工程、选模型、训练、调参、提交。最强也只 17% gold。

## 构建方式与示例
75 个 Kaggle 竞赛。Agent 在 Docker 沙箱中有完整 GPU 环境，按 Kaggle 排名评分。

## 关联基准与展望
关联：[DSBench](/benchmarks/dsbench)、[RE-Bench](/benchmarks/rebench)。不足：Kaggle 竞赛不完全代表真实 ML 工程。
