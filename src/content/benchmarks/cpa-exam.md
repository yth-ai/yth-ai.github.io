---
title: "CPA/CFA/Bar Exam 专业资格考试"
description: "用真实专业资格考试（CPA 注会/CFA 金融/Bar 律考）评测模型的专业领域能力"
date: 2024-01-01T00:00
benchName: "Professional Exams"
org: "多方"
category: "领域专业"
subcategory: "金融"
abilities: ["会计知识", "金融分析", "法律推理", "专业资格"]
dataSize: "各考试数百题"
construction: "真实考试题"
evalMethod: "多选准确率 / 及格率"
metric: "Pass Rate (%)"
topResults:
  - model: "GPT-4"
    score: "CPA ~85%, CFA L1 ~75%"
    date: "2024-01"
  - model: "Claude Opus 4"
    score: "CPA ~88%"
    date: "2025-12"
tags: ["CPA", "CFA", "专业资格", "金融"]
status: "active"
importance: 3
saturation: "接近饱和"
---
## 为什么重要
用 CPA/CFA/Bar Exam 等真实专业资格考试评测模型的专业领域能力。GPT-4 已能通过大部分初级考试。

## 构建方式与示例
真实考试题。例如 CPA："A 公司在 2023 年以 $500 万收购了 B 公司 60% 的股权，B 的公允价值为 $800 万。如何确认商誉？"

## 关联基准与展望
关联：[FinanceBench](/benchmarks/financebench)、[LegalBench](/benchmarks/legalbench)。高级考试（CFA L3）仍有差距。
