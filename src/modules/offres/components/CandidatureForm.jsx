import { useState } from "react";
import { offresStageApi } from "../../../shared/api/offresStageApi";

export default function CandidatureForm({ offre, onClose, onCandidatureEnvoyee }) {
  const [cv, setCv] = useState(null);
  const [lettre, setLettre] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!cv || !lettre) {
      setError("Le CV et la lettre de motivation sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("offre_id", offre.id);
      formData.append("cv", cv);
      formData.append("lettre_motivation", lettre);

      const { data } = await offresStageApi.candidater(offre.id, formData);

      onCandidatureEnvoyee?.(data);
      onClose?.();
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
    <div className="subpanel">
      <form onSubmit={handleSubmit}>
        <p style={{ fontWeight: 500, marginBottom: 12 }}>
          Candidater a : {offre.titre}
        </p>

        <div className="form-group">
          <label>CV (PDF, DOC ou DOCX, 5 Mo max)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCv(e.target.files[0])}
            required
          />
        </div>

        <div className="form-group">
          <label>Lettre de motivation (PDF, DOC ou DOCX, 5 Mo max)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setLettre(e.target.files[0])}
            required
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="actions-row">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer ma candidature"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}