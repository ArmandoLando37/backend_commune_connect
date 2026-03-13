/**
 * @file response.utils.js
 * @description Helpers pour formater les réponses API de manière cohérente
 */

/**
 * Réponse de succès standardisée
 * @param {Object} res - Objet response Express
 * @param {*} data - Données à retourner
 * @param {string} message - Message de succès
 * @param {number} statusCode - Code HTTP (défaut: 200)
 */
export const sendSuccess = (res, data = null, message = 'Succès', statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Réponse d'erreur standardisée
 * @param {Object} res - Objet response Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP (défaut: 400)
 * @param {Array} errors - Détails des erreurs de validation
 */
export const sendError = (res, message = 'Une erreur est survenue', statusCode = 400, errors = []) => {
  const response = { success: false, message };
  if (errors.length > 0) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Réponse paginée standardisée
 * @param {Object} res - Objet response Express
 * @param {Array} items - Tableau de données
 * @param {Object} meta - Métadonnées de pagination
 * @param {string} message - Message de succès
 */
export const sendPaginated = (res, items, meta, message = 'Succès') => {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
  });
};

/**
 * Calcule l'offset pour la pagination Prisma
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} limit - Nombre d'éléments par page
 * @returns {{skip: number, take: number}}
 */
export const getPaginationParams = (page = 1, limit = 25) => {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  return {
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
    page: parsedPage,
    limit: parsedLimit,
  };
};
