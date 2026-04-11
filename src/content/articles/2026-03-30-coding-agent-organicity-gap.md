---
title: "Coding Agent 能写对代码，但不懂这个项目的代码"
description: "Claude Code 的 git reset 事件和一篇 ArXiv 新论文，从两个角度指向同一个根本问题：当前 coding agent 的能力边界不是功能正确性，而是项目合规性（organicity）——代码合规但不符合这个仓库的风格、内部 API 和架构约束。"
date: 2026-03-30
category: "工程实践"
tags: ["Coding Agent", "Claude Code", "项目合规性", "仓库记忆", "工程实践"]
---

这周 Hacker News 上有一条 [186 分的帖子](https://news.ycombinator.com/item?id=47567969)：有人报告 Claude Code 在执行 `/loop 10m` 命令后，每隔 10 分钟就会对项目仓库执行 `git reset --hard origin/main`。

评论区的讨论很快从「这是 bug 还是用户配置错误」跑向了一个更深层的问题。一位工程师在评论里说：

> "When will you all learn that merely 'telling' an LLM not to do something won't deterministically prevent it from doing that thing? If you truly want it to never use those commands, you better be prepared to sandbox it to the point where it is completely unable to do the things you're trying to stop."

这一句话，指向了 coding agent 领域一个没有被充分讨论的边界：**CLAUDE.md 里的文字约束是软性的，不是硬性的**。「永远不要用 git reset --hard」写进 agent 的系统提示，不等于这件事不会发生——它只是降低了概率。

几乎同一时间，ArXiv 上出现了一篇新论文。

## 「合规性」缺失是根本问题，不是功能 bug

3 月 27 日，一篇叫 [Learning to Commit: Generating Organic Pull Requests via Online Repository Memory](https://arxiv.org/abs/2603.26664) 的论文出现在 arxiv.org。

摘要的第一句话：

> "LLM-based coding agents achieve impressive results on controlled benchmarks yet routinely produce pull requests that real maintainers reject."

被拒绝的原因不是功能错误，而是**缺乏合规性（organicity）**：代码忽视了项目特有的命名规范，重复实现了内部 API 已经提供的功能，违反了多年开发积累下来的隐式架构约束。

这篇论文的观察和 HN 上的工程师经验是同一回事的两种表述：agent 知道怎么写代码，但不知道**这个仓库的代码应该怎么写**。

## 仓库快照不够，需要变更历史

Learning to Commit 的核心论点很简单：把代码库的当前状态（一个 snapshot）暴露给 agent 是不够的。**Snapshot 告诉你最终状态，但不告诉你这个状态是怎么形成的。**

一个仓库的 commit history 里有大量隐含信息：
- 这个项目倾向于在什么时候抽象新的内部 API，什么时候宁愿重复代码？
- 代码审查里经常被 reject 的模式是什么？
- 架构约束是怎么随着时间演化的？

这些信息在 snapshot 里是不可见的。

论文提出的方案叫 Online Repository Memory：给一个有严格时间划分的仓库，agent 对历史 commit 做有监督的对比反思（supervised contrastive reflection）——先盲目尝试解决每个历史 issue，然后把自己的 prediction 和真实的 oracle diff 做对比，把这个 gap 提炼成一个持续增长的「技能库」（skills），记录项目特有的编码风格、内部 API 使用模式、架构不变量。

面对新 PR 时，agent 在这些 skills 的约束下生成代码，而不只是从通用的预训练先验出发。

评估用的是真实的、未来的、已合并 PR——而不是任何在技能构建阶段见过的数据。指标不只是功能正确性，还包括代码风格一致性、内部 API 复用率、修改区域合理性。

## 两个问题，同一个缺口

把这两件事放在一起，缺口很清晰：

**当前 coding agent 的能力边界不是「能不能写出功能正确的代码」，而是「能不能遵守这个具体项目的隐式规范」。**

HN 的讨论给出了工程实践层面的教训：文字约束（CLAUDE.md / 系统提示）对 agent 行为的影响是概率性的，不是确定性的。如果某个操作是真正不可接受的（如 `git reset --hard`、`git push --force`），唯一可靠的方式是在执行环境里做硬性限制——移除该命令的执行权限，而不是告诉 agent 不要这样做。

Learning to Commit 给出了模型能力层面的方向：不应该期待 agent 从通用预训练先验里推断出项目特有的约束，而是应该让 agent 主动从仓库的变更历史里学习这些约束，并把它们存储在可检索的形式里。

一个有趣的对称性：前者说「prompt 约束不可靠，要用沙箱」；后者说「仓库 snapshot 不够，要看 commit history」。两者都是在说：agent 需要更多的**结构化上下文**，而不只是更多的文字指令。

## 「有机性」作为评估维度

Learning to Commit 引入的「organicity」（合规性 / 有机性）这个词值得记住。

当前大多数 coding agent 的 benchmark（SWE-bench 及其变体）衡量的是功能正确性：测试用例通过了吗？但真实的代码评审里，功能正确性只是门槛，不是终点。一个通过了所有测试但完全不像这个项目风格的 PR，资深工程师会 request change，而不是 approve。

这意味着「organicity」将成为 coding agent 能力评估的下一个重要维度——在功能正确性之上的一层。这个维度目前几乎没有标准化的 benchmark，而 Learning to Commit 给出了一个思路：用未来真实被合并的 PR 作为 ground truth，多维度评估。

目前还是一篇 preprint，但方向是对的。
