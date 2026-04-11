.PHONY: dev build preview clean

# 自动检测 node 路径
NODE := $(or $(shell which node 2>/dev/null),$(firstword $(wildcard $(HOME)/.workbuddy/binaries/node/versions/*/bin/node)))

# 本地开发
dev:
	npx astro dev

# 构建生产版本
build:
	npx astro build

# 本地预览构建结果
preview:
	npx astro preview

# 清理构建产物
clean:
	rm -rf dist .astro

# 一键推送（触发服务器自动部署）
push:
	git add -A && git commit -m "update" && git push

# 推送到 GitHub Pages（orphan commit，无历史）
push-github:
	@echo "🚀 推送到 GitHub（无历史）..."
	@TMPDIR=$$(mktemp -d) && \
	rsync -a --exclude='.git' --exclude='node_modules' ./ $$TMPDIR/repo/ && \
	cd $$TMPDIR/repo && \
	$(NODE) scripts/filter-public.mjs && \
	rm -rf .workbuddy .codebuddy server tasks && \
	rm -f *.docx *.xlsx *.zip *.jpg book-outline*.md openai-science-overview.md && \
	find . -maxdepth 1 -name '*.html' -delete && \
	rm -rf 数据珠玑 涌现 llm_book && \
	git init && \
	git checkout -b main && \
	git add -A && \
	git commit -m "site update $$(date +%Y-%m-%d)" && \
	git remote add github https://github.com/yth-ai/yth-ai.github.io.git && \
	git push github main --force && \
	rm -rf $$TMPDIR && \
	echo "✅ 推送完成（GitHub 仅保留最新一个 commit）"

# 一键推送到内网 + GitHub
push-all:
	git add -A && git commit -m "update" && git push
	@$(MAKE) push-github

# 快速创建新文档
# 用法: make new-doc TITLE="我的文档"
new-doc:
	@echo '---' > "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'title: "$(or $(TITLE),新文档)"' >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'description: ""' >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo "date: $$(date +%Y-%m-%d)" >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'category: "技术文档"' >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'tags: []' >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo '---' >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo '' >> "src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo "文档已创建: src/content/docs/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"

# 快速创建新博客
# 用法: make new-post TITLE="我的博客"
new-post:
	@echo '---' > "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'title: "$(or $(TITLE),新文章)"' >> "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'description: ""' >> "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo "date: $$(date +%Y-%m-%d)" >> "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo 'tags: []' >> "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo '---' >> "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo '' >> "src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
	@echo "文章已创建: src/content/blog/$$(date +%Y%m%d)-$(or $(TITLE),untitled).md"
