import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";

const SITE_URL = "https://www.mylearna.com";

type SitemapEntryConfig = {
  path: string;
  sourceFile: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const PUBLIC_SITEMAP_PAGES: SitemapEntryConfig[] = [
  {
    path: "/",
    sourceFile: "app/page.tsx",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/get-started",
    sourceFile: "app/get-started/page.tsx",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/demo",
    sourceFile: "app/demo/page.tsx",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/homeschool-maths-worksheets",
    sourceFile: "app/homeschool-maths-worksheets/page.tsx",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-planning",
    sourceFile: "app/homeschool-planning/page.tsx",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-record-keeping",
    sourceFile: "app/homeschool-record-keeping/page.tsx",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-portfolio",
    sourceFile: "app/homeschool-portfolio/page.tsx",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-reporting",
    sourceFile: "app/homeschool-reporting/page.tsx",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-learning-evidence",
    sourceFile: "app/homeschool-learning-evidence/page.tsx",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/pricing",
    sourceFile: "app/pricing/page.tsx",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/about",
    sourceFile: "app/about/page.tsx",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/contact",
    sourceFile: "app/contact/page.tsx",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    sourceFile: "app/privacy/page.tsx",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/terms",
    sourceFile: "app/terms/page.tsx",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/signup",
    sourceFile: "app/signup/page.tsx",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/login",
    sourceFile: "app/login/page.tsx",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/faq",
    sourceFile: "app/faq/page.tsx",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/start-free",
    sourceFile: "app/start-free/page.tsx",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/compare",
    sourceFile: "app/compare/page.tsx",
    changeFrequency: "monthly",
    priority: 0.7,
  },
];

function getLastModified(sourceFile: string) {
  const absolutePath = path.join(process.cwd(), sourceFile);

  if (!existsSync(absolutePath)) {
    return new Date();
  }

  return statSync(absolutePath).mtime;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: getLastModified(page.sourceFile),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
