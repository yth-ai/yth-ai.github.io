---
title: "C-Eval：中文综合能力评测"
description: "13,948 道涵盖 52 个中文学科的多选题，是评测模型中文能力的标准基准"
date: 2023-05-01
benchName: "C-Eval"
org: "Shanghai AI Lab & THU"
paper: "arXiv:2305.08322"
category: "综合"
subcategory: "中文"
abilities: ["中文理解", "中文知识", "多学科", "STEM", "人文社科"]
dataSize: "13,948 questions / 52 subjects"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "GPT-5"
    score: "91.6%"
  - model: "Qwen2.5-72B"
    score: "89.4%"
  - model: "DeepSeek V3"
    score: "86.8%"
tags: ["中文", "综合评测", "多学科"]
status: "active"
importance: 4
saturation: "接近饱和"
---
## 为什么重要
C-Eval 是中文 LLM 评测的"MMLU"——52 个学科覆盖中国的教育体系（从初中到研究生），是衡量模型"中文知识广度"的标准基准。

## 构建方式
1. 从中国各级考试（中考、高考、大学、研究生入学、专业资格）中收集题目
2. 52 个学科，分 4 个难度层次：初中/高中/大学/专业
3. 每个学科有 dev/val/test 三个分割
4. 总计约 13,000 道 4 选项多选题

## 任务示例
**高中物理**："一个质量为 2kg 的物体在光滑斜面上从静止开始下滑..."
**大学法律**："根据《民法典》第 X 条，以下哪种情形构成不当得利？"
**专业会计**："企业在确认递延所得税资产时，应当考虑以下哪些因素？"

## 关键发现
- GPT-5 约 88%，国产模型（Qwen 2.5-72B 约 86%）差距在缩小
- 中文特色学科（中国法律、马克思主义、中国近现代史）是区分国产 vs 海外模型的关键
- 专业层次题目最有区分度

## 关联基准
- [CMMLU](/benchmarks/cmmlu)：类似定位的另一个中文评测
- [MMLU](/benchmarks/mmlu)：C-Eval 的英文对标
- [SuperCLUE](/benchmarks/superclue)：更多维度的中文评测
- [Chinese SimpleQA](/benchmarks/chinese-simpleqa)：中文事实性

## 不足与展望
- 题目来源于考试，偏记忆型知识，推理题占比不足
- 部分题目已过时（特别是法律/政策相关）
- 需要定期更新以跟上法律法规变化
