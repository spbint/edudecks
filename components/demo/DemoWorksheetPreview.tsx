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
      <object data={`${url}#page=1&view=FitH`} type="application/pdf" aria-label={alt} style={{ width: "100%", height: 220, border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc" }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ color: demoColors.blue }}>Open the worksheet preview</a>
      </object>
      <figcaption style={{ color: demoColors.slate, fontSize: 12 }}>Learning resource used for this activity</figcaption>
    </figure>
  );
}
