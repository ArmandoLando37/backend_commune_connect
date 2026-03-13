/**
 * @file authenticate.middleware.js
 * @description Middleware de vérification JWT - protège toutes les routes privées
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.utils.js';
import { sendError } from '../utils/response.utils.js';
import prisma from '../config/database.config.js';

/**
 * Middleware d'authentification JWT.
 * Vérifie le token, charge l'utilisateur depuis la BDD et l'attache à req.user.
 *
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Prochain middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return sendError(res, 'Authentification requise. Veuillez vous connecter.', 401);
    }

    // Vérification et décodage du token
    const decoded = verifyToken(token);

    // Chargement de l'utilisateur depuis la BDD (vérification du statut en temps réel)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
      },
    });

    if (!user) {
      return sendError(res, 'Compte introuvable.', 401);
    }

    // Vérification du statut du compte
    if (user.status !== 'ACTIF') {
      const messages = {
        EN_ATTENTE: 'Votre compte est en attente de validation par l\'administrateur.',
        SUSPENDU: 'Votre compte a été suspendu. Contactez l\'administrateur.',
        REJETE: 'Votre demande d\'inscription a été rejetée.',
      };
      return sendError(res, messages[user.status] || 'Compte inactif.', 403);
    }

    // Injection de l'utilisateur dans la requête
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expirée. Veuillez vous reconnecter.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Token invalide.', 401);
    }
    next(error);
  }
};

export default authenticate;
