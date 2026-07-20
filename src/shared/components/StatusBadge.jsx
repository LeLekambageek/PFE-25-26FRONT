const LABELS = {
  en_attente: "En attente",
  propose: "Proposé",
  valide: "Validé",
  valide_final: "Validé (final)",
  rejete: "Rejeté",
  actif: "Actif",
  en_cours: "En cours",
  termine: "Terminé",
  terminee: "Terminée",
  planifiee: "Planifiée",
  brouillon: "Brouillon",
  soutenu: "Terminé",
};

export default function StatusBadge({ statut }) {
  if (!statut) return null;
  return (
    <span className={`badge badge-${statut}`}>
      {LABELS[statut] || statut.replace(/_/g, " ")}
    </span>
  );
}
