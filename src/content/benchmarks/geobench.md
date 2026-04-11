---
title: "GeoBench：地理推理（GeoGuessr 风格）"
description: "根据街景照片猜测国家和精确坐标，需要视觉识别、文字提取和地理推理"
date: 2025-01-01T00:00
benchName: "GeoBench"
org: "LM Council"
category: "多模态"
subcategory: "视觉推理"
abilities: ["地理推理", "街景识别", "文字提取", "空间推理"]
dataSize: "动态"
construction: "GeoGuessr 风格"
evalMethod: "距离误差"
metric: "距离误差 (km)"
topResults:
  - model: "Gemini 2.5 Pro"
    score: "~95km 中位误差"
    date: "2025-11"
tags: ["地理", "视觉", "街景"]
status: "active"
importance: 2
saturation: "未饱和"
---
## 为什么重要
受 GeoGuessr 启发，根据街景照片猜测国家和精确坐标。需要视觉识别+文字提取+地理知识。

## 构建方式与示例
给一张街景照片，模型输出经纬度。需要识别路牌语言、建筑风格、植被特征等。

## 关联基准与展望
关联：[RealWorldQA](/benchmarks/realworldqa)。不足：主要覆盖发达国家，发展中国家街景数据少。
