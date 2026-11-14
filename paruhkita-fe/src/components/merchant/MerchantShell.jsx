import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  LayoutGrid,
  Briefcase,
  Users,
  CalendarDays,
  MessageCircle,
  Settings,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { key: 'Ringkasan', icon: LayoutGrid, to: '/merchant/dashboard' },
  { key: 'Lowongan', icon: Briefcase, to: '/merchant/jobs', badgeKey: 'jobs' },
  { key: 'Kandidat', icon: Users, to: '/merchant/candidates', badgeKey: 'candidates' },
  { key: 'Jadwal', icon: CalendarDays, to: '/merchant/jadwal' },
  { key: 'Pesan', icon: MessageCircle, to: '/merchant/dashboard', badgeKey: 'messages' },
  { key: 'Pengaturan', icon: Settings, to: '/merchant/settings' },
];

function initialsOf(name) {
  if (!name) return 'KS';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function MerchantShell({
  active = 'Jadwal',
  activeTopNav = 'Dashboard',
  merchant,
  counts = {},
  showTips = true,
  contentClassName = 'px-6 py-7 lg:pl-16 lg:pr-8',
  children,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const merchantName = merchant?.merchant_name || user?.name || 'Ruang Merchant';
  const address = merchant?.address || user?.phone || '';
  const isVerified = merchant?.is_verified ?? false;
  const merchantInitials = initialsOf(merchantName);

  const badgeFor = (key) => counts?.[key] ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-pk-canvas">
      {/* Header utama */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between bg-pk-navy px-6 text-white shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/merchant/dashboard')}
          className="z-10 flex items-center gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-pk-cyan text-white shadow-xs">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25" />
              <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D" />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight">ParuhKita</span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[13px] font-semibold md:flex">
          <button
            type="button"
            onClick={() => navigate('/merchant/jobs')}
            className={`transition ${activeTopNav === 'Dashboard' ? 'text-pk-pastel' : 'text-white hover:text-pk-pastel'}`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/merchant/candidates')}
            className={`transition ${activeTopNav === 'Kandidat' ? 'text-pk-pastel' : 'text-white/80 hover:text-white'}`}
          >
            Kandidat
          </button>
          <button
            type="button"
            onClick={() => navigate('/merchant/dashboard')}
            className={`transition ${activeTopNav === 'Lowongan' ? 'text-pk-pastel' : 'text-white/80 hover:text-white'}`}
          >
            Lowongan
          </button>
        </nav>

        <div className="z-10 flex items-center gap-4">
          <button type="button" className="text-white/80 transition hover:text-white" title="Pemberitahuan">
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/merchant/profile')}
            className="flex items-center gap-2.5 rounded-full px-1 py-1.5 transition hover:bg-white/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-pk-navy">
              {merchantInitials}
            </span>
            <span className="hidden text-[13px] font-semibold text-white sm:block">{merchantName}</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-[221px] shrink-0 flex-col border-r border-pk-border bg-white lg:flex">
          <div className="border-b border-pk-border px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-pk-muted">Ruang Merchant</p>
            <h2 className="mt-1 text-base font-bold leading-tight text-pk-navy">{merchantName}</h2>
            <p className="mt-0.5 text-[11px] text-pk-muted">{address}</p>
            <span
              className={`mt-3 inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold ${
                isVerified ? 'bg-pk-cyan text-pk-navy' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isVerified ? 'Usaha terverifikasi!' : 'Menunggu verifikasi'}
            </span>
          </div>

          <nav className="space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              const badge = item.badgeKey ? badgeFor(item.badgeKey) : 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    isActive
                      ? 'bg-pk-primary text-white shadow-xs'
                      : 'text-pk-muted hover:bg-pk-soft hover:text-pk-navy'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-pk-muted'}`} />
                  <span className="flex-1">{item.key}</span>
                  {badge > 0 && (
                    <span className="rounded-full bg-pk-gold px-1.5 py-0.5 text-[10px] font-bold leading-none text-pk-navy">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-3 pb-4">
            <div className="rounded-xl bg-pk-pastel px-4 py-4">
              <Headphones className="h-5 w-5 text-pk-primary" />
              <p className="mt-2 text-[12px] font-bold text-pk-navy">Butuh bantuan?</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-pk-muted">
                Tim ParuhKita siap membantu rekrutmenmu.
              </p>
              <button type="button" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-pk-primary">
                Hubungi kami <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {showTips && (
              <div className="mt-4 rounded-xl bg-pk-soft px-4 py-3">
                <p className="text-[11px] font-bold text-pk-navy">Tips Seleksi</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-pk-muted">
                  Berikan feedback maksimal 3 hari setelah wawancara agar kandidat tetap terhubung.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Kolom konten + footer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className={`flex-1 ${contentClassName}`}>{children}</main>

          <footer className="flex flex-col items-center justify-between gap-3 bg-pk-navy px-6 py-5 text-white sm:flex-row lg:px-8">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pk-cyan">
                <svg className="h-3.5 w-3.5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.3" />
                  <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D" />
                </svg>
              </span>
              <div>
                <p className="text-[12px] font-bold leading-none">ParuhKita</p>
                <p className="mt-1 text-[10px] text-white/70">Langkah kecil, masa depan besar. &copy; 2026 ParuhKita</p>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-[11px] font-medium text-white/80">
              <button type="button" className="transition hover:text-white">Pusat bantuan</button>
              <button type="button" className="transition hover:text-white">Privasi</button>
              <button type="button" className="transition hover:text-white">Ketentuan</button>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
