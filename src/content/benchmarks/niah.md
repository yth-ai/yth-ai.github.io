---
title: "NIAH：大海捞针测试"
description: "在不同长度的干扰文本中插入关键信息，测试模型在不同位置、不同深度的检索能力"
date: 2023-11-01T00:00
benchName: "Needle In A Haystack"
version: "Sequential-NIAH / Multi-NIAH"
org: "Greg Kamradt (社区)"
website: "https://github.com/gkamradt/LLMTest_NeedleInAHaystack"
category: "长文本"
subcategory: "检索"
abilities: ["信息检索", "位置敏感", "干扰文本"]
dataSize: "动态生成（1K-1M tokens）"
construction: "合成（插入特定信息到随机文本中）"
evalMethod: "精确匹配"
metric: "Recall (%)"
topResults:
  - model: "GPT-4 Turbo (128K)"
    score: ">99% (single needle)"
    date: "2024-01"
  - model: "Gemini 2.5 Pro (1M)"
    score: "~99% (single, 1M)"
    date: "2025-11"
tags: ["大海捞针", "检索", "位置敏感"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
NIAH（Needle In A Haystack）是最基础也最直觉的长文本测试——在干扰文本中插入关键信息，测模型能不能找到。单 needle 已接近饱和，但 Multi-Needle 和 Sequential-NIAH 仍有挑战。

## 构建方式
1. 动态生成：在 1K-1M tokens 的干扰文本中随机位置插入一句关键信息
2. 改变插入深度（开头/中间/结尾）和文本长度
3. 变体：Multi-Needle（多个信息点）、Sequential-NIAH（信息点有顺序）

## 任务示例
**Single Needle**："在 200K tokens 的 Paul Graham 文章中，隐藏了一句'最好的披萨店在纽约 XX 街'，问'最好的披萨店在哪？'"
**Multi-Needle**：同时插入 5 个不同信息点，要求全部找到

## 关键发现
- 单 needle 1M tokens 内 >99%（Gemini 2.5 Pro）
- Multi-Needle（10 个）降到 ~85%
- 中间位置比开头/结尾难找（"lost in the middle" 效应）

## 关联基准
- [RULER](/benchmarks/ruler)：NIAH 的升级版
- [InfiniteBench](/benchmarks/infinitebench)：100K+ 超长文本
- [LongBench](/benchmarks/longbench)：多任务综合

## 不足与展望
- 单 needle 已饱和，失去区分度
- 合成场景与真实文档差距大
- "找到"不代表"理解"——NIAH 不测理解能力
