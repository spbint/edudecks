const RETIRED_RESPONSE = {
  error: "This legacy report export endpoint has been retired. Use My Reports.",
  code: "legacy_report_export_retired",
  canonicalRoute: "/my-reports",
};

export function GET() {
  return Response.json(RETIRED_RESPONSE, {
    status: 410,
    headers: {
      "cache-control": "no-store",
    },
  });
}
