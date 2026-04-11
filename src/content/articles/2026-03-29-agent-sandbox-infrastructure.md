---
title: "Agent Sandbox：被低估的基础设施层"
description: "AI Agent 在生产环境部署的最大障碍不是模型能力，而是隔离安全。$260M+ 的 sandbox 市场正在形成，Firecracker microVM 成为新标准——但大多数团队仍在用容器或什么都没有。"
date: 2026-03-29
category: "工程实践"
tags: ["Agent", "Sandbox", "安全隔离", "MicroVM", "Firecracker", "生产部署", "基础设施"]
---

HN 上有一个问题最近得到了大量共鸣：[「为什么这么多团队在自己造 AI Agent 的 sandbox 方案？」](https://news.ycombinator.com/item?id=46699324)

回答五花八门：Docker 权限太宽、gVisor 有性能损耗、现成方案不够细粒度、安全要求因场景差异太大……但真正的答案隐藏在这些回答背后：**大多数 AI Agent 框架根本没有默认的隔离层，而团队往往在出事之后才意识到这个问题。**

---

## 为什么 Agent 没有 Sandbox 就是确定的安全事故

传统软件的安全模型是：代码是确定性的，你能 review，你知道它会做什么。LLM Agent 打破了这个假设。模型在运行时生成代码，生成工具调用，生成文件操作指令——这些都是你在部署时无法预见的行为。

[Veracode 2025 GenAI Code Security Report](https://www.veracode.com/resources/state-of-software-security) 数据：**45% 的 AI 生成代码会引入安全漏洞**。[OWASP](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 将 Prompt Injection 列为 AI 系统头号威胁，Obsidian Security 发现它出现在 73% 以上的生产部署中。

真实事故不是假想的。[Generative.inc 的 Agent Sandbox 综述](https://www.generative.inc/ai-agent-sandboxes-the-infrastructure-layer-every-builder-needs-to-understand) 记录了几个典型案例：

> "In 2023, security researcher Johann Rehberger demonstrated that ChatGPT's Code Interpreter could be tricked via prompt injection into exfiltrating uploaded data to attacker-controlled servers. He later discovered that Code Interpreter sandboxes were shared between different GPTs for the same user — meaning a malicious GPT could steal files from your conversations with other GPTs. OpenAI took over 90 days to fix it."

2026 年 3 月，BeyondTrust 发现 AWS Bedrock AgentCore 的 Sandbox Mode 允许出站 DNS 查询，可以通过 DNS 隧道建立完整的命令控制通道。AWS 的回应是：不修了，文档里加一行「推荐用 VPC 模式」。Lakera 演示了针对 Cursor IDE 的零点击漏洞利用链——通过 MCP，一个恶意 Google Doc 可以触发凭证窃取，不需要任何用户交互。

NVIDIA AI Red Team 给出了每个 Agent 部署必须具备的三个控制：网络出站控制（防止反向 shell）、文件系统写权限限制（防止修改 `~/.zshrc` 等自动执行文件）、配置文件保护（防止攻击者通过 `CLAUDE.md` 等文件持久控制 Agent 行为）。他们的核心结论是：

> "Application-level controls are insufficient because once control passes to a subprocess, the application has no visibility into or control over what happens next."

---

## 隔离技术谱系

从强到弱，主要选项：

**[Firecracker microVM](https://firecracker-microvm.github.io/)**（当前黄金标准）：由 AWS 开发，为 Lambda 和 Fargate 提供底层支持，启动时间 125ms，内存开销低至 5MB。每个 Agent 运行在独立的轻量虚拟机里，hypervisor 级别的隔离，共享内核攻击面被消除。e2b、Modal、Fly.io 都在用这个。

**[gVisor](https://gvisor.dev/)**（Google 开发）：在用户空间实现 Linux 系统调用，比 Firecracker 性能略差但比普通容器安全得多。适合对启动速度要求没那么极端、但需要更强隔离的场景。

**标准 Docker 容器**：在安全层面是**严重不足的**。容器共享宿主机内核，容器逃逸漏洞是已知的攻击面。在 Agent 场景中使用未经强化的容器，基本等于给 Agent 开了 root 访问。

---

## 市场在说什么

过去 18 个月，这个方向融资超过 **$260M**。Alibaba 刚开源了 [OpenSandbox](https://github.com/alibaba/opensandbox)，三周内 GitHub Stars 破 9000。英国 AI Safety Institute 发布了第一个 LLM sandbox 逃逸的可复现 benchmark——证明前沿模型确实能突破配置不当的容器。

值得注意的是：这不是一个「有安全意识就会做」的基础设施，而是**企业级 Agent 部署的入场券**。没有 hypervisor 级别隔离，企业很难给 Agent 授予它完成任务所需的真实权限——你要么权限不够（Agent 什么也做不了），要么没有隔离（Agent 什么都可以做）。这个矛盾是 Agent 落地的核心工程挑战。

---

## 对于正在构建 Agent 的团队

如果你在内网部署 Agent，需要问自己几个问题：

1. 代码执行发生在哪里？是在主进程里、普通容器里、还是有隔离的环境里？
2. Agent 能访问什么文件系统路径？能不能写 `~/.zshrc` 或 `CLAUDE.md`？
3. 网络出站是否有限制？Agent 能否访问任意外部 IP？
4. 多个 Agent 会话之间是否有隔离？会话 A 能否读取会话 B 的文件？

这些问题没有统一答案，但不回答就上生产是在赌运气。隔离不是 Agent 功能的一部分——它是 Agent 安全运行的前提。
