/**
 * @file jwt.config.js
 * @description Configuration centralisée des tokens JWT
 */

export const jwtConfig = {
  /** Clé secrète principale pour les access tokens */
  secret: process.env.JWT_SECRET || '123456789',

  /** Durée de validité de l'access token (7 jours) */
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',

  /** Algorithme de signature */
  algorithm: 'HS256',

  /** Options par défaut pour jwt.sign() */
  signOptions: {
    issuer: 'commune-connecte-api',
    audience: 'commune-connecte-client',
  },

  /** Options par défaut pour jwt.verify() */
  verifyOptions: {
    issuer: 'commune-connecte-api',
    audience: 'commune-connecte-client',
    algorithms: ['HS256'],
  },
};
