---
title: "Claw-Eval：真实世界 Agent 透明评测"
description: "北大×港大基于 OpenClaw 场景开源的 Agent 评测框架，200+ 真实任务，关注完整任务执行过程而非单点能力"
date: 2026-03-18T00:00
benchName: "Claw-Eval"
org: "北大 & 港大 & ZJUICSR"
code: "github.com/ZJUICSR/ClawEval"
website: "https://claw-eval.github.io"
category: "Agent"
subcategory: "Coding Agent"
abilities: ["真实编码任务", "端到端执行", "工具调用", "环境交互"]
dataSize: "200+ real-world tasks"
construction: "真实编码场景设计"
evalMethod: "端到端任务完成 + 过程评估"
metric: "Pass@1 / Pass@3 (%)"
topResults:
  - model: "Claude Opus 4"
    score: "~68% Pass@1"
    date: "2026-03"
  - model: "GPT-5"
    score: "~62% Pass@1"
    date: "2026-03"
tags: ["Agent", "OpenClaw", "编码", "端到端", "2026"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Claw-Eval 是 2026 年最受关注的 Agent 评测之一——基于 OpenClaw 框架，将所有模型放在统一的 Agent 环境中执行真实编码任务。27 个模型的公开排行榜持续更新。

## 构建方式
1. 北大×港大联合开发，基于 OpenClaw Agent 框架
2. 200+ 真实编码任务（非合成）
3. 评估完整任务执行过程：工具调用链、错误恢复、多步规划
4. 端到端评测：从任务描述到最终结果

## 任务示例
**示例 1**："为这个 React 组件添加暗色模式切换逻辑并确保 CSS 变量兼容"
**示例 2**："修复这个 Python 项目中的内存泄漏"
**示例 3**："将这个单体应用的认证模块拆分为独立微服务"

## 关键发现
- Claude Opus 4 约 68% Pass@1，GPT-5 约 62%——差距比单纯代码生成大
- 错误恢复能力是关键区分因素——好的 Agent 能从错误中学习并重试
- 安全版 ClawSafeBench 同时评估 Agent 是否会执行危险操作

## 关联基准
- [PinchBench](/benchmarks/pinchbench)：OpenClaw 的四维选型基准
- [SWE-bench](/benchmarks/swe-bench)：GitHub Issue 修复
- [SWE-Lancer](/benchmarks/swe-lancer)：真实付费任务

## 不足与展望
- 绑定 OpenClaw 框架，其他框架的 Agent 难以直接对比
- 2026 年 3 月才推出，历史数据积累不足
- 需要更多非编码类任务来评测通用 Agent 能力
