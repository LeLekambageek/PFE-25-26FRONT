import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/stages", label: "Stages" },
  { to: "/encadrements", label: "Encadrements" },
  { to: "/memoires", label: "Memoires" },
  { to: "/soutenances", label: "Soutenances" },
  { to: "/bibliotheque", label: "Bibliotheque", disabled: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <aside className="sidebar">
        <div className="sidebar-brand">
          EPF AFRICA
          <span>Gestion academique</span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) =>
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

        <main className="page">{children}</main>
      </div>
    </div>
  );
}