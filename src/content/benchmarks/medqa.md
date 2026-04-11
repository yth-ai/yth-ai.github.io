---
title: "MedQA：医学考试问答"
description: "来自美国/中国/台湾医师执照考试的多选题，测试模型的临床推理能力"
date: 2021-09-01
benchName: "MedQA"
org: "MIT & HMS"
paper: "arXiv:2009.13081"
category: "领域专业"
subcategory: "医学"
abilities: ["医学推理", "临床诊断", "药理学", "病理学"]
dataSize: "12,723 questions (USMLE subset: 1,273)"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "95.2%"
  - model: "Med-PaLM 2"
    score: "86.5%"
  - model: "GPT-4"
    score: "86.1%"
tags: ["医学", "USMLE", "临床", "专业领域"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
MedQA 使用美国/中国/台湾地区的执业医师考试真题评测 LLM 的临床医学知识。是"AI + 医疗"方向最常用的基准。

## 构建方式
1. 收集美国 USMLE、中国执业医师、台湾医师考试的多选题
2. 总计约 12,000 道题
3. 覆盖基础医学、临床医学、公共卫生

## 任务示例
**示例**："一位 55 岁男性患者，主诉胸痛 2 小时。心电图显示 ST 段抬高。最可能的诊断和首选治疗方案？"

## 关键发现
- GPT-4 已能通过 USMLE 各阶段考试（>60%）
- 但在复杂临床推理（多因素综合判断）上仍有差距
- 中文版考试上国产模型表现更好

## 关联基准
- [LegalBench](/benchmarks/legalbench)：法律领域
- [FinanceBench](/benchmarks/financebench)：金融领域
- [GPQA](/benchmarks/gpqa)：科学推理

## 不足与展望
- 选择题无法测真实的临床决策能力
- 医学知识快速更新，题库需要定期刷新
- 缺乏多模态医学评测（影像+文本）
