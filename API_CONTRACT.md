# 📄 Contrat API — CommuneConnecte

> **Version** : 1.1.0 | **Dernière mise à jour** : Mars 2026
> **Destinataires** : Équipe Frontend React
> **Statut** : ✅ Référence officielle — alignée sur Swagger `http://localhost:2025/api/docs`

---

## 📑 Table des matières

1. [Informations générales](#1-informations-générales)
2. [Format des réponses](#2-format-des-réponses)
3. [Authentification](#3-authentification)
4. [Codes d'erreur HTTP](#4-codes-derreur-http)
5. [Énumérations et constantes](#5-énumérations-et-constantes)
6. [Routes — Auth](#6-routes--auth)
7. [Routes — Rapports](#7-routes--rapports)
8. [Routes — Administration](#8-routes--administration)
9. [Routes — Notifications](#9-routes--notifications)
10. [WebSocket — Socket.io](#10-websocket--socketio)
11. [Upload de fichiers](#11-upload-de-fichiers)
12. [Pagination](#12-pagination)
13. [Règles métier importantes](#13-règles-métier-importantes)

---

## 1. Informations générales

| Paramètre | Valeur |
|-----------|--------|
| **Base URL API REST** | `http://localhost:2025/api` |
| **Base URL WebSocket** | `http://localhost:2026` |
| **Documentation Swagger** | `http://localhost:2025/api/docs` |
| **Health check** | `GET http://localhost:2025/api/health` |
| **Content-Type** | `application/json` (sauf upload fichiers) |
| **Encodage** | UTF-8 |

---

## 2. Format des réponses

> ⚠️ **Toujours vérifier `success` en premier, pas le code HTTP seul.**

### ✅ Succès simple
```json
{
  "success": true,
  "message": "Message descriptif",
  "data": { }
}
```

### ✅ Succès paginé
```json
{
  "success": true,
  "message": "Rapports récupérés.",
  "data": [ ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 25,
    "totalPages": 2
  }
}
```

### ❌ Erreur simple
```json
{
  "success": false,
  "message": "Message d'erreur lisible"
}
```

### ❌ Erreur de validation `422`
```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [
    "Le nom doit contenir au moins 3 caractères",
    "Adresse email invalide"
  ]
}
```

---

## 3. Authentification

### Comment s'authentifier

1. `POST /api/auth/login` → récupérer `data.token`
2. Stocker le token (mémoire ou localStorage)
3. L'inclure dans **toutes** les requêtes suivantes :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Routes publiques (sans token)
- `POST /api/auth/login`
- `POST /api/auth/register`

### Durée de validité du token
- **7 jours** — quand expiré → réponse `401`
- Rediriger vers `/login` sur tout `401`

---

## 4. Codes d'erreur HTTP

| Code | Signification | Action frontend |
|------|---------------|-----------------|
| `200` | Succès | Utiliser `data` |
| `201` | Ressource créée | Utiliser `data` |
| `400` | Requête incorrecte | Afficher `message` |
| `401` | Non authentifié / token expiré | Rediriger vers login |
| `403` | Accès interdit (rôle ou compte inactif) | Afficher message d'accès refusé |
| `404` | Ressource introuvable | Page 404 |
| `409` | Conflit (ex: email déjà utilisé) | Afficher `message` dans le formulaire |
| `413` | Fichier trop volumineux (> 10 Mo) | Informer l'utilisateur |
| `415` | Type de fichier non autorisé | Informer l'utilisateur |
| `422` | Données invalides — afficher `errors[]` sous les champs | Afficher `errors[]` |
| `429` | Trop de requêtes | Afficher délai d'attente |
| `500` | Erreur serveur | Message générique |

---

## 5. Énumérations et constantes

### Rôles (`role` / `proposedRole`)
```
ADMIN
MAIRE
ADJOINT_MAIRE
SECRETAIRE_COMMUNAL
ARCHIVISTE
ETAT_CIVIL
TRESORERIE
PERCEPTEUR
REGISSEUR
```
> ⚠️ `ADMIN` ne peut **pas** être proposé à l'inscription.

### Statuts de compte (`status`)
```
EN_ATTENTE   → Inscription soumise, connexion impossible
ACTIF        → Compte validé, peut se connecter
SUSPENDU     → Compte bloqué temporairement
REJETE       → Inscription rejetée
```

### Statuts de rapport (`statut`)
```
BROUILLON  → Non publié, visible uniquement par le créateur
SOUMIS     → Publié, visible par les rôles autorisés
MODIFIE    → Modifié après publication (historique conservé)
ARCHIVE    → Lecture seule, non modifiable
SIGNALE    → Avertissement admin ajouté
```

### Types de notification (`type`)
```
NOUVEAU_RAPPORT
MENTION
NOUVELLE_INSCRIPTION
COMPTE_VALIDE
COMPTE_REJETE
RAPPORT_AVERTISSEMENT
COMPTE_SUSPENDU
RAPPORT_ARCHIVE
```

### Visibilité d'un rapport (`visibilite`)
Tableau de rôles. Valeur spéciale `TOUS` = tous les utilisateurs actifs.
```json
["TOUS"]
["MAIRE", "ADJOINT_MAIRE"]
["ADMIN", "TRESORERIE"]
```

---

## 6. Routes — Auth

> Tag Swagger : **`Authentification`**

---

### `POST /api/auth/register`

**Auth** : ❌ Public | **Content-Type** : `multipart/form-data`

**Champs** :

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `name` | `string` | ✅ | min 3 / max 150 car. |
| `email` | `string` | ✅ | Format email, converti en minuscule |
| `password` | `string` | ✅ | min 8 car., 1 maj, 1 min, 1 chiffre |
| `proposedRole` | `string` | ✅ | Enum rôles (ADMIN interdit) |
| `avatar` | `file` | ❌ | JPEG / PNG / WebP — max 2 Mo |

**Réponse `201`** :
```json
{
  "success": true,
  "message": "Inscription réussie. Votre compte est en attente de validation par l'administrateur.",
  "data": {
    "user": {
      "id": 10,
      "name": "Jean Rakoto",
      "email": "jean@commune.mg",
      "role": "SECRETAIRE_COMMUNAL",
      "proposedRole": "SECRETAIRE_COMMUNAL",
      "status": "EN_ATTENTE",
      "avatar": null,
      "createdAt": "2026-03-12T08:00:00.000Z"
    }
  }
}
```

**Erreurs** : `409` email déjà utilisé — `422` données invalides (voir `errors[]`)

---

### `POST /api/auth/login`

**Auth** : ❌ Public | **Content-Type** : `application/json`
**Rate limit** : 5 tentatives / minute / IP

**Corps** :
```json
{
  "email": "admin@commune.mg",
  "password": "Password123!"
}
```

| Champ | Type | Requis |
|-------|------|--------|
| `email` | `string` | ✅ |
| `password` | `string` | ✅ |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Connexion réussie.",
  "data": {
    "user": {
      "id": 1,
      "name": "Administrateur Système",
      "email": "admin@commune.mg",
      "role": "ADMIN",
      "status": "ACTIF",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Erreurs** :
- `401` — identifiants incorrects
- `403` — compte `EN_ATTENTE`, `SUSPENDU` ou `REJETE` (message explicatif dans `message`)
- `429` — trop de tentatives

---

### `POST /api/auth/logout`

**Auth** : ✅ Requis

> Invalider le token **côté client** après l'appel — aucune blacklist serveur.

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Déconnexion réussie.",
  "data": null
}
```

---

### `GET /api/auth/me`

**Auth** : ✅ Requis

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "user": {
      "id": 1,
      "name": "Administrateur Système",
      "email": "admin@commune.mg",
      "role": "ADMIN",
      "status": "ACTIF",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastLoginAt": "2026-03-12T08:00:00.000Z",
      "_count": {
        "rapports": 5
      }
    }
  }
}
```

**Erreurs** : `401` non authentifié

---

### `PUT /api/auth/profile`

**Auth** : ✅ Requis | **Content-Type** : `multipart/form-data`

> Au moins un champ requis. Le `role` est **non modifiable** ici.

| Champ | Type | Requis | Règle |
|-------|------|--------|-------|
| `name` | `string` | ❌ | min 3 / max 150 |
| `currentPassword` | `string` | ❌* | Obligatoire si `newPassword` fourni |
| `newPassword` | `string` | ❌ | min 8, 1 maj, 1 min, 1 chiffre |
| `avatar` | `file` | ❌ | JPEG / PNG / WebP — max 2 Mo |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès.",
  "data": {
    "user": {
      "id": 1,
      "name": "Nouveau Nom",
      "email": "admin@commune.mg",
      "role": "ADMIN",
      "status": "ACTIF",
      "avatar": "storage/abc123.jpg",
      "updatedAt": "2026-03-12T09:00:00.000Z"
    }
  }
}
```

**Erreurs** : `400` mot de passe actuel incorrect — `422` données invalides

---

## 7. Routes — Rapports

> Tag Swagger : **`Rapports`**

---

### `GET /api/rapports`

**Auth** : ✅ Requis

> Les rapports sont **filtrés automatiquement** selon le rôle de l'utilisateur connecté.

**Paramètres query** :

| Paramètre | Type | Défaut | Valeurs |
|-----------|------|--------|---------|
| `page` | `integer` | `1` | ≥ 1 |
| `limit` | `integer` | `25` | 1 – 100 |
| `statut` | `string` | — | `BROUILLON` `SOUMIS` `MODIFIE` `ARCHIVE` `SIGNALE` |
| `search` | `string` | — | Full-text : objet, description, tags |
| `tags` | `string` | — | Mot-clé dans les tags |
| `orderBy` | `string` | `createdAt` | `createdAt` `updatedAt` `objet` |
| `order` | `string` | `desc` | `asc` `desc` |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Rapports récupérés.",
  "data": [
    {
      "id": 1,
      "objet": "Rapport de réunion du conseil communal - Mars 2026",
      "description": "<p>Contenu HTML...</p>",
      "statut": "SOUMIS",
      "tags": "conseil,réunion,budget",
      "fichier": null,
      "userId": 2,
      "user": {
        "id": 2,
        "name": "Jean Rakoto",
        "email": "maire@commune.mg",
        "role": "MAIRE",
        "status": "ACTIF",
        "avatar": null,
        "createdAt": "2026-01-01T00:00:00.000Z"
      },
      "starsCount": 3,
      "isStarred": false,
      "isRead": true,
      "createdAt": "2026-03-10T10:00:00.000Z",
      "publishedAt": "2026-03-10T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 25,
    "totalPages": 2
  }
}
```

> ⚠️ `publishedAt` est `null` si le rapport est en `BROUILLON`.

---

### `POST /api/rapports`

**Auth** : ✅ Requis | **Content-Type** : `multipart/form-data`
**Rôles autorisés** : tous sauf `ARCHIVISTE`

> Si `statut = SOUMIS`, les utilisateurs des rôles listés dans `visibilite` reçoivent une notification temps réel.

**Champs** :

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `objet` | `string` | ✅ | min 5 / max 300 car. |
| `description` | `string` | ✅ | min 10 car. (HTML accepté) |
| `statut` | `string` | ❌ | `BROUILLON` (défaut) ou `SOUMIS` |
| `visibilite` | `string[]` | ❌ | Tableau de rôles, défaut `["TOUS"]` |
| `tags` | `string` | ❌ | Séparés par virgule, max 500 car. |
| `mentions` | `integer[]` | ❌ | IDs d'utilisateurs à mentionner |
| `fichier` | `file` | ❌ | PDF / Word / Excel / Image — max 10 Mo |

> ⚠️ `visibilite` et `mentions` sont des **tableaux**. En `multipart/form-data`, les envoyer en JSON stringifié :
> ```js
> formData.append('visibilite', JSON.stringify(['MAIRE', 'ADMIN']));
> formData.append('mentions', JSON.stringify([3, 4]));
> ```

**Réponse `201`** :
```json
{
  "success": true,
  "message": "Rapport créé avec succès.",
  "data": {
    "rapport": {
      "id": 5,
      "objet": "Rapport de réunion - Mars 2026",
      "description": "<p>Contenu du rapport</p>",
      "statut": "SOUMIS",
      "tags": "réunion,mars",
      "fichier": null,
      "userId": 2,
      "user": {
        "id": 2,
        "name": "Jean Rakoto",
        "email": "maire@commune.mg",
        "role": "MAIRE",
        "status": "ACTIF",
        "avatar": null,
        "createdAt": "2026-01-01T00:00:00.000Z"
      },
      "roles": [
        { "role": "MAIRE" },
        { "role": "ADMIN" }
      ],
      "mentions": [
        {
          "userId": 3,
          "user": { "id": 3, "name": "Marie Rasoa", "email": "adjoint@commune.mg" }
        }
      ],
      "createdAt": "2026-03-12T10:00:00.000Z",
      "publishedAt": "2026-03-12T10:00:00.000Z",
      "updatedAt": "2026-03-12T10:00:00.000Z"
    }
  }
}
```

**Erreurs** : `403` ARCHIVISTE interdit — `413` fichier trop lourd — `415` type MIME invalide — `422` données invalides

---

### `GET /api/rapports/:id`

**Auth** : ✅ Requis

> Enregistre automatiquement l'**accusé de lecture** à la première consultation.

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "rapport": {
      "id": 1,
      "objet": "Rapport de réunion du conseil communal - Mars 2026",
      "description": "<p>Contenu HTML complet...</p>",
      "statut": "SOUMIS",
      "tags": "conseil,réunion",
      "fichier": "storage/a1b2c3d4-e5f6.pdf",
      "userId": 2,
      "user": {
        "id": 2,
        "name": "Jean Rakoto",
        "email": "maire@commune.mg",
        "role": "MAIRE",
        "status": "ACTIF",
        "avatar": null,
        "createdAt": "2026-01-01T00:00:00.000Z"
      },
      "roles": [
        { "role": "MAIRE" },
        { "role": "ADMIN" }
      ],
      "stars": [
        {
          "id": 1,
          "userId": 1,
          "createdAt": "2026-03-11T09:00:00.000Z",
          "user": { "id": 1, "name": "Administrateur Système", "avatar": null }
        }
      ],
      "reads": [
        {
          "id": 1,
          "userId": 1,
          "readAt": "2026-03-11T08:30:00.000Z",
          "user": { "id": 1, "name": "Administrateur Système", "avatar": null }
        }
      ],
      "mentions": [
        {
          "userId": 3,
          "createdAt": "2026-03-10T10:00:00.000Z",
          "user": { "id": 3, "name": "Marie Rasoa", "role": "ADJOINT_MAIRE", "avatar": null }
        }
      ],
      "warnings": [
        {
          "id": 1,
          "message": "Contenu à réviser",
          "createdAt": "2026-03-11T14:00:00.000Z",
          "admin": { "id": 1, "name": "Administrateur Système" }
        }
      ],
      "versions": [
        {
          "id": 1,
          "objet": "Ancien titre",
          "description": "...",
          "createdAt": "2026-03-10T12:00:00.000Z",
          "user": { "id": 2, "name": "Jean Rakoto" }
        }
      ],
      "starsCount": 1,
      "isStarred": false,
      "isRead": true,
      "createdAt": "2026-03-10T10:00:00.000Z",
      "publishedAt": "2026-03-10T10:00:00.000Z",
      "updatedAt": "2026-03-11T14:00:00.000Z"
    }
  }
}
```

**Erreurs** : `403` accès non autorisé — `404` rapport introuvable

---

### `PUT /api/rapports/:id`

**Auth** : ✅ Requis | **Content-Type** : `multipart/form-data`

> - **Propriétaire** : modifiable dans les **24h** après `publishedAt`
> - **ADMIN / MAIRE / ADJOINT_MAIRE** : modifiable à tout moment
> - Rapport `ARCHIVE` : **non modifiable** dans tous les cas
> - Chaque modification sauvegarde la version précédente dans `versions[]`

Mêmes champs que `POST /api/rapports`, tous optionnels, minimum 1 requis. `statut` accepte aussi `ARCHIVE`.

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Rapport modifié avec succès.",
  "data": {
    "rapport": {
      "id": 1,
      "objet": "Titre modifié",
      "statut": "MODIFIE",
      "updatedAt": "2026-03-12T11:00:00.000Z"
    }
  }
}
```

**Erreurs** : `400` rapport archivé — `403` délai 24h dépassé ou non propriétaire — `404` introuvable

---

### `DELETE /api/rapports/:id`

**Auth** : ✅ Requis

> Suppression **définitive** et irréversible. Toujours afficher une confirmation UI.

**Accès** : propriétaire du rapport OU `ADMIN`

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Rapport supprimé définitivement.",
  "data": null
}
```

**Erreurs** : `403` non autorisé — `404` introuvable

---

### `POST /api/rapports/:id/star`

**Auth** : ✅ Requis

> **Toggle** — un seul appel suffit : ajoute si absent, retire si présent.

**Réponse `200` — star ajoutée** :
```json
{
  "success": true,
  "message": "Rapport ajouté aux favoris.",
  "data": {
    "starred": true,
    "starsCount": 4
  }
}
```

**Réponse `200` — star retirée** :
```json
{
  "success": true,
  "message": "Favori retiré.",
  "data": {
    "starred": false,
    "starsCount": 3
  }
}
```

---

### `GET /api/rapports/:id/readers`

**Auth** : ✅ Requis | **Accès** : propriétaire du rapport OU `ADMIN`

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "readers": [
      {
        "id": 1,
        "rapportId": 5,
        "userId": 1,
        "readAt": "2026-03-11T08:30:00.000Z",
        "user": {
          "id": 1,
          "name": "Administrateur Système",
          "role": "ADMIN",
          "avatar": null
        }
      }
    ],
    "count": 1
  }
}
```

**Erreurs** : `403` non propriétaire et non admin

---

### `POST /api/rapports/:id/archive`

**Auth** : ✅ Requis | **Rôles** : `ARCHIVISTE` ou `ADMIN`

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Rapport archivé avec succès.",
  "data": {
    "rapport": {
      "id": 1,
      "statut": "ARCHIVE",
      "updatedAt": "2026-03-12T12:00:00.000Z"
    }
  }
}
```

**Erreurs** : `400` déjà archivé — `403` rôle non autorisé

---

## 8. Routes — Administration

> Tag Swagger : **`Administration`**
> ⛔ **Toutes ces routes sont réservées au rôle `ADMIN` exclusivement → `403` pour tout autre rôle.**

---

### `GET /api/admin/dashboard`

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Statistiques récupérées.",
  "data": {
    "utilisateurs": {
      "total": 10,
      "enAttente": 2,
      "actifs": 7
    },
    "rapports": {
      "total": 45,
      "cetteSetmaine": 8,
      "parStatut": {
        "BROUILLON": 5,
        "SOUMIS": 30,
        "MODIFIE": 4,
        "ARCHIVE": 5,
        "SIGNALE": 1
      }
    },
    "activiteRecente": [
      {
        "id": 45,
        "objet": "Rapport budget mars",
        "statut": "SOUMIS",
        "createdAt": "2026-03-12T09:00:00.000Z",
        "user": { "id": 2, "name": "Jean Rakoto", "role": "MAIRE" }
      }
    ],
    "utilisateursEnAttente": [
      {
        "id": 10,
        "name": "Bako Miora",
        "email": "bako@commune.mg",
        "proposedRole": "ETAT_CIVIL",
        "createdAt": "2026-03-11T07:00:00.000Z"
      }
    ]
  }
}
```

**Erreurs** : `403` non ADMIN

---

### `GET /api/admin/stats/rapports`

**Paramètres query** :

| Paramètre | Type | Défaut | Valeurs |
|-----------|------|--------|---------|
| `periode` | `string` | `mois` | `semaine` `mois` |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "stats": [
      { "createdAt": "2026-03-01T10:00:00.000Z", "statut": "SOUMIS" },
      { "createdAt": "2026-03-02T14:30:00.000Z", "statut": "BROUILLON" }
    ]
  }
}
```

---

### `GET /api/admin/users`

**Paramètres query** :

| Paramètre | Type | Valeurs |
|-----------|------|---------|
| `page` | `integer` | défaut `1` |
| `limit` | `integer` | défaut `25` |
| `status` | `string` | `EN_ATTENTE` `ACTIF` `SUSPENDU` `REJETE` |
| `role` | `string` | N'importe quel rôle |
| `search` | `string` | Recherche dans nom et email |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Utilisateurs récupérés.",
  "data": [
    {
      "id": 1,
      "name": "Administrateur Système",
      "email": "admin@commune.mg",
      "role": "ADMIN",
      "proposedRole": null,
      "status": "ACTIF",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastLoginAt": "2026-03-12T08:00:00.000Z",
      "suspensionMotif": null,
      "suspensionFin": null,
      "_count": { "rapports": 3 }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 25,
    "totalPages": 1
  }
}
```

---

### `PATCH /api/admin/users/:id/validate`

**Content-Type** : `application/json`

| Champ | Type | Requis | Règle |
|-------|------|--------|-------|
| `action` | `string` | ✅ | `VALIDER` ou `REJETER` |
| `role` | `string` | ❌ | Si `VALIDER` : rôle final (utilise `proposedRole` si absent) |
| `motif` | `string` | ❌* | **Obligatoire** si `action = REJETER` |

**Exemple — Valider** :
```json
{ "action": "VALIDER", "role": "SECRETAIRE_COMMUNAL" }
```

**Exemple — Rejeter** :
```json
{ "action": "REJETER", "motif": "Document d'identité non fourni." }
```

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Compte validé avec succès.",
  "data": {
    "user": {
      "id": 10,
      "name": "Bako Miora",
      "email": "bako@commune.mg",
      "role": "SECRETAIRE_COMMUNAL",
      "status": "ACTIF"
    }
  }
}
```

> 📡 L'utilisateur reçoit automatiquement une notification `COMPTE_VALIDE` ou `COMPTE_REJETE`.

**Erreurs** : `400` compte pas en `EN_ATTENTE` — `404` introuvable — `422` motif manquant pour rejet

---

### `PATCH /api/admin/users/:id/suspend`

**Content-Type** : `application/json`

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `motif` | `string` | ✅ | min 5 / max 500 car. |
| `dureeJours` | `integer` | ❌ | 1 – 365 jours (`null` = durée indéfinie) |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Compte suspendu avec succès.",
  "data": {
    "user": {
      "id": 5,
      "name": "Paul Randria",
      "status": "SUSPENDU",
      "suspensionFin": "2026-04-11T08:00:00.000Z"
    }
  }
}
```

> 📡 L'utilisateur reçoit une notification `COMPTE_SUSPENDU`.

**Erreurs** : `403` impossible de suspendre un ADMIN

---

### `DELETE /api/admin/users/:id`

> Suppression **définitive**. Toujours afficher une confirmation UI.

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Utilisateur supprimé définitivement.",
  "data": null
}
```

**Erreurs** : `403` impossible de supprimer un autre ADMIN — `404` introuvable

---

### `POST /api/admin/rapports/:id/warning`

**Content-Type** : `application/json`

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `message` | `string` | ✅ | min 10 / max 1000 car. |

**Réponse `201`** :
```json
{
  "success": true,
  "message": "Avertissement ajouté.",
  "data": {
    "warning": {
      "id": 1,
      "rapportId": 5,
      "message": "Ce rapport contient des informations erronées. Veuillez le corriger.",
      "createdAt": "2026-03-12T11:00:00.000Z",
      "admin": { "id": 1, "name": "Administrateur Système" }
    }
  }
}
```

> 📡 Le propriétaire reçoit une notification `RAPPORT_AVERTISSEMENT`. Le rapport passe en statut `SIGNALE`.

---

## 9. Routes — Notifications

> Tag Swagger : **`Notifications`**

---

### `GET /api/notifications`

**Auth** : ✅ Requis

**Paramètres query** :

| Paramètre | Type | Défaut | Valeurs |
|-----------|------|--------|---------|
| `page` | `integer` | `1` | — |
| `limit` | `integer` | `25` | — |
| `unreadOnly` | `string` | — | `"true"` pour les non lues uniquement |
| `type` | `string` | — | Un des types de notification |

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Notifications récupérées.",
  "data": [
    {
      "id": 1,
      "type": "NOUVEAU_RAPPORT",
      "notifiableId": 3,
      "data": {
        "rapportId": 5,
        "rapportObjet": "Rapport de réunion - Mars 2026",
        "createdBy": "Jean Rakoto",
        "creatorRole": "MAIRE"
      },
      "readAt": null,
      "createdAt": "2026-03-12T10:05:00.000Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 25,
    "totalPages": 1,
    "unreadCount": 4
  }
}
```

> `meta.unreadCount` est **toujours présent** — utiliser pour le badge de la cloche 🔔.

---

### `PATCH /api/notifications/read-all`

**Auth** : ✅ Requis

**Réponse `200`** :
```json
{
  "success": true,
  "message": "4 notification(s) marquée(s) comme lue(s).",
  "data": {
    "updatedCount": 4
  }
}
```

---

### `PATCH /api/notifications/:id/read`

**Auth** : ✅ Requis

**Réponse `200`** :
```json
{
  "success": true,
  "message": "Notification marquée comme lue.",
  "data": {
    "notification": {
      "id": 1,
      "type": "NOUVEAU_RAPPORT",
      "readAt": "2026-03-12T12:00:00.000Z",
      "createdAt": "2026-03-12T10:05:00.000Z"
    }
  }
}
```

**Erreurs** : `404` notification introuvable ou n'appartient pas à l'utilisateur

---

## 10. WebSocket — Socket.io

### Connexion

**URL** : `http://localhost:2026`

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:2026', {
  auth: { token: `Bearer ${token}` },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### Événements reçus (écouter)

| Événement | Déclencheur | Payload |
|-----------|-------------|---------|
| `connected` | Connexion établie | `{ userId, message, timestamp }` |
| `notification:new` | Nouvelle notification | `{ id, type, data, createdAt }` |
| `notifications:allRead` | Toutes marquées lues | `{ timestamp }` |
| `pong` | Réponse au ping | `{ timestamp }` |

### Événements émis (envoyer)

| Événement | Payload |
|-----------|---------|
| `notification:markRead` | `notificationId` (integer) |
| `ping` | aucun |

### Payload `notification:new` selon le type

```javascript
// NOUVEAU_RAPPORT
{ rapportId, rapportObjet, createdBy, creatorRole }

// MENTION
{ rapportId, rapportObjet, mentionedBy }

// NOUVELLE_INSCRIPTION  (admin uniquement)
{ userId, userName, userEmail, proposedRole }

// COMPTE_VALIDE
{ message, adminName }

// COMPTE_REJETE
{ message, motif, adminName }

// RAPPORT_AVERTISSEMENT
{ rapportId, rapportObjet, message, adminName }

// COMPTE_SUSPENDU
{ message, suspensionFin }
```

### Gestion des erreurs Socket.io

```javascript
socket.on('connect_error', (error) => {
  // "Token invalide ou expiré." → rediriger vers login
  console.error(error.message);
});
```

---

## 11. Upload de fichiers

### Fichiers joints aux rapports

| Propriété | Valeur |
|-----------|--------|
| Champ formulaire | `fichier` |
| Types acceptés | PDF, Word (.doc/.docx), Excel (.xls/.xlsx), JPEG, PNG, GIF, WebP |
| Taille max | **10 Mo** |

### Avatars

| Propriété | Valeur |
|-----------|--------|
| Champ formulaire | `avatar` |
| Types acceptés | JPEG, PNG, WebP |
| Taille max | **2 Mo** |

### Accès aux fichiers

```
GET http://localhost:2025/storage/{nom-du-fichier}
```

Le champ `fichier` dans un rapport contient le chemin relatif, ex : `storage/abc123.pdf`

---

## 12. Pagination

| Paramètre | Défaut | Max |
|-----------|--------|-----|
| `page` | `1` | — |
| `limit` | `25` | `100` |

Structure `meta` toujours présente dans les réponses paginées :
```json
"meta": {
  "total": 87,
  "page": 2,
  "limit": 25,
  "totalPages": 4
}
```

---

## 13. Règles métier importantes

### 🔐 Comptes
- Seuls les comptes `ACTIF` peuvent se connecter
- Le rôle d'un utilisateur **ne peut être changé que par l'ADMIN**
- Après inscription, l'utilisateur ne peut **pas** se connecter immédiatement

### 📄 Visibilité des rapports
- `ADMIN`, `MAIRE`, `ADJOINT_MAIRE`, `ARCHIVISTE` voient **tous** les rapports
- Les autres rôles voient uniquement : les rapports de leur rôle dans `visibilite`, les rapports `["TOUS"]`, leurs propres rapports, et les rapports où ils sont mentionnés
- Un `BROUILLON` est visible **uniquement par son créateur**

### ✏️ Modification
- Propriétaire : **24h** après `publishedAt` uniquement
- ADMIN / MAIRE / ADJOINT_MAIRE : modifiable à tout moment
- Rapport `ARCHIVE` : **jamais** modifiable
- Chaque modification crée une entrée dans `versions[]`

### ⭐ Stars
- Un utilisateur = **une seule star** par rapport
- `POST /api/rapports/:id/star` est un **toggle**

### 📖 Accusés de lecture
- Enregistré automatiquement au **premier** `GET /api/rapports/:id`
- La date ne change pas lors des consultations suivantes

### 🗑️ Suppressions irréversibles
- Rapport `DELETE` → **toujours afficher une confirmation**
- Utilisateur `DELETE` → **toujours afficher une confirmation**

---

*Référence Swagger live : `http://localhost:2025/api/docs`*
*Tag Swagger → Nom section : `Authentification` → Auth | `Rapports` → Rapports | `Administration` → Users dans Swagger UI*