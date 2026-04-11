---
title: "RULER / InfiniteBench：长上下文能力评测"
description: "RULER 评测模型在 4K-128K 窗口下的检索/多跳/聚合/追踪能力，InfiniteBench 测试 100K+ 超长文本理解"
date: 2024-04-01
benchName: "RULER"
version: ""
org: "NVIDIA"
paper: "arXiv:2404.06654"
code: "github.com/hsiehjackson/RULER"
venue: "COLM 2024"
category: "长文本"
subcategory: "综合"
abilities: ["长上下文检索", "多跳推理", "信息聚合", "变量追踪", "超长文本理解"]
dataSize: "13 任务类型 × 多种长度"
construction: "自动生成（可控长度）"
evalMethod: "精确匹配"
metric: "Accuracy at N tokens"
topResults:
  - model: "GPT-4 128K"
    score: "~96% @4K, ~65% @128K"
    date: "2024-04"
  - model: "Gemini 1.5 Pro (1M)"
    score: "~95% @4K, ~80% @128K"
    date: "2024-04"
  - model: "Claude 3 Opus"
    score: "~95% @4K, ~60% @128K"
    date: "2024-04"
  - model: "Llama 3.1 70B"
    score: "~93% @4K, ~45% @128K"
    date: "2024-07"
tags: ["长上下文", "检索", "Needle-in-Haystack", "多跳推理", "信息聚合"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
RULER 是 NVIDIA 提出的长文本评测，在 NIAH 基础上大幅扩展——不只是"大海捞针"，还包括多跳推理、变量追踪、信息聚合等。是各家技术报告中最常引用的长文本基准之一。

## 构建方式
1. 4 类 13 个任务：检索（NIAH 变体）、多跳追踪、信息聚合、问答
2. 支持动态生成不同长度（4K-128K+）
3. 合成数据，精确控制信息分布

## 任务示例
**检索**："找到文本中的 3 个隐藏 needle"
**多跳**："Paul 住在纽约，纽约在美国，问 Paul 住在哪个国家？"（但信息分布在 100K tokens 中）
**聚合**："统计文本中出现最频繁的 5 个名字"

## 关键发现
- 大部分模型在 32K 后急剧退化
- 聚合任务（需要处理全文信息）比检索任务（只需找到一处）难得多
- Gemini 2.5 Pro 在 1M tokens 上仍保持较好性能

## 关联基准
- [NIAH](/benchmarks/niah)：RULER 的前身
- [LongBench](/benchmarks/longbench)：更全面的真实任务
- [MRCR](/benchmarks/mrcr)：多轮检索
- [InfiniteBench](/benchmarks/infinitebench)：100K+ 超长文本

## 不足与展望
- 合成数据与真实文档有差距
- 主要测检索相关能力，创作/摘要类长文本任务覆盖不足
