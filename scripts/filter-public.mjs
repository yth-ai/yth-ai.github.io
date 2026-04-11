#!/usr/bin/env node
/**
 * Maxwell 公开版过滤脚本
 * 
 * 在 GitHub Pages 构建前运行，过滤内部内容：
 * 1. research 中 category=研究提案 或 category=原创论文 的文件 → 删除
 * 2. column 中 series=大模型动态内网精选 的文件 → 删除
 * 3. 内容文件中的内网链接（*.woa.com, km.*, iwiki.*）→ 移除或替换
 * 4. server/ 目录 → 删除（不部署到 GitHub Pages）
 * 5. public/ 下与被删除研究文件关联的 HTML → 删除
 * 6. BaseLayout 中的 Umami 统计脚本 → 移除
 * 7. 同步 API 引用 → 降级处理
 * 8. .workbuddy/ 目录 → 删除
 * 9. 内部文档（.docx 等）→ 删除
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = fs.realpathSync(path.resolve(__dirname, '..'));

let deletedCount = 0;
let modifiedCount = 0;
let skippedCount = 0;

// ============ 工具函数 ============

function log(msg) {
  console.log(`[filter] ${msg}`);
}

function deleteFileOrDir(p) {
  const abs = path.resolve(ROOT, p);
  if (!fs.existsSync(abs)) return;
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    fs.rmSync(abs, { recursive: true, force: true });
    log(`  🗑️  删除目录: ${p}`);
  } else {
    fs.unlinkSync(abs);
    log(`  🗑️  删除文件: ${p}`);
  }
  deletedCount++;
}

function readFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const yaml = match[1];
    // 简易 YAML 解析（只需 key: value）
    const result = {};
    for (const line of yaml.split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)/);
      if (m) {
        let val = m[2].trim();
        // 去掉引号
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result[m[1]] = val;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function getAllFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(full, ext));
    } else if (!ext || entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// ============ Step 1: 删除 research 中的研究提案和原创论文 ============

function filterResearch() {
  log('\n📋 Step 1: 过滤 research 中的研究提案和原创论文');
  const researchDir = path.join(ROOT, 'src/content/research');
  const filesToDelete = [];
  const htmlsToDelete = [];

  for (const file of getAllFiles(researchDir)) {
    const fm = readFrontmatter(file);
    if (fm.category === '研究提案' || fm.category === '原创论文') {
      filesToDelete.push(file);
      // 检查是否有关联的 HTML 文件
      if (fm.htmlVersion) {
        htmlsToDelete.push(path.join(ROOT, 'public', fm.htmlVersion.replace(/^\//, '')));
      }
      // 同名 .html 文件也删除
      const htmlSibling = file.replace(/\.md$/, '.html');
      if (fs.existsSync(htmlSibling)) {
        htmlsToDelete.push(htmlSibling);
      }
    }
  }

  // 也删除 src/content/research/ 下所有 .html 文件（内部报告）
  if (fs.existsSync(researchDir)) {
    for (const entry of fs.readdirSync(researchDir)) {
      if (entry.endsWith('.html')) {
        const htmlPath = path.join(researchDir, entry);
        try {
          fs.unlinkSync(htmlPath);
          deletedCount++;
          log(`  🗑️  删除 HTML: src/content/research/${entry}`);
        } catch (e) {
          log(`  ⚠️  删除失败: ${entry} - ${e.message}`);
        }
      }
    }
  }

  for (const f of filesToDelete) {
    const rel = path.relative(ROOT, f);
    deleteFileOrDir(rel);
  }

  for (const h of htmlsToDelete) {
    if (fs.existsSync(h)) {
      const rel = path.relative(ROOT, h);
      deleteFileOrDir(rel);
    }
  }

  log(`  → 删除 ${filesToDelete.length} 个研究文件, ${htmlsToDelete.filter(h => fs.existsSync(h) || deletedCount).length} 个关联 HTML`);
}

// ============ Step 2: 删除内网精选专栏 ============

function filterColumn() {
  log('\n📋 Step 2: 过滤内网/不公开专栏');
  const columnDir = path.join(ROOT, 'src/content/column');
  const hiddenSeries = new Set([
    '大模型动态内网精选',
    '大模型前沿周报',
  ]);
  
  for (const file of getAllFiles(columnDir)) {
    const fm = readFrontmatter(file);
    if (hiddenSeries.has(fm.series)) {
      const rel = path.relative(ROOT, file);
      deleteFileOrDir(rel);
    }
  }
}

// ============ Step 3: 清理内网链接 ============

function cleanInternalLinks() {
  log('\n📋 Step 3: 清理内容文件中的内网链接');
  const contentDir = path.join(ROOT, 'src/content');
  
  // 内网链接模式
  const internalPatterns = [
    // Markdown 链接 [text](url) 中的内网链接 → 只保留 text
    { regex: /\[([^\]]+)\]\(https?:\/\/[^\)]*\.woa\.com[^\)]*\)/g, replace: '$1' },
    { regex: /\[([^\]]+)\]\(https?:\/\/km\.[^\)]*\)/g, replace: '$1' },
    { regex: /\[([^\]]+)\]\(https?:\/\/iwiki\.[^\)]*\)/g, replace: '$1' },
    // 裸 URL
    { regex: /https?:\/\/[^\s\)]*\.woa\.com[^\s\)]*/g, replace: '[内部链接]' },
    { regex: /https?:\/\/km\.\S+/g, replace: '[内部链接]' },
    { regex: /https?:\/\/iwiki\.\S+/g, replace: '[内部链接]' },
    // 非 URL 格式的内网域名引用（如 "KM (km.woa.com)"、"iWiki (iwiki.woa.com)"）
    { regex: /\s*·?\s*KM\s*\(km\.woa\.com\)/g, replace: '' },
    { regex: /\s*·?\s*iWiki\s*\(iwiki\.woa\.com\)/g, replace: '' },
    { regex: /km\.woa\.com/g, replace: '[内部平台]' },
    { regex: /iwiki\.woa\.com/g, replace: '[内部平台]' },
    // 数据来源行（引用格式和斜体格式）中含内网引用 → 整行删除
    { regex: /> 数据来源：.*?(?:KM|km\.woa\.com|iwiki\.woa\.com).*?\n/g, replace: '' },
    { regex: /\*数据来源：.*?(?:KM|km\.woa\.com|iwiki\.woa\.com).*?\*\n?/g, replace: '' },
    // 通用 .woa.com 域名（兜底）
    { regex: /[a-zA-Z0-9-]+\.woa\.com/g, replace: '[内部平台]' },
  ];

  for (const file of getAllFiles(contentDir)) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx') && !file.endsWith('.html')) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    for (const { regex, replace } of internalPatterns) {
      const newContent = content.replace(regex, replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedCount++;
      log(`  ✏️  清理链接: ${path.relative(ROOT, file)}`);
    }
  }
}

// ============ Step 4: 删除服务端相关内容 ============

function removeServerFiles() {
  log('\n📋 Step 4: 删除服务端相关文件');
  
  // 删除 server/ 目录
  deleteFileOrDir('server');
  
  // 删除 .workbuddy/ 目录
  deleteFileOrDir('.workbuddy');
  
  // 删除内部文档
  for (const entry of fs.readdirSync(ROOT)) {
    if (entry.endsWith('.docx') || entry.endsWith('.xlsx')) {
      deleteFileOrDir(entry);
    }
  }
  
  // 删除 tasks/ 目录
  deleteFileOrDir('tasks');
  
  // 删除 book/ 大纲文件（非 src 内）
  for (const entry of fs.readdirSync(ROOT)) {
    if (entry.startsWith('book-outline') || entry === 'openai-science-overview.md') {
      deleteFileOrDir(entry);
    }
  }
  
  // 删除 zip 文件
  for (const entry of fs.readdirSync(ROOT)) {
    if (entry.endsWith('.zip')) {
      deleteFileOrDir(entry);
    }
  }
}

// ============ Step 5: 删除 research 关联的 public HTML ============

function removeOrphanedHtmls() {
  log('\n📋 Step 5: 清理 research 关联的内部 HTML');
  
  // 检查 public/ai-native-data-team-report.html（这个是研究提案关联的）
  if (fs.existsSync(path.join(ROOT, 'public/ai-native-data-team-report.html'))) {
    deleteFileOrDir('public/ai-native-data-team-report.html');
  }
  
  // 检查 research 中还存在的 htmlVersion 引用
  // 被 Step 1 删除的研究文件的 HTML 已经被清理，这里检查其余 HTML 是否孤立
  const researchDir = path.join(ROOT, 'src/content/research');
  if (!fs.existsSync(researchDir)) return;
  
  const referencedHtmls = new Set();
  for (const file of getAllFiles(researchDir)) {
    const fm = readFrontmatter(file);
    if (fm.htmlVersion) {
      referencedHtmls.add(fm.htmlVersion.replace(/^\//, ''));
    }
  }
  
  // 检查 public/research-html/ 下的文件是否仍被引用
  const htmlDir = path.join(ROOT, 'public/research-html');
  if (fs.existsSync(htmlDir)) {
    for (const entry of fs.readdirSync(htmlDir)) {
      const htmlPath = `research-html/${entry}`;
      if (!referencedHtmls.has(htmlPath)) {
        deleteFileOrDir(`public/${htmlPath}`);
        log(`  → 孤立 HTML 已删除`);
      }
    }
  }
}

// ============ Step 6: 修改 BaseLayout 移除 Umami ============

function removeUmami() {
  log('\n📋 Step 6: 移除 Umami 统计脚本');
  const layoutFile = path.join(ROOT, 'src/layouts/BaseLayout.astro');
  
  if (!fs.existsSync(layoutFile)) return;
  
  let content = fs.readFileSync(layoutFile, 'utf8');
  const original = content;
  
  // 移除 Umami script 标签
  content = content.replace(
    /\s*<script[^>]*maxwell\.woa\.com\/umami[^>]*><\/script>/g,
    ''
  );
  
  if (content !== original) {
    fs.writeFileSync(layoutFile, content, 'utf8');
    modifiedCount++;
    log('  ✏️  已移除 Umami 脚本');
  }
}

// ============ Step 7: 降级同步 API ============

function disableSyncApi() {
  log('\n📋 Step 7: 降级同步 API（GitHub Pages 无后端）');
  
  // ReadingListManager.tsx — 把 fetch 调用替换为抛出提示
  const rlmFile = path.join(ROOT, 'src/components/tools/ReadingListManager.tsx');
  if (fs.existsSync(rlmFile)) {
    let content = fs.readFileSync(rlmFile, 'utf8');
    // 方案：将 fetch('/api/sync-reading-list', ...) 替换为直接 throw
    // 匹配 "const resp = await fetch('/api/sync-reading-list'" 开头的行
    content = content.replace(
      /const resp = await fetch\('\/api\/sync-reading-list',\s*\{[^}]*\}\);/g,
      "throw new Error('同步功能仅在内网版可用');"
    );
    content = content.replace(
      /const resp = await fetch\('\/api\/sync-reading-list'\);/g,
      "throw new Error('同步功能仅在内网版可用');"
    );
    fs.writeFileSync(rlmFile, content, 'utf8');
    modifiedCount++;
    log('  ✏️  ReadingListManager: sync API 已降级');
  }
  
  // bookmarkStore.ts — 禁用同步
  const bmFile = path.join(ROOT, 'src/components/tools/bookmarkStore.ts');
  if (fs.existsSync(bmFile)) {
    let content = fs.readFileSync(bmFile, 'utf8');
    // 替换 syncToServer 和 syncFromServer 函数体
    content = content.replace(
      /export async function syncToServer\(\): Promise<boolean> \{[\s\S]*?\n\}/,
      'export async function syncToServer(): Promise<boolean> {\n  return false; // disabled on GitHub Pages\n}'
    );
    content = content.replace(
      /export async function syncFromServer\(\): Promise<boolean> \{[\s\S]*?\n\}/,
      'export async function syncFromServer(): Promise<boolean> {\n  return false; // disabled on GitHub Pages\n}'
    );
    fs.writeFileSync(bmFile, content, 'utf8');
    modifiedCount++;
    log('  ✏️  bookmarkStore: sync API 已降级');
  }
}

// ============ Step 8: 清理 column 索引中的内网精选系列引用 ============

function cleanColumnIndex() {
  log('\n📋 Step 8: 清理专栏索引页中的不公开系列');
  const indexFile = path.join(ROOT, 'src/pages/column/index.astro');
  
  if (!fs.existsSync(indexFile)) return;
  
  let content = fs.readFileSync(indexFile, 'utf8');
  const original = content;
  
  // 移除不公开系列的 seriesInfo 条目
  const hiddenSeriesNames = ['大模型动态内网精选', '大模型前沿周报'];
  for (const name of hiddenSeriesNames) {
    content = content.replace(
      new RegExp(`["']${name}["']\\s*:\\s*\\{[^}]*\\},?\\s*`, 'g'),
      ''
    );
  }
  
  if (content !== original) {
    fs.writeFileSync(indexFile, content, 'utf8');
    modifiedCount++;
    log('  ✏️  已从专栏索引中移除不公开系列');
  }
}

// ============ Step 9: 移除 Makefile 中的内网相关命令 ============

function cleanMakefile() {
  log('\n📋 Step 9: 清理 Makefile');
  // Makefile 不需要修改，GitHub Pages 不使用它
  // 但为了整洁，移除内网部署相关的 target
  skippedCount++;
  log('  ⏭️  GitHub Actions 不使用 Makefile，跳过');
}

// ============ 主流程 ============

function main() {
  log('🚀 Maxwell 公开版过滤开始');
  log(`   根目录: ${ROOT}\n`);
  
  filterResearch();      // Step 1
  filterColumn();        // Step 2
  cleanInternalLinks();  // Step 3
  removeServerFiles();   // Step 4
  removeOrphanedHtmls(); // Step 5
  removeUmami();         // Step 6
  disableSyncApi();      // Step 7
  cleanColumnIndex();    // Step 8
  cleanMakefile();       // Step 9
  
  log('\n' + '='.repeat(50));
  log(`✅ 过滤完成`);
  log(`   删除: ${deletedCount} 个文件/目录`);
  log(`   修改: ${modifiedCount} 个文件`);
  log(`   跳过: ${skippedCount} 个步骤`);
}

main();
