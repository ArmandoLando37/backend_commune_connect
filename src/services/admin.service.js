/**
 * @file admin.service.js
 * @description Logique métier pour les fonctionnalités d'administration
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/database.config.js';
import { getPaginationParams } from '../utils/response.utils.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/auditLog.utils.js';

/**
 * Récupère la liste paginée de tous les utilisateurs avec filtres.
 * @param {Object} query - Paramètres de filtrage
 * @returns {{users: Array, total: number, page: number, limit: number}}
 */
export const getAllUsers = async (query) => {
  const { page, limit, skip, take } = getPaginationParams(query.page, query.limit);
  const { status, role, search } = query;

  const where = {
    ...(status && { status }),
    ...(role && { role }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        proposedRole: true, status: true, avatar: true,
        createdAt: true, lastLoginAt: true,
        suspensionMotif: true, suspensionFin: true,
        _count: { select: { rapports: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
};

/**
 * Valide ou rejette un compte utilisateur en attente.
 *
 * @param {number} userId - ID de l'utilisateur à valider/rejeter
 * @param {string} action - 'VALIDER' ou 'REJETER'
 * @param {string|null} role - Rôle final assigné (si VALIDER)
 * @param {string|null} motif - Motif de rejet (si REJETER)
 * @param {Object} admin - Administrateur effectuant l'action
 * @returns {Object} Utilisateur mis à jour
 */
export const validateUserAccount = async (userId, action, role, motif, admin) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== 'EN_ATTENTE') {
    const error = new Error(`Impossible d'agir sur un compte en statut "${user.status}".`);
    error.statusCode = 400;
    throw error;
  }

  const isValidating = action === 'VALIDER';

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      status: isValidating ? 'ACTIF' : 'REJETE',
      role: isValidating ? (role || user.proposedRole) : user.role,
      emailVerifiedAt: isValidating ? new Date() : undefined,
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  // Notification à l'utilisateur
  await prisma.notification.create({
    data: {
      type: isValidating ? 'COMPTE_VALIDE' : 'COMPTE_REJETE',
      notifiableId: userId,
      data: {
        message: isValidating
          ? `Votre compte a été validé. Rôle assigné: ${updated.role}`
          : `Votre demande a été rejetée. Motif: ${motif}`,
        motif: motif || null,
        adminName: admin.name,
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: isValidating ? AUDIT_ACTIONS.USER_VALIDATED : AUDIT_ACTIONS.USER_REJECTED,
    model: 'User',
    modelId: userId,
    metadata: { action, role, motif },
  });

  return updated;
};

/**
 * Suspend temporairement ou définitivement un compte utilisateur.
 *
 * @param {number} userId
 * @param {string} motif - Raison de la suspension
 * @param {number|null} dureeJours - Durée en jours (null = indéfini)
 * @param {Object} admin
 * @returns {Object} Utilisateur suspendu
 */
export const suspendUser = async (userId, motif, dureeJours, admin) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN') {
    const error = new Error('Impossible de suspendre un administrateur.');
    error.statusCode = 403;
    throw error;
  }

  const suspensionFin = dureeJours
    ? new Date(Date.now() + dureeJours * 24 * 60 * 60 * 1000)
    : null;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDU', suspensionMotif: motif, suspensionFin },
    select: { id: true, name: true, email: true, status: true, suspensionFin: true },
  });

  // Notification à l'utilisateur
  await prisma.notification.create({
    data: {
      type: 'COMPTE_SUSPENDU',
      notifiableId: userId,
      data: {
        message: `Votre compte a été suspendu. Motif: ${motif}`,
        suspensionFin: suspensionFin?.toISOString() || null,
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: AUDIT_ACTIONS.USER_SUSPENDED,
    model: 'User',
    modelId: userId,
    metadata: { motif, dureeJours },
  });

  return updated;
};

/**
 * Supprime définitivement un compte utilisateur.
 * @param {number} userId
 * @param {Object} admin
 */
export const deleteUser = async (userId, admin) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN' && admin.id !== userId) {
    const error = new Error('Impossible de supprimer un autre administrateur.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.user.delete({ where: { id: userId } });

  await logAudit({
    userId: admin.id,
    action: AUDIT_ACTIONS.USER_DELETED,
    model: 'User',
    modelId: userId,
    metadata: { deletedEmail: user.email, deletedName: user.name },
  });
};

/**
 * Ajoute un avertissement administrateur sur un rapport.
 * @param {number} rapportId
 * @param {string} message
 * @param {Object} admin
 * @returns {Object} Avertissement créé
 */
export const addWarning = async (rapportId, message, admin) => {
  const rapport = await prisma.rapport.findUnique({
    where: { id: rapportId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  const warning = await prisma.warning.create({
    data: { rapportId, adminId: admin.id, message },
    include: { admin: { select: { id: true, name: true } } },
  });

  // Mettre le rapport en statut SIGNALE
  await prisma.rapport.update({ where: { id: rapportId }, data: { statut: 'SIGNALE' } });

  // Notifier le propriétaire du rapport
  await prisma.notification.create({
    data: {
      type: 'RAPPORT_AVERTISSEMENT',
      notifiableId: rapport.userId,
      data: {
        rapportId,
        rapportObjet: rapport.objet,
        message,
        adminName: admin.name,
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: AUDIT_ACTIONS.RAPPORT_WARNING_ADDED,
    model: 'Rapport',
    modelId: rapportId,
    metadata: { message },
  });

  return warning;
};

/**
 * Statistiques globales pour le tableau de bord administrateur.
 * @returns {Object} Statistiques
 */
export const getDashboardStats = async () => {
  const [
    totalUsers, usersEnAttente, usersActifs, usersSuspendus,
    totalRapports, rapportsParStatut, rapportsParRole,
    activiteRecente, derniersUtilisateurs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'EN_ATTENTE' } }),
    prisma.user.count({ where: { status: 'ACTIF' } }),
    prisma.user.count({ where: { status: 'SUSPENDU' } }),
    prisma.rapport.count(),
    prisma.rapport.groupBy({ by: ['statut'], _count: true }),
    prisma.rapport.groupBy({ by: ['userId'], _count: true, orderBy: { _count: { userId: 'desc' } }, take: 5 }),
    prisma.rapport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, role: true } } },
      select: { id: true, objet: true, statut: true, createdAt: true, user: true },
    }),
    prisma.user.findMany({
      where: { status: 'EN_ATTENTE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, proposedRole: true, createdAt: true },
    }),
  ]);

  // Statistiques par semaine (7 derniers jours)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rapportsSemaine = await prisma.rapport.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  return {
    utilisateurs: {
      total: totalUsers,
      enAttente: usersEnAttente,
      actifs: usersActifs,
      suspendus: usersSuspendus,
    },
    rapports: {
      total: totalRapports,
      cetteSetmaine: rapportsSemaine,
      parStatut: rapportsParStatut.reduce((acc, item) => {
        acc[item.statut] = item._count;
        return acc;
      }, {}),
    },
    activiteRecente,
    utilisateursEnAttente: derniersUtilisateurs,
  };
};

/**
 * Récupère les statistiques détaillées des rapports pour les graphiques.
 * @param {string} periode - 'semaine' | 'mois'
 */
export const getRapportStats = async (periode = 'mois') => {
  const days = periode === 'semaine' ? 7 : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rapports = await prisma.rapport.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, statut: true },
    orderBy: { createdAt: 'asc' },
  });

  return rapports;
};
