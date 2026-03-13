/**
 * @file auth.test.js
 * @description Tests d'intégration pour les routes d'authentification
 * Framework: Jest + Supertest
 */

import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.config.js';

describe('Auth API - Authentification', () => {
  let adminToken;
  let testUserId;

  // ─── Setup: nettoyer les utilisateurs de test ───
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test_jest' } } });

    // Connexion admin pour les tests nécessitant un token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@commune.mg', password: 'Password123!' });

    adminToken = loginRes.body.data?.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test_jest' } } });
    await prisma.$disconnect();
  });

  // ─── POST /api/auth/register ───
  describe('POST /api/auth/register', () => {
    it('devrait créer un compte avec statut EN_ATTENTE', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Jest User',
          email: 'test_jest_1@commune.mg',
          password: 'Password123!',
          proposedRole: 'ETAT_CIVIL',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.status).toBe('EN_ATTENTE');
      testUserId = res.body.data.user.id;
    });

    it('devrait rejeter un email déjà utilisé (409)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Test',
          email: 'test_jest_1@commune.mg',
          password: 'Password123!',
          proposedRole: 'ETAT_CIVIL',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('devrait rejeter un mot de passe faible (422)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password User',
          email: 'test_jest_weak@commune.mg',
          password: 'weak',
          proposedRole: 'ETAT_CIVIL',
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('devrait rejeter un rôle ADMIN lors de l\'inscription', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Fake Admin',
          email: 'test_jest_admin@commune.mg',
          password: 'Password123!',
          proposedRole: 'ADMIN',
        });

      expect(res.statusCode).toBe(422); // ADMIN non autorisé à l'inscription
    });
  });

  // ─── POST /api/auth/login ───
  describe('POST /api/auth/login', () => {
    it('devrait connecter l\'admin avec succès', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@commune.mg', password: 'Password123!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('devrait bloquer un compte EN_ATTENTE (403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_jest_1@commune.mg', password: 'Password123!' });

      expect(res.statusCode).toBe(403);
    });

    it('devrait retourner 401 pour un mauvais mot de passe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@commune.mg', password: 'WrongPassword!' });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /api/auth/me ───
  describe('GET /api/auth/me', () => {
    it('devrait retourner les infos de l\'utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('devrait retourner 401 sans token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });
});
