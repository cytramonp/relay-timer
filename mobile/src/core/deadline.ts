export function checkDeadline(signal: AbortSignal) {
  if (signal.aborted) {
    const error = new Error("Timed out");
    error.name = "AbortError";
    throw error;
  }
}
export async function withDeadline<T>(
  work: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const error = new Error("Timed out");
      error.name = "AbortError";
      reject(error);
    }, ms);
  });
  try {
    return await Promise.race([work(controller.signal), expired]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
