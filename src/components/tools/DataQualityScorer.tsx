import { useState, useCallback, useMemo } from 'react';

// ============================================================
// Data Quality Scorer for Pre-training
// ============================================================

interface QualityMetrics {
  overallScore: number;
  textStats: {
    charCount: number;
    wordCount: number;
    sentenceCount: number;
    avgSentenceLen: number;
    avgWordLen: number;
    paragraphCount: number;
  };
  lexicalDiversity: {
    uniqueWordRatio: number;
    hapaxRatio: number; // words appearing only once
    topWords: [string, number][];
  };
  repetition: {
    lineRepeatRate: number;
    ngramRepeatRate: number;
    duplicateLines: number;
  };
  language: {
    detectedLang: string;
    confidence: number;
    cjkRatio: number;
    asciiRatio: number;
    punctuationRatio: number;
  };
  quality: {
    hasTitle: boolean;
    hasStructure: boolean;
    bulletPointRatio: number;
    codeBlockRatio: number;
    urlDensity: number;
    specialCharRatio: number;
    allCapsRatio: number;
  };
  warnings: string[];
  suggestions: string[];
}

function analyzeText(text: string): QualityMetrics {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic stats
  const chars = text.length;
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const sentences = text.split(/[.!?。！？\n]+/).filter(s => s.trim().length > 0);
  const words = text.split(/[\s\n]+/).filter(w => w.length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Lexical diversity
  const wordLower = words.map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
  const wordFreq = new Map<string, number>();
  for (const w of wordLower) {
    if (w) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }
  const uniqueWords = wordFreq.size;
  const hapaxWords = [...wordFreq.values()].filter(c => c === 1).length;
  const topWords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) as [string, number][];

  // Repetition
  const lineSet = new Set<string>();
  let dupLines = 0;
  for (const line of nonEmptyLines) {
    const normalized = line.trim().toLowerCase();
    if (lineSet.has(normalized)) dupLines++;
    lineSet.add(normalized);
  }

  // N-gram repetition (4-gram)
  const ngrams = new Map<string, number>();
  for (let i = 0; i <= wordLower.length - 4; i++) {
    const gram = wordLower.slice(i, i + 4).join(' ');
    ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
  }
  const repeatedNgrams = [...ngrams.values()].filter(c => c > 2).length;
  const ngramRepeatRate = ngrams.size > 0 ? repeatedNgrams / ngrams.size : 0;

  // Language detection
  let cjkCount = 0;
  let asciiCount = 0;
  let punctCount = 0;
  let upperCount = 0;
  let letterCount = 0;

  for (const char of text) {
    const code = char.codePointAt(0) || 0;
    if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0x3000 && code <= 0x303F) || (code >= 0xFF00 && code <= 0xFFEF)) {
      cjkCount++;
    }
    if (code >= 0x20 && code <= 0x7E) asciiCount++;
    if (/[\p{P}]/u.test(char)) punctCount++;
    if (/[A-Z]/.test(char)) upperCount++;
    if (/[\p{L}]/u.test(char)) letterCount++;
  }

  const cjkRatio = chars > 0 ? cjkCount / chars : 0;
  const asciiRatio = chars > 0 ? asciiCount / chars : 0;
  const detectedLang = cjkRatio > 0.3 ? '中文' : asciiRatio > 0.5 ? '英文' : '混合';
  const langConfidence = Math.max(cjkRatio, asciiRatio);

  // Quality signals
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern) || [];
  const urlDensity = urls.length / Math.max(sentences.length, 1);

  const specialChars = text.replace(/[\p{L}\p{N}\s\p{P}]/gu, '');
  const specialCharRatio = specialChars.length / Math.max(chars, 1);

  const allCapsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  const allCapsRatio = allCapsWords.length / Math.max(words.length, 1);

  const hasTitle = /^#|^[\p{L}].{0,100}$/mu.test(text.trim().split('\n')[0] || '');
  const bulletLines = nonEmptyLines.filter(l => /^\s*[-*•]\s/.test(l));
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
  const hasStructure = paragraphs.length > 1 || bulletLines.length > 0 || codeBlocks > 0;

  // Scoring
  let score = 50; // Base

  // Length scoring (prefer 200-50000 chars)
  if (chars < 50) { score -= 30; warnings.push('文本过短（<50字符），不适合作为训练数据'); }
  else if (chars < 200) { score -= 10; warnings.push('文本较短（<200字符），信息量有限'); }
  else if (chars > 200000) { score -= 10; warnings.push('文本过长（>200K字符），建议拆分'); }
  else { score += 10; }

  // Lexical diversity
  const uniqueRatio = uniqueWords / Math.max(words.length, 1);
  if (uniqueRatio > 0.5) score += 10;
  else if (uniqueRatio < 0.2) { score -= 15; warnings.push('词汇多样性极低，可能是重复内容'); }
  else if (uniqueRatio < 0.3) { score -= 5; warnings.push('词汇多样性偏低'); }

  // Repetition
  const lineRepeatRate = nonEmptyLines.length > 0 ? dupLines / nonEmptyLines.length : 0;
  if (lineRepeatRate > 0.3) { score -= 20; warnings.push('重复行比例过高 (>' + (lineRepeatRate * 100).toFixed(0) + '%)'); }
  else if (lineRepeatRate > 0.1) { score -= 10; warnings.push('存在部分重复行'); }
  else { score += 5; }

  if (ngramRepeatRate > 0.2) { score -= 10; warnings.push('4-gram 重复率偏高'); }
  else { score += 5; }

  // Structure
  if (hasStructure) { score += 5; }
  if (hasTitle) { score += 3; }
  if (sentences.length > 3) { score += 5; }

  // Red flags
  if (urlDensity > 0.3) { score -= 10; warnings.push('URL 密度过高，可能是导航/链接页面'); }
  if (specialCharRatio > 0.1) { score -= 10; warnings.push('特殊字符比例过高'); }
  if (allCapsRatio > 0.2) { score -= 5; warnings.push('全大写词比例偏高'); }
  if (punctCount / Math.max(chars, 1) > 0.3) { score -= 10; warnings.push('标点符号密度异常高'); }

  // Suggestions
  if (score < 60) suggestions.push('建议对此文本进行进一步清洗后再用于训练');
  if (lineRepeatRate > 0.1) suggestions.push('建议去除重复行');
  if (urlDensity > 0.1) suggestions.push('建议去除或替换 URL');
  if (specialCharRatio > 0.05) suggestions.push('建议清理特殊字符（如乱码、控制字符）');
  if (chars > 100000) suggestions.push('建议按段落或章节拆分为多个样本');
  if (uniqueRatio > 0.4 && sentences.length > 5 && warnings.length === 0) {
    suggestions.push('文本质量良好，适合作为预训练数据');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    overallScore: score,
    textStats: {
      charCount: chars,
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgSentenceLen: sentences.length > 0 ? words.length / sentences.length : 0,
      avgWordLen: words.length > 0 ? words.reduce((a, w) => a + w.length, 0) / words.length : 0,
      paragraphCount: paragraphs.length,
    },
    lexicalDiversity: {
      uniqueWordRatio: uniqueRatio,
      hapaxRatio: uniqueWords > 0 ? hapaxWords / uniqueWords : 0,
      topWords,
    },
    repetition: {
      lineRepeatRate,
      ngramRepeatRate,
      duplicateLines: dupLines,
    },
    language: {
      detectedLang,
      confidence: langConfidence,
      cjkRatio,
      asciiRatio,
      punctuationRatio: punctCount / Math.max(chars, 1),
    },
    quality: {
      hasTitle,
      hasStructure,
      bulletPointRatio: bulletLines.length / Math.max(nonEmptyLines.length, 1),
      codeBlockRatio: codeBlocks / Math.max(paragraphs.length, 1),
      urlDensity,
      specialCharRatio,
      allCapsRatio,
    },
    warnings,
    suggestions,
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优质';
  if (score >= 60) return '可用';
  if (score >= 40) return '需清洗';
  return '低质';
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-yellow-500 to-amber-500';
  if (score >= 40) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-rose-500';
}

const SAMPLE_TEXTS: Record<string, { label: string; text: string }> = {
  good: {
    label: '优质示例',
    text: `# Transformer 架构详解

Transformer 是 2017 年由 Vaswani 等人在论文 "Attention Is All You Need" 中提出的深度学习架构。它完全基于注意力机制，摒弃了传统的循环和卷积结构，在自然语言处理领域取得了革命性的突破。

## 核心组件

Transformer 的核心是自注意力机制（Self-Attention），它允许模型在处理序列中的每个位置时，都能够关注到序列中的所有其他位置。这种机制通过三个线性变换（Query、Key、Value）来实现。

注意力计算公式为：Attention(Q, K, V) = softmax(QK^T / √d_k)V

其中 d_k 是 Key 向量的维度，除以 √d_k 是为了防止点积值过大导致 softmax 函数进入梯度饱和区域。

## 多头注意力

多头注意力（Multi-Head Attention）将注意力计算拆分为多个"头"，每个头独立学习不同的注意力模式。这使得模型能够同时关注来自不同表示子空间的信息。

实践中，常用的头数为 8 或 16，每个头的维度为 d_model / h。`
  },
  poor: {
    label: '低质示例',
    text: `Click here for more info >>> http://example.com/deals
BUY NOW!!! BEST PRICES GUARANTEED!!!
http://example.com/product1
http://example.com/product2
http://example.com/product3

Click here for more info >>> http://example.com/deals
BUY NOW!!! BEST PRICES GUARANTEED!!!

$$$ AMAZING DEALS $$$
!!! DON'T MISS OUT !!!
### FREE SHIPPING ###

Contact us: spam@example.com
Click here for more info >>> http://example.com/deals
BUY NOW!!! BEST PRICES GUARANTEED!!!`
  },
  code: {
    label: '代码示例',
    text: `import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.1):
        super().__init__()
        assert d_model % num_heads == 0
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        
        Q = self.W_q(query).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_k ** 0.5)
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attn = torch.softmax(scores, dim=-1)
        attn = self.dropout(attn)
        
        output = torch.matmul(attn, V)
        output = output.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        
        return self.W_o(output)`
  },
};

export default function DataQualityScorer() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const metrics = useMemo(() => {
    if (!text.trim()) return null;
    return analyzeText(text);
  }, [text]);

  const loadSample = useCallback((key: string) => {
    setText(SAMPLE_TEXTS[key]?.text || '');
  }, []);

  return (
    <div className="space-y-6">
      {/* Sample buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">快速示例:</span>
        {Object.entries(SAMPLE_TEXTS).map(([key, sample]) => (
          <button
            key={key}
            onClick={() => loadSample(key)}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {sample.label}
          </button>
        ))}
        <button
          onClick={() => setText('')}
          className="ml-auto px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          清空
        </button>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">输入文本</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴一段文本，实时分析其作为预训练数据的质量..."
          className="w-full h-48 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          spellCheck={false}
        />
      </div>

      {metrics && (
        <>
          {/* Overall Score */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getScoreGradient(metrics.overallScore)} p-6 text-white`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-6">
              <div className="text-center">
                <div className="text-6xl font-extrabold">{metrics.overallScore}</div>
                <div className="text-sm font-medium opacity-80 mt-1">{getScoreLabel(metrics.overallScore)}</div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold mb-2">数据质量评分</div>
                <div className="text-sm opacity-80">
                  {metrics.language.detectedLang}文本 · {metrics.textStats.charCount.toLocaleString()} 字符 · {metrics.textStats.sentenceCount} 句
                </div>
                {metrics.suggestions.length > 0 && (
                  <div className="text-sm opacity-90 mt-2">{metrics.suggestions[0]}</div>
                )}
              </div>
            </div>
          </div>

          {/* Warnings & Suggestions */}
          {metrics.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">质量警告</h3>
              <ul className="space-y-1">
                {metrics.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Text Statistics */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">文本统计</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '字符数', value: metrics.textStats.charCount.toLocaleString() },
                  { label: '词数', value: metrics.textStats.wordCount.toLocaleString() },
                  { label: '句数', value: metrics.textStats.sentenceCount },
                  { label: '段落数', value: metrics.textStats.paragraphCount },
                  { label: '平均句长', value: metrics.textStats.avgSentenceLen.toFixed(1) + ' 词' },
                  { label: '平均词长', value: metrics.textStats.avgWordLen.toFixed(1) + ' 字符' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{item.value}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lexical Diversity */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">词汇多样性</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">唯一词比例 (TTR)</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{(metrics.lexicalDiversity.uniqueWordRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${metrics.lexicalDiversity.uniqueWordRatio > 0.4 ? 'bg-green-500' : metrics.lexicalDiversity.uniqueWordRatio > 0.2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${metrics.lexicalDiversity.uniqueWordRatio * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">仅出现一次的词比例</span>
                    <span className="font-mono text-slate-900 dark:text-slate-100">{(metrics.lexicalDiversity.hapaxRatio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metrics.lexicalDiversity.hapaxRatio * 100}%` }} />
                  </div>
                </div>
                {metrics.lexicalDiversity.topWords.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">高频词 Top 10</div>
                    <div className="flex flex-wrap gap-1">
                      {metrics.lexicalDiversity.topWords.map(([word, count], i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                          {word} <span className="text-slate-400 dark:text-slate-500">×{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Repetition */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">重复度分析</h3>
              <div className="space-y-3">
                {[
                  {
                    label: '行级重复率',
                    value: metrics.repetition.lineRepeatRate,
                    detail: `${metrics.repetition.duplicateLines} 重复行`,
                    bad: 0.1,
                  },
                  {
                    label: '4-gram 重复率',
                    value: metrics.repetition.ngramRepeatRate,
                    detail: 'N-gram 重复模式检测',
                    bad: 0.15,
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{(item.value * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.value < item.bad ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(item.value * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Detection */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">语言特征</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-2xl">{metrics.language.detectedLang === '中文' ? '🇨🇳' : metrics.language.detectedLang === '英文' ? '🇬🇧' : '🌐'}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">检测语言: {metrics.language.detectedLang}</div>
                    <div className="text-xs text-slate-400">置信度: {(metrics.language.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{(metrics.language.cjkRatio * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">CJK 字符</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{(metrics.language.asciiRatio * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">ASCII</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{(metrics.language.punctuationRatio * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">标点</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!text && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400">粘贴文本查看质量分析</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">从词汇多样性、重复度、语言特征等维度评估训练数据质量</p>
        </div>
      )}
    </div>
  );
}
