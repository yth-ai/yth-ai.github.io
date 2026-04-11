---
title: "GAIA：通用 AI 助手评测"
description: "466 个真实世界任务，人类 92%，GPT-4 仅 15%"
date: 2023-11-01
benchName: "GAIA"
org: "Meta FAIR & HuggingFace"
paper: "arXiv:2311.12983"
category: "Agent"
subcategory: "Search/Research Agent"
abilities: ["多步推理", "工具使用", "多模态"]
dataSize: "466 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5 + Tools"
    score: "56.8%"
  - model: "Human"
    score: "92.0%"
  - model: "GPT-4"
    score: "15.0%"
tags: ["Agent", "通用助手", "真实世界"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
GAIA 揭示了一个残酷事实：**人类觉得简单的任务，LLM 完成得很差**。人类准确率 92%，GPT-4 仅 15%。差距不在知识，而在工具使用和多步操作。这使 GAIA 成为衡量"通用 AI 助手"实用性的核心基准。

## 构建方式
1. 由 Meta FAIR 和 HuggingFace 的研究员设计 466 个任务
2. 每个任务都有一个精确的、无歧义的答案
3. 分三级难度：Level 1（1-5 步）、Level 2（5-10 步）、Level 3（10+ 步）
4. 任务可能需要：搜索网页、读取文件（PDF/Excel）、执行代码、多步推理

## 任务示例
**Level 1**："2023 年诺贝尔化学奖得主的大学本科毕业于哪所学校？"（需要搜索→找到人→找到教育背景）
**Level 2**："下载这个 Excel 文件，找出第三列中最大的数，然后计算它的平方根保留两位小数"（需要下载→解析→计算）
**Level 3**："根据这篇 PDF 论文中的实验数据，重新计算 Table 3 的最后一列，看是否与论文一致"（需要 PDF 解析→理解实验→重新计算→比对）

## 关键发现
- 人类 92% vs GPT-4(无工具) 15% vs GPT-5(有工具) 56.8%
- 工具使用是关键差距：同一模型有无工具差距可达 3-4 倍
- Level 3 任务最能区分 Agent 框架的优劣

## 关联基准
- [BrowseComp](/benchmarks/browsecomp)：GAIA 搜索维度的深化
- [AssistantBench](/benchmarks/assistantbench)：类似的通用助手评测
- [AgentBench](/benchmarks/agentbench)：多环境交互
- [MLE-bench](/benchmarks/mle-bench)：专注 ML 领域的端到端任务

## 不足与展望
- 466 题偏少，细分到每个难度级别更少
- 任务更新频率低，存在数据污染风险
- 没有评测任务失败后的恢复能力（模型卡住后怎么办）
