import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { administrationApi } from "../../../shared/api/administrationApi";
import apiClient from "../../../shared/api/apiClient";
import NotificationBell from "../../../shared/components/NotificationBell";

export default function AdministrationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats states
  const [apercu, setApercu] = useState(null);
  const [graphiques, setGraphiques] = useState(null);
  const [delais, setDelais] = useState(null);
  const [tauxEncadrement, setTauxEncadrement] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apercuRes, graphRes, delaisRes, tauxRes] = await Promise.all([
        administrationApi.getDashboardApercu().catch(() => ({ data: null })),
        administrationApi.getDashboardGraphiques().catch(() => ({ data: null })),
        administrationApi.getDashboardDelais().catch(() => ({ data: null })),
        administrationApi.getDashboardTauxEncadrement().catch(() => ({ data: [] })),
      ]);

      setApercu(apercuRes.data);
      setGraphiques(graphRes.data);
      setDelais(delaisRes.data);
      setTauxEncadrement(tauxRes.data);
    } catch (err) {
      setError("Certains indicateurs du tableau de bord n'ont pas pu être chargés.");
    } finally {
      setLoading(false);
    }
  };

  const getExportUrl = (type) => {
    return `${apiClient.defaults.baseURL}/dashboard/export/${type}`;
  };

  if (loading) return <div className="loading-state">Chargement des analyses en cours...</div>;

  // Compute total accounts for KPIs
  const totalEtudiants = apercu?.memoires?.total || 0;
  const totalSoutenues = apercu?.soutenances?.terminees || 0;
  const totalPlanifiees = apercu?.soutenances?.planifiees || 0;
  const delaiMoyen = delais?.delai_moyen_jours ? `${Math.round(delais.delai_moyen_jours)} jours` : "Non défini";

  // Visualizing charts calculations helper
  const statsStatut = graphiques?.memoires_par_statut || [];
  const maxStatutVal = statsStatut.length > 0 ? Math.max(...statsStatut.map((s) => s.value)) : 1;

  const statsMentions = graphiques?.mentions_soutenances || [];
  const maxMentionVal = statsMentions.length > 0 ? Math.max(...statsMentions.map((m) => m.value)) : 1;

  return (
    <div className="page">
      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", background: "var(--danger-bg)", color: "var(--danger)", padding: 16 }}>
          {error}
        </div>
      )}

      {/* KPI Counters Row */}
      <div className="stats-row stats-row-4">
        <div className="stat-card">
          <p className="label">Total Mémoires</p>
          <p className="value">{totalEtudiants}</p>
        </div>
        <div className="stat-card">
          <p className="label">Soutenances Planifiées</p>
          <p className="value success">{totalPlanifiees}</p>
        </div>
        <div className="stat-card">
          <p className="label">Soutenances Terminées</p>
          <p className="value success">{totalSoutenues}</p>
        </div>
        <div className="stat-card">
          <p className="label">Délai Moyen Soutenance</p>
          <p className="value warning">{delaiMoyen}</p>
        </div>
      </div>

      {/* Dashboard Charts & Stats */}
      <div className="grid gap-5 lg:grid-cols-2 mb-6">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-title">Répartition des Mémoires par Statut</p>
            </div>
          </div>
          <div className="progress-row">
            {statsStatut.length === 0 ? (
              <p className="empty-state">Aucune statistique disponible.</p>
            ) : (
              statsStatut.map((s) => {
                const percentage = Math.round((s.value / maxStatutVal) * 100);
                return (
                  <div key={s.label} className="progress-item">
                    <div className="progress-label">
                      <span>{s.label.replace(/_/g, " ")}</span>
                      <span>{s.value} mémoire(s)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-title">Mentions des Soutenances Délibérées</p>
            </div>
          </div>
          <div className="progress-row">
            {statsMentions.length === 0 ? (
              <p className="empty-state">Aucun résultat publié pour le moment.</p>
            ) : (
              statsMentions.map((m) => {
                const percentage = Math.round((m.value / maxMentionVal) * 100);
                return (
                  <div key={m.label} className="progress-item">
                    <div className="progress-label">
                      <span>{m.label}</span>
                      <span>{m.value} étudiant(s)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-title">Taux d'Encadrement des Enseignants</p>
          </div>
        </div>
        <div className="table-wrap">
          {tauxEncadrement.length === 0 ? (
            <p className="empty-state">Aucune affectation de mémoire en cours.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enseignant</th>
                  <th className="text-right">Étudiants Encadrés</th>
                </tr>
              </thead>
              <tbody>
                {tauxEncadrement.map((item) => (
                  <tr key={item.encadreur_id || item.encadreur}>
                    <td>{item.encadreur}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>
                      {item.nombre_memoires} / 20
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reports Export Section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2>Exportation des Rapports Académiques</h2>
        <p className="dossier-meta" style={{ marginBottom: 16 }}>
          Téléchargez les rapports complets de l'établissement sous différents formats.
        </p>
        <div className="actions-row">
          <a href={getExportUrl("pdf")} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            Exporter en PDF 📄
          </a>
          <a href={getExportUrl("csv")} className="btn" target="_blank" rel="noopener noreferrer">
            Exporter en CSV 📊
          </a>
          <a href={getExportUrl("excel")} className="btn" target="_blank" rel="noopener noreferrer">
            Exporter en Excel 📈
          </a>
        </div>
      </div>

      {/* Quick Action Center */}
      <div className="card">
        <h2>Centre de Pilotage Académique</h2>
        <div className="actions-row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => navigate("/administration/comptes")}>
            Gérer les Comptes Utilisateurs
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/administration/affectations")}>
            Affecter Stages & Encadreurs
          </button>
          <button className="btn" onClick={() => navigate("/soutenances")}>
            Créneaux & Planification
          </button>
          <button className="btn" onClick={() => navigate("/entreprises")}>
            Gérer les Entreprises
          </button>
        </div>
      </div>
    </div>
  );
}