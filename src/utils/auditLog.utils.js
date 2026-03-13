/**
 * @file auditLog.utils.js
 * @description Enregistrement des actions critiques dans le journal d'audit immuable
 */

import prisma from '../config/database.config.js';

/**
 * Actions auditables définies comme constantes
 */
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',

  // Users
  USER_VALIDATED: 'USER_VALIDATED',
  USER_REJECTED: 'USER_REJECTED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PROFILE_UPDATED: 'PROFILE_UPDATED',

  // Rapports
  RAPPORT_CREATED: 'RAPPORT_CREATED',
  RAPPORT_UPDATED: 'RAPPORT_UPDATED',
  RAPPORT_DELETED: 'RAPPORT_DELETED',
  RAPPORT_ARCHIVED: 'RAPPORT_ARCHIVED',
  RAPPORT_STARRED: 'RAPPORT_STARRED',
  RAPPORT_UNSTARRED: 'RAPPORT_UNSTARRED',
  RAPPORT_READ: 'RAPPORT_READ',
  RAPPORT_WARNING_ADDED: 'RAPPORT_WARNING_ADDED',
  RAPPORT_FORCE_ARCHIVED: 'RAPPORT_FORCE_ARCHIVED',
};

/**
 * Enregistre une action critique dans la table audit_logs.
 * Cette fonction ne lève jamais d'exception pour ne pas bloquer la réponse principale.
 *
 * @param {Object} params
 * @param {number|null} params.userId - ID de l'utilisateur ayant effectué l'action
 * @param {string} params.action - Action effectuée (cf. AUDIT_ACTIONS)
 * @param {string|null} params.model - Modèle concerné (ex: 'Rapport', 'User')
 * @param {number|null} params.modelId - ID de l'entité concernée
 * @param {Object|null} params.metadata - Données supplémentaires contextuelles
 * @param {string|null} params.ipAddress - Adresse IP de la requête
 */
export const logAudit = async ({
  userId = null,
  action,
  model = null,
  modelId = null,
  metadata = null,
  ipAddress = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        model,
        modelId,
        metadata,
        ipAddress,
      },
    });
  } catch (error) {
    // On log l'erreur mais on ne la propage pas (journal ne doit pas bloquer l'app)
    console.error('[AuditLog] Erreur enregistrement:', error.message);
  }
};

/**
 * Helper pour extraire l'IP réelle depuis la requête Express (supporte les proxies)
 * @param {Object} req - Requête Express
 * @returns {string} Adresse IP
 */
export const getIpAddress = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};
