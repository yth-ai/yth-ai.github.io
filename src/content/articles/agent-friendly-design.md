---
title: "为 AI 而设计：Agent-Friendly Design 完全指南"
description: "当 AI Agent 成为网站的新用户，我们的设计范式需要怎样的根本转变？从语义化 HTML 到 A2UI 协议，从 llms.txt 到 MCP，一份面向未来的设计实践手册。"
date: 2026-03-23
category: "技术前沿"
tags: ["AI Agent", "设计", "Agent-Friendly", "A2UI", "MCP", "语义化", "结构化数据"]
---

## 引言：你的下一个用户，可能不是人

2025 年底，一个有趣的现象开始出现：在部分电商网站的流量报表中，来自 AI Agent 的访问量首次超过了传统搜索引擎爬虫。OpenAI 的 Operator、Anthropic 的 Computer Use、Google 的 Project Mariner——这些能代替用户浏览网页、填写表单、完成购买的 AI Agent，正在成为互联网的新"用户群体"。

IEEE Spectrum 在一篇题为《The Agentic Web》的文章中指出：**互联网正在从"以人为中心"向"人机混合"的范式转移**。UC Berkeley 的 Dawn Song 教授预测，未来的网络交互将是"用户的 Agent"与"网站的 Agent"之间的机器对机器通信。

这意味着，**产品和网站的设计，不能再只考虑人类用户了**。如果你的界面只有人看得懂，而 AI 看不懂、操作不了，你将失去越来越大比例的"流量"。

本文系统梳理这个新兴设计方向的核心思路、技术手段和实践路线图。

---

## 一、什么是 Agent-Friendly Design？

一个类比：还记得 2010 年代的 **"Mobile-First"** 运动吗？当智能手机成为主要上网设备，整个行业重新审视了网页设计的基本假设——从桌面优先转向移动优先。

现在，**"Agent-First"** 正在成为下一个 Mobile-First。

> Agent-First is the new Mobile-First.
> — Warpway, 2025

Agent-Friendly Design 的核心理念是：**在保持人类用户体验的同时，让 AI Agent 也能高效理解和操作你的界面**。它不是推翻现有设计，而是在现有 UI 之上增加一个"语义层"（Semantic Layer），让机器能读懂人类界面背后的意图。

### 1.1 人类看到的 vs AI 看到的

| 维度 | 人类用户 | AI Agent |
|------|---------|---------|
| **感知方式** | 视觉：颜色、布局、动画 | DOM 结构、属性、文本内容 |
| **理解按钮** | 看颜色和位置判断主次 | 读 `aria-label` 或 `data-action` |
| **导航方式** | 肉眼扫描、鼠标滚动 | 解析 DOM 树、跟随链接 |
| **处理速度** | 一次看一屏 | 毫秒级解析整个页面 |
| **交互能力** | 精确点击、拖拽 | 依赖选择器定位元素 |

关键洞察：**好的无障碍设计（Accessibility）已经完成了 Agent-Friendly 的一半工作**。语义化 HTML、ARIA 角色/标签、键盘导航支持——这些帮助屏幕阅读器的实践，同样帮助 AI Agent 理解界面。

### 1.2 两类 Agent 交互模式

当前 AI Agent 与网页交互主要有两种模式：

**模式一：视觉理解（Computer Use 风格）**

Agent 通过截图 + 视觉模型理解页面，然后模拟鼠标键盘操作。Anthropic 的 Computer Use 和 OpenAI 的 CUA（Computer-Using Agent）属于这种。

- 优点：无需网站做任何适配
- 缺点：慢、不准、容易误操作，像一个"看着屏幕猜"的实习生

**模式二：DOM 感知（Agent-First 风格）**

Agent 直接读取页面 DOM 结构和语义属性，精确理解每个元素的功能和意图。

- 优点：快、准、可靠
- 缺点：需要网站主动提供语义信息

**趋势：行业正在从模式一向模式二迁移。** 当你的网站具备良好的语义层，Agent 的操作成功率可以从 ~60% 提升到 95%+。

---

## 二、双界面设计（Dual-Interface Design）

Agent-Friendly Design 的核心架构思想是 **双界面设计**——同一个系统同时服务两类用户：

```
┌─────────────────────────────────────────┐
│               你的网站/应用               │
├───────────────────┬─────────────────────┤
│   人类界面 (UX)    │   机器接口 (AX)      │
│                   │                     │
│  • 视觉设计       │  • 语义化 HTML       │
│  • 动画交互       │  • ARIA 属性        │
│  • 响应式布局     │  • data-* 属性      │
│  • 品牌一致性     │  • 结构化数据        │
│                   │  • API / MCP        │
│                   │  • llms.txt         │
└───────────────────┴─────────────────────┘
        ↑                    ↑
     人类用户            AI Agent
```

这里的 **AX（Agent Experience）** 是一个新概念——类比 UX（User Experience），它关注的是 AI Agent 与你的系统交互的体验质量。

---

## 三、四大核心设计原则

### 原则一：语义钩子（Semantic Hooks）

**不要让 AI 猜，要明确告诉它每个元素是什么、做什么。**

```html
<!-- ❌ 差：AI 看到两个长得一样的按钮，分不清 -->
<button class="btn-primary">更新</button>
<button class="btn-primary">更新</button>

<!-- ✅ 好：通过 data 属性明确意图 -->
<button
  data-action="update-shipping-address"
  data-entity="shipping-address"
  aria-label="更新收货地址"
>
  更新
</button>
<button
  data-action="update-payment-method"
  data-entity="payment-method"
  aria-label="更新支付方式"
>
  更新
</button>
```

推荐使用的语义属性：

| 属性 | 用途 | 示例 |
|------|------|------|
| `data-action` | 元素执行的操作 | `submit-order`, `add-to-cart` |
| `data-entity` | 被操作的对象 | `shopping-cart`, `user-profile` |
| `data-intent` | 操作的业务意图 | `purchase`, `navigation` |
| `aria-label` | 人类可读的描述 | "提交订单" |
| `data-requires-auth` | 是否需要登录 | `true` / `false` |

### 原则二：稳定选择器（Stable Selectors）

现代前端构建工具（Vite、Webpack）会自动生成哈希类名（如 `btn-a6f2d`），这些类名每次构建都会变化。AI Agent 如果依赖这些选择器定位元素，下次部署就会全部失效。

```html
<!-- ❌ 不稳定：哈希类名随构建变化 -->
<div class="card-x7f2a">
  <button class="btn-9k3m">购买</button>
</div>

<!-- ✅ 稳定：语义化属性不随构建变化 -->
<div data-component="product-card" data-product-id="12345">
  <button data-action="purchase" data-test-id="buy-button">购买</button>
</div>
```

> **tips：** `data-test-id` 是 E2E 测试（如 Playwright、Cypress）的常见实践。好消息是，**如果你已经为测试添加了 test-id，你的网站对 AI Agent 已经更友好了**。

### 原则三：显式意图声明（Explicit Intent）

不要让 AI 通过上下文推测一个操作的含义和后果，直接在属性中声明。

```html
<form
  data-form-type="checkout"
  data-intent="purchase"
  data-step="3-of-3"
  data-requires-payment="true"
>
  <input
    data-field="card-number"
    data-sensitive="true"
    aria-label="信用卡号"
    autocomplete="cc-number"
  />
  <button
    data-action="submit-payment"
    data-consequence="charge-card"
    data-reversible="false"
  >
    确认支付 ¥299
  </button>
</form>
```

关键属性说明：
- `data-consequence`：告诉 Agent 这个操作会产生什么后果
- `data-reversible`：操作是否可撤销
- `data-step`：当前处于多步流程的哪一步

### 原则四：Agent 权限策略（Agent Policy）

**并非所有操作都应该允许 AI 自动执行。** 删除账户、转账、发布内容——这些高风险操作需要明确的权限控制。

```html
<!-- 低风险：允许 Agent 自由操作 -->
<button data-agent-policy="allow" data-action="search">
  搜索
</button>

<!-- 中风险：需要用户确认 -->
<button data-agent-policy="confirm" data-action="place-order">
  下单
</button>

<!-- 高风险：禁止 Agent 操作 -->
<button data-agent-policy="deny" data-action="delete-account">
  删除账户
</button>
```

三级策略：

| 策略 | 含义 | 适用场景 |
|------|------|---------|
| `allow` | Agent 可自由交互 | 搜索、浏览、筛选 |
| `confirm` | 需要用户确认后执行 | 下单、修改设置、发送消息 |
| `deny` | 禁止 Agent 操作 | 删除账户、转账、修改密码 |

---

## 四、技术栈全景：让 AI 理解你的网站

除了上述的 HTML 层设计原则，还有一系列技术标准和协议构成了完整的 Agent-Friendly 技术栈：

### 4.1 语义化 HTML5（基础层）

这是一切的起点。使用正确的 HTML 标签替代通用 `<div>`：

```html
<!-- ❌ div 套 div，AI 只看到一堆盒子 -->
<div class="header">
  <div class="nav">
    <div class="nav-item">首页</div>
  </div>
</div>

<!-- ✅ 语义化标签，AI 一眼看懂结构 -->
<header>
  <nav aria-label="主导航">
    <a href="/">首页</a>
  </nav>
</header>
```

语义化标签速查：

| 标签 | 语义 | AI 理解 |
|------|------|---------|
| `<header>` | 页头 | 这是顶部导航区 |
| `<nav>` | 导航 | 这里有可跟随的链接 |
| `<main>` | 主内容 | 页面核心信息在这里 |
| `<article>` | 独立内容 | 这是一篇完整的内容单元 |
| `<aside>` | 侧边信息 | 补充内容，非核心 |
| `<footer>` | 页脚 | 版权、链接等辅助信息 |

### 4.2 结构化数据（Schema.org + JSON-LD）

结构化数据让 AI 不仅理解页面"长什么样"，还理解页面"说的是什么"。

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "MacBook Pro 16\"",
  "description": "Apple M4 Max 芯片，48GB 内存",
  "offers": {
    "@type": "Offer",
    "price": "27999",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock",
    "validThrough": "2026-12-31"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "2456"
  }
}
</script>
```

2026 年的前沿实践已经超越基础 Schema.org，包括：
- **`@graph` 模式**：在单个页面中描述多个关联实体
- **知识图谱集成**：通过 `sameAs` 属性链接到 Wikidata 等外部知识库
- **基于动作的架构**：让 AI 知道可以对实体执行什么操作
- **实时数据标记**：标注数据的更新频率和有效期

据 Texta.ai 2026 年 3 月的报告，实施了高级结构化数据的网站，AI 引用率比基础标记高 200-300%，集成知识图谱的网站更是高出 400%。

### 4.3 `/llms.txt`——AI 时代的 robots.txt

`llms.txt` 是 2024 年提出的一个新标准（[llmstxt.org](https://llmstxt.org/)），可以理解为 **AI 时代的 robots.txt**：

- `robots.txt` 告诉爬虫"你能爬哪些页面"
- `llms.txt` 告诉 AI"你应该知道什么"

```markdown
# /llms.txt

# Maxwell 知识平台

> 一个专注于大模型算法方向的个人知识平台。

## 核心内容

- [技术文章](/articles): 大模型预训练、数据工程深度解析
- [研究精读](/research): AI 前沿论文精读与调研
- [书籍](/books): 系统性技术书籍
- [专栏](/column): 定期更新的技术追踪

## 技术栈

- Astro 5 + React 18 + Tailwind CSS
- 部署在内网环境

## 联系方式

- 作者: Maxwell Yu
```

它的格式很简单：**一个 Markdown 文件，放在网站根目录**，用结构化但人类可读的方式，告诉 LLM 关于这个网站最重要的信息。

目前这个标准仍处于早期采纳阶段，但 Cloudflare、Stripe、Anthropic 等公司已经部署了自己的 `llms.txt`。

### 4.4 MCP（Model Context Protocol）

MCP 是 Anthropic 于 2024 年底推出的开放协议，目前已被 OpenAI、Google、Microsoft 采纳。它定义了 **AI 模型与外部工具/数据源交互的标准方式**。

如果说前面的方案是让 AI "读懂"你的网站，MCP 则是让 AI **直接调用你的服务**：

```
传统方式：AI → 打开浏览器 → 找到按钮 → 点击 → 等待 → 解析结果
MCP 方式：AI → 调用 MCP Tool → 直接获取结构化结果
```

对于有后端的产品，提供 MCP Server 是最高效的 Agent 接入方式。

### 4.5 Google A2UI（Agent to UI）

A2UI 是 Google 于 2025 年 12 月开源的声明式 UI 协议，代表了另一个方向的思考：**不是让 AI 操作现有 UI，而是让 AI 直接生成 UI**。

核心思路：
- Agent 生成 JSON 格式的 UI 描述（而非 HTML/JS 代码）
- 客户端根据 JSON 渲染原生组件（Web Components、Flutter、React 等）
- 安全模型：声明式数据而非可执行代码，Agent 只能请求预批准的组件

```json
{
  "type": "card",
  "children": [
    { "type": "text", "value": "航班 CA1234", "style": "heading" },
    { "type": "text", "value": "北京 → 上海 | 08:30 - 10:45" },
    { "type": "button", "label": "预订", "action": "book-flight" }
  ]
}
```

A2UI、MCP 和 A2A（Agent to Agent）三个协议各司其职：
- **MCP**：连接 AI 与工具/数据（"后端"）
- **A2A**：Agent 之间的通信（"网络"）
- **A2UI**：AI 生成的界面（"前端"）

---

## 五、蚂蚁的 RICH 范式

值得一提的是国内的实践。蚂蚁集团的 **Ant Design X** 提出了一套 **RICH 设计理论**，专门解决 AI 界面设计问题：

| 维度 | 含义 | 关注点 |
|------|------|--------|
| **R**ole（角色） | AI 的人设与能力边界 | 它是谁？能做什么？ |
| **I**ntention（意图） | 用户意图的识别与引导 | 用户想做什么？ |
| **C**onversation（会话） | 表达与交互方式 | 怎么说用户才懂？ |
| **H**ybrid UI（混合界面） | GUI + 自然语言融合 | 什么时候用按钮，什么时候用对话？ |

RICH 范式将 AI 交互拆解为四个阶段：
1. **唤醒**：降低用户接触 AI 的门槛，快速展示 AI 能做什么
2. **表达**：引导用户正确表达意图（快捷命令、模板）
3. **确认**：展示任务执行过程，缓解等待焦虑
4. **反馈**：清晰展示结果，建立信任

以及三种界面模式：
- **独立式**：纯对话，类 ChatGPT
- **助手式**：Copilot 模式，对话和 GUI 各占一半
- **嵌入式**：GUI 为主，AI 作为增强能力嵌入

---

## 六、安全考量

开放度越高，风险越大。Agent-Friendly Design 必须同步考虑安全：

### 6.1 权限控制
- 高风险操作（支付、删除、发布）使用 `data-agent-policy="deny"` 或 `"confirm"`
- 涉及敏感信息的字段标注 `data-sensitive="true"`
- API 和 MCP 端点使用 OAuth 或 API Key 认证

### 6.2 防滥用
- 对 Agent 请求设置速率限制
- 监控异常的 Agent 行为模式
- 关键操作要求加密签名验证

### 6.3 隐私合规
- Agent 不应该能访问未经授权的用户数据
- 全站 HTTPS 加密
- 遵守 GDPR、个保法等隐私法规
- 明确标注数据的使用范围和保留期限

### 6.4 一个值得思考的问题

> 如果你的竞争对手的 Agent 来分析你的定价策略，你的结构化数据会不会暴露太多商业信息？

这是 Agent-Friendly 设计中一个微妙的平衡：**对自己的用户的 Agent 要友好，对恶意 Agent 要防范**。这方面的最佳实践还在演化中。

---

## 七、实施路线图

如果你想让你的产品/网站更加 Agent-Friendly，建议分三步走：

### 第一步：语义基建（1-2 周）

- [ ] **审计 HTML**：将关键页面的 `<div>` 替换为语义化标签
- [ ] **添加 ARIA 属性**：为交互元素补充 `aria-label`
- [ ] **稳定选择器**：为关键流程中的按钮/表单添加 `data-action`、`data-test-id`
- [ ] **创建 `/llms.txt`**：在根目录放一个描述网站核心信息的 Markdown 文件

### 第二步：结构化增强（2-4 周）

- [ ] **添加 JSON-LD**：为产品、文章、FAQ 等内容添加 Schema.org 标记
- [ ] **Agent 权限策略**：为所有交互元素定义 `data-agent-policy`
- [ ] **JS 预渲染**：如果使用 SPA 框架，确保 AI 爬虫能获取到完整 HTML
- [ ] **更新 XML 站点地图**：保持站点地图最新且全面

### 第三步：深度集成（1-3 月）

- [ ] **提供 API / MCP Server**：让 Agent 直接调用服务，而非操作 UI
- [ ] **A2UI 支持**（可选）：如果你的产品涉及复杂交互
- [ ] **监控与分析**：跟踪 Agent 访问的成功率和行为模式
- [ ] **安全审计**：定期评估暴露的信息和权限策略

---

## 八、总结

Agent-Friendly Design 不是一个遥远的概念，而是正在发生的范式转移。就像十多年前"Mobile-First"改变了网页设计的基本假设一样，"Agent-First"正在重新定义我们构建数字产品的方式。

核心要点回顾：

1. **双界面设计**是核心架构思想——人类 UX 和机器 AX 并行
2. **语义钩子 + 稳定选择器 + 显式意图 + 权限策略**是四大设计原则
3. **语义化 HTML → 结构化数据 → llms.txt → MCP/API → A2UI** 是递进的技术栈
4. **安全和隐私**是不能忽略的另一面

好消息是，如果你的网站已经做好了 **无障碍设计（Accessibility）**，你已经完成了 Agent-Friendly 的一半工作。语义化 HTML、ARIA 属性、键盘导航——这些帮助残障用户的实践，同样帮助 AI Agent 理解你的界面。

**为人类的多样性而设计，最终也为机器的理解铺平了道路。** 这大概是设计史上最美妙的巧合之一。

---

## 参考资料

1. [Agent-First is the new Mobile-First](https://www.warpway.ai/blog/agent-first-design) — Warpway, 2025.10
2. [The Agentic Web: AI Agents Will Redefine the Internet](https://spectrum.ieee.org/agentic-web) — IEEE Spectrum, 2025.10
3. [Guide to Building AI Agent-Friendly Websites](https://prerender.io/blog/how-to-build-ai-agent-friendly-websites/) — Prerender.io, 2026.01
4. [Introducing A2UI: An Open Project for Agent-Driven Interfaces](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) — Google Developers Blog, 2025.12
5. [Beyond Schema.org: Advanced Structured Data for AI Agents](https://www.texta.ai/blog/beyond-schema-org-advanced-structured-data-ai-agents) — Texta.ai, 2026.03
6. [The /llms.txt File Specification](https://llmstxt.org/) — llmstxt.org, 2024
7. [Ant Design X - AI 界面解决方案](https://x.ant.design/index-cn) — 蚂蚁集团
8. [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — Anthropic, 2024.12
