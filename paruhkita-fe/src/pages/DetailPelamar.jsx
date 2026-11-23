import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft,
  Award,
  Calendar,
  Clock,
  Download,
  FileText,
  FolderGit2,
  GraduationCap,
  History,
  Mail,
  Phone,
  Save,
  User,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu Review' },
  { value: 'reviewing', label: 'Dalam Seleksi' },
  { value: 'interview', label: 'Jadwal Wawancara' },
  { value: 'trial', label: 'Trial Shift' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
];

const DOCUMENT_LABELS = {
  cv: 'Curriculum Vitae (CV)',
  student_id: 'Kartu Tanda Mahasiswa (KTM)',
  portfolio: 'Dokumen Portofolio',
};

const HISTORY_LABELS = {
  submitted: 'Terkirim',
  received: 'Diterima Sistem',
};

export default function DetailPelamar() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [merchantNote, setMerchantNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchDetail = useCallback(() => {
    setLoading(true);
    setErrorMessage('');
    api.get(`/v1/merchant/applications/${applicationId}`)
      .then(({ data }) => {
        const detail = data.data;
        setApplication(detail);
        setSelectedStatus(detail.status || 'pending');
        setMerchantNote(detail.merchant_note || '');
      })
      .catch((error) => {
        setErrorMessage(
          error.response?.data?.message || 'Gagal memuat detail pelamar.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applicationId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleDownloadDocument = async (doc) => {
    setDownloadingId(doc.id);
    setErrorMessage('');
    try {
      const response = await api.get(
        `/v1/merchant/applications/${applicationId}/documents/${doc.id}`,
        { responseType: 'blob' }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', doc.original_name || `${doc.document_type}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Gagal mengunduh dokumen pelamar.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (selectedStatus === 'rejected' && !merchantNote.trim()) {
      setErrorMessage('Catatan atau feedback wajib diisi jika pelamar ditolak.');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/v1/merchant/applications/${applicationId}`, {
        status: selectedStatus,
        merchant_note: merchantNote.trim() || null,
      });
      setSuccessMessage('Status dan keputusan rekrutmen berhasil disimpan.');
      fetchDetail();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstValidationMsg = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;
      setErrorMessage(
        firstValidationMsg ||
          error.response?.data?.message ||
          'Gagal memperbarui status lamaran.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center text-xs text-[#536B82]">
        Memuat detail profil dan berkas pelamar...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#D8E5EE] p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">{errorMessage || 'Data pelamar tidak ditemukan.'}</p>
          <button
            type="button"
            onClick={() => navigate('/merchant/candidates')}
            className="px-4 py-2 rounded-xl bg-[#023E8A] text-white text-xs font-bold"
          >
            Kembali ke Daftar Pelamar
          </button>
        </div>
      </div>
    );
  }

  const student = application.student || {};
  const profile = student.student_profile || {};
  const skills = student.student_skills || [];
  const availabilities = student.student_availabilities || [];
  const portfolios = student.student_portfolios || [];
  const documents = application.documents || [];
  const histories = application.status_histories || [];
  const jobPost = application.job_post || {};
  const report = application.feedback_report || null;

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {/* Header */}
      <header className="bg-[#03045E] text-white px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                jobPost.id
                  ? navigate(`/merchant/jobs/${jobPost.id}/applicants`)
                  : navigate('/merchant/candidates')
              }
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Pelamar</span>
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#90E0EF] font-bold">
                Posisi: {jobPost.title || 'Lowongan Paruh Waktu'}
              </p>
              <h1 className="text-base sm:text-lg font-extrabold">{student.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2/3): Profil, Motivasi, Berkas, Portofolio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kartu Profil Mahasiswa */}
          <section className="bg-white rounded-2xl border border-[#D8E5EE] p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#CAF0F8] text-[#023E8A] flex items-center justify-center font-extrabold text-lg shrink-0">
                {(student.name || 'M').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-[#03045E]">{student.name}</h2>
                <p className="text-xs font-semibold text-[#0077B6] flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  {[profile.university, profile.major, profile.degree]
                    .filter(Boolean)
                    .join(' · ') || 'Informasi kampus belum dilengkapi'}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-[#536B82] pt-1">
                  {student.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {student.email}
                    </span>
                  )}
                  {(student.phone || profile.phone) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {student.phone || profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="pt-3 border-t border-[#D8E5EE]">
                <h3 className="text-xs font-bold text-[#03045E] mb-1">Tentang Kandidat</h3>
                <p className="text-xs text-[#536B82] leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Motivasi Melamar */}
            <div className="pt-3 border-t border-[#D8E5EE]">
              <h3 className="text-xs font-bold text-[#03045E] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0077B6]" />
                Motivasi Melamar
              </h3>
              <div className="rounded-xl bg-[#F6F9FC] border border-[#D8E5EE] p-3.5 text-xs text-[#03045E] leading-relaxed whitespace-pre-line">
                {application.motivation || 'Tidak ada catatan motivasi.'}
              </div>
            </div>

            {/* Keahlian & Ketersediaan Jadwal */}
            {(skills.length > 0 || availabilities.length > 0) && (
              <div className="pt-3 border-t border-[#D8E5EE] grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-[#03045E] mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#0077B6]" />
                      Keahlian
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-2.5 py-1 rounded-lg bg-[#CAF0F8]/60 text-[#023E8A] text-[11px] font-semibold"
                        >
                          {skill.skill_name || skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {availabilities.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#03045E]">
                      <Calendar className="h-3.5 w-3.5 text-[#0077B6]" />
                      Ketersediaan Waktu
                    </h3>
                    <ul className="space-y-1.5">
                      {availabilities.map((availability) => (
                        <li
                          key={availability.id}
                          className="flex items-center gap-1.5 text-xs text-[#536B82]"
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0 text-[#0077B6]" />
                          {availability.day_of_week || availability.day}:{' '}
                          {availability.start_time} - {availability.end_time}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Berkas Lampiran Lamaran (CV, KTM, Portofolio) */}
            <section className="border-t border-[#D8E5EE] pt-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#03045E]">
                <FileText className="h-3.5 w-3.5 text-[#0077B6]" />
                Berkas Dokumen Lamaran
              </h3>
              {documents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#D8E5EE] p-4 text-center text-xs text-[#536B82]">
                  Tidak ada berkas yang diunggah pelamar.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-[#0077B6]" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#03045E]">
                            {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                          </p>
                          <p className="truncate text-[11px] text-[#536B82]">
                            {doc.original_name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={downloadingId === doc.id}
                        onClick={() => handleDownloadDocument(doc)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#D8E5EE] bg-white px-3 py-1.5 text-xs font-bold text-[#023E8A] transition hover:border-[#0077B6] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {downloadingId === doc.id ? 'Mengunduh...' : 'Unduh'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Portofolio dari Profil Mahasiswa */}
            {portfolios.length > 0 && (
              <section className="border-t border-[#D8E5EE] pt-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#03045E]">
                  <FolderGit2 className="h-3.5 w-3.5 text-[#0077B6]" />
                  Portofolio Profil Mahasiswa
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolios.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[#D8E5EE] p-3"
                    >
                      <h4 className="text-xs font-bold text-[#03045E]">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#536B82]">
                          {item.description}
                        </p>
                      )}
                      {item.project_url && (
                        <a
                          href={item.project_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0077B6] hover:underline"
                        >
                          Lihat Tautan Karya
                          <span aria-hidden="true">→</span>
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>
        </div>

        {/* Kolom Kanan (1/3): Penetapan Keputusan & Riwayat Status */}
        <aside className="space-y-6">
          {/* Form Keputusan Rekrutmen */}
          <section className="rounded-2xl border border-[#D8E5EE] bg-white p-5">
            <h2 className="mb-4 text-base font-extrabold text-[#03045E]">
              Keputusan Rekrutmen
            </h2>

            {errorMessage && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                role="status"
                className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700"
              >
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSaveDecision} className="space-y-4">
              <div>
                <label
                  htmlFor="application-status"
                  className="mb-1.5 block text-xs font-bold text-[#03045E]"
                >
                  Status Tahap Lamaran
                </label>
                <select
                  id="application-status"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="w-full rounded-xl border border-[#D8E5EE] px-3 py-2.5 text-xs font-semibold text-[#03045E] focus:border-[#0077B6] focus:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="merchant-note"
                  className="mb-1.5 block text-xs font-bold text-[#03045E]"
                >
                  Catatan / Feedback untuk Pelamar{' '}
                  {selectedStatus === 'rejected' && (
                    <span className="text-rose-600">*</span>
                  )}
                </label>
                <textarea
                  id="merchant-note"
                  rows={4}
                  value={merchantNote}
                  onChange={(event) => setMerchantNote(event.target.value)}
                  required={selectedStatus === 'rejected'}
                  placeholder="Contoh: Jadwal wawancara hari Jumat pukul 14.00 WIB di lokasi toko, atau alasan penolakan yang membangun..."
                  className="w-full rounded-xl border border-[#D8E5EE] p-3 text-xs text-[#03045E] focus:border-[#0077B6] focus:outline-none"
                />
              </div>

              <p className="text-[11px] leading-relaxed text-[#536B82]">
                Catatan ini akan tercatat di riwayat status dan tampil pada
                halaman pelacakan lamaran mahasiswa.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#023E8A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#03045E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Menyimpan Keputusan...' : 'Simpan Keputusan'}
              </button>
            </form>
          </section>

          {/* Dokumen Masukan (Feedback Report) */}
          {application.status === 'rejected' && (
            <section className="rounded-2xl border border-[#D8E5EE] bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-extrabold text-[#03045E]">Dokumen Masukan</h2>
                {report && (
                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                      report.status === 'final'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {report.status === 'final' ? 'Final' : 'Draf'}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#536B82]">
                {report?.status === 'final'
                  ? 'Feedback sudah dikirim ke kandidat. Kamu masih dapat memperbarui evaluasi dan mengirimkannya kembali.'
                  : 'Berikan evaluasi per kategori dan rekomendasi perbaikan untuk kandidat yang belum diterima.'}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/merchant/applications/${application.id}/feedback`)}
                className="mt-3 w-full rounded-xl bg-[#023E8A] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#03045E]"
              >
                Beri Masukan
              </button>
            </section>
          )}

          {/* Riwayat Perubahan Status */}
          <section className="rounded-2xl border border-[#D8E5EE] bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-[#03045E]">
              <History className="h-4 w-4 text-[#0077B6]" />
              Riwayat Status Lamaran
            </h2>
            {histories.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#D8E5EE] p-4 text-center text-xs text-[#536B82]">
                Belum ada riwayat perubahan status.
              </p>
            ) : (
              <ol className="space-y-4">
                {histories.map((item) => {
                  const statusLabel =
                    STATUS_OPTIONS.find((status) => status.value === item.status)
                      ?.label || HISTORY_LABELS[item.status] || item.status;

                  return (
                    <li
                      key={item.id}
                      className="border-l-2 border-[#CAF0F8] pl-3"
                    >
                      <p className="text-xs font-bold text-[#03045E]">
                        {statusLabel}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#536B82]">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </p>
                      {item.note && (
                        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[#536B82]">
                          {item.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}