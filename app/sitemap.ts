import type { MetadataRoute } from "next";
import { PUBLIC_WORD_BUILDERS } from "@/lib/clean/publicWordBuilders";

const SITE_URL = "https://www.mylearna.com";

const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/get-started",
  "/demo",
  "/homeschool-maths-worksheets",
  "/homeschool-planning",
  "/homeschool-record-keeping",
  "/homeschool-answers",
  "/learn",
  "/learn/how-do-children-learn",
  "/word-builders",
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
  return [...PUBLIC_SITEMAP_PATHS, ...PUBLIC_WORD_BUILDERS.map((item) => `/word-builders/${item.slug}`)].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
