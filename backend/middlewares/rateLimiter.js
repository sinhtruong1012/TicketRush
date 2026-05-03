const rateLimit = require('express-rate-limit');

/**
 * [FIX 1.3] Rate limiters for auth endpoints.
 * Prevents brute-force attacks on login/register.
 */

// Strict limiter for login — brute-force target
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,                    // max 30 attempts per IP per window (tăng lên để dễ test)
  standardHeaders: true,      // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
  },
  skipSuccessfulRequests: true, // Only count failed attempts (non-2xx)
});

// Looser limiter for register — prevent account spam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                    // max 20 registrations per IP per hour (tăng lên để dễ test)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Quá nhiều tài khoản được tạo từ IP này. Vui lòng thử lại sau 1 giờ.',
  },
});

// General API limiter — global safety net
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 1000,                  // Tăng từ 200 lên 1000 requests per IP per window để thoải mái test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  },
});

module.exports = { loginLimiter, registerLimiter, apiLimiter };
