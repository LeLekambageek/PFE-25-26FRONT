import { useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";

export default function MemoireForm({ onMemoireCreated }) {
  const { user } = useAuth();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post("/memoires", {
        titre,
        description,
        etudiant_id: user?.id,
      });

      setTitre("");
      setDescription("");

      onMemoireCreated?.(data);
    } catch (err) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : "Une erreur est survenue.";
      setError(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Proposer un sujet de mémoire</h2>

      <div className="form-group">
        <label>Titre</label>
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi..." : "Proposer le sujet"}
      </button>
    </form>
  );
}
