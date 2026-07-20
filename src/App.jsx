import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./shared/auth/AuthContext";
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import Layout from "./shared/components/Layout";
import LoginPage from "./shared/auth/LoginPage";
import UnauthorizedPage from "./shared/components/UnauthorizedPage";
import StagesListPage from "./modules/stages/pages/StagesListPage";
import EncadrementsListPage from "./modules/encadrements/pages/EncadrementsListPage";
import MemoiresListPage from "./modules/memoires/pages/MemoiresListPage";
import SoutenancesListPage from "./modules/soutenances/pages/SoutenancesListPage";
import EntreprisesListPage from "./modules/entreprises/pages/EntreprisesListPage";
import BibliothequeListPage from "./modules/bibliotheque/pages/BibliothequeListPage";
import EtudiantDashboard from "./modules/etudiant/pages/EtudiantDashboard";
import EncadreurDashboard from "./modules/encadreur/pages/EncadreurDashboard";
import { AdministrationDashboard, ComptesListPage, AffectationsPage } from "./modules/administration/pages";
import JuryDashboard from "./modules/jury/pages/JuryDashboard";
import { roleHomePath } from "./shared/roleHomePath";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p>Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomePath(user)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route
              path="/etudiant"
              element={
                <ProtectedRoute allowedRoles={["etudiant"]}>
                  <EtudiantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/encadreur"
              element={
                <ProtectedRoute allowedRoles={["enseignant_encadreur"]}>
                  <EncadreurDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administration"
              element={
                <ProtectedRoute allowedRoles={["administration"]}>
                  <AdministrationDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administration/comptes"
              element={
                <ProtectedRoute allowedRoles={["administration"]}>
                  <ComptesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administration/affectations"
              element={
                <ProtectedRoute allowedRoles={["administration"]}>
                  <AffectationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jury"
              element={
                <ProtectedRoute allowedRoles={["jury_soutenance"]}>
                  <JuryDashboard />
                </ProtectedRoute>
              }
            />


            <Route path="/stages" element={<StagesListPage />} />
            <Route path="/encadrements" element={<EncadrementsListPage />} />
            <Route path="/memoires" element={<MemoiresListPage />} />
            <Route path="/soutenances" element={<SoutenancesListPage />} />
            <Route path="/entreprises" element={<EntreprisesListPage />} />
            <Route path="/bibliotheque" element={<BibliothequeListPage />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
