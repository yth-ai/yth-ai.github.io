---
title: "DevBench：多角色软件开发全流程"
description: "评估 LLM 在需求分析、架构设计、实现、测试全流程中的能力"
date: 2024-03-01T00:00
benchName: "DevBench"
org: "Tsinghua & Microsoft"
paper: "arXiv:2403.08604"
code: "github.com/open-compass/DevBench"
category: "Agent"
subcategory: "Coding Agent"
abilities: ["需求分析", "架构设计", "代码实现", "测试编写"]
dataSize: "22 个完整软件项目"
construction: "专家设计真实项目"
evalMethod: "代码质量 + 测试通过 + 架构评审"
metric: "多维度评分"
topResults:
  - model: "GPT-4"
    score: "~40% 加权平均"
    date: "2024-03"
tags: ["软件工程", "全流程", "Agent"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
评估 LLM 在需求分析→架构设计→实现→测试全流程中的能力，揭示架构设计是最大短板。

## 构建方式与示例
22 个完整软件项目。例如："给定需求文档，设计并实现一个在线投票系统。"

## 关联基准与展望
关联：[SWE-bench](/benchmarks/swe-bench)、[ChatDev Eval](/benchmarks/chatdev-eval)。不足：项目规模偏小。
