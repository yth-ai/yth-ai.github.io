# 第 19 章：数据安全、隐私与伦理

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

## 本章要点回顾

1. **模型记忆化是真实风险**——大模型会在特定 prompt 下输出训练数据
2. **PII 检测和处理是基本要求**——替换/哈希/删除三种策略
3. **数据合规是法律义务**——各地法律要求不同但趋势趋严
4. **偏见检测应该是数据管线的标配**——不是可选项
5. **数据下毒攻击需要在数据管线层面防御**
