/**
 * @file auth.service.js
 * @description Logique métier pour l'authentification : register, login, logout, profil
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/database.config.js';
import { generateToken } from '../utils/jwt.utils.js';
import { logAudit, AUDIT_ACTIONS } from '../utils/auditLog.utils.js';
import { configDotenv } from 'dotenv';
configDotenv()
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 12;

/**
 * Inscrit un nouvel utilisateur avec statut "EN_ATTENTE".
 * Notifie l'administrateur de la nouvelle demande.
 *
 * @param {Object} data - Données d'inscription validées
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.proposedRole
 * @param {string|null} avatarPath - Chemin de l'avatar uploadé
 * @returns {Object} Utilisateur créé (sans mot de passe)
 */
export const registerUser = async (data, avatarPath = null) => {
  const { name, email, password, proposedRole } = data;

  // Vérification unicité email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Cette adresse email est déjà utilisée.');
    error.statusCode = 409;
    throw error;
  }

  // Hachage du mot de passe
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Création du compte
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      proposedRole,
      role: proposedRole, // Rôle temporaire, confirmé par l'admin
      status: 'EN_ATTENTE',
      avatar: avatarPath,
    },
    select: {
      id: true, name: true, email: true,
      role: true, proposedRole: true, status: true,
      avatar: true, createdAt: true,
    },
  });

  // Notification à l'admin
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', status: 'ACTIF' } });
  if (admin) {
    await prisma.notification.create({
      data: {
        type: 'NOUVELLE_INSCRIPTION',
        notifiableId: admin.id,
        data: {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          proposedRole: user.proposedRole,
          message: `Nouvelle demande d'inscription de ${user.name} (${user.proposedRole})`,
        },
      },
    });
  }

  // Journal d'audit
  await logAudit({ action: AUDIT_ACTIONS.REGISTER, model: 'User', modelId: user.id });

  return user;
};

/**
 * Connecte un utilisateur et retourne un token JWT.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} ipAddress - IP pour l'audit
 * @returns {{user: Object, token: string}}
 */
export const loginUser = async (email, password, ipAddress) => {
  // Recherche de l'utilisateur
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("user recuperer avec ", email," et ",password,": ",user)
  if (!user) {
    const error = new Error('Email incorrect.');
    error.statusCode = 401;
    throw error;
  }

  // Vérification du statut avant de vérifier le mot de passe (évite l'énumération)
  if (user.status === 'EN_ATTENTE') {
    const error = new Error('Votre compte est en attente de validation par l\'administrateur.');
    error.statusCode = 403;
    throw error;
  }

  if (user.status === 'SUSPENDU') {
    const suspMsg = user.suspensionFin
      ? ` jusqu'au ${user.suspensionFin.toLocaleDateString('fr-MG')}`
      : '';
    const error = new Error(`Votre compte a été suspendu${suspMsg}. Motif: ${user.suspensionMotif || 'Non précisé'}`);
    error.statusCode = 403;
    throw error;
  }

  if (user.status === 'REJETE') {
    const error = new Error('Votre demande d\'inscription a été rejetée.');
    error.statusCode = 403;
    throw error;
  }
  console.log("await bcrypt.compare(password, user.password) : ",await bcrypt.compare(password, user.password))
  // Vérification du mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await logAudit({ userId: user.id, action: 'LOGIN_FAILED', ipAddress });
    const error = new Error('Mot de passe incorrect.');
    error.statusCode = 401;
    throw error;
  }

  // Génération du token JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Mise à jour de la date de dernière connexion
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Journal d'audit
  await logAudit({ userId: user.id, action: AUDIT_ACTIONS.LOGIN, ipAddress });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

/**
 * Déconnecte l'utilisateur (audit log - le token est invalidé côté client).
 * @param {number} userId
 * @param {string} ipAddress
 */
export const logoutUser = async (userId, ipAddress) => {
  await logAudit({ userId, action: AUDIT_ACTIONS.LOGOUT, ipAddress });
};

/**
 * Retourne les informations de l'utilisateur connecté.
 * @param {number} userId
 * @returns {Object} Utilisateur avec statistiques
 */
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true,
      status: true, avatar: true, createdAt: true, lastLoginAt: true,
      _count: { select: { rapports: true } },
    },
  });

  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Met à jour le profil de l'utilisateur (nom, avatar, mot de passe).
 *
 * @param {number} userId
 * @param {Object} data - Données validées à mettre à jour
 * @param {string|null} avatarPath - Nouveau chemin avatar si uploadé
 * @returns {Object} Utilisateur mis à jour
 */
export const updateProfile = async (userId, data, avatarPath = null) => {
  const { name, currentPassword, newPassword } = data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};

  if (name) updateData.name = name;
  if (avatarPath) updateData.avatar = avatarPath;

  // Changement de mot de passe
  if (newPassword) {
    if (!currentPassword) {
      const error = new Error('Mot de passe actuel requis pour le modifier.');
      error.statusCode = 400;
      throw error;
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      const error = new Error('Mot de passe actuel incorrect.');
      error.statusCode = 401;
      throw error;
    }
    updateData.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, status: true, avatar: true, updatedAt: true },
  });

  await logAudit({ userId, action: AUDIT_ACTIONS.PROFILE_UPDATED, model: 'User', modelId: userId });

  return updated;
};
