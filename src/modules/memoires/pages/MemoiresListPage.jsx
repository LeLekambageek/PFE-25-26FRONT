import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import MemoireForm from "../components/MemoireForm";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function MemoiresListPage() {
  const { user } = useAuth();
  const [memoires, setMemoires] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");

  const chargerMemoires = () => {
    setLoading(true);
    apiClient
      .get("/memoires")
      .then(({ data }) => setMemoires(data.data))
      .catch(() => setError("Impossible de charger les memoires."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerMemoires();
    apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data)).catch(() => {});
  }, []);

  const handleMemoireCreated = (nouveau) => {
    setMemoires((prev) => [nouveau, ...prev]);
  };

  const handleValider = async (memoireId) => {
    try {
      await apiClient.post(`/memoires/${memoireId}/valider`);
      setMemoires((prev) =>
        prev.map((m) => (m.id === memoireId ? { ...m, statut: "valide" } : m))
      );
    } catch (err) {
      alert("Validation impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleRejeter = async (memoireId) => {
    const commentaire = prompt("Motif du rejet :");
    if (!commentaire) return;
    try {
      await apiClient.post(`/memoires/${memoireId}/rejeter`, {
        commentaire_validation: commentaire,
      });
      setMemoires((prev) =>
        prev.map((m) => (m.id === memoireId ? { ...m, statut: "rejete" } : m))
      );
    } catch (err) {
      alert("Rejet impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const ouvrirAffectation = (memoireId) => {
    setEditingId(memoireId);
    setSelectedEnseignant("");
  };

  const annulerAffectation = () => {
    setEditingId(null);
    setSelectedEnseignant("");
  };

  const confirmerAffectation = async (memoireId) => {
    if (!selectedEnseignant) return;
    try {
      const { data } = await apiClient.post(`/memoires/${memoireId}/affecter-encadreur`, {
        encadreur_id: selectedEnseignant,
      });
      setMemoires((prev) => prev.map((m) => (m.id === memoireId ? data : m)));
      annulerAffectation();
    } catch (err) {
      alert("Affectation impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const peutCreer = user?.roles?.some((r) => r.name === "etudiant");
  const peutValiderOuAffecter = user?.roles?.some((r) => r.name === "responsable_formation");

  if (loading) return <div className="loading-state">Chargement des memoires...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Mémoires</h1>
        <p>Sujets de mémoire, validation et affectation d'un encadreur.</p>
      </div>

      {peutCreer && <MemoireForm onMemoireCreated={handleMemoireCreated} />}

      {memoires.length === 0 && <p className="empty-state">Aucun mémoire pour le moment.</p>}

      {memoires.map((memoire) => (
        <div key={memoire.id} className={`dossier dossier-full status-${memoire.statut}`}>
          <div className="dossier-head">
            <p className="dossier-title">{memoire.titre}</p>
            <StatusBadge statut={memoire.statut} />
          </div>

          {editingId === memoire.id ? (
            <div className="inline-edit">
              <select value={selectedEnseignant} onChange={(e) => setSelectedEnseignant(e.target.value)}>
                <option value="">-- Choisir un encadreur --</option>
                {enseignants.map((ens) => (
                  <option key={ens.id} value={ens.id}>
                    {ens.nom} ({ens.specialite})
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => confirmerAffectation(memoire.id)}>Confirmer</button>
              <button className="btn btn-ghost" onClick={annulerAffectation}>Annuler</button>
            </div>
          ) : (
            peutValiderOuAffecter && (
              <div className="actions-row">
                {memoire.statut === "propose" && (
                  <>
                    <button className="btn btn-primary" onClick={() => handleValider(memoire.id)}>Valider</button>
                    <button className="btn btn-danger" onClick={() => handleRejeter(memoire.id)}>Rejeter</button>
                  </>
                )}
                {memoire.statut === "valide" && (
                  <button className="btn" onClick={() => ouvrirAffectation(memoire.id)}>Affecter un encadreur</button>
                )}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
