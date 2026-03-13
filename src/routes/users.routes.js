/**
 * @file users.routes.js
 * @description Routes pour la gestion des rapports communaux (CRUD, stars, lecteurs, archivage)
 */

import { Router } from 'express';
import * as rapportController from '../controllers/profile.controller.js';
import authenticate from '../middlewares/authenticate.middleware.js';
import { checkPermission } from '../middlewares/authorize.middleware.js';
import { upload } from '../config/multer.config.js';
import { uploadRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createRapportSchema,
  updateRapportSchema,
  listRapportsQuerySchema,
  validate,
} from '../validators/rapport.validator.js';

const rapportRoutes = Router();

// Toutes les routes nécessitent une authentification
rapportRoutes.use(authenticate);

/**
 * @swagger
 * /rapports:
 *   get:
 *     summary: Liste des rapports accessibles à l'utilisateur
 *     description: Retourne uniquement les rapports que l'utilisateur a le droit de voir selon son rôle.
 *     tags: [Rapports]
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
 *           maximum: 100
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [BROUILLON, SOUMIS, MODIFIE, ARCHIVE, SIGNALE]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche full-text (objet, description, tags)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, objet]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Liste paginée des rapports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RapportResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
rapportRoutes.get('/', validate(listRapportsQuerySchema, 'query'), rapportController.listRapports);

/**
 * @swagger
 * /rapports:
 *   post:
 *     summary: Créer un nouveau rapport
 *     description: Crée un rapport. Si statut=SOUMIS, les rôles autorisés sont notifiés en temps réel.
 *     tags: [Rapports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/RapportCreate'
 *               - type: object
 *                 properties:
 *                   fichier:
 *                     type: string
 *                     format: binary
 *                     description: Fichier joint (PDF, Word, Excel, Image - max 10Mo)
 *     responses:
 *       201:
 *         description: Rapport créé
 *       403:
 *         description: "Rôle non autorisé à créer des rapports (ex: ARCHIVISTE)"
 *       422:
 *         description: Données invalides
 */
rapportRoutes.post(
  '/',
  checkPermission('creerRapport'),
  uploadRateLimiter,
  upload.single('fichier'),
  validate(createRapportSchema),
  rapportController.createRapport
);

/**
 * @swagger
 * /rapports/{id}:
 *   get:
 *     summary: Détail d'un rapport
 *     description: Retourne le rapport complet. Enregistre automatiquement l'accusé de lecture.
 *     tags: [Rapports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rapport avec mentions, stars, lecteurs et historique
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Accès refusé (rôle non autorisé pour ce rapport)
 *       404:
 *         description: Rapport introuvable
 */
rapportRoutes.get('/:id', rapportController.getRapport);

/**
 * @swagger
 * /rapports/{id}:
 *   put:
 *     summary: Modifier un rapport
 *     description: |
 *       Propriétaire: modifiable dans les 24h après publication.
 *       ADMIN/MAIRE/ADJOINT: modifiable à tout moment.
 *       Sauvegarde automatique de la version précédente.
 *     tags: [Rapports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/RapportCreate'
 *     responses:
 *       200:
 *         description: Rapport modifié (statut → MODIFIE)
 *       403:
 *         description: Délai 24h dépassé ou accès non autorisé
 */
rapportRoutes.put(
  '/:id',
  uploadRateLimiter,
  upload.single('fichier'),
  validate(updateRapportSchema),
  rapportController.updateRapport
);

/**
 * @swagger
 * /rapports/{id}:
 *   delete:
 *     summary: Supprimer un rapport définitivement
 *     description: Suppression irréversible. Propriétaire ou ADMIN uniquement.
 *     tags: [Rapports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rapport supprimé
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Rapport introuvable
 */
rapportRoutes.delete('/:id', rapportController.deleteRapport);

/**
 * @swagger
 * /rapports/{id}/star:
 *   post:
 *     summary: Ajouter/retirer une star (favori)
 *     description: Toggle star. Un utilisateur ne peut attribuer qu'une seule star par rapport.
 *     tags: [Rapports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: État de la star mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     starred:
 *                       type: boolean
 *                     starsCount:
 *                       type: integer
 */
rapportRoutes.post('/:id/star', rapportController.toggleStar);

/**
 * @swagger
 * /rapports/{id}/readers:
 *   get:
 *     summary: Liste des lecteurs du rapport (accusés de lecture)
 *     description: Accessible uniquement par le propriétaire du rapport ou l'ADMIN.
 *     tags: [Rapports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des utilisateurs ayant lu le rapport avec horodatage
 *       403:
 *         description: Seul le propriétaire ou l'admin peut voir les lecteurs
 */
rapportRoutes.get('/:id/readers', rapportController.getReaders);

/**
 * @swagger
 * /rapports/{id}/archive:
 *   post:
 *     summary: Archiver un rapport
 *     description: Réservé aux ARCHIVISTE et ADMIN. Le rapport devient lecture seule.
 *     tags: [Rapports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rapport archivé
 *       403:
 *         description: Non autorisé
 */
rapportRoutes.post('/:id/archive', checkPermission('archiverRapport'), rapportController.archiverRapport);

export default rapportRoutes;