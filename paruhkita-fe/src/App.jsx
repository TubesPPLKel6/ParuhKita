import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';


// Pages Mahasiswa 
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import KesiapanKarier from './pages/student/KesiapanKarier';
import CariLowongan from './pages/student/CariLowongan';
import DetailLowongan from './pages/student/DetailLowongan';
import LamarLowongan from './pages/student/LamarLowongan';
import Komunitas from './pages/student/Komunitas';
import SurveiKelayakan from './pages/student/SurveiKelayakan';
import LamaranSaya from './pages/student/LamaranSaya';
import DetailStatusLamaran from './pages/student/DetailStatusLamaran';
import DetailLamaranAnda from './pages/DetailLamaranAnda';
import DokumenMasukan from './pages/DokumenMasukan';
import Dashboard from './pages/student/Dashboard';
import Profile from './pages/student/Profile';
import CvList from './pages/student/CvList';
import PortfolioList from './pages/student/PortfolioList';

// Pages Merchant 
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import MerchantJobs from './pages/merchant/MerchantJobs';
import MerchantJadwal from './pages/MerchantJadwal';
import MerchantFeedback from './pages/MerchantFeedback';
import MerchantFeedbackSuccess from './pages/MerchantFeedbackSuccess';
import MerchantCandidates from './pages/MerchantCandidates';
import KelolaPelamarLowongan from './pages/merchant/KelolaPelamarLowongan';
import DetailPelamar from './pages/merchant/DetailPelamar';
import DashboardSurveiMerchant from './pages/merchant/DashboardSurveiMerchant';
import MerchantProfile from './pages/merchant/MerchantProfile';
import MerchantSettings from './pages/merchant/MerchantSettings';
import AdminMerchantVerifications from './pages/admin/AdminMerchantVerifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import PublicMerchantProfile from './pages/shared/PublicMerchantProfile';
import AdminReferenceData from './pages/admin/AdminReferenceData';
import AdminCampusForm from './pages/admin/AdminCampusForm';
import AdminMasterForm from './pages/admin/AdminMasterForm';
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
            path="/merchant/jobs"
            element={
              <ProtectedRoute allowedRoles={['merchant']}>
                <MerchantLayout>
                  <MerchantJobs />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />

                 <Route
         path="/merchant/jobs/:jobId/applicants"
         element={
           <ProtectedRoute>
             <MerchantLayout>
               <KelolaPelamarLowongan />
             </MerchantLayout>
           </ProtectedRoute>
         }
       />
       <Route
         path="/merchant/applications/:applicationId"
         element={
           <ProtectedRoute>
             <MerchantLayout>
               <DetailPelamar />
             </MerchantLayout>
           </ProtectedRoute>
         }
       />


          <Route
            path="/merchant/candidates"
            element={
              <ProtectedRoute>
                <MerchantCandidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/jobs/:jobId/applicants"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  <KelolaPelamarLowongan />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/applications/:applicationId"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  <DetailPelamar />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/applications/:applicationId/feedback"
            element={
              <ProtectedRoute>
                <MerchantFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/applications/:applicationId/feedback/success"
            element={
              <ProtectedRoute>
                <MerchantFeedbackSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/surveys"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  <DashboardSurveiMerchant />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/jadwal"
            element={
              <ProtectedRoute>
                <MerchantJadwal />
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
          />          <Route
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
             path="/admin/dashboard"
             element={
               <ProtectedRoute allowedRoles={['admin']}>
                 <AdminLayout><AdminDashboard /></AdminLayout>
               </ProtectedRoute>
             }
           />
           <Route
             path="/admin/verifikasi-dokumen"
             element={
               <ProtectedRoute allowedRoles={['admin']}>
                 <AdminLayout><AdminVerifications /></AdminLayout>
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
                <LamaranSaya />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lamaran/:applicationId"
            element={
              <ProtectedRoute>
                <DetailStatusLamaran />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lamaran/:applicationId/rekomendasi"
            element={
              <ProtectedRoute>
                <DetailLamaranAnda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lamaran/:applicationId/dokumen-masukan"
            element={
              <ProtectedRoute>
                <DokumenMasukan />
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
