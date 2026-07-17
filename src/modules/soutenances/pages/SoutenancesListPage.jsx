import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import SoutenanceForm from "../components/SoutenanceForm";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function SoutenancesListPage() {
  const { user } = useAuth();
  const [soutenances, setSoutenances] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [juryOpenId, setJuryOpenId] = useState(null);
  const [selectedJury, setSelectedJury] = useState("");

  const chargerSoutenances = () => {
    setLoading(true);
    apiClient
      .get("/soutenances")
      .then(({ data }) => setSoutenances(data.data))
      .catch(() => setError("Impossible de charger les soutenances."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerSoutenances();
    apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data)).catch(() => {});
  }, []);

  const handleSoutenanceCreated = (nouvelle) => {
    setSoutenances((prev) => [nouvelle, ...prev]);
  };

  const ouvrirJury = (soutenanceId) => {
    setJuryOpenId(soutenanceId);
    setSelectedJury("");
  };

  const annulerJury = () => {
    setJuryOpenId(null);
    setSelectedJury("");
  };

  const confirmerJury = async (soutenanceId) => {
    if (!selectedJury) return;
    try {
      await apiClient.post(`/soutenances/${soutenanceId}/jury`, {
        enseignant_id: selectedJury,
      });
      alert("Membre du jury ajoute.");
      annulerJury();
    } catch (err) {
      alert("Action impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handlePublierResultats = async (soutenanceId) => {
    try {
      await apiClient.post(`/soutenances/${soutenanceId}/publier-resultats`);
      setSoutenances((prev) =>
        prev.map((s) => (s.id === soutenanceId ? { ...s, statut: "terminee" } : s))
      );
    } catch (err) {
      alert("Publication impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const peutCreerOuGerer = user?.roles?.some((r) => r.name === "responsable_formation");

  if (loading) return <div className="loading-state">Chargement des soutenances...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Soutenances</h1>
        <p>Planification, composition des jurys et publication des résultats.</p>
      </div>

      {peutCreerOuGerer && <SoutenanceForm onSoutenanceCreated={handleSoutenanceCreated} />}

      {soutenances.length === 0 && (
        <p className="empty-state">Aucune soutenance pour le moment.</p>
      )}

      {soutenances.map((soutenance) => (
        <div key={soutenance.id} className={`dossier status-${soutenance.statut}`}>
          <div className="dossier-head">
            <p className="dossier-title">Soutenance #{soutenance.id}</p>
            <StatusBadge statut={soutenance.statut} />
          </div>
          <p className="dossier-meta">
            {soutenance.date_soutenance?.slice(0, 10)} à {soutenance.heure_debut} — Salle {soutenance.salle}
          </p>

          {juryOpenId === soutenance.id ? (
            <div className="inline-edit">
              <select value={selectedJury} onChange={(e) => setSelectedJury(e.target.value)}>
                <option value="">-- Choisir un enseignant --</option>
                {enseignants.map((ens) => (
                  <option key={ens.id} value={ens.id}>{ens.nom}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => confirmerJury(soutenance.id)}>
                Ajouter au jury
              </button>
              <button className="btn btn-ghost" onClick={annulerJury}>
                Fermer
              </button>
            </div>
          ) : (
            peutCreerOuGerer && (
              <div className="actions-row">
                <button className="btn" onClick={() => ouvrirJury(soutenance.id)}>
                  Composer le jury
                </button>
                {soutenance.statut !== "terminee" && (
                  <button className="btn btn-primary" onClick={() => handlePublierResultats(soutenance.id)}>
                    Publier les résultats
                  </button>
                )}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
