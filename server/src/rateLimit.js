// Sliding-window limiter: at most `max` hits per `windowMs`.
export function createRateLimiter({ max = 6, windowMs = 5000, now = Date.now } = {}) {
  let hits = [];
  return {
    /** returns true if the action is allowed (and records it) */
    allow() {
      const t = now();
      hits = hits.filter((h) => t - h < windowMs);
      if (hits.length >= max) return false;
      hits.push(t);
      return true;
    },
  };
}
