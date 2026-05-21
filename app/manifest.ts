import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyLearna",
    short_name: "MyLearna",
    description:
      "Pathway-led homeschool planning, evidence, assessment, portfolio, reporting, and outputs for families.",
    start_url: "/my-day",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
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
