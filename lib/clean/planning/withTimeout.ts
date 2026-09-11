export const CLEAN_PLANNING_REQUEST_TIMEOUT_MS = 15000;

export async function withCleanPlanningTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  label: string,
  timeoutMs = CLEAN_PLANNING_REQUEST_TIMEOUT_MS,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
