/**
 * @file jwt.utils.js
 * @description Utilitaires pour la génération et vérification des tokens JWT
 */

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config.js';

/**
 * Génère un access token JWT pour un utilisateur
 * @param {Object} payload - Données à encoder (id, email, role)
 * @returns {string} Token JWT signé
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    ...jwtConfig.signOptions,
  });
};

/**
 * Vérifie et décode un token JWT
 * @param {string} token - Token à vérifier
 * @returns {Object} Payload décodé
 * @throws {Error} Si le token est invalide ou expiré
 */
export const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret, jwtConfig.verifyOptions);
};

/**
 * Extrait le token depuis le header Authorization
 * @param {string} authHeader - Valeur du header Authorization
 * @returns {string|null} Token ou null si absent/malformé
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Enlève "Bearer "
};
