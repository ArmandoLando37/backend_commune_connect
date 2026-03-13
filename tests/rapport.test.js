/**
 * @file rapport.test.js
 * @description Tests d'intégration pour la gestion des rapports
 */

import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.config.js';

describe('Rapports API - CRUD et fonctionnalités', () => {
  let adminToken, maireToken;
  let testRapportId;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@commune.mg', password: 'Password123!' });
    adminToken = adminLogin.body.data?.token;

    const maireLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maire@commune.mg', password: 'Password123!' });
    maireToken = maireLogin.body.data?.token;
  });

  afterAll(async () => {
    // Nettoyage des rapports créés pendant les tests
    if (testRapportId) {
      await prisma.rapport.deleteMany({ where: { id: testRapportId } });
    }
    await prisma.$disconnect();
  });

  // ─── Création ───
  describe('POST /api/rapports', () => {
    it('devrait créer un rapport en brouillon', async () => {
      const res = await request(app)
        .post('/api/rapports')
        .set('Authorization', `Bearer ${maireToken}`)
        .send({
          objet: 'Rapport de test Jest - CRUD',
          description: 'Contenu du rapport créé lors des tests automatisés.',
          statut: 'BROUILLON',
          visibilite: ['MAIRE', 'ADMIN'],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.rapport.statut).toBe('BROUILLON');
      testRapportId = res.body.data.rapport.id;
    });
  });

  // ─── Lecture ───
  describe('GET /api/rapports/:id', () => {
    it('devrait récupérer un rapport et enregistrer la lecture', async () => {
      if (!testRapportId) return;

      const res = await request(app)
        .get(`/api/rapports/${testRapportId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rapport.id).toBe(testRapportId);
      expect(res.body.data.rapport.isRead).toBe(true);
    });

    it('devrait retourner 404 pour un rapport inexistant', async () => {
      const res = await request(app)
        .get('/api/rapports/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── Modification ───
  describe('PUT /api/rapports/:id', () => {
    it('devrait modifier un rapport', async () => {
      if (!testRapportId) return;

      const res = await request(app)
        .put(`/api/rapports/${testRapportId}`)
        .set('Authorization', `Bearer ${maireToken}`)
        .send({ objet: 'Objet modifié par les tests' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rapport.objet).toBe('Objet modifié par les tests');
    });
  });

  // ─── Stars ───
  describe('POST /api/rapports/:id/star', () => {
    it('devrait ajouter une star', async () => {
      if (!testRapportId) return;

      const res = await request(app)
        .post(`/api/rapports/${testRapportId}/star`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.starred).toBe(true);
    });

    it('devrait retirer la star (toggle)', async () => {
      if (!testRapportId) return;

      const res = await request(app)
        .post(`/api/rapports/${testRapportId}/star`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.starred).toBe(false);
    });
  });

  // ─── Pagination ───
  describe('GET /api/rapports', () => {
    it('devrait retourner une liste paginée', async () => {
      const res = await request(app)
        .get('/api/rapports?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.limit).toBe(10);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
