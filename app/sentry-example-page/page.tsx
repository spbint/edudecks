import { notFound } from "next/navigation";
import { SentryExampleClient } from "./SentryExampleClient";

export default function SentryExamplePage() {
  const exampleEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_SENTRY_EXAMPLE === "true";

  if (!exampleEnabled) {
    notFound();
  }

  return <SentryExampleClient />;
}
