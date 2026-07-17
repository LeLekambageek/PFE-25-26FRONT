import apiClient from "./apiClient";

export const etudiantApi = {
  // Stages
  getMesStages: () => apiClient.get("/etudiant/mes-stages"),
  getMonStageActif: () => apiClient.get("/etudiant/mon-stage-actif"),
  
  // Mémoires
  getMesMemoires: () => apiClient.get("/etudiant/mes-memoires"),
  proposerSujetMemoire: (data) => apiClient.post("/etudiant/proposer-sujet-memoire", data),
  
  // Encadrements
  getMesEncadrements: () => apiClient.get("/etudiant/mes-encadrements"),
  
  // Candidatures
  getMesCandidatures: () => apiClient.get("/etudiant/mes-candidatures"),
  
  // Rapports
  getMesRapports: () => apiClient.get("/etudiant/mes-rapports"),
  
  // Soutenance
  demanderCreneauSoutenance: (data) => apiClient.post("/etudiant/demander-creneau-soutenance", data),
  getInformationsSoutenance: () => apiClient.get("/etudiant/informations-soutenance"),
  getResultatsSoutenance: () => apiClient.get("/etudiant/resultats-soutenance"),
};
