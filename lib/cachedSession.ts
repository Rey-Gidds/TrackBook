import { auth } from "./auth";

// Re-export type for convenience
export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

// Module-level cache for session lookups
const sessionCache = new Map<string, { session: Session; timestamp: number }>();
const TTL = 5000; // 5 seconds cache

/**
 * Caches session lookups per cookie token for a short TTL to reduce
 * redundant auth round-trips within the same request burst.
 */
export async function getCachedSession(headers: Headers): Promise<Session | null> {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  // Extract the specific session token if possible, otherwise use the whole header as key
  // better-auth typically uses "better-auth.session-token"
  const sessionCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("better-auth.session-token="))
    ?.trim();

  const cacheKey = sessionCookie || cookieHeader;
  const now = Date.now();

  // Lazy eviction of stale entries
  if (sessionCache.size > 200) {
    for (const [key, val] of sessionCache.entries()) {
      if (now - val.timestamp > TTL) {
        sessionCache.delete(key);
      }
    }
  }

  const cached = sessionCache.get(cacheKey);
  if (cached && now - cached.timestamp < TTL) {
    return cached.session;
  }

  // Cache miss: fetch from auth API
  const session = await auth.api.getSession({ headers });
  sessionCache.set(cacheKey, { session, timestamp: now });

  return session;
}
