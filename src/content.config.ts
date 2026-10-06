import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { pathToFileURL } from 'node:url';

/**
 * 内容集合：直接读取 Obsidian vault 里的白名单文件夹。
 *
 * 定位策略（本地 vs 线上）：
 * - 本地开发：不设环境变量，默认读 D 盘 Obsidian 绝对路径（零配置）
 * - 线上构建：CI 里把 blog-content 仓库 clone 到某目录（如 ./content/），
 *   并设置环境变量 VAULT_PUBLIC 指向它，例如 VAULT_PUBLIC=./content/
 */
const VAULT_PUBLIC = pathToFileURL(
  process.env.VAULT_PUBLIC ?? 'D:/obsidianDataBase/句号资料库/05public/',
).href;

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: VAULT_PUBLIC,
  }),
  schema: z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    pubDate: z.coerce.date().nullish(),
    updated: z.coerce.date().nullish(),
    tags: z.array(z.string()).nullish().default([]),
    draft: z.boolean().nullish().default(false),
    excerpt: z.string().nullish(),
  }),
});

export const collections = { blog };
