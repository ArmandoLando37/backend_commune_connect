/**
 * @file errorHandler.middleware.js
 * @description Gestionnaire d'erreurs global Express - intercepte toutes les erreurs non traitées
 */

/**
 * Middleware de gestion centralisée des erreurs.
 * Doit être déclaré en DERNIER dans app.js (après toutes les routes).
 *
 * @param {Error} err - Erreur capturée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Prochain middleware (requis pour qu'Express reconnaisse ce middleware comme gestionnaire d'erreurs)
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ErrorHandler] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // ─── Erreurs Multer (upload de fichiers) ───
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `Fichier trop volumineux. Taille maximum: ${Math.round(parseInt(process.env.UPLOAD_MAX_SIZE || 10485760) / 1024 / 1024)} Mo`,
    });
  }

  if (err.message?.includes('Type de fichier non autorisé')) {
    return res.status(415).json({
      success: false,
      message: err.message,
    });
  }

  // ─── Erreurs Prisma ───
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'champ';
    return res.status(409).json({
      success: false,
      message: `La valeur de "${field}" existe déjà.`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Ressource introuvable.',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Référence à une entité inexistante.',
    });
  }

  // ─── Erreurs JWT ───
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session expirée. Veuillez vous reconnecter.',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide.',
    });
  }

  // ─── Erreur de validation Joi (si non interceptée en amont) ───
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      message: 'Données invalides',
      errors: err.details.map(d => d.message),
    });
  }

  // ─── Erreur générique ───
  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500
    ? 'Erreur interne du serveur. Veuillez réessayer plus tard.'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
