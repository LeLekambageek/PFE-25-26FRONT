import { useState } from "react";
import apiClient from "../../../shared/api/apiClient";

export default function StageForm({ onStageCreated }) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post("/stages", {
        titre,
        description,
        date_debut: dateDebut,
        date_fin: dateFin,
      });

      setTitre("");
      setDescription("");
      setDateDebut("");
      setDateFin("");

      onStageCreated?.(data);
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
      <h2>Demander un stage</h2>

      <div className="form-group">
        <label>Titre</label>
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date de début</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Date de fin</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
