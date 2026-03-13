/**
 * @file rbac.test.js
 * @description Tests de la matrice RBAC - vérifie l'étanchéité des rôles et permissions
 */

import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.config.js';

describe('RBAC - Contrôle d\'accès par rôle', () => {
  const tokens = {};

  beforeAll(async () => {
    // Obtenir les tokens pour chaque rôle testé
    const roles = [
      { email: 'admin@commune.mg', key: 'admin' },
      { email: 'maire@commune.mg', key: 'maire' },
      { email: 'archiviste@commune.mg', key: 'archiviste' },
      { email: 'etatcivil@commune.mg', key: 'etatcivil' },
    ];

    for (const { email, key } of roles) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'Password123!' });

      tokens[key] = res.body.data?.token;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─── Test: Accès aux routes admin ───
  describe('Routes /api/admin - réservées ADMIN', () => {
    it('ADMIN devrait accéder au dashboard (200)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokens.admin}`);
      expect(res.statusCode).toBe(200);
    });

    it('MAIRE devrait être bloqué du dashboard admin (403)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${tokens.maire}`);
      expect(res.statusCode).toBe(403);
    });

    it('ARCHIVISTE devrait être bloqué des routes admin (403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.archiviste}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Test: Création de rapports ───
  describe('POST /api/rapports - permission creerRapport', () => {
    it('ARCHIVISTE ne devrait pas créer un rapport (403)', async () => {
      const res = await request(app)
        .post('/api/rapports')
        .set('Authorization', `Bearer ${tokens.archiviste}`)
        .send({
          objet: 'Test rapport archiviste',
          description: 'Ce rapport ne devrait pas être créé',
          statut: 'BROUILLON',
        });
      expect(res.statusCode).toBe(403);
    });

    it('MAIRE devrait créer un rapport (201)', async () => {
      const res = await request(app)
        .post('/api/rapports')
        .set('Authorization', `Bearer ${tokens.maire}`)
        .send({
          objet: 'Test rapport RBAC - Maire',
          description: 'Rapport de test pour la suite RBAC.',
          statut: 'BROUILLON',
          visibilite: ['MAIRE'],
        });
      expect(res.statusCode).toBe(201);
    });
  });

  // ─── Test: Token invalide ───
  describe('Sécurité JWT', () => {
    it('devrait rejeter un token falsifié (401)', async () => {
      const res = await request(app)
        .get('/api/rapports')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.statusCode).toBe(401);
    });

    it('devrait rejeter une requête sans token (401)', async () => {
      const res = await request(app).get('/api/rapports');
      expect(res.statusCode).toBe(401);
    });
  });
});
