/**
 * @file permissions.config.js
 * @description Matrice RBAC complète selon le cahier des charges CommuneConnecte
 * OUI = true | NON = false | PARTIEL = 'own' (uniquement ses propres ressources)
 */

/**
 * @typedef {'ADMIN'|'MAIRE'|'ADJOINT_MAIRE'|'SECRETAIRE_COMMUNAL'|'ARCHIVISTE'|'ETAT_CIVIL'|'TRESORERIE'|'PERCEPTEUR'|'REGISSEUR'} Role
 */

/**
 * Matrice des permissions par rôle.
 * Les clés correspondent aux actions disponibles dans le système.
 * @type {Object.<Role, Object.<string, boolean|string>>}
 */
export const PERMISSIONS = {
  ADMIN: {
    validerComptes: true,
    gererUtilisateurs: true,
    creerRapport: true,
    voirTousRapports: true,
    modifierRapport: true,        // tous les rapports
    supprimerRapport: true,       // tous les rapports
    archiverRapport: true,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: true,
    voirAuditLog: true,
    voirStatistiques: true,
    forcerArchivage: true,
    reinitialiserMotDePasse: true,
  },

  MAIRE: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: true,       // accès complet à tous les rapports
    modifierRapport: 'own',       // uniquement ses propres rapports (dans les 24h)
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: true,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  ADJOINT_MAIRE: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: true,       // accès étendu comme le Maire
    modifierRapport: 'own',
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  SECRETAIRE_COMMUNAL: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: 'partial',  // rapports administratifs + rapports visibles selon rôle
    modifierRapport: 'own',
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  ARCHIVISTE: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: false,
    voirTousRapports: true,       // lecture de tous les rapports validés
    modifierRapport: false,
    supprimerRapport: false,
    archiverRapport: true,        // seul à pouvoir archiver (avec ADMIN)
    ajouterStar: true,
    mentionnerUser: false,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  ETAT_CIVIL: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: 'partial',  // uniquement les rapports de son service
    modifierRapport: 'own',
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  TRESORERIE: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: 'partial',
    modifierRapport: 'own',
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  PERCEPTEUR: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: 'partial',
    modifierRapport: 'own',
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },

  REGISSEUR: {
    validerComptes: false,
    gererUtilisateurs: false,
    creerRapport: true,
    voirTousRapports: 'partial',
    modifierRapport: 'own',
    supprimerRapport: 'own',
    archiverRapport: false,
    ajouterStar: true,
    mentionnerUser: true,
    ajouterWarning: false,
    voirAuditLog: false,
    voirStatistiques: false,
    forcerArchivage: false,
    reinitialiserMotDePasse: false,
  },
};

/**
 * Vérifie si un rôle a la permission pour une action donnée.
 * @param {Role} role - Rôle de l'utilisateur
 * @param {string} action - Action à vérifier
 * @returns {boolean|string} true si autorisé, 'own' si uniquement ses ressources, false sinon
 */
export const hasPermission = (role, action) => {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms[action] ?? false;
};

/**
 * Rôles ayant accès complet à tous les rapports (sans filtre de visibilité)
 */
export const FULL_ACCESS_ROLES = ['ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'ARCHIVISTE'];

/**
 * Rôles pouvant créer des rapports
 */
export const CAN_CREATE_ROLES = ['ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR'];
