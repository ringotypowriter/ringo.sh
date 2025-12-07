import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const snippets = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/snippets' }),
    schema: z.object({
        title: z.string(),
        date: z.date(),
        description: z.string().optional(),
    }),
});

export const collections = {
    snippets,
};
