import apiClient from "./apiClient";

export const rapportsApi = {
  getRapports: (params) => apiClient.get("/rapports-stage", { params }),
  createRapport: (data) => apiClient.post("/rapports-stage", data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getRapport: (rapportId) => apiClient.get(`/rapports-stage/${rapportId}`),
  corrigerRapport: (rapportId, data) => apiClient.post(`/rapports-stage/${rapportId}/corriger`, data),
  validerRapport: (rapportId) => apiClient.post(`/rapports-stage/${rapportId}/valider`),
  downloadRapport: (rapportId) => apiClient.get(`/rapports-stage/${rapportId}/download`, { responseType: 'blob' }),
  deleteRapport: (rapportId) => apiClient.delete(`/rapports-stage/${rapportId}`),
};
