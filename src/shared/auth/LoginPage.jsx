import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { roleHomePath } from "../roleHomePath";
import loginImg from "../../assets/conexion.jpg";
import logoImg from "../../assets/logo header.jpg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleHomePath(user), { replace: true });
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Left side: Premium Image Banner */}
      <div className="login-banner">
        <img src={loginImg} alt="Connexion EPF Africa" className="login-banner-image" />
        <div className="login-banner-overlay" />
        <div className="login-banner-content">
          <img src={logoImg} alt="Logo EPF Africa" className="login-banner-logo" />
          <h2 className="login-banner-title">EPF Africa</h2>
          <p className="login-banner-subtitle">
            Système de Gestion Académique de pointe. Connectez-vous pour suivre vos stages, mémoires et évaluations.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="login-container">
        <div className="login-form-box">
          <img src={logoImg} alt="EPF Africa" className="login-form-logo" />
          <h1 className="login-form-title">Accès sécurisé</h1>
          <p className="login-form-subtitle">Connectez-vous pour accéder à votre espace EPF Africa.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="nom@epf-africa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full py-4 text-base font-bold" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
