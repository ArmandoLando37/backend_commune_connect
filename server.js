/**
 * @file server.js
 * @description Point d'entrée du serveur CommuneConnecte
 * Démarre Express (port 2025) et Socket.io (port 2026) séparément
 */

import http from 'http';
import { Server as SocketServer } from 'socket.io';


import app from './src/app.js';
import { verifyToken } from './src/utils/jwt.utils.js';
import { setIoInstance } from './src/services/notification.service.js';
import prisma from './src/config/database.config.js';
import { configDotenv } from 'dotenv';

const API_PORT = parseInt(process.env.PORT) || 2025;
const HOST = process.env.HOST || 'localhost';
const SOCKET_PORT = parseInt(process.env.SOCKET_PORT) || 2026;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

configDotenv()
// ─────────────────────────────────────────
// SERVEUR HTTP (Express API - port 2025)
// ─────────────────────────────────────────
const apiServer = http.createServer(app);

apiServer.listen(API_PORT, HOST, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║        CommuneConnecte API               ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  🚀 API HTTP   : http://${HOST}:${API_PORT}   ║`);
  console.log(`║  📚 Swagger    : http://${HOST}:${API_PORT}/api/docs ║`);
  console.log(`║  🌍 Env        : ${(process.env.NODE_ENV || 'development').padEnd(23)}║`);
  console.log('╚══════════════════════════════════════════╝\n');
});

// ─────────────────────────────────────────
// SERVEUR SOCKET.IO (WebSocket - port 2026)
// ─────────────────────────────────────────
const socketServer = http.createServer();

const io = new SocketServer(socketServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Reconnexion automatique configurée côté serveur
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Middleware d'authentification Socket.io ───
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Token manquant. Connexion WebSocket refusée.'));
    }

    const decoded = verifyToken(token);

    // Vérification du statut de l'utilisateur en BDD
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIF') {
      return next(new Error('Compte inactif ou introuvable.'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Token invalide ou expiré.'));
  }
});

// ─── Gestion des connexions Socket.io ───
io.on('connection', (socket) => {
  const { user } = socket;
  console.log(`[Socket.io] 🔌 Connexion: ${user.name} (${user.role}) - Socket: ${socket.id}`);

  // Rejoindre la room privée de l'utilisateur
  socket.join(`user:${user.id}`);

  // Rejoindre la room de son rôle (pour les notifications de groupe)
  socket.join(`role:${user.role}`);

  // Émettre un accusé de connexion
  socket.emit('connected', {
    userId: user.id,
    message: `Bienvenue, ${user.name}!`,
    timestamp: new Date().toISOString(),
  });

  // ─── Événement : marquer une notification comme lue depuis le socket ───
  socket.on('notification:markRead', async (notificationId) => {
    try {
      await prisma.notification.updateMany({
        where: { id: parseInt(notificationId), notifiableId: user.id },
        data: { readAt: new Date() },
      });
      socket.emit('notification:readConfirmed', { notificationId });
    } catch (error) {
      socket.emit('error', { message: 'Erreur lors du marquage de la notification.' });
    }
  });

  // ─── Événement : ping/pong pour maintenir la connexion ───
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // ─── Déconnexion ───
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] 🔌 Déconnexion: ${user.name} - Raison: ${reason}`);
  });

  // ─── Gestion des erreurs socket ───
  socket.on('error', (error) => {
    console.error(`[Socket.io] Erreur socket (${user.name}):`, error.message);
  });
});

socketServer.listen(SOCKET_PORT, () => {
  console.log(`  🔌 Socket.io   : http://localhost:${SOCKET_PORT}/socket\n`);
});

// Injection de l'instance io dans le service de notifications
setIoInstance(io);

// ─────────────────────────────────────────
// GESTION PROPRE DE L'ARRÊT (SIGTERM/SIGINT)
// ─────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Signal ${signal} reçu. Arrêt en cours...`);
  try {
    await prisma.$disconnect();
    apiServer.close(() => console.log('[Server] Serveur HTTP fermé.'));
    socketServer.close(() => console.log('[Server] Serveur Socket.io fermé.'));
    process.exit(0);
  } catch (error) {
    console.error('[Server] Erreur lors de l\'arrêt:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Capture des erreurs non gérées
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

export { io };
