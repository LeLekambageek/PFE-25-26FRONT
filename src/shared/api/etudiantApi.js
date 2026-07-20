import apiClient from "./apiClient";

export const etudiantApi = {
  // Stages
  getMesStages: () => apiClient.get("/mon-espace/stages"),
  getMonStageActif: () => apiClient.get("/mon-espace/stage-actif"),

  // Memoires
  getMesMemoires: () => apiClient.get("/mon-espace/memoires"),
  proposerSujetMemoire: (data) => apiClient.post("/memoires", data),

  // Encadrements
  getMesEncadrements: () => apiClient.get("/mon-espace/encadrements"),

  // Candidatures
  getMesCandidatures: () => apiClient.get("/mon-espace/candidatures"),

  // Rapports
  getMesRapports: () => apiClient.get("/mon-espace/rapports"),

  // Soutenance
  demanderCreneauSoutenance: (creneauId) => apiClient.post(`/creneaux-soutenance/${creneauId}/reserver`),
  getInformationsSoutenance: () => apiClient.get("/mon-espace/soutenance"),
  getResultatsSoutenance: () => apiClient.get("/mon-espace/resultats-soutenance"),
};