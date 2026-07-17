import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import StageForm from "../components/StageForm";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function StagesListPage() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openJournalId, setOpenJournalId] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [nouvelleEntree, setNouvelleEntree] = useState("");

  const chargerStages = () => {
    setLoading(true);
    apiClient
      .get("/stages")
      .then(({ data }) => setStages(data.data))
      .catch(() => setError("Impossible de charger les stages."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerStages();
  }, []);

  const handleValider = async (stageId) => {
    try {
      await apiClient.post(`/stages/${stageId}/valider`);
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, statut: "valide" } : s))
      );
    } catch (err) {
      alert("Validation impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleStageCreated = (nouveauStage) => {
    setStages((prev) => [nouveauStage, ...prev]);
  };

  const toggleJournal = async (stageId) => {
    if (openJournalId === stageId) {
      setOpenJournalId(null);
      return;
    }
    setOpenJournalId(stageId);
    setJournalLoading(true);
    try {
      const { data } = await apiClient.get(`/stages/${stageId}/journal`);
      setJournalEntries(data);
    } catch {
      setJournalEntries([]);
    } finally {
      setJournalLoading(false);
    }
  };

  const handleAjouterEntree = async (stageId) => {
    if (!nouvelleEntree.trim()) return;
    try {
      const { data } = await apiClient.post(`/stages/${stageId}/journal`, {
        contenu: nouvelleEntree,
      });
      setJournalEntries((prev) => [data, ...prev]);
      setNouvelleEntree("");
    } catch (err) {
      alert("Ajout impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const peutValider = user?.roles?.some(
    (r) => r.name === "enseignant_encadreur" || r.name === "responsable_formation"
  );
  const estEtudiant = user?.roles?.some((r) => r.name === "etudiant");

  if (loading) return <div className="loading-state">Chargement des stages...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Mes stages</h1>
        <p>Suivi de vos stages affectés et de leur journal de bord.</p>
      </div>

      {estEtudiant && <StageForm onStageCreated={handleStageCreated} />}

      {stages.length === 0 && <p className="empty-state">Aucun stage pour le moment.</p>}

      {stages.map((stage) => (
        <div key={stage.id} className={`dossier dossier-full status-${stage.statut}`}>
          <div className="dossier-head">
            <p className="dossier-title">{stage.titre}</p>
            <StatusBadge statut={stage.statut} />
          </div>

          <div className="actions-row">
            {peutValider && stage.statut === "en_attente" && (
              <button className="btn btn-primary" onClick={() => handleValider(stage.id)}>
                Valider
              </button>
            )}
            <button className="btn" onClick={() => toggleJournal(stage.id)}>
              {openJournalId === stage.id ? "Fermer le journal" : "Voir le journal de bord"}
            </button>
          </div>

          {openJournalId === stage.id && (
            <div className="subpanel">
              <div className="subpanel-form">
                <input
                  type="text"
                  placeholder="Nouvelle entrée..."
                  value={nouvelleEntree}
                  onChange={(e) => setNouvelleEntree(e.target.value)}
                />
                <button className="btn btn-primary" onClick={() => handleAjouterEntree(stage.id)}>
                  Ajouter
                </button>
              </div>

              {journalLoading && <p className="loading-state empty-state--compact">Chargement du journal...</p>}
              {!journalLoading && journalEntries.length === 0 && (
                <p className="empty-state empty-state--compact">Aucune entrée pour le moment.</p>
              )}
              {!journalLoading && journalEntries.length > 0 && (
                <ul className="entry-list">
                  {journalEntries.map((entry) => (
                    <li key={entry.id} className="entry-row">
                      <div>
                        <p className="entry-text">{entry.contenu}</p>
                        <span className="entry-meta">
                          {entry.auteur?.name} — {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
