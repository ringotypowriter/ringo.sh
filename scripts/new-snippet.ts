#!/usr/bin/env bun

/**
 * 快速创建新的 snippet 文章
 * 用法: bun run new:snippet --title="你的标题"
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

// 解析命令行参数
const args = process.argv.slice(2);
const titleArg = args.find(arg => arg.startsWith('--title='));

if (!titleArg) {
    console.error('❌ 错误：必须提供 --title 参数');
    console.log('用法: bun run new:snippet --title="你的标题"');
    process.exit(1);
}

const title = titleArg.split('=')[1]?.replace(/^["']|["']$/g, '');

if (!title) {
    console.error('❌ 错误：标题不能为空');
    process.exit(1);
}

// 生成当天日期 (YYYY-MM-DD 格式)
const today = new Date();
const date = today.toISOString().split('T')[0];

// 生成 slug（文件名）
// 将标题转换为小写，替换空格和特殊字符为连字符
const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')      // 空格替换为连字符
    .replace(/-+/g, '-')       // 多个连字符合并为一个
    .trim();

// 生成 frontmatter 内容
const content = `---
title: "${title}"
date: ${date}
description: ""
---

在这里开始写你的内容...
`;

// 文件路径
const filePath = join(process.cwd(), 'src', 'content', 'snippets', `${slug}.md`);

try {
    await writeFile(filePath, content, 'utf-8');
    console.log('✅ 文章创建成功！');
    console.log(`📝 标题: ${title}`);
    console.log(`📅 日期: ${date}`);
    console.log(`📄 文件: src/content/snippets/${slug}.md`);
} catch (error) {
    console.error('❌ 创建文件失败:', error);
    process.exit(1);
}
