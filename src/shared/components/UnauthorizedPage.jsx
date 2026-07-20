export default function UnauthorizedPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Accès refusé</h1>
      </div>
      <div className="card">
        <p className="dossier-meta">
          Votre rôle ne permet pas d'accéder à cette section. Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
      </div>
    </div>
  );
}
