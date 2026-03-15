#!/usr/bin/env python3
"""将《涌现》从HTML文件集合生成EPUB"""
import os
import re
from bs4 import BeautifulSoup
from ebooklib import epub

BOOK_DIR = "/root/.openclaw/workspace/涌现"

# 章节文件顺序
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

# EPUB内联CSS（简洁可读风格）
EPUB_CSS = """
body {
  font-family: 'Georgia', 'Noto Serif SC', serif;
  font-size: 1em;
  line-height: 1.8;
  margin: 1em 1.5em;
  color: #1a1a1a;
  background: #fff;
}
h1 { font-size: 1.8em; margin: 1em 0 0.5em; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
h2 { font-size: 1.4em; margin: 1em 0 0.4em; }
h3 { font-size: 1.2em; margin: 0.8em 0 0.3em; }
p { margin: 0.6em 0; text-indent: 2em; }
blockquote {
  border-left: 3px solid #666;
  margin: 1em 2em;
  padding: 0.5em 1em;
  font-style: italic;
  color: #444;
}
img { max-width: 100%; }
"""


def extract_inner_html(html_path):
    """从HTML文件提取 <body> 内部内容，清理脚本/样式"""
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "lxml")

    # 移除script/style/nav标签
    for tag in soup.find_all(["script", "style", "nav"]):
        tag.decompose()

    # 获取body内部的所有子元素
    body = soup.body
    if body is None:
        return "<p>（内容为空）</p>"

    # 返回body内部的所有子元素HTML（不包含<body>标签本身）
    return "".join(str(child) for child in body.children)


def make_epub():
    book = epub.EpubBook()
    book.set_identifier("urn:uuid:yongxian-2024")
    book.set_title("涌现")
    book.set_language("zh-CN")
    book.add_author("涌现")

    # 添加CSS
    style = epub.EpubItem(
        uid="style_default",
        file_name="style/default.css",
        media_type="text/css",
        content=EPUB_CSS,
    )
    book.add_item(style)

    epub_chapters = []
    toc_items = []

    for fname, title in CHAPTERS:
        fpath = os.path.join(BOOK_DIR, fname)
        if not os.path.exists(fpath):
            print(f"  [SKIP] {fname} not found")
            continue

        print(f"  Processing: {fname}")
        inner_html = extract_inner_html(fpath)

        # 创建EPUB章节
        # 注意: ebooklib的get_body_content()用lxml.html解析，不支持xml声明和xhtml DOCTYPE
        # 必须用普通HTML格式（不加xml声明和xhtml doctype）
        safe_name = re.sub(r"[^\w]", "_", fname.replace(".html", ""))
        ch = epub.EpubHtml(
            title=title,
            file_name=f"chapters/{safe_name}.xhtml",
            lang="zh-CN",
        )

        # 使用普通HTML格式（不含xml声明/DOCTYPE）让ebooklib能正确解析
        ch.content = (
            f"<html lang='zh-CN'>"
            f"<head><meta charset='utf-8'/><title>{title}</title>"
            f"<link rel='stylesheet' type='text/css' href='../style/default.css'/></head>"
            f"<body>{inner_html}</body>"
            f"</html>"
        )

        ch.add_item(style)
        book.add_item(ch)
        epub_chapters.append(ch)
        toc_items.append(epub.Link(f"chapters/{safe_name}.xhtml", title, safe_name))

        print(f"    -> {len(ch.content)} bytes")

    # 目录
    book.toc = toc_items
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # Spine
    book.spine = ["nav"] + epub_chapters

    out_path = os.path.join(BOOK_DIR, "涌现.epub")
    epub.write_epub(out_path, book, {})
    size_kb = os.path.getsize(out_path) // 1024
    print(f"\n✅ EPUB: {out_path} ({size_kb} KB)")
    return out_path


if __name__ == "__main__":
    make_epub()
