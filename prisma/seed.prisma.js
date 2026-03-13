/**
 * @file seed.prisma.js
 * @description Seeders pour initialiser la BDD avec les rôles, l'admin et des données de test
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = parseInt(12) || 12;

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // ─── Nettoyage des tables dans l'ordre (contraintes FK) ───
  await prisma.warning.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rapportVersion.deleteMany();
  await prisma.rapportMention.deleteMany();
  await prisma.rapportRead.deleteMany();
  await prisma.rapportStar.deleteMany();
  await prisma.rapportRole.deleteMany();
  await prisma.rapport.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Tables nettoyées');

  // ─── Création des utilisateurs de test ───
  const hashedPassword = await bcrypt.hash('123456789', SALT_ROUNDS);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Administrateur Système',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jean Rakoto',
        email: 'maire@gmail.com',
        password: hashedPassword,
        role: 'MAIRE',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Marie Rasoa',
        email: 'adjoint@gmail.com',
        password: hashedPassword,
        role: 'ADJOINT_MAIRE',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Paul Randria',
        email: 'secretaire@gmail.com',
        password: hashedPassword,
        role: 'SECRETAIRE_COMMUNAL',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Hery Rakoton',
        email: 'archiviste@gmail.com',
        password: hashedPassword,
        role: 'ARCHIVISTE',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Fara Ravelo',
        email: 'etatcivil@gmail.com',
        password: hashedPassword,
        role: 'ETAT_CIVIL',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Nivo Andria',
        email: 'tresorerie@gmail.com',
        password: hashedPassword,
        role: 'TRESORERIE',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Solo Rabe',
        email: 'percepteur@gmail.com',
        password: hashedPassword,
        role: 'PERCEPTEUR',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Tojo Raza',
        email: 'regisseur@gmail.com',
        password: hashedPassword,
        role: 'REGISSEUR',
        status: 'ACTIF',
        emailVerifiedAt: new Date(),
      },
    }),
    // Utilisateur en attente de validation
    prisma.user.create({
      data: {
        name: 'Bako Miora',
        email: 'newuser@gmail.com',
        password: hashedPassword,
        role: 'ETAT_CIVIL',
        proposedRole: 'ETAT_CIVIL',
        status: 'EN_ATTENTE',
      },
    }),
  ]);

  console.log(`✅ ${users.length} utilisateurs créés`);

  // ─── Création de rapports de test ───
  const admin = users[0];
  const maire = users[1];
  const secretaire = users[3];

  const rapport1 = await prisma.rapport.create({
    data: {
      objet: 'Rapport de réunion du conseil communal - Mars 2026',
      description: '<p>Compte-rendu de la réunion ordinaire du conseil communal tenue le 10 mars 2026.</p><p>Ordre du jour : Budget, Infrastructure, État civil.</p>',
      statut: 'SOUMIS',
      userId: maire.id,
      publishedAt: new Date(),
      tags: 'conseil,réunion,budget',
      roles: {
        create: [
          { role: 'ADMIN' },
          { role: 'MAIRE' },
          { role: 'ADJOINT_MAIRE' },
          { role: 'SECRETAIRE_COMMUNAL' },
          { role: 'ARCHIVISTE' },
        ],
      },
    },
  });

  const rapport2 = await prisma.rapport.create({
    data: {
      objet: 'Rapport financier - Trésorerie Q1 2026',
      description: '<p>État des finances communales pour le premier trimestre 2026.</p>',
      statut: 'SOUMIS',
      userId: users[6].id, // tresorerie
      publishedAt: new Date(),
      tags: 'finances,budget,trésorerie',
      roles: {
        create: [
          { role: 'ADMIN' },
          { role: 'MAIRE' },
          { role: 'ADJOINT_MAIRE' },
          { role: 'TRESORERIE' },
          { role: 'ARCHIVISTE' },
        ],
      },
    },
  });

  const rapport3 = await prisma.rapport.create({
    data: {
      objet: 'Procès-verbal - Séance du 5 mars 2026',
      description: '<p>PV de la séance extraordinaire du conseil communal.</p>',
      statut: 'BROUILLON',
      userId: secretaire.id,
      tags: 'pv,séance',
    },
  });

  console.log(`✅ 3 rapports de test créés`);

  // ─── Stars et lectures de test ───
  await prisma.rapportStar.create({
    data: { rapportId: rapport1.id, userId: admin.id },
  });
  await prisma.rapportRead.create({
    data: { rapportId: rapport1.id, userId: admin.id },
  });

  console.log('✅ Interactions de test créées');

  // ─── Notifications de test ───
  await prisma.notification.create({
    data: {
      type: 'NOUVEAU_RAPPORT',
      notifiableId: admin.id,
      data: { rapportId: rapport1.id, message: 'Nouveau rapport créé par le Maire', createdBy: maire.name },
    },
  });

  await prisma.notification.create({
    data: {
      type: 'NOUVELLE_INSCRIPTION',
      notifiableId: admin.id,
      data: { userId: users[9].id, message: 'Nouvelle demande d\'inscription', userName: users[9].name },
    },
  });

  console.log('✅ Notifications de test créées');

  console.log('\n🎉 Seeding terminé avec succès !');
  console.log('\n📋 Comptes de test (mot de passe: 123456789):');
  users.forEach(u => {
    console.log(`   ${u.role.padEnd(20)} | ${u.email}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
