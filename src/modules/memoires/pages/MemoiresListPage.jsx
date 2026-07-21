import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import MemoireForm from "../components/MemoireForm";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function MemoiresListPage() {
  const { user } = useAuth();
  const [memoires, setMemoires] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Administration view state
  const [editingId, setEditingId] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");

  // Espace Suivi state
  const [selectedMemoire, setSelectedMemoire] = useState(null);
  const [versions, setVersions] = useState([]);
  const [newComments, setNewComments] = useState({});
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Form states for evaluating a version
  const [evalForm, setEvalForm] = useState({
    pourcentage_avancement: "50",
    annotations: "",
    commentaires_encadreur: "",
    recommandations: "",
    commentaire: "", // causes 'corrections_demandees' if filled
  });
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  // Student upload version state
  const [uploadForm, setUploadForm] = useState({
    numero_version: "v1",
    fichier: null,
  });
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  const estAdmin = user?.roles?.some((r) => r.name === "administration");
  const estEncadreur = user?.roles?.some((r) => r.name === "enseignant_encadreur");
  const estEtudiant = user?.roles?.some((r) => r.name === "etudiant");

  const chargerMemoires = () => {
    setLoading(true);
    setError(null);
    apiClient
      .get("/memoires")
      .then(({ data }) => setMemoires(data.data || data))
      .catch(() => setError("Impossible de charger les mémoires."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerMemoires();
    if (estAdmin) {
      apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data)).catch(() => {});
    }
  }, []);

  const handleMemoireCreated = (nouveau) => {
    setMemoires((prev) => [nouveau, ...prev]);
  };

  const handleValider = async (memoireId) => {
    try {
      await apiClient.post(`/memoires/${memoireId}/valider`);
      alert("Sujet de mémoire validé.");
      chargerMemoires();
    } catch (err) {
      alert("Validation impossible : " + (err.response?.data?.message || "erreur"));
    }
  };

  const handleRejeter = async (memoireId) => {
    const commentaire = prompt("Motif du rejet :");
    if (!commentaire) return;
    try {
      await apiClient.post(`/memoires/${memoireId}/rejeter`, {
        commentaire_validation: commentaire,
      });
      alert("Sujet de mémoire rejeté.");
      chargerMemoires();
    } catch (err) {
      alert("Rejet impossible : " + (err.response?.data?.message || "erreur"));
    }
  };

  const ouvrirAffectation = (memoireId) => {
    setEditingId(memoireId);
    setSelectedEnseignant("");
  };

  const annulerAffectation = () => {
    setEditingId(null);
    setSelectedEnseignant("");
  };

  const confirmerAffectation = async (memoireId) => {
    if (!selectedEnseignant) return;
    try {
      await apiClient.post(`/memoires/${memoireId}/affecter-encadreur`, {
        encadreur_id: selectedEnseignant,
      });
      alert("Enseignant encadreur affecté au mémoire.");
      annulerAffectation();
      chargerMemoires();
    } catch (err) {
      alert("Affectation impossible : " + (err.response?.data?.message || "erreur"));
    }
  };

  // Espace Suivi & Versions logic
  const handleSelectMemoire = async (m) => {
    setSelectedMemoire(m);
    setSelectedVersion(null);
    setVersions([]);
    setVersionsLoading(true);
    try {
      const { data } = await apiClient.get(`/memoires/${m.id}/versions`);
      setVersions(data);
    } catch (err) {
      alert("Impossible de charger les versions du mémoire.");
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleSelectVersion = (v) => {
    setSelectedVersion(v);
    setEvalForm({
      pourcentage_avancement: v.pourcentage_avancement?.toString() || "50",
      annotations: v.annotations || "",
      commentaires_encadreur: v.commentaires_encadreur || "",
      recommandations: v.recommandations || "",
      commentaire: "",
    });
  };

  const handleDownloadVersion = async (v) => {
    try {
      const response = await apiClient.get(`/versions/${v.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", v.fichier_nom_original);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Erreur lors du téléchargement du document.");
    }
  };

  const handlePostComment = async (versionId) => {
    const text = newComments[versionId];
    if (!text || !text.trim()) return;

    try {
      const { data } = await apiClient.post(`/versions/${versionId}/corrections`, {
        commentaire: text,
        type_correction: "reponse",
      });

      // Update the local state of the versions to append the new correction
      setVersions((prev) =>
        prev.map((v) => {
          if (v.id === versionId) {
            return {
              ...v,
              corrections: [...(v.corrections || []), data],
            };
          }
          return v;
        })
      );

      // Reset the comment field
      setNewComments((prev) => ({ ...prev, [versionId]: "" }));
    } catch (err) {
      alert("Erreur lors de l'envoi du commentaire : " + (err.response?.data?.message || "erreur"));
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    setEvalSubmitting(true);
    try {
      await apiClient.post(`/versions/${selectedVersion.id}/corriger`, {
        pourcentage_avancement: parseInt(evalForm.pourcentage_avancement, 10),
        annotations: evalForm.annotations,
        commentaires_encadreur: evalForm.commentaires_encadreur,
        recommandations: evalForm.recommandations,
        commentaire: evalForm.commentaire || null, // causes correction request if not empty
      });
      alert("Évaluation de la progression enregistrée.");
      setSelectedVersion(null);
      handleSelectMemoire(selectedMemoire);
      chargerMemoires();
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "erreur"));
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleValiderFinale = async (versionId) => {
    if (!window.confirm("Valider cette version comme finale ? Cela figera le statut à validé final pour la soutenance.")) return;
    try {
      await apiClient.post(`/versions/${versionId}/valider-finale`);
      alert("Version validée comme finale ! L'étudiant est prêt pour la soutenance.");
      setSelectedVersion(null);
      handleSelectMemoire(selectedMemoire);
      chargerMemoires();
    } catch (err) {
      alert("Impossible de valider : " + (err.response?.data?.message || "Vérifiez que le pourcentage d'avancement est >= 80%"));
    }
  };

  const handleAccorderEligibilite = async (memoireId) => {
    try {
      await apiClient.post(`/memoires/${memoireId}/accorder-eligibilite-soutenance`);
      alert("Éligibilité accordée ! L'étudiant peut planifier sa soutenance.");
      chargerMemoires();
      if (selectedMemoire && selectedMemoire.id === memoireId) {
        setSelectedMemoire({ ...selectedMemoire, eligible_soutenance: true });
      }
    } catch (err) {
      alert("Action impossible : " + (err.response?.data?.message || "erreur"));
    }
  };

  // Student upload version submit
  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!uploadForm.fichier) {
      alert("Veuillez sélectionner un fichier à déposer.");
      return;
    }
    setUploadSubmitting(true);
    const fd = new FormData();
    fd.append("numero_version", uploadForm.numero_version);
    fd.append("fichier", uploadForm.fichier);

    try {
      await apiClient.post(`/memoires/${selectedMemoire.id}/versions`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Nouvelle version de document déposée avec succès.");
      setUploadForm({ numero_version: "v1", fichier: null });
      handleSelectMemoire(selectedMemoire);
      chargerMemoires();
    } catch (err) {
      alert("Erreur lors du dépôt : " + (err.response?.data?.message || "erreur"));
    } finally {
      setUploadSubmitting(false);
    }
  };

  const peutCreer = estEtudiant || estEncadreur;

  if (loading) return <div className="loading-state">Chargement des mémoires...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Mémoires de Fin d'Études</h1>
        <p>
          {estEncadreur 
            ? "Évaluez la progression des mémoires de vos étudiants assignés, examinez les versions et accordez l'éligibilité aux soutenances." 
            : "Suivi des sujets de mémoires, versions déposées et validation académique."}
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <div className="loading-state">Chargement des mémoires...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selectedMemoire ? "1.1fr 1fr" : "1fr", gap: 24, alignItems: "start" }}>
          
          {/* Left Column: Memoires List */}
          <div className="card">
            <h2>{estEncadreur ? "Mes Étudiants Encadrés" : "Liste des Mémoires"}</h2>
            
            {peutCreer && <MemoireForm onMemoireCreated={handleMemoireCreated} />}

            {memoires.length === 0 ? (
              <p className="empty-state">Aucun mémoire enregistré pour le moment.</p>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                {memoires.map((m) => {
                  const estActif = selectedMemoire?.id === m.id;
                  const peutValiderSujet = estAdmin || (estEncadreur && m.encadreur_id === user.id);

                  return (
                    <div 
                      key={m.id} 
                      className={`dossier status-${m.statut}`} 
                      style={{ 
                        flexDirection: "column", 
                        alignItems: "stretch",
                        borderColor: estActif ? "var(--gts-secondary)" : "var(--border)",
                        boxShadow: estActif ? "0 4px 15px rgba(139, 92, 246, 0.15)" : ""
                      }}
                    >
                      <div className="dossier-head" style={{ marginBottom: 4 }}>
                        <p className="dossier-title">{m.titre}</p>
                        <StatusBadge statut={m.statut} />
                      </div>
                      <p className="dossier-meta">
                        Étudiant : <strong>{m.etudiant?.name || m.etudiant?.user?.name}</strong>
                      </p>
                      {m.encadreur && (
                        <p className="dossier-meta" style={{ marginTop: 2 }}>
                          Encadrant : <strong>{m.encadreur.name}</strong>
                        </p>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                        <div>
                          {m.statut === "soutenu" ? (
                            <span className="badge badge-valide" style={{ background: "var(--success-bg)", color: "var(--success)", fontSize: 11 }}>
                              ✓ Terminé
                            </span>
                          ) : m.eligible_soutenance ? (
                            <span className="badge badge-valide" style={{ background: "var(--success-bg)", color: "var(--success)", fontSize: 11 }}>
                              ✓ Éligible Soutenance
                            </span>
                          ) : (
                            <span className="badge badge-en_cours" style={{ background: "var(--warning-bg)", color: "var(--warning)", fontSize: 11 }}>
                              Avancement en cours
                            </span>
                          )}
                        </div>

                        <div className="actions-row" style={{ margin: 0 }}>
                          {(estEncadreur || estEtudiant) && (
                            <button className="btn btn-primary" style={{ minHeight: 32, fontSize: 12 }} onClick={() => handleSelectMemoire(m)}>
                              Suivi & Progression →
                            </button>
                          )}
                          {estAdmin && (
                            <button className="btn" style={{ minHeight: 32, fontSize: 12 }} onClick={() => handleSelectMemoire(m)}>
                              Détails versions →
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Admin validation & supervisor assignments */}
                      {editingId === m.id ? (
                        <div className="inline-edit" style={{ marginTop: 10, background: "var(--surface)", padding: 8, borderRadius: 6 }}>
                          <select value={selectedEnseignant} onChange={(e) => setSelectedEnseignant(e.target.value)}>
                            <option value="">-- Choisir un encadreur --</option>
                            {enseignants.map((ens) => (
                              <option key={ens.enseignant_id} value={ens.id}>
                                {ens.nom} ({ens.specialite})
                              </option>
                            ))}
                          </select>
                          <button className="btn btn-primary" onClick={() => confirmerAffectation(m.id)}>Confirmer</button>
                          <button className="btn btn-ghost" onClick={annulerAffectation}>Annuler</button>
                        </div>
                      ) : (
                        (peutValiderSujet || (estAdmin && m.statut === "valide")) && (
                          <div className="actions-row" style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                            {m.statut === "propose" && peutValiderSujet && (
                              <>
                                <button className="btn btn-primary" style={{ minHeight: 30, fontSize: 12 }} onClick={() => handleValider(m.id)}>Valider Sujet</button>
                                <button className="btn btn-danger" style={{ minHeight: 30, fontSize: 12 }} onClick={() => handleRejeter(m.id)}>Rejeter</button>
                              </>
                            )}
                            {m.statut === "valide" && estAdmin && (
                              <button className="btn" style={{ minHeight: 30, fontSize: 12 }} onClick={() => ouvrirAffectation(m.id)}>Affecter un encadreur</button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Espace Suivi / Progression details */}
          {selectedMemoire && (
            <div className="card" style={{ padding: 24, position: "sticky", top: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                <div>
                  <h2>Suivi de Progression</h2>
                  <p className="dossier-meta">
                    Étudiant : {selectedMemoire.etudiant?.name || selectedMemoire.etudiant?.user?.name}
                  </p>
                </div>
                <button className="btn btn-ghost" onClick={() => { setSelectedMemoire(null); setSelectedVersion(null); }} style={{ minHeight: 30 }}>
                  Fermer
                </button>
              </div>

              {/* Defense eligibility switch */}
              {estEncadreur && !selectedMemoire.eligible_soutenance && selectedMemoire.statut === "valide_final" && (
                <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <p className="dossier-meta" style={{ color: "var(--ink)", fontWeight: "bold" }}>
                    ⚠️ Mémoire Validé Final. Voulez-vous accorder l'autorisation de soutenance ?
                  </p>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={() => handleAccorderEligibilite(selectedMemoire.id)}
                  >
                    Accorder l'Éligibilité Soutenance
                  </button>
                </div>
              )}

              {/* Student document upload form */}
              {estEtudiant && !selectedMemoire.eligible_soutenance && (
                <form onSubmit={handleUploadVersion} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 12, borderRadius: 8, marginBottom: 18 }}>
                  <p className="dossier-title" style={{ fontSize: 13, marginBottom: 8 }}>Déposer une nouvelle version :</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <select 
                      value={uploadForm.numero_version} 
                      onChange={(e) => setUploadForm({ ...uploadForm, numero_version: e.target.value })}
                      style={{ flex: 1 }}
                    >
                      <option value="v1">Version 1 (V1)</option>
                      <option value="v2">Version 2 (V2)</option>
                      <option value="v3">Version 3 (V3)</option>
                      <option value="finale">Version Finale</option>
                    </select>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      onChange={(e) => setUploadForm({ ...uploadForm, fichier: e.target.files[0] })}
                      style={{ fontSize: 12, flex: 2 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={uploadSubmitting}>
                    {uploadSubmitting ? "Téléversement..." : "Déposer le document"}
                  </button>
                </form>
              )}

              {/* Versions list */}
              <div>
                <h3>Historique des Versions Déposées</h3>
                {versionsLoading ? (
                  <p className="loading-state empty-state--compact">Chargement des documents...</p>
                ) : versions.length === 0 ? (
                  <p className="empty-state empty-state--compact">Aucun document déposé pour le moment.</p>
                ) : (
                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {versions.map((v) => (
                      <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, background: "var(--surface)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>{v.numero_version}</span>
                          <span className={`badge badge-${v.statut === "valide" ? "valide" : "en_cours"}`} style={{ fontSize: 10 }}>
                            {v.statut}
                          </span>
                        </div>
                        <p className="dossier-meta" style={{ fontStyle: "italic", fontSize: 11, marginTop: 2 }}>
                          {v.fichier_nom_original} (Progression : <strong>{v.pourcentage_avancement || 0}%</strong>)
                        </p>
                        
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button className="btn btn-ghost" style={{ minHeight: 28, padding: "2px 8px", fontSize: 11 }} onClick={() => handleDownloadVersion(v)}>
                            Télécharger 📥
                          </button>
                          {estEncadreur && v.statut !== "valide" && (
                            <button className="btn" style={{ minHeight: 28, padding: "2px 8px", fontSize: 11 }} onClick={() => handleSelectVersion(v)}>
                              Évaluer / Recommander ✍️
                            </button>
                          )}
                          {estEncadreur && v.statut !== "valide" && v.pourcentage_avancement >= 80 && (
                            <button className="btn btn-primary" style={{ minHeight: 28, padding: "2px 8px", fontSize: 11 }} onClick={() => handleValiderFinale(v.id)}>
                              Valider Finale ✓
                            </button>
                          )}
                        </div>

                        {/* Annotations / feedback history if existing */}
                        {(v.commentaires_encadreur || v.recommandations || v.annotations || (v.corrections && v.corrections.length > 0)) && (
                          <div style={{ marginTop: 8, borderTop: "1px dashed var(--border)", paddingTop: 6, fontSize: 11, color: "var(--ink-soft)" }}>
                            {v.annotations && <p style={{ margin: "2px 0" }}><strong>Annotations :</strong> "{v.annotations}"</p>}
                            {v.commentaires_encadreur && <p style={{ margin: "2px 0" }}><strong>Remarques :</strong> "{v.commentaires_encadreur}"</p>}
                            {v.recommandations && <p style={{ margin: "2px 0" }}><strong>Conseils :</strong> "{v.recommandations}"</p>}
                            {v.corrections && v.corrections.length > 0 && (
                              <div style={{ marginTop: 6, borderTop: "1px dashed var(--border)", paddingTop: 6 }}>
                                <p style={{ fontWeight: "bold", fontSize: 11, color: "#EF4444", marginBottom: 4 }}>Demandes de corrections formelles :</p>
                                <div style={{ display: "grid", gap: 6 }}>
                                  {v.corrections.map((c) => (
                                    <div key={c.id} style={{ padding: "6px 10px", background: "rgba(239, 68, 68, 0.05)", borderLeft: "2px solid #EF4444", borderRadius: "0 6px 6px 0" }}>
                                      <p style={{ margin: 0, fontStyle: "italic", fontSize: 11 }}>"{c.commentaire}"</p>
                                      <span style={{ fontSize: 9, opacity: 0.5, display: "block", marginTop: 2 }}>Par {c.auteur?.name || "Encadreur"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Comment reply section */}
                            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                              <input
                                type="text"
                                value={newComments[v.id] || ""}
                                onChange={(e) => setNewComments({ ...newComments, [v.id]: e.target.value })}
                                placeholder="Répondre ou commenter..."
                                style={{
                                  flex: 1,
                                  minHeight: 32,
                                  fontSize: 11,
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  border: "1px solid var(--border)",
                                  background: "rgba(255, 255, 255, 0.03)",
                                  color: "var(--ink)",
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ minHeight: 32, padding: "4px 10px", fontSize: 11, borderRadius: 6 }}
                                onClick={() => handlePostComment(v.id)}
                              >
                                Envoyer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Version Evaluation Workspace (Inline Form) */}
              {selectedVersion && (
                <form onSubmit={handleSaveEvaluation} style={{ marginTop: 20, borderTop: "2px solid var(--border)", paddingTop: 16 }}>
                  <h3>Évaluer la Version ({selectedVersion.numero_version.toUpperCase()})</h3>
                  
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label>Pourcentage d'Avancement (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={evalForm.pourcentage_avancement} 
                      onChange={(e) => setEvalForm({ ...evalForm, pourcentage_avancement: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Annotations dans le texte</label>
                    <input 
                      type="text" 
                      value={evalForm.annotations} 
                      onChange={(e) => setEvalForm({ ...evalForm, annotations: e.target.value })} 
                      placeholder="Ex: Titre section 3 incorrect..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Commentaires / Remarques de l'encadreur</label>
                    <textarea 
                      value={evalForm.commentaires_encadreur} 
                      onChange={(e) => setEvalForm({ ...evalForm, commentaires_encadreur: e.target.value })} 
                      rows={2} 
                      placeholder="Remarques sur la progression..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Recommandations d'amélioration</label>
                    <textarea 
                      value={evalForm.recommandations} 
                      onChange={(e) => setEvalForm({ ...evalForm, recommandations: e.target.value })} 
                      rows={2}
                      placeholder="Actions attendues pour la prochaine version..."
                    />
                  </div>

                  <div className="form-group" style={{ background: "var(--danger-bg)", padding: 10, borderRadius: 6, border: "1px solid var(--border)" }}>
                    <label style={{ color: "var(--ink)", fontWeight: "bold" }}>Demander des corrections formelles ?</label>
                    <input 
                      type="text" 
                      value={evalForm.commentaire} 
                      onChange={(e) => setEvalForm({ ...evalForm, commentaire: e.target.value })} 
                      placeholder="Saisissez un commentaire pour repasser le sujet en modification obligatoire"
                      style={{ marginTop: 6 }}
                    />
                    <p style={{ fontSize: 10, color: "var(--ink-muted)", margin: "4px 0 0 0" }}>
                      Si ce champ est rempli, le mémoire sera renvoyé à l'état "Corrections demandées".
                    </p>
                  </div>

                  <div className="actions-row" style={{ marginTop: 16 }}>
                    <button type="submit" className="btn btn-primary" disabled={evalSubmitting}>
                      {evalSubmitting ? "Enregistrement..." : "Enregistrer l'évaluation"}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setSelectedVersion(null)}>
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
