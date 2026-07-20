import { useState, useEffect } from "react";
import { juryApi } from "../../../shared/api/juryApi";
import { useAuth } from "../../../shared/auth/AuthContext";
import NotificationBell from "../../../shared/components/NotificationBell";
import StatusBadge from "../../../shared/components/StatusBadge";

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tableau de bord Jury</h1>
          <p>Consultez les mémoires et attribuez vos évaluations pour les soutenances de votre session.</p>
        </div>
        <NotificationBell />
      </div>

      {error && <p className="error-text">{error}</p>}

      {/* Main Layout Grid */}
      <div style={{ display: "grid", gridTemplateColumns: selectedSoutenance ? "1fr 1.2fr" : "1fr", gap: 24, alignItems: "start" }}>

        {/* Left Column: Assigned Defenses List */}
        <div className="card" style={{ padding: 24 }}>
          <h2>Soutenances Assignées</h2>
          {loading && !selectedSoutenance && <div className="loading-state">Chargement...</div>}
          {!loading && soutenances.length === 0 ? (
            <p className="empty-state">Aucune soutenance ne vous est affectée pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              {soutenances.map((s) => {
                const monJuryRow = s.jury?.find((j) => j.user_id === user.id);
                const estNotesValidees = monJuryRow?.notes_validees || false;
                const estActive = selectedSoutenance?.id === s.id;

                return (
                  <div
                    key={s.id}
                    className={`dossier status-${s.statut}`}
                    style={{
                      flexDirection: "column",
                      alignItems: "stretch",
                      cursor: "pointer",
                      borderColor: estActive ? "var(--gts-secondary)" : "var(--border)",
                      boxShadow: estActive ? "0 4px 15px rgba(139, 92, 246, 0.15)" : ""
                    }}
                    onClick={() => handleSelectSoutenance(s)}
                  >
                    <div className="dossier-head" style={{ marginBottom: 4 }}>
                      <p className="dossier-title" style={{ fontSize: 14, fontWeight: 700 }}>
                        Étudiant : {s.memoire?.etudiant?.user?.name || s.memoire?.etudiant?.name || "Inconnu"}
                      </p>
                      <StatusBadge statut={s.statut} />
                    </div>
                    <p className="dossier-meta" style={{ fontStyle: "italic", fontSize: 12 }}>
                      "{s.memoire?.titre}"
                    </p>
                    <p className="dossier-meta" style={{ marginTop: 4 }}>
                      Le {new Date(s.date_soutenance).toLocaleDateString("fr-FR")} à {s.heure_debut} — Salle {s.salle}
                    </p>
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {estNotesValidees ? (
                        <span style={{ fontSize: 11, color: "var(--success)", fontWeight: "bold" }}>✓ Notes Validées</span>
                      ) : s.statut === "terminee" ? (
                        <span style={{ fontSize: 11, color: "var(--neutral)", fontWeight: "bold" }}>Soutenance Terminée</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--warning)" }}>✍️ Évaluation en cours</span>
                      )}
                      <span style={{ fontSize: 12, color: "var(--gts-secondary)", fontWeight: "bold" }}>
                        {estActive ? "Consultation active ●" : "Cliquer pour évaluer →"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Evaluation Workspace */}
        {selectedSoutenance && (
          <div className="card" style={{ padding: 28, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div>
                <h2>Workspace d'Évaluation</h2>
                <p className="dossier-meta" style={{ marginTop: 4 }}>
                  Soutenance de <strong>{selectedSoutenance.memoire?.etudiant?.name}</strong>
                </p>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedSoutenance(null)} style={{ minHeight: 30 }}>
                Fermer
              </button>
            </div>

            {/* Document download box */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginBottom: 20 }}>
              <p className="dossier-title" style={{ fontSize: 13 }}>Mémoire déposé :</p>
              <p className="dossier-meta" style={{ fontStyle: "italic", marginTop: 2, marginBottom: 8 }}>
                "{selectedSoutenance.memoire?.titre}"
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%", minHeight: 36, fontSize: 13 }}
                onClick={() => handleDownloadMemoire(selectedSoutenance.id)}
              >
                Télécharger le document mémoire PDF 📥
              </button>
            </div>

            {/* Evaluation Form Grid */}
            <div style={{ display: "grid", gap: 16 }}>
              {CRITERES.map((c) => (
                <div key={c.key} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontWeight: "bold", fontSize: 13, color: "var(--navy)" }}>{c.label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={notes[c.key].note}
                        onChange={(e) => setNoteField(c.key, "note", e.target.value)}
                        disabled={estLectureSeule}
                        required
                        style={{ width: 70, minHeight: 32, padding: "4px 8px", fontSize: 14, textAlign: "center" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>/ 20</span>
                    </div>
                  </div>
                  <p className="dossier-meta" style={{ fontSize: 11, marginBottom: 6 }}>{c.desc}</p>
                  <input
                    type="text"
                    placeholder="Observations, points clés..."
                    value={notes[c.key].commentaire}
                    onChange={(e) => setNoteField(c.key, "commentaire", e.target.value)}
                    disabled={estLectureSeule}
                    style={{ width: "100%", minHeight: 34, padding: "6px 10px", fontSize: 12.5 }}
                  />
                </div>
              ))}
            </div>

            {/* Real-time calculated general average */}
            <div
              style={{
                marginTop: 20,
                padding: "16px 20px",
                borderRadius: 8,
                background: notesValidees ? "var(--success-bg)" : estSoutenanceTerminee ? "var(--neutral-bg)" : "var(--warning-bg)",
                border: "1px solid transparent",
                borderColor: notesValidees ? "var(--success)" : estSoutenanceTerminee ? "var(--border)" : "var(--warning)",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Moyenne Générale Estimée
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--navy)", margin: "4px 0" }}>
                {moyennePrint} <span style={{ fontSize: 16, fontWeight: 400, color: "var(--ink-muted)" }}>/ 20</span>
              </div>

              {notesValidees ? (
                <p style={{ color: "var(--success)", fontSize: 12, fontWeight: "bold", margin: 0 }}>
                  ✓ Notes Validées Définitivement (Évaluation Transmise)
                </p>
              ) : estSoutenanceTerminee ? (
                <p style={{ color: "var(--neutral)", fontSize: 12, fontWeight: "bold", margin: 0 }}>
                  🔒 Soutenance Clôturée (Notation verrouillée)
                </p>
              ) : (
                <p style={{ color: "var(--warning)", fontSize: 12, margin: 0 }}>
                  ✍️ En cours de notation. Pensez à enregistrer ou valider.
                </p>
              )}
            </div>

            {/* Submissions buttons */}
            {!estLectureSeule && (
              <div className="actions-row" style={{ marginTop: 20 }}>
                <button
                  className="btn"
                  style={{ flex: 1 }}
                  onClick={() => handleSaveNotes(false)}
                  disabled={submitting}
                >
                  Enregistrer Brouillon
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleSaveNotes(true)}
                  disabled={submitting}
                >
                  Valider Définitivement
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
