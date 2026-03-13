/**
 * @file notification.service.js
 * @description Logique métier pour les notifications in-app et l'émission Socket.io
 */

import prisma from '../config/database.config.js';
import { getPaginationParams } from '../utils/response.utils.js';

/** Instance Socket.io partagée (injectée au démarrage) */
let ioInstance = null;

/**
 * Injecte l'instance Socket.io pour permettre l'émission d'événements.
 * À appeler depuis server.js après initialisation de Socket.io.
 * @param {Object} io - Instance Socket.io
 */
export const setIoInstance = (io) => {
  ioInstance = io;
};

/**
 * Émet un événement Socket.io vers un utilisateur spécifique (room privée).
 * @param {number} userId - ID de l'utilisateur destinataire
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données de l'événement
 */
export const emitToUser = (userId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, data);
};

/**
 * Émet un événement Socket.io vers tous les membres d'un rôle.
 * @param {string} role - Rôle destinataire
 * @param {string} event - Nom de l'événement
 * @param {Object} data - Données de l'événement
 */
export const emitToRole = (role, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`role:${role}`).emit(event, data);
};

/**
 * Crée une notification en BDD et l'émet en temps réel via Socket.io.
 *
 * @param {number} userId - ID de l'utilisateur destinataire
 * @param {string} type - Type de notification (ex: NOUVEAU_RAPPORT)
 * @param {Object} data - Données contextuelles
 * @returns {Object} Notification créée
 */
export const createNotification = async (userId, type, data) => {
  const notification = await prisma.notification.create({
    data: { type, notifiableId: userId, data },
  });

  // Émission temps réel
  emitToUser(userId, 'notification:new', {
    id: notification.id,
    type,
    data,
    createdAt: notification.createdAt,
  });

  return notification;
};

/**
 * Envoie des notifications à plusieurs utilisateurs.
 * @param {number[]} userIds - Liste des IDs utilisateurs
 * @param {string} type
 * @param {Object} data
 */
export const notifyMultiple = async (userIds, type, data) => {
  if (!userIds.length) return;

  await prisma.notification.createMany({
    data: userIds.map(userId => ({ type, notifiableId: userId, data })),
    skipDuplicates: true,
  });

  // Émission individuelle en temps réel
  userIds.forEach(userId => {
    emitToUser(userId, 'notification:new', { type, data, createdAt: new Date() });
  });
};

/**
 * Récupère les notifications d'un utilisateur avec pagination.
 * @param {number} userId
 * @param {Object} query
 * @returns {{notifications: Array, total: number, unreadCount: number}}
 */
export const getUserNotifications = async (userId, query) => {
  const { page, limit, skip, take } = getPaginationParams(query.page, query.limit);
  const { type, unreadOnly } = query;

  const where = {
    notifiableId: userId,
    ...(type && { type }),
    ...(unreadOnly === 'true' && { readAt: null }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { notifiableId: userId, readAt: null } }),
  ]);

  return { notifications, total, page, limit, unreadCount };
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues.
 * @param {number} userId
 * @returns {number} Nombre de notifications mises à jour
 */
export const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { notifiableId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  // Informer le frontend via Socket.io
  emitToUser(userId, 'notifications:allRead', { timestamp: new Date() });

  return result.count;
};

/**
 * Marque une notification spécifique comme lue.
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Object} Notification mise à jour
 */
export const markOneAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, notifiableId: userId },
  });

  if (!notification) {
    const error = new Error('Notification introuvable.');
    error.statusCode = 404;
    throw error;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
};
