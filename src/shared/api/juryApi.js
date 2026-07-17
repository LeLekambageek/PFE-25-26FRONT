import apiClient from "./apiClient";

export const juryApi = {
  getMesSoutenances: () => apiClient.get("/jury/mes-soutenances"),
  getInformationsSoutenance: (soutenanceId) => apiClient.get(`/jury/soutenance/${soutenanceId}`),
  consulterMemoire: (soutenanceId) => apiClient.get(`/jury/soutenance/${soutenanceId}/memoire`),
  telechargerMemoire: (soutenanceId) => apiClient.get(`/jury/soutenance/${soutenanceId}/memoire/download`, { responseType: 'blob' }),
  attribuerNote: (soutenanceId, data) => apiClient.post(`/jury/soutenance/${soutenanceId}/note`, data),
  validerNote: (soutenanceId) => apiClient.post(`/jury/soutenance/${soutenanceId}/note/valider`),
  getMesNotes: (soutenanceId) => apiClient.get(`/jury/soutenance/${soutenanceId}/mes-notes`),
  getNotesSoutenance: (soutenanceId) => apiClient.get(`/jury/soutenance/${soutenanceId}/notes`),
  verifierAcces: (soutenanceId) => apiClient.get(`/jury/soutenance/${soutenanceId}/verifier-acces`),
};
