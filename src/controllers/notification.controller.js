/**
 * @file notification.controller.js
 * @description Contrôleurs pour les notifications in-app
 */

import * as notifService from '../services/notification.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.utils.js';

/**
 * GET /api/notifications
 * Liste des notifications de l'utilisateur connecté
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { notifications, total, page, limit, unreadCount } =
      await notifService.getUserNotifications(req.user.id, req.query);

    return res.status(200).json({
      success: true,
      message: 'Notifications récupérées.',
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
export const markAllRead = async (req, res, next) => {
  try {
    const count = await notifService.markAllAsRead(req.user.id);
    return sendSuccess(res, { updatedCount: count }, `${count} notification(s) marquée(s) comme lue(s).`);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marquer une notification comme lue
 */
export const markOneRead = async (req, res, next) => {
  try {
    const notification = await notifService.markOneAsRead(parseInt(req.params.id), req.user.id);
    return sendSuccess(res, { notification }, 'Notification marquée comme lue.');
  } catch (error) {
    next(error);
  }
};
