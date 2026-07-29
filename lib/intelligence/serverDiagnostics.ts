export type IntelligenceRouteDiagnostics = {
  stageStart(stage: string): void;
  stageSuccess(stage: string): void;
  stageFailure(stage: string, error: unknown): void;
  responseReady(): void;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function sanitise(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return null;
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\b(?:authorization|bearer)\s*[:=]?\s*(?:bearer\s+)?[^\s,;]+/gi, "[REDACTED]")
    .replace(/\b(?:access[_-]?token|api[_-]?key|password|secret|credential)\s*[:=]\s*[^\s,;]+/gi, "[REDACTED]")
    .replace(/\b(?:https?|postgres(?:ql)?:\/\/)[^\s]+/gi, "[REDACTED_URL]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[REDACTED_ID]")
    .slice(0, maxLength) || null;
}

function elapsed(startedAt: number) {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function errorFields(error: unknown) {
  const value = record(error);
  const statusValue = value.status ?? value.statusCode;
  const status = typeof statusValue === "number" ? statusValue : typeof statusValue === "string" ? Number(statusValue) : NaN;
  return {
    errorClass: sanitise(value.name ?? (error instanceof Error ? error.name : "UnknownError"), 120) ?? "UnknownError",
    code: sanitise(value.code, 120),
    message: sanitise(value.message ?? (error instanceof Error ? error.message : "Unexpected error.")),
    status: Number.isFinite(status) ? status : null,
  };
}

export function createIntelligenceRouteDiagnostics(route: string): IntelligenceRouteDiagnostics {
  const correlationId = crypto.randomUUID();
  const startedAt = performance.now();

  function write(stage: string, error?: unknown) {
    const payload = {
      correlationId,
      route,
      stage,
      elapsedMs: elapsed(startedAt),
      ...(error === undefined ? {} : errorFields(error)),
    };
    if (error === undefined) console.info("intelligence_route_stage", payload);
    else console.error("intelligence_route_stage_failed", payload);
  }

  return {
    stageStart: (stage) => write(`${stage}_start`),
    stageSuccess: (stage) => write(`${stage}_success`),
    stageFailure: (stage, error) => write(`${stage}_failure`, error),
    responseReady: () => write("response_ready"),
  };
}
