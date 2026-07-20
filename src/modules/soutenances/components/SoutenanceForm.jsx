import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";

export default function SoutenanceForm({ onSoutenanceCreated }) {
  const [memoires, setMemoires] = useState([]);
  const [memoireId, setMemoireId] = useState("");
  const [dateSoutenance, setDateSoutenance] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [salle, setSalle] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get("/memoires")
      .then(({ data }) => setMemoires(data.data.filter((m) => m.statut === "valide_final")))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post("/soutenances", {
        memoire_id: memoireId,
        date_soutenance: dateSoutenance,
        heure_debut: heureDebut,
        salle,
      });

      setMemoireId("");
      setDateSoutenance("");
      setHeureDebut("");
      setSalle("");

      onSoutenanceCreated?.(data);
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
    <form onSubmit={handleSubmit} className="card">
      <h2>Planifier une soutenance</h2>

      <div className="form-group">
        <label>Mémoire (version finale validée)</label>
        <select value={memoireId} onChange={(e) => setMemoireId(e.target.value)} required>
          <option value="">-- Choisir --</option>
          {memoires.map((m) => (
            <option key={m.id} value={m.id}>{m.titre}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={dateSoutenance} onChange={(e) => setDateSoutenance(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Heure de début</label>
          <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required />
        </div>
      </div>

      <div className="form-group">
        <label>Salle</label>
        <input type="text" value={salle} onChange={(e) => setSalle(e.target.value)} required />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi..." : "Planifier"}
      </button>
    </form>
  );
}
