/**
 * @file admin.controller.js
 * @description Contrôleurs pour les fonctionnalités d'administration
 */

import * as adminService from '../services/admin.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.utils.js';

/**
 * GET /api/admin/users
 * Liste complète des utilisateurs avec filtres
 */
export const getUsers = async (req, res, next) => {
  try {
    const { users, total, page, limit } = await adminService.getAllUsers(req.query);
    return sendPaginated(res, users, { total, page, limit }, 'Utilisateurs récupérés.');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/validate
 * Valider ou rejeter un compte utilisateur
 */
export const validateUser = async (req, res, next) => {
  try {
    const { action, role, motif } = req.body;
    const user = await adminService.validateUserAccount(
      parseInt(req.params.id),
      action,
      role,
      motif,
      req.user
    );
    const message = action === 'VALIDER' ? 'Compte validé avec succès.' : 'Demande rejetée.';
    return sendSuccess(res, { user }, message);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Suspendre un compte utilisateur
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { motif, dureeJours } = req.body;
    const user = await adminService.suspendUser(
      parseInt(req.params.id),
      motif,
      dureeJours || null,
      req.user
    );
    return sendSuccess(res, { user }, 'Compte suspendu avec succès.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Suppression définitive d'un compte
 */
export const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(parseInt(req.params.id), req.user);
    return sendSuccess(res, null, 'Utilisateur supprimé définitivement.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/rapports/:id/warning
 * Ajouter un avertissement sur un rapport
 */
export const addWarning = async (req, res, next) => {
  try {
    const warning = await adminService.addWarning(
      parseInt(req.params.id),
      req.body.message,
      req.user
    );
    return sendSuccess(res, { warning }, 'Avertissement ajouté.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard
 * Statistiques globales du tableau de bord admin
 */
export const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    console.log("admin.controler stats :: ",stats)
    return sendSuccess(res, stats, 'Statistiques récupérées.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats/rapports
 * Statistiques des rapports pour les graphiques
 */
export const getRapportStats = async (req, res, next) => {
  try {
    const stats = await adminService.getRapportStats(req.query.periode);
    return sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};
