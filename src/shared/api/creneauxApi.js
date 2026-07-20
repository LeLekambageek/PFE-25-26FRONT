import apiClient from "./apiClient";

export const creneauxApi = {
  getCreneaux: (params) => apiClient.get("/creneaux-soutenance", { params }),
  createCreneau: (data) => apiClient.post("/creneaux-soutenance", data),
  getCreneau: (creneauId) => apiClient.get(`/creneaux-soutenance/${creneauId}`),
  updateCreneau: (creneauId, data) => apiClient.put(`/creneaux-soutenance/${creneauId}`, data),
  deleteCreneau: (creneauId) => apiClient.delete(`/creneaux-soutenance/${creneauId}`),
  reserverCreneau: (creneauId, data) => apiClient.post(`/creneaux-soutenance/${creneauId}/reserver`, data),
  annulerCreneau: (creneauId) => apiClient.post(`/creneaux-soutenance/${creneauId}/annuler`),
  getCreneauxDisponiblesPourMoi: () => apiClient.get("/creneaux-soutenance/disponibles-pour-moi"),
};
