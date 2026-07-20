import { useEffect, useState } from "react";
import { offresStageApi } from "../../../shared/api/offresStageApi";
import { useAuth } from "../../../shared/auth/AuthContext";
import OffreForm from "../components/OffreForm";
import CandidatureForm from "../components/CandidatureForm";

export default function OffresStageListPage() {
  const { user } = useAuth();
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidatureOuverteId, setCandidatureOuverteId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const estAdmin = user?.roles?.some((r) => r.name === "administration");
  const estEtudiant = user?.roles?.some((r) => r.name === "etudiant");

  const chargerOffres = () => {
    setLoading(true);
    offresStageApi
      .getOffres()
      .then(({ data }) => setOffres(data.data ?? data))
      .catch(() => setError("Impossible de charger les offres de stage."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerOffres();
  }, []);

  const handleOffreCreated = (nouvelle) => {
    setOffres((prev) => [nouvelle, ...prev]);
  };

  const handleFermerOffre = async (offreId) => {
    try {
      await offresStageApi.fermerOffre(offreId);
      setOffres((prev) =>
        prev.map((o) => (o.id === offreId ? { ...o, statut: "fermee" } : o))
      );
    } catch (err) {
      alert("Fermeture impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleCandidatureEnvoyee = () => {
    setCandidatureOuverteId(null);
    setConfirmation("Votre candidature a bien ete envoyee.");
    setTimeout(() => setConfirmation(null), 4000);
  };

  if (loading) return <div className="loading-state">Chargement des offres...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Offres de stage</h1>
        <p>
          {estAdmin
            ? "Publiez des offres et suivez les candidatures recues."
            : "Consultez les offres ouvertes et candidatez directement."}
        </p>
      </div>

      {estAdmin && (
        <div className="card">
          <OffreForm onOffreCreated={handleOffreCreated} />
        </div>
      )}

      {confirmation && (
        <div className="card" style={{ borderColor: "var(--success)", background: "var(--success-bg)" }}>
          <p className="dossier-meta" style={{ color: "var(--success)" }}>{confirmation}</p>
        </div>
      )}

      {offres.length === 0 && <p className="empty-state">Aucune offre pour le moment.</p>}

      {offres.map((offre) => (
        <div key={offre.id} className={`dossier status-${offre.statut === "ouverte" ? "valide" : "rejete"}`}>
          <div className="dossier-head">
            <p className="dossier-title">{offre.titre}</p>
            <span className={`badge badge-${offre.statut === "ouverte" ? "valide" : "rejete"}`}>
              {offre.statut}
            </span>
          </div>
          <p className="dossier-meta">{offre.entreprise?.raison_sociale}</p>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>{offre.description}</p>

          {offre.competences_requises && (
            <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 10 }}>
              Competences : {offre.competences_requises}
            </p>
          )}

          <div className="actions-row">
            {estEtudiant && offre.statut === "ouverte" && candidatureOuverteId !== offre.id && (
              <button className="btn btn-primary" onClick={() => setCandidatureOuverteId(offre.id)}>
                Candidater
              </button>
            )}
            {estAdmin && offre.statut === "ouverte" && (
              <button className="btn" onClick={() => handleFermerOffre(offre.id)}>
                Fermer l'offre
              </button>
            )}
          </div>

          {candidatureOuverteId === offre.id && (
            <CandidatureForm
              offre={offre}
              onClose={() => setCandidatureOuverteId(null)}
              onCandidatureEnvoyee={handleCandidatureEnvoyee}
            />
          )}
        </div>
      ))}
    </div>
  );
}