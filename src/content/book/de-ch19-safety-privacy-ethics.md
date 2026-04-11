---
title: "数据安全、隐私与伦理"
description: "隐私风险、版权合规、偏见公平性与数据安全"
date: 2026-03-21
updatedDate: 2026-03-22
bookSlug: "data-engineering"
chapter: 19
part: "第五部分：横切主题"
partOrder: 5
tags: [数据安全,隐私,伦理,偏见]
---

> *"训练数据是大模型的 DNA。如果 DNA 有毒，模型不会更好——它会更'聪明'地传播毒性。"*

---

## 19.1 训练数据中的隐私风险

### 模型记忆化

大模型会"记住"训练数据中的内容，在特定提示下完整输出这些内容。

**记忆化的条件：**
- 数据在训练集中重复出现次数多
- 数据的模式独特（如特定格式的个人信息）
- 模型越大，记忆能力越强

**实际案例：**
- 研究表明，GPT-2 能在特定 prompt 下输出训练数据中的完整邮件地址和电话号码
- 更大的模型（如 GPT-3 级别）记忆化更严重

### PII 泄露的防范

```python
"""
训练数据中的 PII 检测与处理
"""

import re
from typing import List, Tuple

class PIIDetector:
    """
    多语言 PII 检测器
    """
    def __init__(self):
        self.patterns = {
            # 中文 PII
            "cn_phone": r'1[3-9]\d{9}',
            "cn_id_card": r'[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]',
            "cn_bank_card": r'[1-9]\d{15,18}',

            # 通用 PII
            "email": r'[\w.+-]+@[\w-]+\.[\w.]+',
            "ip_address": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
            "url_with_params": r'https?://\S+[?&]\S*(?:token|key|password|secret)\S*',
        }

    def detect(self, text: str) -> List[dict]:
        """检测文本中的 PII"""
        findings = []
        for pii_type, pattern in self.patterns.items():
            for match in re.finditer(pattern, text):
                findings.append({
                    "type": pii_type,
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end(),
                })
        return findings

    def mask(self, text: str, strategy: str = "replace") -> str:
        """
        PII 处理策略
        - replace: 替换为占位符（如 [PHONE]）
        - hash: 替换为哈希值
        - redact: 完全删除
        """
        findings = self.detect(text)
        # 按位置逆序处理，避免位置偏移
        for f in sorted(findings, key=lambda x: x["start"], reverse=True):
            if strategy == "replace":
                placeholder = f"[{f['type'].upper()}]"
            elif strategy == "hash":
                import hashlib
                placeholder = hashlib.sha256(f["value"].encode()).hexdigest()[:8]
            else:  # redact
                placeholder = ""

            text = text[:f["start"]] + placeholder + text[f["end"]:]
        return text
```

### 差分隐私在数据处理中的应用

差分隐私（Differential Privacy, DP）可以在数据层面提供数学上可证明的隐私保护：

```
DP 在 LLM 训练中的应用场景：

1. DP-SGD：在训练时给梯度加噪声
   → 效果：模型无法记住单条数据
   → 代价：模型质量下降（隐私-效用权衡）
   → 适用：对隐私要求极高的场景（医疗、金融）

2. 数据层面的 DP：在数据预处理时匿名化
   → 效果：去除可识别信息
   → 代价：可能损失有价值的上下文
   → 适用：大多数场景
```

---

## 19.2 数据版权与合规

### 各地法律现状（截至 2026 年初）

| 地区 | 法律框架 | 对 AI 训练数据的态度 | 关键要求 |
|------|---------|-------------------|---------|
| 美国 | Fair Use 原则 | 尚未明确 | NYT vs OpenAI 案待审 |
| 欧盟 | EU AI Act | 严格限制 | 透明度报告、opt-out 机制 |
| 中国 | 生成式 AI 管理办法 | 合规要求明确 | 数据来源合法、内容审查 |
| 日本 | 著作权法修正 | 相对宽松 | 非营利性使用更自由 |

### 合规实操

```
数据合规 Checklist：

□ 数据来源有明确的许可证
□ 遵守 robots.txt 规则
□ 建立 opt-out 机制
□ 记录数据溯源（provenance）
□ PII 已检测和处理
□ 敏感内容已过滤
□ 数据存储有访问控制
□ 保留审计日志
```

---

## 19.3 偏见与公平性

### 训练数据中的系统性偏见

互联网数据天然携带偏见：
- **人口统计偏见**：某些群体的数据过多或过少
- **语言偏见**：英语内容占绝对主导
- **地理偏见**：发达国家视角主导
- **时间偏见**：近期事件权重过大

### 偏见检测

```python
def detect_demographic_bias(
    dataset: list,        # 数据集
    protected_terms: dict, # {"gender": ["male", "female", ...], ...}
    sample_size: int = 10000,
) -> dict:
    """
    检测数据集中的人口统计偏见
    """
    import random
    sample = random.sample(dataset, min(sample_size, len(dataset)))

    results = {}
    for dimension, terms in protected_terms.items():
        counts = {term: 0 for term in terms}
        for doc in sample:
            doc_lower = doc.lower()
            for term in terms:
                if term in doc_lower:
                    counts[term] += 1

        total = sum(counts.values())
        distribution = {term: count / max(total, 1) for term, count in counts.items()}
        results[dimension] = {
            "distribution": distribution,
            "max_ratio": max(distribution.values()) / max(min(distribution.values()), 0.001),
            "is_balanced": max(distribution.values()) / max(min(distribution.values()), 0.001) < 3,
        }
    return results
```

---

## 19.4 数据安全

### 数据下毒攻击

```
数据下毒的风险：

1. 后门攻击：在训练数据中注入特定触发模式
   → 当用户输入包含触发词时，模型产生恶意输出
   
2. 偏见注入：系统性地在数据中注入偏见内容
   → 模型在特定话题上产生有偏见的输出

防御措施：
  - 数据来源追踪和验证
  - 异常检测（统计偏离正常的数据批次）
  - 多来源交叉验证
  - 定期安全评估
```

---

## 动手环节：构建数据安全与合规审计工具

**目标**：基于本章的 `PIIDetector` 和 `detect_demographic_bias()` 代码，构建实用的数据安全审计工具链，体验隐私保护和偏见检测在真实管线中的工作方式。

### 练习 1：增强版 PII 检测与风险评估

本章的 `PIIDetector` 覆盖了手机号、身份证、邮箱等模式。但真实场景中，PII 远比正则能匹配的复杂——地址、姓名+单位的组合、上下文隐含的身份信息都需要处理。

```python
"""
练习 1：增强版 PII 检测器 + 风险评估报告
扩展本章的 PIIDetector，增加上下文 PII 检测和风险评分。
"""

import re
from collections import Counter

# ============================================================
# 第一步：扩展检测模式
# ============================================================

PATTERNS = {
    # 本章已有的模式
    "cn_phone":    r'1[3-9]\d{9}',
    "cn_id_card":  r'[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]',
    "email":       r'[\w.+-]+@[\w-]+\.[\w.]+',
    "ip_address":  r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',

    # 新增：更多 PII 类型
    "cn_address":  r'[\u4e00-\u9fa5]{2,5}(?:省|市|区|县|镇|街道|路|号|栋|单元|室)',
    "cn_name_title": r'(?:先生|女士|同学|老师|教授|医生|律师)[\u4e00-\u9fa5]{2,4}|[\u4e00-\u9fa5]{2,4}(?:先生|女士|同学|老师|教授|医生|律师)',
    "bank_card":   r'\b(?:62|4|5)\d{14,18}\b',
    "url_secret":  r'https?://\S+[?&]\S*(?:token|key|password|secret|api_key)\S*',
    "date_of_birth": r'(?:出生|生日|生于)\D{0,3}(?:19|20)\d{2}\D?\d{1,2}\D?\d{1,2}',
}

# 每种 PII 的风险等级（1-5）和推荐处理策略
RISK_LEVELS = {
    "cn_id_card":    {"level": 5, "strategy": "hash",    "reason": "身份证号可唯一定位个人"},
    "bank_card":     {"level": 5, "strategy": "redact",  "reason": "银行卡号涉及财务安全"},
    "cn_phone":      {"level": 4, "strategy": "replace", "reason": "手机号可定位个人"},
    "email":         {"level": 3, "strategy": "replace", "reason": "邮箱可追溯身份"},
    "cn_address":    {"level": 3, "strategy": "replace", "reason": "详细地址可定位住所"},
    "cn_name_title": {"level": 3, "strategy": "replace", "reason": "姓名+称谓组合可识别个人"},
    "date_of_birth": {"level": 3, "strategy": "replace", "reason": "出生日期是准标识符"},
    "ip_address":    {"level": 2, "strategy": "replace", "reason": "IP 可追溯网络位置"},
    "url_secret":    {"level": 4, "strategy": "redact",  "reason": "URL 含密钥可导致泄露"},
}


def detect_all_pii(text: str) -> list[dict]:
    """检测文本中的所有 PII"""
    findings = []
    for pii_type, pattern in PATTERNS.items():
        for match in re.finditer(pattern, text):
            risk = RISK_LEVELS.get(pii_type, {"level": 2, "strategy": "replace", "reason": "未知类型"})
            findings.append({
                "type": pii_type,
                "value": match.group(),
                "position": (match.start(), match.end()),
                "risk_level": risk["level"],
                "strategy": risk["strategy"],
                "reason": risk["reason"],
            })
    return findings


# ============================================================
# 第二步：上下文 PII 检测（超越正则）
# ============================================================

CONTEXT_PATTERNS = [
    # "我叫 XXX，在 YYY 工作" 这类句式暴露了姓名+单位
    (r'我叫([\u4e00-\u9fa5]{2,4}).*?在([\u4e00-\u9fa5]{2,10}(?:公司|集团|大学|医院|银行))(?:工作|上班|任职)',
     "name_org_combo", 4, "姓名+单位组合可高度定位个人"),
    # "家住 XXX" 暴露了住址
    (r'(?:家住|住在|地址[是为]?)([\u4e00-\u9fa5]{5,30})',
     "home_address", 4, "家庭住址属于敏感 PII"),
]

def detect_context_pii(text: str) -> list[dict]:
    """基于上下文模式检测隐含 PII"""
    findings = []
    for pattern, pii_type, level, reason in CONTEXT_PATTERNS:
        for match in re.finditer(pattern, text):
            findings.append({
                "type": f"context_{pii_type}",
                "value": match.group(),
                "position": (match.start(), match.end()),
                "risk_level": level,
                "strategy": "replace",
                "reason": reason,
            })
    return findings


# ============================================================
# 第三步：生成风险评估报告
# ============================================================

def generate_risk_report(documents: list[str]) -> str:
    """对一批文档生成 PII 风险评估报告"""
    all_findings = []
    doc_stats = []

    for i, doc in enumerate(documents):
        regex_pii = detect_all_pii(doc)
        context_pii = detect_context_pii(doc)
        combined = regex_pii + context_pii
        all_findings.extend(combined)
        doc_stats.append({
            "doc_id": i,
            "pii_count": len(combined),
            "max_risk": max((f["risk_level"] for f in combined), default=0),
            "preview": doc[:60].replace("\n", " ") + "...",
        })

    # 统计
    type_counter = Counter(f["type"] for f in all_findings)
    risk_dist = Counter(f["risk_level"] for f in all_findings)
    high_risk_docs = [d for d in doc_stats if d["max_risk"] >= 4]

    report = []
    report.append("=" * 60)
    report.append("         PII 风险评估报告")
    report.append("=" * 60)
    report.append(f"\n扫描文档数：{len(documents)}")
    report.append(f"发现 PII 总数：{len(all_findings)}")
    report.append(f"含 PII 文档数：{sum(1 for d in doc_stats if d['pii_count'] > 0)}")
    report.append(f"高风险文档数（≥4级）：{len(high_risk_docs)}")

    report.append(f"\n--- PII 类型分布 ---")
    for pii_type, count in type_counter.most_common():
        risk = RISK_LEVELS.get(pii_type, {"level": 2})
        report.append(f"  {pii_type:20s}  ×{count:3d}  风险等级={risk['level']}")

    report.append(f"\n--- 风险等级分布 ---")
    for level in sorted(risk_dist.keys(), reverse=True):
        bar = "█" * risk_dist[level]
        report.append(f"  Level {level}: {bar} ({risk_dist[level]})")

    if high_risk_docs:
        report.append(f"\n--- 高风险文档（需优先处理）---")
        for d in high_risk_docs[:5]:
            report.append(f"  Doc#{d['doc_id']}: {d['pii_count']} PII, "
                          f"max_risk={d['max_risk']}, {d['preview']}")

    report.append("\n--- 处理建议 ---")
    report.append("  Level 5（身份证/银行卡）：必须哈希或删除，不可保留明文")
    report.append("  Level 4（手机号/密钥/姓名单位）：替换为占位符")
    report.append("  Level 3（邮箱/地址/生日）：替换为占位符")
    report.append("  Level ≤2（IP 等）：替换为占位符或按需保留")

    return "\n".join(report)


# ============================================================
# 测试
# ============================================================

test_docs = [
    "我叫张三丰，在腾讯公司工作，手机号是13800138000，邮箱zhangsan@example.com",
    "患者李女士，身份证号 110101199001011234，家住北京市海淀区中关村南大街5号3栋2单元",
    "服务器日志：用户从 192.168.1.100 访问了 https://api.example.com/v1?api_key=sk_live_abc123",
    "今天天气真好，适合出去走走。",
    "出生1990年3月15日，银行卡号 6222021234567890123",
]

print(generate_risk_report(test_docs))
```

**思考**：
- 正则只能捕获格式化的 PII，上下文 PII 是更大的挑战——在生产中通常需要 NER 模型辅助
- 为什么风险评分很重要？因为它决定了处理优先级：不是所有 PII 都需要同等对待

---

### 练习 2：偏见审计与修复模拟

本章给出了 `detect_demographic_bias()` 函数。但检测只是第一步——我们还需要知道偏见严重到什么程度、在哪些维度上最突出，以及如何修复。

```python
"""
练习 2：偏见审计仪表盘
检测 → 量化 → 诊断 → 模拟修复
"""

import random
from collections import Counter

random.seed(42)

# ============================================================
# 第一步：生成一个有偏见的模拟数据集
# ============================================================

# 模拟互联网抓取数据的偏见分布
BIAS_CONFIG = {
    "gender": {
        "他|男性|先生|爸爸|丈夫": 0.65,    # 男性提及占 65%
        "她|女性|女士|妈妈|妻子": 0.30,    # 女性提及占 30%
        "他们|其他":            0.05,    # 其他占 5%
    },
    "occupation": {
        "工程师|程序员|开发者": 0.40,
        "医生|护士|教师":     0.30,
        "清洁工|保安|快递员":  0.10,
        "企业家|总裁|CEO":    0.20,
    },
    "region": {
        "北京|上海|深圳":    0.55,      # 一线城市过度代表
        "成都|武汉|杭州":    0.25,
        "县城|农村|乡镇":    0.10,
        "海外|国际":        0.10,
    },
}

def generate_biased_dataset(n: int = 5000) -> list[str]:
    """根据偏见配置生成模拟数据集"""
    templates = [
        "{person}是一名{job}，在{place}工作。",
        "来自{place}的{person}，职业是{job}。",
        "{person}每天在{place}忙碌，作为{job}非常敬业。",
        "一位来自{place}的{job}，{person}对未来充满期待。",
    ]
    docs = []
    for _ in range(n):
        # 按偏见概率采样
        person = _weighted_sample(BIAS_CONFIG["gender"])
        job = _weighted_sample(BIAS_CONFIG["occupation"])
        place = _weighted_sample(BIAS_CONFIG["region"])
        template = random.choice(templates)
        # 从关键词组中随机选一个具体词
        person_word = random.choice(person.split("|"))
        job_word = random.choice(job.split("|"))
        place_word = random.choice(place.split("|"))
        docs.append(template.format(person=person_word, job=job_word, place=place_word))
    return docs

def _weighted_sample(config: dict) -> str:
    """按权重采样"""
    items = list(config.keys())
    weights = list(config.values())
    return random.choices(items, weights=weights, k=1)[0]


# ============================================================
# 第二步：偏见检测（扩展本章的函数）
# ============================================================

def bias_audit(dataset: list[str], dimensions: dict[str, list[str]]) -> dict:
    """
    多维度偏见审计
    dimensions: {"gender": ["他","她","他们"], "region": ["北京","农村",...], ...}
    返回每个维度的分布、不平衡比率和严重程度
    """
    results = {}
    for dim_name, terms in dimensions.items():
        counts = Counter()
        for doc in dataset:
            for term in terms:
                if term in doc:
                    counts[term] += 1

        total = sum(counts.values()) or 1
        distribution = {t: counts[t] / total for t in terms}

        # 不平衡比率 = 最高频 / 最低频
        freqs = [v for v in distribution.values() if v > 0]
        imbalance = max(freqs) / min(freqs) if len(freqs) > 1 and min(freqs) > 0 else float('inf')

        # 严重程度
        if imbalance < 2:
            severity = "✅ 轻微"
        elif imbalance < 5:
            severity = "⚠️ 中等"
        else:
            severity = "🚨 严重"

        results[dim_name] = {
            "distribution": distribution,
            "imbalance_ratio": round(imbalance, 2),
            "severity": severity,
            "top_term": max(distribution, key=distribution.get),
            "bottom_term": min((t for t in distribution if distribution[t] > 0),
                               key=lambda t: distribution[t], default="N/A"),
        }
    return results


# ============================================================
# 第三步：偏见修复（上采样 + 下采样模拟）
# ============================================================

def repair_bias(dataset: list[str], target_term: str,
                boost_terms: list[str], ratio: float = 1.5) -> list[str]:
    """
    简单修复策略：上采样不足群体
    - 找出包含 boost_terms 的文档
    - 复制 ratio 倍加入数据集
    - 这是最朴素的方法，生产中应使用更精细的策略
    """
    boost_docs = [doc for doc in dataset if any(t in doc for t in boost_terms)]
    extra = boost_docs * int(ratio)
    return dataset + extra


# ============================================================
# 运行审计
# ============================================================

dataset = generate_biased_dataset(5000)

audit_dimensions = {
    "gender": ["他", "她", "他们"],
    "region": ["北京", "上海", "深圳", "成都", "武汉", "县城", "农村"],
    "occupation": ["工程师", "程序员", "医生", "护士", "清洁工", "保安", "企业家", "CEO"],
}

print("=" * 55)
print("       偏见审计报告（修复前）")
print("=" * 55)
before = bias_audit(dataset, audit_dimensions)
for dim, info in before.items():
    print(f"\n【{dim}】不平衡比率 = {info['imbalance_ratio']}  {info['severity']}")
    print(f"  最高频: {info['top_term']}  最低频: {info['bottom_term']}")
    for term, freq in sorted(info["distribution"].items(), key=lambda x: -x[1]):
        bar = "█" * int(freq * 40)
        print(f"    {term:6s}  {bar} {freq:.1%}")

# 修复：上采样女性和农村相关文档
repaired = repair_bias(dataset, "她", ["她", "女性", "女士", "妈妈", "妻子"], ratio=1.2)
repaired = repair_bias(repaired, "农村", ["农村", "县城", "乡镇"], ratio=2.0)

print("\n" + "=" * 55)
print("       偏见审计报告（修复后）")
print("=" * 55)
after = bias_audit(repaired, audit_dimensions)
for dim, info in after.items():
    print(f"\n【{dim}】不平衡比率 = {info['imbalance_ratio']}  {info['severity']}")
    delta = before[dim]["imbalance_ratio"] - info["imbalance_ratio"]
    if delta > 0:
        print(f"  ↓ 改善了 {delta:.2f}")
    for term, freq in sorted(info["distribution"].items(), key=lambda x: -x[1]):
        bar = "█" * int(freq * 40)
        print(f"    {term:6s}  {bar} {freq:.1%}")
```

**思考**：
- 上采样是最简单的修复手段，但会引入重复——在第四章我们讨论过去重的重要性，这里是相互矛盾的（减少偏见 vs 避免重复），实际需要权衡
- 更好的方法是生成合成数据来补充不足群体的表示（参考第十七章）
- 偏见没有"绝对的零点"——重要的是有意识地检测和记录，而不是追求完美平衡

---

### 练习 3：设计一份数据合规自查报告模板

**场景**：你正在为一个 7B 参数的中文通用大模型准备预训练数据。数据来源包括 Common Crawl 中文子集、GitHub 公开代码、中文维基百科、内部采购的新闻数据，以及少量自建语料。

**任务**：

1. **合规矩阵**：为每个数据来源填写以下信息：
   - 数据来源名称
   - 许可证类型（CC-BY / Apache / 自定义 / 无明确许可 / 商业采购）
   - 是否遵守 robots.txt
   - PII 处理策略（哈希 / 替换 / 删除 / 未处理）
   - 数据溯源是否可追踪
   - 适用的法律法规（中国《生成式 AI 管理办法》/EU AI Act / 其他）
   - 风险等级（高 / 中 / 低）

2. **PII 处理策略选择**：对比本章提到的三种策略（替换、哈希、删除），回答：
   - 如果下游任务包含信息抽取（IE），应该选哪种策略？为什么？
   - 如果需要在审计时还原原始数据，应该选哪种？
   - 哪种策略对模型训练质量影响最小？

3. **数据安全 Checklist 升级**：将本章的 Checklist 升级为分级版本：
   - **P0（必须满足）**：不满足则不能进入训练管线
   - **P1（应该满足）**：不满足需要负责人审批
   - **P2（建议满足）**：作为最佳实践

提示：参考本章 19.2 节的合规 Checklist 和 19.4 节的安全防御措施来设计。

---

> **本章要点回顾**
>
> 1. **模型记忆化是真实风险**——大模型会在特定 prompt 下输出训练数据
> 2. **PII 检测和处理是基本要求**——替换/哈希/删除三种策略
> 3. **数据合规是法律义务**——各地法律要求不同但趋势趋严
> 4. **偏见检测应该是数据管线的标配**——不是可选项
> 5. **数据下毒攻击需要在数据管线层面防御**

