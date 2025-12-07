import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Element, Text } from 'hast';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Regex to match Obsidian image embed syntax: ![[filename.ext]] or ![[filename.ext|alt text]]
const OBSIDIAN_IMAGE_REGEX = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;

// Supported image extensions
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|ico)$/i;

interface Options {
  /** Base URL path for images, default: '/images/content/' */
  basePath?: string;
  /** Destination directory for copied images, default: './public/images/content' */
  destinationDir?: string;
}

// Track copied files to avoid duplicate copies
const copiedFiles = new Set<string>();

/**
 * Sanitize filename for filesystem and URL compatibility
 * Replaces spaces and other problematic characters with hyphens
 */
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  // Replace spaces and other problematic characters with hyphens
  const sanitized = base
    .replace(/\s+/g, '-')
    .replace(/[^\w\-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return sanitized + ext;
}

/**
 * Rehype plugin to transform Obsidian ![[image.png]] syntax into img elements
 * Also copies images from source location to public directory
 */
export const rehypeObsidianImage: Plugin<[Options?], Root> = (options = {}) => {
  const basePath = options.basePath ?? '/images/content/';
  const destinationDir = options.destinationDir ?? './public/images/content';

  // Ensure destination directory exists
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  return (tree: Root, file) => {
    // Get the source file's directory
    const sourceDir = file.dirname || file.cwd || process.cwd();

    // Collect all text content and rebuild if needed
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      const text = node.value;
      if (!text.includes('![[')) return;

      const newNodes = processText(text, basePath, sourceDir, destinationDir);
      if (newNodes.length > 0) {
        (parent as Element).children.splice(index, 1, ...newNodes);
        return index + newNodes.length;
      }
    });

    // Also check for patterns split across elements (e.g., ![[file@2x.jpg]] where @ becomes a link)
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (node.tagName !== 'p') return;

      // Reconstruct the text content of this paragraph
      const textParts: string[] = [];
      collectText(node, textParts);
      const fullText = textParts.join('');

      if (!fullText.includes('![[')) return;

      // Check if there's an obsidian image pattern
      OBSIDIAN_IMAGE_REGEX.lastIndex = 0;
      const match = OBSIDIAN_IMAGE_REGEX.exec(fullText);
      if (!match) return;

      const [, filename] = match;
      if (!IMAGE_EXTENSIONS.test(filename)) return;

      // Replace the entire paragraph content with processed content
      const newChildren = processTextToElements(fullText, basePath, sourceDir, destinationDir);
      if (newChildren.length > 0) {
        node.children = newChildren;
      }
    });
  };
};

function collectText(node: any, parts: string[]): void {
  if (node.type === 'text') {
    parts.push(node.value);
  } else if (node.children) {
    for (const child of node.children) {
      collectText(child, parts);
    }
  }
}

function copyImageIfNeeded(filename: string, sourceDir: string, destinationDir: string): string | null {
  const sourcePath = path.join(sourceDir, filename);
  const sanitizedFilename = sanitizeFilename(filename);
  const destPath = path.join(destinationDir, sanitizedFilename);

  // Skip if already copied this session
  if (copiedFiles.has(destPath)) {
    return sanitizedFilename;
  }

  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[rehype-obsidian-image] Image not found: ${sourcePath}`);
    return null;
  }

  try {
    // Copy file with sanitized name
    fs.copyFileSync(sourcePath, destPath);
    copiedFiles.add(destPath);
    console.log(`[rehype-obsidian-image] Copied: ${filename} -> ${sanitizedFilename}`);
    return sanitizedFilename;
  } catch (err) {
    console.error(`[rehype-obsidian-image] Failed to copy ${filename}:`, err);
    return null;
  }
}

function processText(text: string, basePath: string, sourceDir: string, destinationDir: string): any[] {
  const nodes: any[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  OBSIDIAN_IMAGE_REGEX.lastIndex = 0;

  while ((match = OBSIDIAN_IMAGE_REGEX.exec(text)) !== null) {
    const [fullMatch, filename, altText] = match;

    if (!IMAGE_EXTENSIONS.test(filename)) {
      continue;
    }

    // Copy the image file and get sanitized filename
    const sanitizedFilename = copyImageIfNeeded(filename, sourceDir, destinationDir);
    if (!sanitizedFilename) {
      continue;
    }

    // Add text before the match
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }

    // Create img element with sanitized filename
    const src = `${basePath}${encodeURIComponent(sanitizedFilename)}`;
    const alt = altText?.trim() || filename;

    nodes.push({
      type: 'element',
      tagName: 'img',
      properties: {
        src,
        alt,
        loading: 'lazy',
      },
      children: [],
    });

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (nodes.length > 0 && lastIndex < text.length) {
    nodes.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  return nodes;
}

function processTextToElements(text: string, basePath: string, sourceDir: string, destinationDir: string): any[] {
  const nodes: any[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  OBSIDIAN_IMAGE_REGEX.lastIndex = 0;

  while ((match = OBSIDIAN_IMAGE_REGEX.exec(text)) !== null) {
    const [fullMatch, filename, altText] = match;

    if (!IMAGE_EXTENSIONS.test(filename)) {
      continue;
    }

    // Copy the image file and get sanitized filename
    const sanitizedFilename = copyImageIfNeeded(filename, sourceDir, destinationDir);
    if (!sanitizedFilename) {
      continue;
    }

    // Add text before the match
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }

    // Create img element with sanitized filename
    const src = `${basePath}${encodeURIComponent(sanitizedFilename)}`;
    const alt = altText?.trim() || filename;

    nodes.push({
      type: 'element',
      tagName: 'img',
      properties: {
        src,
        alt,
        loading: 'lazy',
      },
      children: [],
    });

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  // If no matches found, return empty to keep original
  if (nodes.length === 0) {
    return [];
  }

  return nodes;
}
