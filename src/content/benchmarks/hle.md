---
title: "HLE：人类最终考试"
description: "2,500 道极难多模态题目，最强模型仅 ~25%"
date: 2025-01-01
benchName: "HLE"
org: "Scale AI & CAIS"
paper: "arXiv:2501.14249"
category: "综合"
subcategory: "极难综合"
abilities: ["专家知识", "多模态", "推理"]
dataSize: "2,500 questions"
evalMethod: "标准评测"
metric: "Accuracy (%)"
topResults:
  - model: "OpenAI o3"
    score: "26.6%"
  - model: "Gemini 2.5 Pro"
    score: "18.2%"
tags: ["综合", "极难", "专家级"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
当 MMLU 接近饱和（90%+）、GPQA 也被追近（87%+）时，HLE（Humanity's Last Exam）代表了"下一代难度"——即使最强模型也只能答对 ~25%。题目由全球领域专家设计，涵盖高等数学、物理、法律、医学等领域。

## 构建方式
1. 全球领域专家众包提交极难题目
2. 2,500 道多模态多选题 + 开放式问答
3. 每道题都经过多轮专家审核，确保答案正确且不歧义
4. Scale AI 和 CAIS（Center for AI Safety）联合组织

## 任务示例
**示例 1**（高等数学）：需要用到代数拓扑的知识才能解答的题目
**示例 2**（法律推理）：涉及多个判例法冲突的复杂法律问题
**示例 3**（医学）：需要整合多项检查结果才能做出的罕见病诊断

## 关键发现
- o3 (26.6%) 是最强模型——意味着 4 题只对 1 题
- 模型在"冷门学科"上表现极差（音乐理论、考古学等）
- 推理模型比非推理模型优势不大——说明 HLE 考的不是推理深度，是知识广度上限

## 关联基准
- [GPQA](/benchmarks/gpqa)：HLE 的"前辈"，但难度低一级
- [FrontierMath](/benchmarks/frontiermath)：数学维度的极难评测
- [MMMU](/benchmarks/mmmu)：多模态维度的大学级评测

## 不足与展望
- 主要是知识广度测试，推理深度评测不够
- 题目不公开（防污染），限制了社区的深入分析
- 如果模型达到 90%，就需要"更终极"的考试——目前看还很远
