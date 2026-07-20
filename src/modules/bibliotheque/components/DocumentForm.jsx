import { useState } from "react";
import { bibliothequeApi } from "../../../shared/api/bibliothequeApi";

export default function DocumentForm({ onDocumentCreated }) {
  const [typeDocument, setTypeDocument] = useState("autre");
  const [titre, setTitre] = useState("");
  const [auteur, setAuteur] = useState("");
  const [annee, setAnnee] = useState("");
  const [mention, setMention] = useState("");
  const [motsCles, setMotsCles] = useState("");
  const [fichier, setFichier] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitre("");
    setAuteur("");
    setAnnee("");
    setMention("");
    setMotsCles("");
    setFichier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("type_document", typeDocument);
      formData.append("titre", titre);
      if (auteur) formData.append("auteur", auteur);
      if (annee) formData.append("annee", annee);
      if (mention) formData.append("mention", mention);
      if (motsCles) formData.append("mots_cles", motsCles);
      formData.append("fichier", fichier);

      const { data } = await bibliothequeApi.archiverDocument(formData);
      resetForm();
      onDocumentCreated?.(data);
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
      <h2>Archiver un document</h2>

      <div className="form-row">
        <div className="form-group">
          <label>Type de document</label>
          <select value={typeDocument} onChange={(e) => setTypeDocument(e.target.value)}>
            <option value="memoire">Mémoire</option>
            <option value="rapport_stage">Rapport de stage</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="form-group">
          <label>Année</label>
          <input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} min="1900" max="2100" />
        </div>
      </div>

      <div className="form-group">
        <label>Titre</label>
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} required />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Auteur</label>
          <input type="text" value={auteur} onChange={(e) => setAuteur(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Mention</label>
          <input type="text" value={mention} onChange={(e) => setMention(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label>Mots-clés</label>
        <input
          type="text"
          placeholder="séparés par des virgules"
          value={motsCles}
          onChange={(e) => setMotsCles(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Fichier (PDF, DOC, DOCX)</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFichier(e.target.files[0])}
          required
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Envoi..." : "Archiver"}
      </button>
    </form>
  );
}
