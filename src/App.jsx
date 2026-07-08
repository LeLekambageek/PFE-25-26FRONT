import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import LoginPage from "./shared/auth/LoginPage";
import StagesListPage from "./modules/stages/pages/StagesListPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/stages"
            element={
              <ProtectedRoute>
                <StagesListPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}