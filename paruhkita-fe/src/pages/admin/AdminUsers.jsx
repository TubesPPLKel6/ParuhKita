import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Store,
  Users,
  X,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = { mahasiswa: 'Mahasiswa', merchant: 'Merchant', admin: 'Admin' };
const VERIFICATION_LABELS = {
  approved: 'Terverifikasi',
  pending: 'Menunggu verifikasi',
  revision_required: 'Perlu revisi',
  rejected: 'Ditolak',
  not_submitted: 'Belum diverifikasi',
};
const EMPTY_META = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  stats: { total: 0, mahasiswa: 0, merchant: 0, admin: 0, inactive: 0 },
  institutions: [],
};
const AVATAR_COLORS = ['#00B4D8', '#03458C', '#F6A623', '#F56B6B', '#6B67CE'];

function errorText(error) {
  const validationErrors = error.response?.data?.errors;
  return (validationErrors && Object.values(validationErrors)[0]?.[0])
    || error.response?.data?.message
    || (error.request ? 'Tidak dapat terhubung ke server.' : error.message);
}

function initials(name) {
  return (name || 'Pengguna')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function profileDescription(user) {
  if (user.role === 'mahasiswa') {
    const profile = user.student_profile;
    return [profile?.university, profile?.major].filter(Boolean).join(' · ') || 'Kampus belum diisi';
  }
  if (user.role === 'merchant') {
    const profile = user.merchant_profile;
    return [profile?.merchant_name, profile?.category, profile?.address].filter(Boolean).join(' · ') || 'Usaha belum diisi';
  }
  return '—';
}

function verificationLabel(user) {
  const profile = user.role === 'mahasiswa' ? user.student_profile : user.merchant_profile;
  if (user.role === 'admin') return '—';
  if (!profile) return 'Belum diverifikasi';
  if (profile.is_verified && profile.verification_status === 'approved') return 'Terverifikasi';
  return VERIFICATION_LABELS[profile.verification_status] || 'Belum diverifikasi';
}

function verificationColor(label) {
  if (label === 'Terverifikasi') return 'text-cyan-700';
  if (label === 'Ditolak') return 'text-rose-600';
  if (label === 'Belum diverifikasi') return 'text-slate-500';
  return 'text-amber-700';
}

function roleIcon(role) {
  if (role === 'mahasiswa') return GraduationCap;
  if (role === 'merchant') return Store;
  return ShieldCheck;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [form, setForm] = useState({ role: 'mahasiswa', account_status: 'active' });
  const [saving, setSaving] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationError, setConfirmationError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.get('/v1/admin/users', {
        params: {
          search: search.trim() || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          verification: verificationFilter || undefined,
          institution: institutionFilter || undefined,
          page,
          per_page: 10,
        },
      });
      setUsers(Array.isArray(data.data) ? data.data : []);
      setMeta(data.meta || EMPTY_META);
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [institutionFilter, page, roleFilter, search, statusFilter, verificationFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const showUser = async (user) => {
    setSelectedUser(user);
    setConfirmationOpen(false);
    setConfirmationError('');
    setForm({ role: user.role, account_status: user.account_status });
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const { data } = await api.get(`/v1/admin/users/${user.id}`);
      setSelectedUser(data.data);
      setForm({ role: data.data.role, account_status: data.data.account_status });
    } catch (error) {
      setDetailsError(errorText(error));
    } finally {
      setDetailsLoading(false);
    }
  };

  const requestSave = (event) => {
    event.preventDefault();
    if (!selectedUser || detailsLoading || saving) return;
    setConfirmationError('');
    setConfirmationOpen(true);
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setConfirmationError('');
    try {
      const { data } = await api.patch(`/v1/admin/users/${selectedUser.id}`, form);
      setSelectedUser(data.data);
      setForm({ role: data.data.role, account_status: data.data.account_status });
      setNotice(data.message || 'Perubahan akun berhasil disimpan.');
      setConfirmationOpen(false);
      await loadUsers();
    } catch (error) {
      setConfirmationError(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const setFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const chooseTab = (role, status = '') => {
    setRoleFilter(role);
    setStatusFilter(status);
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    setErrorMessage('');
    try {
      const params = {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        verification: verificationFilter || undefined,
        institution: institutionFilter || undefined,
        page: 1,
        per_page: 50,
      };
      const allUsers = [];
      let lastPage = 1;
      for (let currentPage = 1; currentPage <= lastPage; currentPage += 1) {
        const { data } = await api.get('/v1/admin/users', { params: { ...params, page: currentPage } });
        if (!Array.isArray(data.data) || !data.meta) {
          throw new Error('Data pengguna dari server tidak sesuai format.');
        }
        allUsers.push(...data.data);
        lastPage = data.meta.last_page;
      }

      const rows = [
        ['Nama', 'Email', 'Peran', 'Kampus/Usaha', 'Status Akun', 'Verifikasi', 'Terdaftar'],
        ...allUsers.map((user) => [
          user.name,
          user.email,
          ROLE_LABELS[user.role] || user.role,
          profileDescription(user),
          user.account_status === 'inactive' ? 'Dibekukan' : 'Aktif',
          verificationLabel(user),
          user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '',
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `pengguna-paruhkita-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setExporting(false);
    }
  };

  const roleProfile = selectedUser?.role === 'mahasiswa'
    ? selectedUser.student_profile
    : selectedUser?.role === 'merchant' ? selectedUser.merchant_profile : null;
  const stats = meta.stats || EMPTY_META.stats;
  const tabs = [
    { label: 'Semua Pengguna', role: '', status: '', count: stats.total },
    { label: 'Mahasiswa', role: 'mahasiswa', status: '', count: stats.mahasiswa },
    { label: 'Merchant', role: 'merchant', status: '', count: stats.merchant },
    { label: 'Admin', role: 'admin', status: '', count: stats.admin },
    { label: 'Dibekukan', role: '', status: 'inactive', count: stats.inactive },
  ];
  const start = meta.total ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const end = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <section className="admin-page">
      <header className="admin-hero-card">
        <div>
          <span className="admin-eyebrow">Manajemen akun</span>
          <h1>Manajemen Pengguna & Hak Akses</h1>
          <p>Kelola status akun dan informasi pengguna berdasarkan peran Mahasiswa, Merchant, atau Admin.</p>
        </div>
      </header>

      {errorMessage && <div role="alert" className="admin-alert admin-alert-error"><AlertCircle size={16} />{errorMessage}</div>}
      {notice && <div role="status" className="admin-alert admin-alert-success"><Check size={16} />{notice}<button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={14} /></button></div>}

      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
        {[
          { label: 'Total Pengguna', count: stats.total, caption: 'Akun terdaftar', icon: Users },
          { label: 'Mahasiswa', count: stats.mahasiswa, caption: 'Akun mahasiswa', icon: GraduationCap },
          { label: 'Merchant', count: stats.merchant, caption: 'Akun merchant', icon: Store },
          { label: 'Admin', count: stats.admin, caption: 'Akun administrator', icon: ShieldCheck },
          { label: 'Akun Dibekukan', count: stats.inactive, caption: 'Tidak dapat masuk', icon: Ban },
        ].map(({ label, count, caption, icon: Icon }) => (
          <article className="admin-dashboard-stat" key={label}>
            <div className="admin-stat-top"><div><span>{label}</span><strong>{Number(count || 0).toLocaleString('id-ID')}</strong></div><Icon size={21} /></div>
            <small>{caption}</small>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-panel">
        <div className="flex flex-wrap gap-2 border-b border-[#D8E5EE] px-4 pt-4">
          {tabs.map((tab) => {
            const active = roleFilter === tab.role && statusFilter === tab.status;
            return (
              <button
                type="button"
                key={tab.label}
                onClick={() => chooseTab(tab.role, tab.status)}
                className={`rounded-full px-3 py-2 text-[10px] font-bold transition ${active ? 'bg-[#00B4D8] text-white' : 'border border-[#D8E5EE] bg-white text-[#536B82] hover:border-[#00B4D8]'}`}
              >
                {tab.label} ({Number(tab.count || 0).toLocaleString('id-ID')})
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-b border-[#D8E5EE] p-4 md:flex-row md:flex-wrap md:items-center">
          <label className="admin-activity-search min-w-0 flex-1">
            <Search size={15} />
            <input value={search} onChange={(event) => setFilter(setSearch, event.target.value)} placeholder="Cari nama, email, NIM, atau kampus/usaha..." />
          </label>
          <select className="rounded-lg border border-[#D8E5EE] bg-white px-3 py-2 text-xs text-[#102C4D]" value={statusFilter} onChange={(event) => setFilter(setStatusFilter, event.target.value)} aria-label="Filter status akun">
            <option value="">Status: Semua</option><option value="active">Aktif</option><option value="inactive">Dibekukan</option>
          </select>
          <select className="rounded-lg border border-[#D8E5EE] bg-white px-3 py-2 text-xs text-[#102C4D]" value={institutionFilter} onChange={(event) => setFilter(setInstitutionFilter, event.target.value)} aria-label="Filter kampus atau usaha">
            <option value="">Kampus/Usaha: Semua</option>
            {(meta.institutions || []).map((institution) => <option value={institution} key={institution}>{institution}</option>)}
          </select>
          <select className="rounded-lg border border-[#D8E5EE] bg-white px-3 py-2 text-xs text-[#102C4D]" value={verificationFilter} onChange={(event) => setFilter(setVerificationFilter, event.target.value)} aria-label="Filter verifikasi">
            <option value="">Verifikasi: Semua</option>
            <option value="approved">Terverifikasi</option>
            <option value="pending">Menunggu verifikasi</option>
            <option value="revision_required">Perlu revisi</option>
            <option value="rejected">Ditolak</option>
            <option value="not_submitted">Belum diverifikasi</option>
          </select>
          <button type="button" className="admin-button admin-button-outline md:ml-auto" onClick={exportCsv} disabled={exporting || loading}>
            <Download size={14} />{exporting ? 'Menyiapkan...' : 'Ekspor CSV'}
          </button>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table min-w-[980px]">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Kampus/Usaha</th>
                <th>Status Akun</th>
                <th>Verifikasi</th>
                <th>Hak Akses</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="admin-table-message" colSpan="8">Memuat daftar pengguna...</td></tr>
                : users.length === 0 ? <tr><td className="admin-table-message" colSpan="8">Tidak ada pengguna yang cocok dengan filter ini.</td></tr>
                  : users.map((user) => {
                    const RoleIcon = roleIcon(user.role);
                    const verification = verificationLabel(user);
                    return (
                      <tr key={user.id} className={user.account_status === 'inactive' ? 'bg-rose-50/40' : ''}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: AVATAR_COLORS[user.id % AVATAR_COLORS.length] }}>
                              {initials(user.name)}
                            </span>
                            <span className="min-w-0"><strong>{user.name || 'Nama belum diisi'}</strong><small>{user.email}</small></span>
                          </div>
                        </td>
                        <td><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${user.role === 'admin' ? 'bg-[#03045E] text-white' : user.role === 'merchant' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'}`}><RoleIcon size={11} />{ROLE_LABELS[user.role] || user.role}</span></td>
                        <td><span className="inline-flex items-start gap-1.5"><Building2 size={12} className="mt-0.5 shrink-0 text-[#536B82]" /><small className="max-w-[170px]">{profileDescription(user)}</small></span></td>
                        <td><span className={`admin-status-pill ${user.account_status === 'active' ? 'status-active' : 'status-blocked'}`}>{user.account_status === 'active' ? 'Aktif' : 'Dibekukan'}</span></td>
                        <td><span className={`text-[10px] font-semibold ${verificationColor(verification)}`}>{user.role !== 'admin' && <ShieldCheck size={11} className="mr-1 inline" />}{verification}</span></td>
                        <td><small>{user.role === 'admin' ? 'Akses Admin' : `Akses ${ROLE_LABELS[user.role] || user.role}`}</small></td>
                        <td><small>{user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</small></td>
                        <td><button type="button" className="admin-icon-button" aria-label={`Detail dan atur ${user.name}`} title="Detail & atur pengguna" onClick={() => showUser(user)}><MoreHorizontal size={17} /></button></td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D8E5EE] px-4 py-3 text-xs text-[#536B82]">
          <span>Menampilkan {start.toLocaleString('id-ID')}–{end.toLocaleString('id-ID')} dari {meta.total.toLocaleString('id-ID')} pengguna</span>
          <div className="flex items-center gap-2">
            <button type="button" className="admin-button admin-button-outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Halaman sebelumnya"><ChevronLeft size={14} /></button>
            <span>Halaman {meta.current_page} dari {meta.last_page}</span>
            <button type="button" className="admin-button admin-button-outline" disabled={page >= meta.last_page || loading} onClick={() => setPage((current) => current + 1)} aria-label="Halaman berikutnya"><ChevronRight size={14} /></button>
          </div>
        </footer>
      </section>

      {selectedUser && <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#03045E]/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelectedUser(null); }}>
        <section className="my-auto w-full max-w-2xl rounded-2xl border border-[#D8E5EE] bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
          <header className="flex items-start justify-between gap-3 border-b border-[#D8E5EE] p-5">
            <div><span className="admin-eyebrow">Detail akun</span><h2 id="account-dialog-title" className="mt-1 text-lg font-extrabold text-[#03045E]">{selectedUser.name}</h2><p className="mt-1 text-xs text-[#536B82]">{selectedUser.email}</p></div>
            <button type="button" className="admin-icon-button" aria-label="Tutup" onClick={() => setSelectedUser(null)} disabled={saving}><X size={18} /></button>
          </header>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-4">
              <h3 className="text-xs font-bold text-[#03045E]">Informasi Akun</h3>
              <dl className="mt-3 space-y-2 text-xs">
                <div><dt className="text-[#536B82]">Nomor telepon</dt><dd className="font-semibold text-[#102C4D]">{selectedUser.phone || 'Belum diisi'}</dd></div>
                <div><dt className="text-[#536B82]">Dibuat pada</dt><dd className="font-semibold text-[#102C4D]">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('id-ID') : '—'}</dd></div>
                {selectedUser.role === 'mahasiswa' && <><div><dt className="text-[#536B82]">NIM</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.nim || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Kampus</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.university || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Fakultas</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.faculty || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Program studi</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.major || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Status KTM</dt><dd className="inline-flex items-center gap-1 font-semibold text-[#102C4D]"><ShieldCheck size={13} />{verificationLabel(selectedUser)}</dd></div></>}
                {selectedUser.role === 'merchant' && <><div><dt className="text-[#536B82]">Nama usaha</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.merchant_name || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Kategori</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.category || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Alamat usaha</dt><dd className="font-semibold text-[#102C4D]">{roleProfile?.address || 'Belum diisi'}</dd></div><div><dt className="text-[#536B82]">Status usaha</dt><dd className="inline-flex items-center gap-1 font-semibold text-[#102C4D]"><ShieldCheck size={13} />{verificationLabel(selectedUser)}</dd></div></>}
                {selectedUser.role === 'admin' && <div><dt className="text-[#536B82]">Hak akses</dt><dd className="font-semibold text-[#102C4D]">Akses berdasarkan peran Admin.</dd></div>}
              </dl>
            </div>
            <form className="space-y-4" onSubmit={requestSave}>
              <h3 className="text-xs font-bold text-[#03045E]">Peran & Status</h3>
              <label className="admin-field"><span>Peran pengguna</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="admin-field"><span>Status akun</span><select value={form.account_status} onChange={(event) => setForm((current) => ({ ...current, account_status: event.target.value }))}><option value="active">Aktif</option><option value="inactive">Dibekukan</option></select></label>
              <p className="text-[10px] leading-5 text-[#536B82]">Merchant hanya dapat mengelola lowongan setelah usaha diverifikasi. Mahasiswa hanya dapat melamar setelah KTM disetujui admin.</p>
              {detailsLoading && <p role="status" className="text-xs text-[#536B82]">Memuat detail pengguna...</p>}
              {detailsError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{detailsError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-button admin-button-outline" onClick={() => setSelectedUser(null)} disabled={saving}>Batal</button>
                <button type="submit" className="admin-button admin-button-primary" disabled={saving || detailsLoading || selectedUser.id === currentUser?.id}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
              {selectedUser.id === currentUser?.id && <p className="text-right text-[10px] text-amber-700">Admin tidak dapat mengubah akun sendiri.</p>}
            </form>
          </div>
        </section>
      </div>}

      {confirmationOpen && selectedUser && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#03045E]/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setConfirmationOpen(false); }}>
        <section className="w-full max-w-md rounded-2xl border border-[#D8E5EE] bg-white p-5 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-account-title" aria-describedby="confirm-account-description">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-[#0277A8]"><ShieldCheck size={20} /></span>
            <div>
              <span className="admin-eyebrow">Verifikasi perubahan</span>
              <h2 id="confirm-account-title" className="mt-1 text-base font-extrabold text-[#03045E]">Konfirmasi Perubahan Akun</h2>
              <p id="confirm-account-description" className="mt-1 text-xs leading-5 text-[#536B82]">Periksa perubahan untuk akun ini. Perubahan baru diterapkan setelah kamu mengonfirmasi.</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-4">
            <p className="text-xs font-bold text-[#102C4D]">{selectedUser.name}</p>
            <p className="mt-0.5 text-[10px] text-[#536B82]">{selectedUser.email}</p>
            <dl className="mt-3 grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-[11px]">
              <dt className="text-[#536B82]">Peran</dt>
              <dd className="font-semibold text-[#102C4D]">{ROLE_LABELS[selectedUser.role]} <span className="mx-1 text-[#94A3B8]">→</span> {ROLE_LABELS[form.role]}</dd>
              <dt className="text-[#536B82]">Status akun</dt>
              <dd className="font-semibold text-[#102C4D]">{selectedUser.account_status === 'active' ? 'Aktif' : 'Dibekukan'} <span className="mx-1 text-[#94A3B8]">→</span> {form.account_status === 'active' ? 'Aktif' : 'Dibekukan'}</dd>
            </dl>
          </div>
          {confirmationError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{confirmationError}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="admin-button admin-button-outline" onClick={() => setConfirmationOpen(false)} disabled={saving}>Kembali</button>
            <button type="button" className="admin-button admin-button-primary" onClick={saveUser} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Ya, Simpan Perubahan'}
            </button>
          </div>
        </section>
      </div>}
    </section>
  );
}
