type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const store = new Map<string, CacheEntry>();

export const AI_EXPLAIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const AI_DIGEST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function getAiCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setAiCache(key: string, value: unknown, ttlMs: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + Math.max(0, ttlMs),
  });
}

/** Simple non-crypto fingerprint for cache keys. */
export function fingerprintParts(parts: string[]): string {
  const raw = parts.join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

export function payoutExplainCacheKey(params: {
  orgId: string;
  driverId: string;
  weekStart: string;
  weekEnd: string;
  finalNet: number;
  totalGross: number;
}): string {
  return [
    "explain",
    params.orgId,
    params.driverId,
    params.weekStart,
    params.weekEnd,
    params.finalNet.toFixed(2),
    params.totalGross.toFixed(2),
  ].join(":");
}

export function opsDigestCacheKey(params: {
  orgId: string;
  from: string;
  to: string;
  items: Array<{ id: string; count: number; severity: string }>;
}): string {
  const fp = fingerprintParts(
    params.items.map((i) => `${i.id}:${i.count}:${i.severity}`),
  );
  return ["digest", params.orgId, params.from, params.to, fp].join(":");
}
