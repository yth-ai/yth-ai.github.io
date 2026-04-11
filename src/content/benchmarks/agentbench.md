---
title: "AgentBench：LLM Agent 综合能力评测"
description: "8 个交互式环境（OS、数据库、知识图谱、游戏等），系统评估 LLM 作为 Agent 的决策与操作能力"
date: 2024-08-01
benchName: "AgentBench"
version: "v0.2"
org: "Tsinghua University"
paper: "arXiv:2308.03688"
code: "github.com/THUDM/AgentBench"
venue: "ICLR 2024"
website: "https://llmbench.ai/agent"
category: "Agent"
subcategory: "Multi-Agent"
abilities: ["工具使用", "环境交互", "多轮决策", "代码执行", "数据库操作", "网页浏览"]
dataSize: "8 environments, 1000+ tasks"
construction: "专家设计 + 自动生成"
evalMethod: "任务成功率"
metric: "Overall Score"
topResults:
  - model: "GPT-4 Turbo"
    score: "4.01"
    date: "2024-08"
  - model: "Claude 3 Opus"
    score: "3.45"
    date: "2024-08"
  - model: "GPT-3.5 Turbo"
    score: "2.56"
    date: "2024-08"
  - model: "Llama-2 70B"
    score: "0.72"
    date: "2024-08"
tags: ["Agent", "工具使用", "交互式环境", "多轮对话", "决策"]
status: "active"
importance: 4
saturation: "未饱和"
---
## 为什么重要
AgentBench 是首个系统性评估 LLM 作为 Agent 在多种交互环境中表现的综合基准。覆盖 8 种截然不同的环境（操作系统、数据库、知识图谱、家居、网页购物等），揭示了 LLM 在"做事"上的真实能力。

## 构建方式
1. 设计 8 个独立交互环境：OS、DB、KG、Digital Card Game、Lateral Thinking、House-Holding、Web Shopping、Web Browsing
2. 每个环境有独立的 action space 和 reward function
3. 模型以 ReAct 模式运行（思考→行动→观察循环）
4. 总计 1091 个任务，支持多轮交互

## 任务示例
**OS 环境**："在 Linux 系统中，找到 /var/log 下占用空间最大的日志文件并压缩它"
**Web Shopping**："在网上商城找到价格低于 $50 的蓝牙耳机，要求评分 4 星以上"
**DB 环境**："查询数据库找出 2023 年销量最高的产品类别"

## 关键发现
- GPT-4 在所有环境中显著领先开源模型（平均高 20%+）
- OS 和 DB 环境模型表现最好（结构化操作），Web 环境最差（需要 GUI 理解）
- 商业模型和开源模型差距在 Agent 任务上比在知识问答上大得多

## 关联基准
- [GAIA](/benchmarks/gaia)：更侧重多步推理的通用 Agent
- [WebArena](/benchmarks/webarena)：AgentBench Web 环境的深化版
- [OSWorld](/benchmarks/osworld)：AgentBench OS 环境的深化版
- [TAU-bench](/benchmarks/tau-bench)：专注客服场景的工具使用

## 不足与展望
- 8 个环境中有些偏简单（如 card game），与真实工作距离较远
- 没有长期任务（所有任务都在几分钟内完成）
- 多 Agent 协作场景未覆盖——后续 ChatDev Eval 和 MetaGPT 在填补这个空白
