import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import { administrationApi } from "../../../shared/api/administrationApi";
import SoutenanceForm from "../components/SoutenanceForm";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function SoutenancesListPage() {
  const { user, hasRole } = useAuth();
  const [onglet, setOnglet] = useState("soutenances"); // soutenances, creneaux
  const [soutenances, setSoutenances] = useState([]);
  const [creneaux, setCreneaux] = useState([]);
  const [jures, setJures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for scheduling slot form
  const [slotForm, setSlotForm] = useState({
    date_disponible: "",
    heure_debut: "",
    heure_fin: "",
    salle: "",
  });

  // State for composing jury
  const [juryOpenId, setJuryOpenId] = useState(null);
  const [selectedJure, setSelectedJure] = useState("");
  const [selectedRole, setSelectedRole] = useState("examinateur");

  // State for generating PV
  const [pvOpenId, setPvOpenId] = useState(null);
  const [pvComments, setPvComments] = useState("");

  const estAdmin = hasRole("administration");

  useEffect(() => {
    chargerDonnees();
  }, [onglet]);

  const chargerDonnees = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onglet === "soutenances") {
        const res = await apiClient.get("/soutenances");
        setSoutenances(res.data.data || res.data || []);
        if (estAdmin) {
          const juresRes = await administrationApi.getComptesJury();
          setJures(juresRes.data?.data || juresRes.data || []);
        }
      } else {
        const res = await administrationApi.getCreneauxSoutenance();
        setCreneaux(res.data.data || res.data || []);
      }
    } catch (err) {
      console.error("Erreur de chargement des données de soutenance:", err);
      setError("Erreur lors du chargement des informations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSoutenanceCreated = (nouvelle) => {
    setSoutenances((prev) => [nouvelle, ...prev]);
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await administrationApi.creerCreneauSoutenance(slotForm);
      alert("Créneau de soutenance créé et mis à disposition des étudiants éligibles.");
      setSlotForm({ date_disponible: "", heure_debut: "", heure_fin: "", salle: "" });
      chargerDonnees();
    } catch (err) {
      alert("Erreur lors de la création : " + (err.response?.data?.message || "Format incorrect."));
    }
  };

  const handleSupprimerCreneau = async (id) => {
    if (!window.confirm("Voulez-vous supprimer ce créneau ?")) return;
    try {
      await administrationApi.supprimerCreneauSoutenance(id);
      chargerDonnees();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Impossible de supprimer un créneau réservé."));
    }
  };

  const handleValiderReservation = async (creneauId) => {
    try {
      await administrationApi.validerDemandeCreneau(creneauId);
      alert("Réservation validée ! La soutenance est maintenant planifiée.");
      chargerDonnees();
    } catch (err) {
      alert("Erreur de validation : " + (err.response?.data?.message || "Action impossible."));
    }
  };

  const handleEnvoyerConvocations = async (soutenanceId) => {
    try {
      await administrationApi.genererConvocations(soutenanceId);
      alert("Convocations envoyées par email aux jurés et à l'étudiant.");
      chargerDonnees();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Composez d'abord le jury."));
    }
  };

  const handlePublierResultats = async (soutenanceId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir publier les résultats ? Le mémoire partira automatiquement en bibliothèque.")) return;
    try {
      await administrationApi.publierResultats(soutenanceId);
      alert("Résultats officiels publiés.");
      chargerDonnees();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Tous les jurés doivent avoir validé définitivement."));
    }
  };

  const handleGenererPV = async (e, soutenanceId) => {
    e.preventDefault();
    try {
      await apiClient.post(`/soutenances/${soutenanceId}/proces-verbaux`, {
        commentaires: pvComments,
      });
      alert("Procès-verbal de soutenance généré au format PDF.");
      setPvOpenId(null);
      setPvComments("");
      chargerDonnees();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Notation incomplète."));
    }
  };

  const handleSignerPV = async (soutenanceId, pvId) => {
    try {
      await apiClient.post(`/soutenances/${soutenanceId}/proces-verbaux/${pvId}/signer`);
      alert("Procès-verbal signé électroniquement avec succès.");
      chargerDonnees();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "PV déjà signé ou non autorisé."));
    }
  };

  const ouvrirJury = (soutenanceId) => {
    setJuryOpenId(soutenanceId);
    setSelectedJure("");
    setSelectedRole("examinateur");
  };

  const confirmerJury = async (soutenanceId) => {
    if (!selectedJure) return;
    try {
      await apiClient.post(`/soutenances/${soutenanceId}/jury`, {
        membres: [{ user_id: selectedJure, role_jury: selectedRole }],
      });
      alert("Membre ajouté au jury.");
      setJuryOpenId(null);
      chargerDonnees();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Erreur."));
    }
  };

  if (loading) return <div className="loading-state">Chargement...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Planification & Soutenances</h1>
        <p>Gérez les créneaux disponibles, validez les demandes d'étudiants et constituez les jurys officiels.</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", gap: 10, borderBottom: "2px solid var(--border)", marginBottom: 24, paddingBottom: 8 }}>
        <button
          className={`btn ${onglet === "soutenances" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setOnglet("soutenances")}
        >
          Soutenances Planifiées
        </button>
        {estAdmin && (
          <button
            className={`btn ${onglet === "creneaux" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setOnglet("creneaux")}
          >
            Créneaux & Réservations
          </button>
        )}
      </div>

      {onglet === "soutenances" ? (
        <div>
          {estAdmin && <SoutenanceForm onSoutenanceCreated={handleSoutenanceCreated} />}

          {soutenances.length === 0 ? (
            <p className="empty-state">Aucune soutenance programmée pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {soutenances.map((s) => (
                <div key={s.id} className={`dossier status-${s.statut}`} style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div className="dossier-head" style={{ marginBottom: 4 }}>
                    <p className="dossier-title" style={{ fontSize: 16 }}>
                      Soutenance de : <strong>{s.memoire?.etudiant?.name || "Étudiant Inconnu"}</strong>
                    </p>
                    <StatusBadge statut={s.statut} />
                  </div>
                  <p className="dossier-meta">
                    Sujet: <strong>"{s.memoire?.titre}"</strong>
                  </p>
                  <p className="dossier-meta" style={{ marginTop: 2 }}>
                    Date : <strong>{s.date_soutenance?.slice(0, 10)}</strong> à <strong>{s.heure_debut}</strong> — Salle : <strong>{s.salle}</strong>
                  </p>

                  {/* Jury details */}
                  <div style={{ marginTop: 8, padding: 8, background: "var(--surface)", borderRadius: 8 }}>
                    <p className="dossier-meta" style={{ fontWeight: "bold", color: "var(--ink)" }}>Jury de soutenance :</p>
                    {s.jury && s.jury.length > 0 ? (
                      <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 13 }}>
                        {s.jury.map((m) => (
                          <li key={m.id}>
                            <span style={{ textTransform: "capitalize" }}><strong>{m.role_jury}</strong></span> : {m.membre?.name} 
                            {m.notes_validees ? (
                              <span style={{ color: "var(--success)", marginLeft: 6, fontWeight: "bold" }}>(Notes validées ✓)</span>
                            ) : (
                              <span style={{ color: "var(--warning)", marginLeft: 6 }}>(Notation en cours)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="dossier-meta" style={{ fontStyle: "italic", marginLeft: 4 }}>Aucun membre dans le jury pour le moment.</p>
                    )}
                  </div>

                  {/* PV List */}
                  {s.proces_verbaux && s.proces_verbaux.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: "var(--success-bg)", borderRadius: 8 }}>
                      <p className="dossier-meta" style={{ fontWeight: "bold", color: "var(--success)" }}>Procès-verbaux disponibles :</p>
                      {s.proces_verbaux.map((pv) => (
                        <div key={pv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                          <span style={{ fontSize: 13 }}>Généré le {new Date(pv.date_generation).toLocaleString("fr-FR")}</span>
                          <div style={{ display: "flex", gap: 10 }}>
                            <a
                              href={`${apiClient.defaults.baseURL}/soutenances/${s.id}/proces-verbaux/${pv.id}/download`}
                              className="btn btn-ghost"
                              style={{ minHeight: 30, padding: "4px 8px", fontSize: 12 }}
                            >
                              Télécharger le PDF 📄
                            </a>
                            {!pv.est_signe && (
                              <button
                                className="btn btn-primary"
                                style={{ minHeight: 30, padding: "4px 8px", fontSize: 12 }}
                                onClick={() => handleSignerPV(s.id, pv.id)}
                              >
                                Signer électroniquement
                              </button>
                            )}
                            {pv.est_signe && (
                              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: "bold", alignSelf: "center" }}>Signed ✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Row */}
                  {estAdmin && (
                    <div className="actions-row" style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <button className="btn" onClick={() => ouvrirJury(s.id)}>
                        Composer le Jury
                      </button>
                      <button className="btn btn-ghost" onClick={() => handleEnvoyerConvocations(s.id)}>
                        Envoyer les Convocations
                      </button>
                      {!s.resultats_publies && s.statut !== "annulee" && (
                        <button className="btn btn-primary" onClick={() => handlePublierResultats(s.id)}>
                          Publier les Résultats
                        </button>
                      )}
                      {s.statut === "terminee" && (
                        <button className="btn btn-primary" onClick={() => setPvOpenId(s.id)}>
                          Générer le Procès-Verbal
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline Jury edit */}
                  {juryOpenId === s.id && (
                    <div className="inline-edit" style={{ background: "var(--surface)", padding: 12, borderRadius: 8, marginTop: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4 }}>Ajouter un juré :</label>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <select value={selectedJure} onChange={(e) => setSelectedJure(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
                          <option value="">-- Sélectionner --</option>
                          {jures.map((j) => (
                            <option key={j.id} value={j.id}>{j.name}</option>
                          ))}
                        </select>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                          <option value="president">Président</option>
                          <option value="rapporteur">Rapporteur</option>
                          <option value="examinateur">Examinateur</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => confirmerJury(s.id)}>
                          Ajouter au jury
                        </button>
                        <button className="btn btn-ghost" onClick={() => setJuryOpenId(null)}>
                          Fermer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PV Generation popup/panel */}
                  {pvOpenId === s.id && (
                    <form onSubmit={(e) => handleGenererPV(e, s.id)} style={{ background: "var(--surface)", padding: 12, borderRadius: 8, marginTop: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: "bold", display: "block", marginBottom: 4 }}>Observations / Commentaires pour le procès-verbal :</label>
                      <textarea
                        value={pvComments}
                        onChange={(e) => setPvComments(e.target.value)}
                        placeholder="Insérez les délibérations du jury ou remarques particulières..."
                        rows={3}
                        style={{ width: "100%", marginBottom: 10 }}
                      />
                      <div className="actions-row">
                        <button type="submit" className="btn btn-primary">Générer le PDF officiel</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setPvOpenId(null)}>Annuler</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Create slots form */}
          {estAdmin && (
            <form onSubmit={handleCreateSlot} className="card" style={{ marginBottom: 24 }}>
              <h2>Proposer un nouveau Créneau de Soutenance</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Date disponible</label>
                  <input
                    type="date"
                    value={slotForm.date_disponible}
                    onChange={(e) => setSlotForm({ ...slotForm, date_disponible: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Heure de début</label>
                  <input
                    type="time"
                    value={slotForm.heure_debut}
                    onChange={(e) => setSlotForm({ ...slotForm, heure_debut: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Heure de fin</label>
                  <input
                    type="time"
                    value={slotForm.heure_fin}
                    onChange={(e) => setSlotForm({ ...slotForm, heure_fin: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Salle de Soutenance</label>
                <input
                  type="text"
                  value={slotForm.salle}
                  onChange={(e) => setSlotForm({ ...slotForm, salle: e.target.value })}
                  placeholder="Ex: Salle 202, Bâtiment C"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Publier le créneau</button>
            </form>
          )}

          {creneaux.length === 0 ? (
            <p className="empty-state">Aucun créneau de soutenance créé.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {creneaux.map((c) => (
                <div key={c.id} className="dossier">
                  <div style={{ flex: 1 }}>
                    <p className="dossier-title">
                      Créneau du : {new Date(c.date_disponible).toLocaleDateString("fr-FR")} (de {c.heure_debut} à {c.heure_fin})
                    </p>
                    <p className="dossier-meta">
                      Salle : <strong>{c.salle}</strong>
                    </p>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge badge-${c.statut}`}>{c.statut}</span>
                    </div>

                    {c.statut === "reserve" && c.memoire && (
                      <div style={{ marginTop: 10, padding: 8, background: "var(--warning-bg)", borderRadius: 8 }}>
                        <p className="dossier-meta" style={{ color: "var(--ink)", fontWeight: "bold" }}>Demande de Réservation Étudiant :</p>
                        <p className="dossier-meta" style={{ marginTop: 2 }}>
                          Étudiant : <strong>{c.memoire.etudiant?.name}</strong>
                        </p>
                        <p className="dossier-meta" style={{ marginTop: 2 }}>
                          Mémoire : <strong>"{c.memoire.titre}"</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="actions-row">
                    {c.statut === "reserve" && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleValiderReservation(c.id)}
                      >
                        Valider la réservation
                      </button>
                    )}
                    {c.statut === "disponible" && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleSupprimerCreneau(c.id)}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}