/**
 * @file authorize.middleware.js
 * @description Middleware RBAC - Contrôle d'accès basé sur les rôles
 */

import { hasPermission } from '../config/permissions.config.js';
import { sendError } from '../utils/response.utils.js';

/**
 * Middleware de vérification de rôle.
 * Autorise l'accès uniquement aux utilisateurs ayant l'un des rôles spécifiés.
 *
 * @param {...string} allowedRoles - Rôles autorisés à accéder à la route
 * @returns {Function} Middleware Express
 *
 * @example
 * // Autorise uniquement ADMIN
 * router.get('/users', authenticate, authorize('ADMIN'), handler)
 *
 * @example
 * // Autorise plusieurs rôles
 * router.get('/rapports', authenticate, authorize('ADMIN', 'MAIRE'), handler)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Utilisateur non authentifié.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Accès refusé. Rôle(s) requis: ${allowedRoles.join(', ')}. Votre rôle: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware de vérification de permission spécifique.
 * Vérifie si l'utilisateur a la permission pour une action donnée selon la matrice RBAC.
 *
 * @param {string} action - Action à vérifier (clé de la matrice PERMISSIONS)
 * @returns {Function} Middleware Express
 *
 * @example
 * router.post('/rapports', authenticate, checkPermission('creerRapport'), handler)
 */
export const checkPermission = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Utilisateur non authentifié.', 401);
    }

    const permission = hasPermission(req.user.role, action);

    if (!permission) {
      return sendError(
        res,
        `Action non autorisée: "${action}" pour le rôle ${req.user.role}.`,
        403
      );
    }

    // Si 'own', la vérification de propriété se fait dans le service/controller
    req.permissionLevel = permission; // true | 'own' | 'partial'
    next();
  };
};

/**
 * Middleware combiné: authentification + rôle Admin uniquement
 */
export const adminOnly = authorize('ADMIN');
