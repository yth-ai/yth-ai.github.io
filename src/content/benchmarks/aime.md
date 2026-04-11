---
title: "AIME 2024/2025：数学奥赛级推理评测"
description: "美国数学邀请赛（AIME）真题，考察模型在竞赛数学中的推理能力，是推理模型的核心差异化指标"
date: 2025-02-01
benchName: "AIME 2024/2025"
version: "2025"
org: "MAA (美国数学协会)"
paper: ""
code: ""
venue: ""
website: "https://artofproblemsolving.com/wiki/index.php/AIME"
category: "推理"
subcategory: "数学推理"
abilities: ["数学推理", "多步推导", "竞赛数学", "代数", "几何", "组合"]
dataSize: "30 题/年 (AIME I + II)"
construction: "数学竞赛真题"
evalMethod: "精确答案匹配 (0-999 整数)"
metric: "% Correct"
topResults:
  - model: "OpenAI o3"
    score: "96.7%"
    date: "2025-12"
  - model: "DeepSeek R1"
    score: "79.8%"
    date: "2025-01"
  - model: "OpenAI o1"
    score: "83.3% (2024)"
    date: "2024-09"
  - model: "Claude 3.5 Sonnet"
    score: "16%"
    date: "2024-10"
  - model: "GPT-4o"
    score: "13.4%"
    date: "2024-05"
tags: ["数学", "推理", "竞赛", "AIME", "奥数"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

AIME（American Invitational Mathematics Examination）是美国数学竞赛体系中的高级赛事（AMC → AIME → USAMO → IMO），每年约 6000 名高中生参加。AIME 2024 成为区分推理模型和非推理模型的分水岭。

## 构建方式

1. 每年由 MAA（美国数学协会）组织专家出题
2. 15 道题，每题答案是 0-999 的整数（无选择项，不能猜）
3. 题目覆盖代数、几何、组合、数论，难度从 AMC 12 到 USAMO 之间
4. 用 2024 年真题评测（每年更新可防污染）

## 任务示例

**示例 1**（2024 AIME I #10）：
> "设 $a_1, a_2, \ldots, a_{2024}$ 是正整数的一个排列。求满足 $\sum_{k=1}^{2024} k \cdot a_k$ 被 3 整除的排列数，模 1000 的值。"
> 需要组合数学 + 模运算推理

**示例 2**（2024 AIME II #12）：
> 一道几何题要求从多边形的面积关系推导坐标——需要解析几何和代数化简

## 关键发现

- **推理模型 vs 非推理模型的分水岭**：o3 (96.7%) vs GPT-4o (13.3%)——7 倍差距
- DeepSeek R1 在 AIME 2024 上达到 79.8%，是开源模型最好成绩
- AIME 题量少（15 题）但难度高，方差较大，建议多年份平均
