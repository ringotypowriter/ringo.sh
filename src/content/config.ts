import { defineCollection, z } from 'astro:content';

const snippets = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        date: z.date(),
        description: z.string().optional(),
    }),
});

export const collections = {
    snippets,
};
