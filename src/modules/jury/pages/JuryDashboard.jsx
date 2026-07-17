import { useState, useEffect } from "react";
import { juryApi } from "../../../shared/api/juryApi";
import NotificationBell from "../../../shared/components/NotificationBell";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function JuryDashboard() {
  const [soutenances, setSoutenances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoutenances();
  }, []);

  const fetchSoutenances = async () => {
    try {
      const response = await juryApi.getMesSoutenances();
      setSoutenances(response.data);
    } catch (error) {
      console.error("Error fetching defenses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord Jury</h1>
          <p>Soutenances qui vous sont attribuées.</p>
        </div>
        <NotificationBell />
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <p className="label">Soutenances assignées</p>
          <p className="value">{soutenances.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">À noter</p>
          <p className="value warning">
            {soutenances.filter((s) => s.statut === "planifiee").length}
          </p>
        </div>
        <div className="stat-card">
          <p className="label">Terminées</p>
          <p className="value success">
            {soutenances.filter((s) => s.statut === "terminee").length}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Mes soutenances</h2>
        {soutenances.length === 0 ? (
          <p className="empty-state">Aucune soutenance assignée</p>
        ) : (
          soutenances.map((soutenance) => (
            <div key={soutenance.id} className={`dossier dossier-full status-${soutenance.statut}`}>
              <div className="dossier-head">
                <div>
                  <p className="dossier-title">{soutenance.memoire?.titre}</p>
                  <p className="dossier-meta">
                    Étudiant : {soutenance.memoire?.etudiant?.user?.name}
                    <br />
                    {new Date(soutenance.date_soutenance).toLocaleDateString("fr-FR")} à {soutenance.heure_debut} — Salle {soutenance.salle}
                  </p>
                </div>
                <StatusBadge statut={soutenance.statut} />
              </div>

              {soutenance.statut === "planifiee" && (
                <div className="actions-row">
                  <button className="btn">Consulter le mémoire</button>
                  <button className="btn btn-primary">Attribuer une note</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
