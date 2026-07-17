import { useState } from "react";
import apiClient from "../../../shared/api/apiClient";

const champsVides = {
  raison_sociale: "",
  secteur_activite: "",
  contact_nom: "",
  contact_email: "",
  contact_telephone: "",
};

export default function EntrepriseForm({ entreprise, onSaved, onCancel }) {
  const estEdition = Boolean(entreprise);
  const [champs, setChamps] = useState(
    estEdition
      ? {
          raison_sociale: entreprise.raison_sociale ?? "",
          secteur_activite: entreprise.secteur_activite ?? "",
          contact_nom: entreprise.contact_nom ?? "",
          contact_email: entreprise.contact_email ?? "",
          contact_telephone: entreprise.contact_telephone ?? "",
        }
      : champsVides
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const majChamp = (champ) => (e) =>
    setChamps((prev) => ({ ...prev, [champ]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = estEdition
        ? await apiClient.put(`/entreprises/${entreprise.id}`, champs)
        : await apiClient.post("/entreprises", champs);

      if (!estEdition) setChamps(champsVides);
      onSaved?.(data);
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
      <h2>
        {estEdition ? "Modifier l'entreprise" : "Ajouter une entreprise"}
      </h2>

      <div className="form-group">
        <label>Raison sociale</label>
        <input
          type="text"
          value={champs.raison_sociale}
          onChange={majChamp("raison_sociale")}
          required
        />
      </div>

      <div className="form-group">
        <label>Secteur d'activité</label>
        <input
          type="text"
          value={champs.secteur_activite}
          onChange={majChamp("secteur_activite")}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Contact - nom</label>
          <input
            type="text"
            value={champs.contact_nom}
            onChange={majChamp("contact_nom")}
          />
        </div>
        <div className="form-group">
          <label>Contact - téléphone</label>
          <input
            type="text"
            value={champs.contact_telephone}
            onChange={majChamp("contact_telephone")}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Contact - email</label>
        <input
          type="email"
          value={champs.contact_email}
          onChange={majChamp("contact_email")}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="actions-row">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Envoi..." : estEdition ? "Enregistrer" : "Ajouter l'entreprise"}
        </button>
        {estEdition && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
