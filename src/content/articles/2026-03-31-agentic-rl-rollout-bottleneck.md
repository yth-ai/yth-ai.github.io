---
title: "Agentic RL 的真实瓶颈：rollout 是基础设施问题，不是算法问题"
description: "从 Heddle 到 ProRL Agent，一批 2026 年 3 月的新论文揭示了 agentic RL 训练的实际工程挑战——长尾轨迹生成正在成为制约 agent 训练效率的核心卡点"
date: 2026-03-31
category: "工程实践"
tags: ["agentic RL", "rollout", "Heddle", "ProRL", "训练基础设施", "多智能体", "PARL"]
---

## Agentic RL 的真实瓶颈：rollout 是基础设施问题，不是算法问题

训练 LLM agent 的时候，大家的注意力通常集中在奖励设计、数据合成、模型架构上。但 2026 年 3 月底连续发布的几篇论文指向了一个更底层的问题：**rollout 本身是系统效率的瓶颈**——而这是一个被严重低估的基础设施问题。

### 什么是 rollout，为什么 agent 的 rollout 特别难

传统 LLM 的 RL 训练里，rollout 就是让模型生成一批回答，然后用奖励信号更新参数。这个过程计算代价虽高，但结构规整：每条输出序列长度相对固定，并行度容易控制。

Agentic rollout 完全不同。Agent 不是"输出文本"，而是在执行一系列动作——调用工具、读取代码库、执行 bash 命令、等待 API 返回。这些动作的时间分布极不均匀：

- 一个简单文件读取可能 0.1 秒返回
- 一个需要触发 CI 跑测试的任务可能需要 90 秒
- 更复杂的任务可能涉及 50+ 步工具调用，每一步都有不确定的等待时间

这就产生了严重的"长尾问题"：大多数轨迹很快完成，但少数复杂轨迹会拖慢整个 batch 的处理——后者不完成，前者的结果就无法用于梯度更新。

### Heddle：轨迹感知的调度系统

3 月 30 日刚上传 arXiv 的 [Heddle](https://arxiv.org/abs/2603.28101)（Zhang et al., 北京大学）直接针对这个问题提出了解决方案。

论文指出，现有 agentic RL 基础设施的核心问题在于"以步为中心"（step-centric）的设计——系统把每一次 LLM 调用和工具调用当作独立单元处理，完全不感知轨迹的整体上下文。这导致三个连锁问题：

1. **排队延迟（Queueing Delays）**：长尾轨迹占用资源，短轨迹等待
2. **干扰开销（Interference Overhead）**：不同复杂度的轨迹共享计算资源，互相抢占
3. **单 Token 时间膨胀（Per-Token Time Inflation）**：长尾轨迹因为并行度不足，生成每个 token 的时间更长

Heddle 的解法是把调度单元从"步"升级到"轨迹"，引入三个核心机制：

- **轨迹级调度**：用运行时预测（runtime prediction）动态估算每条轨迹的剩余工作量，按优先级进行抢占式调度
- **轨迹感知放置（Trajectory-Aware Placement）**：通过预排序动态规划 + 工具调用间隙的机会性迁移，最小化不同轨迹之间的资源干扰
- **轨迹自适应资源管理**：对长尾轨迹动态提高模型并行度（model parallelism），加速其 token 生成速度

实验结果：在多种 agentic RL workload 上，Heddle 实现了最高 **2.5×** 的端到端 rollout 吞吐量提升，相比当时最优的基线系统。

> "Frequent tool calls induce long-tailed trajectory generation that bottlenecks rollouts. This stems from step-centric designs that ignore trajectory context."
> — Zili Zhang et al., [Heddle: A Distributed Orchestration System for Agentic RL Rollout](https://arxiv.org/abs/2603.28101)

### ProRL Agent：把 rollout 做成服务

NVIDIA 同一时期发布的 [ProRL Agent](https://arxiv.org/abs/2603.18815) 走了另一条路——**Rollout-as-a-Service**。

核心思路：现有系统把 rollout orchestration 和训练循环耦合在一起，导致系统难以迁移和维护。ProRL 把整个 agentic rollout 生命周期抽象成一个独立的 API 服务，训练循环只需要调用这个服务来获取轨迹数据。

这个设计的好处是：
- 不同的训练框架（NeMo、Megatron 等）可以共用同一套 rollout 基础设施
- Sandbox 环境标准化，支持无 root 的 HPC 环境（rootless HPC settings）
- 已集成进 NVIDIA NeMo Gym，面向 SWE、数学、STEM、代码任务做了验证

### 三家产品公司的 agentic RL 经验

Philipp Schmid 的博客对 Kimi K2.5、Cursor Composer 2、Chroma Context-1 的技术报告做了一个精彩的横向对比（见 [philschmid.de](https://www.philschmid.de/kimi-composer-context)），归纳出一个共同模式：三家都在**生产 harness 内部跑 RL rollout**。

- **Kimi K2.5** 在 Agent Swarm 训练中用 PARL 框架，关键设计是冻结子 agent 权重只训练 orchestrator，解决了信用分配（credit assignment）问题
- **Cursor Composer 2** 从生产流量中实时采样 rollout 数据，用 GRM（Generative Reward Model）评估代码质量的多个维度——不只是"测试是否通过"
- **Chroma Context-1** 训练 agent 主动修剪（prune）检索结果，为后续搜索腾出上下文空间

这三个案例揭示了一个新的竞争格局：**谁的生产环境产生的 rollout 数据质量更高、规模更大，谁的 agentic 模型就更强**。Harness 不只是部署工具，它是训练数据的生产线。

### 为什么这件事现在变得重要

算法上，agentic RL 的基本框架已经清晰了（GRPO/PPO + 环境奖励）。2026 年真正的差距在于能否高效地运行大规模的 agentic rollout——这是一个基础设施问题，不是一个算法问题。

Heddle 论文里有一个细节很能说明问题：论文作者来自北京大学，不是某个大公司的内部团队。这意味着 agentic RL 的基础设施挑战已经普遍到需要学术界介入解决了——这是领域成熟的标志。

接下来值得关注的问题：当 rollout 基础设施标准化之后（类似 CUDA 对 GPU 训练的作用），真正的壁垒会转移到哪里？
