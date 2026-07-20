import { useState, useEffect } from "react";
import { administrationApi } from "../../../shared/api/administrationApi";

const NIVEAUX = ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"];

const FILIERES = [
  "Génie Énergétique et Environnement",
  "Systèmes d'Information et Management de la Transition Numérique",
  "Cybersécurité et Réseaux",
  "Digital et Management des Entreprises",
];

const CHAMP_INITIAL = {
  name: "",
  email: "",
  password: "",
  date_debut_acces: "",
  date_fin_acces: "",
  matricule: "",
  filiere: "",
  niveau: "",
  specialite: "",
  capacite_encadrement: "5",
};

export default function CreerCompteModal({ type, account, onClose, onCompteCree }) {
  const [champs, setChamps] = useState(CHAMP_INITIAL);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      // Map existing account details for editing
      if (type === "etudiant") {
        setChamps({
          name: account.user?.name || "",
          email: account.user?.email || "",
          password: "",
          matricule: account.matricule || "",
          filiere: account.filiere || "",
          niveau: account.niveau || "",
        });
      } else if (type === "enseignant") {
        setChamps({
          name: account.user?.name || "",
          email: account.user?.email || "",
          password: "",
          specialite: account.specialite || "",
          capacite_encadrement: account.capacite_encadrement?.toString() || "5",
        });
      } else if (type === "jury") {
        setChamps({
          name: account.name || "",
          email: account.email || "",
          password: "",
          date_debut_acces: account.date_debut_acces ? account.date_debut_acces.slice(0, 10) : "",
          date_fin_acces: account.date_expiration ? account.date_expiration.slice(0, 10) : "",
        });
      }
    } else {
      setChamps(CHAMP_INITIAL);
    }
  }, [account, type]);

  const setChamp = (nom) => (e) => setChamps((prev) => ({ ...prev, [nom]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = {
      name: champs.name,
      email: champs.email,
    };

    // Password is only included if written (required for new accounts, optional for updates)
    if (champs.password) {
      data.password = champs.password;
    } else if (!account) {
      setError("Le mot de passe est obligatoire pour la création de compte.");
      setLoading(false);
      return;
    }

    if (type === "etudiant") {
      data.matricule = champs.matricule;
      data.filiere = champs.filiere;
      data.niveau = champs.niveau;
    }
    if (type === "enseignant") {
      data.specialite = champs.specialite || undefined;
      data.capacite_encadrement = parseInt(champs.capacite_encadrement, 10) || 5;
    }
    if (type === "jury") {
      data.date_debut_acces = champs.date_debut_acces || null;
      data.date_fin_acces = champs.date_fin_acces || null;
    }

    try {
      let reponse;
      if (account) {
        // Edit Mode
        if (type === "etudiant") {
          reponse = await administrationApi.modifierEtudiant(account.id, data);
        } else if (type === "enseignant") {
          reponse = await administrationApi.modifierEnseignant(account.id, data);
        } else if (type === "jury") {
          reponse = await administrationApi.modifierJury(account.id, data);
        }
      } else {
        // Create Mode
        if (type === "etudiant") {
          reponse = await administrationApi.creerCompteEtudiant(data);
        } else if (type === "enseignant") {
          reponse = await administrationApi.creerCompteEnseignant(data);
        } else if (type === "jury") {
          reponse = await administrationApi.creerCompteJury(data);
        }
      }

      onCompteCree?.(reponse.data);
      onClose();
    } catch (err) {
      const messages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.message || "Une erreur est survenue.";
      setError(messages);
    } finally {
      setLoading(false);
    }
  };

  const titreModal = account 
    ? `Modifier le compte ${type === "etudiant" ? "étudiant" : type === "enseignant" ? "enseignant" : "jury"}`
    : `Créer un compte ${type === "etudiant" ? "étudiant" : type === "enseignant" ? "enseignant" : "jury"}`;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: 480, maxHeight: "90vh", overflowY: "auto", margin: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{titreModal}</h2>
        <p className="dossier-meta" style={{ marginBottom: 20 }}>
          {account 
            ? "Mettez à jour les détails du profil. Laissez le champ mot de passe vide pour conserver le mot de passe actuel." 
            : "Saisissez les informations de connexion et les détails du profil. Les identifiants seront envoyés par email."}
        </p>

        <div className="form-group">
          <label>Nom complet</label>
          <input type="text" value={champs.name} onChange={setChamp("name")} required placeholder="Ex: Jean Dupont" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email de connexion</label>
            <input type="email" value={champs.email} onChange={setChamp("email")} required placeholder="jean.dupont@univ.edu" />
          </div>
          <div className="form-group">
            <label>{account ? "Nouveau mot de passe" : "Mot de passe initial"}</label>
            <input 
              type="password" 
              value={champs.password} 
              onChange={setChamp("password")} 
              minLength={8} 
              required={!account} 
              placeholder={account ? "Laisser vide si inchangé" : "Min. 8 caractères"} 
            />
          </div>
        </div>

        {type === "etudiant" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Numéro Matricule</label>
                <input type="text" value={champs.matricule} onChange={setChamp("matricule")} required placeholder="E2026-X1" />
              </div>
              <div className="form-group">
                <label>Filière académique</label>
                <select value={champs.filiere} onChange={setChamp("filiere")} required>
                  <option value="">-- Choisir --</option>
                  {FILIERES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Niveau d'études</label>
              <select value={champs.niveau} onChange={setChamp("niveau")} required>
                <option value="">-- Choisir --</option>
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <p className="dossier-meta" style={{ color: "var(--success)" }}>✓ Les comptes étudiants sont permanents et n'expirent jamais.</p>
          </>
        )}

        {type === "enseignant" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Spécialité / Département</label>
                <input type="text" value={champs.specialite} onChange={setChamp("specialite")} placeholder="Ex: Réseaux & Télécoms" />
              </div>
              <div className="form-group">
                <label>Capacité max. d'encadrement</label>
                <input type="number" min="1" max="25" value={champs.capacite_encadrement} onChange={setChamp("capacite_encadrement")} required />
              </div>
            </div>
            <p className="dossier-meta" style={{ color: "var(--success)" }}>✓ Les comptes enseignants/encadreurs sont permanents et n'expirent jamais.</p>
          </>
        )}

        {type === "jury" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Date début d'accès</label>
                <input type="date" value={champs.date_debut_acces} onChange={setChamp("date_debut_acces")} />
              </div>
              <div className="form-group">
                <label>Date fin d'accès (Expiration)</label>
                <input type="date" value={champs.date_fin_acces} onChange={setChamp("date_fin_acces")} />
              </div>
            </div>
            <p className="dossier-meta" style={{ color: "var(--warning)" }}>⚠️ Le compte jury possède une validité limitée dans le temps et expirera automatiquement à la date de fin.</p>
          </>
        )}

        {error && <p className="error-text" style={{ marginTop: 15 }}>{error}</p>}

        <div className="actions-row" style={{ marginTop: 25 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Enregistrement..." : account ? "Enregistrer" : "Créer le compte"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
