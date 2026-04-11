---
title: "Chinese SimpleQA：中文事实性评测"
description: "首个全面的中文事实性短答评测基准，3000 道高质量问题覆盖 6 大主题 99 个子话题，含中国特色知识"
date: 2024-11-11T00:00
benchName: "Chinese SimpleQA"
org: "OpenO1 (LivingFutureLab)"
paper: "arXiv:2411.07140"
code: "github.com/LivingFutureLab/ChineseSimpleQA"
venue: "ACL 2025"
category: "综合"
subcategory: "知识"
abilities: ["中文事实性", "知识准确", "幻觉检测", "中国文化知识"]
dataSize: "3000 questions / 6 大主题 / 99 子话题"
construction: "人工编写 + 多轮验证"
evalMethod: "GPT-4o 自动评分（correct/incorrect/not attempted）"
metric: "Correct Rate (%)"
topResults:
  - model: "Doubao-Pro"
    score: "64.1%"
    date: "2024-11"
  - model: "GPT-4o"
    score: "59.6%"
    date: "2024-11"
  - model: "DeepSeek V3"
    score: "63.7%"
    date: "2025-01"
  - model: "Claude 3.5 Sonnet"
    score: "52.5%"
    date: "2024-11"
tags: ["中文", "事实性", "幻觉", "中国文化"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
Chinese SimpleQA 是 SimpleQA 的中文版，但不只是翻译——专门包含大量中国特色知识（中国戏曲、武侠文学、神话传说、中医等），这些是海外模型普遍薄弱的领域。

## 构建方式
1. 3000 道高质量中文事实问题
2. 覆盖 6 大主题 99 个子话题
3. 特别设计中国文化知识（戏曲、武侠、神话等）
4. 每题经过多轮验证确保答案正确且唯一
5. 评分沿用 SimpleQA 的三分类体系

## 任务示例
**中国特色**："《天龙八部》中段誉的六脉神剑最先学会的是哪一脉？"
**自然科学**："地球自转一圈大约需要多长时间？"
**流行文化**："2024 年上映的《流浪地球 3》的导演是谁？"

## 关键发现
- 国产模型优势明显：豆包 Pro (64.1%) 显著超过 GPT-4o (59.6%)
- 在中国戏曲/武侠/神话等子话题上，国产模型和海外模型差距最大
- Claude 倾向于"不回答"不确定的问题，正确率高但 attempted 率低

## 关联基准
- [SimpleQA](/benchmarks/simpleqa)：英文原版
- [C-Eval](/benchmarks/ceval)：中文知识评测（选择题）
- [CMMLU](/benchmarks/cmmlu)：中文多学科评测

## 不足与展望
- 3000 题中静态事实占大多数，动态知识（时事）更新频率不足
- 主要是陈述性知识，缺乏程序性知识评测
- 未来需要更多方言和少数民族文化知识的覆盖
