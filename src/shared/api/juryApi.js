import apiClient from "./apiClient";

export const juryApi = {
  getMesSoutenances: () => apiClient.get("/jury/mes-soutenances"),
  getInformationsSoutenance: (soutenanceId) => apiClient.get(`/jury/soutenances/${soutenanceId}`),
  consulterMemoire: (soutenanceId) => apiClient.get(`/jury/soutenances/${soutenanceId}/memoire`),
  telechargerMemoire: (soutenanceId) => apiClient.get(`/jury/soutenances/${soutenanceId}/memoire/download`, { responseType: "blob" }),
  verifierAcces: (soutenanceId) => apiClient.get(`/jury/soutenances/${soutenanceId}/acces`),
  validerNote: (soutenanceId) => apiClient.post(`/jury/soutenances/${soutenanceId}/valider-notes`),

  // Notation elle-meme : route commune, pas specifique au role jury
  attribuerNote: (soutenanceId, data) => apiClient.post(`/soutenances/${soutenanceId}/notes`, data),
  getNotesSoutenance: (soutenanceId) => apiClient.get(`/soutenances/${soutenanceId}/notes`),
};