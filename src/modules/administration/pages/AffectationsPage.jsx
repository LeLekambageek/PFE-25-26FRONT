import { useState, useEffect } from "react";
import apiClient from "../../../shared/api/apiClient";
import { administrationApi } from "../../../shared/api/administrationApi";
import { Plus, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";

export default function AffectationsPage() {
  const [onglet, setOnglet] = useState("candidatures"); // candidatures, encadreurs
  const [candidatures, setCandidatures] = useState([]);
  const [stages, setStages] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [etudiantsAnnuaire, setEtudiantsAnnuaire] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals / forms state
  const [candidaturePourStage, setCandidaturePourStage] = useState(null);
  const [stagePourEncadreur, setStagePourEncadreur] = useState(null);
  const [afficherDirectModal, setAfficherDirectModal] = useState(false);

  // Form states
  const [stageForm, setStageForm] = useState({
    titre: "",
    description: "",
    entreprise_id: "",
    date_debut: "",
    date_fin: "",
  });

  const [directStageForm, setDirectStageForm] = useState({
    etudiant_id: "",
    entreprise_id: "",
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
  });

  const [selectedEncadreurId, setSelectedEncadreurId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, [onglet]);

  const chargerDonnees = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onglet === "candidatures") {
        const [candidaturesRes, entreprisesRes, etudiantsRes] = await Promise.all([
          administrationApi.getCandidatures(),
          administrationApi.getEntreprises(),
          apiClient.get("/annuaire/etudiants").catch(() => ({ data: [] })),
        ]);
        setCandidatures(candidaturesRes.data?.data || candidaturesRes.data || []);
        setEntreprises(entreprisesRes.data || []);
        setEtudiantsAnnuaire(etudiantsRes.data || []);
      } else {
        const [stagesRes, enseignantsRes] = await Promise.all([
          apiClient.get("/stages"),
          administrationApi.getComptesEnseignants(),
        ]);
        setStages(stagesRes.data?.data || stagesRes.data || []);
        setEnseignants(enseignantsRes.data?.data || enseignantsRes.data || []);
      }
    } catch (err) {
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleTraiterCandidature = async (id, nouveauStatut) => {
    const commentaire = window.prompt("Ajouter des observations/commentaire (optionnel) :");
    if (commentaire === null) return;

    try {
      await administrationApi.validerCandidature(id, {
        statut: nouveauStatut,
        commentaire_admin: commentaire,
      });
      alert(`Candidature mise à jour (${nouveauStatut}).`);
      chargerDonnees();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || "Action impossible."));
    }
  };

  const handleAffecterStageSubmit = async (e) => {
    e.preventDefault();
    if (!candidaturePourStage) return;
    setSubmitting(true);
    try {
      await administrationApi.affecterStage(candidaturePourStage.id, {
        titre: stageForm.titre,
        description: stageForm.description,
        entreprise_id: stageForm.entreprise_id,
        date_debut: stageForm.date_debut,
        date_fin: stageForm.date_fin,
      });
      alert("Stage affecté avec succès ! Vous pouvez maintenant lui attribuer un encadreur.");
      setCandidaturePourStage(null);
      setStageForm({ titre: "", description: "", entreprise_id: "", date_debut: "", date_fin: "" });
      chargerDonnees();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || "Remplissez tous les champs correctement."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectStageSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/stages", {
        etudiant_id: parseInt(directStageForm.etudiant_id, 10),
        entreprise_id: parseInt(directStageForm.entreprise_id, 10),
        titre: directStageForm.titre,
        description: directStageForm.description,
        date_debut: directStageForm.date_debut,
        date_fin: directStageForm.date_fin,
      });
      alert("Stage créé et affecté directement avec succès !");
      setAfficherDirectModal(false);
      setDirectStageForm({ etudiant_id: "", entreprise_id: "", titre: "", description: "", date_debut: "", date_fin: "" });
      chargerDonnees();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || "Veuillez remplir tous les champs obligatoires."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAffecterEncadreurSubmit = async (e) => {
    e.preventDefault();
    if (!stagePourEncadreur || !selectedEncadreurId) return;
    setSubmitting(true);
    try {
      await administrationApi.affecterEtudiantEncadreur(stagePourEncadreur.id, selectedEncadreurId);
      alert("Enseignant encadreur affecté avec succès à l'étudiant !");
      setStagePourEncadreur(null);
      setSelectedEncadreurId("");
      chargerDonnees();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.message || "Action impossible."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestion des Affectations (Stages & Encadrement)</h1>
          <p>
            Respectez le workflow séquentiel : <strong>1. Affectez un stage</strong> à partir d'une candidature retenue (ou créez-en un directement), 
            puis <strong>2. Attribuez un encadreur</strong> au stage actif.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", gap: 10, borderBottom: "2px solid var(--border)", marginBottom: 24, paddingBottom: 8 }}>
        <button
          className={`btn ${onglet === "candidatures" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setOnglet("candidatures")}
        >
          1. Candidatures & Affectation de Stage
        </button>
        <button
          className={`btn ${onglet === "encadreurs" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setOnglet("encadreurs")}
        >
          2. Attribution d'Encadreurs
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <div className="loading-state">Chargement des données...</div>
      ) : onglet === "candidatures" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Candidatures de stages reçues</h3>
            <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setAfficherDirectModal(true)}>
              <Plus size={16} /> Créer un stage directement (Hors cand.)
            </button>
          </div>

          {candidatures.length === 0 ? (
            <p className="empty-state">Aucune candidature de stage enregistrée.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {candidatures.map((c) => (
                <div key={c.id} className={`dossier status-${c.statut}`}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <p className="dossier-title">{c.titre_poste}</p>
                      <span className={`badge badge-${c.statut}`}>{c.statut}</span>
                    </div>
                    <p className="dossier-meta" style={{ marginTop: 6 }}>
                      Étudiant : <strong>{c.etudiant?.user?.name}</strong> — Entreprise : <strong>{c.entreprise?.raison_sociale || "Non spécifiée"}</strong>
                    </p>
                    <p className="dossier-meta" style={{ marginTop: 2 }}>
                      Date candidature : {new Date(c.date_candidature).toLocaleDateString("fr-FR")}
                    </p>
                    {c.commentaire_admin && (
                      <p className="dossier-meta" style={{ marginTop: 6, fontStyle: "italic", background: "rgba(255,255,255,0.06)", padding: 6, borderRadius: 4 }}>
                        Observations admin : "{c.commentaire_admin}"
                      </p>
                    )}
                    <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                      {c.cv_path && (
                        <a href={`${apiClient.defaults.baseURL?.replace("/api", "")}/storage/${c.cv_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--gts-secondary)", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 3 }}>
                          Voir le CV <ExternalLink size={13} />
                        </a>
                      )}
                      {c.lettre_motivation_path && (
                        <a href={`${apiClient.defaults.baseURL?.replace("/api", "")}/storage/${c.lettre_motivation_path}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--gts-secondary)", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 3 }}>
                          Lettre de motivation <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="actions-row">
                    {c.statut === "en_attente" && (
                      <>
                        <button className="btn btn-primary" onClick={() => handleTraiterCandidature(c.id, "retenue")}>
                          Retenir
                        </button>
                        <button className="btn btn-danger" onClick={() => handleTraiterCandidature(c.id, "rejetee")}>
                          Rejeter
                        </button>
                      </>
                    )}
                    {c.statut === "retenue" && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setStageForm((prev) => ({
                            ...prev,
                            titre: c.titre_poste,
                            entreprise_id: c.entreprise_id || "",
                          }));
                          setCandidaturePourStage(c);
                        }}
                      >
                        Affecter le Stage
                      </button>
                    )}
                    {c.statut === "stage_affecte" && (
                      <span style={{ fontSize: 12, color: "var(--success)", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={14} /> Stage déjà affecté
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {stages.length === 0 ? (
            <p className="empty-state">Aucun stage actif.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {stages.map((s) => (
                <div key={s.id} className="dossier">
                  <div style={{ flex: 1 }}>
                    <p className="dossier-title">{s.titre}</p>
                    <p className="dossier-meta" style={{ marginTop: 4 }}>
                      Étudiant : <strong>{s.etudiant?.user?.name}</strong> — Entreprise : <strong>{s.entreprise?.raison_sociale}</strong>
                    </p>
                    <p className="dossier-meta" style={{ marginTop: 2 }}>
                      Dates : du {new Date(s.date_debut).toLocaleDateString("fr-FR")} au {new Date(s.date_fin).toLocaleDateString("fr-FR")}
                    </p>
                    <div style={{ marginTop: 6 }}>
                      {s.encadreur ? (
                        <span className="badge badge-valide" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                          Encadré par : {s.encadreur.user?.name}
                        </span>
                      ) : (
                        <span className="badge badge-rejete" style={{ background: "var(--warning-bg)", color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <AlertTriangle size={13} /> Aucun Enseignant Encadreur assigné
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="actions-row">
                    {!s.encadreur && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setStagePourEncadreur(s)}
                      >
                        Affecter un Encadreur
                      </button>
                    )}
                    {s.encadreur && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => setStagePourEncadreur(s)}
                      >
                        Changer d'Encadreur
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Affectation de Stage (From Candidacy) */}
      {candidaturePourStage && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setCandidaturePourStage(null)}
        >
          <form
            onSubmit={handleAffecterStageSubmit}
            className="card"
            style={{ width: 480, margin: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Créer l'Affectation de Stage</h2>
            <p className="dossier-meta" style={{ marginBottom: 20 }}>
              Vous affectez un stage à l'étudiant <strong>{candidaturePourStage.etudiant?.user?.name}</strong>. L'encadreur sera attribué ultérieurement.
            </p>

            <div className="form-group">
              <label>Titre du Stage</label>
              <input
                type="text"
                value={stageForm.titre}
                onChange={(e) => setStageForm({ ...stageForm, titre: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Entreprise d'accueil</label>
              <select
                value={stageForm.entreprise_id}
                onChange={(e) => setStageForm({ ...stageForm, entreprise_id: e.target.value })}
                required
              >
                <option value="">-- Choisir --</option>
                {entreprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>{ent.raison_sociale}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  value={stageForm.date_debut}
                  onChange={(e) => setStageForm({ ...stageForm, date_debut: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={stageForm.date_fin}
                  onChange={(e) => setStageForm({ ...stageForm, date_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description du sujet (Optionnel)</label>
              <textarea
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="actions-row" style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Affectation..." : "Valider l'affectation"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setCandidaturePourStage(null)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Direct Stage Assignment (Hors candidature) */}
      {afficherDirectModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setAfficherDirectModal(false)}
        >
          <form
            onSubmit={handleDirectStageSubmit}
            className="card"
            style={{ width: 500, margin: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Créer un Stage Direct (Hors candidature)</h2>
            <p className="dossier-meta" style={{ marginBottom: 20 }}>
              Attribuez directement un stage officiel à un étudiant et liez-le obligatoirement à une entreprise partenaire.
            </p>

            <div className="form-group">
              <label>Étudiant ciblé</label>
              <select
                value={directStageForm.etudiant_id}
                onChange={(e) => setDirectStageForm({ ...directStageForm, etudiant_id: e.target.value })}
                required
              >
                <option value="">-- Choisir un étudiant --</option>
                {etudiantsAnnuaire.map((et) => (
                  <option key={et.etudiant_id} value={et.etudiant_id}>
                    {et.nom} (Matricule: {et.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Entreprise d'accueil (Obligatoire)</label>
              <select
                value={directStageForm.entreprise_id}
                onChange={(e) => setDirectStageForm({ ...directStageForm, entreprise_id: e.target.value })}
                required
              >
                <option value="">-- Choisir une entreprise --</option>
                {entreprises.map((ent) => (
                  <option key={ent.id} value={ent.id}>{ent.raison_sociale}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Titre du Stage</label>
              <input
                type="text"
                value={directStageForm.titre}
                onChange={(e) => setDirectStageForm({ ...directStageForm, titre: e.target.value })}
                required
                placeholder="Ex: Stage d'optimisation de..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  value={directStageForm.date_debut}
                  onChange={(e) => setDirectStageForm({ ...directStageForm, date_debut: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={directStageForm.date_fin}
                  onChange={(e) => setDirectStageForm({ ...directStageForm, date_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description du sujet (Optionnel)</label>
              <textarea
                value={directStageForm.description}
                onChange={(e) => setDirectStageForm({ ...directStageForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="actions-row" style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Affectation..." : "Confirmer l'affectation direct"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setAfficherDirectModal(false)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Attribution Encadreur */}
      {stagePourEncadreur && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setStagePourEncadreur(null)}
        >
          <form
            onSubmit={handleAffecterEncadreurSubmit}
            className="card"
            style={{ width: 440, margin: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Attribuer un Enseignant Encadreur</h2>
            <p className="dossier-meta" style={{ marginBottom: 20 }}>
              Attribuez un enseignant encadreur au stage de <strong>{stagePourEncadreur.etudiant?.user?.name}</strong> chez <strong>{stagePourEncadreur.entreprise?.raison_sociale}</strong>.
            </p>

            <div className="form-group">
              <label>Enseignant Encadreur</label>
              <select
                value={selectedEncadreurId}
                onChange={(e) => setSelectedEncadreurId(e.target.value)}
                required
              >
                <option value="">-- Choisir un encadreur --</option>
                {enseignants.map((ens) => (
                  <option key={ens.id} value={ens.id}>
                    {ens.user?.name} (Spécialité: {ens.specialite || "Généraliste"})
                  </option>
                ))}
              </select>
            </div>

            <div className="actions-row" style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Attribution..." : "Confirmer l'affectation"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setStagePourEncadreur(null)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
