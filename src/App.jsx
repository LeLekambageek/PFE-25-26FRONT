import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/auth/AuthContext";
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import LoginPage from "./shared/auth/LoginPage";

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
                <h1>Liste des stages (à construire)</h1>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}