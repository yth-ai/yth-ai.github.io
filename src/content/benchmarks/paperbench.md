---
title: "PaperBench：ICML 论文完整复现"
description: "20 篇 ICML 2024 论文的端到端复现任务，评估 Agent 的科研复现能力"
date: 2025-04-01T00:00
benchName: "PaperBench"
org: "OpenAI"
paper: "arXiv:2504.01848"
code: "github.com/openai/preparedness/tree/main/paperbench"
category: "Agent"
subcategory: "Science Agent"
abilities: ["论文复现", "环境配置", "实验运行", "结果验证"]
dataSize: "20 papers / 8316 评分点"
construction: "ICML 2024 论文 + 原作者评分标准"
evalMethod: "分层评分（代码结构/功能/结果）"
metric: "Reproduction Score (%)"
topResults:
  - model: "Claude 3.5 Sonnet + Aider"
    score: "21.0%"
    date: "2025-04"
  - model: "o1"
    score: "~13%"
    date: "2025-04"
tags: ["论文复现", "科研", "Agent", "端到端"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
PaperBench 是目前最硬核的科研 Agent 评测——给一篇 ICML 论文及其评分标准（8316 个评分点），Agent 需要从零复现出整个代码库并跑通实验。最强 Agent 也只能完成 21%。

## 构建方式
1. 选择 20 篇 ICML 2024 论文
2. 每篇论文的原作者设计详细的评分标准（分层评分 rubric）
3. 总计 8316 个评分检查点，从代码结构到功能正确到实验结果
4. Agent 在 Docker 沙箱中运行，有完整的 Python/GPU 环境

## 任务示例
**任务**：给定论文 "Attention is All You Need (2024 ICML 版本)"
1. 阅读论文理解方法
2. 设置实验环境（安装依赖、下载数据）
3. 实现核心代码（模型定义、训练循环）
4. 运行实验并对比论文中的 Table 1 结果
5. 评分：代码结构 30% + 功能正确 40% + 结果匹配 30%

## 关键发现
- Claude 3.5 Sonnet + Aider 最强，也只有 21%
- 环境配置（依赖安装、GPU 设置）占了很大一部分失败
- Agent 在"理解论文方法"上表现尚可，但"正确实现"是瓶颈

## 关联基准
- [CORE-Bench](/benchmarks/corebench)：类似但来源更广（Nature/Science）
- [ScienceAgentBench](/benchmarks/scienceagentbench)：科学发现而非复现
- [MLE-bench](/benchmarks/mle-bench)：ML 工程能力（Kaggle 竞赛）

## 不足与展望
- 20 篇论文偏少，可能不够代表性
- 只评测复现，不评测理解和批判（能复现不代表理解了论文）
- 评分标准依赖原作者设计，可能有遗漏或偏见
