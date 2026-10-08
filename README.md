# personal-site · 句号的博客与作品集

基于 [Astro 5](https://astro.build) 的静态个人站。**写作后台就是你的 Obsidian**：
成稿放 `05public/`（站点唯一的内容目录），草稿放 `05draft/`。
`05draft/` 不在博客内容仓库的白名单里，**既不上线、也不会被推到 `blog-content` 仓库**。

## 日常使用

### 写一篇新文章

1. 打开 Obsidian，在 `D:\obsidianDataBase\句号资料库\05draft\` 里写草稿（草稿随便写，frontmatter 可以先不全）。
2. 定稿时把文件移到 `D:\obsidianDataBase\句号资料库\05public\`，补齐 frontmatter：

   ```yaml
   ---
   title: 文章标题
   description: 一句话摘要
   pubDate: 2026-10-08
   tags: [LLM, 深度学习]
   ---
   ```

   > 没有 `draft` 字段了：**在不在 `05public/` 就是发不发的唯一开关**。想撤下一篇文章，把它移回 `05draft/` 或删掉即可。

3. 正文正常写 Markdown。Obsidian 的 `[[双链]]` 会自动转成站内链接。
4. 本地预览：`pnpm dev`，浏览器开 http://localhost:4321 。
5. 上线：vault 里 commit + push 到 `blog-content`，再让 Vercel 重新构建（见「部署」）。

### 目录约定

- **`05public/`**：成稿区，也是站点唯一的内容目录。这里所有 `.md` 都会被发布，
  而且**子文件夹层级会变成 URL 的一部分**（`05public/notes/transformer-qkv.md` → `/blog/notes/transformer-qkv/`），
  所以成稿一律直接放在 `05public/` 根目录，不要为了分类再开子目录。
  唯一的例外是规则文件 `AGENTS.md`，它在 `content.config.ts` 里按文件名排除，不是文章。
- **`05draft/`**：草稿区（大纲、素材、半成品）。vault 的 `.gitignore` 是 `/*` + 只放行 `/05public/`，
  所以这个目录天然不进 git、不进 `blog-content`、构建机也读不到。规则见 `05draft/AGENTS.md`。
- 图片：成稿放 `05public/assets/<文章名>/`，草稿放 `05draft/assets/<文章名>/`，
  Markdown 里写**相对路径** `![说明](assets/<文章名>/xxx.png)`。定稿时整个 `assets/<文章名>/` 文件夹跟着 md 一起搬，
  两边目录同层，正文路径一个字都不用改。别用 `![[图片]]`（站点不解析）。

### 本地命令

```bash
pnpm dev       # 本地开发，热更新
pnpm build     # 产出静态文件到 dist/
pnpm preview   # 本地预览构建结果
pnpm sync      # 同步内容集合类型
```

> 自动化环境（AI 助手 / CI / 无 TTY）里别直接 `pnpm build`，pnpm 10+ 的依赖自检会因为没有 TTY 中止：
> 用 `node node_modules/astro/astro.js build`，或设 `CI=true`。详见 `AGENTS.md` 第 3 节。

## 改配置

- **站点标题 / 导航**：`src/layouts/BaseLayout.astro`
- **内容目录**：`src/content.config.ts` 顶部。**不用手填**——它按候选顺序自动找第一个有 markdown 的目录：
  `VAULT_PUBLIC` 环境变量 → 本地 vault 的 `05public/` → `./content/05public/` → `./content/`；
  每个候选都会先试它下面的 `05public/` 再试它自己，所以环境变量写 `./content` 或 `./content/05public` 都能跑。
  构建日志里搜 `[content] 内容目录:` 就能看到这次实际用的是哪个。
- **主题色**：`src/styles/global.css` 顶部 `:root` 变量
- **代码高亮主题**：`astro.config.mjs` 里 `shikiConfig.theme`（可选 `github-light` / `dracula` / `min-dark` 等）
- **网站域名**：`astro.config.mjs` 里 `site` 字段

## 加项目到作品集

编辑 `src/pages/projects/index.astro`，复制一个 `<div class="card">` 改内容即可。

## 部署（Vercel）

线上：https://fullstop113.com ，项目 `personal-site`，框架预设 Astro，输出目录 `dist`。

内容不在站点仓库里，所以**构建命令要先把内容拉下来，再构建**，例如：

```bash
git clone --depth 1 https://github.com/fullstop113/blog-content.git content && pnpm build
```

配套的环境变量（Vercel 左侧菜单 **Environment Variables**）：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `VAULT_PUBLIC` | `./content/05public` | 指向 clone 出来的内容目录；写 `./content` 也认（代码会自动下钻找 `05public/`）。本地开发不用设。 |

> 这两项都在 Vercel 面板里，不在仓库里：**Build Command** 在 Settings → Build and Deployment，
> **Environment Variables** 在左侧项目菜单直接就能看到。改完要 Redeploy 才生效。

- 内容更新后：vault 里 commit + push `blog-content` → 在 Vercel 触发重新部署（可以配 Deploy Hook）。
- ⚠️ `blog-content` 是**公开仓库**：草稿只放 `05draft/`，它不在 `.gitignore` 白名单里，不会被推上去。
- 上线前检查：本地 `node node_modules/astro/astro.js build` exit 0，`dist/blog/` 下的文章数符合预期。

## 当前状态

- [x] Astro 5 工程骨架
- [x] 内容源：vault 的 `05public/`（成稿），草稿区 `05draft/` 物理隔离
- [x] 内容目录自动探测（本地 vault / CI 形态都能跑，见「改配置」）
- [x] Obsidian `[[双链]]` 自动转换
- [x] KaTeX 数学公式（`remark-math` + `rehype-katex`）
- [x] 本地图片优化（sharp，相对路径 → `/_astro/*.webp`）
- [x] 首页 / 博客列表 / 文章详情 / 标签云 / 标签页 / 项目占位
- [x] 暗色模式自动跟随系统
- [x] Vercel 上线（fullstop113.com）
- [ ] RSS 订阅
- [ ] 自动拉 GitHub 项目列表
