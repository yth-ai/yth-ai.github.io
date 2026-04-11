---
title: "Spider：跨数据库 Text-to-SQL"
description: "10,181 个问题 + 200 个数据库，Text-to-SQL 的开山基准"
date: 2019-09-01
benchName: "Spider"
org: "Yale"
paper: "arXiv:1809.08887"
category: "数据"
subcategory: "Text-to-SQL"
abilities: ["Text-to-SQL", "数据库理解", "SQL生成", "跨数据库泛化"]
dataSize: "10,181 questions / 200 databases"
evalMethod: "标准评测"
metric: "Execution Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "89.2%"
  - model: "DAIL-SQL + GPT-4"
    score: "86.6%"
  - model: "Claude Opus 4"
    score: "84.1%"
tags: ["SQL", "数据库", "Text-to-SQL"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
Spider 是 Text-to-SQL 的开山基准——200 个数据库 + 10,181 个问答对。BIRD 是其进化版。

## 构建方式与示例
200 个干净的关系数据库 + 自然语言查询。例如："查询所有年龄大于 25 的员工的姓名和部门。"

## 关联基准与展望
关联：[BIRD](/benchmarks/bird-sql)、[DataBench](/benchmarks/databench)。不足：数据库太干净，不反映真实脏数据。
