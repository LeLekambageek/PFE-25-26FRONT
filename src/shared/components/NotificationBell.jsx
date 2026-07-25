import { useState, useEffect } from "react";
import { notificationsApi } from "../api/notificationsApi";
import { Bell, Check, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      const response = await notificationsApi.getUnreadCount();
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
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#111827] border border-[#374151] text-white hover:text-white hover:bg-[#0b1220] hover:border-[#475569] transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-[swing_1s_ease-in-out_infinite]" : ""} />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF0000] rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF0000] rounded-full" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 15, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-3 w-80 bg-[#0f172a]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-md"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111827]/90">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#FF0000] hover:text-[#D50048] font-medium cursor-pointer transition-colors"
                >
                  Marquer tout comme lu
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 gap-2">
                  <BellOff size={24} className="text-slate-500" />
                  <p className="text-xs font-medium">Aucune notification non lue</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 group"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{notification.titre}</p>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-snug">
                        {notification.message}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 mt-1.5 block">
                        {new Date(notification.date_creation).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
