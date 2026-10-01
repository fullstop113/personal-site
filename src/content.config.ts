import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { pathToFileURL } from 'node:url';

/**
 * 内容集合：直接读取 Obsidian vault 里的白名单文件夹。
 * 改路径只需改这里。Astro 的 glob loader 要求 base 是 file:// URL。
 */
const VAULT_PUBLIC = pathToFileURL(
  'D:/obsidianDataBase/句号资料库/05public/',
).href;

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: VAULT_PUBLIC,
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
    excerpt: z.string().optional(),
  }),
});

export const collections = { blog };
