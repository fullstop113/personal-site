// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkObsidianWiki } from './src/plugins/remark-obsidian-wiki.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://fullstop113.com',
  markdown: {
    remarkPlugins: [remarkObsidianWiki, remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
