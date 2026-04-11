---
title: "SkillsBench：Agent 技能使用评测"
description: "首个评估 Agent 如何有效使用 Skills 的基准，86 个任务覆盖 11 个领域"
date: 2026-02-01T00:00
benchName: "SkillsBench"
org: "BenchFlow AI"
website: "https://www.skillsbench.ai"
code: "github.com/benchflow-ai/skillsbench"
category: "Agent"
subcategory: "Tool Use Agent"
abilities: ["技能使用", "技能选择", "多技能编排"]
dataSize: "86 tasks / 11 domains"
construction: "专家设计"
evalMethod: "任务完成 + 技能使用效率"
metric: "Task Success (%)"
topResults:
  - model: "Claude 3.5 Sonnet + Skills"
    score: "~72%"
    date: "2026-02"
tags: ["Skills", "Agent", "技能", "MCP"]
status: "active"
importance: 3
saturation: "未饱和"
---
## 为什么重要
首个评估 Agent Skills 效果的基准——不只测工具调用，还测能否选对 Skill 并有效使用。

## 构建方式与示例
86 个任务 / 11 个领域。例如："用合适的 Skill 完成代码审查 → 选中 code-review Skill → 正确配置参数"

## 关联基准与展望
关联：[BFCL](/benchmarks/bfcl)、[MCP-Atlas](/benchmarks/mcp-atlas)。MCP 生态爆发的背景下很有价值。
