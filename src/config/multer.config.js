/**
 * @file multer.config.js
 * @description Configuration de Multer pour l'upload sécurisé de fichiers
 * Stockage dans /storage, validation MIME, limite 10 Mo
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024; // 10 Mo

/**
 * Stratégie de stockage : dossier /storage hors du dossier public
 * Nom de fichier = UUID + extension originale pour éviter les collisions
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './storage';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * Filtre de validation MIME côté serveur
 * @param {Object} req - Requête Express
 * @param {Object} file - Fichier uploadé
 * @param {Function} cb - Callback Multer
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Type de fichier non autorisé: ${file.mimetype}. Types acceptés: PDF, Word, Excel, Images`
      ),
      false
    );
  }
};

/** Instance Multer configurée */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/** Instance pour l'upload d'avatar (images uniquement, max 2 Mo) */
export const uploadAvatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Avatar: seuls les formats JPEG, PNG et WebP sont acceptés'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
});
