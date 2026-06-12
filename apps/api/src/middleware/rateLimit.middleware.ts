import rateLimit from 'express-rate-limit';

const common = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests' },
};

/** Standard tier for general API traffic. */
export const apiLimiter = rateLimit({ windowMs: 60_000, max: 120, ...common });

/** Strict tier for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({ windowMs: 60_000, max: 10, ...common });
