/**
 * @file database.config.js
 * @description Configuration et instance singleton du client Prisma
 */

import { PrismaClient } from '@prisma/client';

/**
 * Instance singleton Prisma avec logging conditionnel selon l'environnement.
 * En développement, les requêtes sont loggées pour faciliter le débogage.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Gestion propre de la déconnexion
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
