import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import MerchantShell from '../../components/merchant/MerchantShell';

const CATEGORIES = [
  { value: 'Undangan Wawancara', badge: 'Wawancara', badgeClass: 'border-blue-100 bg-blue-50 text-blue-700' },
  { value: 'Konfirmasi Administrasi', badge: 'Administrasi', badgeClass: 'border-cyan-100 bg-cyan-50 text-cyan-700' },
  { value: 'Penawaran Kerja', badge: 'Penawaran Kerja', badgeClass: 'border-amber-100 bg-amber-50 text-amber-700' },
  { value: 'Umum', badge: 'Umum', badgeClass: 'border-slate-200 bg-slate-100 text-slate-600' },
];

const VARIABLES = [
  { key: '{nama_pelamar}', label: '+ {nama_pelamar}' },
  { key: '{posisi_lowongan}', label: '+ {posisi_lowongan}' },
  { key: '{nama_usaha}', label: '+ {nama_usaha}' },
];

const MAX_BODY_LENGTH = 2000;

function categoryMeta(category) {
  return CATEGORIES.find((item) => item.value === category) || {
    value: category,
    badge: category,
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-600',
  };
}

function formatUpdatedDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function QuickReplyFormModal({ open, initialData, onClose, onSaved }) {
  const isEditing = Boolean(initialData?.id);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Undangan Wawancara');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title || '');
    setCategory(initialData?.category || 'Undangan Wawancara');
    setBody(initialData?.body || '');
    setIsActive(initialData?.is_active ?? true);
    setErrors({});
    setSubmitError('');
  }, [open, initialData]);

  if (!open) return null;

  const insertVariable = (variable) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const next = `${body}${variable}`.slice(0, MAX_BODY_LENGTH);
      setBody(next);
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const nextValue = `${body.slice(0, start)}${variable}${body.slice(end)}`;
    if (nextValue.length > MAX_BODY_LENGTH) return;

    setBody(nextValue);
    setErrors((prev) => ({ ...prev, body: undefined }));

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + variable.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Judul templat wajib diisi.';
    if (!category) nextErrors.category = 'Kategori wajib dipilih.';
    if (!body.trim()) nextErrors.body = 'Isi pesan wajib diisi.';
    if (body.length > MAX_BODY_LENGTH) nextErrors.body = 'Isi pesan maksimal 2.000 karakter.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        title: title.trim(),
        category,
        body: body.trim(),
        is_active: Boolean(isActive),
      };

      const response = isEditing
        ? await api.put(`/v1/merchant/quick-reply-templates/${initialData.id}`, payload)
        : await api.post('/v1/merchant/quick-reply-templates', payload);

      onSaved(response.data?.data, 'Templat berhasil disimpan');
    } catch (requestError) {
      const apiErrors = requestError.response?.data?.errors;
      if (apiErrors) {
        setErrors({
          title: apiErrors.title?.[0],
          category: apiErrors.category?.[0],
          body: apiErrors.body?.[0],
          is_active: apiErrors.is_active?.[0],
        });
      } else {
        setSubmitError(requestError.response?.data?.message || 'Gagal menyimpan templat. Silakan coba kembali.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03045E]/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-reply-form-title"
    >
      <div className="max-h-[90vh] w-full max-w-[540px] overflow-y-auto rounded-2xl border border-pk-border bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-pk-border/80 px-6 py-5">
          <div>
            <h2 id="quick-reply-form-title" className="text-[17px] font-extrabold text-pk-navy">
              {isEditing ? 'Ubah Templat Balasan Cepat' : 'Tambah Templat Balasan Cepat'}
            </h2>
            <p className="mt-1 text-[12px] text-pk-muted">
              Siapkan pesan yang dapat digunakan berulang kali.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-lg p-1.5 text-pk-muted transition hover:bg-pk-soft hover:text-pk-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {submitError && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700">
              {submitError}
            </div>
          )}

          <div>
            <label htmlFor="tpl-title" className="block text-[12px] font-bold text-pk-navy">
              Judul Templat <span className="text-rose-500">*</span>
            </label>
            <input
              id="tpl-title"
              type="text"
              maxLength={150}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Contoh: Undangan Wawancara"
              className={`mt-1.5 h-10 w-full rounded-lg border bg-white px-3.5 text-[12.5px] text-pk-body placeholder:text-pk-placeholder outline-none transition ${
                errors.title ? 'border-rose-400 focus:border-rose-500' : 'border-pk-border focus:border-pk-cyan'
              }`}
            />
            {errors.title && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="tpl-category" className="block text-[12px] font-bold text-pk-navy">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <select
                id="tpl-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={`h-10 w-full appearance-none rounded-lg border bg-white pl-3.5 pr-9 text-[12.5px] text-pk-body outline-none transition ${
                  errors.category ? 'border-rose-400 focus:border-rose-500' : 'border-pk-border focus:border-pk-cyan'
                }`}
              >
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.value}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
            </div>
            {errors.category && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="tpl-body" className="block text-[12px] font-bold text-pk-navy">
              Isi Pesan <span className="text-rose-500">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-pk-muted">
              Klik variabel untuk menyisipkannya ke dalam pesan.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable.key)}
                  className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-pk-primary transition hover:bg-[#DBEAFE]"
                >
                  {variable.label}
                </button>
              ))}
            </div>
            <div
              className={`mt-2.5 overflow-hidden rounded-lg border bg-white transition ${
                errors.body ? 'border-rose-400 focus-within:border-rose-500' : 'border-pk-border focus-within:border-pk-cyan'
              }`}
            >
              <textarea
                id="tpl-body"
                ref={textareaRef}
                rows={4}
                maxLength={MAX_BODY_LENGTH}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
                }}
                placeholder="Tulis isi pesan Anda di sini..."
                className="w-full resize-y bg-transparent px-3.5 pt-3 pb-1 text-[12.5px] leading-relaxed text-pk-body placeholder:text-pk-placeholder outline-none"
              />
              <div className="px-3.5 pb-2.5 text-[10.5px] text-pk-hint">
                {body.length.toLocaleString('id-ID')} / 2.000 karakter
              </div>
            </div>
            {errors.body && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.body}</p>}
          </div>

          <div className="flex items-start gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label="Status keaktifan templat"
              onClick={() => setIsActive((prev) => !prev)}
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                isActive ? 'bg-pk-primary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div>
              <p className="text-[12.5px] font-bold text-pk-navy">
                {isActive ? 'Aktif' : 'Nonaktif'}
              </p>
              <p className="text-[11px] text-pk-muted">
                {isActive
                  ? 'Templat dapat digunakan di ruang obrolan.'
                  : 'Templat disimpan namun tidak muncul di ruang obrolan.'}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-pk-hint">* Kolom wajib diisi</p>

          <div className="flex items-center justify-end gap-2.5 border-t border-pk-border/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-pk-border bg-white px-4 py-2 text-[12px] font-semibold text-pk-body transition hover:bg-pk-soft disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#FF6B00] px-4 py-2 text-[12px] font-bold text-white shadow-xs transition hover:brightness-95 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Templat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickReplyDeleteModal({ target, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!target) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/v1/merchant/quick-reply-templates/${target.id}`);
      onDeleted(target.id, 'Templat berhasil dihapus');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal menghapus templat.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03045E]/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-reply-delete-title"
    >
      <div className="w-full max-w-[440px] rounded-2xl border border-pk-border bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Trash2 className="h-5 w-5" />
        </div>
        <h2 id="quick-reply-delete-title" className="mt-4 text-[17px] font-extrabold text-pk-navy">
          Hapus Templat Balasan Cepat?
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-pk-muted">
          Anda yakin ingin menghapus templat &ldquo;<span className="font-semibold text-pk-body">{target.title}</span>&rdquo;?
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-pk-muted">
          Templat yang dihapus tidak dapat dipulihkan dan tidak lagi tersedia di ruang obrolan.
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-pk-border bg-white px-4 py-2 text-[12px] font-semibold text-pk-body transition hover:bg-pk-soft disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MerchantQuickReplyTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? '' : current));
    }, 3500);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.q = search.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/v1/merchant/quick-reply-templates', { params });
      setTemplates(response.data?.data || []);
      setMeta(response.data?.meta || { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal memuat daftar templat.');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTemplates();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [fetchTemplates]);

  const handleSaved = (_saved, message) => {
    setFormOpen(false);
    setEditingTemplate(null);
    showNotice(message);
    fetchTemplates();
  };

  const handleDeleted = (_deletedId, message) => {
    setDeleteTarget(null);
    showNotice(message);
    if (templates.length === 1 && page > 1) {
      setPage((prev) => prev - 1);
    } else {
      fetchTemplates();
    }
  };

  const pageNumbers = Array.from({ length: Math.max(1, meta.last_page) }, (_, index) => index + 1);

  return (
    <MerchantShell
      active="Pesan"
      activeTopNav="Pesan"
      showTips={false}
      contentClassName="px-6 py-7 lg:px-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-medium text-pk-muted">
            <button
              type="button"
              onClick={() => navigate('/merchant/messages')}
              className="inline-flex items-center gap-1 text-pk-muted transition hover:text-pk-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Pesan</span>
            </button>
            <span className="text-pk-hint">/</span>
            <span>Kelola Templat</span>
          </nav>
          <h1 className="mt-1.5 text-[25px] font-extrabold leading-tight tracking-tight text-pk-navy">
            Templat Balasan Cepat
          </h1>
          <p className="mt-1 text-[12px] text-pk-muted">
            Buat dan kelola templat pesan untuk mempercepat komunikasi dengan pelamar.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2.5">
          {notice && (
            <div
              role="status"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[12px] font-semibold text-emerald-700 shadow-2xs"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingTemplate(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-[12px] font-bold text-white shadow-xs transition hover:brightness-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Templat</span>
          </button>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="mt-6 rounded-xl border border-pk-border bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-hint" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Cari judul atau isi templat..."
              aria-label="Cari judul atau isi templat"
              className="h-10 w-full rounded-lg border border-pk-border bg-pk-canvas/60 pl-10 pr-3.5 text-[12px] text-pk-body placeholder:text-pk-placeholder outline-none transition focus:border-pk-cyan focus:bg-white"
            />
          </label>

          <div className="relative w-full md:w-52">
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter kategori"
              className="h-10 w-full appearance-none rounded-lg border border-pk-border bg-white pl-3.5 pr-9 text-[12px] font-medium text-pk-body outline-none transition focus:border-pk-cyan"
            >
              <option value="">Semua Kategori</option>
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
          </div>

          <div className="relative w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter status"
              className="h-10 w-full appearance-none rounded-lg border border-pk-border bg-white pl-3.5 pr-9 text-[12px] font-medium text-pk-body outline-none transition focus:border-pk-cyan"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          {error}
        </div>
      )}

      {/* Tabel Daftar Templat */}
      <div className="mt-5 overflow-hidden rounded-xl border border-pk-border bg-white shadow-2xs">
        <div className="flex items-center gap-2.5 border-b border-pk-border px-5 py-4">
          <h2 className="text-[14px] font-bold text-pk-navy">Daftar templat</h2>
          <span className="rounded-md bg-pk-soft px-2 py-0.5 text-[11px] font-semibold text-pk-muted">
            {meta.total} templat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-pk-border/80 bg-pk-canvas/40 text-[11px] font-semibold text-pk-muted">
                <th className="px-5 py-3 font-semibold">Judul</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Pratinjau Isi</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pk-border/70">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[12px] text-pk-muted">
                    Memuat daftar templat...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="text-[13px] font-bold text-pk-navy">Belum ada templat balasan cepat</p>
                    <p className="mt-1 text-[12px] text-pk-muted">
                      {search || categoryFilter || statusFilter
                        ? 'Tidak ada templat yang sesuai dengan filter pencarian Anda.'
                        : 'Klik tombol "+ Tambah Templat" untuk membuat templat pesan pertama Anda.'}
                    </p>
                  </td>
                </tr>
              ) : (
                templates.map((item) => {
                  const cat = categoryMeta(item.category);
                  return (
                    <tr key={item.id} className="transition hover:bg-pk-canvas/40">
                      <td className="px-5 py-4 align-middle">
                        <p className="text-[13px] font-bold text-pk-navy">{item.title}</p>
                        <p className="mt-0.5 text-[11px] text-pk-muted">
                          Diperbarui {formatUpdatedDate(item.updated_at)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold ${cat.badgeClass}`}>
                          {cat.badge}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <p className="max-w-[360px] truncate text-[12px] text-pk-muted">{item.body}</p>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        {item.is_active ? (
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right align-middle">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(item);
                              setFormOpen(true);
                            }}
                            title="Ubah templat"
                            aria-label={`Ubah templat ${item.title}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-pk-border bg-white text-pk-primary transition hover:bg-pk-soft"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus templat"
                            aria-label={`Hapus templat ${item.title}`}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-orange-200 bg-orange-50/60 text-orange-500 transition hover:bg-orange-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pk-border px-5 py-3.5">
          <p className="text-[11.5px] text-pk-muted">
            {meta.total > 0
              ? `Menampilkan ${meta.from}–${meta.to} dari ${meta.total} templat`
              : 'Menampilkan 0 dari 0 templat'}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Halaman sebelumnya"
              className="grid h-8 w-8 place-items-center rounded-lg border border-pk-border bg-white text-pk-muted transition hover:bg-pk-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[12px] font-bold transition ${
                  pageNum === meta.current_page
                    ? 'bg-pk-primary text-white shadow-2xs'
                    : 'border border-pk-border bg-white text-pk-body hover:bg-pk-soft'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= meta.last_page}
              onClick={() => setPage((prev) => Math.min(meta.last_page, prev + 1))}
              aria-label="Halaman berikutnya"
              className="grid h-8 w-8 place-items-center rounded-lg border border-pk-border bg-white text-pk-muted transition hover:bg-pk-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner Bawah */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCEBFA] bg-[#EEF5FC] px-5 py-4">
        <div>
          <p className="text-[13px] font-bold text-pk-navy">
            Pesan lebih cepat, tetap terasa personal
          </p>
          <p className="mt-0.5 text-[11.5px] text-pk-muted">
            Gunakan variabel seperti <code className="font-semibold text-pk-body">{'{nama_pelamar}'}</code> agar pesan otomatis menyesuaikan penerima.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/merchant/messages')}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-pk-primary transition hover:underline"
        >
          <span>Kembali ke Pesan</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <QuickReplyFormModal
        open={formOpen}
        initialData={editingTemplate}
        onClose={() => {
          setFormOpen(false);
          setEditingTemplate(null);
        }}
        onSaved={handleSaved}
      />

      <QuickReplyDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </MerchantShell>
  );
}
