import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "./AuthContext";
import { roleHomePath } from "../roleHomePath";
import logoImg from "../../assets/logo header.jpg";

/**
 * Changement du mot de passe temporaire envoyé par email à la création (ou à la
 * réinitialisation) du compte. Tant qu'il n'est pas changé, l'API refuse toutes
 * les autres routes (403, code "must_change_password").
 */
export default function ChangerMotDePassePage() {
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (authLoading) return <p>Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (nouveau !== confirmation) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/changer-mot-de-passe", {
        mot_de_passe_actuel: actuel,
        mot_de_passe: nouveau,
        mot_de_passe_confirmation: confirmation,
      });
      const majUser = await refreshUser();
      navigate(roleHomePath(majUser), { replace: true });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-box">
        <img src={logoImg} alt="EPF Africa" className="login-form-logo" />
        <h1 className="login-form-title">Nouveau mot de passe</h1>
        <p className="login-form-subtitle">
          {user.must_change_password
            ? "Votre compte utilise un mot de passe temporaire. Choisissez-en un nouveau pour continuer."
            : "Modifiez le mot de passe de votre compte."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe actuel</label>
            <input type="password" value={actuel} onChange={(e) => setActuel(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe (8 caractères min.)</label>
            <input type="password" minLength={8} value={nouveau} onChange={(e) => setNouveau(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmation</label>
            <input
              type="password"
              minLength={8}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full py-4 text-base font-bold" disabled={loading}>
            {loading ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
          <button type="button" className="btn btn-ghost w-full" onClick={logout}>
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
