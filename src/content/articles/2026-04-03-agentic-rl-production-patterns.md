---
title: "生产环境里训练 Agent 的三个共同选择"
description: "Kimi、Cursor、Chroma 同一周发布技术报告，揭示了一套正在形成共识的 agentic RL 工程范式"
date: 2026-04-03
category: "工程实践"
tags: ["Agent", "强化学习", "生产训练", "PARL", "Kimi", "Cursor"]
---

这周内，Moonshot AI（Kimi K2.5）、Cursor（Composer 2）、Chroma（Context-1）分别发布了各自的技术报告——三家公司做了不同的事，却不约而同地做出了几乎相同的工程选择。

这种巧合本身就是信号。

## 不约而同的三个决定

**第一：在生产 harness 里跑 RL，不用合成环境。**

过去 Agent 训练常见的做法是构造干净的模拟环境，降低噪声。但这三份报告都选择了在真实的生产工具链里训练：Cursor 维护了一套与线上完全一致的影子后端（shadow deployment），包括相同的工具、相同的 prompt 格式、相同的系统消息；Kimi 在真实的多模态任务流上运行 RL rollout；Chroma 的向量检索也是真实数据库调用，而非 mock。

原因很直接：模拟环境里收敛的策略，往往在真实工具调用时分布漂移（distribution shift）。现实比 mock 更复杂，也更诚实。

**第二：用 outcome-based reward，而非 process reward。**

三者都不依赖逐步打分（process reward model）。判断标准是最终结果对不对：代码能跑吗？任务完成了吗？检索到有用的内容了吗？这和近期学界的方向一致——process reward 需要大量人工标注中间步骤，成本高且容易被 reward-hacked；outcome reward 更粗粝，但更难欺骗。

Kimi 和 Cursor 还额外引入了 Generative Reward Model（GRM）处理开放式任务，让另一个模型来打分，而不是只用二元对错信号。这个细节很重要：意味着 reward 设计本身也在被 LLM 接管。

**第三：大规模异步 rollout，训练成本远超推理成本。**

Agent rollout 贵，因为每个 trajectory 都要真实执行工具调用。三家都建设了专门的基础设施来并行生成 trajectory，而不是按顺序跑。Kimi 的 PARL 框架甚至把「critical steps」（最长执行链的长度）定义为计算成本的度量单位，而不是总步数——这个设计是专门为并行 Agent 定制的，传统串行训练不需要考虑这个维度。

> "Train inside the production harness. Each team runs RL rollouts through the same tools, prompts, and execution environments that their model encounters in production."
> — Philipp Schmid，[How Kimi, Cursor, and Chroma Train Agentic Models with RL](https://www.philschmid.de/kimi-composer-context)

## 一个有意思的差异：谁该被冻结

Kimi 的 PARL 框架做了一个值得记录的设计决策：orchestrator（决策者）trainable，sub-agents（执行者）frozen。

这解决了 credit assignment 问题——如果协作者都能更新参数，很难判断成功是因为指挥好还是执行好。冻结 sub-agents，把它们的输出视为环境反馈，就能把优化信号干净地指向协调逻辑。

这个思路不新，但在大型 MoE Agent 里实现它，是 Kimi 这次的具体贡献。结果是：并行 Agent 推理延迟降低 4.5×，BrowseComp 准确率从 60.6%（单 Agent）升至 78.4%，超过当时的 GPT-5.2 Pro（77.9%）。

## 认知变化

以前谈 Agent 训练，关注点是"怎么构造好的训练数据"。现在的问题变成了"怎么在真实环境里安全地跑大规模 rollout"。这不只是技术视角的转换，也是基础设施投入的转换。

Cursor 的原话值得记住：他们明确说 SWE-bench 这类公共 benchmark 不能代表真实任务分布，所以要在用户实际使用的环境里收集 trajectory 做 RL。

把训练数据来源从"人工标注"变成"生产流量"，这条路到底走多远，现在还很难预测——但这三份报告让它看起来更可行了。

---

**原始来源**：
- [Kimi K2.5 技术报告](https://arxiv.org/html/2602.02276v1)（Moonshot AI）
- [Cursor Composer 2 报告](https://arxiv.org/html/2603.24477v2) + [博客](https://cursor.com/blog/real-time-rl-for-composer)
- [Chroma Context-1 报告](https://www.trychroma.com/research/context-1)
- Philipp Schmid 的横向分析：[philschmid.de](https://www.philschmid.de/kimi-composer-context)（2026.03.28）
