import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Login from './pages/Login';
import KesiapanKarier from './pages/KesiapanKarier';
import CariLowongan from './pages/CariLowongan';
import Komunitas from './pages/Komunitas';
import LamaranSaya from './pages/LamaranSaya';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CvList from './pages/CvList';
import PortfolioList from './pages/PortfolioList';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC] print:bg-white print:min-h-0 print:block">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 print:p-0 print:m-0 print:block">
        {children}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/kesiapan-karier" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kesiapan-karier"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <KesiapanKarier />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lowongan"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CariLowongan />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/komunitas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Komunitas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lamaran"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LamaranSaya />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cv"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CvList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portofolio"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PortfolioList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/portfolio" element={<Navigate to="/portofolio" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/kesiapan-karier" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
