---
title: "InfiniteBench：100K+ 超长文本评测"
description: "首个平均上下文超过 100K tokens 的 LLM 评测，覆盖检索、数学、代码、对话、摘要等"
date: 2024-02-01T00:00
benchName: "InfiniteBench"
org: "Tsinghua (OpenBMB)"
paper: "arXiv:2402.13718"
code: "github.com/OpenBMB/InfiniteBench"
venue: "ACL 2024"
category: "长文本"
subcategory: "检索"
abilities: ["超长文本", "检索", "数学推理", "代码理解", "对话"]
dataSize: "3946 samples / 平均 195K tokens"
construction: "合成 + 改编"
evalMethod: "精确匹配 / F1"
metric: "综合得分"
topResults:
  - model: "GPT-4 (128K)"
    score: "~48% 平均"
    date: "2024-02"
tags: ["超长文本", "100K+", "检索"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
InfiniteBench 是首个要求模型处理 **100K+ tokens** 的基准。测试从超长小说中找关键信息、在百万 token 代码中理解逻辑、从长对话中提取关键事实。平均上下文长度 195K tokens。

## 构建方式
1. 设计 5 大类任务：检索、数学、代码、QA、对话、摘要
2. 通过合成方式生成超长上下文（如在长文本中插入关键信息）
3. 平均上下文 195K tokens，最长可达 500K+
4. 总计 3946 个样本

## 任务示例
**小说检索**："在这本 200K tokens 的小说中，找到主角第一次遇到反派的章节内容"
**代码理解**："在这个 150K tokens 的代码库中，函数 X 的返回值在什么条件下为空？"
**对话摘要**："总结这段 100K tokens 长对话中的关键决策点"

## 关键发现
- GPT-4 (128K) 平均约 48%——即使在声称支持的 128K 范围内也表现不佳
- 大部分模型在 100K 以上急剧退化
- 检索类任务比推理类任务表现好——说明模型能"找到"但不一定能"理解"

## 关联基准
- [LongBench](/benchmarks/longbench)：更全面但平均长度更短
- [NIAH](/benchmarks/niah)：最基础的长文本检索
- [RULER](/benchmarks/ruler)：多样化的长文本检索+推理
- [BABILong](/benchmarks/babilong)：长文本中的多步推理

## 不足与展望
- 合成数据与真实长文本有差距（真实文档的信息分布更自然）
- 没有区分"模型真的读了全文"和"模型只读了相关片段"
- 需要更多真实场景的超长文本评测（如完整代码库、法律合同等）
