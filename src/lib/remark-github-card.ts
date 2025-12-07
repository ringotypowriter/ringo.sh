import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Link } from 'mdast';

// GitHub repository info interface
interface GithubRepoInfo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

// Cache for GitHub API responses
const repoCache = new Map<string, GithubRepoInfo>();

async function fetchGithubRepo(owner: string, repo: string): Promise<GithubRepoInfo | null> {
  const cacheKey = `${owner}/${repo}`;

  if (repoCache.has(cacheKey)) {
    return repoCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      console.warn(`GitHub API returned ${response.status} for ${owner}/${repo}`);
      if (response.status === 403) {
        console.warn('Rate limit exceeded or forbidden. Check GITHUB_TOKEN.');
      }
      return null;
    }

    const data: GithubRepoInfo = await response.json();
    repoCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch GitHub repo info for ${owner}/${repo}:`, error);
    return null;
  }
}

// GitHub Linguist language color mapping (curated)
// Source of truth: github-linguist/linguist languages.yml
const languageColors: Record<string, string> = {
  // Web / Frontend languages 
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",

  // General-purpose
  Python: "#3572A5",
  Java: "#b07219",
  "C": "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Scala: "#c22d40",

  // Functional / other popular languages
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  Haskell: "#5e5086",
  Clojure: "#db5855",
  Nim: "#ffc200",

  // Scripting / Shell
  Shell: "#89e051",
  PowerShell: "#012456",
  Awk: "#c30e9b",

  // Systems / Apple family related
  "Objective-C": "#438eff",
  "Objective-C++": "#6866fb",

  // Data / config formats that people often want colored
  TOML: "#9c4221",
  TSQL: "#e38c00",
  CSV: "#237346",

  // Extras you might care about
  Batchfile: "#C1F12E",
  CMake: "#DA3434",
  Assembly: "#6E4C13",
  TeX: "#3D6117",
  VHDL: "#adb2cb",
  SystemVerilog: "#DAE1C2",

  // Build / infra
  Dockerfile: "#384d54",

  // Lua family
  Lua: "#000080",
  Terra: "#00004c",
};

function generateCardHTML(data: GithubRepoInfo): string {
  const languageColor = data.language ? (languageColors[data.language] || '#858585') : '#858585';

  // Using Tailwind classes for dark mode support
  return `<a href="${data.html_url}" target="_blank" rel="noopener noreferrer" class="github-repo-card flex items-center gap-4 my-5 px-5 py-4 border border-sand-text-light/20 dark:border-sand-text-dark/20 rounded-xl bg-white dark:bg-sand-text-dark/5 shadow-[0_8px_24px_-12px_rgba(67,64,57,0.12)] dark:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)] no-underline! transition-all duration-200 hover:border-sand-text-light/50 dark:hover:border-sand-text-dark/50 hover:shadow-[0_12px_28px_-12px_rgba(67,64,57,0.2)] dark:hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5">
  <div class="flex-1 min-w-0">
    <div class="flex flex-wrap items-baseline gap-1.5 text-[17px] leading-tight">
      <span class="text-sand-text-light/60 dark:text-sand-text-dark/60 font-medium">${data.owner.login} /</span>
      <span class="text-sand-text-light dark:text-sand-text-dark font-bold">${data.name}</span>
    </div>
    <p class="text-sm text-sand-text-light/60 dark:text-sand-text-dark/60 leading-relaxed mt-1.5 mb-0 line-clamp-2">${data.description || 'No Description'}</p>
    ${data.language ? `<div class="flex items-center gap-1.5 mt-2 text-xs text-sand-text-light/50 dark:text-sand-text-dark/50">
      <span class="w-2.5 h-2.5 rounded-full" style="background-color:${languageColor};"></span>
      <span class="font-semibold">${data.language}</span>
    </div>` : ''}
  </div>
  <img src="${data.owner.avatar_url}" alt="${data.owner.login}" loading="lazy" class="w-20 h-20 rounded-xl border border-sand-text-light/10 dark:border-sand-text-dark/10 shadow-[0_6px_16px_-6px_rgba(67,64,57,0.15)] dark:shadow-[0_6px_16px_-6px_rgba(0,0,0,0.3)] object-cover shrink-0" />
</a>`.trim();
}

// Remark plugin to transform GitHub links into cards
export const remarkGithubCard: Plugin<[], Root> = () => {
  return async (tree: Root, file) => {
    interface LinkInfo {
      node: Link;
      index: number;
      parent: any;
      grandparent: any;
      parentIndex: number;
      owner: string;
      repo: string;
    }

    const linksToProcess: LinkInfo[] = [];

    // Track parent chain during traversal
    visit(tree, 'paragraph', (paragraphNode, paragraphIndex, grandparent) => {
      if (!grandparent || typeof paragraphIndex !== 'number') return;
      
      // Look for links inside this paragraph
      paragraphNode.children.forEach((child: any, childIndex: number) => {
        if (child.type !== 'link') return;
        
        const url = child.url;
        try {
          const urlObj = new URL(url);
          if (urlObj.host !== 'github.com') return;

          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          if (pathParts.length !== 2) return;

          const [owner, repo] = pathParts;
          console.log(`Processing GitHub link: ${owner}/${repo}`);

          linksToProcess.push({
            node: child,
            index: childIndex,
            parent: paragraphNode,
            grandparent,
            parentIndex: paragraphIndex,
            owner,
            repo,
          });
        } catch {
          // Invalid URL, skip
        }
      });
    });

    // Fetch all GitHub repo data
    const fetchPromises = linksToProcess.map(async (linkInfo) => {
      const data = await fetchGithubRepo(linkInfo.owner, linkInfo.repo);
      return { linkInfo, data };
    });

    const results = await Promise.all(fetchPromises);

    // Process replacements - replace the entire paragraph to avoid block-in-inline issues
    // Process in reverse order to maintain correct indices
    const processedParagraphs = new Set<any>();
    
    for (const { linkInfo, data } of results.reverse()) {
      if (!data) continue;
      if (processedParagraphs.has(linkInfo.parent)) continue;
      
      processedParagraphs.add(linkInfo.parent);
      
      // Build HTML: any text before the card, then the card
      const beforeNodes = linkInfo.parent.children.slice(0, linkInfo.index);
      const afterNodes = linkInfo.parent.children.slice(linkInfo.index + 1);
      
      // Generate HTML for content before the link (if any meaningful content)
      const hasContentBefore = beforeNodes.some((n: any) => 
        n.type === 'text' && n.value.trim().length > 0
      );
      const hasContentAfter = afterNodes.some((n: any) => 
        n.type === 'text' && n.value.trim().length > 0
      );
      
      let finalHtml = '';
      
      if (hasContentBefore) {
        // Render text before as a separate paragraph
        const beforeText = beforeNodes
          .filter((n: any) => n.type === 'text')
          .map((n: any) => n.value)
          .join('')
          .trim();
        if (beforeText) {
          finalHtml += `<p>${beforeText}</p>`;
        }
      }
      
      finalHtml += generateCardHTML(data);
      
      if (hasContentAfter) {
        const afterText = afterNodes
          .filter((n: any) => n.type === 'text')
          .map((n: any) => n.value)
          .join('')
          .trim();
        if (afterText) {
          finalHtml += `<p>${afterText}</p>`;
        }
      }
      
      // Replace the entire paragraph with our HTML
      linkInfo.grandparent.children[linkInfo.parentIndex] = {
        type: 'html',
        value: finalHtml,
      } as any;
    }
  };
};
