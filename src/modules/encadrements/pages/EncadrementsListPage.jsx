import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import EncadrementForm from "../components/EncadrementForm";
import StatusBadge from "../../../shared/components/StatusBadge";
import {
  Eye,
  User,
  GraduationCap,
  Briefcase,
  BookOpen,
  Plus,
  Calendar,
  X,
  Clock,
  CheckCircle,
  Building,
  FileText,
  Send,
  MessageSquare,
  AlertCircle
} from "lucide-react";

export default function EncadrementsListPage() {
  const { user } = useAuth();
  const [encadrements, setEncadrements] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");

  // Details modal state
  const [selectedEncadrement, setSelectedEncadrement] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [newEntryText, setNewEntryText] = useState("");
  const [submittingEntry, setSubmittingEntry] = useState(false);

  // RDV state
  const [showRdvForm, setShowRdvForm] = useState(false);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvSujet, setRdvSujet] = useState("");

  const chargerEncadrements = () => {
    setLoading(true);
    apiClient
      .get("/encadrements")
      .then(({ data }) => setEncadrements(data.data))
      .catch(() => setError("Impossible de charger les encadrements."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerEncadrements();
    apiClient
      .get("/annuaire/enseignants")
      .then(({ data }) => setEnseignants(data))
      .catch(() => {});
  }, []);

  const chargerEntreesModal = async (encId) => {
    setEntriesLoading(true);
    try {
      const res = await apiClient.get(`/encadrements/${encId}/entree`);
      setEntries(res.data || []);
    } catch (err) {
      console.error("Erreur de chargement du journal :", err);
    } finally {
      setEntriesLoading(false);
    }
  };

  const handleOuvrirDetails = (enc) => {
    setSelectedEncadrement(enc);
    chargerEntreesModal(enc.id);
  };

  const handleFermerDetails = () => {
    setSelectedEncadrement(null);
    setEntries([]);
    setNewEntryText("");
    setShowRdvForm(false);
  };

  const handleEncadrementCreated = (nouvel) => {
    setEncadrements((prev) => [nouvel, ...prev]);
  };

  const handleSoumettreEntreeModal = async (e) => {
    e.preventDefault();
    if (!newEntryText.trim() || !selectedEncadrement) return;

    setSubmittingEntry(true);
    try {
      await apiClient.post(`/encadrements/${selectedEncadrement.id}/entree`, {
        contenu: newEntryText,
      });
      setNewEntryText("");
      chargerEntreesModal(selectedEncadrement.id);
    } catch (err) {
      alert("Erreur lors de l'ajout : " + (err.response?.data?.message || "Erreur inconnue"));
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handlePlanifierRdvModal = async (e) => {
    e.preventDefault();
    if (!rdvDate || !selectedEncadrement) return;

    try {
      await apiClient.post(`/encadrements/${selectedEncadrement.id}/rendez-vous`, {
        date_prevue: rdvDate,
        sujet: rdvSujet || null,
      });
      alert("Rendez-vous planifié avec succès.");
      setRdvDate("");
      setRdvSujet("");
      setShowRdvForm(false);
      chargerEntreesModal(selectedEncadrement.id);
    } catch (err) {
      alert("Impossible de planifier le rendez-vous : " + (err.response?.data?.message || "Erreur"));
    }
  };

  const ouvrirEdition = (enc) => {
    setEditingId(enc.id);
    setSelectedEnseignant(enc.enseignant_id ?? "");
  };

  const annulerEdition = () => {
    setEditingId(null);
    setSelectedEnseignant("");
  };

  const confirmerModification = async (encadrementId) => {
    if (!selectedEnseignant) return;

    try {
      const { data } = await apiClient.put(`/encadrements/${encadrementId}`, {
        enseignant_id: selectedEnseignant,
      });
      setEncadrements((prev) => prev.map((e) => (e.id === encadrementId ? data : e)));
      annulerEdition();
    } catch (err) {
      alert("Modification impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleCloturer = async (encadrementId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir clôturer cet encadrement ?")) return;
    try {
      await apiClient.post(`/encadrements/${encadrementId}/cloturer`);
      chargerEncadrements();
      if (selectedEncadrement?.id === encadrementId) {
        handleFermerDetails();
      }
    } catch (err) {
      alert("Clôture impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const peutCreer = user?.roles?.some((r) => r.name === "administration");
  const peutModifier = user?.roles?.some((r) => r.name === "administration");
  const peutAjouterEntree = user?.roles?.some(
    (r) => r.name === "etudiant" || r.name === "enseignant_encadreur"
  );
  const peutGererEnseignant = user?.roles?.some((r) => r.name === "enseignant_encadreur");

  if (loading) return <div className="loading-state">Chargement des encadrements...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Gestion des Encadrements</h1>
        <p className="text-sm text-slate-400">
          Suivi des relations d'encadrement académiques et professionnelles (Stages & Mémoires d'étudiants).
        </p>
      </div>

      {peutCreer && <EncadrementForm onEncadrementCreated={handleEncadrementCreated} />}

      {encadrements.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400">
          <AlertCircle size={32} className="mx-auto mb-2 text-slate-500" />
          <p>Aucun encadrement actif ou enregistré pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {encadrements.map((enc) => {
            const etudiantNom = enc.etudiant?.user?.name || "Non spécifié";
            const etudiantFiliere = enc.etudiant?.filiere || enc.etudiant?.niveau || "";
            const encadreurNom = enc.enseignant?.user?.name || "Non assigné";
            const encadreurSpec = enc.enseignant?.specialite || "";
            const titreElement =
              enc.encadrable?.titre_poste ||
              enc.encadrable?.titre ||
              enc.encadrable?.intitule ||
              "Sujet non renseigné";
            const entrepriseNom = enc.encadrable?.entreprise?.raison_sociale;

            return (
              <div
                key={enc.id}
                className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition space-y-4"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      {enc.type === "stage" ? <Briefcase size={18} /> : <BookOpen size={18} />}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Encadrement #{enc.id}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium uppercase tracking-wider">
                          {enc.type === "stage" ? "Stage" : "Mémoire"}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Créé le {enc.created_at ? new Date(enc.created_at).toLocaleDateString("fr-FR") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge statut={enc.statut} />
                </div>

                {/* Grid info details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-900/40 p-4 rounded-lg border border-slate-800/60">
                  {/* Etudiant */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <User size={13} className="text-[#FF0000]" /> Étudiant
                    </p>
                    <p className="font-bold text-white">{etudiantNom}</p>
                    {etudiantFiliere && <p className="text-xs text-slate-400">{etudiantFiliere}</p>}
                  </div>

                  {/* Encadreur */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-[#FF0000]" /> Enseignant Encadreur
                    </p>
                    <p className="font-bold text-white">{encadreurNom}</p>
                    {encadreurSpec && <p className="text-xs text-slate-400">{encadreurSpec}</p>}
                  </div>

                  {/* Element Encadré */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      {enc.type === "stage" ? <Building size={13} className="text-emerald-400" /> : <FileText size={13} className="text-blue-400" />}
                      {enc.type === "stage" ? "Sujet de Stage" : "Sujet de Mémoire"}
                    </p>
                    <p className="font-semibold text-slate-200 line-clamp-1">{titreElement}</p>
                    {entrepriseNom && (
                      <p className="text-xs text-slate-400 truncate">Entreprise : {entrepriseNom}</p>
                    )}
                  </div>
                </div>

                {/* Edit Supervisor Inline */}
                {editingId === enc.id ? (
                  <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <select
                      className="flex-1 bg-slate-800 text-white border border-slate-700 text-sm rounded-lg px-3 py-2"
                      value={selectedEnseignant}
                      onChange={(e) => setSelectedEnseignant(e.target.value)}
                    >
                      <option value="">-- Choisir un enseignant --</option>
                      {enseignants.map((ens) => (
                        <option key={ens.enseignant_id} value={ens.enseignant_id}>
                          {ens.nom} ({ens.specialite})
                        </option>
                      ))}
                    </select>
                    <button
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
                      onClick={() => confirmerModification(enc.id)}
                    >
                      Confirmer
                    </button>
                    <button
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg transition"
                      onClick={annulerEdition}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => handleOuvrirDetails(enc)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border border-[#FF0000]/40 text-[#FF0000] font-semibold text-xs rounded-lg transition"
                    >
                      <Eye size={14} /> Voir les détails & journal
                    </button>

                    <div className="flex items-center gap-2">
                      {peutModifier && (
                        <button
                          onClick={() => ouvrirEdition(enc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition"
                        >
                          Modifier l'encadreur
                        </button>
                      )}
                      {peutGererEnseignant && enc.statut === "actif" && (
                        <button
                          onClick={() => handleCloturer(enc.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 font-medium text-xs rounded-lg transition"
                        >
                          Clôturer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL : Details & Journal de suivi */}
      {selectedEncadrement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF0000]/20 text-[#FF0000]">
                  {selectedEncadrement.type === "stage" ? <Briefcase size={20} /> : <BookOpen size={20} />}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Dossier d'Encadrement #{selectedEncadrement.id}
                    <StatusBadge statut={selectedEncadrement.statut} />
                  </h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">
                    Type : {selectedEncadrement.type === "stage" ? "Stage Professionnel" : "Mémoire de Fin d'Études"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleFermerDetails}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Info */}
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF0000] uppercase tracking-wider border-b border-slate-800 pb-2">
                    <User size={15} /> Informations Étudiant
                  </div>
                  <p className="text-base font-bold text-white">
                    {selectedEncadrement.etudiant?.user?.name || "Non spécifié"}
                  </p>
                  <p className="text-xs text-slate-300">
                    Email : <span className="text-slate-400">{selectedEncadrement.etudiant?.user?.email || "N/A"}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    Filière : <span className="text-slate-400">{selectedEncadrement.etudiant?.filiere || "Non renseignée"}</span>
                  </p>
                  {selectedEncadrement.etudiant?.niveau && (
                    <p className="text-xs text-slate-300">
                      Niveau : <span className="text-slate-400">{selectedEncadrement.etudiant?.niveau}</span>
                    </p>
                  )}
                </div>

                {/* Supervisor Info */}
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF0000] uppercase tracking-wider border-b border-slate-800 pb-2">
                    <GraduationCap size={15} /> Enseignant Encadreur
                  </div>
                  <p className="text-base font-bold text-white">
                    {selectedEncadrement.enseignant?.user?.name || "Non assigné"}
                  </p>
                  <p className="text-xs text-slate-300">
                    Email : <span className="text-slate-400">{selectedEncadrement.enseignant?.user?.email || "N/A"}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    Spécialité : <span className="text-slate-400">{selectedEncadrement.enseignant?.specialite || "Générale"}</span>
                  </p>
                </div>
              </div>

              {/* Subject & Associated Entity Details */}
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  {selectedEncadrement.type === "stage" ? <Building size={15} /> : <FileText size={15} />}
                  Détails de l'Élément Encadré
                </div>
                <h4 className="text-sm font-semibold text-white italic">
                  "{selectedEncadrement.encadrable?.titre_poste || selectedEncadrement.encadrable?.titre || "Titre non renseigné"}"
                </h4>
                {selectedEncadrement.encadrable?.entreprise && (
                  <p className="text-xs text-slate-300">
                    Raison Sociale Partenaire : <strong className="text-white">{selectedEncadrement.encadrable?.entreprise?.raison_sociale}</strong>
                  </p>
                )}
                {selectedEncadrement.encadrable?.date_debut && (
                  <p className="text-xs text-slate-400">
                    Période : Du {new Date(selectedEncadrement.encadrable.date_debut).toLocaleDateString("fr-FR")} au {new Date(selectedEncadrement.encadrable.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {selectedEncadrement.encadrable?.pourcentage_avancement !== undefined && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Avancement du mémoire :</span>
                      <span className="font-bold text-emerald-400">{selectedEncadrement.encadrable.pourcentage_avancement}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${selectedEncadrement.encadrable.pourcentage_avancement}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar for Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-[#FF0000]" /> Journal de suivi & Échanges
                </p>
                {peutGererEnseignant && (
                  <button
                    onClick={() => setShowRdvForm(!showRdvForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition"
                  >
                    <Calendar size={14} /> {showRdvForm ? "Masquer formulaire RDV" : "Planifier un RDV"}
                  </button>
                )}
              </div>

              {/* Form RDV if toggled */}
              {showRdvForm && (
                <form onSubmit={handlePlanifierRdvModal} className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-400" /> Planifier un nouveau rendez-vous
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Date et heure :</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2"
                        value={rdvDate}
                        onChange={(e) => setRdvDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Sujet (optionnel) :</label>
                      <input
                        type="text"
                        placeholder="Ex: Validation de la revue de littérature"
                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2"
                        value={rdvSujet}
                        onChange={(e) => setRdvSujet(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Confirmer la planification
                  </button>
                </form>
              )}

              {/* Timeline of Journal Entries */}
              <div className="space-y-3">
                {entriesLoading ? (
                  <p className="text-xs text-slate-400 text-center py-4">Chargement de l'historique...</p>
                ) : entries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-900/40 rounded-xl border border-slate-800">
                    Aucune entrée dans le journal pour le moment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" /> {entry.auteur?.name || "Utilisateur"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock size={12} /> {new Date(entry.created_at).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-5 border-l-2 border-[#FF0000]/40">
                          {entry.contenu}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Entry Form inside Modal */}
              {peutAjouterEntree && (
                <form onSubmit={handleSoumettreEntreeModal} className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Ajouter une remarque / avancée au journal :
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-[#FF0000]"
                      placeholder="Saisissez votre compte-rendu ou votre question..."
                      value={newEntryText}
                      onChange={(e) => setNewEntryText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={submittingEntry || !newEntryText.trim()}
                      className="px-4 py-2 bg-[#FF0000] hover:bg-[#D50048] disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition self-end h-10"
                    >
                      <Send size={14} /> Envoyer
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
              <button
                onClick={handleFermerDetails}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
