t awindow.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "CommuneConnecte API",
      "version": "1.0.0",
      "description": "\n## Plateforme de gestion de rapports communaux\n\n**CommuneConnecte** est une plateforme permettant la gestion numérique\ndes rapports et documents administratifs dans les communes malgaches.\n\n### Authentification\nToutes les routes (sauf `/auth/login` et `/auth/register`)\nnécessitent un **token JWT**.\n\nHeader requis :\n\nAuthorization: Bearer <token>\n\n### Rôles disponibles\n- ADMIN\n- MAIRE\n- ADJOINT_MAIRE\n- SECRETAIRE_COMMUNAL\n- ARCHIVISTE\n- ETAT_CIVIL\n- TRESORERIE\n- PERCEPTEUR\n- REGISSEUR\n",
      "contact": {
        "name": "Support CommuneConnecte",
        "email": "support@commune.mg"
      }
    },
    "servers": [
      {
        "url": "http://localhost:2025/api",
        "description": "Serveur actif"
      }
    ],
    "tags": [
      {
        "name": "Auth",
        "description": "Authentification utilisateur"
      },
      {
        "name": "Users",
        "description": "Gestion des utilisateurs"
      },
      {
        "name": "Rapports",
        "description": "Gestion des rapports communaux"
      },
      {
        "name": "Notifications",
        "description": "Gestion des notifications"
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT",
          "description": "Token JWT obtenu via /auth/login"
        }
      },
      "schemas": {
        "UserRegister": {
          "type": "object",
          "required": [
            "name",
            "email",
            "password",
            "proposedRole"
          ],
          "properties": {
            "name": {
              "type": "string",
              "example": "Jean Rakoto"
            },
            "email": {
              "type": "string",
              "format": "email",
              "example": "jean@commune.mg"
            },
            "password": {
              "type": "string",
              "minLength": 8,
              "example": "Password123!"
            },
            "proposedRole": {
              "type": "string",
              "enum": [
                "MAIRE",
                "ADJOINT_MAIRE",
                "SECRETAIRE_COMMUNAL",
                "ARCHIVISTE",
                "ETAT_CIVIL",
                "TRESORERIE",
                "PERCEPTEUR",
                "REGISSEUR"
              ],
              "example": "SECRETAIRE_COMMUNAL"
            }
          }
        },
        "UserLogin": {
          "type": "object",
          "required": [
            "email",
            "password"
          ],
          "properties": {
            "email": {
              "type": "string",
              "format": "email",
              "example": "admin@commune.mg"
            },
            "password": {
              "type": "string",
              "example": "Password123!"
            }
          }
        },
        "UserResponse": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer",
              "example": 1
            },
            "name": {
              "type": "string",
              "example": "Jean Rakoto"
            },
            "email": {
              "type": "string",
              "example": "jean@commune.mg"
            },
            "role": {
              "type": "string",
              "example": "MAIRE"
            },
            "status": {
              "type": "string",
              "example": "ACTIF"
            },
            "avatar": {
              "type": "string",
              "nullable": true
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "RapportCreate": {
          "type": "object",
          "required": [
            "objet",
            "description"
          ],
          "properties": {
            "objet": {
              "type": "string",
              "example": "Rapport de réunion - Mars 2026"
            },
            "description": {
              "type": "string",
              "example": "<p>Contenu du rapport...</p>"
            },
            "statut": {
              "type": "string",
              "enum": [
                "BROUILLON",
                "SOUMIS"
              ],
              "default": "BROUILLON"
            },
            "visibilite": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "ADMIN",
                  "MAIRE",
                  "ADJOINT_MAIRE",
                  "SECRETAIRE_COMMUNAL",
                  "ARCHIVISTE",
                  "ETAT_CIVIL",
                  "TRESORERIE",
                  "PERCEPTEUR",
                  "REGISSEUR",
                  "TOUS"
                ]
              }
            },
            "tags": {
              "type": "string",
              "example": "reunion,conseil"
            },
            "mentions": {
              "type": "array",
              "items": {
                "type": "integer"
              },
              "example": [
                2,
                3
              ]
            }
          }
        },
        "RapportResponse": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer",
              "example": 1
            },
            "objet": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "statut": {
              "type": "string",
              "enum": [
                "BROUILLON",
                "SOUMIS",
                "MODIFIE",
                "ARCHIVE",
                "SIGNALE"
              ]
            },
            "tags": {
              "type": "string",
              "nullable": true
            },
            "fichier": {
              "type": "string",
              "nullable": true
            },
            "userId": {
              "type": "integer"
            },
            "user": {
              "$ref": "#/components/schemas/UserResponse"
            },
            "starsCount": {
              "type": "integer"
            },
            "isStarred": {
              "type": "boolean"
            },
            "isRead": {
              "type": "boolean"
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "publishedAt": {
              "type": "string",
              "format": "date-time",
              "nullable": true
            }
          }
        },
        "NotificationResponse": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "type": {
              "type": "string",
              "example": "NOUVEAU_RAPPORT"
            },
            "data": {
              "type": "object"
            },
            "readAt": {
              "type": "string",
              "format": "date-time",
              "nullable": true
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "SuccessResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": true
            },
            "message": {
              "type": "string"
            },
            "data": {
              "type": "object"
            }
          }
        },
        "ErrorResponse": {
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean",
              "example": false
            },
            "message": {
              "type": "string"
            },
            "errors": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        },
        "PaginationMeta": {
          "type": "object",
          "properties": {
            "total": {
              "type": "integer"
            },
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          }
        }
      }
    },
    "security": [
      {
        "bearerAuth": []
      }
    ],
    "paths": {
      "/admin/dashboard": {
        "get": {
          "summary": "Tableau de bord administrateur",
          "description": "Statistiques globales, alertes, activité récente.",
          "tags": [
            "Administration"
          ],
          "responses": {
            "200": {
              "description": "Statistiques complètes",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "object",
                        "properties": {
                          "utilisateurs": {
                            "type": "object",
                            "properties": {
                              "total": {
                                "type": "integer"
                              },
                              "enAttente": {
                                "type": "integer"
                              },
                              "actifs": {
                                "type": "integer"
                              }
                            }
                          },
                          "rapports": {
                            "type": "object"
                          },
                          "activiteRecente": {
                            "type": "array"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "403": {
              "description": "Accès réservé à l'administrateur"
            }
          }
        }
      },
      "/admin/stats/rapports": {
        "get": {
          "summary": "Statistiques des rapports pour les graphiques",
          "tags": [
            "Administration"
          ],
          "parameters": [
            {
              "in": "query",
              "name": "periode",
              "schema": {
                "type": "string",
                "enum": [
                  "semaine",
                  "mois"
                ],
                "default": "mois"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Données de graphique d'évolution"
            }
          }
        }
      },
      "/admin/users": {
        "get": {
          "summary": "Liste de tous les utilisateurs",
          "tags": [
            "Administration"
          ],
          "parameters": [
            {
              "in": "query",
              "name": "status",
              "schema": {
                "type": "string",
                "enum": [
                  "EN_ATTENTE",
                  "ACTIF",
                  "SUSPENDU",
                  "REJETE"
                ]
              }
            },
            {
              "in": "query",
              "name": "role",
              "schema": {
                "type": "string"
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              }
            },
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer"
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Liste paginée des utilisateurs"
            }
          }
        }
      },
      "/admin/users/{id}/validate": {
        "patch": {
          "summary": "Valider ou rejeter un compte utilisateur",
          "tags": [
            "Administration"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "action"
                  ],
                  "properties": {
                    "action": {
                      "type": "string",
                      "enum": [
                        "VALIDER",
                        "REJETER"
                      ]
                    },
                    "role": {
                      "type": "string",
                      "description": "Rôle final (si VALIDER, optionnel - utilise proposedRole sinon)"
                    },
                    "motif": {
                      "type": "string",
                      "description": "Motif de rejet (obligatoire si REJETER)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Compte traité, utilisateur notifié"
            },
            "400": {
              "description": "Compte pas en statut EN_ATTENTE"
            }
          }
        }
      },
      "/admin/users/{id}/suspend": {
        "patch": {
          "summary": "Suspendre un compte utilisateur",
          "tags": [
            "Administration"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "motif"
                  ],
                  "properties": {
                    "motif": {
                      "type": "string"
                    },
                    "dureeJours": {
                      "type": "integer",
                      "description": "Durée en jours (null = indéfini)"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Compte suspendu, utilisateur notifié"
            }
          }
        }
      },
      "/admin/users/{id}": {
        "delete": {
          "summary": "Supprimer définitivement un utilisateur",
          "tags": [
            "Administration"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Utilisateur supprimé"
            }
          }
        }
      },
      "/admin/rapports/{id}/warning": {
        "post": {
          "summary": "Ajouter un avertissement sur un rapport",
          "description": "Le rapport passe en statut SIGNALE et le propriétaire est notifié.",
          "tags": [
            "Administration"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "message"
                  ],
                  "properties": {
                    "message": {
                      "type": "string",
                      "minLength": 10,
                      "example": "Ce rapport contient des informations erronées. Veuillez le corriger."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Avertissement créé, propriétaire notifié"
            }
          }
        }
      },
      "/auth/register": {
        "post": {
          "summary": "Inscription d'un nouvel utilisateur",
          "tags": [
            "Authentification"
          ],
          "security": [],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/UserRegister"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "avatar": {
                          "type": "string",
                          "format": "binary",
                          "description": "Photo de profil (optionnel, JPEG/PNG/WebP, max 2Mo)"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Compte créé, en attente de validation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SuccessResponse"
                  }
                }
              }
            },
            "409": {
              "description": "Email déjà utilisé"
            },
            "422": {
              "description": "Données invalides"
            }
          }
        }
      },
      "/auth/login": {
        "post": {
          "summary": "Connexion utilisateur",
          "description": "Retourne un token JWT valide 7 jours. Seuls les comptes ACTIF peuvent se connecter.",
          "tags": [
            "Authentification"
          ],
          "security": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserLogin"
                },
                "example": {
                  "email": "admin@commune.mg",
                  "password": "Password123!"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Connexion réussie",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean"
                      },
                      "data": {
                        "type": "object",
                        "properties": {
                          "user": {
                            "$ref": "#/components/schemas/UserResponse"
                          },
                          "token": {
                            "type": "string",
                            "example": "eyJhbGciOiJIUzI1NiIs..."
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Identifiants incorrects"
            },
            "403": {
              "description": "Compte en attente, suspendu ou rejeté"
            },
            "429": {
              "description": "Trop de tentatives (max 5/min)"
            }
          }
        }
      },
      "/auth/logout": {
        "post": {
          "summary": "Déconnexion",
          "tags": [
            "Authentification"
          ],
          "responses": {
            "200": {
              "description": "Déconnexion réussie (invalider le token côté client)"
            }
          }
        }
      },
      "/auth/me": {
        "get": {
          "summary": "Informations de l'utilisateur connecté",
          "tags": [
            "Authentification"
          ],
          "responses": {
            "200": {
              "description": "Données de l'utilisateur connecté avec statistiques",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SuccessResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Non authentifié"
            }
          }
        }
      },
      "/auth/profile": {
        "put": {
          "summary": "Mise à jour du profil utilisateur",
          "description": "Permet de modifier le nom, l'avatar et le mot de passe. Le rôle ne peut pas être modifié.",
          "tags": [
            "Authentification"
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "currentPassword": {
                      "type": "string"
                    },
                    "newPassword": {
                      "type": "string"
                    },
                    "avatar": {
                      "type": "string",
                      "format": "binary"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Profil mis à jour"
            },
            "400": {
              "description": "Mot de passe actuel incorrect"
            },
            "422": {
              "description": "Données invalides"
            }
          }
        }
      },
      "/notifications": {
        "get": {
          "summary": "Liste des notifications de l'utilisateur",
          "description": "Retourne les notifications des 30 derniers jours avec compteur non lues.",
          "tags": [
            "Notifications"
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 25
              }
            },
            {
              "in": "query",
              "name": "unreadOnly",
              "schema": {
                "type": "string",
                "enum": [
                  "true",
                  "false"
                ]
              },
              "description": "Filtrer uniquement les non lues"
            },
            {
              "in": "query",
              "name": "type",
              "schema": {
                "type": "string",
                "enum": [
                  "NOUVEAU_RAPPORT",
                  "MENTION",
                  "NOUVELLE_INSCRIPTION",
                  "COMPTE_VALIDE",
                  "COMPTE_REJETE",
                  "RAPPORT_AVERTISSEMENT",
                  "COMPTE_SUSPENDU",
                  "RAPPORT_ARCHIVE"
                ]
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Notifications paginées avec compteur non lues",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/NotificationResponse"
                        }
                      },
                      "meta": {
                        "allOf": [
                          {
                            "$ref": "#/components/schemas/PaginationMeta"
                          },
                          {
                            "type": "object",
                            "properties": {
                              "unreadCount": {
                                "type": "integer"
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/notifications/read-all": {
        "patch": {
          "summary": "Marquer toutes les notifications comme lues",
          "tags": [
            "Notifications"
          ],
          "responses": {
            "200": {
              "description": "Nombre de notifications mises à jour"
            }
          }
        }
      },
      "/notifications/{id}/read": {
        "patch": {
          "summary": "Marquer une notification comme lue",
          "tags": [
            "Notifications"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Notification marquée comme lue"
            },
            "404": {
              "description": "Notification introuvable"
            }
          }
        }
      },
      "/rapports": {
        "get": {
          "summary": "Liste des rapports accessibles à l'utilisateur",
          "description": "Retourne uniquement les rapports que l'utilisateur a le droit de voir selon son rôle.",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 25,
                "maximum": 100
              }
            },
            {
              "in": "query",
              "name": "statut",
              "schema": {
                "type": "string",
                "enum": [
                  "BROUILLON",
                  "SOUMIS",
                  "MODIFIE",
                  "ARCHIVE",
                  "SIGNALE"
                ]
              }
            },
            {
              "in": "query",
              "name": "search",
              "schema": {
                "type": "string"
              },
              "description": "Recherche full-text (objet, description, tags)"
            },
            {
              "in": "query",
              "name": "tags",
              "schema": {
                "type": "string"
              }
            },
            {
              "in": "query",
              "name": "orderBy",
              "schema": {
                "type": "string",
                "enum": [
                  "createdAt",
                  "updatedAt",
                  "objet"
                ],
                "default": "createdAt"
              }
            },
            {
              "in": "query",
              "name": "order",
              "schema": {
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ],
                "default": "desc"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Liste paginée des rapports",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "success": {
                        "type": "boolean"
                      },
                      "data": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/RapportResponse"
                        }
                      },
                      "meta": {
                        "$ref": "#/components/schemas/PaginationMeta"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "post": {
          "summary": "Créer un nouveau rapport",
          "description": "Crée un rapport. Si statut=SOUMIS, les rôles autorisés sont notifiés en temps réel.",
          "tags": [
            "Rapports"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "allOf": [
                    {
                      "$ref": "#/components/schemas/RapportCreate"
                    },
                    {
                      "type": "object",
                      "properties": {
                        "fichier": {
                          "type": "string",
                          "format": "binary",
                          "description": "Fichier joint (PDF, Word, Excel, Image - max 10Mo)"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Rapport créé"
            },
            "403": {
              "description": "Rôle non autorisé à créer des rapports (ex: ARCHIVISTE)"
            },
            "422": {
              "description": "Données invalides"
            }
          }
        }
      },
      "/rapports/{id}": {
        "get": {
          "summary": "Détail d'un rapport",
          "description": "Retourne le rapport complet. Enregistre automatiquement l'accusé de lecture.",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Rapport avec mentions, stars, lecteurs et historique",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SuccessResponse"
                  }
                }
              }
            },
            "403": {
              "description": "Accès refusé (rôle non autorisé pour ce rapport)"
            },
            "404": {
              "description": "Rapport introuvable"
            }
          }
        },
        "put": {
          "summary": "Modifier un rapport",
          "description": "Propriétaire: modifiable dans les 24h après publication.\nADMIN/MAIRE/ADJOINT: modifiable à tout moment.\nSauvegarde automatique de la version précédente.\n",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "content": {
              "multipart/form-data": {
                "schema": {
                  "$ref": "#/components/schemas/RapportCreate"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Rapport modifié (statut → MODIFIE)"
            },
            "403": {
              "description": "Délai 24h dépassé ou accès non autorisé"
            }
          }
        },
        "delete": {
          "summary": "Supprimer un rapport définitivement",
          "description": "Suppression irréversible. Propriétaire ou ADMIN uniquement.",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Rapport supprimé"
            },
            "403": {
              "description": "Non autorisé"
            },
            "404": {
              "description": "Rapport introuvable"
            }
          }
        }
      },
      "/rapports/{id}/star": {
        "post": {
          "summary": "Ajouter/retirer une star (favori)",
          "description": "Toggle star. Un utilisateur ne peut attribuer qu'une seule star par rapport.",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "État de la star mis à jour",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "data": {
                        "type": "object",
                        "properties": {
                          "starred": {
                            "type": "boolean"
                          },
                          "starsCount": {
                            "type": "integer"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/rapports/{id}/readers": {
        "get": {
          "summary": "Liste des lecteurs du rapport (accusés de lecture)",
          "description": "Accessible uniquement par le propriétaire du rapport ou l'ADMIN.",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Liste des utilisateurs ayant lu le rapport avec horodatage"
            },
            "403": {
              "description": "Seul le propriétaire ou l'admin peut voir les lecteurs"
            }
          }
        }
      },
      "/rapports/{id}/archive": {
        "post": {
          "summary": "Archiver un rapport",
          "description": "Réservé aux ARCHIVISTE et ADMIN. Le rapport devient lecture seule.",
          "tags": [
            "Rapports"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Rapport archivé"
            },
            "403": {
              "description": "Non autorisé"
            }
          }
        }
      }
    }
  },
  "customOptions": {
    "persistAuthorization": true
  }
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}