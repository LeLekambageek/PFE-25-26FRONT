import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { administrationApi } from "../../../shared/api/administrationApi";
import apiClient from "../../../shared/api/apiClient";
import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Award,
  Clock,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Settings,
  Download,
  AlertCircle,
  Users,
  ChevronRight
} from "lucide-react";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 w-full"
    >
      {/* Title block */}
      <div className="flex flex-col text-left">
        <h1 className="text-2xl font-bold text-[#1C0A10] tracking-tight">Tableau de bord Administration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue d'ensemble de l'établissement, répartition des soutenances, taux d'encadrement et indicateurs de performance.
        </p>
      </div>

      {error && (
        <div className="card border border-red-500/30 bg-red-500/10 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Counters Row */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Total Mémoires</p>
            <p className="value">{totalEtudiants}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <Layers size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Soutenances Planifiées</p>
            <p className="value text-emerald-600">{totalPlanifiees}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Soutenances Terminées</p>
            <p className="value text-emerald-600">{totalSoutenues}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
            <Award size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Délai Moyen</p>
            <p className="value text-amber-600">{delaiMoyen}</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
            <Clock size={24} />
          </div>
        </div>
      </motion.div>

      {/* Dashboard Charts & Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        {/* Statut mémoires chart */}
        <motion.div variants={cardVariants} className="card p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
            <BarChart3 size={20} className="text-[#FF0000]" />
            <h2 className="text-lg font-bold text-[#1C0A10]">Répartition des Mémoires par Statut</h2>
          </div>

          <div className="space-y-5">
            {statsStatut.length === 0 ? (
              <p className="empty-state">Aucune statistique disponible.</p>
            ) : (
              statsStatut.map((s) => {
                const percentage = Math.round((s.value / maxStatutVal) * 100);
                return (
                  <div key={s.label} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                      <span className="capitalize">{s.label.replace(/_/g, " ")}</span>
                      <span>{s.value} mémoire(s)</span>
                    </div>
                    <div className="w-full bg-[#F4E7EB] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#FF0000] to-[#D50048] h-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Mentions chart */}
        <motion.div variants={cardVariants} className="card p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
            <TrendingUp size={20} className="text-[#FF0000]" />
            <h2 className="text-lg font-bold text-[#1C0A10]">Mentions des Soutenances Délibérées</h2>
          </div>

          <div className="space-y-5">
            {statsMentions.length === 0 ? (
              <p className="empty-state">Aucun résultat publié pour le moment.</p>
            ) : (
              statsMentions.map((m) => {
                const percentage = Math.round((m.value / maxMentionVal) * 100);
                return (
                  <div key={m.label} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                      <span>{m.label}</span>
                      <span>{m.value} étudiant(s)</span>
                    </div>
                    <div className="w-full bg-[#F4E7EB] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Teachers ratio */}
      <motion.div variants={cardVariants} className="card p-8 shadow-xl w-full">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
          <Users size={20} className="text-[#FF0000]" />
          <h2 className="text-lg font-bold text-[#1C0A10]">Taux d'Encadrement des Enseignants</h2>
        </div>

        {tauxEncadrement.length === 0 ? (
          <p className="empty-state">Aucune affectation de mémoire en cours.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E8D6DA] text-left text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Enseignant</th>
                  <th className="pb-3 font-semibold text-right">Étudiants Encadrés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D6DA]">
                {tauxEncadrement.map((item) => (
                  <tr key={item.encadreur_id || item.encadreur} className="hover:bg-white/40 transition-colors">
                    <td className="py-4 font-bold text-gray-800">{item.encadreur}</td>
                    <td className="py-4 text-right font-extrabold text-[#1C0A10]">{item.nombre_memoires} / 20</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Reports Export Section */}
      <motion.div variants={cardVariants} className="card p-8 shadow-xl w-full">
        <div className="flex items-center gap-2.5 mb-4">
          <FileSpreadsheet size={22} className="text-[#FF0000]" />
          <h2 className="text-lg font-bold text-[#1C0A10]">Exportation des Rapports Académiques</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Téléchargez les rapports complets d'évaluation, les statistiques de soutenances et l'annuaire des stages de l'établissement.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href={getExportUrl("pdf")} className="btn btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2" target="_blank" rel="noopener noreferrer">
            <Download size={16} /> Exporter en PDF
          </a>
          <a href={getExportUrl("csv")} className="btn px-6 py-3 text-sm font-semibold flex items-center gap-2" target="_blank" rel="noopener noreferrer">
            <Download size={16} /> Exporter en CSV
          </a>
          <a href={getExportUrl("excel")} className="btn px-6 py-3 text-sm font-semibold flex items-center gap-2" target="_blank" rel="noopener noreferrer">
            <Download size={16} /> Exporter en Excel
          </a>
        </div>
      </motion.div>

      {/* Quick Action Center */}
      <motion.div variants={cardVariants} className="card p-8 shadow-xl w-full">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
          <Settings size={22} className="text-[#FF0000]" />
          <h2 className="text-lg font-bold text-[#1C0A10]">Centre de Pilotage Académique</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn btn-primary py-3.5 text-xs font-semibold flex items-center justify-between" onClick={() => navigate("/administration/comptes")}>
            Gérer les Comptes Utilisateurs <ChevronRight size={14} />
          </button>
          <button className="btn btn-primary py-3.5 text-xs font-semibold flex items-center justify-between" onClick={() => navigate("/administration/affectations")}>
            Affecter Stages & Encadreurs <ChevronRight size={14} />
          </button>
          <button className="btn py-3.5 text-xs font-semibold flex items-center justify-between" onClick={() => navigate("/soutenances")}>
            Créneaux & Planification <ChevronRight size={14} />
          </button>
          <button className="btn py-3.5 text-xs font-semibold flex items-center justify-between" onClick={() => navigate("/entreprises")}>
            Gérer les Entreprises <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}