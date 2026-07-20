import { useState, useEffect } from "react";
import { encadreurApi } from "../../../shared/api/encadreurApi";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Briefcase,
  GraduationCap,
  UserCheck,
  Search,
  BookMarked,
  MapPin,
  Clock
} from "lucide-react";

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
        <h1 className="text-2xl font-bold text-[#1C0A10] tracking-tight">Tableau de bord Encadreur</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos mémoires assignés, suivez l'avancement et validez les étapes clés de vos étudiants encadrés.
        </p>
      </div>

      {/* Stats row */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Étudiants encadrés</p>
            <p className="value">{etudiants.length}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Mémoires en cours</p>
            <p className="value">
              {etudiants.filter((e) => e.memoires?.some((m) => m.statut === "en_cours")).length}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Stages en cours</p>
            <p className="value">
              {etudiants.filter((e) => e.stages?.some((s) => s.statut === "en_cours")).length}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <Briefcase size={24} />
          </div>
        </div>
      </motion.div>

      {/* Students list */}
      <motion.div variants={cardVariants} className="card p-8 shadow-xl">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
          <GraduationCap size={22} className="text-[#FF0000]" />
          <h2 className="text-lg font-bold text-[#1C0A10]">Mes étudiants encadrés</h2>
        </div>

        {etudiants.length === 0 ? (
          <p className="empty-state">Vous n'avez aucun étudiant affecté sous votre encadrement.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {etudiants.map((etudiant) => (
              <div 
                key={etudiant.id} 
                className="dossier flex flex-col justify-between p-6 border border-[#E8D6DA] hover:border-red-500/20 transition-all rounded-xl gap-4 bg-white shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/5 rounded-xl text-[#FF0000] mt-0.5">
                    <Users size={20} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-base font-bold text-[#1C0A10] truncate">{etudiant.user?.name}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      Matricule : <strong className="text-gray-700">{etudiant.matricule}</strong> — Filière : <strong className="text-gray-700">{etudiant.filière}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Niveau académique : <strong className="text-gray-700">{etudiant.niveau}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#E8D6DA] border-dashed">
                  <span className="text-xs text-gray-400 font-medium">Dossiers actifs :</span>
                  <div className="flex gap-2.5">
                    {etudiant.memoires?.length > 0 && (
                      <span className="badge badge-en_cours flex items-center gap-1">
                        <BookMarked size={12} />
                        {etudiant.memoires.length} mémoire(s)
                      </span>
                    )}
                    {etudiant.stages?.length > 0 && (
                      <span className="badge badge-actif flex items-center gap-1">
                        <Briefcase size={12} />
                        {etudiant.stages.length} stage(s)
                      </span>
                    )}
                    {!etudiant.memoires?.length && !etudiant.stages?.length && (
                      <span className="text-xs text-gray-400 italic">Aucun dossier</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
