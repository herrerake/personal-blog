import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: 'content',
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    tags: z.array(z.string()),
    series: z.string(),
    featured: z.boolean(),
  }),
});

const otr = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    tags: z.array(z.string()),
    featured: z.boolean(),
    column: z.string().optional(),
  }),
});

const portfolio = defineCollection({
  type: 'content',
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    description: z.string(),
    author: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
    }),
    tags: z.array(z.string()),
    featured: z.boolean(),
  }),
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string(),
    columnName: z.string(),
    hidden: z.boolean().optional(),
    socialLinks: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { blog, portfolio, otr, authors };
