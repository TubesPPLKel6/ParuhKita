import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';


// Pages Mahasiswa 
import Login from './pages/Login';
import Register from './pages/Register';
import KesiapanKarier from './pages/KesiapanKarier';
import CariLowongan from './pages/CariLowongan';
import DetailLowongan from './pages/DetailLowongan';
import LamarLowongan from './pages/LamarLowongan';
import Komunitas from './pages/Komunitas';
import SurveiKelayakan from './pages/SurveiKelayakan';
import LamaranSaya from './pages/LamaranSaya';
import DetailStatusLamaran from './pages/DetailStatusLamaran';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CvList from './pages/CvList';
import PortfolioList from './pages/PortfolioList';

// Pages Merchant 
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantProfile from './pages/MerchantProfile';
import MerchantSettings from './pages/MerchantSettings';
import AdminMerchantVerifications from './pages/AdminMerchantVerifications';
import PublicMerchantProfile from './pages/PublicMerchantProfile';
import AdminReferenceData from './pages/AdminReferenceData';
import AdminCampusForm from './pages/AdminCampusForm';
import AdminMasterForm from './pages/AdminMasterForm';
import AdminLayout from './components/AdminLayout';

// Layout Standar Mahasiswa //
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

// Layout Khusus Merchant //
function MerchantLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC]">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ================= PROTECTED ROUTES (MERCHANT) ================= */}
          <Route
            path="/merchant/dashboard"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  <MerchantDashboard />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/profile"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  <MerchantProfile />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/settings"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  <MerchantSettings />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/merchant-verifications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout><AdminMerchantVerifications /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reference-data"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout><AdminReferenceData /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reference-data/campuses/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout><AdminCampusForm /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reference-data/study-programs/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout><AdminMasterForm type="study_programs" /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reference-data/job-categories/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout><AdminMasterForm type="job_categories" /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= APP ENTRY ================= */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />
          {/* ================= PROTECTED ROUTES (MAHASISWA) ================= */}
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
            path="/lowongan/:jobId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DetailLowongan />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lowongan/:jobId/lamar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LamarLowongan />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perusahaan/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PublicMerchantProfile />
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
            path="/komunitas/survei"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveiKelayakan />
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
            path="/lamaran/:applicationId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DetailStatusLamaran />
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

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}