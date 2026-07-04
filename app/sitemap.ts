import type { MetadataRoute } from "next";

const SITE_URL = "https://www.mylearna.com";
const LAST_MODIFIED = new Date("2026-07-04T00:00:00.000Z");

type SitemapEntryConfig = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const PUBLIC_SITEMAP_PAGES: SitemapEntryConfig[] = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/get-started",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/demo",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/homeschool-maths-worksheets",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-planning",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-record-keeping",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-portfolio",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-reporting",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/homeschool-learning-evidence",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/pricing",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/about",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/contact",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/signup",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/login",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/faq",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/start-free",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/compare",
    changeFrequency: "monthly",
    priority: 0.7,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
