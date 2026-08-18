import type { MetadataRoute } from "next";

const SITE_URL = "https://www.mylearna.com";

const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/get-started",
  "/demo",
  "/homeschool-maths-worksheets",
  "/homeschool-planning",
  "/homeschool-record-keeping",
  "/homeschool-answers",
  "/homeschool-portfolio",
  "/homeschool-reporting",
  "/homeschool-learning-evidence",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/faq",
  "/start-free",
  "/compare",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
