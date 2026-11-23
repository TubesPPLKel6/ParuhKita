  import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  Send,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

const REPORT_CATEGORIES = [
  'Penipuan / Pungutan Biaya Rekrutmen',
  'Informasi Lowongan Tidak Sesuai Kenyataan',
  'Upah Tidak Dibayar / Tidak Sesuai Kesepakatan',
  'Jam Kerja Melebihi Batas / Eksploitasi',
  'Perlakuan Tidak Pantas / Pelecehan',
  'Pelanggaran Lainnya',
];

const STATUS_BADGE = {
  submitted: { label: 'Menunggu Tinjauan', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  investigating: { label: 'Sedang Diinvestigasi', style: 'bg-sky-100 text-sky-800 border-sky-200' },
  resolved: { label: 'Selesai Ditindaklanjuti', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  dismissed: { label: 'Ditutup', style: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function LaporMasalah() {
  const [merchants, setMerchants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);

  const [editingReportId, setEditingReportId] = useState(null);
  const [stage, setStage] = useState('recruitment');
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [merchantProfileId, setMerchantProfileId] = useState('');
  const [jobPostId, setJobPostId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/v1/student/reports/options'),
      api.get('/v1/student/reports'),
    ])
      .then(([optionsRes, reportsRes]) => {
        setMerchants(optionsRes.data?.data?.merchants || []);
        setJobs(optionsRes.data?.data?.jobs || []);
        setReports(reportsRes.data?.data || []);
      })
      .catch((error) => {
        setErrorMessage(
          error.response?.data?.message || 'Gagal memuat data pelaporan.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingReportId(null);
    setStage('recruitment');
    setCategory(REPORT_CATEGORIES[0]);
    setMerchantProfileId('');
    setJobPostId('');
    setTitle('');
    setDescription('');
    setEvidence(null);
  };

  const handleStartEdit = (rep) => {
    setErrorMessage('');
    setSuccessMessage('');
    setEditingReportId(rep.id);
    setStage(rep.stage || 'recruitment');
    setCategory(rep.category || REPORT_CATEGORIES[0]);
    setMerchantProfileId(rep.merchant_profile_id ? String(rep.merchant_profile_id) : '');
    setJobPostId(rep.job_post_id ? String(rep.job_post_id) : '');
    setTitle(rep.title || '');
    setDescription(rep.description || '');
    setEvidence(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (rep) => {
    if (!window.confirm(`Hapus laporan "${rep.title}"?`)) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const { data } = await api.delete(`/v1/student/reports/${rep.id}`);
      if (editingReportId === rep.id) resetForm();
      setSuccessMessage(data.message || 'Laporan berhasil dihapus.');
      loadData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Gagal menghapus laporan.'
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (title.trim().length < 5) {
      setErrorMessage('Judul laporan minimal 5 karakter.');
      return;
    }
    if (description.trim().length < 20) {
      setErrorMessage('Kronologi/deskripsi masalah minimal 20 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('stage', stage);
      formData.append('category', category);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (merchantProfileId) formData.append('merchant_profile_id', merchantProfileId);
      if (jobPostId) formData.append('job_post_id', jobPostId);
      if (evidence) formData.append('evidence', evidence);

      let response;
      if (editingReportId) {
        formData.append('_method', 'PUT');
        response = await api.post(`/v1/student/reports/${editingReportId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post('/v1/student/reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccessMessage(
        response.data?.message ||
          (editingReportId ? 'Laporan berhasil diperbarui.' : 'Laporan masalah berhasil dikirim.')
      );
      resetForm();
      loadData();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;
      setErrorMessage(
        firstError || error.response?.data?.message || 'Gagal menyimpan laporan.'
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#03045E] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#90E0EF] text-xs font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Pusat Bantuan &amp; Perlindungan Mahasiswa</span>
          </div>
          <h1 className="text-2xl font-extrabold">Laporkan Masalah atau Pelanggaran</h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
            Sampaikan kendala atau dugaan pelanggaran yang kamu alami selama proses rekrutmen maupun saat bekerja agar segera ditindaklanjuti oleh tim ParuhKita.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Pengajuan / Edit Laporan */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#D8E5EE] p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#03045E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{editingReportId ? 'Ubah Laporan Pengaduan' : 'Formulir Pengaduan'}</span>
            </h2>
            {editingReportId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D8E5EE] px-2.5 py-1 text-xs font-bold text-[#536B82] hover:text-[#03045E]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal Edit</span>
              </button>
            )}
          </div>

          {errorMessage && (
            <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                  Tahap Kejadian <span className="text-rose-600">*</span>
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E5EE] px-3 py-2.5 text-xs font-semibold text-[#03045E]"
                >
                  <option value="recruitment">Proses Rekrutmen / Seleksi</option>
                  <option value="work">Saat Bekerja / Trial Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                  Kategori Pelanggaran <span className="text-rose-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E5EE] px-3 py-2.5 text-xs font-semibold text-[#03045E]"
                >
                  {REPORT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                  Merchant Terkait (Opsional)
                </label>
                <select
                  value={merchantProfileId}
                  onChange={(e) => setMerchantProfileId(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E5EE] px-3 py-2.5 text-xs text-[#03045E]"
                >
                  <option value="">-- Pilih Merchant --</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.merchant_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                  Lowongan Terkait (Opsional)
                </label>
                <select
                  value={jobPostId}
                  onChange={(e) => setJobPostId(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E5EE] px-3 py-2.5 text-xs text-[#03045E]"
                >
                  <option value="">-- Pilih Lowongan --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.merchant_profile?.merchant_name || 'Merchant'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                Judul Singkat Laporan <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Diminta biaya administrasi saat wawancara"
                className="w-full rounded-xl border border-[#D8E5EE] px-3.5 py-2.5 text-xs text-[#03045E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                Kronologi Lengkap Kejadian <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan waktu kejadian, pihak yang terlibat, serta detail pelanggaran minimal 20 karakter..."
                className="w-full rounded-xl border border-[#D8E5EE] p-3.5 text-xs text-[#03045E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                Lampiran Bukti Pendukung (Opsional, PDF/JPG/PNG maks. 5MB)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setEvidence(e.target.files?.[0] || null)}
                className="w-full text-xs text-[#536B82] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#CAF0F8] file:text-[#023E8A] hover:file:bg-[#90E0EF]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#023E8A] hover:bg-[#03045E] disabled:opacity-60 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Menyimpan...'
                  : editingReportId
                    ? 'Simpan Perubahan'
                    : 'Kirim Laporan'}
              </span>
            </button>
          </form>
        </section>

        {/* Riwayat Laporan Saya */}
        <section className="bg-white rounded-2xl border border-[#D8E5EE] p-6 space-y-4">
          <h2 className="text-base font-extrabold text-[#03045E] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0077B6]" />
            Riwayat Laporan Saya
          </h2>

          {loading ? (
            <p className="text-xs text-[#536B82]">Memuat riwayat laporan...</p>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D8E5EE] p-5 text-center space-y-1">
              <p className="text-xs font-bold text-[#03045E]">Belum ada laporan</p>
              <p className="text-[11px] text-[#536B82]">
                Laporan yang kamu kirim akan tampil di sini beserta status penanganannya.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => {
                const badge = STATUS_BADGE[rep.status] || STATUS_BADGE.submitted;
                const canModify = rep.status === 'submitted';
                return (
                  <div
                    key={rep.id}
                    className="rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.style}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-[#536B82] inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#03045E]">{rep.title}</p>
                    <p className="text-[11px] font-semibold text-[#0077B6]">{rep.category}</p>
                    <p className="text-[11px] text-[#536B82] line-clamp-2">{rep.description}</p>

                    {rep.admin_note && (
                      <div className="rounded-lg bg-white border border-[#D8E5EE] p-2 text-[11px] text-[#03045E]">
                        <span className="font-bold text-[#023E8A]">Tindak Lanjut Admin: </span>
                        {rep.admin_note}
                      </div>
                    )}

                    {canModify && (
                      <div className="pt-2 border-t border-[#D8E5EE] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(rep)}
                          className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#D8E5EE] hover:border-[#023E8A] px-2.5 py-1 text-[11px] font-bold text-[#023E8A] transition"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rep)}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
