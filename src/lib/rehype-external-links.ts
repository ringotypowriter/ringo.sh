import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';

interface Options {
  /** Target attribute for external links, default: '_blank' */
  target?: string;
  /** Rel attribute for external links, default: 'noopener noreferrer' */
  rel?: string;
  /** Whether to add target only to external links (starting with http/https), default: true */
  externalOnly?: boolean;
}

/**
 * Rehype plugin to add target="_blank" and rel="noopener noreferrer" to external links
 */
export const rehypeExternalLinks: Plugin<[Options?], Root> = (options = {}) => {
  const target = options.target ?? '_blank';
  const rel = options.rel ?? 'noopener noreferrer';
  const externalOnly = options.externalOnly ?? true;

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // Only process anchor elements
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      
      // Only process if href exists and is a string
      if (!href || typeof href !== 'string') return;

      // Check if it's an external link (if externalOnly is true)
      if (externalOnly) {
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        if (!isExternal) return;
      }

      // Add target and rel attributes
      node.properties = {
        ...node.properties,
        target,
        rel,
      };
    });
  };
};