import { useState, useEffect } from "react";
import { encadreurApi } from "../../../shared/api/encadreurApi";
import NotificationBell from "../../../shared/components/NotificationBell";

export default function EncadreurDashboard() {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEtudiants();
  }, []);

  const fetchEtudiants = async () => {
    try {
      const response = await encadreurApi.getMesEtudiants();
      setEtudiants(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord Encadreur</h1>
          <p>Suivi des étudiants que vous encadrez.</p>
        </div>
        <NotificationBell />
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <p className="label">Étudiants encadrés</p>
          <p className="value">{etudiants.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">Mémoires en cours</p>
          <p className="value">
            {etudiants.filter((e) => e.memoires?.some((m) => m.statut === "en_cours")).length}
          </p>
        </div>
        <div className="stat-card">
          <p className="label">Stages en cours</p>
          <p className="value">
            {etudiants.filter((e) => e.stages?.some((s) => s.statut === "en_cours")).length}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Mes étudiants</h2>
        {etudiants.length === 0 ? (
          <p className="empty-state">Aucun étudiant encadré</p>
        ) : (
          etudiants.map((etudiant) => (
            <div key={etudiant.id} className="dossier">
              <div className="dossier-main">
                <div>
                  <p className="dossier-title">{etudiant.user?.name}</p>
                  <p className="dossier-sub">
                    Matricule : {etudiant.matricule} — Filière : {etudiant.filière} — Niveau : {etudiant.niveau}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {etudiant.memoires?.length > 0 && (
                  <span className="badge badge-en_cours">{etudiant.memoires.length} mémoire(s)</span>
                )}
                {etudiant.stages?.length > 0 && (
                  <span className="badge badge-actif">{etudiant.stages.length} stage(s)</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
