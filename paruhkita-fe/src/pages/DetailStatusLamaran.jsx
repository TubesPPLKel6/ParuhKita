import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Clock3, Download, FileText } from 'lucide-react';
import api from '../api/axios';

const stages = [
  { title: 'Lamaran berhasil dikirim', status: 'pending', description: 'Formulir dan dokumen lamaran berhasil dikirim.' },
  { title: 'Lamaran sedang ditinjau', status: 'pending', description: 'Lamaran masuk antrean merchant untuk ditinjau.' },
  { title: 'Seleksi administrasi', status: 'reviewing', description: 'Pemeriksaan kecocokan biodata dan persyaratan.' },
  { title: 'Wawancara', status: 'interview', description: 'Jadwal wawancara akan ditampilkan setelah tahap sebelumnya.' },
  { title: 'Hasil akhir seleksi', status: 'final', description: 'Keputusan akhir akan ditampilkan setelah proses seleksi selesai.' },
];
const statusNames = { pending: 'Menunggu Review', reviewing: 'Seleksi Administrasi', interview: 'Wawancara', trial: 'Wawancara', accepted: 'Diterima', rejected: 'Ditolak' };

function currentStage(status) {
  if (status === 'reviewing') return 2;
  if (['interview', 'trial'].includes(status)) return 3;
  if (['accepted', 'rejected'].includes(status)) return 4;
  return 1;
}

export default function DetailStatusLamaran() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/v1/student/applications')
      .then(({ data }) => {
        const found = (data.data || []).find((item) => String(item.id) === applicationId);
        if (active && found) setApplication(found);
        else if (active) setErrorMessage('Lamaran tidak ditemukan.');
      })
      .catch((error) => { if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat detail lamaran.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [applicationId]);

  const downloadDocument = async (document) => {
    try {
      const { data } = await api.get(`/v1/student/applications/${application.id}/documents/${document.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Dokumen tidak dapat diunduh.');
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-[#536B82]">Memuat perkembangan lamaran...</div>;
  if (!application) return <div className="mx-auto max-w-5xl px-4 py-10"><p role="alert" className="mb-4 text-sm text-rose-700">{errorMessage}</p><Link to="/lamaran" className="text-sm font-bold text-[#023E8A]">Kembali ke Lamaran Saya</Link></div>;

  const job = application.job_post || {};
  const merchant = job.merchant_profile || {};
  const histories = application.status_histories || [];
  const documents = application.documents || [];
  const activeStage = currentStage(application.status);
  const isFinal = ['accepted', 'rejected'].includes(application.status);

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
        <Link to="/lamaran" className="inline-flex items-center gap-1 text-[11px] text-[#023E8A]"><ArrowLeft size={13} /> Lamaran Saya / {merchant.merchant_name} / Detail Status Lamaran</Link>
        <div><h1 className="text-2xl font-extrabold text-[#03045E]">Detail Status dan Perkembangan Seleksi</h1><p className="mt-1 text-xs text-[#536B82]">Ikuti setiap perkembangan lamaranmu, dari terkirim hingga keputusan akhir.</p></div>

        {errorMessage && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}

        <section className="rounded-lg bg-[#CAF0F8] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-white text-xs font-bold text-[#023E8A]">{(merchant.merchant_name || 'PK').slice(0, 2).toUpperCase()}</span><div><h2 className="text-base font-extrabold text-[#03045E]">{job.title}</h2><p className="text-[10px] text-[#023E8A]">{merchant.merchant_name} · {merchant.address}</p></div></div><span className="rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#0346C8]">{statusNames[application.status] || application.status}</span></div>
          <div className="mt-4 grid gap-3 border-t border-[#A9DCE8] pt-3 text-[10px] sm:grid-cols-3"><p><span className="block text-[#536B82]">ID lamaran</span>PK-{application.id}</p><p><span className="block text-[#536B82]">Dikirim pada</span>{new Date(application.created_at).toLocaleString('id-ID')}</p><p><span className="block text-[#536B82]">Status terakhir</span>{statusNames[application.status] || application.status} sejak {new Date(application.updated_at).toLocaleString('id-ID')}</p></div>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
          <div className="space-y-4">
            <section className="rounded-lg border border-[#D8E5EE] bg-white p-5">
              <h2 className="text-base font-bold text-[#03045E]">Perkembangan Seleksi</h2><p className="mt-2 text-[10px] text-[#536B82]">Tahap {activeStage + 1} dari 5 · {statusNames[application.status] || application.status}</p>
              <div className="mt-4 space-y-0">
                {stages.map((stage, index) => {
                  const done = index < activeStage || (isFinal && index === 4);
                  const active = index === activeStage && !isFinal;
                  const history = index === 0 ? null : stage.status === 'final'
                    ? histories.find((item) => ['accepted', 'rejected'].includes(item.status))
                    : [...histories].reverse().find((item) => item.status === stage.status);
                  const timestamp = index === 0 ? application.created_at : history?.created_at;
                  return <div key={stage.title} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < stages.length - 1 && <span className={`absolute left-[8px] top-5 h-full w-px ${done ? 'bg-[#0346C8]' : 'bg-[#D8E5EE]'}`} />}
                    <span className={`z-10 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${done ? 'border-[#0346C8] bg-[#0346C8] text-white' : active ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#0346C8]' : 'border-[#D8E5EE] bg-[#F6F9FC] text-[#536B82]'}`}>{done ? <Check size={12} /> : active ? <Clock3 size={11} /> : <span className="text-[8px]">{index + 1}</span>}</span>
                    <div className="min-w-0"><h3 className={`text-xs font-bold ${active || done ? 'text-[#03045E]' : 'text-[#536B82]'}`}>{stage.title}</h3><span className={`mt-1 inline-block rounded px-2 py-1 text-[9px] ${done ? 'bg-emerald-50 text-emerald-700' : active ? 'bg-[#EEF9FC] text-[#0346C8]' : 'bg-[#F4F7FA] text-[#536B82]'}`}>{done ? 'Selesai' : active ? statusNames[application.status] : 'Belum dimulai'}</span><p className="mt-1 text-[10px] leading-4 text-[#536B82]">{history?.note || stage.description}</p>{timestamp && <p className="mt-1 text-[9px] text-[#536B82]">{new Date(timestamp).toLocaleString('id-ID')}</p>}</div>
                  </div>;
                })}
              </div>
            </section>
            <section className="rounded-lg bg-[#CAF0F8] p-4"><h2 className="text-xs font-bold text-[#03045E]">Tindak Lanjut</h2><p className="mt-1 text-[10px] leading-5 text-[#536B82]">{application.merchant_note || 'Belum ada tindakan yang perlu dilakukan. Pantau email dan notifikasi untuk kabar terbaru.'}</p></section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-[#D8E5EE] bg-white p-4"><h2 className="text-sm font-bold text-[#03045E]">Dokumen Terkirim</h2><p className="mt-1 text-[10px] text-[#536B82]">Dokumen yang disertakan saat mengirim lamaran.</p><div className="mt-3 space-y-2">{documents.map((document) => <button key={document.id} type="button" onClick={() => downloadDocument(document)} className="flex w-full items-center gap-2 rounded-md border border-[#D8E5EE] bg-[#EFFAFF] p-3 text-left hover:bg-[#E3F7FD]"><FileText size={16} className="shrink-0 text-[#0346C8]" /><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#102C4D]">{document.original_name}</span><span className="text-[9px] text-[#536B82]">{document.document_type === 'student_id' ? 'KTM · ' : ''}{formatSize(document.file_size)}</span></span><Download size={13} className="text-[#0346C8]" /></button>)}</div></section>
            <section className="rounded-lg border border-[#D8E5EE] bg-white p-4"><h2 className="text-sm font-bold text-[#03045E]">Kelengkapan Lamaran</h2><div className="mt-3 space-y-2 text-[10px]">{[['CV wajib', 'cv'], ['KTM / bukti mahasiswa aktif', 'student_id'], ['Portofolio opsional', 'portfolio']].map(([label, type]) => <p key={type} className="flex items-center gap-2"><CheckCircle2 size={13} className={documents.some((document) => document.document_type === type) ? 'text-[#0346C8]' : 'text-[#AAB8C4]'} />{label} {documents.some((document) => document.document_type === type) ? 'terlampir' : 'tidak disertakan'}</p>)}</div></section>
            <section className="rounded-lg border border-[#D8E5EE] bg-white p-4"><h2 className="text-sm font-bold text-[#03045E]">Pelamar</h2><p className="mt-3 text-[10px] font-semibold text-[#102C4D]">{application.student?.name || 'Profil mahasiswa'}</p><p className="mt-1 text-[10px] text-[#536B82]">{[application.student?.student_profile?.major, application.student?.student_profile?.university].filter(Boolean).join(' · ')}</p><p className="mt-1 text-[10px] text-[#536B82]">{application.student?.email}</p><p className="mt-3 border-t border-[#E8EFF4] pt-3 text-[10px] leading-5 text-[#536B82]">{application.motivation || 'Motivasi lamaran tersimpan.'}</p></section>
          </aside>
        </div>

        <section className="rounded-lg border border-[#D8E5EE] bg-white p-4"><h2 className="text-sm font-bold text-[#03045E]">Riwayat Perubahan Status</h2><p className="mt-1 text-[10px] text-[#536B82]">Catatan perubahan yang sudah terjadi pada lamaran ini.</p><div className="mt-4 grid gap-4 sm:grid-cols-3">{histories.map((history) => <div key={history.id}><p className="text-[9px] font-semibold text-[#0346C8]">{new Date(history.created_at).toLocaleString('id-ID')}</p><h3 className="mt-1 text-xs font-bold text-[#03045E]">{statusNames[history.status] || history.status}</h3><p className="mt-1 text-[10px] leading-4 text-[#536B82]">{history.note || 'Status lamaran diperbarui.'}</p></div>)}</div></section>
        <Link to="/lamaran" className="inline-flex items-center gap-2 rounded-md border border-[#D8E5EE] bg-white px-4 py-2 text-[10px] font-bold text-[#03045E]"><ArrowLeft size={13} /> Kembali ke Lamaran Saya</Link>
      </main>
    </div>
  );
}

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}