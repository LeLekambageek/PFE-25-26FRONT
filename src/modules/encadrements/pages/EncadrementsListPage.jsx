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
        <div className="grid grid-cols-1 gap-5">
          {encadrements.map((enc) => {
            const etudiantNom = enc.etudiant?.user?.name || "Nom non spécifié";
            const etudiantFiliere = enc.etudiant?.filiere || enc.etudiant?.niveau || "";
            const encadreurNom = enc.enseignant?.user?.name || "Non assigné";
            const encadreurSpec = enc.enseignant?.specialite || "";
            const titreElement =
              enc.encadrable?.titre_poste ||
              enc.encadrable?.titre ||
              enc.encadrable?.intitule ||
              "Sujet en attente de soumission";
            const entrepriseNom = enc.encadrable?.entreprise?.raison_sociale;

            return (
              <div
                key={enc.id}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700 transition space-y-5"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-[#FF0000] border border-slate-700">
                      {enc.type === "stage" ? <Briefcase size={22} /> : <BookOpen size={22} />}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        Encadrement #{enc.id}
                        <span className="text-sm px-3 py-0.5 rounded-md bg-[#FF0000]/15 text-[#FF0000] border border-[#FF0000]/30 font-medium">
                          {enc.type === "stage" ? "Stage" : "Mémoire"}
                        </span>
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Créé le {enc.created_at ? new Date(enc.created_at).toLocaleDateString("fr-FR") : "Date non renseignée"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge statut={enc.statut} />
                </div>

                {/* Grid info details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
                  {/* Etudiant */}
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                      <User size={16} className="text-[#FF0000]" /> Étudiant
                    </p>
                    <p className="text-base font-bold text-white">{etudiantNom}</p>
                    {etudiantFiliere && <p className="text-sm text-slate-300 font-normal">{etudiantFiliere}</p>}
                  </div>

                  {/* Encadreur */}
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                      <GraduationCap size={16} className="text-[#FF0000]" /> Enseignant Encadreur
                    </p>
                    <p className="text-base font-bold text-white">{encadreurNom}</p>
                    {encadreurSpec && <p className="text-sm text-slate-300 font-normal">{encadreurSpec}</p>}
                  </div>

                  {/* Element Encadré */}
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                      {enc.type === "stage" ? <Building size={16} className="text-emerald-400" /> : <FileText size={16} className="text-blue-400" />}
                      {enc.type === "stage" ? "Sujet du Stage" : "Sujet du Mémoire"}
                    </p>
                    <p className="text-base font-semibold text-slate-100 line-clamp-1">{titreElement}</p>
                    {entrepriseNom && (
                      <p className="text-sm text-slate-300 truncate">Entreprise : {entrepriseNom}</p>
                    )}
                  </div>
                </div>

                {/* Edit Supervisor Inline */}
                {editingId === enc.id ? (
                  <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <select
                      className="flex-1 bg-slate-800 text-white border border-slate-700 text-base rounded-xl px-4 py-2.5"
                      value={selectedEnseignant}
                      onChange={(e) => setSelectedEnseignant(e.target.value)}
                    >
                      <option value="">-- Choisir un enseignant encadreur --</option>
                      {enseignants.map((ens) => (
                        <option key={ens.enseignant_id} value={ens.enseignant_id}>
                          {ens.nom} ({ens.specialite})
                        </option>
                      ))}
                    </select>
                    <button
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition"
                      onClick={() => confirmerModification(enc.id)}
                    >
                      Confirmer
                    </button>
                    <button
                      className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm rounded-xl transition"
                      onClick={annulerEdition}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  /* Action buttons */
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <button
                      onClick={() => handleOuvrirDetails(enc)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] hover:bg-[#D50048] text-white font-semibold text-sm rounded-xl transition shadow-sm"
                    >
                      <Eye size={16} /> Consulter le dossier et le journal
                    </button>

                    <div className="flex items-center gap-3">
                      {peutModifier && (
                        <button
                          onClick={() => ouvrirEdition(enc)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm rounded-xl transition"
                        >
                          Modifier l'encadreur
                        </button>
                      )}
                      {peutGererEnseignant && enc.statut === "actif" && (
                        <button
                          onClick={() => handleCloturer(enc.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/50 font-medium text-sm rounded-xl transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/30">
                  {selectedEncadrement.type === "stage" ? <Briefcase size={22} /> : <BookOpen size={22} />}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    Dossier d'Encadrement #{selectedEncadrement.id}
                    <StatusBadge statut={selectedEncadrement.statut} />
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Type : {selectedEncadrement.type === "stage" ? "Stage Professionnel" : "Mémoire de Fin d'Études"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleFermerDetails}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Student Info */}
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#FF0000] border-b border-slate-800 pb-2">
                    <User size={17} /> Informations Étudiant
                  </div>
                  <p className="text-base font-bold text-white">
                    {selectedEncadrement.etudiant?.user?.name || "Non spécifié"}
                  </p>
                  <p className="text-sm text-slate-300">
                    Email : <span className="text-slate-400">{selectedEncadrement.etudiant?.user?.email || "Non disponible"}</span>
                  </p>
                  <p className="text-sm text-slate-300">
                    Filière : <span className="text-slate-400">{selectedEncadrement.etudiant?.filiere || "Non renseignée"}</span>
                  </p>
                  {selectedEncadrement.etudiant?.niveau && (
                    <p className="text-sm text-slate-300">
                      Niveau : <span className="text-slate-400">{selectedEncadrement.etudiant?.niveau}</span>
                    </p>
                  )}
                </div>

                {/* Supervisor Info */}
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#FF0000] border-b border-slate-800 pb-2">
                    <GraduationCap size={17} /> Enseignant Encadreur
                  </div>
                  <p className="text-base font-bold text-white">
                    {selectedEncadrement.enseignant?.user?.name || "Non assigné"}
                  </p>
                  <p className="text-sm text-slate-300">
                    Email : <span className="text-slate-400">{selectedEncadrement.enseignant?.user?.email || "Non disponible"}</span>
                  </p>
                  <p className="text-sm text-slate-300">
                    Spécialité : <span className="text-slate-400">{selectedEncadrement.enseignant?.specialite || "Générale"}</span>
                  </p>
                </div>
              </div>

              {/* Subject & Associated Entity Details */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">
                  {selectedEncadrement.type === "stage" ? <Building size={17} /> : <FileText size={17} />}
                  Détails du Sujet Encadré
                </div>
                <h4 className="text-base font-semibold text-white">
                  "{selectedEncadrement.encadrable?.titre_poste || selectedEncadrement.encadrable?.titre || "Titre non renseigné"}"
                </h4>
                {selectedEncadrement.encadrable?.entreprise && (
                  <p className="text-sm text-slate-300">
                    Entreprise partenaire : <strong className="text-white">{selectedEncadrement.encadrable?.entreprise?.raison_sociale}</strong>
                  </p>
                )}
                {selectedEncadrement.encadrable?.date_debut && (
                  <p className="text-sm text-slate-400">
                    Période : Du {new Date(selectedEncadrement.encadrable.date_debut).toLocaleDateString("fr-FR")} au {new Date(selectedEncadrement.encadrable.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {selectedEncadrement.encadrable?.pourcentage_avancement !== undefined && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Avancement du mémoire :</span>
                      <span className="font-bold text-emerald-400">{selectedEncadrement.encadrable.pourcentage_avancement}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${selectedEncadrement.encadrable.pourcentage_avancement}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar for Modal */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#FF0000]" /> Journal de suivi et échanges
                </p>
                {peutGererEnseignant && (
                  <button
                    onClick={() => setShowRdvForm(!showRdvForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition"
                  >
                    <Calendar size={16} /> {showRdvForm ? "Masquer la planification" : "Planifier un rendez-vous"}
                  </button>
                )}
              </div>

              {/* Form RDV if toggled */}
              {showRdvForm && (
                <form onSubmit={handlePlanifierRdvModal} className="bg-slate-900 border border-slate-700 p-5 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar size={16} className="text-amber-400" /> Planifier un nouveau rendez-vous
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1 font-medium">Date et heure :</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5"
                        value={rdvDate}
                        onChange={(e) => setRdvDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1 font-medium">Sujet du rendez-vous :</label>
                      <input
                        type="text"
                        placeholder="Ex: Évaluation de l'avancement"
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5"
                        value={rdvSujet}
                        onChange={(e) => setRdvSujet(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition"
                  >
                    Confirmer la planification
                  </button>
                </form>
              )}

              {/* Timeline of Journal Entries */}
              <div className="space-y-4">
                {entriesLoading ? (
                  <p className="text-sm text-slate-400 text-center py-6">Chargement du journal d'échanges...</p>
                ) : entries.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-6 bg-slate-900/60 rounded-xl border border-slate-800">
                    Aucune entrée dans le journal pour le moment.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span className="font-semibold text-white flex items-center gap-2">
                            <User size={15} className="text-slate-400" /> {entry.auteur?.name || "Utilisateur"}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock size={14} /> {new Date(entry.created_at).toLocaleString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed pl-4 border-l-2 border-[#FF0000]">
                          {entry.contenu}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Entry Form inside Modal */}
              {peutAjouterEntree && (
                <form onSubmit={handleSoumettreEntreeModal} className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="block text-sm font-bold text-white">
                    Ajouter une entrée au journal :
                  </label>
                  <div className="flex gap-3">
                    <textarea
                      rows={2}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded-xl p-3.5 focus:outline-none focus:border-[#FF0000]"
                      placeholder="Saisissez votre remarque ou compte-rendu d'avancement..."
                      value={newEntryText}
                      onChange={(e) => setNewEntryText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={submittingEntry || !newEntryText.trim()}
                      className="px-5 py-2.5 bg-[#FF0000] hover:bg-[#D50048] disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition self-end h-11"
                    >
                      <Send size={15} /> Envoyer
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
              <button
                onClick={handleFermerDetails}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition"
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
