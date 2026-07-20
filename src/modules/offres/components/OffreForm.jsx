import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { offresStageApi } from "../../../shared/api/offresStageApi";

export default function OffreForm({ onOffreCreated }) {
  const [entreprises, setEntreprises] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [competences, setCompetences] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get("/entreprises").then(({ data }) => setEntreprises(data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await offresStageApi.creerOffre({
        entreprise_id: entrepriseId,
        titre,
        description,
        competences_requises: competences,
        date_debut_souhaitee: dateDebut || null,
        date_fin_souhaitee: dateFin || null,
      });

      setEntrepriseId("");
      setTitre("");
      setDescription("");
      setCompetences("");
      setDateDebut("");
      setDateFin("");

      onOffreCreated?.(data);
    } catch (err) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.message || "Une erreur est survenue.";
      setError(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: 16 }}>Publier une offre de stage</h2>

      <div className="form-group">
        <label>Raison sociale de l'entreprise</label>
        <select value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {entreprises.map((e) => (
            <option key={e.id} value={e.id}>{e.raison_sociale}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Titre du poste</label>
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
      </div>

      <div className="form-group">
        <label>Competences requises</label>
        <textarea value={competences} onChange={(e) => setCompetences(e.target.value)} rows={2} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date de debut souhaitee</label>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date de fin souhaitee</label>
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Publication..." : "Publier l'offre"}
      </button>
    </form>
  );
}