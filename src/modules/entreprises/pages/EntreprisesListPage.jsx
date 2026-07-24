import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import EntrepriseForm from "../components/EntrepriseForm";

export default function EntreprisesListPage() {
  const { hasRole } = useAuth();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOuvert, setFormOuvert] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [suppressionId, setSuppressionId] = useState(null);

  const chargerEntreprises = () => {
    setLoading(true);
    apiClient
      .get("/entreprises")
      .then(({ data }) => setEntreprises(data))
      .catch(() => setError("Impossible de charger les entreprises."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerEntreprises();
  }, []);

  const handleCreee = (nouvelle) => {
    setEntreprises((prev) =>
      [...prev, { ...nouvelle, stages_count: 0 }].sort((a, b) =>
        a.raison_sociale.localeCompare(b.raison_sociale)
      )
    );
    setFormOuvert(false);
  };

  const handleModifiee = (mise_a_jour) => {
    setEntreprises((prev) =>
      prev.map((e) => (e.id === mise_a_jour.id ? { ...e, ...mise_a_jour } : e))
    );
    setEditingId(null);
  };

  const handleSupprimer = async (id) => {
    try {
      await apiClient.delete(`/entreprises/${id}`);
      setEntreprises((prev) => prev.filter((e) => e.id !== id));
      setSuppressionId(null);
    } catch (err) {
      alert("Suppression impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const peutAjouter = hasRole("administration");
  const peutModifier = peutAjouter;
  const peutSupprimer = peutAjouter;

  if (loading) return <p>Chargement des entreprises...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Entreprises partenaires</h1>
        <p>Répertoire des entreprises accueillant les étudiants en stage.</p>
      </div>

      {peutAjouter && !formOuvert && (
        <div className="actions-row page-actions">
          <button className="btn btn-primary" onClick={() => setFormOuvert(true)}>
            Ajouter une entreprise
          </button>
        </div>
      )}

      {formOuvert && (
        <EntrepriseForm
          onSaved={handleCreee}
          onCancel={() => setFormOuvert(false)}
        />
      )}

      {entreprises.length === 0 && (
        <p className="empty-state">Aucune entreprise partenaire pour le moment.</p>
      )}

      {entreprises.map((entreprise) =>
        editingId === entreprise.id ? (
          <EntrepriseForm
            key={entreprise.id}
            entreprise={entreprise}
            onSaved={handleModifiee}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={entreprise.id} className="dossier">
            <p className="dossier-title">{entreprise.raison_sociale}</p>
            <p className="dossier-meta">
              {entreprise.secteur_activite || "Secteur non renseigné"}
              {", Contact : "}
              {entreprise.contact_nom || "Aucun contact"}
              {entreprise.contact_email ? ` (${entreprise.contact_email})` : ""}
              {entreprise.contact_telephone ? `, Tél : ${entreprise.contact_telephone}` : ""}
            </p>

            <span className="badge badge-en_cours">
              {entreprise.stages_count ?? 0} stage{(entreprise.stages_count ?? 0) > 1 ? "s" : ""}
            </span>

            {(peutModifier || peutSupprimer) && (
              <div className="actions-row">
                {peutModifier && (
                  <button className="btn" onClick={() => setEditingId(entreprise.id)}>
                    Modifier
                  </button>
                )}
                {peutSupprimer && suppressionId !== entreprise.id && (
                  <button className="btn btn-danger" onClick={() => setSuppressionId(entreprise.id)}>
                    Supprimer
                  </button>
                )}
                {peutSupprimer && suppressionId === entreprise.id && (
                  <>
                    <span className="dossier-meta">Confirmer la suppression ?</span>
                    <button className="btn btn-danger" onClick={() => handleSupprimer(entreprise.id)}>
                      Confirmer
                    </button>
                    <button className="btn btn-ghost" onClick={() => setSuppressionId(null)}>
                      Annuler
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
