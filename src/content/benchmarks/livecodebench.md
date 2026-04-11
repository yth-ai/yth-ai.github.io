---
title: "LiveCodeBench：抗污染动态编程评测"
description: "持续从 LeetCode/Codeforces 收集新题，确保模型未在训练中见过"
date: 2024-03-01
benchName: "LiveCodeBench"
org: "MIT & UIUC"
paper: "arXiv:2403.07974"
category: "代码生成"
subcategory: "竞赛编程"
abilities: ["算法", "竞赛编程"]
dataSize: "400+ problems"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "OpenAI o3"
    score: "71.7%"
  - model: "DeepSeek R1"
    score: "65.9%"
tags: ["代码生成", "抗污染"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
代码基准最大的问题是数据污染——HumanEval 的题目早已出现在各种训练数据中。LiveCodeBench 通过**持续收集新发布的竞赛题目**来解决这个问题，只使用模型训练截止日期之后的题目进行评测。

## 构建方式
1. 持续从 LeetCode、Codeforces、AtCoder 收集新发布的题目
2. 按发布日期标注，支持按模型训练截止时间筛选
3. 四种评测任务：代码生成、自我修复、代码执行预测、测试输出预测
4. 已收集 400+ 题，持续增长

## 任务示例
**代码生成**：给一道 LeetCode Medium/Hard 题目的描述，生成通过所有测试用例的 Python/C++ 代码
**自我修复**：给代码 + 错误输出，修复代码使其通过
**执行预测**：给代码 + 输入，预测输出结果（不执行代码）

## 关键发现
- 推理模型在这里优势明显：o3 (71.7%) vs Claude Opus 4 (55.2%)
- 时间窗口过滤显示：所有模型在"新题"上都比"老题"差 10-15%——证明污染确实存在
- 是目前最可信的代码评测（因为持续更新）

## 关联基准
- [HumanEval](/benchmarks/humaneval)：经典但已饱和，LiveCodeBench 是其精神继承者
- [Codeforces](/benchmarks/codeforces)：竞赛平台直接评 Elo
- [USACO](/benchmarks/usaco)：更难的竞赛编程

## 不足与展望
- 偏竞赛编程风格，与真实软件开发场景有差距
- 不测试仓库级理解和多文件编辑能力
- 需要持续维护（收集新题），长期可持续性有待观察
