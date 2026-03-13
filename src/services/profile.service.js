/**
 * @file rapport.service.js  (nommé profile.service.js dans la structure originale, adapté pour rapports)
 * @description Logique métier pour la gestion complète des rapports communaux
 */

import prisma from '../config/database.config.js';
import { getPaginationParams } from '../utils/response.utils.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/auditLog.utils.js';
import { FULL_ACCESS_ROLES } from '../config/permissions.config.js';

/**
 * Construit la clause WHERE Prisma pour filtrer les rapports selon le rôle de l'utilisateur.
 * - ADMIN, MAIRE, ADJOINT_MAIRE, ARCHIVISTE : voient tout
 * - Autres rôles : uniquement les rapports où leur rôle est dans rapport_roles OU visibilité TOUS
 *
 * @param {Object} user - Utilisateur connecté
 * @returns {Object} Clause WHERE Prisma
 */
const buildVisibilityFilter = (user) => {
  if (FULL_ACCESS_ROLES.includes(user.role)) {
    return {}; // Pas de filtre
  }

  return {
    OR: [
      { userId: user.id }, // Ses propres rapports (toujours visibles)
      { roles: { some: { role: user.role } } }, // Son rôle est dans la liste
      { roles: { some: { role: 'TOUS' } } }, // Visible par tous
      { mentions: { some: { userId: user.id } } }, // Il est mentionné
    ],
  };
};

/**
 * Récupère la liste paginée des rapports accessibles à l'utilisateur.
 *
 * @param {Object} user - Utilisateur connecté
 * @param {Object} query - Paramètres de requête validés
 * @returns {{rapports: Array, total: number, page: number, limit: number}}
 */
export const getRapports = async (user, query) => {
  const { page, limit, skip, take } = getPaginationParams(query.page, query.limit);
  const { statut, search, tags, userId, dateDebut, dateFin, orderBy, order } = query;

  const where = {
    ...buildVisibilityFilter(user),
    ...(statut && { statut }),
    ...(userId && { userId: parseInt(userId) }),
    ...(search && {
      OR: [
        { objet: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ],
    }),
    ...(tags && { tags: { contains: tags } }),
    ...(dateDebut && { createdAt: { gte: new Date(dateDebut) } }),
    ...(dateFin && { createdAt: { lte: new Date(dateFin) } }),
  };

  const [rapports, total] = await Promise.all([
    prisma.rapport.findMany({
      where,
      skip,
      take,
      orderBy: { [orderBy || 'createdAt']: order || 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, avatar: true } },
        roles: { select: { role: true } },
        _count: { select: { stars: true, reads: true, warnings: true } },
        stars: { where: { userId: user.id }, select: { id: true } },
        reads: { where: { userId: user.id }, select: { id: true } },
      },
    }),
    prisma.rapport.count({ where }),
  ]);

  // Formatage de la réponse
  const formatted = rapports.map(r => ({
    ...r,
    starsCount: r._count.stars,
    readsCount: r._count.reads,
    warningsCount: r._count.warnings,
    isStarred: r.stars.length > 0,
    isRead: r.reads.length > 0,
    visibilite: r.roles.map(rr => rr.role),
    _count: undefined,
    stars: undefined,
    reads: undefined,
  }));

  return { rapports: formatted, total, page, limit };
};

/**
 * Récupère un rapport par son ID avec contrôle d'accès.
 * Enregistre automatiquement l'accusé de lecture (première consultation).
 *
 * @param {number} id - ID du rapport
 * @param {Object} user - Utilisateur connecté
 * @returns {Object} Rapport complet
 */
export const getRapportById = async (id, user) => {
  const rapport = await prisma.rapport.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true, avatar: true } },
      roles: { select: { role: true } },
      stars: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      reads: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { readAt: 'desc' } },
      mentions: { include: { user: { select: { id: true, name: true, role: true, avatar: true } } } },
      warnings: { include: { admin: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      versions: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  // Vérification d'accès
  const canAccess = checkRapportAccess(rapport, user);
  if (!canAccess) {
    const error = new Error('Accès refusé à ce rapport.');
    error.statusCode = 403;
    throw error;
  }

  // Enregistrement de l'accusé de lecture (upsert - une seule fois)
  await prisma.rapportRead.upsert({
    where: { rapportId_userId: { rapportId: id, userId: user.id } },
    create: { rapportId: id, userId: user.id },
    update: {}, // Ne pas écraser la date de première lecture
  });

  await logAudit({ userId: user.id, action: AUDIT_ACTIONS.RAPPORT_READ, model: 'Rapport', modelId: id });

  return {
    ...rapport,
    visibilite: rapport.roles.map(r => r.role),
    starsCount: rapport.stars.length,
    isStarred: rapport.stars.some(s => s.userId === user.id),
    isRead: true,
  };
};

/**
 * Crée un nouveau rapport avec visibilité et mentions.
 *
 * @param {Object} data - Données validées du rapport
 * @param {Object} user - Utilisateur créateur
 * @param {string|null} fichierPath - Chemin du fichier joint
 * @returns {Object} Rapport créé
 */
export const createRapport = async (data, user, fichierPath = null) => {
  const { objet, description, statut, visibilite, tags, mentions } = data;

  const isPublished = statut === 'SOUMIS';
  const rolesVisibilite = visibilite.includes('TOUS')
    ? [{ role: 'TOUS' }]
    : visibilite.map(r => ({ role: r }));

  const rapport = await prisma.rapport.create({
    data: {
      objet,
      description,
      statut,
      fichier: fichierPath,
      tags,
      userId: user.id,
      publishedAt: isPublished ? new Date() : null,
      roles: { create: rolesVisibilite },
      ...(mentions.length > 0 && {
        mentions: { create: mentions.map(uid => ({ userId: uid })) },
      }),
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      roles: { select: { role: true } },
      mentions: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  await logAudit({ userId: user.id, action: AUDIT_ACTIONS.RAPPORT_CREATED, model: 'Rapport', modelId: rapport.id });

  return rapport;
};

/**
 * Construit la liste des destinataires de notification pour un rapport publié.
 * @param {Object} rapport - Rapport avec ses roles
 * @returns {Promise<Array>} Liste des IDs utilisateurs à notifier
 */
export const getNotificationTargets = async (rapport) => {
  const roles = rapport.roles.map(r => r.role);
  const isTous = roles.includes('TOUS');

  const where = isTous
    ? { status: 'ACTIF', id: { not: rapport.userId } }
    : { role: { in: roles }, status: 'ACTIF', id: { not: rapport.userId } };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, role: true },
  });

  // Ajouter les utilisateurs mentionnés (peuvent ne pas être dans les rôles)
  const mentionedIds = rapport.mentions?.map(m => m.userId) || [];

  const allIds = [...new Set([...users.map(u => u.id), ...mentionedIds])];
  return allIds.filter(id => id !== rapport.userId);
};

/**
 * Modifie un rapport existant avec sauvegarde de version.
 * Contrôle: propriétaire dans les 24h, ou ADMIN/MAIRE à tout moment.
 *
 * @param {number} id - ID du rapport
 * @param {Object} data - Données à modifier
 * @param {Object} user - Utilisateur modifiant
 * @param {string|null} fichierPath - Nouveau fichier joint
 * @returns {Object} Rapport mis à jour
 */
export const updateRapport = async (id, data, user, fichierPath = null) => {
  const rapport = await prisma.rapport.findUnique({
    where: { id },
    include: { roles: true },
  });

  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  // Vérification des droits de modification
  const isOwner = rapport.userId === user.id;
  const isAdminOrMaire = ['ADMIN', 'MAIRE', 'ADJOINT_MAIRE'].includes(user.role);

  if (!isOwner && !isAdminOrMaire) {
    const error = new Error('Vous ne pouvez modifier que vos propres rapports.');
    error.statusCode = 403;
    throw error;
  }

  // Contrôle 24h pour les non-admins
  if (isOwner && !isAdminOrMaire && rapport.publishedAt) {
    const hoursSincePublish = (Date.now() - rapport.publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSincePublish > 24) {
      const error = new Error('Le délai de modification de 24h est dépassé. Contactez l\'administrateur.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Archivage: impossible de modifier un rapport archivé
  if (rapport.statut === 'ARCHIVE') {
    const error = new Error('Un rapport archivé ne peut pas être modifié.');
    error.statusCode = 400;
    throw error;
  }

  // Sauvegarde de la version précédente
  await prisma.rapportVersion.create({
    data: {
      rapportId: id,
      objet: rapport.objet,
      description: rapport.description,
      userId: user.id,
    },
  });

  const updateData = {
    statut: data.statut || (rapport.statut === 'SOUMIS' ? 'MODIFIE' : rapport.statut),
    ...(data.objet && { objet: data.objet }),
    ...(data.description && { description: data.description }),
    ...(data.tags !== undefined && { tags: data.tags }),
    ...(fichierPath && { fichier: fichierPath }),
  };

  // Mise à jour de la visibilité si spécifiée
  if (data.visibilite) {
    await prisma.rapportRole.deleteMany({ where: { rapportId: id } });
    const rolesVisibilite = data.visibilite.includes('TOUS')
      ? [{ role: 'TOUS', rapportId: id }]
      : data.visibilite.map(r => ({ role: r, rapportId: id }));
    await prisma.rapportRole.createMany({ data: rolesVisibilite });
  }

  // Mise à jour des mentions si spécifiées
  if (data.mentions) {
    await prisma.rapportMention.deleteMany({ where: { rapportId: id } });
    if (data.mentions.length > 0) {
      await prisma.rapportMention.createMany({
        data: data.mentions.map(uid => ({ rapportId: id, userId: uid })),
        skipDuplicates: true,
      });
    }
  }

  const updated = await prisma.rapport.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, role: true } },
      roles: { select: { role: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  await logAudit({ userId: user.id, action: AUDIT_ACTIONS.RAPPORT_UPDATED, model: 'Rapport', modelId: id });

  return updated;
};

/**
 * Supprime un rapport définitivement.
 * Propriétaire uniquement (ses propres rapports), ou ADMIN (tous).
 *
 * @param {number} id - ID du rapport
 * @param {Object} user - Utilisateur demandant la suppression
 */
export const deleteRapport = async (id, user) => {
  const rapport = await prisma.rapport.findUnique({ where: { id } });

  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = rapport.userId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    const error = new Error('Vous ne pouvez supprimer que vos propres rapports.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.rapport.delete({ where: { id } });
  await logAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.RAPPORT_DELETED,
    model: 'Rapport',
    modelId: id,
    metadata: { objet: rapport.objet },
  });
};

/**
 * Toggle star sur un rapport (ajoute ou retire).
 * @param {number} rapportId
 * @param {Object} user
 * @returns {{starred: boolean, starsCount: number}}
 */
export const toggleStar = async (rapportId, user) => {
  const rapport = await prisma.rapport.findUnique({ where: { id: rapportId } });
  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  const existing = await prisma.rapportStar.findUnique({
    where: { rapportId_userId: { rapportId, userId: user.id } },
  });

  let starred;
  if (existing) {
    await prisma.rapportStar.delete({ where: { rapportId_userId: { rapportId, userId: user.id } } });
    starred = false;
    await logAudit({ userId: user.id, action: AUDIT_ACTIONS.RAPPORT_UNSTARRED, model: 'Rapport', modelId: rapportId });
  } else {
    await prisma.rapportStar.create({ data: { rapportId, userId: user.id } });
    starred = true;
    await logAudit({ userId: user.id, action: AUDIT_ACTIONS.RAPPORT_STARRED, model: 'Rapport', modelId: rapportId });
  }

  const starsCount = await prisma.rapportStar.count({ where: { rapportId } });
  return { starred, starsCount };
};

/**
 * Récupère la liste des lecteurs d'un rapport.
 * @param {number} rapportId
 * @param {Object} user - Doit être propriétaire ou ADMIN
 * @returns {Array} Liste des lecteurs avec dates
 */
export const getReaders = async (rapportId, user) => {
  const rapport = await prisma.rapport.findUnique({ where: { id: rapportId } });
  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  if (rapport.userId !== user.id && user.role !== 'ADMIN') {
    const error = new Error('Seul le propriétaire ou l\'admin peut voir les lecteurs.');
    error.statusCode = 403;
    throw error;
  }

  return prisma.rapportRead.findMany({
    where: { rapportId },
    include: { user: { select: { id: true, name: true, role: true, avatar: true } } },
    orderBy: { readAt: 'desc' },
  });
};

/**
 * Archive un rapport (ARCHIVISTE ou ADMIN uniquement).
 * @param {number} id
 * @param {Object} user
 */
export const archiverRapport = async (id, user) => {
  const rapport = await prisma.rapport.findUnique({ where: { id } });
  if (!rapport) {
    const error = new Error('Rapport introuvable.');
    error.statusCode = 404;
    throw error;
  }

  if (!['ADMIN', 'ARCHIVISTE'].includes(user.role)) {
    const error = new Error('Seul l\'archiviste ou l\'administrateur peut archiver un rapport.');
    error.statusCode = 403;
    throw error;
  }

  if (rapport.statut === 'ARCHIVE') {
    const error = new Error('Ce rapport est déjà archivé.');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.rapport.update({
    where: { id },
    data: { statut: 'ARCHIVE' },
  });

  await logAudit({ userId: user.id, action: AUDIT_ACTIONS.RAPPORT_ARCHIVED, model: 'Rapport', modelId: id });

  return updated;
};

/**
 * Vérifie si un utilisateur a accès à un rapport spécifique.
 * @param {Object} rapport - Rapport avec ses roles et mentions
 * @param {Object} user - Utilisateur
 * @returns {boolean}
 */
const checkRapportAccess = (rapport, user) => {
  if (FULL_ACCESS_ROLES.includes(user.role)) return true;
  if (rapport.userId === user.id) return true;

  const roles = rapport.roles.map(r => r.role);
  if (roles.includes('TOUS') || roles.includes(user.role)) return true;

  const isMentioned = rapport.mentions?.some(m => m.userId === user.id);
  if (isMentioned) return true;

  return false;
};
