import apiClient from "./apiClient";

export const bibliothequeApi = {
  getDocuments: (params) => apiClient.get("/documents", { params }),
  getDocument: (documentId) => apiClient.get(`/documents/${documentId}`),
  archiverDocument: (data) =>
    apiClient.post("/documents", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateDocument: (documentId, data) => apiClient.put(`/documents/${documentId}`, data),
  deleteDocument: (documentId) => apiClient.delete(`/documents/${documentId}`),
  downloadDocument: (documentId) =>
    apiClient.get(`/documents/${documentId}/download`, { responseType: "blob" }),
};
