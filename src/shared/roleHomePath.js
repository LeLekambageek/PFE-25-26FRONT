/**
 * Détermine la page d'accueil d'un utilisateur selon son rôle principal,
 * utilisé après connexion et pour la redirection racine "/".
 */
export function roleHomePath(user) {
  const roles = user?.roles?.map((r) => r.name) ?? [];

  if (roles.includes("etudiant")) return "/etudiant";
  if (roles.includes("enseignant_encadreur")) return "/encadreur";
  if (roles.includes("jury_soutenance")) return "/jury";
  if (roles.includes("responsable_relation_entreprise")) return "/entreprises";
  if (roles.includes("admin_general") || roles.includes("responsable_formation")) return "/administration";

  return "/stages";
}
