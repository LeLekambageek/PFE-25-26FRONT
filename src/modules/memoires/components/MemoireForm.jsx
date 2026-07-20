import { useState, useEffect } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";

export default function MemoireForm({ onMemoireCreated }) {
  const { user } = useAuth();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [etudiants, setEtudiants] = useState([]);
  const [selectedEtudiantId, setSelectedEtudiantId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const estEncadreur = user?.roles?.some((r) => r.name === "enseignant_encadreur");

  useEffect(() => {
    if (estEncadreur) {
      apiClient
        .get("/mes-etudiants-encadres")
        .then(({ data }) => setEtudiants(data || []))
        .catch(() => setError("Impossible de charger vos étudiants encadrés."));
    }
  }, [estEncadreur]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const etudiantId = estEncadreur ? selectedEtudiantId : user?.id;

    if (!etudiantId) {
      setError("Veuillez sélectionner un étudiant.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.post("/memoires", {
        titre,
        description,
        etudiant_id: parseInt(etudiantId, 10),
      });

      setTitre("");
      setDescription("");
      setSelectedEtudiantId("");

      onMemoireCreated?.(data);
      alert(estEncadreur ? "Sujet de mémoire directement affecté à l'étudiant !" : "Proposition de sujet envoyée avec succès.");
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
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
      <h2>{estEncadreur ? "Attribuer un sujet de mémoire (Direct)" : "Proposer un sujet de mémoire"}</h2>
      <p className="dossier-meta" style={{ marginBottom: 16 }}>
        {estEncadreur 
          ? "Attribuez un sujet de mémoire directement à l'un de vos étudiants encadrés. Le sujet sera validé d'office."
          : "Proposez un sujet de mémoire pour validation par votre encadrant."}
      </p>

      {estEncadreur && (
        <div className="form-group">
          <label>Étudiant encadré</label>
          <select 
            value={selectedEtudiantId} 
            onChange={(e) => setSelectedEtudiantId(e.target.value)} 
            required
          >
            <option value="">-- Sélectionner un étudiant --</option>
            {etudiants.map((et) => {
              // Extract user details
              const name = et.user?.name || et.name;
              const uid = et.user?.id || et.user_id || et.id;
              return (
                <option key={et.id} value={uid}>
                  {name} (Matricule: {et.matricule})
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Titre du sujet</label>
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required placeholder="Ex: Étude et modélisation de..." />
      </div>

      <div className="form-group">
        <label>Description du sujet (Optionnel)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Détails, objectifs et technologies..." />
      </div>

      {error && <p className="error-text" style={{ marginBottom: 15 }}>{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Enregistrement..." : estEncadreur ? "Affecter le sujet" : "Proposer le sujet"}
      </button>
    </form>
  );
}
