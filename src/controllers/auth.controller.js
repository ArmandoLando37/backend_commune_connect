/**
 * @file auth.controller.js
 * @description Contrôleurs pour les routes d'authentification (register, login, logout, me, profil)
 */

import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import { getIpAddress } from '../utils/auditLog.utils.js';

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
export const register = async (req, res, next) => {
  try {
    const avatarPath = req.file ? req.file.path : null;
    const user = await authService.registerUser(req.body, avatarPath);

    return sendSuccess(
      res,
      { user },
      'Inscription réussie. Votre compte est en attente de validation par l\'administrateur.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Connexion et génération du token JWT
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getIpAddress(req);

    const { user, token } = await authService.loginUser(email, password, ipAddress);

    return sendSuccess(res, { user, token }, 'Connexion réussie.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Déconnexion (invalidation côté client, audit log côté serveur)
 */
export const logout = async (req, res, next) => {
  try {
    const ipAddress = getIpAddress(req);
    await authService.logoutUser(req.user.id, ipAddress);

    return sendSuccess(res, null, 'Déconnexion réussie.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Informations de l'utilisateur connecté
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 * Mise à jour du profil (nom, avatar, mot de passe)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const avatarPath = req.file ? req.file.path : null;
    const user = await authService.updateProfile(req.user.id, req.body, avatarPath);

    return sendSuccess(res, { user }, 'Profil mis à jour avec succès.');
  } catch (error) {
    next(error);
  }
};
