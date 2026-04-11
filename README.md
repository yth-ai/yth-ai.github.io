# Maxwell

个人综合数字平台 — 文档 / 工具 / 博客

基于 [Astro](https://astro.build) 构建，默认输出静态 HTML，性能极佳。支持 Markdown/MDX 内容管理、React 交互组件、暗色模式，以及通过 Git 轮询自动部署到自有服务器。

## 特性

- **文档报告区**：展示 AI 模型生成的研究报告、技术文档，支持 Markdown 渲染、代码高亮、目录导航
- **在线工具区**：承载交互式代码小工具（JSON 格式化、正则测试、Base64 编解码等）
- **博客知识库**：个人博客文章发布，支持分类、标签筛选
- **暗色模式**：支持亮/暗主题自动切换
- **自动部署**：`git push` 后服务器自动检测并构建部署

## 技术栈

- **框架**: Astro 5.x（静态站点生成 + Islands Architecture）
- **交互层**: React 18 + TypeScript
- **样式**: Tailwind CSS 3.x
- **代码高亮**: Shiki（Astro 内置）

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 或
make dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

### 添加内容

Maxwell 有三种内容类型：**文档**、**博客**、**工具**。添加内容只需要创建文件，不需要修改任何配置。

---

#### 方式一：用命令快速创建（推荐）

```bash
# 创建一篇新文档（会自动填好日期和模板）
make new-doc TITLE="Docker部署指南"

# 创建一篇新博客
make new-post TITLE="我对大模型的一些思考"
```

运行后会在对应目录下生成一个 `.md` 文件，打开编辑正文即可。

---

#### 方式二：手动创建 Markdown 文件

**添加文档**：在 `src/content/docs/` 目录下创建任意 `.md` 文件，文件名即 URL 路径。

例如创建 `src/content/docs/docker-guide.md`，访问地址为 `/docs/docker-guide`：

```markdown
---
title: "Docker 部署指南"
description: "从零开始用 Docker 部署 Web 应用的完整教程"
date: 2026-03-21
category: "技术文档"
tags: ["Docker", "部署", "运维"]
draft: false
---

这里写正文，支持完整的 Markdown 语法。

## 二级标题会自动出现在右侧目录

正文中可以使用 **加粗**、`代码`、[链接](https://example.com) 等。

### 代码块也有语法高亮

```python
print("Hello Maxwell")
```​

> 引用块也支持

| 表头1 | 表头2 |
|-------|-------|
| 内容  | 内容  |
```

**文档 frontmatter 字段说明：**

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `title` | ✅ | 文档标题 | `"Docker 部署指南"` |
| `description` | 否 | 简介，显示在列表卡片上 | `"从零开始部署..."` |
| `date` | ✅ | 发布日期，用于排序 | `2026-03-21` |
| `category` | 否 | 分类，默认 `"技术文档"` | `"研究报告"` |
| `tags` | 否 | 标签数组 | `["Docker", "部署"]` |
| `draft` | 否 | 设为 `true` 则不会显示 | `true` |

---

**添加博客**：在 `src/content/blog/` 目录下创建 `.md` 文件。

例如创建 `src/content/blog/my-thoughts-on-llm.md`，访问地址为 `/blog/my-thoughts-on-llm`：

```markdown
---
title: "我对大模型的一些思考"
description: "关于 LLM 在实际工程中的应用体验和反思"
date: 2026-03-21
tags: ["AI", "LLM", "思考"]
---

正文内容...
```

**博客 frontmatter 字段说明：**

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `title` | ✅ | 文章标题 | `"我对大模型的一些思考"` |
| `description` | 否 | 简介 | `"关于 LLM..."` |
| `date` | ✅ | 发布日期 | `2026-03-21` |
| `tags` | 否 | 标签数组，会在列表页生成标签云 | `["AI", "LLM"]` |
| `draft` | 否 | 设为 `true` 则不会显示 | `true` |

---

#### 添加新工具

工具是 React 交互组件，需要创建 3 个文件：

**第一步**：在 `src/components/tools/` 下创建 React 组件，例如 `UrlEncoder.tsx`：

```tsx
import { useState } from 'react';

export default function UrlEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入文本..."
        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        rows={4}
      />
      <div className="flex gap-2">
        <button
          onClick={() => setOutput(encodeURIComponent(input))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          编码
        </button>
        <button
          onClick={() => setOutput(decodeURIComponent(input))}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          解码
        </button>
      </div>
      <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">{output}</pre>
    </div>
  );
}
```

**第二步**：在 `src/pages/tools/` 下创建页面 `url-encoder.astro`：

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import UrlEncoder from '../../components/tools/UrlEncoder.tsx';
---

<BaseLayout title="URL 编解码" description="URL 编码/解码工具">
  <div class="max-w-3xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold mb-8">URL 编解码</h1>
    <UrlEncoder client:load />
  </div>
</BaseLayout>
```

**第三步**：打开 `src/pages/tools/index.astro`，在工具列表数组中添加一项：

```javascript
{ name: 'URL 编解码', description: 'URL 编码与解码转换', href: '/tools/url-encoder', icon: '🔗' }
```

---

#### 发布流程

内容写好后，推送到 Git 即可（服务器配好后会自动部署）：

```bash
# 方式一：用 make 快捷命令
make push

# 方式二：手动 git
git add -A && git commit -m "添加: Docker部署指南" && git push
```

#### 小贴士

- 文件名建议用**英文短横线**（如 `docker-guide.md`），它会直接变成 URL 路径
- `draft: true` 的文章不会出现在列表和首页，适合写到一半暂存
- 图片放在 `public/images/` 下，正文中用 `![alt](/images/xxx.png)` 引用
- 首页会自动聚合最新的 3 篇文档和 3 篇博客，无需手动配置

## 部署到自有服务器

### 方式一：一键初始化（推荐）

在服务器上运行：

```bash
# 1. 编辑配置
export REPO_URL="git@git.woa.com:maxwellyu/maxwell.git"
export PROJECT_DIR="/opt/maxwell"
export WEB_DIR="/var/www/maxwell"

# 2. 运行初始化脚本
bash server/setup.sh
```

脚本会自动完成：安装 Node.js、Git → 克隆项目 → 安装依赖 → 首次构建 → 启动守护进程 → 配置 crontab 保活。

### 方式二：手动配置

1. **克隆项目到服务器**

```bash
git clone git@git.woa.com:maxwellyu/maxwell.git /opt/maxwell
cd /opt/maxwell
npm install && npm run build
```

2. **配置 Nginx**（参考 `server/nginx.conf.example`）

```bash
sudo cp server/nginx.conf.example /etc/nginx/sites-available/maxwell
# 编辑 server_name 为你的域名
sudo ln -s /etc/nginx/sites-available/maxwell /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

3. **启动部署守护进程**

```bash
chmod +x server/deploy.sh

# 启动（默认每 3 秒轮询 Git）
bash server/deploy.sh start

# 自定义轮询间隔（如 5 秒）
POLL_INTERVAL=5 bash server/deploy.sh start

# 其他操作
bash server/deploy.sh status    # 查看状态
bash server/deploy.sh stop      # 停止
bash server/deploy.sh restart   # 重启
```

4. **配置 crontab 保活**（可选，防止进程意外退出）

```bash
crontab -e
# 添加: * * * * * cd /opt/maxwell && bash server/deploy.sh status >/dev/null 2>&1 || bash server/deploy.sh start
```

### 部署流程

```
本地 git push → 守护进程每 3 秒检查 → 检测到新提交 → git pull → npm run build → rsync 到 Nginx 目录
```

## 项目结构

```
maxwell/
├── public/              # 静态资源
├── src/
│   ├── components/      # UI 组件
│   │   ├── BaseHead.astro
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   └── tools/       # React 交互工具组件
│   ├── content/         # Markdown 内容
│   │   ├── config.ts    # 内容 Schema 定义
│   │   ├── docs/        # 文档报告
│   │   └── blog/        # 博客文章
│   ├── layouts/         # 布局模板
│   ├── pages/           # 路由页面
│   │   ├── index.astro  # 首页
│   │   ├── docs/        # 文档模块
│   │   ├── blog/        # 博客模块
│   │   └── tools/       # 工具模块
│   └── styles/          # 样式
├── server/              # 服务器部署脚本
│   ├── deploy.sh        # 自动部署脚本
│   ├── setup.sh         # 服务器初始化
│   ├── nginx.conf.example
│   └── cron.example
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── Makefile
```

## License

MIT
