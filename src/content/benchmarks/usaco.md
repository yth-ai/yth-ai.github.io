---
title: "USACO：美国计算机奥赛编程题"
description: "来自 USACO 竞赛的算法题，从 Bronze 到 Platinum 四级难度，测试顶级算法能力"
date: 2024-03-01
benchName: "USACO"
org: "多个研究团队"
paper: "arXiv:2404.10952"
category: "代码生成"
subcategory: "竞赛编程"
abilities: ["竞赛编程", "算法", "动态规划", "图论", "数据结构"]
dataSize: "307 problems / 4 divisions"
evalMethod: "标准评测"
metric: "pass@1 (%)"
topResults:
  - model: "o3"
    score: "52.1%"
  - model: "DeepSeek R1"
    score: "28.4%"
  - model: "GPT-4o"
    score: "8.7%"
tags: ["竞赛编程", "USACO", "算法", "奥赛"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
USACO（美国信息学奥赛）的题目比 Codeforces 更难——需要高级算法和数据结构知识。是衡量 LLM 算法能力上限的核心基准。

## 构建方式
1. 使用 USACO 历史竞赛题目（Bronze/Silver/Gold/Platinum 四个级别）
2. 每道题有标准测试数据
3. 从 Bronze（入门）到 Platinum（接近 IOI 难度）

## 任务示例
**Gold**："给定 N 个点和 M 条边的图，找到满足特定约束的最短路径"（需要高级图算法）
**Platinum**："设计一个在线算法处理动态更新的数据结构问题"

## 关联基准
- [Codeforces](/benchmarks/codeforces)：更广泛的竞赛
- [LiveCodeBench](/benchmarks/livecodebench)：动态更新

## 不足与展望
- 偏算法竞赛，不测工程能力
- 题量有限
