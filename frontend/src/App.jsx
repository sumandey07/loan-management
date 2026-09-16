// src/App.jsx
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OfferPage = lazy(() => import("./pages/OfferPage"));
const NotFound = lazy(() => import("./pages/NotFoundPage"));
const CheckEligibility = lazy(() => import("./pages/CheckEligibility"));
const LoanApplicationPage = lazy(() => import("./pages/LoanApplicationPage"));
const UploadDocument = lazy(() => import("./pages/UploadDocument"));
const AssessApplication = lazy(() => import("./pages/AssessApplication"));

function AdminProtectedRoute({ children }) {
  const [checking, setChecking] = useState(() =>
    Boolean(localStorage.getItem("admin_token")),
  );
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      return;
    }

    fetch("http://localhost:8000/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Invalid admin session");
        return response.json();
      })
      .then(({ username }) => {
        localStorage.setItem("admin_username", username);
        setAuthorized(true);
      })
      .catch(() => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_username");
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;
  return authorized ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Suspense
          fallback={
            <div className="fallback-loader">
              <div className="fallback-spinner" />
              <span className="animate-pulse"></span>
            </div>
          }>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            duration="3500"
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers"
              element={
                <ProtectedRoute>
                  <OfferPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loan-application"
              element={
                <ProtectedRoute>
                  <LoanApplicationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-document"
              element={
                <ProtectedRoute>
                  <UploadDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assess-application"
              element={
                <ProtectedRoute>
                  <AssessApplication />
                </ProtectedRoute>
              }
            />
            <Route path="/eligibility" element={<CheckEligibility />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route
              path="/admin-dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboardPage />
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
