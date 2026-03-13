/**
 * @file notifications.routes.js
 * @description Routes pour les notifications in-app de l'utilisateur connecté
 */

import { Router } from 'express';
import * as notifController from '../controllers/notification.controller.js';
import authenticate from '../middlewares/authenticate.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Liste des notifications de l'utilisateur
 *     description: Retourne les notifications des 30 derniers jours avec compteur non lues.
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filtrer uniquement les non lues
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [NOUVEAU_RAPPORT, MENTION, NOUVELLE_INSCRIPTION, COMPTE_VALIDE, COMPTE_REJETE, RAPPORT_AVERTISSEMENT, COMPTE_SUSPENDU, RAPPORT_ARCHIVE]
 *     responses:
 *       200:
 *         description: Notifications paginées avec compteur non lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationResponse'
 *                 meta:
 *                   allOf:
 *                     - $ref: '#/components/schemas/PaginationMeta'
 *                     - type: object
 *                       properties:
 *                         unreadCount:
 *                           type: integer
 */
router.get('/', notifController.getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Nombre de notifications mises à jour
 */
router.patch('/read-all', notifController.markAllRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       404:
 *         description: Notification introuvable
 */
router.patch('/:id/read', notifController.markOneRead);

export default router;
