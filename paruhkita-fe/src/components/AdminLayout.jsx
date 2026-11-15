import React, { useState } from 'react';
import { Bell, BookOpen, ChevronLeft, ChevronRight, GraduationCap, LayoutDashboard, Menu, MessageCircle, School, ShieldCheck, Users, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSidebarCollapsed from '../hooks/useSidebarCollapsed';

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Pengguna', icon: Users },
  { to: '/admin/verifikasi-dokumen', label: 'Verifikasi Dokumen', icon: ShieldCheck, badge: 'pending' },
  { to: '/admin/reference-data', label: 'Data Master', icon: School },
  { to: '/admin/merchant-verifications', label: 'Moderasi Konten', icon: MessageCircle },
  { to: '/admin/merchant-verifications', label: 'Pengaduan', icon: Bell, badge: '3', active: false },
  { to: '/admin/dashboard', label: 'Laporan & Audit', icon: BookOpen, active: false },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed('admin');

  const initials = (user?.name || 'Admin PK').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const isActive = (to, active = true) => active && (location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(`${to}/`)));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell admin-modern">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <button type="button" className="admin-mobile-menu" aria-label="Buka menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <Link to="/admin/dashboard" className="admin-brand">
            <span className="admin-brand-mark"><GraduationCap size={18} /></span>
            <span>ParuhKita</span>
            <small>ADMIN</small>
          </Link>
          <nav className="admin-top-links" aria-label="Navigasi utama">
            <NavLink to="/admin/dashboard">Dashboard</NavLink>
            <NavLink to="/admin/users">Pengguna</NavLink>
            <NavLink to="/admin/verifikasi-dokumen">Verifikasi Dokumen</NavLink>
            <NavLink to="/admin/reference-data">Data Master</NavLink>
          </nav>
          <div className="admin-account">
            <div className="admin-notification-wrap">
              <button type="button" className="admin-notification-button" aria-label="Notifikasi" onClick={() => setNotificationsOpen((open) => !open)}>
                <Bell size={18} /><span className="admin-notification-dot" />
              </button>
              {notificationsOpen && <div className="admin-notification-popover">
                <strong>Notifikasi Masuk</strong>
                <p><ShieldCheck size={15} /> Pengajuan verifikasi perlu ditinjau.</p>
                <Link to="/admin/verifikasi-dokumen" onClick={() => setNotificationsOpen(false)}>Buka verifikasi <ChevronRight size={13} /></Link>
              </div>}
            </div>
            <span className="admin-account-divider" />
            <span className="admin-avatar">{initials}</span>
            <span className="admin-account-copy"><strong>{user?.name || 'Admin PK'}</strong><small>Administrator</small></span>
            <button type="button" className="admin-logout-button" onClick={handleLogout}>Keluar</button>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {sidebarOpen && <button type="button" className="admin-sidebar-overlay" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} />}
        <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
          <div className="admin-sidebar-header">
            <span>Menu Navigasi</span>
            <button
              type="button"
              className="admin-sidebar-collapse"
              aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
            <button type="button" className="admin-sidebar-close" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          </div>
          <nav aria-label="Menu admin">
            {navigation.map(({ to, label, icon: Icon, badge, active }) => (
            <NavLink key={label} to={to} title={sidebarCollapsed ? label : undefined} onClick={() => setSidebarOpen(false)} className={`admin-side-link ${isActive(to, active) ? 'is-active' : ''}`}>
              <Icon size={17} /><span>{label}</span>{badge && <span className={`admin-side-badge ${badge === 'pending' ? 'is-pending' : ''}`}>{badge === 'pending' ? '!' : badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar-footer"><strong>ParuhKita Admin v2.4</strong><span>Sistem Pengawasan Terpadu</span></div>
        </aside>
        <main className="admin-content">{children}</main>
      </div>

      <footer className="admin-footer">
        <Link to="/admin/dashboard" className="admin-brand"><span className="admin-brand-mark"><GraduationCap size={16} /></span><span>ParuhKita</span></Link>
        <span>Langkah kecil, masa depan besar. © 2026 ParuhKita</span>
        <span className="admin-footer-links"><a href="mailto:bantuan@paruhkita.id">Pusat bantuan</a><a href="#privasi">Privasi</a><a href="#ketentuan">Ketentuan</a></span>
      </footer>
    </div>
  );
}
