interface RateLimitWindow {
  count: number;
  startedAt: number;
}

const windows = new Map<string, RateLimitWindow>();
const maxWindows = 10_000;

function makeRoom(now: number, windowMs: number): void {
  if (windows.size < maxWindows) return;

  for (const [entryKey, window] of windows) {
    if (now - window.startedAt >= windowMs) windows.delete(entryKey);
  }

  if (windows.size >= maxWindows) {
    const oldestKey = windows.keys().next().value;
    if (oldestKey !== undefined) windows.delete(oldestKey);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  now = Date.now(),
  limit = 30,
  windowMs = 60_000,
): RateLimitResult {
  const current = windows.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    if (!current) makeRoom(now, windowMs);
    windows.set(key, { count: 1, startedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((windowMs - (now - current.startedAt)) / 1_000),
      ),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
