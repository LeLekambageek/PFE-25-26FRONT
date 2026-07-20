import apiClient from "./apiClient";

export const administrationApi = {
  // Comptes etudiants
  listerEtudiants: () => apiClient.get("/etudiants"),
  creerCompteEtudiant: (data) => apiClient.post("/administration/etudiants", data),
  modifierEtudiant: (id, data) => apiClient.put(`/administration/etudiants/${id}`, data),
  supprimerEtudiant: (id) => apiClient.delete(`/administration/etudiants/${id}`),

  // Comptes enseignants
  getComptesEnseignants: () => apiClient.get("/administration/enseignants"),
  creerCompteEnseignant: (data) => apiClient.post("/administration/enseignants", data),
  modifierEnseignant: (id, data) => apiClient.put(`/administration/enseignants/${id}`, data),
  supprimerEnseignant: (id) => apiClient.delete(`/administration/enseignants/${id}`),
  attribuerRoleEncadreur: (enseignantId) => apiClient.post(`/administration/enseignants/${enseignantId}/role-encadreur`),

  // Comptes jury
  getComptesJury: () => apiClient.get("/administration/jury"),
  creerCompteJury: (data) => apiClient.post("/administration/jury", data),
  modifierJury: (id, data) => apiClient.put(`/administration/jury/${id}`, data),
  supprimerJury: (id) => apiClient.delete(`/administration/jury/${id}`),
  reactiverJury: (juryId) => apiClient.post(`/administration/jury/${juryId}/reactiver`),

  // Mot de passe
  reinitialiserMotDePasse: (userId, data) => apiClient.post(`/administration/users/${userId}/reinitialiser-mot-de-passe`, data),

  // Entreprises
  getEntreprises: (params) => apiClient.get("/entreprises", { params }),
  creerEntreprise: (data) => apiClient.post("/entreprises", data),
  modifierEntreprise: (id, data) => apiClient.put(`/entreprises/${id}`, data),
  supprimerEntreprise: (id) => apiClient.delete(`/entreprises/${id}`),

  // Association entreprise
  associerEntrepriseEtudiant: (etudiantId, data) => apiClient.put(`/administration/stages/${etudiantId}/entreprise`, data),

  // Candidatures
  getCandidatures: () => apiClient.get("/candidatures-stage"),
  validerCandidature: (id, data) => apiClient.put(`/candidatures-stage/${id}`, data),
  affecterStage: (candidatureId, data) => apiClient.post(`/candidatures-stage/${candidatureId}/affecter-stage`, data),

  // Memoires eligibles
  getMemoiresValidesFinale: () => apiClient.get("/administration/memoires-eligibles-soutenance"),

  // Soutenances
  planifierSoutenance: (data) => apiClient.post("/soutenances", data),
  constituerJury: (soutenanceId, data) => apiClient.post(`/soutenances/${soutenanceId}/jury`, data),
  genererConvocations: (soutenanceId) => apiClient.post(`/soutenances/${soutenanceId}/convocations`),
  publierResultats: (soutenanceId) => apiClient.post(`/soutenances/${soutenanceId}/publier-resultats`),

  // Creneaux
  creerCreneauSoutenance: (data) => apiClient.post("/creneaux-soutenance", data),
  getCreneauxSoutenance: (params) => apiClient.get("/creneaux-soutenance", { params }),
  validerDemandeCreneau: (creneauId) => apiClient.post(`/creneaux-soutenance/${creneauId}/valider`),
  supprimerCreneauSoutenance: (creneauId) => apiClient.delete(`/creneaux-soutenance/${creneauId}`),

  // A CONFIRMER avant d'utiliser (voir EncadrementController avant de cabler le bouton) :
  affecterEtudiantEncadreur: (stageId, encadreurId) => apiClient.post(`/stages/${stageId}/affecter-encadreur`, { encadreur_id: encadreurId }),

  // Dashboard
  getDashboardApercu: () => apiClient.get("/dashboard/apercu"),
  getDashboardGraphiques: () => apiClient.get("/dashboard/graphiques"),
  getDashboardDelais: () => apiClient.get("/dashboard/delais-moyens"),
  getDashboardTauxEncadrement: () => apiClient.get("/dashboard/taux-encadrement"),
};