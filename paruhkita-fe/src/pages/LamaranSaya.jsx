import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const STATUS_LABELS = {
  pending: 'Menunggu Review Merchant',
  reviewing: 'Sedang Ditinjau',
  interview: 'Wawancara Dijadwalkan',
  trial: 'Trial Shift',
  accepted: 'Diterima',
  rejected: 'Tidak Diterima',
};

function statusStyle(status) {
  if (status === 'accepted' || status === 'interview') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default function LamaranSaya() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-[#03045E]">Pelacakan Lamaran Saya</h1>
        <p className="text-xs sm:text-sm text-[#536B82] mt-1">
          Pantau perkembangan status berkas lamaran dan feedback dari merchant.
        </p>
      </div>

      {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}
      {loading && <p className="rounded-xl border border-[#D8E5EE] bg-white p-5 text-sm text-[#536B82]">Memuat lamaran...</p>}
      {!loading && applications.length === 0 && !errorMessage && (
        <div className="rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center text-sm text-[#536B82]">
          Kamu belum mengirim lamaran. Lowongan yang kamu lamar akan muncul di sini.
        </div>
      )}

      <div className="space-y-4">
        {applications.map((application) => {
          const job = application.job_post || {};
          const merchant = job.merchant_profile || {};
          return (
            <div
              key={application.id}
              className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#023E8A]">{merchant.merchant_name || 'Merchant'}</span>
                  {merchant.address && <><span className="text-slate-300">&middot;</span><span className="text-xs text-[#536B82]">{merchant.address}</span></>}
                </div>
                <h3 className="text-base font-extrabold text-[#102C4D]">{job.title}</h3>
                <p className="text-xs text-[#536B82]">{application.merchant_note || 'Lamaranmu sudah dikirim ke pemilik usaha.'}</p>
              </div>

              <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${statusStyle(application.status)}`}>
                  {STATUS_LABELS[application.status] || application.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  Diajukan: {new Date(application.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
