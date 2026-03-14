/**
 * @file admin.routes.js
 * @description Routes d'administration - réservées au rôle ADMIN uniquement
 */

import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import authenticate from '../middlewares/authenticate.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { validate } from '../validators/rapport.validator.js';
import { validateUserSchema, suspendUserSchema, warningSchema } from '../validators/rapport.validator.js';

const adminRoutes = Router();

// Toutes les routes admin nécessitent authentification + rôle ADMIN
adminRoutes.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Tableau de bord administrateur
 *     description: Statistiques globales, alertes, activité récente.
 *     tags: [Administration]
 *     responses:
 *       200:
 *         description: Statistiques complètes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     utilisateurs:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         enAttente:
 *                           type: integer
 *                         actifs:
 *                           type: integer
 *                     rapports:
 *                       type: object
 *                     activiteRecente:
 *                       type: array
 *       403:
 *         description: Accès réservé à l'administrateur
 */
adminRoutes.get('/dashboard', adminController.getDashboard);

/**
 * @swagger
 * /admin/stats/rapports:
 *   get:
 *     summary: Statistiques des rapports pour les graphiques
 *     tags: [Administration]
 *     parameters:
 *       - in: query
 *         name: periode
 *         schema:
 *           type: string
 *           enum: [semaine, mois]
 *           default: mois
 *     responses:
 *       200:
 *         description: Données de graphique d'évolution
 */
adminRoutes.get('/stats/rapports', adminController.getRapportStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Liste de tous les utilisateurs
 *     tags: [Administration]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, ACTIF, SUSPENDU, REJETE]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 */
adminRoutes.get('/users', adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}/validate:
 *   patch:
 *     summary: Valider ou rejeter un compte utilisateur
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [VALIDER, REJETER]
 *               role:
 *                 type: string
 *                 description: Rôle final (si VALIDER, optionnel - utilise proposedRole sinon)
 *               motif:
 *                 type: string
 *                 description: Motif de rejet (obligatoire si REJETER)
 *     responses:
 *       200:
 *         description: Compte traité, utilisateur notifié
 *       400:
 *         description: Compte pas en statut EN_ATTENTE
 */
adminRoutes.patch('/users/:id/validate', validate(validateUserSchema), adminController.validateUser);

/**
 * @swagger
 * /admin/users/{id}/suspend:
 *   patch:
 *     summary: Suspendre un compte utilisateur
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motif]
 *             properties:
 *               motif:
 *                 type: string
 *               dureeJours:
 *                 type: integer
 *                 description: Durée en jours (null = indéfini)
 *     responses:
 *       200:
 *         description: Compte suspendu, utilisateur notifié
 */
adminRoutes.patch('/users/:id/suspend', validate(suspendUserSchema), adminController.suspendUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Supprimer définitivement un utilisateur
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
adminRoutes.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /admin/rapports/{id}/warning:
 *   post:
 *     summary: Ajouter un avertissement sur un rapport
 *     description: Le rapport passe en statut SIGNALE et le propriétaire est notifié.
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 example: "Ce rapport contient des informations erronées. Veuillez le corriger."
 *     responses:
 *       201:
 *         description: Avertissement créé, propriétaire notifié
 */
adminRoutes.post('/rapports/:id/warning', validate(warningSchema), adminController.addWarning);

export default adminRoutes;
