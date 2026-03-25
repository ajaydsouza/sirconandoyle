import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const canonCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/canon' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    collection: z.string().optional(),  // for short stories: adventures | memoirs | return | casebook | last-bow
    novel: z.string().optional(),       // for Holmes novels: a-study-in-scarlet | etc.
    order: z.number().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const novelsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/novels' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    novel: z.string(),
    order: z.number().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const pagesCollection = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    coverImage: z.string().optional(),
  }),
});

export const collections = {
  canon: canonCollection,
  novels: novelsCollection,
  pages: pagesCollection,
};
