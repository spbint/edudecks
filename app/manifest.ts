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
      // TODO: replace this placeholder square watermark with dedicated high-resolution app icons.
      {
        src: "/branding/mylearna-watermark-150.png",
        sizes: "150x150",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
