import { useState, useEffect } from "react";
import { administrationApi } from "../../../shared/api/administrationApi";
import CreerCompteModal from "../components/CreerCompteModal";

export default function ComptesListPage() {
  const [onglet, setOnglet] = useState("etudiant"); // etudiant, enseignant, jury
  const [liste, setListe] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [compteAEditer, setCompteAEditer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    chargerComptes();
  }, [onglet, currentPage]);

  const chargerComptes = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (onglet === "etudiant") {
        response = await administrationApi.listerEtudiants();
      } else if (onglet === "enseignant") {
        response = await administrationApi.getComptesEnseignants();
      } else if (onglet === "jury") {
        response = await administrationApi.getComptesJury();
      }

      // Handle paginated response or raw array
      const rawData = response.data;
      if (rawData.data && Array.isArray(rawData.data)) {
        setListe(rawData.data);
        setCurrentPage(rawData.current_page || 1);
        setTotalPages(rawData.last_page || 1);
      } else {
        setListe(Array.isArray(rawData) ? rawData : []);
        setTotalPages(1);
      }
    } catch (err) {
      setError("Impossible de charger les comptes pour cet onglet.");
      setListe([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimer = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce compte ? Toutes les données associées seront perdues.")) {
      return;
    }
    try {
      if (onglet === "etudiant") {
        await administrationApi.supprimerEtudiant(id);
      } else if (onglet === "enseignant") {
        await administrationApi.supprimerEnseignant(id);
      } else if (onglet === "jury") {
        await administrationApi.supprimerJury(id);
      }
      alert("Compte supprimé avec succès.");
      chargerComptes();
    } catch (err) {
      alert("Erreur lors de la suppression : " + (err.response?.data?.message || "Action non autorisée."));
    }
  };

  const handleReinitialiserPassword = async (userId) => {
    const nouveauPass = window.prompt("Saisissez le nouveau mot de passe temporaire (min. 8 caractères) :");
    if (nouveauPass === null) return;
    if (nouveauPass.length < 8) {
      alert("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    try {
      await administrationApi.reinitialiserMotDePasse(userId, { password: nouveauPass });
      alert("Mot de passe réinitialisé. Les nouveaux identifiants ont été envoyés par email.");
    } catch (err) {
      alert("Erreur : " + (err.response?.data?.message || "Action impossible."));
    }
  };

  const filtrerComptes = () => {
    if (!recherche.trim()) return liste;
    const query = recherche.toLowerCase();
    return liste.filter((item) => {
      const nom = (item.user?.name || item.name || "").toLowerCase();
      const email = (item.user?.email || item.email || "").toLowerCase();
      const matricule = (item.matricule || "").toLowerCase();
      return nom.includes(query) || email.includes(query) || matricule.includes(query);
    });
  };

  const comptesFiltrés = filtrerComptes();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestion des Comptes Utilisateurs</h1>
          <p>Consultez, créez, modifiez ou supprimez les comptes des étudiants, enseignants et membres du jury.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setCompteAEditer(null);
            setModalOuverte(true);
          }}
        >
          Créer un compte {onglet === "etudiant" ? "étudiant" : onglet === "enseignant" ? "enseignant" : "jury"}
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="tabs" style={{ display: "flex", gap: 10, borderBottom: "2px solid var(--border)", marginBottom: 24, paddingBottom: 8 }}>
        <button
          className={`btn ${onglet === "etudiant" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => { setOnglet("etudiant"); setCurrentPage(1); }}
        >
          Étudiants
        </button>
        <button
          className={`btn ${onglet === "enseignant" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => { setOnglet("enseignant"); setCurrentPage(1); }}
        >
          Enseignants Encadreurs
        </button>
        <button
          className={`btn ${onglet === "jury" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => { setOnglet("jury"); setCurrentPage(1); }}
        >
          Membres du Jury
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Chargement des comptes...</div>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : comptesFiltrés.length === 0 ? (
        <p className="empty-state">Aucun compte trouvé.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {comptesFiltrés.map((item) => {
            const userId = item.user?.id || item.id;
            const nom = item.user?.name || item.name;
            const email = item.user?.email || item.email;

            return (
              <div key={item.id} className="dossier">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <p className="dossier-title">{nom}</p>
                    {onglet === "etudiant" && (
                      <span className="badge badge-en_cours" style={{ fontSize: 11 }}>
                        Matricule: {item.matricule}
                      </span>
                    )}
                  </div>
                  <p className="dossier-meta" style={{ marginTop: 4 }}>
                    Email: <strong>{email}</strong>
                  </p>

                  {onglet === "etudiant" && (
                    <p className="dossier-meta" style={{ marginTop: 2 }}>
                      Filière: {item.filiere} — Niveau: {item.niveau}
                    </p>
                  )}

                  {onglet === "enseignant" && (
                    <p className="dossier-meta" style={{ marginTop: 2 }}>
                      Spécialité: {item.specialite || "Généraliste"} — Capacité d'encadrement: <strong>{item.capacite_encadrement}</strong> étudiants
                    </p>
                  )}

                  {onglet === "jury" && (
                    <div style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <p className="dossier-meta">
                        Accès du : <strong>{item.date_debut_acces ? new Date(item.date_debut_acces).toLocaleDateString("fr-FR") : "Immédiat"}</strong> au{" "}
                        <strong>{item.date_expiration ? new Date(item.date_expiration).toLocaleDateString("fr-FR") : "Permanent"}</strong>
                      </p>
                      {item.date_expiration && new Date(item.date_expiration) < new Date() ? (
                        <span className="badge badge-rejete" style={{ fontSize: 10 }}>Accès expiré</span>
                      ) : (
                        <span className="badge badge-valide" style={{ fontSize: 10 }}>Accès actif</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="actions-row">
                  <button
                    className="btn"
                    onClick={() => {
                      setCompteAEditer(item);
                      setModalOuverte(true);
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleReinitialiserPassword(userId)}
                    title="Changer le mot de passe et notifier l'utilisateur"
                  >
                    RàZ Identifiants
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleSupprimer(item.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button
            className="btn btn-ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
          >
            Précédent
          </button>
          <span style={{ display: "flex", alignItems: "center", padding: "0 10px" }}>
            Page {currentPage} sur {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Account Modal */}
      {modalOuverte && (
        <CreerCompteModal
          type={onglet}
          account={compteAEditer}
          onClose={() => {
            setModalOuverte(false);
            setCompteAEditer(null);
          }}
          onCompteCree={() => {
            chargerComptes();
            alert(compteAEditer ? "Compte mis à jour avec succès." : "Compte créé avec succès et identifiants envoyés.");
          }}
        />
      )}
    </div>
  );
}
