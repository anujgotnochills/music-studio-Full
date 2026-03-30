import withRateLimit from '../lib/rateLimit';
import withCors from '../lib/cors';

/**
 * Example API Route showing how to wrap with security middleware.
 */
async function handler(req, res) {
  // Your existing logic here
  return res.status(200).json({
    message: "Success! This route is now protected by Rate Limiting and strict CORS.",
    timestamp: new Date().toISOString()
  });
}

// Order matters: CORS should handle preflights early, 
// then RateLimit should check quotas.
export default withCors(withRateLimit(handler));
