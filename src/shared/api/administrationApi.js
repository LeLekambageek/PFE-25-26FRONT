import apiClient from "./apiClient";

export const administrationApi = {
  // Gestion des comptes
  getComptesEtudiants: (params) => apiClient.get("/administration/etudiants", { params }),
  creerCompteEtudiant: (data) => apiClient.post("/administration/etudiants", data),
  getComptesEnseignants: () => apiClient.get("/administration/enseignants"),
  creerCompteEnseignant: (data) => apiClient.post("/administration/enseignants", data),
  attribuerRoleEncadreur: (enseignantId) => apiClient.post(`/administration/enseignants/${enseignantId}/role-encadreur`),
  getComptesJury: () => apiClient.get("/administration/jury"),
  creerCompteJury: (data) => apiClient.post("/administration/jury", data),
  
  // Entreprises
  getEntreprises: (params) => apiClient.get("/administration/entreprises", { params }),
  
  // Affectations
  affecterEtudiantEncadreur: (data) => apiClient.post("/administration/affecter-etudiant-encadreur", data),
  affecterStageEtudiant: (data) => apiClient.post("/administration/affecter-stage-etudiant", data),
  associerEntrepriseEtudiant: (etudiantId, data) => apiClient.post(`/administration/etudiant/${etudiantId}/associer-entreprise`, data),
  
  // Candidatures
  getCandidaturesEnAttente: () => apiClient.get("/administration/candidatures-en-attente"),
  traiterCandidature: (candidatureId, data) => apiClient.post(`/administration/candidature/${candidatureId}/traiter`, data),
  
  // Mémoires
  getMemoiresValidesFinale: () => apiClient.get("/administration/memoires-valides-finale"),
  
  // Soutenances
  planifierSoutenance: (data) => apiClient.post("/administration/planifier-soutenance", data),
  validerDemandeCreneau: (creneauId) => apiClient.post(`/administration/creneau/${creneauId}/valider-demande`),
  genererConvocations: (soutenanceId) => apiClient.post(`/administration/soutenance/${soutenanceId}/generer-convocations`),
  constituerJury: (soutenanceId, data) => apiClient.post(`/administration/soutenance/${soutenanceId}/constituer-jury`, data),
  publierResultats: (soutenanceId) => apiClient.post(`/administration/soutenance/${soutenanceId}/publier-resultats`),
  reactiverJury: (juryId) => apiClient.post(`/administration/jury/${juryId}/reactiver`),
};
