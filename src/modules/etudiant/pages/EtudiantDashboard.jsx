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
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stageRes, memoiresRes, candidaturesRes, creneauxRes, resultatsRes] = await Promise.all([
        etudiantApi.getMonStageActif().catch(() => ({ data: null })),
        etudiantApi.getMesMemoires(),
        etudiantApi.getMesCandidatures(),
        creneauxApi.getCreneauxDisponiblesPourMoi().catch(() => ({ data: [] })),
        etudiantApi.getResultatsSoutenance().catch(() => ({ data: null })),
      ]);

      setStageActif(stageRes.data);
      setMemoires(memoiresRes.data);
      setCandidatures(candidaturesRes.data);
      setCreneauxDisponibles(creneauxRes.data);
      setResultats(resultatsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserverCreneau = async (creneauId) => {
    try {
      await etudiantApi.demanderCreneauSoutenance(creneauId);
      alert("Votre demande de réservation a été envoyée avec succès à l'administration.");
      fetchData();
    } catch (err) {
      alert("Impossible de réserver : " + (err.response?.data?.message || "erreur"));
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

      {/* Results Section (Mes Résultats) - Renders only when published */}
      {resultats && (
        <div className="card" style={{ borderColor: "var(--success)", background: "var(--success-bg)", padding: 28, marginBottom: 24 }}>
          <h2>🎓 Mes Résultats de Soutenance</h2>
          <p className="dossier-meta" style={{ marginBottom: 16 }}>
            Félicitations, vos résultats officiels ont été délibérés et publiés par l'administration.
          </p>

          <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ textAlign: "center", background: "var(--surface)", border: "2px solid var(--success)", padding: "16px 28px", borderRadius: 12, minWidth: 160 }}>
              <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: "bold", textTransform: "uppercase" }}>Note Finale</span>
              <p style={{ fontSize: 36, fontWeight: 800, color: "var(--navy)", margin: "4px 0" }}>
                {parseFloat(resultats.note_finale).toFixed(2)} <span style={{ fontSize: 16, fontWeight: 400, color: "var(--ink-soft)" }}>/ 20</span>
              </p>
              <span className="badge badge-valide" style={{ fontSize: 11 }}>Mention : {resultats.mention || "N/A"}</span>
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <p className="dossier-title" style={{ fontSize: 16 }}>Sujet évalué :</p>
              <p style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink)", margin: "4px 0 12px 0" }}>
                "{resultats.memoire?.titre}"
              </p>

              <h4 style={{ fontSize: 13, color: "var(--navy)", marginBottom: 8 }}>Feuille de notes détaillée du Jury :</h4>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "6px 0" }}>Critère d'évaluation</th>
                      <th style={{ padding: "6px 0", textAlign: "right" }}>Note</th>
                      <th style={{ padding: "6px 12px" }}>Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultats.notes && resultats.notes.map((n) => (
                      <tr key={n.id} style={{ borderBottom: "1px dashed var(--border)" }}>
                        <td style={{ padding: "8px 0", fontWeight: "bold" }}>{n.critere}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "var(--success)", fontWeight: "bold" }}>{n.note} / 20</td>
                        <td style={{ padding: "8px 12px", fontStyle: "italic", color: "var(--ink-soft)" }}>
                          {n.commentaire || "(Aucune observation)"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <button
                  className="btn btn-primary"
                  onClick={() => handleReserverCreneau(creneau.id)}
                >
                  Réserver
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
