import type { MetadataRoute } from "next";

const SITE_URL = "https://www.mylearna.com";

const PUBLIC_ALLOW_PATHS = [
  "/",
  "/get-started",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/signup",
  "/login",
  "/faq",
  "/start-free",
  "/compare",
];

const PRIVATE_DISALLOW_PATHS = [
  "/api/",
  "/auth/",
  "/dashboard",
  "/exports/",
  "/goals/",
  "/onboarding/",
  "/clean",
  "/clean/",
  "/clean-my-*",
  "/my-*",
  "/home/",
  "/calendar/",
  "/capture/",
  "/children/",
  "/curriculum/",
  "/planner/",
  "/portfolio/",
  "/portfolio/share/",
  "/reports/",
  "/authority/",
  "/authority-au/",
  "/authority-uk/",
  "/authority-us/",
  "/family/",
  "/profile/",
  "/settings/",
  "/sign-out",
  "/reset-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC_ALLOW_PATHS,
        disallow: PRIVATE_DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
