---
title: "ARC-AGI：抽象推理挑战"
description: "从少量示例归纳规则的能力测试，ARC-2 让 o3 从 87.5% 骤降到 4%"
date: 2024-11-01
benchName: "ARC-AGI"
org: "Francois Chollet"
paper: "arXiv:1911.01547"
category: "推理"
subcategory: "逻辑推理"
abilities: ["抽象推理", "模式识别", "归纳推理"]
dataSize: "ARC-1: 800 / ARC-2: 100"
evalMethod: "标准评测"
metric: "Score (%)"
topResults:
  - model: "o3 ARC-1"
    score: "87.5%"
  - model: "o3 ARC-2"
    score: "4%"
  - model: "GPT-4o ARC-1"
    score: "5%"
tags: ["抽象推理", "AGI", "归纳"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
ARC-AGI 是 Keras 创始人 Francois Chollet 设计的"AI 智力测试"。不同于知识驱动的 MMLU 或技能驱动的 HumanEval，ARC 考察的是从少量示例中**归纳出规则并应用到新输入**的能力——这被认为是通向 AGI 的核心能力。

## 构建方式
1. 每道题是一组输入→输出的彩色网格对（3-5 个示例）
2. 模型需要从示例中归纳出变换规则
3. 然后将规则应用到一个新的输入网格，生成正确的输出网格
4. ARC-1：800 道题，ARC-2（2025.11）：100 道更难的题
5. 纯视觉 grid，没有文字——必须靠视觉模式识别

## 任务示例
**示例 1**：给 3 个示例：每个输入网格中有一个彩色形状，输出是该形状旋转 90 度后的网格。模型需要归纳出"旋转 90 度"的规则并应用到新输入。

**示例 2**：输入中有散布的彩色点，输出是将同色点用线连接。模型需要归纳出"连接同色点"的规则。

## 关键发现
- ARC-1：o3 以 87.5% "破关"，但使用了极高的计算量（数千美元/题）
- ARC-2：o3 骤降到 4%，证明 ARC-1 的"解决"可能是暴力搜索而非真正理解
- 人类在 ARC 上接近 100%——这是 AI 与人类差距最大的基准之一

## 关联基准
- [SimpleBench](/benchmarks/simplebench)：同样考察直觉/常识推理
- [FrontierMath](/benchmarks/frontiermath)：同样对 LLM 极其困难
- [HLE](/benchmarks/hle)：同样是"最难"级别的综合评测

## 不足与展望
- ARC-1 被 o3 "破解"说明可能存在 shortcut（高计算量暴力搜索）
- ARC-2 大幅提升了难度，但样本量小（100 题），方差大
- 核心问题：ARC 到底在测"真正的归纳推理"还是"程序搜索"？学术界仍有争议
