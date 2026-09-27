import { ImageResponse } from "next/og";
import { createElement } from "react";

import { getPublishedAgentWorksheetPreviewByHandle } from "@/lib/resourceFactory/marketplace.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function questionRows(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ id: string; prompt: string }>;
  return value
    .map((item, index) => {
      const row = asRecord(item);
      return {
        id: clean(row.id) || String(index + 1),
        prompt: clean(row.prompt),
      };
    })
    .filter((row) => row.prompt)
    .slice(0, 8);
}

const h = createElement;

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const data = await getPublishedAgentWorksheetPreviewByHandle(
    (await context.params).handle,
  );
  if (!data) {
    return new Response("Resource not found.", { status: 404 });
  }

  const spec = data.spec ?? {};
  const metadata = data.resource.metadata;
  const accessModel = clean(metadata.access_model);
  const isPaid = accessModel === "paid";

  const title = clean(spec.title) || data.resource.title;
  const yearLevels =
    arrayOfStrings(spec.yearLevels).length > 0
      ? arrayOfStrings(spec.yearLevels)
      : arrayOfStrings(metadata.year_levels);
  const strand = clean(spec.strand) || data.resource.subcollection;
  const skill = clean(spec.skill) || clean(metadata.skill);
  const instructions =
    clean(spec.instructions) ||
    "Complete each question. Show working where it helps explain your thinking.";
  const workedExample = asRecord(spec.workedExample);
  const questions = questionRows(spec.questions);

  return new ImageResponse(
    h(
      "div",
      {
        style: {
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          color: "#111b33",
          padding: "82px 88px 70px",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden",
        },
      },
      isPaid
        ? h(
            "div",
            {
              style: {
                position: "absolute",
                left: "145px",
                top: "760px",
                transform: "rotate(-28deg)",
                fontSize: "78px",
                fontWeight: 800,
                letterSpacing: "10px",
                color: "rgba(84, 67, 165, 0.10)",
                zIndex: 5,
              },
            },
            "MYLEARNA PREVIEW",
          )
        : null,
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "3px solid #edf0f5",
            paddingBottom: "28px",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: "32px",
              fontWeight: 800,
              color: "#0f1e4d",
            },
          },
          "MyLearna",
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "3px",
              color: "#6a7180",
            },
          },
          "WORKSHEET",
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            marginTop: "34px",
          },
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              fontSize: "48px",
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#0f1e4d",
            },
          },
          title,
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              marginTop: "17px",
              fontSize: "19px",
              lineHeight: 1.35,
              color: "#667085",
            },
          },
          [yearLevels.join(", "), strand, skill].filter(Boolean).join("  |  "),
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              marginTop: "26px",
              padding: "20px 24px",
              borderRadius: "14px",
              background: "#f7f8fb",
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#29334b",
            },
          },
          instructions,
        ),
      ),
      clean(workedExample.prompt)
        ? h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                marginTop: "26px",
                padding: "22px 24px",
                border: "2px solid #e4e7ec",
                borderRadius: "14px",
              },
            },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f1e4d",
                  marginBottom: "10px",
                },
              },
              "Worked example",
            ),
            h(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: "20px",
                  lineHeight: 1.35,
                  color: "#29334b",
                },
              },
              clean(workedExample.prompt),
            ),
            clean(workedExample.working)
              ? h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      marginTop: "7px",
                      fontSize: "18px",
                      lineHeight: 1.35,
                      color: "#596276",
                    },
                  },
                  clean(workedExample.working),
                )
              : null,
          )
        : null,
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            marginTop: "28px",
            gap: "20px",
          },
        },
        ...(questions.length
          ? questions.map((question) =>
              h(
                "div",
                {
                  key: question.id,
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    paddingBottom: "15px",
                    borderBottom: "2px solid #e7eaf0",
                  },
                },
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      fontSize: "21px",
                      lineHeight: 1.35,
                      color: "#18233e",
                    },
                  },
                  `${question.id}. ${question.prompt}`,
                ),
                h("div", {
                  style: {
                    display: "flex",
                    marginTop: "16px",
                    marginLeft: "30px",
                    height: "2px",
                    width: "88%",
                    background: "#cfd5df",
                  },
                }),
              ),
            )
          : [
              h(
                "div",
                {
                  key: "fallback",
                  style: {
                    display: "flex",
                    fontSize: "21px",
                    color: "#596276",
                  },
                },
                "Worksheet questions appear here in the published resource.",
              ),
            ]),
      ),
      h(
        "div",
        {
          style: {
            position: "absolute",
            left: "88px",
            right: "88px",
            bottom: "35px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "16px",
            color: "#8a93a3",
          },
        },
        h("div", { style: { display: "flex" } }, "MyLearna · Plan. Capture. Grow."),
        h(
          "div",
          { style: { display: "flex" } },
          isPaid ? "Preview · Page 1" : "Page 1",
        ),
      ),
    ),
    {
      width: 1200,
      height: 1697,
    },
  );
}
