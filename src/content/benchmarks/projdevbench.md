---
title: "ProjDevBench"
description: "评估 AI 编码智能体从自然语言规范自主创建完整软件仓库的端到端项目开发能力"
date: 2026-02-09T12:00
benchName: "ProjDevBench"
version: "v2"
org: "多校合作（含 Ming-Hsuan Yang）"
paper: "2602.01655"
code: ""
venue: ""
website: ""
category: "代码生成"
abilities: ["端到端项目开发", "系统架构设计", "功能正确性", "迭代优化"]
dataSize: "20 个编程问题，8 个类别"
construction: "概念导向 + 真实世界应用场景"
evalMethod: "Online Judge 测试 + LLM 辅助代码审查"
metric: "通过率 / 架构设计 / 功能正确性"
topResults:
  - model: "最佳模型综合"
    score: "27.38% 通过率"
    date: "2026-02"
tags: ["端到端", "项目开发", "Agent", "架构设计", "系统设计"]
status: "active"
importance: 3
saturation: "未饱和"
---

ProjDevBench 填补了编码 Agent 评测从"Issue 级修复"到"端到端项目开发"的空白。现有编码智能体虽能从简单提示生成完整代码库，但缺乏端到端项目开发的评测标准。ProjDevBench 包含 20 个涵盖 8 个类别的编程问题，要求智能体根据自然语言规范自主创建完整软件仓库。

采用双重评估协议：Online Judge 自动化测试代码功能，结合 LLM 辅助代码审查，从系统架构设计、功能正确性和迭代优化三个维度评估。结果显示综合通过率仅 27.38%，模型在基本功能和数据结构方面表现较好，但在复杂系统设计、时间复杂度优化和资源管理方面存在明显困难。
