import apiClient from "./apiClient";

export const notificationsApi = {
  getNotifications: () => apiClient.get("/notifications"),
  getUnreadCount: () => apiClient.get("/notifications/non-lues/count"),
  getNotification: (id) => apiClient.get(`/notifications/${id}`),
  markAsRead: (id) => apiClient.post(`/notifications/${id}/lu`),
  markAllAsRead: () => apiClient.post("/notifications/tout-marquer-lu"),
  deleteNotification: (id) => apiClient.delete(`/notifications/${id}`),
};