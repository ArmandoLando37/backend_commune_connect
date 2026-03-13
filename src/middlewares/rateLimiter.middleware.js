/**
 * @file rateLimiter.middleware.js
 * @description Rate limiting pour contrer les attaques par force brute
 * Max 5 tentatives de connexion par minute (configurable via .env)
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter strict pour les routes d'authentification (login).
 * Limite: 5 tentatives par minute par IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.',
  },
  skipSuccessfulRequests: true, // Ne compte que les échecs
});

/**
 * Rate limiter général pour toutes les routes API.
 * Limite: 100 requêtes par minute par IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer dans 1 minute.',
  },
});

/**
 * Rate limiter pour l'upload de fichiers.
 * Limite: 10 uploads par 5 minutes par IP.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Trop d\'uploads. Limite: 10 fichiers par 5 minutes.',
  },
});
