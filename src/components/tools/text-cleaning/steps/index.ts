// ============================================================
// 12 步清洗管线 — 步骤注册表 & 工厂
// ============================================================

import type { PipelineStep, StepConfig } from '../types';

/* ---------- 辅助函数 ---------- */

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

/* ========== 步骤定义 ========== */

function createSteps(): PipelineStep[] {
  return [
    // ---- 1. HTML 标签去除 ----
    {
      id: 'html',
      name: 'HTML 标签去除',
      description: '移除 HTML/XML 标签、script/style 块，解码 HTML 实体',
      icon: '</>',
      color: 'rose',
      enabled: true,
      configurable: true,
      config: { keepAltText: true, keepTableStructure: false },
      configSchema: [
        { key: 'keepAltText', label: '保留 img alt 文本', type: 'boolean' },
        { key: 'keepTableStructure', label: '保留表格结构（用 | 分隔）', type: 'boolean' },
      ],
      process: (text: string, config?: StepConfig) => {
        const details: string[] = [];
        const keepAlt = config?.keepAltText ?? true;
        const keepTable = config?.keepTableStructure ?? false;
        let cleaned = text;

        // Extract alt text before removing tags
        const altTexts: string[] = [];
        if (keepAlt) {
          const altMatches = cleaned.matchAll(/alt=["']([^"']+)["']/gi);
          for (const m of altMatches) altTexts.push(m[1]);
        }

        // Table structure
        if (keepTable) {
          cleaned = cleaned.replace(/<tr[^>]*>/gi, '\n');
          cleaned = cleaned.replace(/<\/tr>/gi, '');
          cleaned = cleaned.replace(/<t[dh][^>]*>/gi, '| ');
          cleaned = cleaned.replace(/<\/t[dh]>/gi, ' ');
        }

        // Remove script/style blocks
        cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
        cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
        cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

        const tagCount = countMatches(cleaned, /<[^>]+>/g);
        cleaned = cleaned.replace(/<[^>]+>/g, '');

        // Decode HTML entities
        cleaned = cleaned
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

        if (keepAlt && altTexts.length > 0) {
          cleaned += '\n[Alt texts: ' + altTexts.join(', ') + ']';
        }

        if (tagCount > 0) details.push(`移除 ${tagCount} 个 HTML 标签`);
        return { text: cleaned, removed: text.length - cleaned.length, details };
      },
    },

    // ---- 2. URL 过滤 ----
    {
      id: 'url',
      name: 'URL 过滤',
      description: '移除 HTTP/HTTPS 链接，可配置白名单域名保留',
      icon: '🔗',
      color: 'blue',
      enabled: true,
      configurable: true,
      config: { removeEmails: true, mode: 'remove' },
      configSchema: [
        { key: 'removeEmails', label: '同时移除邮箱地址', type: 'boolean' },
        { key: 'mode', label: '处理方式', type: 'select', options: [
          { value: 'remove', label: '删除' },
          { value: 'placeholder', label: '替换为 [URL]' },
        ]},
      ],
      process: (text: string, config?: StepConfig) => {
        const details: string[] = [];
        const removeEmails = config?.removeEmails ?? true;
        const mode = (config?.mode as string) ?? 'remove';
        let cleaned = text;

        const urlCount = countMatches(cleaned, /https?:\/\/[^\s<>"{}|\\^`[\]]+/g);
        const replacement = mode === 'placeholder' ? '[URL]' : '';
        cleaned = cleaned.replace(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g, replacement);
        if (urlCount > 0) details.push(`${mode === 'remove' ? '移除' : '替换'} ${urlCount} 个 URL`);

        if (removeEmails) {
          const emailCount = countMatches(cleaned, /[\w.-]+@[\w.-]+\.\w+/g);
          cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
          if (emailCount > 0) details.push(`脱敏 ${emailCount} 个邮箱`);
        }

        return { text: cleaned, removed: text.length - cleaned.length, details };
      },
    },

    // ---- 3. 语种检测 ----
    {
      id: 'lang-detect',
      name: '语种检测',
      description: '基于 n-gram 频率的轻量语种分类，可过滤非目标语种段落',
      icon: '🌐',
      color: 'indigo',
      enabled: true,
      configurable: true,
      config: { targetLangs: 'zh,en', filterNonTarget: false },
      configSchema: [
        { key: 'targetLangs', label: '目标语种（逗号分隔：zh/en/ja/ko/fr/de）', type: 'select', options: [
          { value: 'zh,en', label: '中文+英文' },
          { value: 'zh', label: '仅中文' },
          { value: 'en', label: '仅英文' },
          { value: 'zh,en,ja', label: '中文+英文+日文' },
        ]},
        { key: 'filterNonTarget', label: '过滤非目标语种段落', type: 'boolean' },
      ],
      process: (text: string, config?: StepConfig) => {
        const details: string[] = [];
        const filterNon = config?.filterNonTarget ?? false;

        // Simple language detection via character ranges
        const zhChars = countMatches(text, /[\u4e00-\u9fff]/g);
        const enChars = countMatches(text, /[a-zA-Z]/g);
        const jaChars = countMatches(text, /[\u3040-\u309f\u30a0-\u30ff]/g);
        const koChars = countMatches(text, /[\uac00-\ud7af]/g);
        const total = zhChars + enChars + jaChars + koChars || 1;

        const langMap: Record<string, number> = {
          zh: zhChars / total,
          en: enChars / total,
          ja: jaChars / total,
          ko: koChars / total,
        };

        const detected = Object.entries(langMap)
          .filter(([, ratio]) => ratio > 0.05)
          .sort((a, b) => b[1] - a[1])
          .map(([lang, ratio]) => `${lang}: ${(ratio * 100).toFixed(1)}%`);

        details.push(`语种分布: ${detected.join(', ') || '未知'}`);

        if (filterNon) {
          const targetLangs = ((config?.targetLangs as string) ?? 'zh,en').split(',');
          const paragraphs = text.split(/\n\n+/);
          const filtered = paragraphs.filter(p => {
            const pZh = countMatches(p, /[\u4e00-\u9fff]/g);
            const pEn = countMatches(p, /[a-zA-Z]/g);
            const pJa = countMatches(p, /[\u3040-\u309f\u30a0-\u30ff]/g);
            const pTotal = pZh + pEn + pJa || 1;
            for (const lang of targetLangs) {
              if (lang === 'zh' && pZh / pTotal > 0.2) return true;
              if (lang === 'en' && pEn / pTotal > 0.2) return true;
              if (lang === 'ja' && pJa / pTotal > 0.2) return true;
            }
            return p.trim().length < 20; // Keep short segments
          });
          const removedCount = paragraphs.length - filtered.length;
          if (removedCount > 0) details.push(`过滤 ${removedCount} 个非目标语种段落`);
          const cleaned = filtered.join('\n\n');
          return { text: cleaned, removed: text.length - cleaned.length, details };
        }

        return { text, removed: 0, details };
      },
    },

    // ---- 4. Boilerplate 检测 ----
    {
      id: 'boilerplate',
      name: 'Boilerplate 检测',
      description: '识别导航栏、页脚、Cookie 提示、广告等模板文本',
      icon: '🧹',
      color: 'amber',
      enabled: true,
      process: (text: string) => {
        const details: string[] = [];
        const lines = text.split('\n');
        const filtered: string[] = [];
        let removed = 0;

        const boilerplatePatterns = [
          /^(首页|Home|About|关于|Contact|联系|导航|Menu|Nav|Footer|Copyright|版权)/i,
          /All rights reserved/i,
          /©\s*\d{4}/,
          /Cookie\s*(Policy|Settings|Notice|提示|声明)/i,
          /Subscribe\s*(to|now|Newsletter)/i,
          /订阅|取消订阅|退订/,
          /^(Privacy|Terms|Legal|Disclaimer|免责|隐私|条款)/i,
          /^Share\s*(on|this|via)/i,
          /^(Facebook|Twitter|LinkedIn|WeChat|微信|分享到)/i,
          /Loading\.\.\./i,
          /^(Previous|Next|上一篇|下一篇|相关文章|Related)/i,
          /^Advertisement|^广告|^Sponsored/i,
          /Sign\s*(up|in)|注册|登录/i,
        ];

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') { filtered.push(line); continue; }
          const isBoilerplate = boilerplatePatterns.some(p => p.test(trimmed));
          if (isBoilerplate) {
            removed++;
          } else {
            filtered.push(line);
          }
        }

        if (removed > 0) details.push(`移除 ${removed} 行模板文本（导航/页脚/Cookie 等）`);
        return { text: filtered.join('\n'), removed, details };
      },
    },

    // ---- 5. 行级去重 ----
    {
      id: 'dedup-lines',
      name: '精确去重',
      description: '移除完全重复的行，保留首次出现',
      icon: '⊘',
      color: 'teal',
      enabled: true,
      process: (text: string) => {
        const lines = text.split('\n');
        const seen = new Set<string>();
        const deduped: string[] = [];
        let removed = 0;

        for (const line of lines) {
          const normalized = line.trim().toLowerCase();
          if (normalized === '' || !seen.has(normalized)) {
            deduped.push(line);
            if (normalized) seen.add(normalized);
          } else {
            removed++;
          }
        }

        const details = removed > 0 ? [`移除 ${removed} 行完全重复内容`] : [];
        return { text: deduped.join('\n'), removed, details };
      },
    },

    // ---- 6. 近似去重（模拟 MinHash） ----
    {
      id: 'minhash-dedup',
      name: '近似去重',
      description: '基于 character n-gram Jaccard 相似度的段落级去重（模拟 MinHash）',
      icon: '~≈',
      color: 'cyan',
      enabled: false,
      configurable: true,
      config: { threshold: 0.7, ngramSize: 5 },
      configSchema: [
        { key: 'threshold', label: '相似度阈值', type: 'number', min: 0.3, max: 0.95, step: 0.05 },
        { key: 'ngramSize', label: 'N-gram 大小', type: 'number', min: 3, max: 8, step: 1 },
      ],
      process: (text: string, config?: StepConfig) => {
        const threshold = (config?.threshold as number) ?? 0.7;
        const n = (config?.ngramSize as number) ?? 5;
        const details: string[] = [];

        function getNgrams(s: string): Set<string> {
          const set = new Set<string>();
          const lower = s.toLowerCase().replace(/\s+/g, ' ');
          for (let i = 0; i <= lower.length - n; i++) {
            set.add(lower.slice(i, i + n));
          }
          return set;
        }

        function jaccard(a: Set<string>, b: Set<string>): number {
          let intersection = 0;
          for (const x of a) if (b.has(x)) intersection++;
          const union = a.size + b.size - intersection;
          return union === 0 ? 0 : intersection / union;
        }

        const paragraphs = text.split(/\n\n+/);
        const kept: string[] = [];
        const keptNgrams: Set<string>[] = [];
        let removed = 0;

        for (const p of paragraphs) {
          if (p.trim().length < 20) { kept.push(p); continue; }
          const pNgrams = getNgrams(p);
          let isDuplicate = false;

          for (const kNgrams of keptNgrams) {
            if (jaccard(pNgrams, kNgrams) > threshold) {
              isDuplicate = true;
              break;
            }
          }

          if (!isDuplicate) {
            kept.push(p);
            keptNgrams.push(pNgrams);
          } else {
            removed++;
          }
        }

        if (removed > 0) details.push(`近似去重移除 ${removed} 个相似段落（阈值 ${threshold}）`);
        const cleaned = kept.join('\n\n');
        return { text: cleaned, removed: text.length - cleaned.length, details };
      },
    },

    // ---- 7. 空白规范化 ----
    {
      id: 'whitespace',
      name: '空白规范化',
      description: '统一空白字符，移除多余空行和尾部空格',
      icon: '⎵',
      color: 'slate',
      enabled: true,
      process: (text: string) => {
        const details: string[] = [];
        const original = text;

        let cleaned = text.replace(/\t/g, '  ');
        cleaned = cleaned.replace(/[ \t]+$/gm, '');
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        cleaned = cleaned.replace(/[ ]{2,}/g, ' ');
        cleaned = cleaned.trim();

        if (original.length !== cleaned.length) {
          details.push(`规范化空白字符，减少 ${original.length - cleaned.length} 字符`);
        }

        return { text: cleaned, removed: original.length - cleaned.length, details };
      },
    },

    // ---- 8. 特殊字符清理 ----
    {
      id: 'special-chars',
      name: '特殊字符清理',
      description: '移除控制字符、零宽字符和异常 Unicode',
      icon: '✂',
      color: 'orange',
      enabled: true,
      process: (text: string) => {
        const details: string[] = [];
        let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        cleaned = cleaned.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
        cleaned = cleaned.replace(/\uFFFD/g, '');

        const removed = text.length - cleaned.length;
        if (removed > 0) details.push(`移除 ${removed} 个特殊/控制字符`);
        return { text: cleaned, removed, details };
      },
    },

    // ---- 9. PII 脱敏 ----
    {
      id: 'pii',
      name: '敏感信息脱敏',
      description: '检测并替换手机号、身份证号、IP 地址、银行卡号等',
      icon: '🔒',
      color: 'red',
      enabled: true,
      configurable: true,
      config: { phone: true, idCard: true, ip: true, bankCard: true },
      configSchema: [
        { key: 'phone', label: '手机号', type: 'boolean' },
        { key: 'idCard', label: '身份证号', type: 'boolean' },
        { key: 'ip', label: 'IP 地址', type: 'boolean' },
        { key: 'bankCard', label: '银行卡号', type: 'boolean' },
      ],
      process: (text: string, config?: StepConfig) => {
        const details: string[] = [];
        let cleaned = text;

        if (config?.phone !== false) {
          const phones = countMatches(cleaned, /1[3-9]\d{9}/g);
          if (phones > 0) { cleaned = cleaned.replace(/1[3-9]\d{9}/g, '[PHONE]'); details.push(`脱敏 ${phones} 个手机号`); }
        }
        if (config?.idCard !== false) {
          const ids = countMatches(cleaned, /\d{17}[\dXx]/g);
          if (ids > 0) { cleaned = cleaned.replace(/\d{17}[\dXx]/g, '[ID_CARD]'); details.push(`脱敏 ${ids} 个身份证号`); }
        }
        if (config?.ip !== false) {
          const ips = countMatches(cleaned, /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g);
          if (ips > 0) { cleaned = cleaned.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP]'); details.push(`脱敏 ${ips} 个 IP 地址`); }
        }
        if (config?.bankCard !== false) {
          const cards = countMatches(cleaned, /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g);
          if (cards > 0) { cleaned = cleaned.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[BANK_CARD]'); details.push(`脱敏 ${cards} 个银行卡号`); }
        }

        return { text: cleaned, removed: text.length - cleaned.length, details };
      },
    },

    // ---- 10. Perplexity 过滤（模拟） ----
    {
      id: 'perplexity',
      name: 'Perplexity 过滤',
      description: '基于字符频率和重复模式的伪 Perplexity 评分，过滤模板/乱码文本',
      icon: 'PPL',
      color: 'violet',
      enabled: false,
      configurable: true,
      config: { lowThreshold: 1.5, highThreshold: 6.0 },
      configSchema: [
        { key: 'lowThreshold', label: '低阈值（低于此值判为模板文本）', type: 'number', min: 0.5, max: 3.0, step: 0.1 },
        { key: 'highThreshold', label: '高阈值（高于此值判为乱码）', type: 'number', min: 4.0, max: 8.0, step: 0.1 },
      ],
      process: (text: string, config?: StepConfig) => {
        const lowThresh = (config?.lowThreshold as number) ?? 1.5;
        const highThresh = (config?.highThreshold as number) ?? 6.0;
        const details: string[] = [];

        function pseudoPerplexity(s: string): number {
          if (s.length < 10) return 3.0;
          const freq = new Map<string, number>();
          for (const ch of s) freq.set(ch, (freq.get(ch) || 0) + 1);
          const len = s.length;
          let entropy = 0;
          for (const count of freq.values()) {
            const p = count / len;
            entropy -= p * Math.log2(p);
          }
          return entropy;
        }

        const paragraphs = text.split(/\n\n+/);
        const kept: string[] = [];
        let removedLow = 0, removedHigh = 0;

        for (const p of paragraphs) {
          if (p.trim().length < 20) { kept.push(p); continue; }
          const ppl = pseudoPerplexity(p);
          if (ppl < lowThresh) {
            removedLow++;
          } else if (ppl > highThresh) {
            removedHigh++;
          } else {
            kept.push(p);
          }
        }

        if (removedLow > 0) details.push(`过滤 ${removedLow} 个低 PPL 段落（模板文本）`);
        if (removedHigh > 0) details.push(`过滤 ${removedHigh} 个高 PPL 段落（疑似乱码）`);

        const cleaned = kept.join('\n\n');
        return { text: cleaned, removed: text.length - cleaned.length, details };
      },
    },

    // ---- 11. 质量过滤 ----
    {
      id: 'quality-filter',
      name: '质量过滤',
      description: '基于 C4/Gopher 规则的行级和文档级质量过滤',
      icon: '⚡',
      color: 'emerald',
      enabled: true,
      configurable: true,
      config: { minLineLength: 5, ruleSet: 'c4' },
      configSchema: [
        { key: 'minLineLength', label: '最小行长度', type: 'number', min: 3, max: 50, step: 1 },
        { key: 'ruleSet', label: '规则集', type: 'select', options: [
          { value: 'c4', label: 'C4 规则' },
          { value: 'gopher', label: 'Gopher 规则' },
          { value: 'fineweb', label: 'FineWeb 规则' },
        ]},
      ],
      process: (text: string, config?: StepConfig) => {
        const minLen = (config?.minLineLength as number) ?? 5;
        const ruleSet = (config?.ruleSet as string) ?? 'c4';
        const lines = text.split('\n');
        const filtered: string[] = [];
        let removed = 0;
        const details: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') { filtered.push(line); continue; }

          // Common: filter purely punctuation lines
          if (/^[\p{P}\s]+$/u.test(trimmed)) { removed++; continue; }

          // Common: filter short lines
          if (trimmed.length < minLen && !/^#{1,6}\s/.test(trimmed)) { removed++; continue; }

          if (ruleSet === 'gopher') {
            // Gopher: filter lines starting with bullet if very short
            if (/^[•\-\*]/.test(trimmed) && trimmed.length < 20) { removed++; continue; }
          }

          if (ruleSet === 'fineweb') {
            // FineWeb: filter lines that are mostly uppercase
            const upperRatio = (trimmed.match(/[A-Z]/g) || []).length / (trimmed.match(/[a-zA-Z]/g) || []).length;
            if (upperRatio > 0.8 && trimmed.length > 10) { removed++; continue; }
          }

          filtered.push(line);
        }

        if (removed > 0) details.push(`[${ruleSet}] 过滤 ${removed} 行低质量内容`);
        return { text: filtered.join('\n'), removed, details };
      },
    },

    // ---- 12. 文档级质量评分 ----
    {
      id: 'doc-quality',
      name: '文档质量评分',
      description: '综合长度、词汇丰富度、段落结构、标点比例的启发式评分',
      icon: '📊',
      color: 'pink',
      enabled: false,
      configurable: true,
      config: { minScore: 40 },
      configSchema: [
        { key: 'minScore', label: '最低通过分（0-100）', type: 'number', min: 0, max: 100, step: 5 },
      ],
      process: (text: string, config?: StepConfig) => {
        const minScore = (config?.minScore as number) ?? 40;
        const details: string[] = [];

        // Calculate quality dimensions
        const length = text.length;
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        const punctuation = countMatches(text, /[.!?,;:，。！？；：]/g);

        // Scoring (0-100)
        const lengthScore = Math.min(30, (length / 500) * 30); // Up to 30pts
        const diversityScore = words.length > 0 ? Math.min(25, (uniqueWords.size / words.length) * 25) : 0;
        const structureScore = Math.min(25, (paragraphs.length / 3) * 25); // Multiple paragraphs
        const punctuationScore = words.length > 0 ? Math.min(20, (punctuation / words.length) * 100) : 0;

        const totalScore = Math.round(lengthScore + diversityScore + structureScore + punctuationScore);

        details.push(`质量评分: ${totalScore}/100（长度 ${Math.round(lengthScore)}, 丰富度 ${Math.round(diversityScore)}, 结构 ${Math.round(structureScore)}, 标点 ${Math.round(punctuationScore)}）`);

        if (totalScore < minScore) {
          details.push(`低于阈值 ${minScore}，文档被过滤`);
          return { text: '', removed: text.length, details };
        }

        return { text, removed: 0, details };
      },
    },
  ];
}

export { createSteps };

/** 按 ID 获取步骤子集 */
export function getStepsByIds(ids: string[]): PipelineStep[] {
  const all = createSteps();
  return ids.map(id => all.find(s => s.id === id)).filter((s): s is PipelineStep => !!s);
}

/** 获取所有步骤 ID */
export function getAllStepIds(): string[] {
  return createSteps().map(s => s.id);
}
