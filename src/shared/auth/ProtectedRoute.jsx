import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mot de passe temporaire : l'API refuse tout le reste tant qu'il n'est pas changé
  if (user.must_change_password) {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  if (allowedRoles && !allowedRoles.some((role) => user.roles?.some((r) => r.name === role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}