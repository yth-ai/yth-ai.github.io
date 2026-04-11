---
title: "LongBench：长文本多任务评测"
description: "首个双语（中英）长文本多任务基准，21 个任务覆盖 6 大类，平均长度 6-15K tokens"
date: 2023-09-01T00:00
benchName: "LongBench"
version: "v2"
org: "Tsinghua (THUDM)"
paper: "arXiv:2308.14508"
code: "github.com/THUDM/LongBench"
website: "https://longbench2.github.io"
category: "长文本"
subcategory: "综合"
abilities: ["长文本理解", "多文档QA", "摘要", "Few-shot", "代码补全"]
dataSize: "v1: 4750 / v2: 503 (更难)"
construction: "从已有数据集改编 + 新增"
evalMethod: "F1 / ROUGE / 精确匹配"
metric: "综合得分"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "57.7% (v2)"
    date: "2025-11"
  - model: "o3"
    score: "55.4% (v2)"
    date: "2025-12"
  - model: "Claude Opus 4"
    score: "52.3% (v2)"
    date: "2025-12"
tags: ["长文本", "多任务", "中英双语"]
status: "active"
importance: 5
saturation: "未饱和"
---
## 为什么重要

LongBench 是最被广泛采用的长文本评测基准。v1 覆盖 6 大类 21 个中英双语任务，v2 大幅提升难度——要求在 8K-2M tokens 的文档中做深度理解和推理。各家技术报告都在报 LongBench v2 分数。

## 构建方式

**v1**：
1. 从已有 NLP 数据集改编为长文本版本
2. 6 大任务类型：单文档 QA、多文档 QA、摘要、Few-shot 学习、合成任务、代码补全
3. 中英双语各 10+ 子任务，平均长度 6-15K tokens

**v2**：
1. 503 道需要深度理解的长文本题目
2. 长度范围 8K - 2M tokens
3. 由人类标注者精心设计，确保答案不能通过浅层匹配获得
4. 必须真正"理解"文档才能作答

## 任务示例

**v1 示例**（多文档 QA）：
> 给定 5 篇关于同一主题的新闻报道（共 12K tokens），回答"这五篇报道在关键事实 X 上有没有矛盾？"

**v2 示例**（深度推理）：
> 给定一本完整的技术文档（200K tokens），回答"第 3 章描述的方法在第 7 章的实验中是否被修改了？如果是，做了什么修改？"

## 关键发现

- v2 上最强模型约 58%——远未饱和
- 模型长度外推能力比窗口大小更重要：128K 窗口的模型在 200K 文档上可能比 1M 窗口的模型更好
