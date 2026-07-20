import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";
import EncadrementForm from "../components/EncadrementForm";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function EncadrementsListPage() {
  const { user } = useAuth();
  const [encadrements, setEncadrements] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");

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
    apiClient.get("/annuaire/enseignants").then(({ data }) => setEnseignants(data)).catch(() => {});
  }, []);

  const handleEncadrementCreated = (nouvel) => {
    setEncadrements((prev) => [nouvel, ...prev]);
  };

  const handleAjouterEntree = async (encadrementId) => {
    const contenu = prompt("Contenu de l'entrée :");
    if (!contenu) return;

    try {
      await apiClient.post(`/encadrements/${encadrementId}/entree`, { contenu });
      alert("Entrée ajoutée.");
    } catch (err) {
      alert("Action impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handlePlanifierRdv = async (encadrementId) => {
    const datePrevue = prompt("Date et heure du rendez-vous (format: 2026-08-15 14:00:00) :");
    if (!datePrevue) return;
    const sujet = prompt("Sujet du rendez-vous (optionnel) :") || null;

    try {
      await apiClient.post(`/encadrements/${encadrementId}/rendez-vous`, {
        date_prevue: datePrevue,
        sujet,
      });
      alert("Rendez-vous planifié.");
    } catch (err) {
      alert("Action impossible : " + (err.response?.data?.message || "erreur inconnue"));
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
    try {
      await apiClient.post(`/encadrements/${encadrementId}/cloturer`);
      chargerEncadrements();
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
        <div key={enc.id} className={`dossier dossier-full status-${enc.statut}`}>
          <div className="dossier-head">
            <p className="dossier-title">Encadrement #{enc.id} — {enc.type}</p>
            <StatusBadge statut={enc.statut} />
          </div>

          {editingId === enc.id ? (
            <div className="inline-edit">
              <select value={selectedEnseignant} onChange={(e) => setSelectedEnseignant(e.target.value)}>
                <option value="">-- Choisir un enseignant --</option>
                {enseignants.map((ens) => (
                  <option key={ens.enseignant_id} value={ens.enseignant_id}>
                    {ens.nom} ({ens.specialite})
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={() => confirmerModification(enc.id)}>Confirmer</button>
              <button className="btn btn-ghost" onClick={annulerEdition}>Annuler</button>
            </div>
          ) : (
            <div className="actions-row">
              {peutAjouterEntree && (
                <button className="btn" onClick={() => handleAjouterEntree(enc.id)}>Ajouter une entrée</button>
              )}
              {peutGererEnseignant && (
                <button className="btn" onClick={() => handlePlanifierRdv(enc.id)}>Planifier un rendez-vous</button>
              )}
              {peutModifier && (
                <button className="btn" onClick={() => ouvrirEdition(enc)}>Modifier l'enseignant</button>
              )}
              {peutGererEnseignant && enc.statut === "actif" && (
                <button className="btn btn-danger" onClick={() => handleCloturer(enc.id)}>Clôturer</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
