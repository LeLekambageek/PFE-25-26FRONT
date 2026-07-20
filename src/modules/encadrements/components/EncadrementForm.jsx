import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";

export default function EncadrementForm({ onEncadrementCreated }) {
  const [etudiants, setEtudiants] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [etudiantId, setEtudiantId] = useState("");
  const [enseignantId, setEnseignantId] = useState("");
  const [type, setType] = useState("stage");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get("/annuaire/etudiants").then(({ data }) => setEtudiants(data));
    apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post("/encadrements", {
        etudiant_id: etudiantId,
        enseignant_id: enseignantId,
        type,
      });

      setEtudiantId("");
      setEnseignantId("");
      setType("stage");

      onEncadrementCreated?.(data);
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
      <h2>Créer un encadrement</h2>

      <div className="form-group">
        <label>Étudiant</label>
        <select value={etudiantId} onChange={(e) => setEtudiantId(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {etudiants.map((e) => (
            <option key={e.etudiant_id} value={e.etudiant_id}>{e.nom} ({e.matricule})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Enseignant</label>
        <select value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {enseignants.map((e) => (
            <option key={e.enseignant_id} value={e.enseignant_id}>{e.nom} ({e.specialite})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="stage">Stage</option>
          <option value="memoire">Mémoire</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi..." : "Créer l'encadrement"}
      </button>
    </form>
  );
}
