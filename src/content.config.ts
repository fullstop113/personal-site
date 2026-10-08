import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import type { Dirent } from 'node:fs';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 内容目录：自动在候选位置里挑第一个「真的有 markdown」的目录。
 *
 * 目录约定（配合 vault 的 `05public/` + `05draft/` 拆分）：
 * - vault 的 `05public/` = 成稿区,也是**站点唯一的内容目录**（本地零配置就走这里）；
 * - vault 的 `05draft/` = 草稿区：不在博客内容仓库里（vault 的 .gitignore 只放行 05public），
 *   所以构建机永远看不到它 —— 草稿与成稿靠文件夹隔离,**没有 `draft` 字段**；
 * - 线上构建（Vercel）：把 `blog-content` 仓库 clone 到项目里,仓库根就是 `05public/`。
 *
 * 候选顺序见 CANDIDATES。每个候选先试它下面的 `05public/` 再试它自己,
 * 所以环境变量 `VAULT_PUBLIC` 写 `./content` 或 `./content/05public` 都能跑对,
 * 真正用的是哪个目录会打进构建日志（搜 `[content]`）。
 */

const MD_FILE = /\.mdx?$/i;
const SKIP_DIRS = new Set(['node_modules', '.git', '.astro', 'dist', 'assets']);

/** 目录里（含最多 3 层子目录）有没有 markdown 文件。 */
function hasMarkdown(dir: string, depth = 3): boolean {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  if (entries.some((entry) => entry.isFile() && MD_FILE.test(entry.name))) return true;
  if (depth <= 0) return false;
  return entries.some(
    (entry) =>
      entry.isDirectory() && !SKIP_DIRS.has(entry.name) && hasMarkdown(path.join(dir, entry.name), depth - 1),
  );
}

const VAULT_DEFAULT = 'D:/obsidianDataBase/句号资料库/05public/';

const CANDIDATES: (string | undefined)[] = [
  process.env.VAULT_PUBLIC, // 显式指定优先（Vercel 上的环境变量就是它）
  VAULT_DEFAULT, // 本地：Obsidian vault 的白名单目录
  './content/05public/', // CI：blog-content 仓库根就是 05public/
  './content/', // CI：内容已被平铺进 ./content/
];

function resolveContentDir(): string {
  const tried: string[] = [];
  for (const candidate of CANDIDATES) {
    if (!candidate) continue;
    const absolute = path.resolve(candidate);
    tried.push(absolute);
    for (const dir of [path.join(absolute, '05public'), absolute]) {
      if (existsSync(dir) && hasMarkdown(dir)) return dir;
    }
  }
  console.warn(
    `[content] 没找到任何含 markdown 的内容目录,退回默认值。试过:\n  ${tried.join('\n  ')}`,
  );
  return path.resolve(process.env.VAULT_PUBLIC ?? VAULT_DEFAULT);
}

const CONTENT_DIR = resolveContentDir();
console.log(`[content] 内容目录: ${CONTENT_DIR}`);

const blog = defineCollection({
  loader: glob({
    /**
     * 只有文章进集合:`AGENTS.md` 这类规则文件按文件名排除,所以它**不需要**任何
     * frontmatter 字段来"藏起来"。
     *
     * 注:排除在构建时严格生效;`astro dev` 里边跑边改 `AGENTS.md` 时,热更新的
     * 匹配用的是 picomatch 的数组模式(取反不生效),可能把它临时收进 dev 的集合,
     * 重启 dev 即恢复 —— 不影响 `astro build` 的产物。
     */
    pattern: ['**/*.{md,mdx}', '!**/AGENTS.md'],
    base: pathToFileURL(CONTENT_DIR).href,
  }),
  schema: z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    pubDate: z.coerce.date().nullish(),
    updated: z.coerce.date().nullish(),
    tags: z.array(z.string()).nullish().default([]),
    excerpt: z.string().nullish(),
  }),
});

export const collections = { blog };
