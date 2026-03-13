# 🏛️ CommuneConnecte - API Backend

**Plateforme de Gestion de Rapports Communaux** — Backend Node.js + Express + Prisma + Socket.io

---

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Démarrage](#démarrage)
- [Documentation API](#documentation-api)
- [Architecture](#architecture)
- [Rôles et permissions](#rôles-et-permissions)
- [WebSocket](#websocket)
- [Tests](#tests)

---

## ⚙️ Prérequis

- **Node.js** v20+ (`node --version`)
- **MySQL** 8.0+
- **npm** v9+

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone <repo-url> api_commune_connecte
cd api_commune_connecte

# 2. Installer les dépendances
npm install

# 3. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (DATABASE_URL, JWT_SECRET, etc.)
```
## SOKAFANA NY XAMP NA WAMP

## LANCER-na ny commance  npx prisma migrate dev

## LANCER-na ny commance  npm run db:seed
---

## 🔧 Configuration

Éditer le fichier `.env` :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion MySQL | `mysql://root:pass@localhost:3306/commune_connecte` |
| `PORT` | Port de l'API HTTP | `2025` |
| `SOCKET_PORT` | Port WebSocket Socket.io | `2026` |
| `JWT_SECRET` | Clé secrète JWT (min 32 chars) | `123456789` |
| `JWT_EXPIRES_IN` | Durée du token | `7d` |
| `CLIENT_URL` | URL du frontend React | `http://localhost:5173` |
| `UPLOAD_DIR` | Dossier de stockage fichiers | `./storage` |
| `UPLOAD_MAX_SIZE` | Taille max fichier (bytes) | `10485760` (10 Mo) |

---

## 🗄️ Base de données

```bash
# Créer la base de données MySQL
mysql -u root -p -e "CREATE DATABASE commune_connecte CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev --name init

# Injecter les données de test (9 rôles + comptes fictifs)
npm run db:seed

# Interface graphique Prisma Studio (optionnel)
npm run db:studio
```

### Comptes de test (mot de passe: `Password123!`)

| Rôle | Email |
|------|-------|
| ADMIN | admin@commune.mg |
| MAIRE | maire@commune.mg |
| ADJOINT_MAIRE | adjoint@commune.mg |
| SECRETAIRE_COMMUNAL | secretaire@commune.mg |
| ARCHIVISTE | archiviste@commune.mg |
| ETAT_CIVIL | etatcivil@commune.mg |
| TRESORERIE | tresorerie@commune.mg |
| PERCEPTEUR | percepteur@commune.mg |
| REGISSEUR | regisseur@commune.mg |

---

## ▶️ Démarrage

```bash
# Développement (avec rechargement automatique)
npm run dev

# Production
npm start
```

**Serveurs démarrés :**
- 🚀 **API REST** : `http://localhost:2025/api`
- 📚 **Swagger UI** : `http://localhost:2025/api/docs`
- 🔌 **WebSocket** : `http://localhost:2026/socket`
- 💚 **Health check** : `http://localhost:2025/api/health`

---

## 📚 Documentation API

La documentation interactive Swagger est disponible à l'adresse :
```
http://localhost:2025/api/docs
```

La spec OpenAPI JSON est disponible à :
```
http://localhost:2025/api/docs.json
```

### Authentification dans Swagger

1. Cliquer sur **POST /auth/login**
2. Utiliser les identifiants de test
3. Copier le token retourné
4. Cliquer sur le bouton **Authorize** (🔒) en haut
5. Saisir : `Bearer <votre_token>`

---

## 🏗️ Architecture

```
api_commune_connecte/
├── prisma/
│   ├── schema.prisma          # Schéma BDD (tables, enums, relations)
│   └── seed.prisma.js         # Données initiales
│
├── src/
│   ├── config/
│   │   ├── database.config.js # Singleton Prisma
│   │   ├── jwt.config.js      # Options JWT
│   │   ├── multer.config.js   # Upload fichiers
│   │   ├── permissions.config.js # Matrice RBAC
│   │   └── swagger.config.js  # Spec OpenAPI
│   │
│   ├── controllers/           # Gestion requête → réponse
│   ├── middlewares/           # JWT auth, RBAC, rate limit, erreurs
│   ├── routes/                # Définition routes + JSDoc Swagger
│   ├── services/              # Logique métier (Prisma queries)
│   ├── utils/                 # JWT, réponses, audit log
│   ├── validators/            # Schémas Joi
│   └── app.js                 # Config Express
│
├── tests/                     # Tests Jest
├── storage/                   # Fichiers uploadés (hors public)
└── server.js                  # Point d'entrée (HTTP + Socket.io)
```

---

## 👥 Rôles et permissions

| Permission | ADMIN | MAIRE | ADJOINT | SECRÉTAIRE | ARCHIVISTE | AUTRES |
|------------|-------|-------|---------|------------|------------|--------|
| Valider comptes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voir tous rapports | ✅ | ✅ | ✅ | Partiel | ✅ | Partiel |
| Créer rapport | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Archiver rapport | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Ajouter warning | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**PARTIEL** = uniquement les rapports de son propre rôle ou ses propres rapports.

---

## 🔌 WebSocket (Socket.io)

**URL** : `http://localhost:2026/socket`

### Connexion

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:2026', {
  auth: { token: 'Bearer <jwt_token>' }
});
```

### Événements côté client (écouter)

| Événement | Description | Payload |
|-----------|-------------|---------|
| `connected` | Confirmation de connexion | `{ userId, message }` |
| `notification:new` | Nouvelle notification | `{ id, type, data, createdAt }` |
| `notifications:allRead` | Toutes lues | `{ timestamp }` |
| `pong` | Réponse au ping | `{ timestamp }` |

### Événements côté client (émettre)

| Événement | Description | Payload |
|-----------|-------------|---------|
| `notification:markRead` | Marquer comme lue | `notificationId` |
| `ping` | Test de connexion | - |

### Types de notifications

- `NOUVEAU_RAPPORT` - Rapport publié visible par le rôle
- `MENTION` - Utilisateur mentionné dans un rapport
- `NOUVELLE_INSCRIPTION` - Nouvelle demande (→ Admin)
- `COMPTE_VALIDE` / `COMPTE_REJETE` - Résultat validation
- `RAPPORT_AVERTISSEMENT` - Warning admin sur rapport
- `COMPTE_SUSPENDU` - Compte suspendu

---

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Un fichier spécifique
npx jest tests/auth.test.js --verbose

# Avec couverture de code
npx jest --coverage
```

**Couverture cible : 70% minimum** sur Auth, Rapports, Permissions (RBAC).

---

## 🔒 Sécurité

- **JWT HS256** - Tous les endpoints protégés sauf `/auth/login` et `/auth/register`
- **bcryptjs** - Hachage des mots de passe (coût: 12)
- **Helmet** - Headers HTTP sécurisés (CSP, XSS, X-Frame-Options)
- **CORS** - Origine unique autorisée (CLIENT_URL)
- **Rate Limiting** - 5 tentatives login/min, 100 req/min général
- **Joi** - Validation stricte de toutes les entrées
- **Audit Log** - Toutes les actions critiques tracées en BDD

---

## 📦 Routes API

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/login` | Connexion | Non |
| POST | `/api/auth/logout` | Déconnexion | Oui |
| GET | `/api/auth/me` | Mon profil | Oui |
| PUT | `/api/auth/profile` | Modifier profil | Oui |
| GET | `/api/rapports` | Liste rapports | Oui |
| POST | `/api/rapports` | Créer rapport | Oui |
| GET | `/api/rapports/:id` | Détail rapport | Oui |
| PUT | `/api/rapports/:id` | Modifier rapport | Oui |
| DELETE | `/api/rapports/:id` | Supprimer rapport | Oui |
| POST | `/api/rapports/:id/star` | Toggle star | Oui |
| GET | `/api/rapports/:id/readers` | Lecteurs | Oui |
| POST | `/api/rapports/:id/archive` | Archiver | Oui |
| GET | `/api/admin/dashboard` | Dashboard admin | ADMIN |
| GET | `/api/admin/users` | Liste utilisateurs | ADMIN |
| PATCH | `/api/admin/users/:id/validate` | Valider compte | ADMIN |
| PATCH | `/api/admin/users/:id/suspend` | Suspendre | ADMIN |
| DELETE | `/api/admin/users/:id` | Supprimer user | ADMIN |
| POST | `/api/admin/rapports/:id/warning` | Ajouter warning | ADMIN |
| GET | `/api/notifications` | Mes notifications | Oui |
| PATCH | `/api/notifications/read-all` | Tout marquer lu | Oui |
| PATCH | `/api/notifications/:id/read` | Marquer une lue | Oui |

---

*CommuneConnecte v1.0.0 — Commune Madagascar 2026*
