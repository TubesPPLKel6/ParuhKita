import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, GraduationCap, MessageCircle, PanelsTopLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { to: '/admin/reference-data', label: 'Data Master', icon: PanelsTopLeft },
  { to: '/admin/merchant-verifications', label: 'Moderasi Konten', icon: MessageCircle },
  { to: '/admin/merchant-verifications', label: 'Pengaduan', icon: Bell, badge: '3' },
];

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/admin/reference-data" className="admin-brand">
          <span className="admin-brand-mark"><GraduationCap size={17} /></span>
          <span>ParuhKita</span>
        </Link>
        <nav className="admin-top-links" aria-label="Navigasi utama">
          <NavLink to="/admin/reference-data">Data Master</NavLink>
          <NavLink to="/admin/merchant-verifications">Moderasi</NavLink>
        </nav>
        <div className="admin-account">
          <Bell size={16} aria-hidden="true" />
          <span className="admin-avatar">{(user?.name || 'PK').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <span>{user?.name || 'Admin PK'}</span>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <p className="admin-side-heading">Menu Navigasi</p>
          <nav aria-label="Menu admin">
            {navigation.map(({ to, label, icon: Icon, badge }, index) => {
              const active = location.pathname.startsWith('/admin/reference-data')
                ? label === 'Data Master'
                : location.pathname.startsWith('/admin/merchant-verifications')
                  ? label === 'Moderasi Konten'
                  : index === 1;
              return (
                <NavLink key={label} to={to} className={`admin-side-link ${active ? 'is-active' : ''}`}>
                  <Icon size={15} />
                  <span>{label}</span>
                  {badge && <span className="admin-side-badge">{badge}</span>}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="admin-content">{children}</main>
      </div>

      <footer className="admin-footer">
        <Link to="/admin/reference-data" className="admin-brand">
          <span className="admin-brand-mark"><GraduationCap size={17} /></span>
          <span>ParuhKita</span>
        </Link>
        <span>Langkah kecil, masa depan besar. © 2026 ParuhKita</span>
        <span className="admin-footer-links"><a href="mailto:bantuan@paruhkita.id">Pusat bantuan</a><a href="#privasi">Privasi</a><a href="#ketentuan">Ketentuan</a></span>
      </footer>
    </div>
  );
}
