---
title: "RE-Bench：AI 研发工程师评测"
description: "7 个需要数小时才能完成的 ML 工程研究任务，测试 Agent 的长程研发能力"
date: 2024-11-01
benchName: "RE-Bench"
org: "METR & Anthropic"
paper: "arXiv:2411.15114"
category: "代码生成"
subcategory: "研发效率"
abilities: ["ML研发", "长程任务", "研究工程", "实验设计"]
dataSize: "7 tasks / 8-hour budget"
evalMethod: "标准评测"
metric: "Score (normalized)"
topResults:
  - model: "o1-preview"
    score: "4x human baseline at 2h"
  - model: "Claude 3.5"
    score: "3x at 2h"
tags: ["ML研发", "长程", "Agent", "研究"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
RE-Bench（Research Engineering Benchmark）评估 AI Agent 在长程 ML 研发任务上的能力——每个任务需要 2-8 小时的持续工作，是目前"任务时长"最长的 Agent 评测。

## 构建方式
1. 7 个 ML 研发任务，每个预计 2-8 小时
2. Agent 在 Docker 沙箱中有 GPU 和完整开发环境
3. 任务涉及模型训练、调参、数据处理、论文复现

## 任务示例
**示例**："优化给定模型在给定数据集上的性能，你有 8 小时"

## 关键发现
- 给模型足够长的时间（8 小时），性能持续提升
- 但人类研究工程师在同等时间内仍然明显更强

## 关联基准
- [MLE-bench](/benchmarks/mle-bench)：Kaggle 竞赛
- [PaperBench](/benchmarks/paperbench)：论文复现

## 不足与展望
- 只有 7 个任务，样本量太小
- 计算成本极高（每个 Agent 运行 8 小时 × GPU）
