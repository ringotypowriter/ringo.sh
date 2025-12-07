# Repository Guidelines

This document is a concise contributor guide for `ringo.sh`. Follow it when making changes, whether you are a human contributor or an automated agent.

## Project Structure & Modules

- `src/pages/`: Top-level Astro pages and routes.
- `src/components/`: Reusable UI components (Astro/React).
- `src/layouts/`: Shared page layouts.
- `src/content/`: Markdown content; `snippets/` holds snippet articles managed by config in `src/content/config.ts`.
- `src/lib/`: Utilities, helpers, and shared logic.
- `src/styles/`: Global styles and Tailwind-related configuration.
- `public/`: Static assets served as-is.
- `scripts/`: Project scripts (e.g., `new-snippet.ts`).

## Build, Test, and Development

- `bun install` / `npm install`: Install dependencies.
- `bun run dev` / `npm run dev`: Start the Astro dev server.
- `bun run build` / `npm run build`: Build the production site to `dist/`.
- `bun run preview` / `npm run preview`: Preview the built site locally.

There is currently no automated test suite; verify changes manually in the browser.

## Coding Style & Naming

- Use TypeScript where possible; prefer explicit types for public APIs.
- Use 2-space indentation, single quotes in TS/JS, and consistent semicolon usage with existing files.
- Components: `PascalCase` (e.g., `InteractiveD20.tsx`, `Section.astro`).
- Helpers and utilities: `camelCase` (e.g., `formatSnippetSlug`).
- Keep Astro/React components small and focused; colocate related styles in `src/styles/` if shared.

## Content & Snippets

- Add new snippets via `bun run scripts/new-snippet.ts` when possible, then edit the generated file under `src/content/snippets/`.
- Use descriptive frontmatter (title, description, tags) and keep filenames kebab-cased (e.g., `interactive-chat-with-ai-in-writing.md`).

## Commit & Pull Requests

- Write clear, imperative commit messages (e.g., `Add snippet generator script`, `Refine snippet layout`).
- Keep each PR focused on one logical change set; include a short summary, screenshots for visual changes, and links to any related issues.
- Ensure `bun run dev` works without errors before requesting review.

## Agent-Specific Instructions

- Respect this file and any nested `AGENTS.md` files when editing.
- Prefer minimal, well-scoped changes; avoid large refactors unless explicitly requested.
- Do not add new dependencies or tooling without clear justification in the PR description.

