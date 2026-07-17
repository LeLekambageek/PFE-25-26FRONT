import { useState, useEffect } from "react";
import { administrationApi } from "../../../shared/api/administrationApi";
import NotificationBell from "../../../shared/components/NotificationBell";

export default function AdministrationDashboard() {
  const [stats, setStats] = useState({
    etudiants: 0,
    enseignants: 0,
    entreprises: 0,
    candidaturesEnAttente: 0,
    memoiresValidesFinale: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [etudiantsRes, enseignantsRes, entreprisesRes, candidaturesRes, memoiresRes] = await Promise.all([
        administrationApi.getComptesEtudiants().catch(() => ({ data: { data: [] } })),
        administrationApi.getComptesEnseignants().catch(() => ({ data: { data: [] } })),
        administrationApi.getEntreprises().catch(() => ({ data: { data: [] } })),
        administrationApi.getCandidaturesEnAttente().catch(() => ({ data: { data: [] } })),
        administrationApi.getMemoiresValidesFinale().catch(() => ({ data: { data: [] } })),
      ]);

      setStats({
        etudiants: etudiantsRes.data.data?.length || 0,
        enseignants: enseignantsRes.data.data?.length || 0,
        entreprises: entreprisesRes.data.data?.length || 0,
        candidaturesEnAttente: candidaturesRes.data.data?.length || 0,
        memoiresValidesFinale: memoiresRes.data.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord Administration</h1>
          <p>Vue d'ensemble des comptes, candidatures et soutenances à venir.</p>
        </div>
        <NotificationBell />
      </div>

      <div className="stats-row stats-row-5">
        <div className="stat-card">
          <p className="label">Étudiants</p>
          <p className="value">{stats.etudiants}</p>
        </div>
        <div className="stat-card">
          <p className="label">Enseignants</p>
          <p className="value">{stats.enseignants}</p>
        </div>
        <div className="stat-card">
          <p className="label">Entreprises</p>
          <p className="value">{stats.entreprises}</p>
        </div>
        <div className="stat-card">
          <p className="label">Candidatures en attente</p>
          <p className="value warning">{stats.candidaturesEnAttente}</p>
        </div>
        <div className="stat-card">
          <p className="label">Mémoires à soutenir</p>
          <p className="value success">{stats.memoiresValidesFinale}</p>
        </div>
      </div>

      <div className="card">
        <h2>Actions rapides</h2>
        <div className="actions-row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary">Créer un compte étudiant</button>
          <button className="btn btn-primary">Créer un compte enseignant</button>
          <button className="btn">Planifier une soutenance</button>
          <button className="btn">Affecter un stage</button>
          <button className="btn">Traiter les candidatures</button>
          <button className="btn">Gérer les entreprises</button>
        </div>
      </div>

      {stats.candidaturesEnAttente > 0 && (
        <div className="card" style={{ borderColor: "var(--warning)", background: "var(--warning-bg)" }}>
          <p className="dossier-meta" style={{ color: "var(--warning)" }}>
            {stats.candidaturesEnAttente} candidature(s) en attente de traitement
          </p>
        </div>
      )}

      {stats.memoiresValidesFinale > 0 && (
        <div className="card" style={{ borderColor: "var(--success)", background: "var(--success-bg)" }}>
          <p className="dossier-meta" style={{ color: "var(--success)" }}>
            {stats.memoiresValidesFinale} mémoire(s) prêt(s) pour la soutenance
          </p>
        </div>
      )}
    </div>
  );
}
