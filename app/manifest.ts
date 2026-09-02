import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyLearna Homeschool",
    short_name: "MyLearna",
    description:
      "A private homeschool learning space for planning, capturing learning, building portfolios and creating reports.",
    start_url: "/my-day",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/branding/mylearna-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/branding/mylearna-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
