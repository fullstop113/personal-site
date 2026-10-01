// @ts-check
import { defineConfig } from 'astro/config';
import { remarkObsidianWiki } from './src/plugins/remark-obsidian-wiki.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://your-username.github.io', // TODO: 部署后改成你的域名
  markdown: {
    remarkPlugins: [remarkObsidianWiki],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
