export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 3
  const baseMs = options?.baseMs ?? 200

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries) break

      const isRetryable =
        error instanceof Error &&
        (error.message.includes('429') ||
          error.message.includes('500') ||
          error.message.includes('502') ||
          error.message.includes('503') ||
          error.message.includes('504'))

      if (!isRetryable && attempt > 0) break

      const jitter = Math.random() * baseMs
      await new Promise((resolve) =>
        setTimeout(resolve, baseMs * Math.pow(2, attempt) + jitter)
      )
    }
  }
  throw lastError
}
