# personal-site · 句号的博客与作品集

基于 [Astro 5](https://astro.build) 的静态个人站。**写作后台就是你的 Obsidian**，
只收录 `05public/` 白名单文件夹里的笔记，其他笔记物理隔离，不会被发布。

## 日常使用

### 写一篇新文章

1. 打开 Obsidian，在 `D:\obsidianDataBase\句号资料库\05public\` 下新建 `.md`。
2. 文件顶部写 frontmatter：

   ```yaml
   ---
   title: 文章标题
   description: 一句话摘要（可选）
   pubDate: 2026-10-01
   tags: [Java, Web3]
   draft: false        # true = 不发布，仅本地可见
   ---
   ```

3. 正文正常写 Markdown。Obsidian 的 `[[双链]]` 会自动转成站内链接。
4. 本地预览：`pnpm dev`，浏览器开 http://localhost:4321 。

### 目录约定

- `05public/` 下的所有 `.md` 都会被发布，**子文件夹层级会变成 URL 的一部分**。
  比如 `05public/notes/transformer-qkv.md` → `/blog/notes/transformer-qkv/`。
- 不在 `05public/` 里的笔记，Astron 根本读不到，天然安全。
- 图片建议：放到 `05public/assets/` 里，Markdown 里写 `![](assets/xxx.png)`。
  （Obsidian 的 `![[图片]]` 嵌入语法 v1 暂只保留文本，后续可扩展。）

### 本地命令

```bash
pnpm dev       # 本地开发，热更新
pnpm build     # 产出静态文件到 dist/
pnpm preview   # 本地预览构建结果
```

## 改配置

- **站点标题 / 导航**：`src/layouts/BaseLayout.astro`
- **白名单路径**：`src/content.config.ts` 顶部 `VAULT_PUBLIC`
- **主题色**：`src/styles/global.css` 顶部 `:root` 变量
- **代码高亮主题**：`astro.config.mjs` 里 `shikiConfig.theme`（可选 `github-light` / `dracula` / `min-dark` 等）
- **网站域名**：`astro.config.mjs` 里 `site` 字段，部署后改成你的 URL（RSS / sitemap 会用到）

## 加项目到作品集

编辑 `src/pages/projects/index.astro`，复制一个 `<div class="card">` 改内容即可。
后续如果想自动拉 GitHub 仓库列表，告诉我，我帮你接 GitHub API。

## 部署（二选一）

### A. Vercel / Netlify（最简单）

1. `git init && git add . && git commit -m "init"`
2. 推到 GitHub 私有或公开仓库。
3. Vercel / Netlify 导入该仓库，Framework 选 Astro，build 命令 `pnpm build`，输出目录 `dist`。
4. 注意：构建机读不到你 D 盘的 Obsidian vault。**需要把 `05public/` 里的 md 同步进仓库**，
   或者用 Obsidian Git 插件自动同步 `05public/` 子目录。

### B. GitHub Pages

1. `astro.config.mjs` 里把 `site` 改成 `https://<用户名>.github.io`。
2. 推到 GitHub 仓库 `<用户名>.github.io`。
3. 加 GitHub Actions（需要时我帮你写）跑 `pnpm build` 并发布 `dist/`。

> **关键提醒**：因为内容在你本地 D 盘，部署前必须把 `05public/` 里的文章同步到 git 仓库。
> 推荐在 Obsidian 装 `obsidian-git` 插件，只跟踪 `05public/` 子目录，写完自动 commit/push。

## 当前状态

- [x] Astro 5 工程骨架
- [x] 内容源指向 `D:/obsidianDataBase/句号资料库/05public/`
- [x] Obsidian `[[双链]]` 自动转换
- [x] 首页 / 博客列表 / 文章详情 / 标签云 / 标签页 / 项目占位
- [x] 暗色模式自动跟随系统
- [ ] RSS 订阅
- [ ] 自动拉 GitHub 项目列表
- [ ] 图片资源管线（处理 `![[图片]]` 嵌入）
- [ ] 部署 CI
