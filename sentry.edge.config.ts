import * as Sentry from "@sentry/nextjs";
import { redactCalendarFeedTelemetry } from "@/lib/clean/calendar-integrations/telemetryRedaction";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  sendDefaultPii: false,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  beforeSend: redactCalendarFeedTelemetry,
  beforeSendTransaction: redactCalendarFeedTelemetry,
});
