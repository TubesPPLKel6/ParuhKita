import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { key: 'Cari lowongan', to: '/lowongan' },
  { key: 'Kesiapan karier', to: '/kesiapan-karier' },
  { key: 'Lamaran saya', to: '/lamaran' },
  { key: 'Komunitas', to: '/komunitas' },
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

export default function StudentShell({ active = 'Lamaran saya', children, searchValue = '', onSearchChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Mahasiswa';

  return (
    <div className="flex min-h-screen flex-col bg-pk-canvas">
      <header className="sticky top-0 z-40 h-16 shrink-0 bg-pk-navy text-white">
        <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-6 lg:px-10">
          <Link to="/lowongan" className="flex shrink-0 items-center gap-2.5">
            <BrandMark />
            <span className="text-[19px] font-extrabold tracking-tight">ParuhKita</span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[13px] font-semibold md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`transition ${isActive ? 'text-pk-pastel' : 'text-white/90 hover:text-white'}`}
                >
                  {item.key}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4">
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

            <button type="button" className="text-white/85 transition hover:text-white" title="Pemberitahuan">
              <Bell className="h-5 w-5" />
            </button>

            <Link to="/profil" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#023E8A] text-[11px] font-bold text-white ring-1 ring-white/25">
                {initialsOf(user?.name)}
              </span>
              <span className="hidden text-[12.5px] font-semibold text-white sm:block">{firstName}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-pk-navy text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-4 px-6 py-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7" />
            <span className="text-[15px] font-extrabold tracking-tight">ParuhKita</span>
          </div>
          <p className="text-[11px] text-white/75 lg:text-center">
            Langkah kecil, masa depan besar. &copy; 2026 ParuhKita
          </p>
          <nav className="flex items-center gap-5 text-[11.5px] font-medium text-white/85 lg:justify-end">
            <a href="#" className="transition hover:text-white">Pusat bantuan</a>
            <span className="text-white/30">·</span>
            <a href="#" className="transition hover:text-white">Privasi</a>
            <span className="text-white/30">·</span>
            <a href="#" className="transition hover:text-white">Ketentuan</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
