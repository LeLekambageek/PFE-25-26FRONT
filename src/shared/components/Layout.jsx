import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/etudiant", label: "Tableau de bord", roles: ["etudiant"] },
  { to: "/encadreur", label: "Tableau de bord", roles: ["enseignant_encadreur"] },
  { to: "/administration", label: "Tableau de bord", roles: ["admin_general", "responsable_formation"] },
  { to: "/jury", label: "Tableau de bord", roles: ["jury_soutenance"] },
  { to: "/stages", label: "Stages" },
  { to: "/encadrements", label: "Encadrements", hiddenFor: ["responsable_relation_entreprise"] },
  { to: "/memoires", label: "Memoires", hiddenFor: ["responsable_relation_entreprise"] },
  { to: "/soutenances", label: "Soutenances", hiddenFor: ["responsable_relation_entreprise"] },
  { to: "/bibliotheque", label: "Bibliotheque", disabled: true },
  { to: "/entreprises", label: "Entreprises", roles: ["admin_general", "responsable_relation_entreprise"] },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const w = Math.min(340, Math.max(180, e.clientX));
      setSidebarWidth(w);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = () => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
  };

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.some(hasRole)) return false;
    if (item.hiddenFor && item.hiddenFor.some(hasRole)) return false;
    return true;
  });

  const initiales = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const roleLabel = user?.roles?.[0]?.name?.replace(/_/g, " ") || "";

  const handleLogout = async () => {
    await logout?.();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" style={{ width: sidebarWidth }}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="" className="sidebar-logo" />
          <div>
            EPF AFRICA™
            <span>Gestion academique</span>
          </div>
        </div>

        <nav>
          {navItems.map((item) =>
            item.disabled ? (
              <span key={item.to} className="nav-link disabled" title="Module a venir">
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-resize-handle" onMouseDown={startDrag} />
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-user">
            <strong>{user?.name}</strong>
            <span>{roleLabel}</span>
          </div>
          <div className="topbar-avatar">{initiales}</div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Deconnexion
          </button>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}