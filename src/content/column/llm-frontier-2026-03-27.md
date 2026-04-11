---
title: "Anthropic 赢得初步禁令对抗五角大楼、ICML 用水印抓 AI 审稿拒掉 497 篇论文、白宫 AI 沙皇 Sacks 卸任"
description: "联邦法官暂时叫停五角大楼将 Anthropic 列为供应链风险的决定，ICML 首创水印技术检测 AI 同行评审引发学术界震动，David Sacks 卸任白宫 AI 与加密货币沙皇"
date: 2026-03-27
series: "大模型前沿动态"
volume: 6
tags: ["Anthropic", "五角大楼", "供应链风险", "ICML", "AI审稿", "水印", "David Sacks", "AI政策", "W3C", "Gemini"]
---

## 今日动态

> 本期追踪到 3 项核心进展，以及 3 项快讯。

---

### 🏢 Anthropic：联邦法官颁发初步禁令，暂时叫停五角大楼「供应链风险」认定

**发布时间**：2026-03-26（裁定日）
**来源**：[CNBC](https://www.cnbc.com/2026/03/24/anthropic-lawsuit-pentagon-supply-chain-risk-claude.html) · [NPR](https://www.npr.org/2026/03/24/nx-s1-5759276/anthropic-pentagon-claude-preliminary-injunction-hearing) · [AP News](https://apnews.com/article/anthropic-pentagon-supply-chain-risk-1c8955eccab9f6f40de5f9897118ac32)

**内容摘要**：

旧金山联邦法官丽塔·林（Rita Lin）于 3 月 26 日颁发初步禁令，暂时冻结五角大楼将 Anthropic 列为「供应链风险」的决定，以及特朗普此前要求联邦机构「立即停止使用」Anthropic 技术的行政指令。这意味着 Anthropic 在诉讼进行期间可以继续与政府承包商和联邦机构开展业务。

事件的起因要追溯到今年 2 月：Anthropic 与五角大楼就一份 2 亿美元合同的条款谈判破裂——Anthropic 坚持要求**不得将 Claude 用于全自动武器系统或对美国公民的大规模监控**。五角大楼认为 Anthropic「超出了承包商的正常范围」，随后将其列为供应链风险。特朗普更在 Truth Social 发文称 Anthropic 是「失控的激进左翼 AI 公司」，下令联邦机构禁用。

在 3 月 24 日的听证会上，林法官对政府律师的质询极为犀利。当政府以「Anthropic 可能安装自毁开关破坏 IT 系统」为由辩护时，林法官反驳道：「如果仅仅因为 IT 供应商固执或提出恼人的问题就被列为不可信的供应链风险，**这似乎是一个相当低的标准**。」她直言：「这看起来像是试图瘫痪该公司。」参议员伊丽莎白·沃伦也公开致函五角大楼，称此举是对 Anthropic 坚持 AI 伦理原则的「政治报复」。

**值得关注的原因**：
- 这是美国历史上首次有 AI 公司因伦理立场（拒绝 AI 武器化）而被联邦政府「报复性」列入黑名单
- 法官的措辞（「瘫痪公司」「低标准」）高度罕见，暗示 Anthropic 在最终裁决中胜诉的可能性很大
- 此案将成为 AI 公司能否在政府合同中坚持伦理底线的标志性判例——如果 Anthropic 败诉，其他 AI 公司将面临巨大压力去放弃类似的使用限制

**相关链接**：
- [CNBC 详细报道](https://www.cnbc.com/2026/03/24/anthropic-lawsuit-pentagon-supply-chain-risk-claude.html) · [ABC News](https://abcnews.com/Politics/judge-appears-skeptical-pentagon-arguments-legal-fight-anthropic/story?id=131377419) · [eWeek 沃伦致函](https://www.eweek.com/news/warren-calls-anthropic-blacklist-retaliation-pentagon-hearing/)

---

### 🏛️ ICML 2026：用水印技术抓出 AI 审稿，497 篇论文遭「连坐」拒稿

**发布时间**：2026-03-18（ICML 公告）/ 2026-03-25（Nature 报道后广泛传播）
**来源**：[Nature](https://www.nature.com/articles/d41586-026-00893-2) · [ICML 官方公告](https://blog.icml.cc/)

**内容摘要**：

全球机器学习顶级会议 ICML 2026 在 3 月 18 日宣布，**拒绝了 497 篇论文**（约占提交总数的 2%），原因是这些论文的作者在担任审稿人时违反了 AI 使用政策。这是学术界首次大规模使用技术手段检测并惩罚 AI 辅助的同行评审。

检测方法极具创新性：ICML 组委会在分发给审稿人的 **PDF 论文中嵌入了隐形水印**。水印中包含隐藏指令——如果审稿人将论文全文输入 LLM 来生成评审意见，模型会被水印中的提示词引导，在输出文本中包含特定的「露馅短语」（telltale phrases）。通过检测评审意见中是否出现这些短语，组委会**识别出 795 处违规行为，涉及 506 名审稿人**。

ICML 实行「互评」制度（每篇论文至少一位作者需参与审稿），因此违规审稿人的自有投稿也被「连坐」拒稿。今年 ICML 首次设置了两种审稿流程——一种允许有限 LLM 使用（需标注），另一种严格禁止。被抓的均为选择了「禁止使用」流程却偷偷用 AI 的审稿人。

**值得关注的原因**：
- 这是学术界对抗 AI 滥用的里程碑——从「呼吁自律」升级到「技术强制执行」
- 水印 + 提示注入的检测思路极具想象力：本质上是利用 LLM 的「弱点」（遵从隐藏指令）来反制 LLM 滥用
- 「连坐」机制引发争议：德州农工大学计算机科学家 Zhengzhong Tu 认为这可能打击审稿积极性，导致审稿人用 LLM 生成无意义评审来规避检测
- 去年一项研究发现 AI 会议中 21% 的同行评审疑似 AI 生成，三分之一的论文包含疑似幻觉引用——审稿质量危机已到必须技术介入的地步

**相关链接**：
- [Nature 报道](https://www.nature.com/articles/d41586-026-00893-2) · [知乎讨论](https://zhuanlan.zhihu.com/p/2018740893985810067) · [搜狐报道](https://www.sohu.com/a/998106236_473283)

---

### 🇺🇸 白宫：David Sacks 卸任 AI 与加密货币沙皇

**发布时间**：2026-03-26
**来源**：[Bloomberg / Techmeme](https://www.techmeme.com/) · [MSN / Axios](https://www.msn.com/en-us/politics/government/david-sacks-drops-ai-czar-label-not-policy-influence/ar-AA1Zuc8N)

**内容摘要**：

白宫 AI 与加密货币顾问 David Sacks 已正式卸任「特别政府雇员」（SGE）身份。Sacks 在采访中表示，他已用完了联邦法律规定的 SGE 任期时间，但将继续以非正式身份就 AI 政策向总统提供建议。

Sacks 自 2025 年 1 月被特朗普任命为首任「AI 和加密货币沙皇」以来，主导了多项重大政策——包括推动美国数字资产战略框架、放松 AI 出口管制、以及此前引发争议的 Anthropic 供应链风险认定。参议员伊丽莎白·沃伦早在去年 9 月就对 Sacks 是否超期任职提出质疑，并指控其作为 Craft Ventures 合伙人存在利益冲突（Sacks 的基金投资了多家 AI 和加密货币公司）。

Sacks 的卸任虽为「到期离任」而非主动辞职，但发生在 Anthropic 禁令法律战的关键节点——而这正是他主导的政策之一。

**值得关注的原因**：
- Sacks 的离开意味着美国 AI 政策的最高级别协调者出现真空，继任者的立场将直接影响 AI 监管走向
- 他任期内 AI 政策的核心基调是「放松管制 + 产业优先」，Anthropic 事件是唯一的例外——但这个例外被法官初步认定为「报复」
- 对中国 AI 出口管制政策的后续走向需要密切关注

**相关链接**：
- [Axios 报道](https://www.msn.com/en-us/politics/government/david-sacks-drops-ai-czar-label-not-policy-influence/ar-AA1Zuc8N) · [沃伦参议员质疑信](https://www.warren.senate.gov/imo/media/doc/david_sacks_sge_letter_91625.pdf)

---

## 今日速览

- **W3C**：发布《大型语言模型在标准工作中的使用》指导文件（Group Note），就 LLM 在 Web 标准制定中的不同使用场景提供风险评估和建议，标志着互联网标准组织正式应对 AI 对技术规范制定流程的影响 ([W3C 公告](https://www.w3.org/news/2026/group-note-use-of-large-language-models-in-standards-work/) · [中文版](https://www.w3.org/zh-hans/news/2026/group-note-use-of-large-language-models-in-standards-work/))
- **Google Gemini**：推出「Switch Tool」聊天记录迁移工具，支持用户将其他 AI 聊天机器人（如 ChatGPT、Claude）的对话历史导入 Gemini，降低用户迁移成本，这是 Google 在 AI 助手市场争夺用户的最新动作 ([TechCrunch](https://techcrunch.com/))
- **LiteLLM 攻击后续**：安全研究员 Callum McMahon 分享了他向 PyPI 报告 LiteLLM 恶意软件攻击的逐分钟响应过程，其中一个有趣的细节是他使用 Claude 对话记录来协助确认和追踪漏洞——「用 AI 抓 AI 投毒」([Simon Willison](https://simonwillison.net/))

---

## 编者按

> 今天的三条核心新闻看似各自独立，但串在一起呈现出一个清晰的主题：**AI 时代的规则与边界正在被重新定义**。
>
> Anthropic 对抗五角大楼，本质上是在回答一个根本性问题：**AI 公司有没有权利对自己的技术说「不」？** 当一家估值超过千亿美元的公司因为拒绝让 AI 用于武器系统而被政府「拉黑」时，整个行业都在注视。法官的初步裁定给出了一个令人鼓舞的信号——但最终判决仍悬而未决。
>
> ICML 的水印反击战则揭示了学术界的另一个边界战场。当审稿人自己都在用 AI 写评审时，同行评审这一科学自净机制还能否维持？ICML 的答案是用技术对抗技术——但「连坐」拒稿的严厉程度也在提醒我们，制度设计需要在公平与效率之间找到平衡。
>
> 而 David Sacks 的卸任，则为美国 AI 政策的下一阶段留下了巨大的不确定性。当「AI 沙皇」的位子空出来，谁来填补、以什么姿态填补，将直接影响全球 AI 产业的竞争格局。
