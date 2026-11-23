import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import MerchantShell from '../components/merchant/MerchantShell';
import KelolaKategoriModal from '../components/feedback/KelolaKategoriModal';
import KategoriFormModal from '../components/feedback/KategoriFormModal';
import HapusKategoriModal from '../components/feedback/HapusKategoriModal';

const SCORES = [1, 2, 3, 4, 5];

export default function MerchantFeedback() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [kelolaOpen, setKelolaOpen] = useState(false);
  const [kategoriForm, setKategoriForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [kelolaMessage, setKelolaMessage] = useState(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const { data } = await api.get(`/v1/merchant/applications/${applicationId}/feedback-report`);
      setPayload(data.data);
      setCategories(data.data.report?.categories || []);
      setRecommendations((data.data.report?.recommendations || []).join('\n'));
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Tidak dapat memuat evaluasi pelamar.');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateCategoryField = (id, field, value) => {
    setCategories((current) => current.map((category) => (
      category.id === id ? { ...category, [field]: value } : category
    )));
    setFieldErrors((current) => ({ ...current, [`${id}-${field}`]: undefined }));
    setSubmitError('');
  };

  const handleAddCategory = async (values) => {
    setSavingCategory(true);
    try {
      const { data } = await api.post(
        `/v1/merchant/applications/${applicationId}/feedback/categories`,
        values
      );
      setCategories(data.data.report.categories);
      setKelolaMessage({
        title: 'Kategori berhasil ditambahkan',
        detail: `${data.data.category.name} · Skor ${data.data.category.score}/5 telah ditambahkan ke draf evaluasi.`,
      });
      setKategoriForm(null);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleUpdateCategory = async (values) => {
    if (!kategoriForm?.category) return;
    setSavingCategory(true);
    try {
      const { data } = await api.put(
        `/v1/merchant/applications/${applicationId}/feedback/categories/${kategoriForm.category.id}`,
        values
      );
      setCategories(data.data.report.categories);
      setKelolaMessage({
        title: 'Perubahan kategori berhasil disimpan',
        detail: `${data.data.category.name} · Skor diperbarui menjadi ${data.data.category.score}/5.`,
      });
      setKategoriForm(null);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeletingCategory(true);
    try {
      const { data } = await api.delete(
        `/v1/merchant/applications/${applicationId}/feedback/categories/${deleteTarget.id}`
      );
      setCategories(data.data.report.categories);
      setKelolaMessage({
        title: 'Kategori berhasil dihapus',
        detail: 'Kategori dan nilai skornya telah dihapus dari draf evaluasi.',
      });
      setDeleteTarget(null);
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleSubmit = async () => {
    const errors = {};
    categories.forEach((category) => {
      if (!category.score) errors[`${category.id}-score`] = true;
      if (!String(category.note || '').trim()) errors[`${category.id}-note`] = true;
    });
    if (!recommendations.trim()) errors.recommendations = true;

    setFieldErrors(errors);
    setSubmitError('');

    if (Object.keys(errors).length > 0) {
      setSubmitError('Lengkapi semua kolom bertanda * sebelum mengirim feedback.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/v1/merchant/applications/${applicationId}/feedback-report`, {
        categories: categories.map((category) => ({
          id: category.id,
          score: Number(category.score),
          note: category.note,
        })),
        recommendations: recommendations
          .split('\n')
          .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
          .filter(Boolean),
        status: 'final',
      });
      navigate(`/merchant/applications/${applicationId}/feedback/success`, { replace: true });
    } catch (error) {
      const response = error.response;
      const firstError = response?.data?.errors
        ? Object.values(response.data.errors).flat()[0]
        : null;
      setSubmitError(firstError || response?.data?.message || 'Feedback gagal dikirim. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MerchantShell active="Kandidat" activeTopNav="Kandidat" showTips={false}
      contentClassName="px-6 py-7 lg:px-10">
        <div className="py-16 text-[13px] text-pk-muted">Memuat evaluasi pelamar...</div>
      </MerchantShell>
    );
  }

  if (!payload) {
    return (
      <MerchantShell active="Kandidat" activeTopNav="Kandidat" showTips={false}
      contentClassName="px-6 py-7 lg:px-10">
        <p role="alert" className="py-10 text-[13px] text-rose-700">{loadError}</p>
        <Link to="/merchant/candidates?status=rejected" className="text-[12px] font-bold text-pk-primary">
          Kembali ke Riwayat Pelamar
        </Link>
      </MerchantShell>
    );
  }

  const { application, sidebar } = payload;
  const merchant = application.merchant;

  return (
    <MerchantShell
      active="Kandidat"
      activeTopNav="Kandidat"
      merchant={{ merchant_name: merchant?.name, address: merchant?.address, is_verified: true }}
      counts={sidebar}
      showTips={false}
      contentClassName="px-6 py-7 lg:px-10"
    >
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium text-pk-muted">
          <Link to="/merchant/candidates" className="inline-flex items-center gap-1.5 transition hover:text-pk-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Kandidat
          </Link>
          <span className="text-pk-border">/</span>
          <Link to="/merchant/candidates?status=rejected" className="transition hover:text-pk-primary">Ditolak</Link>
          <span className="text-pk-border">/</span>
          <Link to={`/merchant/applications/${application.id}`} className="transition hover:text-pk-primary">
            Detail
          </Link>
          <span className="text-pk-border">/</span>
          <span className="text-pk-navy">Beri Masukan</span>
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-pk-navy">
              Input Evaluasi Khusus Pelamar
            </h1>
            <p className="mt-1.5 text-[12.5px] text-pk-muted">
              Berikan evaluasi terarah dan saran praktis bagi kandidat yang belum diterima.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setKelolaMessage(null);
              setKelolaOpen(true);
            }}
            className="h-10 min-w-[218px] shrink-0 rounded-md border border-pk-primary bg-white px-5 text-[12px] font-semibold text-pk-primary transition hover:bg-pk-soft"
          >
            Kelola Kategori
          </button>
        </div>

        {/* Ringkasan pelamar */}
        <section className="mt-5 rounded-xl bg-[#EDF7FC] px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold text-pk-navy">{application.candidate.name}</h2>
              <p className="mt-1 text-[11.5px] text-pk-body">
                Pelamar {application.job.title} · {merchant?.name}
              </p>
              <p className="mt-1.5 text-[10.5px] text-pk-muted">{application.status_note}</p>
            </div>
            <span className="rounded bg-[#FFF1F0] px-2.5 py-1 text-[10.5px] font-semibold text-[#B42318]">
              {application.status_label}
            </span>
          </div>
        </section>

        <section className="mt-3 rounded-lg bg-[#EDF7FC] px-5 py-3.5">
          <p className="text-[12px] font-bold text-pk-navy">Evaluasi yang spesifik dan membangun</p>
          <p className="mt-1 text-[11px] text-pk-muted">
            Skala 1–5: 1 = Perlu peningkatan · 3 = Cukup · 5 = Sangat baik. Semua kolom bertanda * wajib diisi.
          </p>
        </section>

        {submitError && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[11.5px] text-rose-700">
            {submitError}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {categories.map((category) => {
            const scoreError = fieldErrors[`${category.id}-score`];
            const noteError = fieldErrors[`${category.id}-note`];

            return (
              <section key={category.id} className="rounded-xl border border-pk-border bg-white px-6 py-6">
                <h2 className="text-[16px] font-bold text-pk-navy">{category.name}</h2>

                <div className="mt-4 grid gap-x-12 gap-y-5 md:grid-cols-[155px_1fr]">
                  <div>
                    <label htmlFor={`score-${category.id}`} className="text-[11.5px] font-semibold text-pk-navy">
                      Skor (1–5) <span>*</span>
                    </label>
                    <select
                      id={`score-${category.id}`}
                      value={category.score ?? ''}
                      onChange={(event) => updateCategoryField(category.id, 'score', event.target.value ? Number(event.target.value) : null)}
                      className={`mt-2 h-11 w-[155px] rounded-md border bg-white px-3 text-[12px] font-semibold text-pk-navy outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/25 ${
                        scoreError ? 'border-rose-400' : 'border-pk-border'
                      }`}
                    >
                      <option value="">-</option>
                      {SCORES.map((score) => (
                        <option key={score} value={score}>{score}</option>
                      ))}
                    </select>
                    <p className={`mt-2 text-[10.5px] ${scoreError ? 'text-rose-600' : 'text-pk-hint'}`}>* Wajib diisi</p>
                  </div>

                  <div>
                    <label htmlFor={`note-${category.id}`} className="text-[11.5px] font-semibold text-pk-navy">
                      Catatan evaluasi {category.is_default ? category.name : 'kategori tambahan'} <span>*</span>
                    </label>
                    <textarea
                      id={`note-${category.id}`}
                      rows={4}
                      value={category.note || ''}
                      onChange={(event) => updateCategoryField(category.id, 'note', event.target.value)}
                      placeholder={category.is_default
                        ? `Tuliskan catatan evaluasi untuk ${category.name}...`
                        : 'Sampaikan hasil pengamatan dan saran perbaikan untuk kategori ini.'}
                      className={`mt-2 w-full resize-none rounded-md border bg-white px-3.5 py-2.5 text-[12px] leading-relaxed text-pk-body placeholder:text-pk-hint outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/25 ${
                        noteError ? 'border-rose-400' : 'border-pk-border'
                      }`}
                    />
                    <p className={`mt-2 text-[10.5px] ${noteError ? 'text-rose-600' : 'text-pk-hint'}`}>* Wajib diisi</p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Rekomendasi */}
        <section className="mt-4 rounded-xl border border-pk-border bg-white px-6 py-6">
          <h2 className="text-[16px] font-bold text-pk-navy">
            Rekomendasi Perbaikan Tertulis <span>*</span>
          </h2>
          <p className="mt-1.5 text-[11.5px] text-pk-muted">
            Berikan langkah praktis yang bisa dilakukan kandidat sebelum melamar kembali.
          </p>

          <textarea
            rows={6}
            value={recommendations}
            onChange={(event) => {
              setRecommendations(event.target.value);
              setFieldErrors((current) => ({ ...current, recommendations: undefined }));
              setSubmitError('');
            }}
            placeholder={'Contoh:\nPerbaiki CV dengan contoh pencapaian dan tanggung jawab yang jelas.\nLengkapi portofolio dengan 2–3 contoh pekerjaan yang relevan.'}
            className={`mt-4 w-full resize-none rounded-md border bg-white px-4 py-3 text-[12px] leading-[1.75] text-pk-body placeholder:text-pk-hint outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/25 ${
              fieldErrors.recommendations ? 'border-rose-400' : 'border-pk-border'
            }`}
          />
          <p className={`mt-2 text-[10.5px] ${fieldErrors.recommendations ? 'text-rose-600' : 'text-pk-hint'}`}>* Wajib diisi</p>
          <p className="mt-3 text-[10.5px] text-pk-muted">
            Masukan akan disimpan dan dikirim kepada kandidat. Status penolakan tetap tidak berubah.
          </p>
        </section>

        <div className="mt-6 flex items-center justify-end gap-3 pb-2">
          <button
            type="button"
            onClick={() => navigate(`/merchant/applications/${applicationId}`)}
            className="rounded-md border border-pk-border bg-white px-5 py-2.5 text-[12px] font-semibold text-pk-muted transition hover:bg-pk-soft"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-pk-primary px-6 py-2.5 text-[12px] font-bold text-white transition hover:bg-pk-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Mengirim...' : 'Kirim Feedback'}
          </button>
        </div>
      </div>

      {kelolaOpen && (
        <KelolaKategoriModal
          categories={categories}
          message={kelolaMessage}
          onClose={() => setKelolaOpen(false)}
          onAdd={() => {
            setKelolaMessage(null);
            setKategoriForm({ mode: 'add', category: null });
          }}
          onEdit={(category) => {
            setKelolaMessage(null);
            setKategoriForm({ mode: 'edit', category });
          }}
          onDelete={(category) => {
            setKelolaMessage(null);
            setDeleteTarget(category);
          }}
        />
      )}

      {kategoriForm && (
        <KategoriFormModal
          mode={kategoriForm.mode}
          category={kategoriForm.category}
          saving={savingCategory}
          onClose={() => setKategoriForm(null)}
          onSubmit={kategoriForm.mode === 'edit' ? handleUpdateCategory : handleAddCategory}
        />
      )}

      {deleteTarget && (
        <HapusKategoriModal
          category={deleteTarget}
          deleting={deletingCategory}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteCategory}
        />
      )}
    </MerchantShell>
  );
}
