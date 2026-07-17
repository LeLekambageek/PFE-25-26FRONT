import apiClient from "./apiClient";

export const encadreurApi = {
  // Étudiants
  getMesEtudiants: () => apiClient.get("/encadreur/mes-etudiants"),
  getInformationsStageEtudiant: (etudiantId) => apiClient.get(`/encadreur/etudiant/${etudiantId}/stage`),
  
  // Mémoires
  proposerSujetMemoire: (data) => apiClient.post("/encadreur/proposer-sujet-memoire", data),
  examinerSujetPropose: (memoireId, data) => apiClient.post(`/encadreur/memoire/${memoireId}/examiner`, data),
  getVersionsMemoire: (memoireId) => apiClient.get(`/encadreur/memoire/${memoireId}/versions`),
  annoterVersion: (versionId, data) => apiClient.post(`/encadreur/version/${versionId}/annoter`, data),
  mettreAJourAvancement: (versionId, data) => apiClient.post(`/encadreur/version/${versionId}/avancement`, data),
  validerVersionFinale: (versionId) => apiClient.post(`/encadreur/version/${versionId}/valider-finale`),
  
  // Rendez-vous et messages
  organiserRendezVous: (encadrementId, data) => apiClient.post(`/encadreur/encadrement/${encadrementId}/rendez-vous`, data),
  getMessagesEncadrement: (encadrementId) => apiClient.get(`/encadreur/encadrement/${encadrementId}/messages`),
  envoyerMessage: (encadrementId, data) => apiClient.post(`/encadreur/encadrement/${encadrementId}/messages`, data),
};
