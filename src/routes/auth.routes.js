/**
 * @file auth.routes.js
 * @description Routes d'authentification : register, login, logout, me, profile
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import authenticate from '../middlewares/authenticate.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate, registerSchema, loginSchema, updateProfileSchema } from '../validators/auth.validator.js';
import { uploadAvatar } from '../config/multer.config.js';

const authRoutes = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UserRegister'
 *               - type: object
 *                 properties:
 *                   avatar:
 *                     type: string
 *                     format: binary
 *                     description: Photo de profil (optionnel, JPEG/PNG/WebP, max 2Mo)
 *     responses:
 *       201:
 *         description: Compte créé, en attente de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       409:
 *         description: Email déjà utilisé
 *       422:
 *         description: Données invalides
 */
authRoutes.post(
  '/register',
  uploadAvatar.single('avatar'),
  validate(registerSchema),
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     description: Retourne un token JWT valide 7 jours. Seuls les comptes ACTIF peuvent se connecter.
 *     tags: [Authentification]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           example:
 *             email: "admin@gmail.com"
 *             password: "azAZ12**"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIs..."
 *       401:
 *         description: Identifiants incorrects
 *       403:
 *         description: Compte en attente, suspendu ou rejeté
 *       429:
 *         description: Trop de tentatives (max 5/min)
 */
authRoutes.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Déconnexion réussie (invalider le token côté client)
 */
authRoutes.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Informations de l'utilisateur connecté
 *     tags: [Authentification]
 *     responses:
 *       200:
 *         description: Données de l'utilisateur connecté avec statistiques
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Non authentifié
 */
authRoutes.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Mise à jour du profil utilisateur
 *     description: Permet de modifier le nom, l'avatar et le mot de passe. Le rôle ne peut pas être modifié.
 *     tags: [Authentification]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Mot de passe actuel incorrect
 *       422:
 *         description: Données invalides
 */
authRoutes.put(
  '/profile',
  authenticate,
  uploadAvatar.single('avatar'),
  validate(updateProfileSchema),
  authController.updateProfile
);

export default authRoutes;
