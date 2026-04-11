---
title: "SimpleQA：事实性简答评测"
description: "OpenAI 发布的 4,326 道短答事实问题，专门测试模型回答的事实准确性和幻觉率"
date: 2024-10-30
benchName: "SimpleQA"
org: "OpenAI"
paper: "arXiv:2410.07176"
category: "综合"
subcategory: "知识"
abilities: ["事实性", "知识准确", "幻觉检测", "简答"]
dataSize: "4,326 questions"
evalMethod: "标准评测"
metric: "Correct Rate (%)"
topResults:
  - model: "GPT-5"
    score: "52.8%"
  - model: "Claude Opus 4"
    score: "42.1%"
  - model: "GPT-4o"
    score: "38.2%"
  - model: "o3"
    score: "47.6%"
tags: ["事实性", "幻觉", "知识", "OpenAI"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
SimpleQA 是 OpenAI 发布的事实性短答评测——4326 道简单事实问题，不测推理、不测创意、只测一件事：**模型说的是不是真的**。是检测幻觉率最直接的基准。

## 构建方式
1. OpenAI 内部 AI trainers 编写 4326 个简短事实问题
2. 每个问题都有一个无歧义的正确答案
3. 答案经过多方验证确保准确
4. 评分三分类：Correct（正确）/ Incorrect（错误/幻觉）/ Not Attempted（拒绝回答）

## 任务示例
**示例 1**："谁是第一个登上月球的人？" → "Neil Armstrong"
**示例 2**："Python 是哪一年首次发布的？" → "1991"
**示例 3**："东京塔有多高？" → "333 米"（精确数值要求）

## 关键发现
- Correct Rate 最高也只有 ~45%（o1-preview），说明**一半以上的简单事实问题模型都答不对**
- 部分模型选择"不回答"来降低错误率——形成 Correct vs Attempted 的权衡
- 中文版 Chinese SimpleQA 上国产模型明显更好（豆包 64% vs GPT-4o 59%）

## 关联基准
- [Chinese SimpleQA](/benchmarks/chinese-simpleqa)：中文版，含中国特色知识
- [TruthfulQA](/benchmarks/truthfulqa)：测试模型在"常见误解"上是否说真话
- [MMLU](/benchmarks/mmlu)：更广的知识评测（但有选项可猜）

## 不足与展望
- 只测事实检索，不测推理能力
- 答案可能随时间变化（如"现任总统是谁"）
- 没有测模型的校准能力——模型是否知道自己不知道
