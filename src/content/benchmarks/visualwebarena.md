---
title: "VisualWebArena：视觉导向的网页交互"
description: "910 个需要视觉理解的网页操作任务，是 WebArena 的多模态扩展"
date: 2024-01-01T00:00
benchName: "VisualWebArena"
org: "CMU"
paper: "arXiv:2401.13649"
code: "github.com/web-arena-x/visualwebarena"
category: "Agent"
subcategory: "Web/Browser Agent"
abilities: ["视觉网页理解", "GUI操作", "多步交互"]
dataSize: "910 tasks"
construction: "真实网站 + 专家设计"
evalMethod: "任务完成判定"
metric: "Success Rate (%)"
topResults:
  - model: "GPT-4V + SoM"
    score: "~18%"
    date: "2024-01"
tags: ["网页Agent", "视觉", "GUI"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
VisualWebArena 在 WebArena 基础上增加了必须通过视觉才能完成的任务——纯 DOM 解析无法完成。最强模型也只有 ~18%。

## 构建方式
1. 910 个视觉导向的网页操作任务
2. 每个任务都需要"看图"才能做（如识别图片中的产品）
3. 建立在 WebArena 的沙箱基础上

## 任务示例
**示例**："在购物网站上找到'和这张图片一样的红色连衣裙'"（需要视觉相似性匹配）

## 关联基准
- [WebArena](/benchmarks/webarena)：基础版
- [Mind2Web](/benchmarks/mind2web)：跨网站泛化

## 不足与展望
- 视觉任务的多样性还不够
- 动态页面内容变化导致评测不稳定
