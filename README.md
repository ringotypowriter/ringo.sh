# ringo.sh

个人网站，使用 Astro 构建。

## WIP 功能

被标记为 `wip: true` 的 markdown 文件会在内容集合中被自动忽略，不会出现在网站任何地方。

在 markdown 文件的 frontmatter 中添加：
```yaml
---
title: "你的标题"
date: 2025-12-07T18:30:00+08:00
description: "描述"
wip: true  # 添加这行来标记为工作进行中
---
```

这样该内容就不会在以下页面显示：
- 首页的最新 snippets 列表
- `/snippets` 页面
- 单独的 snippet 页面

## 🚀 Project Structure

```text
/
├── public/                    # 静态资源
│   └── favicon.svg
│   └── logo.png
├── src/
│   ├── assets/               # 项目资源
│   ├── components/           # 可复用 UI 组件 (Astro/React)
│   ├── content/              # 内容集合
│   │   └── snippets/         # Snippet 文章
│   ├── layouts/              # 共享页面布局
│   ├── lib/                  # 工具函数和共享逻辑
│   ├── pages/                # 顶层页面和路由
│   └── styles/               # 全局样式和 Tailwind 配置
├── scripts/                  # 项目脚本
│   └── new-snippet.ts        # 创建新 snippet 的脚本
├── astro.config.mjs          # Astro 配置文件
├── package.json              # 项目依赖和脚本
├── tsconfig.json             # TypeScript 配置
├── wrangler.toml             # Cloudflare Workers 配置
└── .env                      # 环境变量
```

## 🧞 Commands

所有命令都在项目根目录下运行：

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | 安装依赖                                        |
| `bun run dev`             | 启动本地开发服务器 (`localhost:4321`)            |
| `bun run build`           | 构建生产版本到 `./dist/`                        |
| `bun run preview`         | 本地预览构建结果                                |
| `bun run scripts/new-snippet.ts` | 创建新的 snippet 文章                    |

## 📝 Content Management

### 添加新的 Snippet

使用脚本创建新的 snippet：
```bash
bun run new --title="你的标题"
```

这会在 `src/content/snippets/` 目录下生成新的 markdown 文件，然后你可以编辑生成的文件。

### Snippet Frontmatter

每个 snippet 需要包含以下 frontmatter：
```yaml
---
title: "标题"
description: "描述"
date: 2025-12-07T18:30:00+08:00
---
```

## 🎨 Development

- 使用 TypeScript 编写代码
- 组件使用 PascalCase 命名
- 工具函数使用 camelCase 命名
- 保持代码简洁，遵循现有代码风格

## 📦 Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: Tailwind CSS
- **Content**: Markdown with frontmatter
- **Deployment**: Cloudflare Pages
- **Package Manager**: Bun

## 👀 Want to learn more?

- [Astro 文档](https://docs.astro.build)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)