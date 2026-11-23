import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Bookmark, ChevronLeft, ChevronRight, ClipboardList, GraduationCap, LogOut, ShieldAlert, Search, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Footer from '../Footer';
import useSidebarCollapsed from '../../hooks/useSidebarCollapsed';
import api from '../../api/axios';

const NAV_ITEMS = [
  { key: 'Cari lowongan', icon: Search, to: '/lowongan' },
  { key: 'Lowongan tersimpan', icon: Bookmark, to: '/lowongan/tersimpan' },
  { key: 'Notifikasi', icon: Bell, to: '/notifikasi' },
  { key: 'Kesiapan karier', icon: GraduationCap, to: '/kesiapan-karier' },
  { key: 'Lamaran saya', icon: ClipboardList, to: '/lamaran' },
  { key: 'Komunitas', icon: Users, to: '/komunitas' },
  { key: 'Lapor masalah', icon: ShieldAlert, to: '/lapor-masalah' },
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

function deadlineStage(job) {
  if (!job.application_deadline) return null;
  const deadline = new Date(`${job.application_deadline}T23:59:59`);
  const minutes = (deadline - new Date()) / 60000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDay = new Date(`${job.application_deadline}T00:00:00`);
  const daysUntilDeadline = Math.round((deadlineDay - today) / 86400000);
  if (minutes > 0 && minutes <= 60) return { key: 'h-1-jam', label: 'akan ditutup dalam kurang dari 1 jam' };
  if (daysUntilDeadline === 1) return { key: 'h-1', label: 'akan ditutup besok' };
  if (daysUntilDeadline === 7) return { key: 'h-7', label: 'akan ditutup dalam 7 hari' };
  return null;
}

export default function StudentShell({ active, children, searchValue = '', onSearchChange }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapsed('student');
  const [savedCount, setSavedCount] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pk_bookmarked_jobs') || '[]').length;
    } catch {
      return 0;
    }
  });
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [popupNotification, setPopupNotification] = React.useState(null);
  const [headerSearch, setHeaderSearch] = React.useState(
    searchValue || new URLSearchParams(location.search).get('q') || '',
  );
  const [searchHistory, setSearchHistory] = React.useState(() => {
    try {
      const history = JSON.parse(localStorage.getItem('pk_search_history') || '[]');
      return Array.isArray(history) ? history : [];
    } catch {
      return [];
    }
  });
  const [showSearchHistory, setShowSearchHistory] = React.useState(false);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Mahasiswa';
  const activeItem = active
    || NAV_ITEMS.find((item) => location.pathname === item.to)?.key
    || NAV_ITEMS.find((item) => location.pathname.startsWith(`${item.to}/`))?.key;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const query = headerSearch.trim();
    if (query) {
      const nextHistory = [query, ...searchHistory.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
      setSearchHistory(nextHistory);
      localStorage.setItem('pk_search_history', JSON.stringify(nextHistory));
    }
    setShowSearchHistory(false);
    navigate(query ? `/lowongan?q=${encodeURIComponent(query)}` : '/lowongan');
  };

  React.useEffect(() => {
    if (location.pathname !== '/lowongan') {
      setHeaderSearch('');
      setShowSearchHistory(false);
    } else {
      setHeaderSearch(new URLSearchParams(location.search).get('q') || '');
    }
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    const updateSavedCount = () => {
      try {
        setSavedCount(JSON.parse(localStorage.getItem('pk_bookmarked_jobs') || '[]').length);
      } catch {
        setSavedCount(0);
      }
    };
    const loadNotifications = () => {
      Promise.all([
        api.get('/v1/jobs'),
        api.get('/v1/student/applications').catch(() => ({ data: { data: [] } })),
      ])
        .then(([jobsResponse, applicationsResponse]) => {
          const savedIds = JSON.parse(localStorage.getItem('pk_bookmarked_jobs') || '[]').map(Number);
          const appliedIds = (applicationsResponse.data.data || []).map((application) => Number(application.job_post_id || application.job_post?.id));
          const notifications = (jobsResponse.data.data || []).map((job) => {
            const relevant = savedIds.includes(Number(job.id)) || appliedIds.includes(Number(job.id));
            const stage = relevant ? deadlineStage(job) : null;
            return stage ? { id: `${job.id}-${stage.key}`, job, stage, isApplied: appliedIds.includes(Number(job.id)) } : null;
          }).filter(Boolean);
          const dismissed = JSON.parse(sessionStorage.getItem('pk_dismissed_notifications') || '[]');
          const activeNotifications = notifications.filter((notification) => !dismissed.includes(notification.id));
          setNotificationCount(activeNotifications.length);
          if (activeNotifications.length > 0) setPopupNotification(activeNotifications[0]);
        })
        .catch(() => setNotificationCount(0));
    };
    updateSavedCount();
    loadNotifications();
    window.addEventListener('pk-bookmarks-changed', updateSavedCount);
    window.addEventListener('pk-bookmarks-changed', loadNotifications);
    return () => {
      window.removeEventListener('pk-bookmarks-changed', updateSavedCount);
      window.removeEventListener('pk-bookmarks-changed', loadNotifications);
    };
  }, []);

  const dismissPopupNotification = () => {
    if (!popupNotification) return;
    const dismissed = JSON.parse(sessionStorage.getItem('pk_dismissed_notifications') || '[]');
    const nextDismissed = [...new Set([...dismissed, popupNotification.id])];
    sessionStorage.setItem('pk_dismissed_notifications', JSON.stringify(nextDismissed));
    setPopupNotification(null);
    setNotificationCount((count) => Math.max(0, count - 1));
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
            <form onSubmit={submitSearch} className="relative hidden w-[232px] items-center gap-2 rounded-full border border-[#4C7FB8] bg-[#0B3C8A]/40 px-3.5 py-2 sm:flex">
              <button type="submit" aria-label="Cari lowongan" className="text-white/70 transition hover:text-white">
                <Search className="h-3.5 w-3.5 shrink-0" />
              </button>
              <input
                type="text"
                value={headerSearch}
                onFocus={() => setShowSearchHistory(searchHistory.length > 0)}
                onChange={(event) => {
                  setHeaderSearch(event.target.value);
                  onSearchChange?.(event.target.value);
                }}
                placeholder="Cari posisi atau nama usaha"
                className="w-full bg-transparent text-[12px] text-white placeholder:text-white/60 focus:outline-none"
              />
              {showSearchHistory && searchHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-pk-border bg-white text-pk-navy shadow-xl">
                  <div className="flex items-center justify-between border-b border-pk-border px-3 py-2">
                    <span className="text-[10px] font-bold text-pk-muted">Riwayat pencarian</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchHistory([]);
                        localStorage.removeItem('pk_search_history');
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Hapus semua
                    </button>
                  </div>
                  {searchHistory.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setHeaderSearch(item);
                        setShowSearchHistory(false);
                        navigate(`/lowongan?q=${encodeURIComponent(item)}`);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-pk-soft"
                    >
                      <Search className="h-3 w-3 text-pk-muted" />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="relative">
              <button type="button" onClick={() => navigate('/notifikasi')} className="relative text-white/85 transition hover:text-white" title="Pemberitahuan" aria-label="Pemberitahuan">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pk-gold px-1 text-[9px] font-black text-pk-navy">{notificationCount > 9 ? '9+' : notificationCount}</span>}
              </button>
              {popupNotification && (
                <div className="absolute right-0 top-9 z-[60] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-pk-border bg-white p-4 text-pk-navy shadow-2xl">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-pk-soft p-2 text-pk-primary"><Bell className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-pk-primary">Pemberitahuan baru</p>
                      <p className="mt-1 text-sm font-bold">{popupNotification.job.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-pk-muted">
                        {popupNotification.isApplied
                          ? `Lamaranmu ${popupNotification.stage.label}.`
                          : `Lowongan tersimpan ini ${popupNotification.stage.label}. Silakan apply sekarang.`}
                      </p>
                      <button type="button" onClick={() => { dismissPopupNotification(); navigate(`/lowongan/${popupNotification.job.id}${popupNotification.isApplied ? '' : '/lamar'}`); }} className="mt-3 text-[11px] font-bold text-pk-primary hover:underline">
                        {popupNotification.isApplied ? 'Lihat lowongan' : 'Apply sekarang'}
                      </button>
                    </div>
                    <button type="button" onClick={dismissPopupNotification} aria-label="Tutup notifikasi" className="rounded-lg p-1 text-pk-muted hover:bg-pk-soft hover:text-pk-navy"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>

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
                  {!sidebarCollapsed && <span>{item.key}{item.key === 'Lowongan tersimpan' && savedCount > 0 ? ` (${savedCount})` : ''}{item.key === 'Notifikasi' && notificationCount > 0 ? ` (${notificationCount})` : ''}</span>}
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
