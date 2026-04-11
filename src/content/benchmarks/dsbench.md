---
title: "DSBench：真实数据分析与建模"
description: "466 个数据分析 + 74 个数据建模任务，来自 ModelOff 和 Kaggle，最贴近真实数据科学工作"
date: 2025-01-01T00:00
benchName: "DSBench"
org: "UIUC & 多校"
paper: "arXiv:2409.07703"
venue: "ICLR 2025"
category: "Agent"
subcategory: "Data Science Agent"
abilities: ["数据分析", "数据建模", "特征工程", "可视化"]
dataSize: "466 分析 + 74 建模"
construction: "ModelOff + Kaggle 竞赛收集"
evalMethod: "执行结果匹配 + 排名"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-4o"
    score: "分析 35%, 建模 30%"
    date: "2024-10"
tags: ["数据科学", "数据分析", "Agent", "Kaggle"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
DSBench 是 Data Science Agent 的核心基准——分析任务要求理解复杂数据并给出精确答案，建模任务要求在 Kaggle 级别的竞赛中达到合理排名。GPT-4o 仅 35%/30%。

## 构建方式
1. 466 个数据分析任务（来自 ModelOff 竞赛）
2. 74 个数据建模任务（来自 Kaggle）
3. 分析任务有精确答案；建模任务用 Kaggle 排名评分

## 任务示例
**分析**："给定这个销售数据 Excel，计算 Q3 同比增长率最高的产品线"
**建模**："给定训练集和评估指标（RMSE），构建预测模型并输出测试集预测"

## 关键发现
- 分析 35%、建模 30%——说明端到端数据科学仍是大挑战
- 核心瓶颈：长上下文（真实数据集动辄几十列）+ 多步分析一致性

## 关联基准
- [InfiAgent-DABench](/benchmarks/infiagent-dabench)：端到端数据分析
- [MLE-bench](/benchmarks/mle-bench)：Kaggle 竞赛级 ML 工程
- [DataBench](/benchmarks/databench)：数据理解

## 不足与展望
- 数据集规模有限，大数据场景未覆盖
- 没测数据清洗和特征工程的创造性
