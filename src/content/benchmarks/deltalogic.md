---
title: "DeltaLogic"
description: "评估 LLM 在最小前提编辑后的信念修订能力，揭示逻辑推理模型的惯性失败"
date: 2026-04-03T12:00
benchName: "DeltaLogic"
version: ""
org: ""
paper: "2604.02733"
code: ""
venue: "ICLR 2026 Workshop"
website: ""
category: "推理"
abilities: ["信念修订", "逻辑推理", "证据更新", "前提编辑响应"]
dataSize: "从 FOLIO 和 ProofWriter 数据集实例化"
construction: "基准转换协议，将推理示例转换为修订片段"
evalMethod: "约束标签评分（初始准确率/修订准确率/惯性）"
metric: "修订准确率 / 惯性率"
topResults:
  - model: "Phi-4-mini-instruct"
    score: "85.0% 修订准确率"
    date: "2026-04"
  - model: "Qwen3-1.7B"
    score: "46.7% 修订准确率, 60% 惯性"
    date: "2026-04"
  - model: "Qwen3-4B"
    score: "45.0% 修订准确率, 60% 惯性"
    date: "2026-04"
tags: ["信念修订", "逻辑推理", "动态推理", "ICLR 2026 Workshop"]
status: "active"
importance: 2
saturation: "未饱和"
---

DeltaLogic 是 ICLR 2026 Workshop 发表的推理基准转换协议，专门评估 LLM 在证据微小变化后修正信念的能力。传统推理基准评估从固定前提推导答案，但忽略了模型在证据变化时的信念修订能力。DeltaLogic 将自然语言推理示例转换为修订片段：先在前提 P 下询问初始结论，再应用最小编辑 δ(P)，最后判断原结论是否应保持或修订。

从 FOLIO 和 ProofWriter 数据集实例化。关键发现：初始推理能力强不代表修订能力强——Qwen3-1.7B 初始准确率 66.7% 但修订准确率仅 46.7%，在应改变结论的情节中惯性高达 60%（即错误保持原结论）。Phi-4-mini-instruct 表现最好（修订 85%）但仍有不稳定性。这揭示了一种被忽视但实际重要的推理能力缺陷。
