/**
 * @file auth.validator.js
 * @description Schémas de validation Joi pour les routes d'authentification et de profil
 */

import Joi from 'joi';

/** Rôles opérationnels que l'utilisateur peut proposer lors de l'inscription */
const OPERATIONAL_ROLES = [
  'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL',
  'ARCHIVISTE', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR',
];

/** Tous les rôles du système */
const ALL_ROLES = ['ADMIN', ...OPERATIONAL_ROLES];

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(3).max(150).required()
    .messages({
      'string.min': 'Le nom doit contenir au moins 3 caractères',
      'string.max': 'Le nom ne peut pas dépasser 150 caractères',
      'any.required': 'Le nom complet est obligatoire',
    }),
  email: Joi.string().email().lowercase().required()
    .messages({
      'string.email': 'Adresse email invalide',
      'any.required': 'L\'adresse email est obligatoire',
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      'any.required': 'Le mot de passe est obligatoire',
    }),
  proposedRole: Joi.string().valid(...OPERATIONAL_ROLES).required()
    .messages({
      'any.only': `Rôle invalide. Rôles disponibles: ${OPERATIONAL_ROLES.join(', ')}`,
      'any.required': 'Le rôle proposé est obligatoire',
    }),
});

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required()
    .messages({
      'string.email': 'Adresse email invalide',
      'any.required': 'L\'adresse email est obligatoire',
    }),
  password: Joi.string().required()
    .messages({ 'any.required': 'Le mot de passe est obligatoire' }),
  rememberMe: Joi.boolean().default(false),
});

/**
 * Schéma de validation pour la mise à jour du profil
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(3).max(150)
    .messages({ 'string.min': 'Le nom doit contenir au moins 3 caractères' }),
  currentPassword: Joi.string().when('newPassword', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).messages({ 'any.required': 'Le mot de passe actuel est requis pour le changer' }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
    }),
}).min(0).messages({ 'object.min': 'Au moins un champ à modifier est requis' });


/**
 * Schéma de validation pour la suppression de compte
 */
export const deleteAccountSchema = Joi.object({
  password: Joi.string().required()
    .messages({ 'any.required': 'Confirmation du mot de passe requise' }),
});

/**
 * Middleware générique de validation Joi
 * @param {Joi.ObjectSchema} schema - Schéma Joi à appliquer
 * @param {string} source - Source des données ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });

    if (error) {
      const errors = error.details.map(d => d.message);
      return res.status(422).json({
        success: false,
        message: 'Données invalides',
        errors,
      });
    }

    req[source] = value; // Données nettoyées et validées
    next();
  };
};
