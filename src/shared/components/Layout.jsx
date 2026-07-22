import { useEffect, useState } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, GitPullRequest, Briefcase, GraduationCap, BookOpen, Presentation, Library, Building2, ChevronLeft, ChevronRight, Search, Plus, Sparkles, CalendarDays, Menu, Command } from "lucide-react";
import NotificationBell from "./NotificationBell";
import logoImg from "../../assets/EPFBLACK.png";
//import logoImg from "C:/Users/lheri/OneDrive/Bureau/PFE_Sayba_MOI/PFE_FRONT/src/assets/EPFBLACK.png";

const NAV_ITEMS = [
  { to: "/etudiant", label: "Tableau de bord", roles: ["etudiant"], icon: LayoutDashboard },
  { to: "/encadreur", label: "Tableau de bord", roles: ["enseignant_encadreur"], icon: LayoutDashboard },
  { to: "/administration", label: "Tableau de bord", roles: ["administration"], icon: LayoutDashboard },
  { to: "/administration/comptes", label: "Comptes", roles: ["administration"], icon: Users },
  { to: "/administration/affectations", label: "Affectations", roles: ["administration"], icon: GitPullRequest },
  { to: "/jury", label: "Tableau de bord", roles: ["jury_soutenance"], icon: LayoutDashboard },
  { to: "/stages", label: "Stages", roles: ["etudiant", "enseignant_encadreur", "administration"], icon: Briefcase },
  { to: "/encadrements", label: "Encadrements", roles: ["enseignant_encadreur", "administration"], icon: GraduationCap },
  { to: "/memoires", label: "Mémoires", roles: ["etudiant", "enseignant_encadreur", "administration"], icon: BookOpen },
  { to: "/soutenances", label: "Soutenances", roles: ["etudiant", "enseignant_encadreur", "administration"], icon: Presentation },
  { to: "/bibliotheque", label: "Bibliothèque", roles: ["etudiant", "enseignant_encadreur", "administration", "jury_soutenance"], icon: Library },
  { to: "/entreprises", label: "Entreprises", roles: ["administration"], icon: Building2 },
];

const ROUTE_INFO = {
  "/etudiant": { title: "Tableau de Bord Étudiant", subtitle: "Suivi de vos activités académiques, de vos stages et de vos résultats." },
  "/encadreur": { title: "Espace Encadreur", subtitle: "Suivi de vos étudiants assignés, validations et évaluations de mémoires." },
  "/administration": { title: "Dashboard administrateur", subtitle: "Vue d'ensemble et pilotage de la scolarité de l'établissement." },
  "/administration/comptes": { title: "Gestion des Comptes", subtitle: "Création, modification et maintenance des accès utilisateurs." },
  "/administration/affectations": { title: "Candidatures & Affectations", subtitle: "Traitement des candidatures de stages et assignations d'encadreurs." },
  "/jury": { title: "Espace Jury de Soutenance", subtitle: "Délibérations, notation finale et signature électronique des PV." },
  "/stages": { title: "Gestion des Stages", subtitle: "Suivi des stages actifs et catalogue d'offres partenaires." },
  "/encadrements": { title: "Mes Encadrements", subtitle: "Échanges, validations de sujets et rapports de stages." },
  "/memoires": { title: "Mémoires de Fin d'Études", subtitle: "Versions de mémoires déposées, avancement et éligibilité." },
  "/soutenances": { title: "Planification des Soutenances", subtitle: "Créneaux de passage, constitutions de jurys et publication." },
  "/bibliotheque": { title: "Bibliothèque Numérique", subtitle: "Consultation et recherche des mémoires soutenus archivés." },
  "/entreprises": { title: "Entreprises Partenaires", subtitle: "Annuaire des raisons sociales partenaires d'EPF Africa." },
};

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.some(hasRole)) return false;
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

  const currentRouteInfo = ROUTE_INFO[location.pathname] || {
    title: "EPF Africa",
    subtitle: "Système de Gestion Académique"
  };

  const currentTitleClass = "text-white";
  const currentSubtitleClass = "text-slate-300";

  const breadcrumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, array) => ({
      label: segment.replace(/-/g, " "),
      to: "/" + array.slice(0, index + 1).join("/")
    }));

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <div className="app-shell bg-[#09090B] min-h-screen text-white overflow-x-hidden">
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <motion.aside
        animate={{ width: isMobile ? 280 : isCollapsed ? 88 : 320 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className={`sidebar flex-shrink-0 flex flex-col bg-[#0f172a] shadow-xl border-r border-slate-800 overflow-hidden ${isMobile
          ? `fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`
          : "relative"
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="sidebar-brand flex items-start justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="sidebar-logo flex h-12 w-12 items-center justify-center rounded-xl bg-transparent overflow-hidden">
                <img src={logoImg} alt="Logo EPF" className="w-full h-full object-contain" />
              </div>
              {!effectiveCollapsed && (
                <div className="text-white leading-tight pt-1">
                  <p className="text-base font-semibold tracking-[0.12em] uppercase">EPF Africa</p>
                </div>
              )}
            </div>
            {isMobile ? (
              <button
                onClick={() => setIsMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition"
                aria-label="Fermer la barre latérale"
              >
                <ChevronLeft size={18} />
              </button>
            ) : !isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition"
                aria-label="Réduire la barre latérale"
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button
                onClick={() => setIsCollapsed(false)}
                className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#111827] border border-white/10 text-white hover:bg-[#0b1220] transition"
                aria-label="Ouvrir la barre latérale"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${isActive ? "active text-white bg-[#FF0000]/15 border border-[#FF0000]/30" : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`nav-icon relative z-10 flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? "text-[#FF0000]" : "text-slate-400"}`}>
                          <Icon size={18} />
                        </span>
                        {!effectiveCollapsed && (
                          <span className="relative z-10">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-footer border-t border-slate-800 px-4 py-4">
            <div className="user-card rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-base font-bold text-white shadow-sm shrink-0">
                  {initiales}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold truncate text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate font-medium">{roleLabel}</p>
                </div>
              </div>
              {!effectiveCollapsed && (
                <div className="mt-3">
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg bg-[#FF0000] py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#D50048]"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="main-area flex-1 flex min-w-0 flex-col bg-[#09090B]">
        <header className="topbar sticky top-0 z-40 border-b border-slate-800 bg-[#0f172a]/95 text-white backdrop-blur-md shadow-sm">
          <div className="mx-auto flex w-full max-w-full flex-col gap-4 px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <button
                  onClick={() => setIsMobileOpen(true)}
                  className="lg:hidden mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
                  aria-label="Ouvrir la barre latérale"
                >
                  <Menu size={20} />
                </button>
                <div className="min-w-0">
                  <div className="breadcrumb mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#FF0000]">
                    <span>Tableau</span>
                    {breadcrumbs.map((crumb) => (
                      <span key={crumb.to} className="inline-flex items-center gap-2">
                        <span className="text-slate-500">/</span>
                        <span className="truncate text-slate-300 font-normal">{crumb.label}</span>
                      </span>
                    ))}
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight ${currentTitleClass} md:text-4xl`}>{currentRouteInfo.title}</h1>
                  <p className={`mt-2 max-w-3xl text-base ${currentSubtitleClass}`}>{currentRouteInfo.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="page flex-1 w-full px-6 pb-8 pt-8 lg:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
              className="space-y-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}