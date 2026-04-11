---
title: "OSWorld-Verified：人工验证版桌面操作"
description: "OSWorld 的人工验证子集，确保每个任务的可行性和评分一致性"
date: 2025-05-01T00:00
benchName: "OSWorld-Verified"
org: "多校 & Anthropic"
category: "Agent"
subcategory: "Computer Use Agent"
abilities: ["桌面操作", "跨应用", "系统管理"]
dataSize: "人工验证子集"
construction: "OSWorld 子集 + 人工验证"
evalMethod: "状态检查"
metric: "Success Rate (%)"
topResults:
  - model: "Claude Opus 4 (Computer Use)"
    score: "~45%"
    date: "2025-12"
tags: ["Computer Use", "桌面", "验证版"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
OSWorld 的人工验证子集，确保每个任务确实可行且评分标准无歧义。Claude 4 System Card 的核心评测之一。

## 构建方式
1. 从 OSWorld 369 个任务中筛选
2. 每个任务经过人工验证：可行性、评分一致性
3. 排除了歧义和环境依赖性强的任务

## 关联基准
- [OSWorld](/benchmarks/osworld)：完整版
- [WindowsAgentArena](/benchmarks/windowsagentarena)：Windows 专项

## 不足与展望
- 验证子集偏小，覆盖面不如完整版
