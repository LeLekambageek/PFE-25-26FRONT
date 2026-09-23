import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";

const AUCUN_ENCADRABLE = { stages: [], memoires: [] };

export default function EncadrementForm({ onEncadrementCreated }) {
  const [etudiants, setEtudiants] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [etudiantId, setEtudiantId] = useState("");
  const [enseignantId, setEnseignantId] = useState("");
  const [type, setType] = useState("stage");
  // Stages et mémoires de l'étudiant choisi, auxquels l'encadrement est rattaché
  const [encadrables, setEncadrables] = useState(AUCUN_ENCADRABLE);
  const [encadrableId, setEncadrableId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get("/annuaire/etudiants").then(({ data }) => setEtudiants(data));
    apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data));
  }, []);

  useEffect(() => {
    if (!etudiantId) return;
    apiClient
      .get(`/annuaire/etudiants/${etudiantId}/encadrables`)
      .then(({ data }) => setEncadrables(data))
      .catch(() => setEncadrables(AUCUN_ENCADRABLE));
  }, [etudiantId]);

  const choisirEtudiant = (id) => {
    setEtudiantId(id);
    setEncadrableId("");
    setEncadrables(AUCUN_ENCADRABLE);
  };

  const options = type === "stage" ? encadrables.stages : encadrables.memoires;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post("/encadrements", {
        etudiant_id: etudiantId,
        enseignant_id: enseignantId,
        type,
        [type === "stage" ? "stage_id" : "memoire_id"]: encadrableId,
      });

      choisirEtudiant("");
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
        <select value={etudiantId} onChange={(e) => choisirEtudiant(e.target.value)} required>
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
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setEncadrableId("");
          }}
        >
          <option value="stage">Stage</option>
          <option value="memoire">Mémoire</option>
        </select>
      </div>

      <div className="form-group">
        <label>{type === "stage" ? "Stage" : "Mémoire"}</label>
        <select
          value={encadrableId}
          onChange={(e) => setEncadrableId(e.target.value)}
          required
          disabled={!etudiantId || options.length === 0}
        >
          <option value="">
            {!etudiantId
              ? "-- Choisir d'abord un étudiant --"
              : options.length === 0
                ? `-- Aucun ${type === "stage" ? "stage" : "mémoire"} pour cet étudiant --`
                : "-- Choisir --"}
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.titre} ({o.statut})</option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi..." : "Créer l'encadrement"}
      </button>
    </form>
  );
}
