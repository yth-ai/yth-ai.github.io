---
title: "BigCodeBench：实用编程综合评测"
description: "1,140 道需要调用多个 Python 库的实用编程题"
date: 2024-06-01
benchName: "BigCodeBench"
org: "BigCode (HuggingFace)"
paper: "arXiv:2406.15877"
category: "代码生成"
subcategory: "全栈应用"
abilities: ["Python编程", "库调用", "数据处理"]
dataSize: "1,140 tasks"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "Claude Opus 4"
    score: "74.2%"
  - model: "GPT-5"
    score: "72.8%"
tags: ["代码生成", "实用编程"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
BigCodeBench 填补了 HumanEval（太简单）和 SWE-bench（太复杂）之间的空白。每道题都需要调用 139 个 Python 库中的多个函数，模拟真实开发中"组合使用多个工具"的场景。

## 构建方式
1. 设计 1140 个实用编程任务，每个需调用多个 Python 库
2. 两种模式：Complete（给函数签名+docstring）和 Instruct（只给自然语言指令）
3. 覆盖数据处理（pandas/numpy）、Web（Flask/Django）、ML（sklearn/torch）、系统（os/subprocess）
4. 每道题有完整的测试用例+代码执行验证

## 任务示例
**数据处理**："读取 CSV 文件，用 pandas 做数据清洗（去重、填充缺失值），然后用 matplotlib 画出分布直方图"
**Web**："用 Flask 写一个 API endpoint，接收 JSON 输入，验证字段，存入 SQLite"
**ML**："用 sklearn 对给定数据集做交叉验证，输出最佳模型的 precision/recall/F1"

## 关键发现
- 顶尖模型约 75%，远未饱和
- Instruct 模式（只给自然语言）比 Complete 模式（给函数签名）低 10-15%
- 库调用是关键差距——模型常常在 API 参数细节上出错

## 关联基准
- [HumanEval](/benchmarks/humaneval)：更简单的函数级
- [SWE-bench](/benchmarks/swe-bench)：更难的仓库级
- [DS-1000](/benchmarks/ds1000)：数据科学领域特化
- [EvalPlus](/benchmarks/evalplus)：增强测试的函数级

## 不足与展望
- 主要覆盖 Python 生态，缺少其他语言
- 库版本固定，不测模型适应新版 API 的能力
- 没有测多文件组织和项目结构设计
