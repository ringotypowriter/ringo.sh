// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { remarkGithubCard } from './src/lib/remark-github-card.ts';
import { rehypeObsidianImage } from './src/lib/rehype-obsidian-image.ts';
import remarkCopyLinkedFiles from 'remark-copy-linked-files';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    remarkPlugins: [
      // 处理标准 markdown 图片语法
      [remarkCopyLinkedFiles, {
        destinationDir: './public/images/content',
        keepOriginalName: true,
        // 只处理图片文件
        filter: (/** @type {string} */ url) => {
          // 跳过远程图片和已经在 public 目录的图片
          if (url.startsWith('http') || url.startsWith('/')) {
            return false;
          }
          // 只处理图片文件
          return /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url);
        },
        // 自定义路径处理
        url: (/** @type {string} */ url) => {
          // 将相对路径转换为绝对路径
          return `/images/content/${url}`;
        }
      }],
      remarkGithubCard,
    ],
    rehypePlugins: [
      // 处理 Obsidian 的 ![[image]] 语法
      rehypeObsidianImage,
    ],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
