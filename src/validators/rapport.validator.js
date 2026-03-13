/**
 * @file rapport.validator.js
 * @description Schémas de validation Joi pour les opérations sur les rapports
 */

import Joi from 'joi';

const ALL_ROLES = [
  'ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL',
  'ARCHIVISTE', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR', 'TOUS',
];

/**
 * Schéma de création d'un rapport
 */
export const createRapportSchema = Joi.object({
  objet: Joi.string().trim().min(5).max(300).required()
    .messages({
      'string.min': 'L\'objet doit contenir au moins 5 caractères',
      'string.max': 'L\'objet ne peut pas dépasser 300 caractères',
      'any.required': 'L\'objet du rapport est obligatoire',
    }),
  description: Joi.string().min(10).required()
    .messages({
      'string.min': 'La description doit contenir au moins 10 caractères',
      'any.required': 'La description est obligatoire',
    }),
  statut: Joi.string().valid('BROUILLON', 'SOUMIS').default('BROUILLON'),
  visibilite: Joi.array()
    .items(Joi.string().valid(...ALL_ROLES))
    .default(['TOUS'])
    .messages({ 'any.only': 'Rôle de visibilité invalide' }),
  tags: Joi.string().max(500).optional().allow(''),
  mentions: Joi.array().items(Joi.number().integer().positive()).default([]),
});

/**
 * Schéma de mise à jour d'un rapport
 */
export const updateRapportSchema = Joi.object({
  objet: Joi.string().trim().min(5).max(300),
  description: Joi.string().min(10),
  statut: Joi.string().valid('BROUILLON', 'SOUMIS', 'ARCHIVE'),
  visibilite: Joi.array().items(Joi.string().valid(...ALL_ROLES)),
  tags: Joi.string().max(500).allow(''),
  mentions: Joi.array().items(Joi.number().integer().positive()),
}).min(1).messages({ 'object.min': 'Au moins un champ à modifier est requis' });

/**
 * Schéma des paramètres de requête pour la liste des rapports
 */
export const listRapportsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  statut: Joi.string().valid('BROUILLON', 'SOUMIS', 'MODIFIE', 'ARCHIVE', 'SIGNALE').optional(),
  search: Joi.string().max(200).optional().allow(''),
  tags: Joi.string().optional().allow(''),
  userId: Joi.number().integer().positive().optional(),
  dateDebut: Joi.date().iso().optional(),
  dateFin: Joi.date().iso().optional(),
  orderBy: Joi.string().valid('createdAt', 'updatedAt', 'objet').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Schéma pour l'ajout d'un avertissement (admin)
 */
export const warningSchema = Joi.object({
  message: Joi.string().trim().min(10).max(1000).required()
    .messages({
      'string.min': 'Le message doit contenir au moins 10 caractères',
      'any.required': 'Le message d\'avertissement est obligatoire',
    }),
});

/**
 * Schéma de validation/rejet de compte utilisateur
 */
export const validateUserSchema = Joi.object({
  action: Joi.string().valid('VALIDER', 'REJETER').required()
    .messages({ 'any.required': 'L\'action est requise (VALIDER ou REJETER)' }),
  role: Joi.string().valid(
    'ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL',
    'ARCHIVISTE', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR'
  ).when('action', {
    is: 'VALIDER',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  motif: Joi.string().max(500).when('action', {
    is: 'REJETER',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }).messages({ 'any.required': 'Le motif est obligatoire en cas de rejet' }),
});

/**
 * Schéma de suspension d'un utilisateur
 */
export const suspendUserSchema = Joi.object({
  motif: Joi.string().trim().min(5).max(500).required()
    .messages({ 'any.required': 'Le motif de suspension est obligatoire' }),
  dureeJours: Joi.number().integer().min(1).max(365).optional()
    .messages({ 'number.min': 'La durée minimum est 1 jour' }),
});

import { validate } from './auth.validator.js';
export { validate };
