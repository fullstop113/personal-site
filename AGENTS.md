# personal-site 站点规则

> 这是 **Astro 博客站本身**的开发规则。文章内容怎么写,看 vault 里的 `05public/AGENTS.md`;本文件只管站点代码、构建和部署。
> 动这个项目之前先读完本文件,尤其是第 4、5 节——那两个坑已经踩过,别再猜。

## 1. 这个项目是什么

Astro 5 静态站点(博客 + 作品集),线上地址 https://fullstop113.com。
**内容不在这个仓库里**:本地直接读 Obsidian vault 的 `05public/`(成稿区);线上读构建时 clone 到 `content/` 的 `blog-content` 仓库里的 `05public/`。vault 的 `05draft/` 是草稿区,不在 `blog-content` 的白名单里,**站点和线上构建都看不到它**。
内容目录不是写死的:`src/content.config.ts` 按候选顺序自动找(见第 2 节),构建日志里搜 `[content] 内容目录:`。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `src/content.config.ts` | 内容集合定义。**内容目录自动探测**:候选顺序 `VAULT_PUBLIC` → 本地 vault `05public/` → `./content/05public/` → `./content/`,每个候选先试它下面的 `05public/` 再试它自己。schema 决定 frontmatter 允许哪些字段 |
| `README.md` | 使用说明 + Vercel 部署步骤(内容怎么进构建机、环境变量叫什么) |
| `src/pages/blog/[...slug].astro` | 文章页。标题取 `entry.id`,并渲染 `<h1>{title}</h1>` |
| `src/pages/blog/index.astro` | 列表页。标题同样取 `p.id`,按 `pubDate` 倒序 |
| `src/layouts/BaseLayout.astro` | 全局布局。`<title>` = `{title} · 句号` |
| `src/plugins/remark-obsidian-wiki.mjs` | 把 `[[双链]]` 转成 `/blog/<slug>/`。注意它内部做了 `toLowerCase()`,和 `entry.id` 的大小写规则不一致(含英文大写的双链会 404,目前站内没用双链) |
| `astro.config.mjs` | remark-math + rehype-katex + shiki(github-dark) |
| `.gitignore` | 已忽略 `node_modules/`、`dist/`、`.astro/`、`content/` |

## 3. 命令

| 目的 | 命令 |
|---|---|
| 首次 / 依赖变更后 | `pnpm install` |
| 本地开发 | `pnpm dev`(默认 http://localhost:4321) |
| 构建 | `pnpm build` |
| 预览构建产物 | `pnpm preview` |
| 同步内容类型 | `pnpm sync` |

**自动化环境(AI 助手 / CI / 无 TTY)里不要直接 `pnpm build`。**
pnpm 10+ 有 `verify-deps-before-run`(默认 `install`):执行任何 script 前先自检依赖,一旦判定需要删掉 `node_modules` 重装,而没有 TTY 可确认,就直接中止并报:

```
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
```

绕开方式(任选其一):

1. **直接调 Astro CLI(推荐)**:`node node_modules/astro/astro.js build`,dev 同理 `node node_modules/astro/astro.js dev`
2. 设 `CI=true` 再跑 pnpm
3. 在本仓库加 `.npmrc`,写入 `verify-deps-before-run=false`

这**不是缓存坏了**,不需要删 `node_modules`,更不需要清 `.astro/`。

## 4. 缓存:什么时候才需要清

- **正常情况完全不用清。** `.astro/` 是内容缓存,`astro sync` 会增量更新;`dist/` 每次构建自动清空重建。
- 只有**内容集合状态错乱**时才清,症状是这两个一起出现:

  ```
  [WARN] [glob-loader] Duplicate id "xxx" found in <某个 md 文件>. Later items with the same id will overwrite earlier ones.
  [ERROR] [vite] ✗ Build failed
  [commonjs--resolver] The URL must be of scheme file
  ```

  处理:`Remove-Item .astro -Recurse -Force`(或 `rm -rf .astro`)后重跑构建。

  **已定位的部分(2026-10-06 两次复现)**:`Duplicate id` 警告出现在**内容基路径被切换之后的那一次同步**——同一批内容先在项目内 `content/`(CI 形态)构建、再切回 vault 绝对路径构建时,缓存里旧条目的 id 相同但文件路径不同,于是报重复 id。它**只污染那一次同步的日志,不影响产物**(exit 0、`dist/blog/` 下文章数正常),后续构建自动收敛。第二次复现时我删了 `.astro/` 照样报,所以**别为它去改内容,也不必每次构建前清缓存**。

  **未定位的部分**:上面那条 `[commonjs--resolver] The URL must be of scheme file` 构建失败我没能稳定复现。若再遇到:先删 `.astro/` 重跑,并保留当时的完整日志再排查。

## 5. 图片(重要)

- 文章图片放在**内容目录里**:成稿 `05public/assets/<文章名>/xxx.png`,草稿 `05draft/assets/<文章名>/xxx.png`,markdown 用**相对路径** `![说明](assets/<文章名>/xxx.png)`(相对 md 文件自己所在目录解析)。内容目录是发布的整体单元,图片必须跟着它走;定稿时整个 `assets/<文章名>/` 跟着 md 一起从 `05draft/` 搬到 `05public/`,两个目录同层,正文路径一个字都不用改。
- 站点 `public/` 只放站点自身资源(favicon 之类);放这里的图片不随内容仓库走,Obsidian 里也预览不到。
- **sharp 已安装(2026-10-06)**,`dependencies` 里固定为 `sharp@^0.34.5`,与 Astro 声明的 `^0.34.0`(`optionalDependencies`)对齐。实测:相对路径图片 → 构建 exit 0,产出 `/_astro/xxx.<hash>.webp`,并自动带上 `width`/`height`/`loading="lazy"`。
  - **别删掉它。** 删了就会回到 `MissingSharp: Could not find Sharp`,带本地图片的构建在 `generating optimized images` 那步 exit 1(纯文字/公式文章不受影响)。
  - 原因备忘:Astro 把 sharp 放在 `optionalDependencies` 里,pnpm 的严格 node_modules 不会把传递/可选依赖提升到项目根,Node 从项目根解析不到 → 必须自己声明成直接依赖。
  - pnpm 10 默认不执行依赖的构建脚本,装 sharp 时会提示 `Ignored build scripts: sharp@…`。**这是无害的**:sharp 的原生库由 `@img/sharp-<platform>` 预编译包分发,不需要现场编译。真遇到加载失败再跑 `pnpm approve-builds`。
  - 不想用 sharp 的另一条路:`astro.config.mjs` 里 `import { passthroughImageService } from 'astro/config'`,配置 `image: { service: passthroughImageService() }` —— 不优化、原图输出。
- **平台差异**:本地 Windows 取 `@img/sharp-win32-x64`,Vercel 的 Linux 构建机取 `@img/sharp-linux-x64`,由 lockfile 里的可选依赖自动决定 —— 所以 **lockfile 必须提交**。

## 6. 标题与 URL 规则

- **URL 由 `entry.id` 决定**,而 `entry.id` 是**文件名 slug 化**的结果(Astro 对每段路径调用 github-slugger):中文原样保留、英文**转小写**、空格变 `-`、标点直接去掉。实测 `Attention is all your need.md` → `attention-is-all-your-need`,`第一篇,进入AI.md` → `第一篇进入ai`。
- **页面显示标题由 frontmatter 的 `title` 决定**(2026-10-06 起本站已支持):schema 里有 `title: z.string().nullish()`,`[...slug].astro` / `blog/index.astro` / `index.astro` / `tags/[tag].astro` 四处统一用 `entry.data.title ?? entry.id`。没写 `title` 就退回 slug 化的文件名,所以**新文章一律写 `title`**;改标题不用改文件名(文件名只管 URL)。
- 内容目录里**只放文章**。集合匹配 `**/*.{md,mdx}`,规则文件 `AGENTS.md` 按名字排除(`content.config.ts` 里的 `pattern: ['**/*.{md,mdx}', '!**/AGENTS.md']`),它不再需要任何 frontmatter 来"藏起来"。**全站已经没有 `draft` 字段**:草稿靠放在 vault 的 `05draft/` 隔离(不在内容目录里,构建机也看不到)。要在 `05public/` 放别的非文章 md,就加进排除列表,或者干脆放在内容目录外面。
  - 注:排除在 `astro build` 严格生效;`astro dev` 里边跑边改 `AGENTS.md`,热更新可能把它临时收进 dev 集合(dev 的匹配用 picomatch 数组模式,取反不生效),重启 dev 即恢复,不影响产物。

## 7. 改动守则

1. 改代码前先读本文件;文章内容不要在站点仓库里改,去 vault 改(那边有 `05public/AGENTS.md`)。
2. 新增/升级依赖用 pnpm,并同步提交 lockfile;不要手改 `node_modules`。
3. 提交前至少跑一次构建,确认 **exit 0**,且 `dist/blog/` 下的文章数量符合预期(不该多出 AGENTS 之类的东西)。
4. `dist/`、`.astro/`、`content/` 都不要提交。
5. 构建失败时按第 3、4、5 节顺序排查,再考虑别的原因。
6. 完成后回报:改了哪些文件 + 构建结果 + 有没有遗留临时文件。

## 8. 部署(Vercel)

- **线上平台是 Vercel**。仓库 `git@github.com:fullstop113/personal-site.git`(分支 `main`),线上域名 https://fullstop113.com。
- 仓库里**没有 `vercel.json`,也没有 `.github/` 工作流** —— 配置全在 Vercel 面板上:
  - **Build Command**:先拉内容再构建,例如 `git clone --depth 1 https://github.com/fullstop113/blog-content.git content && pnpm build`(Settings → Build and Deployment);
  - **Environment Variables**(左侧项目菜单里就有这一项):`VAULT_PUBLIC = ./content/05public`;
  - 框架预设 Astro,输出目录 `dist`。
- **内容仓库是 `blog-content`**(公开仓库,分支 `master`),仓库根就是 `05public/`;vault 的 `.gitignore` 只放行 `05public/`,所以**草稿区 `05draft/` 永远推不上去,构建机也读不到它** —— 草稿隔离是靠文件夹,不是靠 `draft` 字段。
- **别再手填内容路径**:`content.config.ts` 会自动在候选目录里找第一个有 markdown 的(`VAULT_PUBLIC` → 本地 vault `05public/` → `./content/05public/` → `./content/`;每个候选先试它下面的 `05public/` 再试它自己),所以环境变量写 `./content` 或 `./content/05public` 都对。构建日志里搜 `[content] 内容目录:` 确认挑中了哪个。
- 内容更新要**两步**:vault 里 commit + push `blog-content`,再让 Vercel 重新部署(可配 Deploy Hook 自动触发)。只 push 不 Redeploy,线上不会变。
- 上线前检查清单:
  - [ ] 本地构建 `node node_modules/astro/astro.js build` exit 0,`dist/blog/` 文章数与预期一致
  - [ ] 新文章都在 `05public/` **根目录**(不是还在 `05draft/`,也没另开子目录),frontmatter 有 `title`(`draft` 字段已经取消)
  - [ ] `blog-content` 已 push,线上已 Redeploy
  - [ ] `pnpm-lock.yaml` 已提交(Vercel 用 `pnpm install --frozen-lockfile`;lockfile 里要包含 `@img/sharp-linux-x64` 这类平台包)
  - [ ] `package.json` 的 `dependencies` 里有 `sharp`(否则线上遇到本地图片会 MissingSharp)
  - [ ] Node 版本:仓库里没有 `engines.node`,Vercel 用它的默认版本;若原生依赖出问题,再在 `package.json` 里固定 `engines.node`
- **不要**让构建依赖仓库外的绝对路径;Vercel 构建目录里只有这个仓库 + 构建前拉进来的内容。
