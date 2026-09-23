import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import EncadrementForm from "../components/EncadrementForm";
import StatusBadge from "../../../shared/components/StatusBadge";

// Stage et mémoire ont des tables distinctes : deux encadrements peuvent avoir le même id.
// On identifie donc toujours un encadrement par son type + son id.
const cle = (enc) => `${enc.type}-${enc.id}`;
const urlEncadrement = (enc) => `/encadrements/${enc.type}/${enc.id}`;

const TYPE_LIBELLES = { stage: "Stage", memoire: "Mémoire" };

export default function EncadrementsListPage() {
  const { user } = useAuth();
  const [encadrements, setEncadrements] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");

  useEffect(() => {
    apiClient
      .get("/encadrements")
      .then(({ data }) =>
        setEncadrements(
          [...data.stages, ...data.memoires].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        )
      )
      .catch(() => setError("Impossible de charger les encadrements."))
      .finally(() => setLoading(false));
    apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data)).catch(() => {});
  }, []);

  const remplacer = (majEnc) => {
    setEncadrements((prev) => prev.map((e) => (cle(e) === cle(majEnc) ? majEnc : e)));
  };

  const handleEncadrementCreated = (nouvel) => {
    setEncadrements((prev) => [nouvel, ...prev]);
  };

  const handleAjouterEntree = async (enc) => {
    const contenu = prompt("Contenu de l'entrée :");
    if (!contenu) return;

    try {
      await apiClient.post(`${urlEncadrement(enc)}/entrees`, { contenu });
      alert("Entrée ajoutée.");
    } catch (err) {
      alert("Action impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handlePlanifierRdv = async (enc) => {
    const datePrevue = prompt("Date et heure du rendez-vous (format: 2026-08-15 14:00:00) :");
    if (!datePrevue) return;
    const sujet = prompt("Sujet du rendez-vous (optionnel) :") || null;

    try {
      await apiClient.post(`${urlEncadrement(enc)}/rendez-vous`, {
        date_prevue: datePrevue,
        sujet,
      });
      alert("Rendez-vous planifié.");
    } catch (err) {
      alert("Action impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const ouvrirEdition = (enc) => {
    setEditingKey(cle(enc));
    setSelectedEnseignant(enc.enseignant_id ?? "");
  };

  const annulerEdition = () => {
    setEditingKey(null);
    setSelectedEnseignant("");
  };

  const confirmerModification = async (enc) => {
    if (!selectedEnseignant) return;

    try {
      const { data } = await apiClient.put(urlEncadrement(enc), {
        enseignant_id: selectedEnseignant,
      });
      remplacer(data);
      annulerEdition();
    } catch (err) {
      alert("Modification impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleCloturer = async (enc) => {
    try {
      const { data } = await apiClient.post(`${urlEncadrement(enc)}/cloturer`);
      remplacer(data);
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
    <div>
      <div className="page-header">
        <h1>Encadrements</h1>
        <p>Suivi de la relation étudiant-encadreur (stage et mémoire).</p>
      </div>

      {peutCreer && <EncadrementForm onEncadrementCreated={handleEncadrementCreated} />}

      {encadrements.length === 0 && <p className="empty-state">Aucun encadrement pour le moment.</p>}

      {encadrements.map((enc) => (
        <div key={cle(enc)} className={`dossier dossier-full status-${enc.statut}`}>
          <div className="dossier-head">
            <p className="dossier-title">
              {TYPE_LIBELLES[enc.type]} — {enc.stage?.titre ?? enc.memoire?.titre ?? `#${enc.id}`}
            </p>
            <StatusBadge statut={enc.statut} />
          </div>
          <p className="dossier-meta">
            Étudiant : {enc.etudiant?.user?.name ?? "—"} · Encadreur : {enc.enseignant?.user?.name ?? "—"}
          </p>

          {editingKey === cle(enc) ? (
            <div className="inline-edit">
              <select value={selectedEnseignant} onChange={(e) => setSelectedEnseignant(e.target.value)}>
                <option value="">-- Choisir un enseignant --</option>
                {enseignants.map((ens) => (
                  <option key={ens.enseignant_id} value={ens.enseignant_id}>
                    {ens.nom} ({ens.specialite})
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => confirmerModification(enc)}>Confirmer</button>
              <button className="btn btn-ghost" onClick={annulerEdition}>Annuler</button>
            </div>
          ) : (
            <div className="actions-row">
              {peutAjouterEntree && (
                <button className="btn" onClick={() => handleAjouterEntree(enc)}>Ajouter une entrée</button>
              )}
              {peutGererEnseignant && (
                <button className="btn" onClick={() => handlePlanifierRdv(enc)}>Planifier un rendez-vous</button>
              )}
              {peutModifier && (
                <button className="btn" onClick={() => ouvrirEdition(enc)}>Modifier l'enseignant</button>
              )}
              {peutGererEnseignant && enc.statut === "actif" && (
                <button className="btn btn-danger" onClick={() => handleCloturer(enc)}>Clôturer</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
