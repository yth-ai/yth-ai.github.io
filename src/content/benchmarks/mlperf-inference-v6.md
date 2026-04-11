---
title: "MLPerf Inference v6.0：行业标准 AI 推理性能基准"
description: "MLCommons 发布的 v6.0 推理基准，新增 GPT-OSS 120B、文本生成视频、视觉语言模型等 6 项重大更新"
date: 2026-04-01T09:00
benchName: "MLPerf Inference"
version: "v6.0"
org: "MLCommons"
paper: ""
code: "https://github.com/mlcommons/inference"
venue: ""
website: "https://mlcommons.org/2026/04/mlperf-inference-v6-0-results/"
category: "综合"
abilities: ["推理性能", "LLM 推理", "文本生成视频", "视觉语言", "推荐系统", "目标检测"]
dataSize: "11 项数据中心测试 + 边缘测试"
construction: "行业联盟标准化"
evalMethod: "标准化推理吞吐量 / 延迟 / 精度测试"
metric: "Tokens/sec, Queries/sec"
topResults:
  - model: "NVIDIA Blackwell Ultra (72节点)"
    score: "最高吞吐量"
    date: "2026-04"
  - model: "AMD Instinct MI350X"
    score: "首次参评多项"
    date: "2026-04"
  - model: "Intel Gaudi3"
    score: "4项基准"
    date: "2026-04"
tags: ["推理性能", "硬件", "MLPerf", "行业标准", "多厂商"]
status: "active"
importance: 5
---
## 为什么重要

MLPerf Inference v6.0 是该基准套件有史以来最重大的一次更新。在 11 项数据中心测试中有 5 项为新增或升级，另有 1 项新增边缘测试。24 家机构提交了结果，是衡量 AI 硬件和软件栈推理效率的行业黄金标准。

## v6.0 新增内容

### 数据中心新基准（5 项）
| 基准 | 类型 | 说明 |
|------|------|------|
| **GPT-OSS 120B** | 全新 | 开放权重 MoE LLM（5.1B 激活参数），覆盖数学/科学推理/编程 |
| **DeepSeek-R1 交互场景** | 扩展 | 新增交互式推理场景，支持投机解码 |
| **DLRMv3 推荐系统** | 第三代 | 首个序列推荐基准，Meta 工程支持 |
| **文本生成视频** | 全新 | 套件首个 Text-to-Video 基准 |
| **视觉语言模型 (VLM)** | 全新 | 基于 Shopify 产品目录的多模态结构化提取 |

### 边缘新基准（1 项）
| 基准 | 类型 | 说明 |
|------|------|------|
| **YOLOv11 Large** | 升级 | Ultralytics YOLOv11 单次目标检测 |

### 新工具：LoadGen++
全新测试工具，允许 LLM 使用服务式（serving-style）软件栈运行，更贴近生产部署场景。

## 关键发现

- **多节点趋势**：多节点系统提交比 v5.1 增加 30%，10% 提交超 10 节点
- **最大系统规模**：72 节点 / 288 加速器（上轮 4 倍）
- **NVIDIA 主导**但 AMD、Intel、红帽（vLLM）均有突破
- 3 家首次提交：Inventec、Netweb Technologies、Stevens Institute

## 局限性

- 硬件厂商自行提交，不保证完全公平对比
- 侧重吞吐量和延迟，不直接衡量模型质量
- 参赛门槛高，中小厂商覆盖不足

## 关联基准

- [Chatbot Arena](/benchmarks/chatbot-arena)：人类偏好排名
- [OpenLLM Leaderboard](/benchmarks/openllm-leaderboard)：开源模型排行
