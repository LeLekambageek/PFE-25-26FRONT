import { useState, useEffect } from "react";
import { etudiantApi } from "../../../shared/api/etudiantApi";
import { creneauxApi } from "../../../shared/api/creneauxApi";
import StatusBadge from "../../../shared/components/StatusBadge";
import { motion } from "framer-motion";
import {
  Briefcase,
  BookOpen,
  FileText,
  Calendar,
  CheckCircle,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  User,
  Check
} from "lucide-react";

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
        <h1 className="text-2xl font-bold text-[#1C0A10] tracking-tight">Tableau de bord Étudiant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Suivi en temps réel de votre parcours académique, stages et mémoires de fin d'études.
        </p>
      </div>

      {/* Results Section (Mes Résultats) - Premium Overhaul */}
      {resultats && (
        <motion.div 
          variants={cardVariants}
          className="card border border-emerald-500/30 bg-emerald-50/20 rounded-3xl p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-emerald-600" size={28} />
            <h2 className="text-xl font-bold text-emerald-900">🎓 Résultats Officiels de Soutenance</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Note badge */}
            <div className="flex flex-col items-center justify-center bg-white border-2 border-emerald-500/20 p-8 rounded-2xl shadow-sm text-center min-w-[200px]">
              <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Note Finale</span>
              <p className="text-5xl font-extrabold text-emerald-600 my-4">
                {parseFloat(resultats.note_finale).toFixed(2)} <span className="text-lg font-normal text-gray-400">/ 20</span>
              </p>
              <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-700 rounded-full font-bold text-xs uppercase tracking-wide">
                Mention {resultats.mention || "N/A"}
              </span>
            </div>

            {/* Sujet & Notes details */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Mémoire Evalué</p>
                <p className="text-lg font-semibold text-gray-800 mt-1 italic">
                  "{resultats.memoire?.titre}"
                </p>
              </div>

              <div className="border-t border-[#E8D6DA] pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Grille d'évaluation détaillée :</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E8D6DA] text-left text-gray-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Critère</th>
                        <th className="pb-3 font-semibold text-right">Note</th>
                        <th className="pb-3 font-semibold pl-6">Observations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D6DA] divide-dashed">
                      {resultats.notes && resultats.notes.map((n) => (
                        <tr key={n.id} className="hover:bg-white/20 transition-colors">
                          <td className="py-3.5 font-bold text-gray-800">{n.critere}</td>
                          <td className="py-3.5 text-right font-extrabold text-emerald-600">{n.note} / 20</td>
                          <td className="py-3.5 pl-6 text-xs text-gray-500 italic leading-relaxed">
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
        </motion.div>
      )}

      {/* Stats Counters Row */}
      <motion.div 
        variants={cardVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
      >
        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Stage Actif</p>
            <p className="value">{stageActif ? "Oui" : "Non"}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Mémoires Déposés</p>
            <p className="value">{memoires.length}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Candidatures</p>
            <p className="value">{candidatures.length}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <FileText size={24} />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="label">Créneaux Libres</p>
            <p className="value">{creneauxDisponibles.length}</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-2xl text-[#FF0000]">
            <Calendar size={24} />
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start w-full">
        
        {/* Left Column */}
        <div className="space-y-8">
          {/* Stage Actif */}
          {stageActif && (
            <motion.div variants={cardVariants} className="card p-8 shadow-xl">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
                <Briefcase size={22} className="text-[#FF0000]" />
                <h2 className="text-lg font-bold text-[#1C0A10]">Mon Stage Actif</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs uppercase font-bold text-gray-400">Poste ou Sujet</span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{stageActif.titre}</p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-gray-400">Entreprise d'accueil</span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{stageActif.entreprise?.raison_sociale}</p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-gray-400">Début du stage</span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {new Date(stageActif.date_debut).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-gray-400">Fin du stage</span>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {new Date(stageActif.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mes Mémoires */}
          <motion.div variants={cardVariants} className="card p-8 shadow-xl">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
              <BookOpen size={22} className="text-[#FF0000]" />
              <h2 className="text-lg font-bold text-[#1C0A10]">Mes dossiers de mémoires</h2>
            </div>

            {memoires.length === 0 ? (
              <p className="empty-state">Aucun mémoire de stage n'est répertorié pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {memoires.map((memoire) => (
                  <div key={memoire.id} className="dossier flex items-center justify-between p-5 border border-[#E8D6DA] hover:border-red-500/20 transition-all rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-500/5 rounded-xl text-[#FF0000] mt-0.5">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1C0A10] leading-snug">{memoire.titre}</p>
                        {memoire.derniere_version ? (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-[#FF0000] to-[#D50048] h-full" 
                                style={{ width: `${memoire.derniere_version.pourcentage_avancement}%` }} 
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-semibold">
                              {memoire.derniere_version.pourcentage_avancement}% d'avancement
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Aucune version soumise</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge statut={memoire.statut} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Mes Candidatures */}
          <motion.div variants={cardVariants} className="card p-8 shadow-xl">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
              <TrendingUp size={22} className="text-[#FF0000]" />
              <h2 className="text-lg font-bold text-[#1C0A10]">Mes candidatures actives</h2>
            </div>

            {candidatures.length === 0 ? (
              <p className="empty-state">Vous n'avez soumis aucune candidature à une offre de stage.</p>
            ) : (
              <div className="space-y-4">
                {candidatures.map((candidature) => (
                  <div key={candidature.id} className="dossier flex items-center justify-between p-5 border border-[#E8D6DA] hover:border-red-500/20 transition-all rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-500/5 rounded-xl text-[#FF0000] mt-0.5">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1C0A10] leading-snug">{candidature.titre_poste}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Entreprise : {candidature.entreprise?.raison_sociale || "Non spécifiée"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge statut={candidature.statut} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Reservable Defenses slots */}
          {memoires.some((m) => m.statut === "valide_final") && (
            <motion.div variants={cardVariants} className="card p-8 shadow-xl">
              <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E8D6DA]">
                <Calendar size={22} className="text-[#FF0000]" />
                <h2 className="text-lg font-bold text-[#1C0A10]">Créneaux de soutenance disponibles</h2>
              </div>

              {creneauxDisponibles.length === 0 ? (
                <p className="empty-state">Aucun créneau de soutenance n'est proposé par l'administration.</p>
              ) : (
                <div className="space-y-4">
                  {creneauxDisponibles.map((creneau) => (
                    <div key={creneau.id} className="dossier flex items-center justify-between p-5 border border-[#E8D6DA] rounded-xl hover:border-red-500/20 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FF0000]/10 rounded-xl text-[#FF0000] mt-0.5">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1C0A10]">
                            Le {new Date(creneau.date_disponible).toLocaleDateString("fr-FR")} à {creneau.heure_debut}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-medium">Salle assignée : {creneau.salle}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5"
                        onClick={() => handleReserverCreneau(creneau.id)}
                      >
                        Réserver <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
