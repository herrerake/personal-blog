import { z } from "zod";

export const STATUSES = ["live", "in-progress", "prototype", "archived"] as const;
export const VISIBILITIES = ["public", "private", "coming-soon"] as const;
export const PROJECT_TYPES = [
  "product", "platform", "tool", "agent", "automation", "website", "experiment",
] as const;
export const CATEGORIES = [
  "AI", "Agents", "Cloudflare", "CMS", "Automation",
  "Developer Tools", "Web Platforms", "Photography", "Open Source", "Experiments",
] as const;
export const PROVENANCE_SOURCES = [
  "readme", "agents", "claude", "package.json",
  "github-metadata", "override", "ai-inference",
] as const;
export const CONNECTION_TYPES = ["project", "article", "talk", "photo", "note"] as const;

const metricSchema = z.object({
  value: z.string().optional(),
  label: z.string(),
});

const screenshotSchema = z.object({
  src: z.string(),
  caption: z.string().optional(),
  featured: z.boolean().default(false),
});

const connectionSchema = z.object({
  type: z.enum(CONNECTION_TYPES),
  slug: z.string(),
});

const timelineSchema = z.object({
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

const scoreSchema = z
  .object({
    originality: z.number(),
    technicalComplexity: z.number(),
    productThinking: z.number(),
    aiUsage: z.number(),
    platformRelevance: z.number(),
    impact: z.number(),
    documentation: z.number(),
    total: z.number(),
  })
  .nullable();

const caseStudySchema = z.object({
  overview: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  architecture: z.string().optional(),
  technicalHighlights: z.string().optional(),
  aiAndAutomation: z.string().optional(),
  lessonsLearned: z.string().optional(),
  futureRoadmap: z.string().optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  timeline: timelineSchema,
  status: z.enum(STATUSES),
  visibility: z.enum(VISIBILITIES).default("coming-soon"),
  projectType: z.enum(PROJECT_TYPES),
  role: z.string(),
  audience: z.string(),
  motivation: z.string(),
  canonicalNarrative: z.string().optional(),
  summary: z.string(),
  elevatorPitch: z.string(),
  stack: z.array(z.string()).default([]),
  categories: z.array(z.enum(CATEGORIES)).default([]),
  features: z.array(z.string()).default([]),
  architectureHighlights: z.array(z.string()).default([]),
  aiCapabilities: z.array(z.string()).default([]),
  impact: z.string(),
  metrics: z.array(metricSchema).default([]),
  connections: z.array(connectionSchema).default([]),
  featuredImage: z.string().optional(),
  screenshots: z.array(screenshotSchema).default([]),
  currentlyBuilding: z.boolean().default(false),
  portfolioScore: scoreSchema.default(null),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  lastUpdated: z.string(),
  caseStudy: caseStudySchema.optional(),
  provenance: z.record(z.string(), z.enum(PROVENANCE_SOURCES)).optional(),
});

export type Project = z.infer<typeof projectSchema>;
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Visibility = (typeof VISIBILITIES)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
