import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// Data: 30 languages with token inflation info
// ============================================================
interface LangData {
  code: string;
  name: string;
  nameEn: string;
  hello: string;
  helloTokensGPT4: number;
  helloTokensLLaMA: number;
  helloTokensQwen: number;
  inflationIndex: number; // relative to English = 1.0
  speakers: string; // billions or millions
  region: string;
  // simplified map coordinates (mercator-ish %)
  mapX: number;
  mapY: number;
  color: string;
  priceMultiplier: number; // API cost multiplier vs English
  funFact: string;
}

const languages: LangData[] = [
  { code: 'en', name: '英语', nameEn: 'English', hello: 'Hello World', helloTokensGPT4: 2, helloTokensLLaMA: 2, helloTokensQwen: 2, inflationIndex: 1.0, speakers: '15 亿', region: '全球', mapX: 25, mapY: 33, color: '#22c55e', priceMultiplier: 1.0, funFact: '基准语言，所有 Tokenizer 都对英语最友好' },
  { code: 'zh', name: '中文', nameEn: 'Chinese', hello: '你好世界', helloTokensGPT4: 4, helloTokensLLaMA: 4, helloTokensQwen: 2, inflationIndex: 2.1, speakers: '14 亿', region: '东亚', mapX: 73, mapY: 38, color: '#ef4444', priceMultiplier: 2.1, funFact: '每个汉字约需 1.5-2 个 Token，Qwen 对中文优化最好' },
  { code: 'ja', name: '日语', nameEn: 'Japanese', hello: 'こんにちは世界', helloTokensGPT4: 5, helloTokensLLaMA: 8, helloTokensQwen: 4, inflationIndex: 3.0, speakers: '1.3 亿', region: '东亚', mapX: 82, mapY: 36, color: '#f97316', priceMultiplier: 3.0, funFact: '三种书写系统混用（平/片/汉），Tokenizer 噩梦' },
  { code: 'ko', name: '韩语', nameEn: 'Korean', hello: '안녕하세요 세계', helloTokensGPT4: 6, helloTokensLLaMA: 10, helloTokensQwen: 5, inflationIndex: 2.8, speakers: '8000 万', region: '东亚', mapX: 79, mapY: 35, color: '#f97316', priceMultiplier: 2.8, funFact: '谚文音节组合复杂，未优化的 Tokenizer 效率很低' },
  { code: 'ar', name: '阿拉伯语', nameEn: 'Arabic', hello: 'مرحبا بالعالم', helloTokensGPT4: 5, helloTokensLLaMA: 9, helloTokensQwen: 5, inflationIndex: 2.5, speakers: '3.8 亿', region: '中东/北非', mapX: 55, mapY: 38, color: '#f59e0b', priceMultiplier: 2.5, funFact: '从右到左书写，连笔变体让 Tokenizer 很头疼' },
  { code: 'hi', name: '印地语', nameEn: 'Hindi', hello: 'नमस्ते दुनिया', helloTokensGPT4: 8, helloTokensLLaMA: 14, helloTokensQwen: 6, inflationIndex: 3.5, speakers: '6 亿', region: '南亚', mapX: 65, mapY: 42, color: '#ef4444', priceMultiplier: 3.5, funFact: '天城文一个音节可能需要 3-4 个 Token，极度不经济' },
  { code: 'th', name: '泰语', nameEn: 'Thai', hello: 'สวัสดีชาวโลก', helloTokensGPT4: 10, helloTokensLLaMA: 18, helloTokensQwen: 7, inflationIndex: 5.2, speakers: '6000 万', region: '东南亚', mapX: 72, mapY: 46, color: '#dc2626', priceMultiplier: 5.2, funFact: 'Token 通胀冠军之一——同样内容泰语比英语贵 5 倍' },
  { code: 'vi', name: '越南语', nameEn: 'Vietnamese', hello: 'Xin chào thế giới', helloTokensGPT4: 7, helloTokensLLaMA: 7, helloTokensQwen: 5, inflationIndex: 2.2, speakers: '1 亿', region: '东南亚', mapX: 74, mapY: 45, color: '#f59e0b', priceMultiplier: 2.2, funFact: '用拉丁字母但加声调符号，Token 效率尚可' },
  { code: 'ru', name: '俄语', nameEn: 'Russian', hello: 'Привет мир', helloTokensGPT4: 4, helloTokensLLaMA: 7, helloTokensQwen: 4, inflationIndex: 1.8, speakers: '2.6 亿', region: '欧亚', mapX: 60, mapY: 25, color: '#eab308', priceMultiplier: 1.8, funFact: '西里尔字母在 GPT-4 中还算友好，LLaMA 略差' },
  { code: 'de', name: '德语', nameEn: 'German', hello: 'Hallo Welt', helloTokensGPT4: 2, helloTokensLLaMA: 3, helloTokensQwen: 2, inflationIndex: 1.2, speakers: '1.3 亿', region: '欧洲', mapX: 42, mapY: 28, color: '#84cc16', priceMultiplier: 1.2, funFact: '复合词很长但 Tokenizer 处理还行，因为训练数据多' },
  { code: 'fr', name: '法语', nameEn: 'French', hello: 'Bonjour le monde', helloTokensGPT4: 3, helloTokensLLaMA: 4, helloTokensQwen: 3, inflationIndex: 1.3, speakers: '3.2 亿', region: '欧洲/非洲', mapX: 38, mapY: 30, color: '#84cc16', priceMultiplier: 1.3, funFact: '作为英语的近亲，法语在大部分 Tokenizer 中表现不错' },
  { code: 'es', name: '西班牙语', nameEn: 'Spanish', hello: 'Hola Mundo', helloTokensGPT4: 2, helloTokensLLaMA: 3, helloTokensQwen: 2, inflationIndex: 1.2, speakers: '5.5 亿', region: '全球', mapX: 22, mapY: 55, color: '#84cc16', priceMultiplier: 1.2, funFact: '和英语共享大量拉丁词根，Token 效率接近' },
  { code: 'pt', name: '葡萄牙语', nameEn: 'Portuguese', hello: 'Olá Mundo', helloTokensGPT4: 3, helloTokensLLaMA: 3, helloTokensQwen: 3, inflationIndex: 1.3, speakers: '2.6 亿', region: '南美/欧洲', mapX: 30, mapY: 58, color: '#84cc16', priceMultiplier: 1.3, funFact: '巴西+葡萄牙合起来训练数据量够大，效率还行' },
  { code: 'bn', name: '孟加拉语', nameEn: 'Bengali', hello: 'হ্যালো বিশ্ব', helloTokensGPT4: 9, helloTokensLLaMA: 16, helloTokensQwen: 7, inflationIndex: 4.2, speakers: '2.7 亿', region: '南亚', mapX: 68, mapY: 43, color: '#dc2626', priceMultiplier: 4.2, funFact: '全球第 7 大语言，但在 LLM 世界里被严重低估' },
  { code: 'ta', name: '泰米尔语', nameEn: 'Tamil', hello: 'வணக்கம் உலகம்', helloTokensGPT4: 11, helloTokensLLaMA: 20, helloTokensQwen: 8, inflationIndex: 5.5, speakers: '8500 万', region: '南亚', mapX: 66, mapY: 48, color: '#dc2626', priceMultiplier: 5.5, funFact: '最古老的活语言之一，但 Token 效率倒数' },
  { code: 'my', name: '缅甸语', nameEn: 'Myanmar', hello: 'မင်္ဂလာပါကမ္ဘာ', helloTokensGPT4: 14, helloTokensLLaMA: 24, helloTokensQwen: 10, inflationIndex: 6.8, speakers: '5500 万', region: '东南亚', mapX: 70, mapY: 44, color: '#991b1b', priceMultiplier: 6.8, funFact: '通胀之王——用缅甸语调 API 价格是英语的近 7 倍' },
  { code: 'km', name: '高棉语', nameEn: 'Khmer', hello: 'សួស្តីពិភពលោក', helloTokensGPT4: 13, helloTokensLLaMA: 22, helloTokensQwen: 9, inflationIndex: 6.2, speakers: '1800 万', region: '东南亚', mapX: 73, mapY: 47, color: '#991b1b', priceMultiplier: 6.2, funFact: '世上最长的字母表（74 个字母），Token 效率极低' },
  { code: 'am', name: '阿姆哈拉语', nameEn: 'Amharic', hello: 'ሰላም ዓለም', helloTokensGPT4: 10, helloTokensLLaMA: 18, helloTokensQwen: 8, inflationIndex: 5.0, speakers: '5000 万', region: '东非', mapX: 53, mapY: 48, color: '#dc2626', priceMultiplier: 5.0, funFact: '埃塞俄比亚官方语言，吉兹字母让 LLM 很痛苦' },
  { code: 'tr', name: '土耳其语', nameEn: 'Turkish', hello: 'Merhaba Dünya', helloTokensGPT4: 3, helloTokensLLaMA: 4, helloTokensQwen: 3, inflationIndex: 1.5, speakers: '8800 万', region: '欧亚', mapX: 52, mapY: 33, color: '#eab308', priceMultiplier: 1.5, funFact: '黏着语特性让词很长，但拉丁字母帮了忙' },
  { code: 'pl', name: '波兰语', nameEn: 'Polish', hello: 'Witaj Świecie', helloTokensGPT4: 4, helloTokensLLaMA: 5, helloTokensQwen: 4, inflationIndex: 1.6, speakers: '4500 万', region: '欧洲', mapX: 44, mapY: 27, color: '#eab308', priceMultiplier: 1.6, funFact: '丰富的屈折变化让 Token 数略高于英语' },
  { code: 'uk', name: '乌克兰语', nameEn: 'Ukrainian', hello: 'Привіт Світ', helloTokensGPT4: 5, helloTokensLLaMA: 8, helloTokensQwen: 5, inflationIndex: 2.0, speakers: '4000 万', region: '欧洲', mapX: 48, mapY: 27, color: '#f59e0b', priceMultiplier: 2.0, funFact: '和俄语同用西里尔字母，但训练数据少得多' },
  { code: 'sw', name: '斯瓦希里语', nameEn: 'Swahili', hello: 'Habari Dunia', helloTokensGPT4: 4, helloTokensLLaMA: 5, helloTokensQwen: 4, inflationIndex: 1.8, speakers: '2 亿', region: '东非', mapX: 53, mapY: 54, color: '#eab308', priceMultiplier: 1.8, funFact: '非洲用户最多的语言之一，用拉丁字母所以还好' },
  { code: 'ne', name: '尼泊尔语', nameEn: 'Nepali', hello: 'नमस्ते संसार', helloTokensGPT4: 9, helloTokensLLaMA: 15, helloTokensQwen: 7, inflationIndex: 4.0, speakers: '3200 万', region: '南亚', mapX: 67, mapY: 40, color: '#ef4444', priceMultiplier: 4.0, funFact: '和印地语同用天城文，但训练数据更少，通胀更高' },
  { code: 'lo', name: '老挝语', nameEn: 'Lao', hello: 'ສະບາຍດີໂລກ', helloTokensGPT4: 12, helloTokensLLaMA: 20, helloTokensQwen: 9, inflationIndex: 5.8, speakers: '3000 万', region: '东南亚', mapX: 72, mapY: 44, color: '#991b1b', priceMultiplier: 5.8, funFact: '和泰语近亲，同样的 Token 通胀困境' },
  { code: 'ka', name: '格鲁吉亚语', nameEn: 'Georgian', hello: 'გამარჯობა მსოფლიო', helloTokensGPT4: 10, helloTokensLLaMA: 18, helloTokensQwen: 8, inflationIndex: 4.8, speakers: '400 万', region: '高加索', mapX: 56, mapY: 31, color: '#dc2626', priceMultiplier: 4.8, funFact: '独特的字母系统，全球只有格鲁吉亚人用' },
  { code: 'it', name: '意大利语', nameEn: 'Italian', hello: 'Ciao Mondo', helloTokensGPT4: 2, helloTokensLLaMA: 3, helloTokensQwen: 2, inflationIndex: 1.2, speakers: '6800 万', region: '欧洲', mapX: 41, mapY: 31, color: '#84cc16', priceMultiplier: 1.2, funFact: '罗曼语族三兄弟（法意西）Token 效率都不错' },
  { code: 'nl', name: '荷兰语', nameEn: 'Dutch', hello: 'Hallo Wereld', helloTokensGPT4: 2, helloTokensLLaMA: 3, helloTokensQwen: 3, inflationIndex: 1.2, speakers: '2900 万', region: '欧洲', mapX: 40, mapY: 27, color: '#84cc16', priceMultiplier: 1.2, funFact: '和英语同属日耳曼语族，很多词 Tokenizer 直接能认' },
  { code: 'id', name: '印尼语', nameEn: 'Indonesian', hello: 'Halo Dunia', helloTokensGPT4: 3, helloTokensLLaMA: 4, helloTokensQwen: 3, inflationIndex: 1.4, speakers: '2.7 亿', region: '东南亚', mapX: 76, mapY: 54, color: '#84cc16', priceMultiplier: 1.4, funFact: '用拉丁字母的东南亚语言，Token 效率比邻居好很多' },
  { code: 'he', name: '希伯来语', nameEn: 'Hebrew', hello: 'שלום עולם', helloTokensGPT4: 5, helloTokensLLaMA: 8, helloTokensQwen: 5, inflationIndex: 2.4, speakers: '900 万', region: '中东', mapX: 53, mapY: 36, color: '#f59e0b', priceMultiplier: 2.4, funFact: '科技领域强势，以色列 AI 产业保证了一些训练数据' },
  { code: 'tl', name: '菲律宾语', nameEn: 'Filipino', hello: 'Kumusta Mundo', helloTokensGPT4: 4, helloTokensLLaMA: 5, helloTokensQwen: 4, inflationIndex: 1.6, speakers: '1.1 亿', region: '东南亚', mapX: 80, mapY: 48, color: '#eab308', priceMultiplier: 1.6, funFact: '大量英语借词，间接提升了 Token 效率' },
];

// Sort by inflation for ranking
const rankedLanguages = [...languages].sort((a, b) => b.inflationIndex - a.inflationIndex);

// ============================================================
// Component
// ============================================================
export default function TokenEconomics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLang, setSelectedLang] = useState<LangData | null>(null);
  const [inputText, setInputText] = useState('人工智能正在改变世界');
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'ranking' | 'calculator'>('map');
  const [animationPhase, setAnimationPhase] = useState(0);
  const animRef = useRef<number>(0);

  // Canvas: draw world map with language dots
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Draw simplified continents (just outlines for effect)
    drawContinents(ctx, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(100,116,139,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (H / 10) * i);
      ctx.lineTo(W, (H / 10) * i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((W / 10) * i, 0);
      ctx.lineTo((W / 10) * i, H);
      ctx.stroke();
    }

    // Draw language dots
    languages.forEach((lang) => {
      const x = (lang.mapX / 100) * W;
      const y = (lang.mapY / 100) * H;
      const isHovered = hoveredLang === lang.code;
      const isSelected = selectedLang?.code === lang.code;
      const baseRadius = Math.max(4, Math.min(8, lang.inflationIndex * 1.5));
      const radius = isHovered || isSelected ? baseRadius * 1.5 : baseRadius;

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      gradient.addColorStop(0, lang.color + '60');
      gradient.addColorStop(1, lang.color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fill();

      // Pulse animation for selected
      if (isSelected) {
        const pulseRadius = radius + Math.sin(animationPhase * 0.05) * 4;
        ctx.strokeStyle = lang.color + '80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Main dot
      ctx.fillStyle = isHovered || isSelected ? '#ffffff' : lang.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = lang.color;
      ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Label for hovered/selected
      if (isHovered || isSelected) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lang.name, x, y - radius - 8);
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${lang.inflationIndex}x`, x, y - radius - 22);
      }
    });

    // Legend
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('圆点大小 = Token 通胀指数 · 颜色：', 12, H - 14);

    const legendItems = [
      { label: '≤1.5x', color: '#22c55e' },
      { label: '1.5-3x', color: '#eab308' },
      { label: '3-5x', color: '#ef4444' },
      { label: '>5x', color: '#991b1b' },
    ];
    let lx = 220;
    legendItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(lx, H - 18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(item.label, lx + 8, H - 14);
      lx += 60;
    });
  }, [hoveredLang, selectedLang, animationPhase]);

  // Simplified continent outlines
  function drawContinents(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.fillStyle = 'rgba(30,41,59,0.8)';
    ctx.strokeStyle = 'rgba(71,85,105,0.3)';
    ctx.lineWidth = 1;

    // Very simplified continent shapes using percentages
    const continents: number[][][] = [
      // North America
      [[12,15],[20,15],[28,20],[30,30],[28,38],[22,42],[15,38],[10,30],[12,15]],
      // South America
      [[22,50],[28,48],[32,52],[33,58],[30,68],[26,75],[22,72],[20,60],[22,50]],
      // Europe
      [[38,18],[46,18],[48,22],[50,28],[48,34],[42,34],[38,30],[36,24],[38,18]],
      // Africa
      [[40,35],[48,35],[52,40],[54,48],[52,58],[48,65],[42,65],[38,55],[38,45],[40,35]],
      // Asia
      [[50,15],[62,14],[72,18],[80,20],[85,28],[85,38],[78,42],[72,48],[65,45],[58,40],[52,35],[50,28],[50,15]],
      // Oceania
      [[75,55],[82,52],[86,55],[84,60],[78,62],[74,58],[75,55]],
    ];

    continents.forEach((c) => {
      ctx.beginPath();
      c.forEach(([px, py], i) => {
        const x = (px / 100) * W;
        const y = (py / 100) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  // Animation loop
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame++;
      setAnimationPhase(frame);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // Handle canvas mouse events
  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;

    let found: string | null = null;
    for (const lang of languages) {
      const x = (lang.mapX / 100) * W;
      const y = (lang.mapY / 100) * H;
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < 20) {
        found = lang.code;
        break;
      }
    }
    setHoveredLang(found);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;

    for (const lang of languages) {
      const x = (lang.mapX / 100) * W;
      const y = (lang.mapY / 100) * H;
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < 20) {
        setSelectedLang(selectedLang?.code === lang.code ? null : lang);
        return;
      }
    }
    setSelectedLang(null);
  };

  // Simulate token count for custom text
  function estimateTokens(text: string, model: 'gpt4' | 'llama' | 'qwen'): number {
    // Rough estimation based on character types
    let count = 0;
    for (const char of text) {
      const code = char.codePointAt(0) || 0;
      if (code < 128) {
        // ASCII
        count += model === 'gpt4' ? 0.25 : model === 'llama' ? 0.28 : 0.25;
      } else if (code >= 0x4E00 && code <= 0x9FFF) {
        // CJK
        count += model === 'gpt4' ? 1.5 : model === 'llama' ? 1.8 : 1.0;
      } else if (code >= 0x0E00 && code <= 0x0E7F) {
        // Thai
        count += model === 'gpt4' ? 2.5 : model === 'llama' ? 3.0 : 1.8;
      } else if (code >= 0x0900 && code <= 0x097F) {
        // Devanagari
        count += model === 'gpt4' ? 2.0 : model === 'llama' ? 2.8 : 1.5;
      } else if (code >= 0x0600 && code <= 0x06FF) {
        // Arabic
        count += model === 'gpt4' ? 1.8 : model === 'llama' ? 2.5 : 1.5;
      } else if (code >= 0xAC00 && code <= 0xD7AF) {
        // Korean
        count += model === 'gpt4' ? 1.8 : model === 'llama' ? 2.5 : 1.2;
      } else if (code >= 0x0400 && code <= 0x04FF) {
        // Cyrillic
        count += model === 'gpt4' ? 0.8 : model === 'llama' ? 1.2 : 0.8;
      } else {
        count += model === 'gpt4' ? 1.5 : model === 'llama' ? 2.0 : 1.2;
      }
    }
    return Math.max(1, Math.round(count));
  }

  const gpt4Tokens = estimateTokens(inputText, 'gpt4');
  const llamaTokens = estimateTokens(inputText, 'llama');
  const qwenTokens = estimateTokens(inputText, 'qwen');

  // Stats for header
  const avgInflation = (languages.reduce((s, l) => s + l.inflationIndex, 0) / languages.length).toFixed(1);
  const maxInflation = rankedLanguages[0];
  const totalSpeakers = '50 亿+';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '覆盖语言', value: `${languages.length} 种`, sub: `${totalSpeakers} 使用者` },
          { label: '平均通胀指数', value: `${avgInflation}x`, sub: '相对于英语' },
          { label: '最高通胀', value: `${maxInflation.inflationIndex}x`, sub: maxInflation.name },
          { label: '最大差距', value: `${maxInflation.inflationIndex}x`, sub: `${maxInflation.name} vs 英语` },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {[
          { key: 'map' as const, label: '全球地图', icon: '🌍' },
          { key: 'ranking' as const, label: '通胀排行', icon: '📊' },
          { key: 'calculator' as const, label: 'Token 计算器', icon: '🔢' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* === MAP TAB === */}
      {activeTab === 'map' && (
        <div>
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: '420px', cursor: hoveredLang ? 'pointer' : 'default' }}
              onMouseMove={handleCanvasMove}
              onClick={handleCanvasClick}
              onMouseLeave={() => setHoveredLang(null)}
            />
          </div>

          {/* Selected language detail card */}
          {selectedLang && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-6 mb-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedLang.name}
                    <span className="text-sm font-normal text-slate-500 ml-2">{selectedLang.nameEn}</span>
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {selectedLang.region} · {selectedLang.speakers} 使用者
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold" style={{ color: selectedLang.color }}>
                    {selectedLang.inflationIndex}x
                  </div>
                  <div className="text-xs text-slate-500">Token 通胀指数</div>
                </div>
              </div>

              {/* Hello World comparison */}
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 mb-4">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  "{selectedLang.hello}" 需要多少 Token？
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'GPT-4', tokens: selectedLang.helloTokensGPT4, color: '#10b981' },
                    { name: 'LLaMA 3', tokens: selectedLang.helloTokensLLaMA, color: '#6366f1' },
                    { name: 'Qwen 2.5', tokens: selectedLang.helloTokensQwen, color: '#f59e0b' },
                  ].map((m) => (
                    <div key={m.name} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: m.color }}>{m.tokens}</div>
                      <div className="text-xs text-slate-500">{m.name}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-400 mt-2 text-center">
                  英语 "Hello World" = 2 tokens (GPT-4) · 差距 = {(selectedLang.helloTokensGPT4 / 2).toFixed(1)}x
                </div>
              </div>

              {/* Price impact */}
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 mb-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    API 价格影响
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    同样的信息量，用{selectedLang.name}调用 GPT-4 API 比英语贵约 <strong>{selectedLang.priceMultiplier}x</strong>
                    {selectedLang.priceMultiplier > 3 ? ' ⚠️ 严重不公平' : selectedLang.priceMultiplier > 1.5 ? ' — 值得关注' : ' — 尚可接受'}
                  </div>
                </div>
              </div>

              {/* Fun fact */}
              <div className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                💡 {selectedLang.funFact}
              </div>
            </div>
          )}

          {/* Map instruction */}
          {!selectedLang && (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-2">
              👆 点击地图上的圆点查看语言详情
            </p>
          )}
        </div>
      )}

      {/* === RANKING TAB === */}
      {activeTab === 'ranking' && (
        <div className="space-y-2">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Token 通胀排行榜</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              以英语(1.0x)为基准，同样的信息量需要多少倍的 Token？指数越高，用这种语言调 API 越"贵"。
            </p>
          </div>

          {rankedLanguages.map((lang, idx) => {
            const barWidth = (lang.inflationIndex / 7) * 100;
            const rank = idx + 1;
            return (
              <div
                key={lang.code}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                  selectedLang?.code === lang.code
                    ? 'bg-slate-100 dark:bg-slate-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                onClick={() => setSelectedLang(selectedLang?.code === lang.code ? null : lang)}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  rank <= 3
                    ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : rank <= 10
                      ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {rank}
                </div>

                {/* Language info */}
                <div className="w-24 shrink-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{lang.name}</div>
                  <div className="text-xs text-slate-400">{lang.nameEn}</div>
                </div>

                {/* Bar */}
                <div className="flex-1 relative h-7 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, barWidth)}%`,
                      backgroundColor: lang.color,
                      opacity: 0.8,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-bold text-white drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {lang.inflationIndex}x
                    </span>
                  </div>
                </div>

                {/* Speakers */}
                <div className="w-20 text-right shrink-0">
                  <div className="text-xs text-slate-400">{lang.speakers}</div>
                </div>

                {/* Price tag */}
                <div className={`w-16 text-right text-xs font-medium shrink-0 ${
                  lang.priceMultiplier >= 5
                    ? 'text-red-500'
                    : lang.priceMultiplier >= 3
                      ? 'text-orange-500'
                      : lang.priceMultiplier >= 1.5
                        ? 'text-amber-500'
                        : 'text-green-500'
                }`}>
                  ¥{(lang.priceMultiplier * 0.03).toFixed(2)}/1K
                </div>
              </div>
            );
          })}

          {/* Selected detail */}
          {selectedLang && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900 dark:text-white">{selectedLang.name} 详情</span>
                <span className="text-2xl font-bold" style={{ color: selectedLang.color }}>{selectedLang.inflationIndex}x</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{selectedLang.funFact}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="font-bold text-emerald-500">{selectedLang.helloTokensGPT4}</div>
                  <div className="text-slate-400">GPT-4</div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="font-bold text-indigo-500">{selectedLang.helloTokensLLaMA}</div>
                  <div className="text-slate-400">LLaMA</div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-2">
                  <div className="font-bold text-amber-500">{selectedLang.helloTokensQwen}</div>
                  <div className="text-slate-400">Qwen</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === CALCULATOR TAB === */}
      {activeTab === 'calculator' && (
        <div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Token 计算器</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              输入任意文本，实时对比三家主流 Tokenizer 的 Token 数和 API 费用
            </p>
          </div>

          {/* Input */}
          <div className="mb-6">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
              placeholder="输入任意文本..."
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>{inputText.length} 字符</span>
              <div className="flex gap-2">
                {[
                  { label: '中文', text: '人工智能正在改变世界，从自动驾驶到医疗诊断，大模型无处不在。' },
                  { label: '英文', text: 'Artificial intelligence is transforming the world, from autonomous driving to medical diagnosis.' },
                  { label: '日文', text: '人工知能は世界を変えています。自動運転から医療診断まで、大規模モデルはどこにでもあります。' },
                  { label: '泰文', text: 'ปัญญาประดิษฐ์กำลังเปลี่ยนแปลงโลก ตั้งแต่การขับขี่อัตโนมัติไปจนถึงการวินิจฉัยทางการแพทย์' },
                  { label: '混合', text: 'This is 一个 mixed 文本 with 中英文 and some 数字 12345 и русский' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setInputText(preset.text)}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { name: 'GPT-4 (cl100k)', tokens: gpt4Tokens, color: '#10b981', price: 0.03, bg: 'from-emerald-500/10 to-emerald-500/5' },
              { name: 'LLaMA 3', tokens: llamaTokens, color: '#6366f1', price: 0.01, bg: 'from-indigo-500/10 to-indigo-500/5' },
              { name: 'Qwen 2.5', tokens: qwenTokens, color: '#f59e0b', price: 0.02, bg: 'from-amber-500/10 to-amber-500/5' },
            ].map((m) => (
              <div key={m.name} className={`bg-gradient-to-br ${m.bg} rounded-xl p-5 border border-slate-200 dark:border-slate-700`}>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{m.name}</div>
                <div className="text-4xl font-bold mb-1" style={{ color: m.color }}>{m.tokens}</div>
                <div className="text-sm text-slate-500">tokens</div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>预估费用 (input)</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      ${((m.tokens / 1000) * m.price).toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>vs 英语效率</span>
                    <span className="font-medium" style={{ color: m.tokens > gpt4Tokens ? '#ef4444' : '#22c55e' }}>
                      {m.tokens <= gpt4Tokens ? '最优' : `+${((m.tokens / gpt4Tokens - 1) * 100).toFixed(0)}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual comparison bar */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Token 数可视化对比</h4>
            {[
              { name: 'GPT-4', tokens: gpt4Tokens, color: '#10b981' },
              { name: 'LLaMA 3', tokens: llamaTokens, color: '#6366f1' },
              { name: 'Qwen 2.5', tokens: qwenTokens, color: '#f59e0b' },
            ].map((m) => {
              const maxTokens = Math.max(gpt4Tokens, llamaTokens, qwenTokens);
              return (
                <div key={m.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-20 text-xs text-slate-500 text-right shrink-0">{m.name}</div>
                  <div className="flex-1 h-8 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${(m.tokens / maxTokens) * 100}%`,
                        backgroundColor: m.color,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white drop-shadow-sm">
                      {m.tokens} tokens
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key insight */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">🧠 为什么会这样？</h4>
            <div className="text-sm text-indigo-800 dark:text-indigo-300 space-y-2">
              <p>Token 不平等的根源在于 <strong>BPE 训练语料的分布</strong>——英语在训练数据中占 60-80%，所以英语常见词被整合为单个 Token。而低资源语言的文字只能按 byte 级别拆分。</p>
              <p>这意味着：<strong>用泰语问 GPT-4 一个问题，同样的信息量你要付 5 倍的钱</strong>。这是一种隐形的数字不平等。</p>
              <p>解决方案？<strong>多语言优化的 Tokenizer</strong>（如 Qwen 对中文、日文的优化）和<strong>更均衡的训练语料配比</strong>。</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom: key takeaways */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
          <div className="text-lg mb-1">⚠️</div>
          <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-1">数字鸿沟</h4>
          <p className="text-xs text-red-700 dark:text-red-300">
            全球约 30 亿人使用的语言，Token 通胀指数超过 3x——这意味着他们使用 LLM 的经济成本是英语用户的 3 倍以上。
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
          <div className="text-lg mb-1">💡</div>
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm mb-1">Tokenizer 是关键</h4>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            对比 Qwen vs LLaMA——同样一段中文，Qwen 用 1 个 Token 搞定的，LLaMA 可能需要 2 个。Tokenizer 设计就是隐形的语言政策。
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
          <div className="text-lg mb-1">🔗</div>
          <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm mb-1">延伸阅读</h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            <a href="/books/llm-complete/chapter-03" className="underline hover:no-underline">《Tokenizer 设计哲学》</a> ·
            <a href="/books/data-engineering/de-ch06-data-mixing" className="underline hover:no-underline ml-1">《数据配比》</a> ·
            <a href="/tools/tokenizer-visualizer" className="underline hover:no-underline ml-1">Tokenizer 可视化工具</a>
          </p>
        </div>
      </div>
    </div>
  );
}
