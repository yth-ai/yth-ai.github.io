---
title: "ScienceAgentBench：数据驱动科学发现"
description: "44 个来自 12 个学科的科学发现任务（从文献到代码到结论），评估 Agent 的科研自动化能力"
date: 2024-10-01T00:00
benchName: "ScienceAgentBench"
org: "OSU & 多校"
paper: "arXiv:2410.05080"
code: "github.com/OSU-NLP-Group/ScienceAgentBench"
category: "Agent"
subcategory: "Science Agent"
abilities: ["科学发现", "数据分析", "代码实现", "论文阅读"]
dataSize: "44 tasks / 12 disciplines"
construction: "科学家从真实研究中提取"
evalMethod: "代码执行 + 输出匹配"
metric: "Success Rate (%)"
topResults:
  - model: "OpenHands + GPT-4o"
    score: "34.3%"
    date: "2024-10"
tags: ["科学发现", "科研自动化", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
44 个来自 12 学科的科学发现任务——不只写代码，要理解科学问题、分析数据、生成发现。

## 构建方式与示例
例如："给定蛋白质折叠数据，分析结构稳定性与温度的关系。"

## 关联基准与展望
关联：[PaperBench](/benchmarks/paperbench)、[CORE-Bench](/benchmarks/corebench)。
