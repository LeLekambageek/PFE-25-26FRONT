import { useEffect, useState } from "react";
import apiClient from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/AuthContext";

export default function StagesListPage() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get("/stages")
      .then(({ data }) => setStages(data.data))
      .catch(() => setError("Impossible de charger les stages."))
      .finally(() => setLoading(false));
  }, []);

  const handleValider = async (stageId) => {
    try {
      await apiClient.post(`/stages/${stageId}/valider`);
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, statut: "valide" } : s))
      );
    } catch (err) {
      alert("Validation impossible : " + (err.response?.data?.message || "erreur inconnue"));
    }
  };

  const peutValider = user?.roles?.some(
    (r) => r.name === "enseignant_encadreur" || r.name === "responsable_formation"
  );

  if (loading) return <p>Chargement des stages...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Mes stages</h1>
      {stages.length === 0 && <p>Aucun stage pour le moment.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {stages.map((stage) => (
          <li
            key={stage.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <strong>{stage.titre}</strong>
            <p style={{ margin: "4px 0", color: "#666" }}>
              Statut : <span style={{ fontWeight: "bold" }}>{stage.statut}</span>
            </p>
            {peutValider && stage.statut === "en_attente" && (
              <button onClick={() => handleValider(stage.id)}>Valider</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}