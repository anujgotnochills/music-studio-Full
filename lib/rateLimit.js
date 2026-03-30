import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// Rate limit configuration: 20 requests per minute
const rateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

/**
 * Higher-order function to apply rate limiting to Vercel API routes.
 * @param {Function} handler - The original Vercel API handler.
 */
export default function withRateLimit(handler) {
  return async (req, res) => {
    // If Redis/KV is not configured, we log a warning but allow the request to prevent breakages.
    // In a strict production environment, you might want to block instead.
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.warn("Rate limiting is NOT active. Please configure Vercel KV or Upstash Redis.");
      return handler(req, res);
    }

    try {
      // Get IP address from Vercel headers
      const ip = req.headers["x-forwarded-for"] || "127.0.0.1";
      const { success, limit, reset, remaining } = await rateLimit.limit(ip);

      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", reset.toString());

      if (!success) {
        return res.status(429).json({
          error: "Too many requests, please try again later",
          success: false,
        });
      }

      return handler(req, res);
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open to avoid blocking users if the rate limiter itself is down
      return handler(req, res);
    }
  };
}
