---
title: "SWE-Lancer：真实付费软件工程任务"
description: "1488 个来自 Upwork 的真实付费任务（含独立任务和管理级 Issue 拆分），总价值 $100 万+"
date: 2025-02-01T00:00
benchName: "SWE-Lancer"
org: "OpenAI"
paper: "arXiv:2502.12115"
code: "github.com/openai/SWE-Lancer"
category: "Agent"
subcategory: "Coding Agent"
abilities: ["软件工程", "Issue修复", "任务拆分", "代码审查"]
dataSize: "1488 tasks ($100万+)"
construction: "Upwork 真实付费任务收集"
evalMethod: "端到端测试 + 人工验证"
metric: "任务完成率 (%)"
topResults:
  - model: "Claude 3.5 Sonnet"
    score: "26.2%"
    date: "2025-02"
  - model: "o1"
    score: "24.1%"
    date: "2025-02"
tags: ["软件工程", "Agent", "真实任务", "付费"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
SWE-Lancer 的独特价值在于每个任务都有真实的**美元定价**——从 $50 小 bug 到 $3200+ 的复杂特性开发。还包含管理级别任务：Agent 需要拆分大 Issue 为子任务。

## 构建方式
1. 从 Upwork 收集 1488 个真实付费任务
2. 每个任务有明确的美元报酬（反映真实价值）
3. 包含 Individual 任务（直接做）和 Manager 任务（拆分后做）

## 任务示例
**$50 任务**："修复 CSS 布局在 Safari 上的兼容性问题"
**$800 任务**："为 Django 应用添加 OAuth2 社交登录功能"
**$3200 Manager 任务**："重构整个用户管理模块"（需要先拆分为多个子任务）

## 关键发现
- 最强模型也只完成约 26%
- 高价值任务（$1000+）的完成率远低于低价值任务
- Manager 任务比 Individual 任务更难

## 关联基准
- [SWE-bench](/benchmarks/swe-bench)：GitHub Issue
- [Claw-Eval](/benchmarks/claweval)：OpenClaw 框架

## 不足与展望
- Upwork 任务可能有选择偏差
- 美元定价不一定准确反映难度
