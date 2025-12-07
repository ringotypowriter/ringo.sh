// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { remarkGithubCard } from './src/lib/remark-github-card.ts';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    remarkPlugins: [
      remarkGithubCard,
    ],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
