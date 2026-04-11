---
title: "Terminal-Bench 2.0：89 个任务 × 39 个 Agent 完整深度分析"
description: "基于 HuggingFace 公开数据，对 Terminal-Bench 2.0 全部 89 个任务、39 个 Agent+Model 组合、10677 次试验的逐一拆解与全景洞察"
date: 2026-03-24
category: 综合调研
tags: ["Terminal-Bench", "Agent 评测", "Benchmark", "Coding Agent", "LLM 排名", "任务分析"]
htmlVersion: "/research-html/terminal-bench-2-full-analysis.html"
draft: false
---

Terminal-Bench 2.0 是目前规模最大的编程 Agent 实战评测之一。本报告对其全部 **89 个任务**、**39 个 Agent+Model 组合**、**10,677 次试验**进行了逐一深度分析，涵盖难度分布、分类对比、Agent 排名及核心洞察。

数据来源：[HuggingFace terminal-bench-2-leaderboard](https://huggingface.co/datasets/harborframework/terminal-bench-2-leaderboard)

---

## 关键数字

| 指标 | 数值 |
|------|------|
| 独立任务数 | 89 |
| Agent+Model 组合 | 39 |
| 总试验次数 | 10,677 |
| 平均通过率 | 64.0% |
| 全军覆没任务 | 1 (make-doom-for-mips) |
| 90%+ 通过任务 | 17 |

---

## 难度分布

89 个任务呈现明显的两极分化：

| 难度等级 | 任务数 | 占比 | 通过率范围 |
|----------|--------|------|-----------|
| 全军覆没 | 1 | 1% | 0% |
| 极难 | 8 | 9% | 1–15% |
| 困难 | 11 | 12% | 16–40% |
| 中等 | 20 | 22% | 41–70% |
| 较易 | 32 | 36% | 71–90% |
| 简单 | 17 | 19% | 91–100% |

超过一半任务（55%）通过率在 71% 以上，但仍有 10% 的任务通过率低于 15%，构成当前 AI Agent 的硬核挑战区。

---

## 按类别分析

11 个任务类别的平均通过率差异极大：

| 类别 | 任务数 | 平均通过率 | 最难任务 | 最易任务 |
|------|--------|-----------|----------|----------|
| 定理证明 | 1 | 97.4% | prove-plus-comm | prove-plus-comm |
| Git | 4 | 96.8% | merge-diff-arc-agi-task (92%) | git-leak-recovery (100%) |
| 密码/安全 | 7 | 82.1% | sanitize-git-repo (69%) | vulnerable-secret (97%) |
| 数据处理 | 8 | 71.3% | extract-moves-from-video (13%) | multi-source-data-merger (97%) |
| 系统/基础设施 | 12 | 71.2% | install-windows-3.11 (5%) | nginx-request-logging (100%) |
| 科学计算 | 17 | 68.1% | dna-assembly (21%) | constraints-scheduling (97%) |
| 编译/构建 | 7 | 61.9% | make-doom-for-mips (0%) | build-pov-ray (95%) |
| 编程/算法 | 12 | 59.9% | filter-js-from-html (3%) | custom-memory-heap-crash (95%) |
| ML/AI | 15 | 38.8% | caffe-cifar-10 (3%) | hf-model-inference (87%) |
| 视频/多媒体 | 1 | 12.8% | video-processing | video-processing |

ML/AI 类别平均通过率仅 38.8%，是唯一低于 50% 的主流类别，暗示 Agent 在机器学习工作流上仍有大量提升空间。

---

## Agent+Model 排名 Top 15

| 排名 | Agent + Model | 通过/总计 | 准确率 |
|------|--------------|-----------|--------|
| 1 | Forge + GPT-5.4 | 75/89 | 84.3% |
| 2 | OB-1 (GPT-5.4 混合) | 75/89 | 84.3% |
| 3 | Forge + Opus-4.6 | 74/89 | 83.1% |
| 4 | Judy + Gemini-3.1-Pro | 71/87 | 81.6% |
| 5 | Forge + Gemini-3.1-Pro | 71/89 | 79.8% |
| 6 | OpenSage + GPT-5.3-Codex | 70/88 | 79.5% |
| 7 | Droid + GPT-5.3-Codex | 70/89 | 78.7% |
| 8 | Terminus-KIRA + Gemini-3.1-Pro | 69/89 | 77.5% |
| 9 | Simple-Codex + GPT-5.3-Codex | 68/89 | 76.4% |
| 10 | Terminus-KIRA + Claude-Opus-4.6 | 68/89 | 76.4% |
| 11 | Judy + Claude-Opus-4.6 | 67/88 | 76.1% |
| 12 | Ante + Gemini-3.1-Pro | 67/89 | 75.3% |
| 13 | Capy + Claude-Opus-4.6 | 66/89 | 74.2% |
| 14 | Mux + GPT-5.3-Codex | 66/89 | 74.2% |
| 15 | MAYA + Claude-4.6-opus | 65/88 | 73.9% |

**最强**：Forge+GPT-5.4（84.3%） | **最弱**：dakou+qwen3-coder-480b（28.1%） | 差距 56 个百分点。

---

## 全军覆没与极难任务

### make-doom-for-mips（0%）——唯一的全军覆没

将经典 Doom 游戏引擎交叉编译到 MIPS 架构。所有 39 个组合、122 次试验全部失败。难点在于完整 MIPS 交叉编译工具链 + 底层图形渲染 + 大端字节序差异，综合了交叉编译、遗留代码移植和底层系统编程三大难题。

### 极难任务一览

| 任务 | 通过率 | 类别 | 核心难点 |
|------|--------|------|---------|
| caffe-cifar-10 | 2.6% | ML/AI | Caffe(2014)编译极复杂，训练数据稀缺 |
| train-fasttext | 2.6% | ML/AI | 数据预处理 + 超参数调优精度不达标 |
| filter-js-from-html | 2.9% | 编程 | JS 多形式存在，edge case 极多 |
| install-windows-3.11 | 5.1% | 系统 | 复古计算 + 虚拟化自动交互 |
| torch-pipeline-parallelism | 5.3% | ML/AI | GPU 并行策略难以正确实现 |
| video-processing | 12.8% | 多媒体 | 纯文本 Agent 对视频处理天然不利 |
| extract-moves-from-video | 12.8% | 数据 | 视频 + 棋盘识别的跨模态推理 |
| torch-pipeline-parallelism | 15.8% | ML/AI | 管道并行比张量并行难一倍 |

---

## 有趣的对称与对比

报告揭示了多组引人深思的任务对比：

- **filter-js-from-html (2.9%) vs break-filter-js-from-html (89.7%)**：防御远比攻击困难，差距 86 个百分点。对安全社区是重要信号。
- **regex-log (92.3%) vs regex-chess (30.8%)**：同样是正则表达式，日志解析 vs 棋类验证，难度差距巨大。
- **make-doom-for-mips (0%) vs make-mips-interpreter (17.9%)**：交叉编译 vs 软件模拟，完全不同的难度量级。
- **torch-pipeline-parallelism (15.8%) vs torch-tensor-parallelism (33.3%)**：管道并行比张量并行难一倍。
- **caffe-cifar-10 (2.6%) vs cobol-modernization (94.9%)**：都是遗留技术，但"使用旧工具"vs"离开旧工具"难度天壤之别。
- **prove-plus-comm (97.4%)**：形式化证明的 Hello World，已被模型彻底掌握。

---

## 核心洞察

### 难题的共性特征

1. **跨领域知识融合**：最难任务往往需要 2–3 个不同领域的知识组合（MIPS 交叉编译 + Doom 引擎，视频处理 + 棋盘识别等）
2. **遗留系统/冷门技术栈**：Caffe、Mailman、Windows 3.11、COBOL 等旧技术的训练数据稀缺
3. **环境配置复杂性**：很多失败不是算法不对，而是无法正确安装/配置依赖环境
4. **多模态推理**：视频/图像处理任务对纯文本 Agent 天然不利
5. **精确数值计算**：密码分析、光谱拟合、模型参数提取等需要精确计算的任务，LLM 的"模糊推理"不适合

### 对 Agent 发展的启示

1. **Agent 框架差异显著**：同一模型在不同框架下表现差距巨大。Forge、Judy、MAYA、Droid 是目前最强框架
2. **工具使用 > 纯推理**：通过率高的 Agent 善于调用外部工具（象棋引擎、编译器、破解工具），而非从零实现
3. **稳定性是瓶颈**：很多任务试验级通过率远高于组合级，说明 Agent "偶尔做对"但缺乏可靠的错误恢复机制
4. **模型特长分化**：Claude Opus 4.6 在系统管理和科学计算上有独到优势，GPT-5.x 在数学推理上更强，Gemini 在多模态任务上表现好

---

## 方法说明

- **通过率**：某个 Agent+Model 组合在特定任务上通过的比例（需全部测试用例通过）
- **试验级通过率**：单次试验（trial）的通过概率，反映"偶尔能做到"的能力
- **数据截至**：2026 年 3 月，基于 HuggingFace 公开 leaderboard
- 报告含全局热力图（89 × 39 矩阵）、交互式筛选器等可视化组件，建议切换至富文本视图查看完整交互效果
