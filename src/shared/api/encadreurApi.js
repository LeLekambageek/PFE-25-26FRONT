import apiClient from "./apiClient";

export const encadreurApi = {
  // Etudiants
  getMesEtudiants: () => apiClient.get("/mes-etudiants-encadres"),
  getInformationsStageEtudiant: (etudiantId) => apiClient.get(`/etudiants-encadres/${etudiantId}/stage`),

  // Memoires
  proposerSujetMemoire: (data) => apiClient.post("/memoires", data),
  validerSujet: (memoireId) => apiClient.post(`/memoires/${memoireId}/valider`),
  rejeterSujet: (memoireId, data) => apiClient.post(`/memoires/${memoireId}/rejeter`, data),
  demanderModificationSujet: (memoireId, data) => apiClient.post(`/memoires/${memoireId}/demander-modification`, data),

  getVersionsMemoire: (memoireId) => apiClient.get(`/memoires/${memoireId}/versions`),
  mettreAJourAvancement: (versionId, data) => apiClient.post(`/versions/${versionId}/corriger`, data),
  validerVersionFinale: (versionId) => apiClient.post(`/versions/${versionId}/valider-finale`),
  accorderEligibiliteSoutenance: (memoireId) => apiClient.post(`/memoires/${memoireId}/accorder-eligibilite-soutenance`),

  // Rendez-vous et carnet (type = "stage" | "memoire", fourni par le champ `type` de l'encadrement)
  organiserRendezVous: (type, encadrementId, data) => apiClient.post(`/encadrements/${type}/${encadrementId}/rendez-vous`, data),
  getEntrees: (type, encadrementId) => apiClient.get(`/encadrements/${type}/${encadrementId}/entrees`),
  ajouterEntree: (type, encadrementId, data) => apiClient.post(`/encadrements/${type}/${encadrementId}/entrees`, data),


};