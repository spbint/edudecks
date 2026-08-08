import { demoColors } from "@/components/demo/DemoShell";

export default function DemoWorksheetPreview({
  url,
  alt,
}: {
  url?: string;
  alt: string;
}) {
  if (!url) {
    return (
      <div role="img" aria-label={alt} style={{ minHeight: 170, display: "grid", placeItems: "center", border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc", color: demoColors.slate, padding: 16, textAlign: "center" }}>
        Worksheet preview unavailable
      </div>
    );
  }

  return (
    <figure style={{ margin: 0, display: "grid", gap: 7 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "595 / 842", overflow: "hidden", border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc" }}>
        <object data={`${url}#page=1&view=FitH`} type="application/pdf" aria-label={alt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", border: 0 }}>
          <a href={url} target="_blank" rel="noreferrer" style={{ color: demoColors.blue }}>Open the worksheet preview</a>
        </object>
      </div>
      <figcaption style={{ color: demoColors.slate, fontSize: 12 }}>Learning resource used for this activity</figcaption>
    </figure>
  );
}
