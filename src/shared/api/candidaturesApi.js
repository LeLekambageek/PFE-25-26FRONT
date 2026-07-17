import apiClient from "./apiClient";

export const candidaturesApi = {
  getCandidatures: (params) => apiClient.get("/candidatures-stage", { params }),
  createCandidature: (data) => apiClient.post("/candidatures-stage", data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCandidature: (candidatureId) => apiClient.get(`/candidatures-stage/${candidatureId}`),
  updateCandidature: (candidatureId, data) => apiClient.put(`/candidatures-stage/${candidatureId}`, data),
  deleteCandidature: (candidatureId) => apiClient.delete(`/candidatures-stage/${candidatureId}`),
  affecterStage: (candidatureId, data) => apiClient.post(`/candidatures-stage/${candidatureId}/affecter-stage`, data),
};
