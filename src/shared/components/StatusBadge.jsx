const LABELS = {
  en_attente: "En attente de validation",
  propose: "Sujet soumis",
  valide: "Sujet approuvé",
  valide_final: "Mémoire finalisé",
  rejete: "Non retenu",
  actif: "En cours",
  en_cours: "En cours de rédaction",
  termine: "Soutenu et clôturé",
  terminee: "Soutenance terminée",
  planifiee: "Soutenance programmée",
  brouillon: "Brouillon",
  soutenu: "Soutenu",
};

export default function StatusBadge({ statut }) {
  if (!statut) return null;
  return (
    <span className={`badge badge-${statut}`}>
      {LABELS[statut] || statut.replace(/_/g, " ")}
    </span>
  );
}
