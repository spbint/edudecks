import { ImageResponse } from "next/og";
import { createElement } from "react";

import { getPublishedAgentMarketplaceResourceByHandle } from "@/lib/resourceFactory/marketplace.server";

export const runtime = "nodejs";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

const h = createElement;

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const resource = await getPublishedAgentMarketplaceResourceByHandle(
    (await context.params).handle,
  );

  if (!resource) {
    return new Response("Resource not found.", { status: 404 });
  }

  const yearLevels = arrayOfStrings(resource.metadata.year_levels);
  const skill = clean(resource.metadata.skill);
  const strand = resource.subcollection || clean(resource.metadata.strand);

  return new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "86px",
          background:
            "linear-gradient(145deg, #f7f7f2 0%, #eef3f0 52%, #e7ecef 100%)",
          color: "#102038",
          fontFamily: "Arial, sans-serif",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "26px" } },
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "-1px",
            },
          },
          "MyLearna",
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              alignSelf: "flex-start",
              borderRadius: "999px",
              padding: "15px 24px",
              background: "#ffffff",
              fontSize: "24px",
              fontWeight: 700,
            },
          },
          "FREE HOMESCHOOL WORKSHEET",
        ),
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "30px" } },
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: "70px",
              fontWeight: 800,
              letterSpacing: "-3px",
              lineHeight: 1.02,
            },
          },
          resource.title,
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: "32px",
              lineHeight: 1.25,
              color: "#3b4a5d",
            },
          },
          skill || strand || "Focused homeschool practice",
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderRadius: "32px",
            background: "#ffffff",
            padding: "34px",
          },
        },
        h(
          "div",
          { style: { display: "flex", fontSize: "28px", fontWeight: 700 } },
          yearLevels.join(" • ") || "Homeschool",
        ),
        h(
          "div",
          { style: { display: "flex", fontSize: "25px", color: "#536175" } },
          "Printable PDF • Answer key included",
        ),
        h(
          "div",
          { style: { display: "flex", fontSize: "23px", color: "#536175" } },
          "Plan it. Capture it. Keep it. Understand it. Report it.",
        ),
      ),
    ),
    { width: 1000, height: 1500 },
  );
}
