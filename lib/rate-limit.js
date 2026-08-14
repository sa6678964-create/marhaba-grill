// lib/rate-limit.js
// In-memory rate limiting for API endpoints
// In production, consider using Redis for distributed rate limiting

const logger = require('./logger');

class RateLimiter {
  constructor() {
    this.requests = new Map(); // key -> { count, resetTime }
  }

  /**
   * Check if a request should be allowed based on rate limit
   * @param {string} key - Identifier for rate limiting (e.g., IP address, webhook signature)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} { allowed: boolean, remaining: number, retryAfter: number }
   */
  check(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // New window
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
    }

    if (record.count < maxRequests) {
      record.count++;
      return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
    }

    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  /**
   * Middleware for Express-like frameworks
   */
  static middleware(keyExtractor = (req) => req.ip, options = {}) {
    const {
      maxRequests = 10,
      windowMs = 60000,
      message = 'Too many requests, please try again later.'
    } = options;

    const limiter = new RateLimiter();

    return (req, res, next) => {
      const key = keyExtractor(req);
      const result = limiter.check(key, maxRequests, windowMs);

      res.set('RateLimit-Limit', maxRequests);
      res.set('RateLimit-Remaining', Math.max(0, result.remaining));
      res.set('RateLimit-Reset', Math.ceil(Date.now() / 1000) + result.retryAfter);

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', { key, endpoint: req.path, retryAfter: result.retryAfter });
        return res.status(429).json({
          error: message,
          retryAfter: result.retryAfter
        });
      }

      next();
    };
  }
}

module.exports = RateLimiter;
