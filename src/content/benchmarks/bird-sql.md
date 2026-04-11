---
title: "BIRD：大规模数据库 Text-to-SQL"
description: "12,751 道基于 95 个真实数据库的 SQL 生成题"
date: 2024-01-01
benchName: "BIRD"
org: "HKU & DAMO"
paper: "arXiv:2305.03111"
category: "数据"
subcategory: "Text-to-SQL"
abilities: ["Text-to-SQL", "数据库理解", "脏数据"]
dataSize: "12,751 questions / 95 DBs"
evalMethod: "标准评测"
metric: "Execution Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "78.3%"
  - model: "DAIL-SQL + GPT-4"
    score: "71.8%"
tags: ["SQL", "数据库", "数据分析"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
BIRD 是 Spider 的"进化版"——不仅数据库更大更复杂（平均 50+ 列），还特别关注**脏数据**（缺失值、不一致格式）和**隐含知识**（外部知识才能理解的字段含义）。这更接近真实的企业数据分析场景。

## 构建方式
1. 收集 95 个真实数据库（来自 Kaggle、政府开放数据等）
2. 12,751 道自然语言到 SQL 的问题-答案对
3. 特别标注了"外部知识"——有些字段含义需要领域知识才能理解
4. 评测方式：生成的 SQL 执行结果与标准答案匹配

## 任务示例
**简单**："查询 2023 年销量最高的产品"
**脏数据**：数据库中日期格式混乱（'2023-01-01'/'Jan 1 2023'/'01/01/23' 混用），需要先统一格式
**隐含知识**：字段名叫"FY24"——需要知道这是"Fiscal Year 2024"，且财年起始月份不同公司不同

## 关键发现
- GPT-5 + schema linking 达 78.3%，但在隐含知识题上掉到 ~50%
- 脏数据处理是 LLM 的显著弱点——容易忽略格式不一致
- 与 Spider 的差距：BIRD 上同一模型低 15-20%，证明真实场景更难

## 关联基准
- [Spider](/benchmarks/spider)：BIRD 的前辈，更干净但更简单
- [DataBench](/benchmarks/databench)：数据分析（不限于 SQL）
- [DS-1000](/benchmarks/ds1000)：数据科学代码生成

## 不足与展望
- 主要是 SQL 生成，不覆盖 Pandas/R 等其他数据分析方式
- 隐含知识的标注可能不完整
- 需要更多行业特定的数据库（医疗、金融等）
