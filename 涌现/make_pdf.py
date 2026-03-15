#!/usr/bin/env python3
"""将《涌现》从HTML文件集合生成PDF（使用WeasyPrint）"""
import os
from bs4 import BeautifulSoup

BOOK_DIR = "/root/.openclaw/workspace/涌现"

CHAPTERS = [
    ("00_序言.html", "序言"),
    ("01_Attention_Is_All_You_Need.html", "第一章 Attention Is All You Need"),
    ("02_GPT1的安静诞生.html", "第二章 GPT-1的安静诞生"),
    ("03_规模的预感.html", "第三章 规模的预感"),
    ("04_GPT3时刻.html", "第四章 GPT-3时刻"),
    ("05_炒作与幻灭的双螺旋.html", "第五章 炒作与幻灭的双螺旋"),
    ("06_Codex与GitHub_Copilot.html", "第六章 Codex与GitHub Copilot"),
    ("07_中场的迷雾.html", "第七章 中场的迷雾"),
    ("08_InstructGPT的秘密.html", "第八章 InstructGPT的秘密"),
    ("09_2022年11月30日.html", "第九章 2022年11月30日"),
    ("10_所有人都慌了.html", "第十章 所有人都慌了"),
    ("11_GPT4与多模态的黎明.html", "第十一章 GPT-4与多模态的黎明"),
    ("12_应用的寒武纪大爆发.html", "第十二章 应用的寒武纪大爆发"),
    ("13_唱衰的声音.html", "第十三章 唱衰的声音"),
    ("14_幻觉安全与监管.html", "第十四章 幻觉、安全与监管"),
    ("15_开源的力量.html", "第十五章 开源的力量"),
    ("16_O1时刻.html", "第十六章 O1时刻"),
    ("17_Agent的黎明.html", "第十七章 Agent的黎明"),
    ("18_DeepSeek震撼.html", "第十八章 DeepSeek震撼"),
    ("19_模型的民主化与碎片化.html", "第十九章 模型的民主化与碎片化"),
    ("20_什么改变了什么没变.html", "第二十章 什么改变了，什么没变"),
    ("21_没有被问到的问题.html", "第二十一章 没有被问到的问题"),
    ("22_结语_涌现还在继续.html", "结语 涌现还在继续"),
    ("23_附录.html", "附录"),
]

PDF_CSS = """
@page {
  size: A4;
  margin: 2.5cm 2cm 2.5cm 2.5cm;
  @bottom-center {
    content: counter(page);
    font-size: 10pt;
    color: #666;
  }
}

* { box-sizing: border-box; }

body {
  font-family: 'Noto Serif CJK SC', 'Noto Serif SC', 'Source Han Serif SC',
               'WenQuanYi Micro Hei', 'DejaVu Serif', serif;
  font-size: 11pt;
  line-height: 1.85;
  color: #111;
  background: white;
  margin: 0;
  padding: 0;
}

/* 封面/章节分页 */
.chapter-section {
  page-break-before: always;
}
.chapter-section:first-child {
  page-break-before: avoid;
}

h1 {
  font-size: 18pt;
  margin: 0.5em 0 0.3em;
  border-bottom: 2px solid #333;
  padding-bottom: 0.2em;
  page-break-after: avoid;
}

h2 {
  font-size: 14pt;
  margin: 1em 0 0.4em;
  page-break-after: avoid;
}

h3 {
  font-size: 12pt;
  margin: 0.8em 0 0.3em;
  page-break-after: avoid;
}

p {
  margin: 0.4em 0;
  text-indent: 2em;
  orphans: 2;
  widows: 2;
}

blockquote {
  border-left: 3px solid #999;
  margin: 0.8em 2em;
  padding: 0.3em 1em;
  font-style: italic;
  color: #444;
}

/* 页眉章节标题 */
.book-header, .chapter-header {
  margin-bottom: 1.5em;
}

.book-title {
  font-size: 22pt;
  font-weight: bold;
  text-align: center;
  margin: 0.3em 0;
}

.chapter-title {
  font-size: 18pt;
  font-weight: bold;
  text-align: center;
  margin: 0.3em 0;
}

.chapter-number {
  font-size: 10pt;
  color: #666;
  text-align: center;
  margin-bottom: 0.3em;
}

.chapter-epigraph, .epigraph {
  font-style: italic;
  color: #555;
  margin: 1em 3em;
  text-align: center;
}

img {
  max-width: 100%;
  page-break-inside: avoid;
}

/* 目录 */
.toc-container { margin: 1em 0; }
.toc-item { margin: 0.3em 0; }

/* 去掉背景色，确保打印友好 */
.book-header, .chapter-header, .content-section,
.card, .section, [class*="bg-"] {
  background: white !important;
  color: #111 !important;
  border-color: #ccc !important;
}

a { color: #333; text-decoration: none; }
"""


def extract_inner_html(html_path):
    """提取 body 内部的 HTML，清理脚本/样式"""
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "lxml")

    for tag in soup.find_all(["script", "style", "nav"]):
        tag.decompose()

    body = soup.body
    if body is None:
        return "<p>（内容为空）</p>"

    return "".join(str(child) for child in body.children)


def make_pdf():
    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration

    print("合并所有章节HTML...")
    all_sections = []

    for i, (fname, title) in enumerate(CHAPTERS):
        fpath = os.path.join(BOOK_DIR, fname)
        if not os.path.exists(fpath):
            print(f"  [SKIP] {fname} not found")
            continue
        print(f"  Adding: {fname}")
        inner = extract_inner_html(fpath)
        # 用 div 包裹，每章新页
        cls = "chapter-section" if i > 0 else "chapter-section"
        all_sections.append(f'<div class="{cls}">{inner}</div>')

    # 组合成完整HTML文档
    full_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<title>涌现</title>
<style>
{PDF_CSS}
</style>
</head>
<body>
{"".join(all_sections)}
</body>
</html>"""

    out_path = os.path.join(BOOK_DIR, "涌现.pdf")
    print(f"\n正在渲染PDF（可能需要几分钟）...")

    font_config = FontConfiguration()
    css = CSS(string=PDF_CSS, font_config=font_config)
    html_doc = HTML(string=full_html, base_url=BOOK_DIR)
    html_doc.write_pdf(out_path, font_config=font_config, presentational_hints=True)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"✅ PDF: {out_path} ({size_kb} KB)")
    return out_path


if __name__ == "__main__":
    make_pdf()
