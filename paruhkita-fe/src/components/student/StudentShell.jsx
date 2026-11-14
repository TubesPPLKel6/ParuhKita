import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, ChevronRight, ClipboardList, GraduationCap, LogOut, Search, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer';
import useSidebarCollapsed from '../../hooks/useSidebarCollapsed';

const NAV_ITEMS = [
  { key: 'Cari lowongan', icon: Search, to: '/lowongan' },
  { key: 'Kesiapan karier', icon: GraduationCap, to: '/kesiapan-karier' },
  { key: 'Lamaran saya', icon: ClipboardList, to: '/lamaran' },
  { key: 'Komunitas', icon: Users, to: '/komunitas' },
];

function initialsOf(name) {
  if (!name) return 'NA';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function BrandMark({ className = 'h-8 w-8' }) {
  return (
    <span className={`flex items-center justify-center rounded-[10px] bg-pk-cyan ${className}`}>
      <svg className="h-[55%] w-[55%]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round">
        <path d="M4.5 14.5c2.6 0 3.6-2.4 5.1-2.4 1.6 0 2.6 2.4 5.1 2.4 1.4 0 2.2-.7 2.8-1.4" />
        <path d="M4.5 18c2.6 0 3.6-2.4 5.1-2.4 1.6 0 2.6 2.4 5.1 2.4 1.4 0 2.2-.7 2.8-1.4" opacity="0.75" />
        <path d="M6 10.5c1.6-2.8 4-4.5 6-4.5s4.3 1.7 6 4.5" opacity="0.55" />
      </svg>
    </span>
  );
}

export default function StudentShell({ active, children, searchValue = '', onSearchChange }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed('student');
  const firstName = user?.name ? user.name.split(' ')[0] : 'Mahasiswa';
  const activeItem = active || NAV_ITEMS.find((item) => (
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  ))?.key;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-pk-canvas print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-40 h-16 shrink-0 bg-pk-navy text-white shadow-sm print:hidden">
        <div className="mx-auto flex h-full max-w-[1440px] items-center px-6 lg:px-10">
          <Link to="/lowongan" className="flex shrink-0 items-center gap-2.5">
            <BrandMark />
            <span className="text-[19px] font-extrabold tracking-tight">ParuhKita</span>
          </Link>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="hidden w-[232px] items-center gap-2 rounded-full border border-[#4C7FB8] bg-[#0B3C8A]/40 px-3.5 py-2 sm:flex">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/70" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchValue?.trim()) {
                    navigate(`/lowongan?q=${encodeURIComponent(searchValue.trim())}`);
                  }
                }}
                placeholder="Cari posisi atau nama usaha"
                className="w-full bg-transparent text-[12px] text-white placeholder:text-white/60 focus:outline-none"
              />
            </div>

            <button type="button" className="text-white/85 transition hover:text-white" title="Pemberitahuan" aria-label="Pemberitahuan">
              <Bell className="h-5 w-5" />
            </button>

            <Link to="/profil" className="flex items-center gap-2.5" title="Profil">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#023E8A] text-[11px] font-bold text-white ring-1 ring-white/25">
                {initialsOf(user?.name)}
              </span>
              <span className="hidden text-[12.5px] font-semibold text-white sm:block">{firstName}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/50 hover:text-white sm:flex"
              title="Keluar dari akun"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={`hidden shrink-0 flex-col border-r border-pk-border bg-white transition-[width] duration-200 lg:flex print:hidden ${sidebarCollapsed ? 'w-[72px]' : 'w-[221px]'}`}>
          <div className={`flex items-center border-b border-pk-border py-3 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-end px-3'}`}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              className="grid h-8 w-8 place-items-center rounded-lg text-pk-muted transition hover:bg-pk-soft hover:text-pk-navy"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="border-b border-pk-border px-5 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-pk-muted">Ruang Mahasiswa</p>
              <h2 className="mt-1 text-base font-bold leading-tight text-pk-navy">{firstName}</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-pk-muted">Jelajahi peluang dan persiapkan kariermu.</p>
            </div>
          )}

          <nav aria-label="Navigasi mahasiswa" className={`space-y-1 py-4 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeItem;

              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.key : undefined}
                  className={`flex items-center rounded-lg py-2.5 text-[13px] font-semibold transition ${
                    sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  } ${
                    isActive
                      ? 'bg-pk-primary text-white shadow-xs'
                      : 'text-pk-muted hover:bg-pk-soft hover:text-pk-navy'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-pk-muted'}`} />
                  {!sidebarCollapsed && <span>{item.key}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav aria-label="Navigasi mahasiswa" className="flex gap-2 overflow-x-auto border-b border-pk-border bg-white px-4 py-2 text-xs lg:hidden print:hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeItem;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 font-semibold transition ${
                    isActive ? 'bg-pk-primary text-white' : 'text-pk-muted hover:bg-pk-soft hover:text-pk-navy'
                  }`}
                >
                  {item.key}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 print:m-0 print:block print:p-0">{children}</main>
          <div className="print:hidden">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
