---
title: "EvalPlus：增强版代码生成评测"
description: "在 HumanEval/MBPP 基础上增加 80x 测试用例，大幅减少 pass@1 的误报率"
date: 2024-01-01T00:00
benchName: "EvalPlus"
version: "HumanEval+ / MBPP+"
org: "UIUC"
paper: "arXiv:2305.01210"
code: "github.com/evalplus/evalplus"
website: "https://evalplus.github.io/leaderboard.html"
category: "代码生成"
subcategory: "函数级"
abilities: ["代码生成", "边界测试", "正确性验证"]
dataSize: "HumanEval+: 164 / MBPP+: 378"
construction: "自动测试用例生成 + 人工验证"
evalMethod: "扩展测试用例通过"
metric: "pass@1 (%)"
topResults:
  - model: "Claude Opus 4"
    score: "90.2% (HE+)"
    date: "2025-12"
  - model: "GPT-5"
    score: "89.1% (HE+)"
    date: "2026-01"
tags: ["代码生成", "测试增强", "HumanEval"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
EvalPlus 发现原始 HumanEval 的测试用例太弱——很多"看起来对"的代码其实有 bug。增加 80 倍测试用例后，所有模型的 pass@1 显著下降。被 Claude 4 报告采用为核心评测。

## 构建方式
1. 在 HumanEval (164题) 和 MBPP (378题) 基础上
2. 用 LLM + fuzzing 自动生成更多测试用例
3. 人工验证测试用例的正确性
4. 每道题从原来 ~8 个测试用例扩展到 ~640 个

## 任务示例
**原始测试**：`add(1, 2) == 3`（太简单）
**扩展测试**：`add(0, 0) == 0`、`add(-1, 1) == 0`、`add(999999, 1) == 1000000`、`add(1.5, 2.5) == 4.0`（边界和特殊情况）

## 关键发现
- 原始 HumanEval 上 GPT-4 ~90%，EvalPlus 后降到 ~82%
- 越"聪明"的代码越容易在边界情况出错
- 排名变化：有些模型在 HumanEval 排名靠前但 EvalPlus 后下降

## 关联基准
- [HumanEval](/benchmarks/humaneval)：原始版本
- [MBPP](/benchmarks/mbpp)：另一个被 EvalPlus 增强的基准
- [BigCodeBench](/benchmarks/bigcodebench)：更实用的编程

## 不足与展望
- 自动生成的测试用例可能有假阳性（错误的测试）
- 仍是函数级评测，不测仓库级
