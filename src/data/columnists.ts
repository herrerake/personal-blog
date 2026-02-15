export interface Columnist {
  slug: string;
  name: string;
  bio: string;
  avatar: string;
  columnName: string;
  hidden?: boolean;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export const columnists: Columnist[] = [
  {
    slug: "kevin-herrera",
    name: "Kevin Herrera",
    bio: "The guy behind herrerake.com. Builder, writer, and the common thread between everyone on this page.",
    avatar: "/columnists/kevin-herrera.svg",
    columnName: "",
    hidden: true,
    socialLinks: {
      twitter: "www.x.com/1herrerake",
      linkedin: "www.linkedin.com/in/herrerake",
      instagram: "www.instagram.com/herrerakee",
    },
  },
  {
    slug: "jonathan-love",
    name: "Jonathan Love",
    bio: "Attorney. Mentor. Builder of men. He writes on faith, responsibility, and long-term vision grounded in experience and lived mentorship.",
    avatar: "/columnists/jonathan-love.svg",
    columnName: "",
  },
  {
    slug: "jose-antonio-olmos",
    name: "Jose Antonio Olmos",
    bio: "Pastor and former attorney with a sharp analytical mind and a storyteller’s touch. He explores faith, ethics, and culture in a way that feels practical, funny, and unexpectedly personal.",
    avatar: "/columnists/jose-antonio-olmos.svg",
    columnName: "",
  },
  {
    slug: "daniela-tep",
    name: "Daniela Tep",
    bio: "Mom to Ezra, loyal since 6th grade, and an elite judge of character. Sharing real talk on parenting, friendships, and keeping it together.",
    avatar: "/columnists/daniela-tep.svg",
    columnName: "",
  },
  {
    slug: "monica-abangan",
    name: "Monica Abangan",
    bio: "DC-based public speakers agent. High standards. Global exposure. Strategic thinker. The person you call when it’s time to align your ambition with disciplineand your vision with execution.",
    avatar: "/columnists/monica-abangan.svg",
    columnName: "",
  },
];

export function getColumnistBySlug(slug: string): Columnist | undefined {
  return columnists.find((c) => c.slug === slug);
}
