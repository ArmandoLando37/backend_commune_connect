/**
 * @file app.js
 * @description Configuration principale de l'application Express
 * Middlewares globaux, routes, documentation Swagger, gestion d'erreurs
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.config.js';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware.js';
import errorHandler from './middlewares/errorHandler.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import rapportRoutes from './routes/rapport.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// ─────────────────────────────────────────
// MIDDLEWARES DE SÉCURITÉ
// ─────────────────────────────────────────

/**
 * Helmet: sécurise les headers HTTP (CSP, X-Frame-Options, XSS Protection, etc.)
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permet le chargement des fichiers uploadés
  })
);

/**
 * CORS: autorise uniquement le client frontend configuré
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   })
// );

// ─────────────────────────────────────────
// PARSERS ET MIDDLEWARES GLOBAUX
// ─────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting général sur toutes les routes API
app.use('/api', generalRateLimiter);

// Servir les fichiers uploadés (hors du dossier public, accès contrôlé)
app.use('/storage', express.static(process.env.UPLOAD_DIR || './storage'));

// ─────────────────────────────────────────
// DOCUMENTATION SWAGGER
// ─────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #1a56db; }',
    customSiteTitle: 'CommuneConnecte API Docs',
    swaggerOptions: {
      persistAuthorization: true, // Conserve le token JWT entre les requêtes
    },
  })
);

// Endpoint JSON de la spec OpenAPI (pour Postman/Insomnia)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// ─────────────────────────────────────────
// ROUTES API
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Route de santé (health check)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CommuneConnecte API opérationnelle',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────
// ROUTE 404 (catch-all non-existant)
// ─────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────
// GESTIONNAIRE D'ERREURS GLOBAL (doit être en dernier)
// ─────────────────────────────────────────
app.use(errorHandler);

export default app;
