import { useEffect, useState } from "react";
import { useAuth } from "../../../shared/auth/AuthContext";
import { bibliothequeApi } from "../../../shared/api/bibliothequeApi";
import DocumentForm from "../components/DocumentForm";

const TYPE_LABELS = {
  memoire: "Mémoire",
  rapport_stage: "Rapport de stage",
  autre: "Autre",
};

export default function BibliothequeListPage() {
  const { hasRole } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [typeDocument, setTypeDocument] = useState("");
  const [annee, setAnnee] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const peutGerer = hasRole("administration");

  const chargerDocuments = (params = {}) => {
    setLoading(true);
    bibliothequeApi
      .getDocuments(params)
      .then(({ data }) => setDocuments(data.data))
      .catch(() => setError("Impossible de charger la bibliothèque."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerDocuments();
  }, []);

  const handleFiltrer = (e) => {
    e.preventDefault();
    chargerDocuments({
      recherche: recherche || undefined,
      type_document: typeDocument || undefined,
      annee: annee || undefined,
    });
  };

  const handleReset = () => {
    setRecherche("");
    setTypeDocument("");
    setAnnee("");
    chargerDocuments();
  };

  const handleDocumentCreated = (nouveau) => {
    setDocuments((prev) => [nouveau, ...prev]);
    setShowForm(false);
  };

  const handleDownload = async (doc) => {
    try {
      const { data } = await bibliothequeApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.download = doc.titre;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Téléchargement impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const ouvrirEdition = (doc) => {
    setEditingId(doc.id);
    setEditValues({
      titre: doc.titre,
      auteur: doc.auteur || "",
      annee: doc.annee || "",
      mention: doc.mention || "",
      mots_cles: doc.mots_cles || "",
    });
  };

  const annulerEdition = () => {
    setEditingId(null);
    setEditValues({});
  };

  const confirmerEdition = async (documentId) => {
    try {
      const { data } = await bibliothequeApi.updateDocument(documentId, editValues);
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? data : d)));
      annulerEdition();
    } catch (err) {
      alert("Modification impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm("Supprimer définitivement ce document ?")) return;
    try {
      await bibliothequeApi.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) {
      alert("Suppression impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  if (loading) return <div className="loading-state">Chargement de la bibliothèque...</div>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Bibliothèque numérique</h1>
        <p>Consultez, recherchez et filtrez les mémoires et documents archivés.</p>
      </div>

      <form onSubmit={handleFiltrer} className="card">
        <div className="form-row">
          <div className="form-group">
            <label>Recherche (titre, auteur, mots-clés)</label>
            <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={typeDocument} onChange={(e) => setTypeDocument(e.target.value)}>
              <option value="">Tous</option>
              <option value="memoire">Mémoire</option>
              <option value="rapport_stage">Rapport de stage</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Année</label>
            <input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} min="1900" max="2100" />
          </div>
        </div>
        <div className="actions-row">
          <button type="submit" className="btn btn-primary">Filtrer</button>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>Réinitialiser</button>
        </div>
      </form>

      {peutGerer && (
        <div className="actions-row">
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Fermer" : "Archiver un document"}
          </button>
        </div>
      )}

      {peutGerer && showForm && <DocumentForm onDocumentCreated={handleDocumentCreated} />}

      {documents.length === 0 && <p className="empty-state">Aucun document trouvé.</p>}

      {documents.map((doc) => (
        <div key={doc.id} className="dossier dossier-full">
          <div className="dossier-head">
            <p className="dossier-title">{doc.titre}</p>
            <span className="badge">{TYPE_LABELS[doc.type_document] || doc.type_document}</span>
          </div>

          {editingId === doc.id ? (
            <div className="inline-edit">
              <input
                type="text"
                placeholder="Titre"
                value={editValues.titre}
                onChange={(e) => setEditValues((v) => ({ ...v, titre: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Auteur"
                value={editValues.auteur}
                onChange={(e) => setEditValues((v) => ({ ...v, auteur: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Année"
                value={editValues.annee}
                onChange={(e) => setEditValues((v) => ({ ...v, annee: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Mention"
                value={editValues.mention}
                onChange={(e) => setEditValues((v) => ({ ...v, mention: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Mots-clés"
                value={editValues.mots_cles}
                onChange={(e) => setEditValues((v) => ({ ...v, mots_cles: e.target.value }))}
              />
              <button className="btn btn-primary" onClick={() => confirmerEdition(doc.id)}>Enregistrer</button>
              <button className="btn btn-ghost" onClick={annulerEdition}>Annuler</button>
            </div>
          ) : (
            <>
              <p className="dossier-meta">
                {doc.auteur && <>Auteur : {doc.auteur}, </>}
                {doc.annee && <>Année : {doc.annee}, </>}
                {doc.mention && <>Mention : {doc.mention}, </>}
                {doc.mots_cles && <>Mots-clés : {doc.mots_cles}</>}
              </p>

              <div className="actions-row">
                <button className="btn" onClick={() => handleDownload(doc)}>Télécharger</button>
                {peutGerer && (
                  <>
                    <button className="btn" onClick={() => ouvrirEdition(doc)}>Modifier</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(doc.id)}>Supprimer</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
