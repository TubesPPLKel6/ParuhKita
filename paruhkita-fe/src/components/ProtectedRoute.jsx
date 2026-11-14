import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F9FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#536B82] font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.account_status === 'inactive') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const homeByRole = {
       admin: '/admin/dashboard',
      merchant: '/merchant/dashboard',
      mahasiswa: '/kesiapan-karier',
    };
    return <Navigate to={homeByRole[user?.role] || '/login'} replace />;
  }

  return children;
}
