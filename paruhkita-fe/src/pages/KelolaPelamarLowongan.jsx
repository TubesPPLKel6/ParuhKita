import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Menunggu Review', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  reviewing: { label: 'Dalam Seleksi', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  interview: { label: 'Jadwal Wawancara', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  trial: { label: 'Trial Shift', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  accepted: { label: 'Diterima', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Ditolak', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Semua Pelamar' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'reviewing', label: 'Dalam Seleksi' },
  { key: 'interview', label: 'Wawancara' },
  { key: 'trial', label: 'Trial Shift' },
  { key: 'accepted', label: 'Diterima' },
  { key: 'rejected', label: 'Ditolak' },
];

export default function KelolaPelamarLowongan() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');

    api.get(`/v1/merchant/jobs/${jobId}/applicants`)
      .then(({ data }) => {
        if (!active) return;
        setJob(data.data?.job || null);
        setApplicants(data.data?.applicants || []);
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(
          error.response?.data?.message || 'Gagal memuat daftar pelamar untuk lowongan ini.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  const filteredApplicants = applicants.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const studentName = (item.student?.name || '').toLowerCase();
    const university = (item.student?.student_profile?.university || '').toLowerCase();
    const major = (item.student?.student_profile?.major || '').toLowerCase();
    const keyword = searchQuery.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      studentName.includes(keyword) ||
      university.includes(keyword) ||
      major.includes(keyword);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      {/* Top Bar */}
      <header className="bg-[#03045E] text-white px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/merchant/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#90E0EF] font-bold">
                Manajemen Pelamar
              </p>
              <h1 className="text-base sm:text-lg font-extrabold">
                {job ? job.title : 'Daftar Pelamar Lowongan'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {errorMessage && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Ringkasan Lowongan */}
        {job && (
          <section className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#CAF0F8] text-[#023E8A] text-[11px] font-bold">
                  {job.category}
                </span>
                {job.subcategory && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-[#536B82] text-[11px] font-semibold">
                    {job.subcategory}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-[#03045E]">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#536B82] pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0077B6]" />
                  {job.schedule}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0077B6]" />
                  {job.wage}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0077B6]" />
                  Kuota: {job.quota}
                </span>
              </div>
            </div>

            <div className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-2xl px-5 py-3 text-center shrink-0">
              <p className="text-2xl font-extrabold text-[#023E8A]">{applicants.length}</p>
              <p className="text-[11px] font-semibold text-[#536B82]">Total Pelamar Masuk</p>
            </div>
          </section>
        )}

        {/* Filter Status & Pencarian */}
        <section className="bg-white rounded-2xl border border-[#D8E5EE] p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? applicants.length
                    : applicants.filter((a) => a.status === tab.key).length;
                const active = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-[#023E8A] text-white'
                        : 'bg-[#F6F9FC] text-[#536B82] hover:bg-slate-200/70'
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[#536B82] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / kampus..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D8E5EE] focus:outline-none focus:border-[#0077B6]"
              />
            </div>
          </div>

          {/* Daftar Pelamar */}
          {loading ? (
            <div className="py-12 text-center text-xs text-[#536B82]">
              Memuat daftar pelamar...
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-[#D8E5EE] rounded-2xl">
              <Users className="w-8 h-8 text-[#536B82]/60 mx-auto" />
              <p className="text-sm font-bold text-[#03045E]">Belum ada pelamar pada kategori ini</p>
              <p className="text-xs text-[#536B82]">
                Coba ubah filter status di atas untuk melihat kandidat lainnya.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D8E5EE]">
              {filteredApplicants.map((app) => {
                const student = app.student || {};
                const profile = student.student_profile || {};
                const statusInfo = STATUS_CONFIG[app.status] || {
                  label: app.status,
                  badge: 'bg-slate-100 text-slate-700 border-slate-200',
                };

                return (
                  <div
                    key={app.id}
                    className="py-4 first:pt-2 last:pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-sm font-extrabold text-[#03045E]">
                          {student.name || 'Mahasiswa'}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#536B82]">
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#0077B6]" />
                          {[
                            profile.university,
                            profile.major,
                          ]
                            .filter(Boolean)
                            .join(' ┬╖ ') || 'Profil akademik belum diisi'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0077B6]" />
                          Melamar pada{' '}
                          {new Date(app.created_at).toLocaleDateString('id-ID')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#0077B6]" />
                          {(app.documents || []).length} dokumen terlampir
                        </span>
                      </div>

                      {app.motivation && (
                        <p className="max-w-3xl text-xs italic text-[#536B82]">
                          ΓÇ£{app.motivation}ΓÇ¥
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/merchant/applications/${app.id}`)
                      }
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#023E8A] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#03045E]"
                    >
                      <UserCheck className="h-4 w-4" />
                      Tinjau Pelamar &amp; CV
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
