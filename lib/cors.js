/**
 * Reusable CORS middleware for Vercel API routes.
 * @param {Function} handler - The original Vercel API handler.
 */
export default function withCors(handler) {
  return async (req, res) => {
    // 1. Get ALLOWED_ORIGIN from Vercel env variable. Use wildcard for DEV, strict for PROD.
    const allowedOrigin = process.env.ALLOWED_ORIGIN || "";
    const currentOrigin = req.headers.origin;

    // In development mode (Vite typically uses 5173, but user requested 3000 for server dev)
    const isDevelopment = process.env.NODE_ENV === "development";
    const isAllowedLocalhost = isDevelopment && currentOrigin?.includes("localhost:3000");

    // Check if origin matches or is allowed in dev
    if (currentOrigin === allowedOrigin || isAllowedLocalhost) {
      res.setHeader("Access-Control-Allow-Origin", currentOrigin);
    } else {
      // Still set headers but maybe don't allow specific origin if it's completely unknown.
      // Standard strict practice: don't set the header at all for rejected origins.
    }

    // 2. Set static security/CORS headers
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // 3. Handle preflight (OPTIONS) request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // 4. Pass execution to original handler
    return handler(req, res);
  };
}
