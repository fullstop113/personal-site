/**
 * Remark plugin: convert Obsidian [[wiki links]] to Astro-compatible links.
 *
 * Supports:
 *   [[Note Name]]         -> /blog/note-name/
 *   [[Note Name|别名]]      -> /blog/note-name/  (显示"别名")
 *   ![[image.png]]        -> 保留为文本占位（图片走 public/ 或后续扩展）
 *
 * Note: 链接 slug 由文件路径决定（见 content.config.ts）。
 * 若 [[A]] 指向的文件路径不是 notes/a.md，链接会 404。
 * v1 先按文件名 slugify 处理，后续可加"全量 note map"做模糊解析。
 */
import { visit } from 'unist-util-visit';

function slugify(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.(md|markdown)$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function remarkObsidianWiki() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !Array.isArray(parent.children)) return;
      const value = node.value || '';
      // 同时匹配 [[...]] 和 ![[...]]
      const regex = /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
      const parts = [];
      let last = 0;
      let m;
      let changed = false;
      while ((m = regex.exec(value)) !== null) {
        changed = true;
        if (m.index > last) {
          parts.push({ type: 'text', value: value.slice(last, m.index) });
        }
        const isEmbed = m[1] === '!';
        const target = m[2].trim();
        const alias = (m[3] || target).trim();
        if (isEmbed) {
          // ![[image.png]] —— 暂不处理，保留文本提示
          parts.push({ type: 'text', value: `【嵌入:${target}】` });
        } else {
          parts.push({
            type: 'link',
            url: `/blog/${slugify(target)}/`,
            children: [{ type: 'text', value: alias }],
          });
        }
        last = regex.lastIndex;
      }
      if (!changed) return;
      if (last < value.length) {
        parts.push({ type: 'text', value: value.slice(last) });
      }
      parent.children.splice(index, 1, ...parts);
    });
  };
}
