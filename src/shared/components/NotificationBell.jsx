import { useState, useEffect } from "react";
import { notificationsApi } from "../api/notificationsApi";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getCountUnread();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications({ statut: "non_lue", per_page: 10 });
      setNotifications(response.data.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications([]);
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="notif-bell">
      <button onClick={handleToggle} className="notif-bell-btn" aria-label="Notifications">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={handleMarkAllAsRead} className="notif-mark-all">
                Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">Aucune notification non lue</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="notif-item"
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="notif-item-dot" />
                <div>
                  <p className="notif-item-title">{notification.titre}</p>
                  <p className="notif-item-message">{notification.message}</p>
                  <p className="notif-item-date">
                    {new Date(notification.date_creation).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
