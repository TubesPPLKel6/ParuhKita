import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, CheckCircle2, Clock3, FileText, Search } from 'lucide-react';
import api from '../../api/axios';

const STATUS_LABELS = {
  pending: 'Menunggu Review Merchant',
  reviewing: 'Sedang Ditinjau',
  interview: 'Wawancara Dijadwalkan',
  trial: 'Trial Shift',
  accepted: 'Diterima',
  rejected: 'Tidak Diterima',
};

function statusStyle(status) {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'interview' || status === 'trial') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'reviewing') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

const filters = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Review' },
  { key: 'reviewing', label: 'Diproses' },
  { key: 'interview', label: 'Wawancara' },
  { key: 'accepted', label: 'Diterima' },
  { key: 'rejected', label: 'Ditolak' },
];
const progressStages = ['Terkirim', 'Menunggu review', 'Seleksi administrasi', 'Wawancara', 'Hasil akhir'];

function progressIndex(status) {
  if (status === 'reviewing') return 2;
  if (status === 'interview' || status === 'trial') return 3;
  if (status === 'accepted' || status === 'rejected') return 4;
  return 1;
}

function matchesFilter(application, filter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return application.status === 'pending';
  if (filter === 'reviewing') return application.status === 'reviewing';
  if (filter === 'interview') return ['interview', 'trial'].includes(application.status);
  return application.status === filter;
}

export default function LamaranSaya() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/v1/student/applications')
      .then(({ data }) => {
        if (active) setApplications(data.data || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || (error.request ? 'Tidak dapat memuat lamaran.' : error.message));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleApplications = useMemo(() => applications.filter((application) => {
    const job = application.job_post || {};
    const merchant = job.merchant_profile || {};
    const query = search.trim().toLowerCase();
    return matchesFilter(application, activeFilter)
      && (!query || `${job.title || ''} ${merchant.merchant_name || ''}`.toLowerCase().includes(query));
  }), [applications, activeFilter, search]);

  const counts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((item) => item.status === 'pending').length,
    processing: applications.filter((item) => item.status === 'reviewing').length,
    interview: applications.filter((item) => ['interview', 'trial'].includes(item.status)).length,
    accepted: applications.filter((item) => item.status === 'accepted').length,
    rejected: applications.filter((item) => item.status === 'rejected').length,
  }), [applications]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-[#03045E]">Lamaran Saya</h1>
        <p className="mt-1 text-xs sm:text-sm text-[#536B82]">Pantau perkembangan seluruh lamaran pekerjaanmu dalam satu tempat.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total lamaran', counts.all, FileText],
          ['Menunggu', counts.pending, Clock3],
          ['Diproses', counts.processing + counts.interview, BriefcaseBusiness],
          ['Selesai', counts.accepted + counts.rejected, CheckCircle2],
        ].map(([label, count, Icon], index) => <div key={label} className={`rounded-lg border border-[#D8E5EE] p-4 ${index === 0 ? 'bg-[#CAF0F8]' : 'bg-white'}`}><div className="flex justify-between text-[10px] font-semibold text-[#536B82]"><span>{label}</span><Icon size={14} className="text-[#0346C8]" /></div><p className="mt-1 text-2xl font-extrabold text-[#03045E]">{count}</p><p className="mt-1 text-[9px] text-[#536B82]">{index === 0 ? 'Seluruh lamaran terkirim' : 'Lamaran saat ini'}</p></div>)}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1"><Search size={14} className="absolute left-3 top-2.5 text-[#536B82]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari perusahaan atau posisi" className="w-full rounded-md border border-[#D8E5EE] bg-white py-2 pl-9 pr-3 text-[11px] outline-none focus:border-[#00B4D8]" /></label>
        <Link to="/lowongan" className="rounded-md border border-[#D8E5EE] bg-white px-4 py-2 text-center text-[10px] font-bold text-[#03045E]">Cari Lowongan</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const count = filter.key === 'all' ? counts.all : counts[filter.key === 'reviewing' ? 'processing' : filter.key] || 0;
          return <button key={filter.key} type="button" onClick={() => setActiveFilter(filter.key)} className={`rounded-md border px-3 py-2 text-[10px] font-semibold ${activeFilter === filter.key ? 'border-[#03045E] bg-[#03045E] text-white' : 'border-[#D8E5EE] bg-white text-[#102C4D]'}`}>{filter.label} ({count})</button>;
        })}
      </div>

      {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}
      {loading && <p className="rounded-xl border border-[#D8E5EE] bg-white p-5 text-sm text-[#536B82]">Memuat lamaran...</p>}
      {!loading && applications.length === 0 && !errorMessage && (
        <div className="rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center text-sm text-[#536B82]">
          Kamu belum mengirim lamaran. Lowongan yang kamu lamar akan muncul di sini.
        </div>
      )}

      {!loading && applications.length > 0 && visibleApplications.length === 0 && <p className="rounded-lg border border-[#D8E5EE] bg-white p-6 text-center text-xs text-[#536B82]">Tidak ada lamaran yang sesuai dengan pencarian atau status ini.</p>}

      <div className="space-y-4">
        {visibleApplications.map((application) => {
          const job = application.job_post || {};
          const merchant = job.merchant_profile || {};
          const currentProgress = progressIndex(application.status);
          const lastUpdate = application.status_histories?.at(-1);
          return (
            <div
              key={application.id}
              className="space-y-4 rounded-lg border border-[#D8E5EE] bg-white p-4 sm:p-5"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#D8E5EE] text-xs font-bold text-[#023E8A]">{(merchant.merchant_name || 'PK').slice(0, 2).toUpperCase()}</div>
                  <div><p className="text-[10px] font-semibold text-[#023E8A]">{merchant.merchant_name || 'Merchant'}</p><h3 className="text-sm font-extrabold text-[#03045E]">{job.title}</h3><p className="text-[9px] text-[#536B82]">{merchant.address || 'Lokasi tidak dicantumkan'} · Dilamar {new Date(application.created_at).toLocaleDateString('id-ID')}</p></div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${statusStyle(application.status)}`}>{STATUS_LABELS[application.status] || application.status}</span>
                  <Link to={`/lamaran/${application.id}`} className="rounded-md bg-[#F59E0B] px-3 py-2 text-[10px] font-bold text-[#03045E]">Lihat Detail</Link>
                </div>
              </div>
              <p className="text-[10px] font-semibold text-[#0346C8]">Tahap {currentProgress + 1} dari 5 · {STATUS_LABELS[application.status] || application.status}</p>
              <div className="grid grid-cols-5 gap-1" aria-label={`Tahap ${currentProgress + 1} dari 5`}>
                {progressStages.map((stage, index) => <div key={stage} className="min-w-0">
                  <div className="flex items-center"><span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] ${index < currentProgress ? 'bg-[#0346C8] text-white' : index === currentProgress ? 'border border-[#00B4D8] bg-[#CAF0F8] text-[#0346C8]' : 'border border-[#D8E5EE] bg-[#F6F9FC] text-[#536B82]'}`}>{index < currentProgress ? <CheckCircle2 size={11} /> : index + 1}</span>{index < progressStages.length - 1 && <span className={`h-px flex-1 ${index < currentProgress ? 'bg-[#0346C8]' : 'bg-[#D8E5EE]'}`} />}</div>
                  <p className={`mt-1 truncate text-[8px] ${index === currentProgress ? 'font-bold text-[#03045E]' : 'text-[#536B82]'}`}>{stage}</p>
                </div>)}
              </div>
              <div className="rounded-md bg-[#F6F9FC] px-3 py-2 text-[9px] text-[#536B82]"><span className="font-semibold text-[#102C4D]">Pembaruan terakhir: </span>{lastUpdate?.note || application.merchant_note || STATUS_LABELS[application.status]} · {lastUpdate?.created_at ? new Date(lastUpdate.created_at).toLocaleString('id-ID') : new Date(application.updated_at).toLocaleString('id-ID')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
