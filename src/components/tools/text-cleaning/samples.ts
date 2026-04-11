// ============================================================
// 8 个精选真实风格样本数据
// ============================================================

import type { SampleData } from './types';

export const sampleDatasets: SampleData[] = [
  {
    id: 'common-crawl',
    name: 'Common Crawl 网页',
    description: '典型网页：导航+广告+正文混合',
    icon: '🕸',
    text: `<html>
<head><title>深度学习教程 - AI技术博客</title></head>
<body>
<nav>首页 | 教程 | 关于 | 联系我们: admin@example.com</nav>
<div class="ad-banner">限时优惠！AI课程仅需 ¥99！点击 https://spam-course.example.com 立即报名</div>
<div class="content">
<h1>Transformer 模型详解</h1>
<p>Transformer 是一种基于自注意力机制的深度学习架构。</p>

<p>它在 2017 年由 Google 提出，论文地址：https://arxiv.org/abs/1706.03762</p>

<p>Transformer 是一种基于自注意力机制的深度学习架构。</p>

<p>作者联系方式：researcher@google.com，电话：13812345678</p>

<p>模型的核心公式为 Attention(Q,K,V) = softmax(QK^T/\\u221ad_k)V</p>

<p>训练服务器 IP: 192.168.1.100，\\u200B使用 8 张 A100 GPU。</p>

---
***
===

<p>更多内容请访问 https://example.com/transformer-tutorial 了解。</p>

<p>  身份证示例：  110101199001011234  </p>


</div>
<footer>© 2024 AI Blog. All rights reserved.</footer>
<div class="cookie-notice">Cookie Policy: We use cookies to improve your experience.</div>
</body>
</html>`,
  },
  {
    id: 'forum-post',
    name: '论坛帖子',
    description: '引用嵌套、签名、表情代码',
    icon: '💬',
    text: `> 原帖由 user_2023 发表于 2024-03-15 14:23
> 有人用过 Llama 3 做 fine-tuning 吗？效果怎么样？

回复 user_2023：

我试了一下，效果还不错。主要步骤：

1. 数据准备：收集了大约 10K 条对话数据
2. 使用 LoRA 微调，rank=16，alpha=32
3. 训练了 3 个 epoch，loss 降到 0.8 左右

> 原帖由 user_2023 发表于 2024-03-15 14:23
> 有人用过 Llama 3 做 fine-tuning 吗？效果怎么样？

@admin_bot 能帮我置顶这个帖子吗？:thumbsup: :fire:

----
签名：AI 研究员 | 个人博客: https://myblog.example.com
联系邮箱：researcher@example.com | IP: 10.0.0.1
----

Share on Facebook | Share on Twitter | Share on LinkedIn
Previous Post | Next Post
Subscribe to our newsletter`,
  },
  {
    id: 'code-mixed',
    name: '代码混合文档',
    description: 'Markdown + Python 代码块',
    icon: '💻',
    text: `# Data Processing Pipeline

This document describes how to build a basic data processing pipeline using Python.

## Step 1: Load Data

\`\`\`python
import pandas as pd
import numpy as np

# Load raw data from CSV
# TODO: add error handling
df = pd.read_csv("training_data.csv")
print(f"Loaded {len(df)} rows")

# Auto-generated code by GitHub Copilot
# License: MIT
\`\`\`

## Step 2: Clean Data

\`\`\`python
def clean_text(text: str) -> str:
    """Remove HTML tags and normalize whitespace."""
    import re
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\\s+', ' ', text)
    return text.strip()

# Apply cleaning
df['clean_text'] = df['raw_text'].apply(clean_text)
\`\`\`

The cleaning function removes **HTML tags** and normalizes whitespace.
For more details, see https://docs.python.org/3/library/re.html

Contact: dev-team@company.com`,
  },
  {
    id: 'multilingual',
    name: '多语言混合',
    description: '中英日混排文本',
    icon: '🌏',
    text: `# 大規模言語モデルの最新動向

## Overview

2024年は大規模言語モデル（LLM）にとって重要な年でした。

The Transformer architecture continues to dominate the field of natural language processing.
主要な進展は以下の通りです：

1. GPT-4 Turbo 发布，支持 128K 上下文窗口
2. Llama 3 オープンソースリリース — Meta から
3. Claude 3 family launched by Anthropic with improved reasoning

这三个模型各有特色：
- GPT-4 は総合性能が最も高い
- Llama 3 is the best open-source option
- Claude 3 在安全性方面领先

詳細は https://arxiv.org/recent を参照してください。
Contact: research@lab.example.com`,
  },
  {
    id: 'seo-spam',
    name: 'SEO 垃圾文本',
    description: '低质量关键词堆砌',
    icon: '🗑',
    text: `Best AI Tools 2024 Best AI Tools Best AI Tools
Top Machine Learning Courses Online Free Download Now
===
***
---
Click Here! Click Here! Click Here!
Buy Now! Limited Offer! 50% OFF!
AI AI AI Machine Learning Deep Learning Neural Network
Best Best Best Top Top Top Free Free Free
Subscribe Now! Don't Miss Out!
Sign Up for Our Newsletter
Follow Us on Social Media
Facebook Twitter Instagram LinkedIn
Share This Article
Loading...
Loading...
Loading...
Copyright 2024 All Rights Reserved
Privacy Policy | Terms of Service | Cookie Policy
Previous Article | Next Article | Related Articles
Tags: ai, ml, dl, neural-network, transformer, gpt, llm
Tags: ai, ml, dl, neural-network, transformer, gpt, llm
Tags: ai, ml, dl, neural-network, transformer, gpt, llm`,
  },
  {
    id: 'academic-html',
    name: '学术论文 HTML',
    description: '公式、表格、参考文献',
    icon: '📄',
    text: `<article>
<h1>Scaling Laws for Neural Language Models</h1>
<div class="authors">Kaplan et al., 2020</div>

<h2>Abstract</h2>
<p>We study empirical scaling laws for language model performance on the cross-entropy loss.
The loss scales as a power-law with model size, dataset size, and the amount of compute
used for training, with some trends spanning more than seven orders of magnitude.</p>

<h2>Key Findings</h2>
<table>
<tr><th>Parameter</th><th>Exponent</th><th>R²</th></tr>
<tr><td>Model Size (N)</td><td>-0.076</td><td>0.98</td></tr>
<tr><td>Dataset Size (D)</td><td>-0.095</td><td>0.97</td></tr>
<tr><td>Compute (C)</td><td>-0.050</td><td>0.99</td></tr>
</table>

<p>The loss <em>L</em> follows: L(N) = (N_c / N)<sup>α_N</sup> where α_N ≈ 0.076</p>

<img src="scaling_plot.png" alt="Log-log plot of loss vs model parameters showing power law scaling">

<h2>References</h2>
<ol>
<li>Brown et al. (2020). Language Models are Few-Shot Learners. <a href="https://arxiv.org/abs/2005.14165">arXiv:2005.14165</a></li>
<li>Hoffmann et al. (2022). Training Compute-Optimal Large Language Models. <a href="https://arxiv.org/abs/2203.15556">arXiv:2203.15556</a></li>
</ol>

<footer>© 2020 OpenAI. Contact: scaling-laws@openai.com</footer>
</article>`,
  },
  {
    id: 'social-media',
    name: '社交媒体数据',
    description: '短文本、@提及、#标签、emoji 密集',
    icon: '📱',
    text: `@elonmusk 刚刚宣布 Grok 3 开源了！🎉🎉🎉 #AI #OpenSource #Grok3

转发 @_akhaliq: 
New paper alert! 🚨🚨🚨
"Scaling Laws for LLM Agents" 
https://arxiv.org/abs/2024.xxxxx
This is HUGE! 🔥🔥🔥

回复 @researcher_cn:
我觉得这篇论文有几个问题 🤔
1) 实验规模太小 👎
2) baseline 不公平 😤
3) 没有 ablation study 🙄

#MachineLearning #DeepLearning #NLP #LLM #AGI

@karpathy said: "The best way to learn is to build things"
@ylecun replied: "Self-supervised learning is the future" 

❤️ 1.2K  🔁 456  💬 89

---
Sponsored: 🎯 Get 50% off AI courses! 
Contact: ads@social.example.com
Privacy Policy | Terms | Help`,
  },
  {
    id: 'pdf-extract',
    name: 'PDF 提取文本',
    description: '页眉页脚重复、断行错位',
    icon: '📃',
    text: `Chapter 3: Attention Mechanisms                                    Page 42

3.1 Self-Attention

The self-attention mechanism allows each position in the se-
quence to attend to all positions in the previous layer. This
is particularly important for capturing long-range dependen-
cies in natural language.

Chapter 3: Attention Mechanisms                                    Page 43

The attention weights are computed as:

   Q = XW_Q
   K = XW_K  
   V = XW_V

Where X is the input matrix and W_Q, W_K, W_V are lear-
nable weight matrices.

Chapter 3: Attention Mechanisms                                    Page 44

3.2 Multi-Head Attention

Instead of performing a single attention function, multi-head
attention runs several attention operations in parallel:

   MultiHead(Q,K,V) = Concat(head_1,...,head_h)W_O

This allows the model to jointly attend to information from di-
fferent representation subspaces.

Chapter 3: Attention Mechanisms                                    Page 44

Chapter 3: Attention Mechanisms                                    Page 44

References on page 215.`,
  },
];
