import apiClient from "./apiClient";

export const offresStageApi = {
  getOffres: () => apiClient.get("/offres-stage"),
  getOffre: (id) => apiClient.get(`/offres-stage/${id}`),
  creerOffre: (data) => apiClient.post("/offres-stage", data),
  modifierOffre: (id, data) => apiClient.put(`/offres-stage/${id}`, data),
  fermerOffre: (id) => apiClient.put(`/offres-stage/${id}`, { statut: "fermee" }),
  supprimerOffre: (id) => apiClient.delete(`/offres-stage/${id}`),

  // Candidature liee a une offre precise (CV + lettre en multipart)
  candidater: (offreId, formData) =>
    apiClient.post("/candidatures-stage", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};