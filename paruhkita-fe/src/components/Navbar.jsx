import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/lowongan', label: 'Cari lowongan' },
    { to: '/kesiapan-karier', label: 'Kesiapan karier' },
    { to: '/lamaran', label: 'Lamaran saya' },
    { to: '/komunitas', label: 'Komunitas' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'NA';

  return (
    <div className="bg-[#03045E] text-white sticky top-0 z-50 border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-8">
            <Link to="/lowongan" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" opacity="0.8"/>
                </svg>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">ParuhKita</span>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`transition pb-1 text-sm ${
                      isActive
                        ? 'font-bold text-[#00B4D8] border-b-2 border-[#00B4D8]'
                        : 'font-medium text-slate-300 hover:text-white border-b-2 border-transparent'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header: Search + Bell + Foto Profil (langsung ke /profil) */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Search Input Pill */}
            <div className="relative hidden sm:block w-52 md:w-64 lg:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari posisi atau nama usaha"
                className="w-full bg-[#EBF7F9] text-[#102C4D] placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition"
              />
            </div>

            {/* Notification Bell */}
            <button className="p-1.5 text-slate-300 hover:text-white transition" title="Pemberitahuan">
              <Bell className="w-5 h-5" />
            </button>

            {/* FOTO PROFIL — langsung ke halaman /profil (tanpa dropdown) */}
            <Link
              to="/profil"
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#00B4D8] transition"
              title="Ke halaman Pengelolaan Profil"
            >
              <div className="w-9 h-9 rounded-full bg-white text-[#03045E] flex items-center justify-center font-bold text-xs shadow-md border-2 border-[#00B4D8]">
                {initials}
              </div>
              <span className="text-xs font-semibold text-white hidden sm:block">
                {user?.name ? user.name.split(' ')[0] : 'Profil'}
              </span>
            </Link>

            {/* Tombol Keluar */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-400/40 rounded-lg transition"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>

          </div>

        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-white/10 bg-[#03045E] text-xs">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`py-1 px-2 ${
              location.pathname === item.to ? 'text-[#00B4D8] font-bold' : 'text-slate-300'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
