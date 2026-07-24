import { useState, useEffect } from "react";
import { juryApi } from "../../../shared/api/juryApi";
import { useAuth } from "../../../shared/auth/AuthContext";
import StatusBadge from "../../../shared/components/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Award,
  BookOpen,
  FileDown,
  ChevronRight,
  TrendingUp,
  Clock,
  User,
  Check,
  CheckCircle,
  X,
  AlertCircle,
  Layers,
  GraduationCap,
  FileEdit,
  Lock,
  ArrowRight
} from "lucide-react";

const CRITERES = [
  { key: "ecrit", label: "Qualité du document écrit", desc: "Clarté, structure, rigueur scientifique et rédaction" },
  { key: "oral", label: "Clarté de la présentation", desc: "Aisance orale, diapositives, respect du temps de parole" },
  { key: "questions", label: "Réponses aux questions", desc: "Maîtrise du sujet, argumentation et esprit critique" },
];

export default function JuryDashboard() {
  const { user } = useAuth();
  const [soutenances, setSoutenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evaluation Workspace State
  const [selectedSoutenance, setSelectedSoutenance] = useState(null);
  const [notes, setNotes] = useState({
    ecrit: { note: "", commentaire: "" },
    oral: { note: "", commentaire: "" },
    questions: { note: "", commentaire: "" },
  });
  const [notesValidees, setNotesValidees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSoutenances();
  }, []);

  const fetchSoutenances = async () => {
    setLoading(true);
    try {
      const response = await juryApi.getMesSoutenances();
      setSoutenances(response.data || []);
    } catch (err) {
      setError("Impossible de charger vos soutenances assignées.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSoutenance = async (s) => {
    setSelectedSoutenance(null);
    setLoading(true);
    try {
      const { data } = await juryApi.getInformationsSoutenance(s.id);
      setSelectedSoutenance(data);

      // Find if notes are already validated by the current logged-in jury user
      const monJuryRow = data.jury?.find((j) => j.user_id === user.id);
      setNotesValidees(monJuryRow?.notes_validees || false);

      // Prepopulate notes with existing entries
      const initNotes = {
        ecrit: { note: "", commentaire: "" },
        oral: { note: "", commentaire: "" },
        questions: { note: "", commentaire: "" },
      };

      if (data.notes && Array.isArray(data.notes)) {
        const mesNotesExistantes = data.notes.filter((n) => n.jury_id === user.id);
        mesNotesExistantes.forEach((n) => {
          const matchingCritere = CRITERES.find((c) => c.label === n.critere);
          if (matchingCritere) {
            initNotes[matchingCritere.key] = {
              note: n.note?.toString() || "",
              commentaire: n.commentaire || "",
            };
          }
        });
      }
      setNotes(initNotes);
    } catch (err) {
      alert("Erreur lors de la récupération des détails de la soutenance.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMemoire = async (soutenanceId) => {
    try {
      const response = await juryApi.telechargerMemoire(soutenanceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `memoire_soutenance_${soutenanceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Erreur lors du téléchargement du mémoire. Vérifiez qu'un fichier a été déposé.");
    }
  };

  const setNoteField = (critereKey, field, val) => {
    setNotes((prev) => ({
      ...prev,
      [critereKey]: {
        ...prev[critereKey],
        [field]: val,
      },
    }));
  };

  const calculerMoyenne = () => {
    const values = Object.values(notes).map((n) => parseFloat(n.note));
    const validValues = values.filter((v) => !isNaN(v) && v >= 0 && v <= 20);
    if (validValues.length === 0) return "-";
    const sum = validValues.reduce((acc, curr) => acc + curr, 0);
    return (sum / validValues.length).toFixed(2);
  };

  const handleSaveNotes = async (verrouiller = false) => {
    // Validate grades range
    for (const c of CRITERES) {
      const score = parseFloat(notes[c.key].note);
      if (isNaN(score) || score < 0 || score > 20) {
        alert(`Veuillez entrer une note valide entre 0 et 20 pour le critère: ${c.label}`);
        return;
      }
    }

    if (verrouiller && !window.confirm("IMPORTANT: La validation est définitive. Une fois validées, les notes ne seront plus modifiables par personne. Confirmer ?")) {
      return;
    }

    setSubmitting(true);
    try {
      // 1. Submit notes
      const notesData = CRITERES.map((c) => ({
        critere: c.label,
        note: parseFloat(notes[c.key].note),
        commentaire: notes[c.key].commentaire,
      }));

      await juryApi.attribuerNote(selectedSoutenance.id, { notes: notesData });

      // 2. Lock notes if requested
      if (verrouiller) {
        await juryApi.validerNote(selectedSoutenance.id);
        setNotesValidees(true);
        alert("Vos notes ont été validées et transmises définitivement.");
      } else {
        alert("Brouillon d'évaluation enregistré avec succès.");
      }

      // Refresh data
      handleSelectSoutenance(selectedSoutenance);
      fetchSoutenances();
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + (err.response?.data?.message || "Action non autorisée."));
    } finally {
      setSubmitting(false);
    }
  };

  const moyennePrint = calculerMoyenne();
  const estSoutenanceTerminee = selectedSoutenance?.statut === "terminee";
  const estLectureSeule = notesValidees || estSoutenanceTerminee;

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
        <h1 className="text-2xl font-bold tracking-tight text-[var(--navy)]">Tableau de bord Jury</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Consultez les mémoires de fin d'études et attribuez vos évaluations pour les soutenances de votre session.
        </p>
      </div>

      {error && (
        <div className="card border border-red-500/30 bg-red-500/10 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className={`grid grid-cols-1 ${selectedSoutenance ? "xl:grid-cols-2" : "grid-cols-1"} gap-8 items-start w-full`}>
        
        {/* Left Column: Assigned Defenses List */}
        <motion.div variants={cardVariants} className="card p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[var(--border)]">
            <Calendar size={22} className="text-[#FF0000]" />
            <h2 className="text-lg font-bold text-[var(--navy)]">Soutenances Assignées</h2>
          </div>

          {loading && !selectedSoutenance && <div className="loading-state">Chargement...</div>}
          
          {!loading && soutenances.length === 0 ? (
            <p className="empty-state">Aucune soutenance ne vous est affectée pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {soutenances.map((s) => {
                const monJuryRow = s.jury?.find((j) => j.user_id === user.id);
                const estNotesValidees = monJuryRow?.notes_validees || false;
                const estActive = selectedSoutenance?.id === s.id;

                return (
                  <div 
                    key={s.id} 
                    className={`dossier flex flex-col justify-between p-6 border border-white/5 hover:border-[#FF0000]/20 transition-all rounded-xl gap-4 cursor-pointer bg-white/5 ${
                      estActive ? "ring-2 ring-[#FF0000] border-transparent" : "shadow-sm"
                    }`}
                    onClick={() => handleSelectSoutenance(s)}
                  >
                    <div className="flex justify-between items-start gap-4 mb-2 pb-2 border-b border-white/5 border-dashed">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={18} className="text-[var(--ink-muted)]" />
                        <span className="text-sm font-bold text-[var(--ink)]">
                          {s.memoire?.etudiant?.user?.name || s.memoire?.etudiant?.name || "Étudiant Inconnu"}
                        </span>
                      </div>
                      <StatusBadge statut={s.statut} />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-[var(--ink-soft)] italic font-semibold leading-relaxed">
                        "{s.memoire?.titre}"
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)] font-medium">
                        <Clock size={14} className="text-[var(--ink-muted)]" />
                        <span>Le {new Date(s.date_soutenance).toLocaleDateString("fr-FR")} à {s.heure_debut}, Salle : {s.salle}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5 border-dashed">
                      {estNotesValidees ? (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Notes Validées
                        </span>
                      ) : s.statut === "terminee" ? (
                        <span className="text-xs text-gray-400 font-bold">Clôturée</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                          <FileEdit size={14} /> Évaluation en cours
                        </span>
                      )}
                      
                      <span className="text-xs text-[#FF0000] font-bold flex items-center gap-1">
                        {estActive ? (
                          <span className="flex items-center gap-1.5"><Clock size={14} /> Consultation active</span>
                        ) : (
                          <span className="flex items-center gap-1">Évaluer <ArrowRight size={14} /></span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right Column: Evaluation Workspace */}
        <AnimatePresence>
          {selectedSoutenance && (
            <motion.div 
              variants={cardVariants}
              className="card p-8 shadow-2xl xl:sticky xl:top-24"
            >
              <div className="flex justify-between items-start gap-4 mb-6 pb-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--navy)]">Workspace d'Évaluation</h2>
                  <p className="text-xs text-[var(--ink-soft)] mt-1">
                    Candidat : <strong className="text-[var(--ink)] font-semibold">{selectedSoutenance.memoire?.etudiant?.name}</strong>
                  </p>
                </div>
                <button 
                  className="p-1 text-[var(--ink-muted)] hover:text-[#FF0000] rounded-lg transition-colors cursor-pointer"
                  onClick={() => setSelectedSoutenance(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Document download box */}
              <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-5 mb-6 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-[var(--ink-muted)]">Mémoire Déposé</span>
                  <p className="text-xs text-[var(--ink)] font-semibold italic">
                    "{selectedSoutenance.memoire?.titre}"
                  </p>
                </div>
                <button 
                  className="btn btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2"
                  onClick={() => handleDownloadMemoire(selectedSoutenance.id)}
                >
                  <FileDown size={14} /> Télécharger le Mémoire PDF
                </button>
              </div>

              {/* Evaluation Form Grid */}
              <div className="space-y-6">
                {CRITERES.map((c) => (
                  <div key={c.key} className="space-y-3 pb-5 border-b border-[var(--border)] last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-[var(--ink)]">{c.label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          className="w-16 text-center border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] rounded-lg px-2 py-1 text-sm font-extrabold focus:border-red-500"
                          value={notes[c.key].note}
                          onChange={(e) => setNoteField(c.key, "note", e.target.value)}
                          disabled={estLectureSeule}
                          required
                        />
                        <span className="text-xs text-[var(--ink-muted)] font-semibold">/ 20</span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] leading-normal">{c.desc}</p>
                    <input
                      type="text"
                      placeholder="Commentaires ou points forts/faibles..."
                      className="w-full text-xs"
                      value={notes[c.key].commentaire}
                      onChange={(e) => setNoteField(c.key, "commentaire", e.target.value)}
                      disabled={estLectureSeule}
                    />
                  </div>
                ))}
              </div>

              {/* Real-time calculated general average */}
              <div 
                className={`mt-6 p-6 rounded-2xl border text-center space-y-1.5 ${
                  notesValidees 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : estSoutenanceTerminee 
                    ? "bg-white/5 border-white/10 text-[var(--ink)]" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <span className="text-xs uppercase font-bold tracking-wider">Moyenne Générale Estimée</span>
                <div className="text-4xl font-extrabold my-2">
                  {moyennePrint} <span className="text-lg font-normal text-[var(--ink-muted)]">/ 20</span>
                </div>
                
                {notesValidees ? (
                  <p className="text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-400">
                    <CheckCircle size={14} /> Notes validées définitivement et transmises à l'administration.
                  </p>
                ) : estSoutenanceTerminee ? (
                  <p className="text-xs font-bold flex items-center justify-center gap-1.5 text-slate-300">
                    <Lock size={14} /> Session de soutenance clôturée (en lecture seule).
                  </p>
                ) : (
                  <p className="text-xs font-medium">Brouillon d'évaluation en cours. Enregistrez ou verrouillez ci-dessous.</p>
                )}
              </div>

              {/* Submissions buttons */}
              {!estLectureSeule && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button 
                    className="btn px-4 py-3 text-xs font-semibold" 
                    onClick={() => handleSaveNotes(false)}
                    disabled={submitting}
                  >
                    Enregistrer Brouillon
                  </button>
                  <button 
                    className="btn btn-primary px-4 py-3 text-xs font-semibold" 
                    onClick={() => handleSaveNotes(true)}
                    disabled={submitting}
                  >
                    Valider Définitivement
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
