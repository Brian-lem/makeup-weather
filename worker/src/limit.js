export function createLimiter({ limit = 8, windowMs = 60_000, now = Date.now } = {}) {
  const hits = new Map();
  return function limited(key) {
    const stamp = now();
    const bucket = (hits.get(key) || []).filter((time) => stamp - time < windowMs);
    if (bucket.length >= limit) {
      hits.set(key, bucket);
      return true;
    }
    bucket.push(stamp);
    hits.set(key, bucket);
    return false;
  };
}
