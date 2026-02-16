export const TAGS = {
  // Existing (from current content)
  ai: "AI",
  design: "Design",
  "developer-tools": "Developer Tools",
  development: "Development",
  introductions: "Introductions",
  otr: "OTR",
  personal: "Personal",
  "social-media": "Social Media",
  traveling: "Traveling",
  "how-i-built-this": "How I Built This",
  // Anticipated from author profiles
  career: "Career",
  culture: "Culture",
  ethics: "Ethics",
  faith: "Faith",
  leadership: "Leadership",
  "life-lessons": "Life Lessons",
  mentorship: "Mentorship",
  parenting: "Parenting",
  "personal-growth": "Personal Growth",
  "public-speaking": "Public Speaking",
  relationships: "Relationships",
  storytelling: "Storytelling",
  strategy: "Strategy",
} as const;

export type TagSlug = keyof typeof TAGS;
export const TAG_SLUGS = Object.keys(TAGS) as TagSlug[];
export const getTagLabel = (slug: string) =>
  TAGS[slug as TagSlug] ?? slug;
