/**
 * @file swagger.config.js
 * @description Configuration Swagger/OpenAPI 3.0 pour la documentation de l'API CommuneConnecte
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CommuneConnecte API',
      version: '1.0.0',
      description: `
## API de gestion de rapports communaux

**CommuneConnecte** est une plateforme de gestion de rapports pour les communes malgaches.

### Authentification
Toutes les routes (sauf \`/auth/login\` et \`/auth/register\`) nécessitent un token JWT.
Inclure le token dans le header : \`Authorization: Bearer <token>\`

### Rôles disponibles
- **ADMIN** - Accès complet à toute la plateforme
- **MAIRE** - Chef de l'exécutif communal
- **ADJOINT_MAIRE** - Assistant du Maire
- **SECRETAIRE_COMMUNAL** - Gestion de la correspondance
- **ARCHIVISTE** - Conservation des documents
- **ETAT_CIVIL** - Actes d'état civil
- **TRESORERIE** - Finances communales
- **PERCEPTEUR** - Perception des taxes
- **REGISSEUR** - Régie communale
      `,
      contact: {
        name: 'Support CommuneConnecte',
        email: 'support@commune.mg',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:2025/api',
        description: 'Serveur actif',
      },
    ],
    tags: [
      { name: 'Authentification', description: 'Inscription, connexion, profil utilisateur' },
      { name: 'Rapports', description: 'Gestion des rapports communaux' },
      { name: 'Administration', description: 'Gestion des utilisateurs et statistiques (ADMIN)' },
      { name: 'Notifications', description: 'Notifications in-app' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via POST /auth/login',
        },
      },
      schemas: {
        // ─── User Schemas ───
        UserRegister: {
          type: 'object',
          required: ['name', 'email', 'password', 'proposedRole'],
          properties: {
            name: { type: 'string', example: 'Jean Rakoto', description: 'Nom complet' },
            email: { type: 'string', format: 'email', example: 'jean@commune.mg' },
            password: { type: 'string', minLength: 8, example: 'Password123!' },
            proposedRole: {
              type: 'string',
              enum: ['MAIRE','ADJOINT_MAIRE','SECRETAIRE_COMMUNAL','ARCHIVISTE','ETAT_CIVIL','TRESORERIE','PERCEPTEUR','REGISSEUR'],
              example: 'SECRETAIRE_COMMUNAL',
            },
          },
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@commune.mg' },
            password: { type: 'string', example: 'Password123!' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Jean Rakoto' },
            email: { type: 'string', example: 'jean@commune.mg' },
            role: { type: 'string', example: 'MAIRE' },
            status: { type: 'string', example: 'ACTIF' },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Rapport Schemas ───
        RapportCreate: {
          type: 'object',
          required: ['objet', 'description'],
          properties: {
            objet: { type: 'string', example: 'Rapport de réunion - Mars 2026' },
            description: { type: 'string', example: '<p>Contenu du rapport...</p>' },
            statut: { type: 'string', enum: ['BROUILLON', 'SOUMIS'], default: 'BROUILLON' },
            visibilite: {
              type: 'array',
              items: { type: 'string', enum: ['ADMIN','MAIRE','ADJOINT_MAIRE','SECRETAIRE_COMMUNAL','ARCHIVISTE','ETAT_CIVIL','TRESORERIE','PERCEPTEUR','REGISSEUR','TOUS'] },
              example: ['MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL'],
            },
            tags: { type: 'string', example: 'conseil,réunion' },
            mentions: { type: 'array', items: { type: 'integer' }, example: [2, 3] },
          },
        },
        RapportResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            objet: { type: 'string' },
            description: { type: 'string' },
            statut: { type: 'string', enum: ['BROUILLON','SOUMIS','MODIFIE','ARCHIVE','SIGNALE'] },
            tags: { type: 'string', nullable: true },
            fichier: { type: 'string', nullable: true },
            userId: { type: 'integer' },
            user: { $ref: '#/components/schemas/UserResponse' },
            starsCount: { type: 'integer' },
            isStarred: { type: 'boolean' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        // ─── Notification Schema ───
        NotificationResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            type: { type: 'string', example: 'NOUVEAU_RAPPORT' },
            data: { type: 'object' },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ─── Error Schema ───
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Message d\'erreur' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        // ─── Success Schema ───
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        // ─── Pagination Schema ───
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);