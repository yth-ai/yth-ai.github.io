---
title: "Nginx 反代五连坑"
description: "在一台已有静态站的服务器上把 Umami 挂到子路径，踩了五个坑。每个坑的症状几乎一样——空白或 404——但根因完全不同。部署的难度不在单个组件，而在组件之间的语义缝隙。"
principle: "部署问题的根因几乎总是「层与层之间的语义缝隙」——每个组件的文档都是对的，但没人告诉你它们组合时会在哪里断裂。"
date: 2026-03-29
tags: ["部署", "Nginx", "Docker", "Next.js", "隐性知识", "系统边界"]
---

这篇笔记来自一个下午的真实经历：在一台跑着 Nginx 静态站的 Linux 服务器上，把 Umami（开源网站统计工具）部署到 `/umami` 子路径。

任务描述起来一句话就够了。实际踩了五个坑，每个坑的表面症状都差不多——页面空白、404、无限重定向——但根因完全不同。

---

## 第一坑：构建时冻结的配置，运行时改不了

Umami 是 Next.js 应用。要挂在 `/umami` 子路径，需要配置 Next.js 的 `basePath`。直觉做法是在 `docker-compose.yml` 的 `environment` 里传入：

```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:latest
    environment:
      BASE_PATH: /umami
```

启动后打开页面——空白。HTML 返回了，但所有 JS/CSS 引用的是 `/_next/static/xxx.js`，没有 `/umami` 前缀，全部 404。

**根因：Next.js 的 `basePath` 是构建时配置，不是运行时环境变量。** 官方预编译镜像在构建时 `basePath` 为空，已经硬编码进产物了。运行时传 `BASE_PATH` 环境变量，Next.js 根本不看。

这个陷阱之所以容易踩，是因为绝大多数人对环境变量的心智模型是"运行时配置"。但现代前端框架（Next.js、Nuxt、Vite）的路由和路径配置，很多是在 `build` 阶段冻结的。

正确做法是从源码构建，在构建时注入：

```yaml
services:
  umami:
    build:
      context: https://github.com/umami-software/umami.git#master
      args:
        BASE_PATH: /umami   # 构建时注入
```

Umami 的 Dockerfile 里有 `ARG BASE_PATH`，`next build` 时会写进 `next.config.js`。这样产物里所有资源路径都带 `/umami` 前缀。

---

## 第二坑：一个斜杠的语义分裂

解决了 BASE_PATH 后，配 Nginx 反代。试了两种写法：

```nginx
# 写法 A：proxy_pass 带尾斜杠
location /umami/ {
    proxy_pass http://127.0.0.1:3000/;
}

# 写法 B：proxy_pass 不带尾斜杠
location /umami {
    proxy_pass http://127.0.0.1:3000;
}
```

写法 A：页面返回了，但 Umami 不知道自己在 `/umami` 下，内部链接全部跳到根路径。写法 B 才对，但当时没理解为什么。

**根因是 Nginx `proxy_pass` 的一条精确规则：**

- **带 URI**（哪怕只是一个 `/`）：Nginx 剥掉匹配到的 location 前缀，把剩余部分拼到 proxy_pass 的 URI 后面。`/umami/login` → 剥掉 `/umami/` → 转发到 `http://127.0.0.1:3000/login`。后端收到的是 `/login`，不知道自己在子路径下。
- **不带 URI**：Nginx 把完整的原始请求 URI 原样转发。`/umami/login` → 转发到 `http://127.0.0.1:3000/umami/login`。后端收到 `/umami/login`，和 BASE_PATH 匹配。

`proxy_pass` 后面有没有那一个 `/`，语义完全不同。这违反"斜杠只是格式"的日常直觉，但它确实是 Nginx 文档里白纸黑字写的规则。

---

## 第三坑：两层路由同时改写 = 无限循环

发现写法 A 不对后，我没有直接换成写法 B，而是试了一个"聪明"的方案——用精确匹配处理无尾斜杠的情况：

```nginx
location = /umami {
    return 301 /umami/;
}

location /umami/ {
    proxy_pass http://127.0.0.1:3000/umami/;
}
```

结果：无限重定向，浏览器转圈转死。

问题出在第二条规则。`proxy_pass` 带了 URI `/umami/`，所以 Nginx 会做路径改写：剥掉 `/umami/` 前缀再转发。但 Umami 配了 `BASE_PATH=/umami`，收到没有 `/umami` 前缀的请求时会 308 重定向回 `/umami/xxx`。Nginx 再把 `/umami` 剥掉转发，Umami 再重定向——死循环。

**这是两层路由同时改写路径时的经典冲突**：Nginx 在往一个方向改，应用在往另一个方向改，谁也不肯让步。

教训很清楚：当反代后面的应用自己有路由逻辑（Next.js、Django、Rails 都有），Nginx 层应该尽量**透传**，不做二次改写。两层都在改路径，就像两个人同时编辑同一段文字，必出冲突。

---

## 第四坑：`/umami` 和 `^~ /umami`，两个字符差两个优先级

前三个坑解决后，Umami 的 HTML 终于正常返回了。但页面还是空白——JS/CSS 全部 404。

浏览器 Network 面板里，`/umami/_next/static/chunks/xxx.js` 这些请求返回的是主站的 404 页面。这些路径确实以 `/umami` 开头，应该被反代规则匹配才对。

但 Nginx 配置里还有一条已有规则：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    root /var/www/maxwell;
    expires 30d;
}
```

这是给主站静态资源用的正则规则——匹配所有 `.js`、`.css` 结尾的请求。`/umami/_next/static/xxx.js` 同时匹配了 `location /umami`（前缀匹配）和这条正则。Nginx 选了正则。

**因为 Nginx 的 location 优先级是：精确匹配 `=` > 前缀阻断 `^~` > 正则 `~`/`~*` > 普通前缀。** 我的 `location /umami` 是普通前缀匹配——优先级最低。正则规则排在它前面。

修复只需要两个字符：把 `location /umami` 改成 `location ^~ /umami`。`^~` 的含义是"如果这个前缀匹配命中了，不再去查正则匹配"，优先级直接跳到正则之上。

```nginx
location ^~ /umami {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

"看起来匹配了"和"实际被选中了"是两回事。当你发现"加了一条规则但没生效"，问题往往不是规则写错了，而是有另一条规则的优先级更高。

---

## 第五坑：Docker Desktop ≠ Docker Engine

以上四个坑都是 Nginx 层面的。但在它们之前，还有一个更基础的问题：服务器上 `docker compose` 命令不存在。

```bash
$ docker compose version
docker: 'compose' is not a docker command.
```

Docker Engine 和 Docker Compose 是两个独立的软件。Mac/Windows 上的 Docker Desktop 自带 compose 插件，但 Linux 服务器装的是 Docker Engine，不包含。

这类问题的根源是**开发环境的默认配置创造了虚假的安全感**。你在本地"docker compose up"跑得好好的，到服务器上发现命令都不存在。部署前先验证每个工具是否存在，不要假设。

---

## 五个坑，一个模式

回头看，这五个坑没有一个涉及"困难的技术"。每个单独拎出来，都是文档里写了的知识点。但它们叠在一起时 debug 变得极其痛苦，原因是：

**症状趋同，根因各异。** 五个坑中四个的症状都是"空白或 404"。不可能通过症状判断根因——必须理解每一层的行为。

**语义缝隙存在于层与层之间。** Next.js 对 basePath 的理解（构建时冻结）≠ Docker 对 environment 的理解（运行时注入）。Nginx 对尾斜杠的解读 ≠ 你直觉上的"有没有斜杠不重要"。每个组件的文档都是按自己的逻辑写的，没人告诉你它们组合时会在哪里断裂。

**每一步的"修好了"都是幻觉。** 改完配置、reload、刷新、看到页面有变化，以为好了，其实只是从一个坑跳到了下一个。部署问题的反馈循环天然比代码 bug 更长——改配置 → 重启服务 → 清缓存 → 刷新 → 等结果——每多一步延迟，就多一份误判。

最后贴一下五轮试错后的最终配置：

**docker-compose.yml**：
```yaml
services:
  umami:
    build:
      context: https://github.com/umami-software/umami.git#master
      args:
        BASE_PATH: /umami
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      DATABASE_URL: postgresql://umami:password@db:5432/umami
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: password
    volumes:
      - umami-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami"]
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  umami-db:
```

**nginx.conf 关键部分**：
```nginx
# 主站静态资源（正则匹配）
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}

# Umami 反代（^~ 阻止正则抢先，proxy_pass 不带 URI 保持透传）
location ^~ /umami {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

部署是一门关于"多个系统如何在边界处握手"的学问。每个系统在自己的文档里都是对的，但文档没覆盖的那些缝隙——构建时 vs 运行时、有斜杠 vs 没斜杠、前缀匹配 vs 正则匹配——就是坑。

唯一靠谱的方法是每修一步就验证一步，不要一次改三个配置然后祈祷。

*这个经历后来被设计成了一道 Agent 评测任务（Terminal-Bench 格式），用于测试 AI Agent 的 DevOps 能力。我猜大部分 Agent 也会栽在同样的地方——尤其是第四坑，`^~` 修饰符的优先级规则藏在文档深处，不是搜索"Nginx reverse proxy"能直接命中的知识。*
