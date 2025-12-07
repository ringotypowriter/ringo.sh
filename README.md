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

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
