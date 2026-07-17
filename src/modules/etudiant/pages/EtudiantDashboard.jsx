import { useState, useEffect } from "react";
import { etudiantApi } from "../../../shared/api/etudiantApi";
import { creneauxApi } from "../../../shared/api/creneauxApi";
import NotificationBell from "../../../shared/components/NotificationBell";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function EtudiantDashboard() {
  const [stageActif, setStageActif] = useState(null);
  const [memoires, setMemoires] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [creneauxDisponibles, setCreneauxDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stageRes, memoiresRes, candidaturesRes, creneauxRes] = await Promise.all([
        etudiantApi.getMonStageActif().catch(() => ({ data: null })),
        etudiantApi.getMesMemoires(),
        etudiantApi.getMesCandidatures(),
        creneauxApi.getCreneauxDisponiblesPourMoi().catch(() => ({ data: [] })),
      ]);

      setStageActif(stageRes.data);
      setMemoires(memoiresRes.data);
      setCandidatures(candidaturesRes.data);
      setCreneauxDisponibles(creneauxRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord Étudiant</h1>
          <p>Vue d'ensemble de votre stage, vos mémoires et vos candidatures.</p>
        </div>
        <NotificationBell />
      </div>

      <div className="stats-row stats-row-4">
        <div className="stat-card">
          <p className="label">Stage actif</p>
          <p className="value">{stageActif ? "Oui" : "Non"}</p>
        </div>
        <div className="stat-card">
          <p className="label">Mémoires</p>
          <p className="value">{memoires.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">Candidatures</p>
          <p className="value">{candidatures.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">Créneaux disponibles</p>
          <p className="value">{creneauxDisponibles.length}</p>
        </div>
      </div>

      {stageActif && (
        <div className="card">
          <h2>Mon stage actif</h2>
          <div className="form-row" style={{ flexWrap: "wrap", marginTop: 16 }}>
            <div className="form-group">
              <label>Titre</label>
              <p className="dossier-title">{stageActif.titre}</p>
            </div>
            <div className="form-group">
              <label>Entreprise</label>
              <p className="dossier-title">{stageActif.entreprise?.raison_sociale}</p>
            </div>
            <div className="form-group">
              <label>Date de début</label>
              <p className="dossier-title">{new Date(stageActif.date_debut).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="form-group">
              <label>Date de fin</label>
              <p className="dossier-title">{new Date(stageActif.date_fin).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Mes mémoires</h2>
        {memoires.length === 0 ? (
          <p className="empty-state">Aucun mémoire</p>
        ) : (
          memoires.map((memoire) => (
            <div key={memoire.id} className="dossier">
              <div className="dossier-main">
                <div>
                  <p className="dossier-title">{memoire.titre}</p>
                  {memoire.derniere_version && (
                    <p className="dossier-sub">
                      Avancement : {memoire.derniere_version.pourcentage_avancement}%
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge statut={memoire.statut} />
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Mes candidatures</h2>
        {candidatures.length === 0 ? (
          <p className="empty-state">Aucune candidature</p>
        ) : (
          candidatures.map((candidature) => (
            <div key={candidature.id} className="dossier">
              <div className="dossier-main">
                <div>
                  <p className="dossier-title">{candidature.titre_poste}</p>
                  <p className="dossier-sub">
                    Entreprise : {candidature.entreprise?.raison_sociale || "Non spécifiée"}
                  </p>
                </div>
              </div>
              <StatusBadge statut={candidature.statut} />
            </div>
          ))
        )}
      </div>

      {memoires.some((m) => m.statut === "valide_final") && (
        <div className="card">
          <h2>Créneaux de soutenance disponibles</h2>
          {creneauxDisponibles.length === 0 ? (
            <p className="empty-state">Aucun créneau disponible</p>
          ) : (
            creneauxDisponibles.map((creneau) => (
              <div key={creneau.id} className="dossier">
                <div className="dossier-main">
                  <div>
                    <p className="dossier-title">
                      {new Date(creneau.date_disponible).toLocaleDateString("fr-FR")} à {creneau.heure_debut}
                    </p>
                    <p className="dossier-sub">Salle : {creneau.salle}</p>
                  </div>
                </div>
                <button className="btn btn-primary">Réserver</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
