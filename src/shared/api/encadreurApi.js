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

  // Rendez-vous et carnet
  organiserRendezVous: (encadrementId, data) => apiClient.post(`/encadrements/${encadrementId}/rendez-vous`, data),
  getEntrees: (encadrementId) => apiClient.get(`/encadrements/${encadrementId}/entree`),
  ajouterEntree: (encadrementId, data) => apiClient.post(`/encadrements/${encadrementId}/entree`, data),


};