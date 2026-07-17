import apiClient from "./apiClient";

export const notificationsApi = {
  getNotifications: (params) => apiClient.get("/notifications", { params }),
  getNotificationsNonLues: () => apiClient.get("/notifications/non-lues"),
  getCountUnread: () => apiClient.get("/notifications/count"),
  markAllAsRead: () => apiClient.post("/notifications/marquer-toutes-lues"),
  getNotification: (notificationId) => apiClient.get(`/notifications/${notificationId}`),
  markAsRead: (notificationId) => apiClient.post(`/notifications/${notificationId}/marquer-lue`),
  deleteNotification: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
};
