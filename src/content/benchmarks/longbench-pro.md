---
title: "LongBench Pro"
description: "更贴合真实场景的双语长上下文评测基准，1500 个样本覆盖 8K-256K tokens"
date: 2026-01-06T12:00
benchName: "LongBench Pro"
version: ""
org: "多机构合作"
paper: "2601.02872"
code: ""
venue: ""
website: ""
category: "长文本"
abilities: ["长上下文理解", "双语处理", "多任务推理"]
dataSize: "1500 个样本，11 个主任务，25 个子任务"
construction: "人机协作（模型起草 + 专家验证）"
evalMethod: "任务特定指标 + 多维分类（语境依赖/长度/难度）"
metric: "任务特定准确率"
topResults:
  - model: "46 个长上下文模型"
    score: "有效长度通常短于声明长度"
    date: "2026-01"
tags: ["长上下文", "双语", "中英文", "多任务"]
status: "active"
importance: 4
saturation: "未饱和"
---

LongBench Pro 是 LongBench 系列的全面升级，提供更贴合真实场景的双语长上下文评测。基准包含 1500 个自然长语境样本（中文+英文），输入长度从 8K 到 256K tokens，涵盖 11 个主任务和 25 个子任务。采用人机协作构建流程——模型起草后由专家严格验证，平衡质量与可扩展性。

通过评估 46 个主流长上下文模型，LongBench Pro 得出三个重要发现：(1) 长上下文优化比参数扩展对理解能力的贡献更大；(2) 有效上下文长度通常短于声明值，且存在显著的跨语言错位；(3) "思维"模式主要有利于原生推理训练的模型。多维分类体系（完全/部分语境依赖、6 级长度、4 级难度）支持细粒度分析。
