/**
 * @file profile.controller.js
 * @description Contrôleurs pour la gestion des rapports communaux
 */

import * as rapportService from '../services/profile.service.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils.js';
import { notifyMultiple } from '../services/notification.service.js';
import { getNotificationTargets } from '../services/profile.service.js';

/**
 * GET /api/rapports
 * Liste paginée des rapports accessibles à l'utilisateur
 */
export const listRapports = async (req, res, next) => {
  try {
    const { rapports, total, page, limit } = await rapportService.getRapports(req.user, req.query);
    return sendPaginated(res, rapports, { total, page, limit }, 'Rapports récupérés.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rapports/:id
 * Détail d'un rapport (enregistre l'accusé de lecture)
 */
export const getRapport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return sendError(res, 'ID de rapport invalide.', 400);
    }
    const rapport = await rapportService.getRapportById(id, req.user);
    return sendSuccess(res, { rapport });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rapports
 * Création d'un nouveau rapport
 */
export const createRapport = async (req, res, next) => {
  try {
    const fichierPath = req.file ? req.file.path : null;
    const rapport = await rapportService.createRapport(req.body, req.user, fichierPath);

    // Notifications temps réel si le rapport est publié
    if (rapport.statut === 'SOUMIS') {
      const targets = await getNotificationTargets(rapport);
      await notifyMultiple(targets, 'NOUVEAU_RAPPORT', {
        rapportId: rapport.id,
        rapportObjet: rapport.objet,
        createdBy: req.user.name,
        creatorRole: req.user.role,
      });

      // Notifier les utilisateurs mentionnés
      if (rapport.mentions?.length > 0) {
        const mentionedIds = rapport.mentions.map(m => m.userId);
        await notifyMultiple(mentionedIds, 'MENTION', {
          rapportId: rapport.id,
          rapportObjet: rapport.objet,
          mentionedBy: req.user.name,
        });
      }
    }

    return sendSuccess(res, { rapport }, 'Rapport créé avec succès.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rapports/:id
 * Modification d'un rapport (propriétaire dans les 24h, ou admin)
 */
export const updateRapport = async (req, res, next) => {
  try {
    const fichierPath = req.file ? req.file.path : null;
    const rapport = await rapportService.updateRapport(
      parseInt(req.params.id),
      req.body,
      req.user,
      fichierPath
    );
    return sendSuccess(res, { rapport }, 'Rapport modifié avec succès.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rapports/:id
 * Suppression définitive d'un rapport
 */
export const deleteRapport = async (req, res, next) => {
  try {
    await rapportService.deleteRapport(parseInt(req.params.id), req.user);
    return sendSuccess(res, null, 'Rapport supprimé définitivement.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rapports/:id/star
 * Toggle star (ajouter/retirer)
 */
export const toggleStar = async (req, res, next) => {
  try {
    const result = await rapportService.toggleStar(parseInt(req.params.id), req.user);
    const message = result.starred ? 'Rapport ajouté aux favoris.' : 'Favori retiré.';
    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rapports/:id/readers
 * Liste des lecteurs d'un rapport (propriétaire ou admin)
 */
export const getReaders = async (req, res, next) => {
  try {
    const readers = await rapportService.getReaders(parseInt(req.params.id), req.user);
    return sendSuccess(res, { readers, count: readers.length });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rapports/:id/archive
 * Archivage d'un rapport (ARCHIVISTE ou ADMIN)
 */
export const archiverRapport = async (req, res, next) => {
  try {
    const rapport = await rapportService.archiverRapport(parseInt(req.params.id), req.user);
    return sendSuccess(res, { rapport }, 'Rapport archivé avec succès.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rapports/mention-search?q=...
 * Recherche d'utilisateurs actifs pour l'autocomplete @mention
 */
export const searchMentionUsers = async (req, res, next) => {
  try {
    const users = await rapportService.searchMentionUsers(req.query.q || '');
    return sendSuccess(res, { users });
  } catch (error) {
    next(error);
  }
};