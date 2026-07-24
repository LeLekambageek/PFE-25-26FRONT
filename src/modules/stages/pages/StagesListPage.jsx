import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import { offresStageApi } from "../../../shared/api/offresStageApi";
import StatusBadge from "../../../shared/components/StatusBadge";
import OffreForm from "../../offres/components/OffreForm";
import CandidatureForm from "../../offres/components/CandidatureForm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  User,
  Building2,
  Calendar,
  BookOpen,
  CheckCircle,
  Plus,
  X,
  MessageSquare,
  FileText,
  Send,
  AlertCircle,
  FolderOpen
} from "lucide-react";

// Realistic shimmer skeleton card for stages
function StageCardSkeleton() {
  return (
    <div className="bg-[#FFFFFF] border border-[#EAEAEF] rounded-2xl p-6 shadow-xl animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3.5 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-100 rounded-xl flex-1 border border-gray-100" />
      </div>
    </div>
  );
}

// Premium Empty State
function StagesEmptyState({ message, actionText, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white/5 border border-white/5 rounded-2xl shadow-xl max-w-md mx-auto"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-[#FF0000]">
        <FolderOpen size={32} />
      </div>
      <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">Aucun élément trouvé</h3>
      <p className="text-sm text-[var(--ink-soft)] mb-6 leading-relaxed">
        {message || "Il n'y a aucun enregistrement correspondant à cette section pour le moment."}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={16} />
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

export default function StagesListPage() {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState("stages"); // stages, offres

  // Active stages list states
  const [stages, setStages] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesError, setStagesError] = useState(null);
  const [openJournalId, setOpenJournalId] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [nouvelleEntree, setNouvelleEntree] = useState("");

  // Stage offers list states
  const [offres, setOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(true);
  const [offresError, setOffresError] = useState(null);
  const [candidatureOuverteId, setCandidatureOuverteId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const estAdmin = user?.roles?.some((r) => r.name === "administration");
  const estEncadreur = user?.roles?.some((r) => r.name === "enseignant_encadreur");
  const estEtudiant = user?.roles?.some((r) => r.name === "etudiant");
  const peutValider = estEncadreur || estAdmin;

  useEffect(() => {
    if (onglet === "stages") {
      chargerStages();
    } else {
      chargerOffres();
    }
  }, [onglet]);

  const chargerStages = () => {
    setStagesLoading(true);
    setStagesError(null);
    apiClient
      .get("/stages")
      .then(({ data }) => setStages(data.data || data))
      .catch(() => setStagesError("Impossible de charger les stages."))
      .finally(() => setStagesLoading(false));
  };

  const chargerOffres = () => {
    setOffresLoading(true);
    setOffresError(null);
    offresStageApi
      .getOffres()
      .then(({ data }) => setOffres(data.data ?? data))
      .catch(() => setOffresError("Impossible de charger les offres de stage."))
      .finally(() => setOffresLoading(false));
  };

  // Stage action handlers
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

  // Offer action handlers
  const handleOffreCreated = (nouvelle) => {
    setOffres((prev) => [nouvelle, ...prev]);
  };

  const handleFermerOffre = async (offreId) => {
    try {
      await offresStageApi.fermerOffre(offreId);
      setOffres((prev) =>
        prev.map((o) => (o.id === offreId ? { ...o, statut: "fermee" } : o))
      );
    } catch (err) {
      alert("Fermeture impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleCandidatureEnvoyee = () => {
    setCandidatureOuverteId(null);
    setConfirmation("Votre candidature a bien été envoyée.");
    setTimeout(() => setConfirmation(null), 4000);
  };

  const titleStages = estAdmin
    ? "Tous les stages"
    : estEncadreur
    ? "Stages de mes étudiants encadrés"
    : "Mes stages";

  const descStages = estAdmin
    ? "Vue d'ensemble de tous les stages de la plateforme."
    : "Suivi de vos stages affectés et de leur journal de bord.";

  // Animation variants
  const gridVariants = {
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
    <div className="space-y-6">
      {/* Navigation tabs for merged Sections */}
      <div className="flex gap-4 border-b border-[#221A28] pb-3">
        <button
          className={`px-5 py-2.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            onglet === "stages"
              ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setOnglet("stages")}
        >
          Suivi des Stages
        </button>
        <button
          className={`px-5 py-2.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
            onglet === "offres"
              ? "bg-[#FF0000] text-white shadow-lg shadow-red-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setOnglet("offres")}
        >
          Offres de Stage
        </button>
      </div>

      {onglet === "stages" ? (
        <div className="space-y-6">
          <div className="flex flex-col text-left">
            <h2 className="text-xl font-bold text-[var(--navy)]">{titleStages}</h2>
            <p className="text-xs text-[var(--ink-soft)] mt-1">{descStages}</p>
          </div>

          {stagesError && (
            <div className="flex items-center gap-2 p-4 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-xl text-red-600 text-xs">
              <AlertCircle size={16} />
              <span>{stagesError}</span>
            </div>
          )}

          {stagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <StageCardSkeleton key={n} />
              ))}
            </div>
          ) : stages.length === 0 ? (
            <StagesEmptyState message="Vous n'avez aucun dossier de stage répertorié pour le moment." />
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8"
            >
              {stages.map((stage) => (
                <motion.div
                  key={stage.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="card p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2.5">
                        <Briefcase size={20} className="text-[#FF0000]" />
                        <h3 className="text-lg font-bold text-[var(--navy)] truncate max-w-[200px] sm:max-w-[300px]" title={stage.titre}>
                          {stage.titre}
                        </h3>
                      </div>
                      <StatusBadge statut={stage.statut} />
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                        <User size={16} className="text-[var(--ink-muted)]" />
                        <span>Étudiant : <strong className="text-[var(--ink)] font-semibold">{stage.etudiant?.user?.name}</strong></span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                        <Building2 size={16} className="text-[var(--ink-muted)]" />
                        <span>Raison sociale : <strong className="text-[var(--ink)] font-semibold">{stage.entreprise?.raison_sociale}</strong></span>
                      </div>
                      {stage.date_debut && (
                        <div className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                          <Calendar size={16} className="text-[var(--ink-muted)]" />
                          <span>Période : <span className="text-[var(--ink-soft)]">{new Date(stage.date_debut).toLocaleDateString()} - {new Date(stage.date_fin).toLocaleDateString()}</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border)]">
                      {peutValider && stage.statut === "en_attente" && (
                        <button
                          className="btn btn-primary w-full text-xs font-semibold py-2.5"
                          onClick={() => handleValider(stage.id)}
                        >
                          <CheckCircle size={14} />
                          Valider le stage
                        </button>
                      )}
                      <button
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          openJournalId === stage.id
                            ? "bg-[#FF0000]/10 border-red-500/20 text-[#FF0000]"
                            : "bg-white/5 border-white/5 text-[var(--ink-soft)] hover:bg-[#FF0000]/5 hover:border-[#FF0000]/20"
                        }`}
                        onClick={() => toggleJournal(stage.id)}
                      >
                        <MessageSquare size={14} />
                        {openJournalId === stage.id ? "Fermer le journal" : "Journal de bord"}
                      </button>
                    </div>

                    <AnimatePresence>
                      {openJournalId === stage.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 space-y-4"
                        >
                          <h4 className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                            <FileText size={13} className="text-[#FF0000]" />
                            Journal de Bord
                          </h4>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nouvelle entrée..."
                              value={nouvelleEntree}
                              onChange={(e) => setNouvelleEntree(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--ink)] placeholder-gray-400 focus:outline-none focus:border-red-500/50 min-height-0 h-9"
                              style={{ minHeight: "36px" }}
                            />
                            <button
                              className="btn btn-primary p-2 h-9 w-9 rounded-lg"
                              style={{ minHeight: "36px" }}
                              onClick={() => handleAjouterEntree(stage.id)}
                            >
                              <Send size={14} />
                            </button>
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                            {journalLoading && (
                              <div className="flex justify-center py-4">
                                <span className="w-5 h-5 border-2 border-red-500/10 border-top-red-500 rounded-full animate-spin" />
                              </div>
                            )}
                            {!journalLoading && journalEntries.length === 0 && (
                              <p className="text-[11px] text-gray-400 text-center py-2">Aucune entrée pour le moment.</p>
                            )}
                            {!journalLoading && journalEntries.length > 0 && (
                              <div className="space-y-2.5">
                                {journalEntries.map((entry) => (
                                  <div key={entry.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 space-y-1">
                                    <p className="text-[11px] text-[var(--ink-soft)] leading-normal">{entry.contenu}</p>
                                    <div className="flex justify-between text-[9px] text-[var(--ink-muted)]">
                                      <span>Auteur : {entry.auteur?.name}</span>
                                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col text-left">
              <h2 className="text-xl font-bold text-[var(--ink)]">Offres de stage</h2>
              <p className="text-xs text-gray-500 mt-1">
                {estAdmin
                  ? "Publiez des offres et suivez les candidatures reçues."
                  : "Consultez les offres ouvertes et candidatez directement."}
              </p>
            </div>
          </div>

          {estAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 shadow-xl"
            >
              <OffreForm onOffreCreated={handleOffreCreated} />
            </motion.div>
          )}

          {confirmation && (
            <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs">
              <CheckCircle size={16} />
              <span>{confirmation}</span>
            </div>
          )}

          {offresError && (
            <div className="flex items-center gap-2 p-4 bg-[#FF0000]/10 border border-[#FF0000]/20 rounded-xl text-red-600 text-xs">
              <AlertCircle size={16} />
              <span>{offresError}</span>
            </div>
          )}

          {offresLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <StageCardSkeleton key={n} />
              ))}
            </div>
          ) : offres.length === 0 ? (
            <StagesEmptyState message="Aucune offre de stage n'est actuellement publiée." />
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8"
            >
               {offres.map((offre) => {
                const estOuverte = offre.statut === "ouverte";
                return (
                  <motion.div
                    key={offre.id}
                    variants={cardVariants}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="card p-8 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2.5">
                          <BookOpen size={20} className="text-[#FF0000]" />
                          <h3 className="text-lg font-bold text-[var(--navy)] truncate max-w-[200px] sm:max-w-[300px]" title={offre.titre}>
                            {offre.titre}
                          </h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          estOuverte
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {offre.statut}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                          <Building2 size={16} className="text-[var(--ink-muted)]" />
                          <span>Raison sociale : <strong className="text-[var(--ink)] font-semibold">{offre.entreprise?.raison_sociale}</strong></span>
                        </div>
                        <p className="text-sm text-[var(--ink-soft)] leading-relaxed line-clamp-3">{offre.description}</p>
                      </div>

                      {offre.competences_requises && (
                        <div className="mb-6 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3.5">
                          <p className="text-xs text-[var(--ink-muted)] font-semibold uppercase tracking-wider mb-1">Compétences requises</p>
                          <p className="text-sm text-[var(--ink-soft)] line-clamp-2">{offre.competences_requises}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border)]">
                        {estEtudiant && estOuverte && candidatureOuverteId !== offre.id && (
                          <button
                            className="btn btn-primary w-full text-xs font-semibold py-2.5"
                            onClick={() => setCandidatureOuverteId(offre.id)}
                          >
                            <Plus size={14} />
                            Candidater
                          </button>
                        )}
                        {estAdmin && estOuverte && (
                          <button
                            className="btn btn-danger w-full text-xs font-semibold py-2.5"
                            onClick={() => handleFermerOffre(offre.id)}
                          >
                            <X size={14} />
                            Fermer l'offre
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {candidatureOuverteId === offre.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="overflow-hidden bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4"
                          >
                            <CandidatureForm
                              offre={offre}
                              onClose={() => setCandidatureOuverteId(null)}
                              onCandidatureEnvoyee={handleCandidatureEnvoyee}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}