import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CalendarDays, Clock3, MapPin } from 'lucide-react';
import api from '../../api/axios';
import ReviewMerchant from '../../components/ReviewMerchant';

const cardClass = 'rounded-lg border border-[#D8E5EE] bg-white p-5';

function assetUrl(path) {
  if (!path) return null;
  const apiBase = api.defaults.baseURL || '';
  return `${apiBase.replace(/\/api\/?$/, '')}/storage/${path}`;
}

export default function DetailLowongan() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/v1/jobs/${jobId}`)
      .then(({ data }) => { if (active) setJob(data.data); })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat detail lowongan.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-[#536B82]">Memuat detail lowongan...</div>;
  if (!job) return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p role="alert" className="mb-4 text-sm text-rose-700">{errorMessage}</p>
      <Link to="/lowongan" className="text-sm font-bold text-[#023E8A]">Kembali ke Cari Lowongan</Link>
    </div>
  );

  const merchant = job.merchant_profile || {};
  const responsibilities = job.responsibilities || 'Menjalankan tugas sesuai kebutuhan operasional dan arahan merchant.';
  const qualifications = job.qualifications || 'Mahasiswa aktif yang komunikatif, bertanggung jawab, dan bersedia mengikuti jadwal kerja.';
  const deadlinePassed = job.application_deadline && new Date(`${job.application_deadline}T23:59:59`) < new Date();
  const quotaFull = job.remaining_quota === 0;
  const merchantProfileUrl = merchant.id ? `/perusahaan/${merchant.id}` : '/lowongan';
  const merchantLogoUrl = assetUrl(merchant.logo_path);

  return (
    <div className="min-h-screen bg-[#F6F9FC] pb-28">
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
        <nav className="flex items-center gap-2 text-[11px] text-[#023E8A]">
          <Link to="/lowongan" className="inline-flex items-center gap-1"><ArrowLeft size={13} /> Cari Lowongan</Link>
          <span>/</span><Link to={merchantProfileUrl} className="hover:underline">{merchant.merchant_name || 'Detail Lowongan'}</Link><span>/</span><span>Detail Lowongan</span>
        </nav>

        <section className="rounded-lg bg-[#CAF0F8] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <span className="rounded-full bg-[#03045E] px-3 py-1 text-[10px] font-bold text-white">Lowongan aktif</span>
              <h1 className="mt-3 text-2xl font-extrabold text-[#03045E]">{job.title}</h1>
              <p className="mt-1 text-xs text-[#023E8A]">{merchant.merchant_name || 'Merchant'} · {job.location || merchant.address || 'Lokasi tidak dicantumkan'}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] text-[#536B82]">Estimasi gaji</p>
              <p className="text-xl font-extrabold text-[#03045E]">{job.wage}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-[#A9DCE8] pt-4 text-xs sm:grid-cols-3">
            <p className="flex items-center gap-2"><BriefcaseBusiness size={16} className="text-[#023E8A]" /> Paruh waktu · Di lokasi</p>
            <p className="flex items-center gap-2"><CalendarDays size={16} className="text-[#023E8A]" /> {job.schedule}</p>
            <p className="flex items-center gap-2"><Clock3 size={16} className="text-[#023E8A]" /> {job.quota} tersedia</p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(250px,0.85fr)]">
          <section className={`${cardClass} space-y-5`}>
            <div>
              <h2 className="text-base font-bold text-[#03045E]">Deskripsi Pekerjaan</h2>
              <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#102C4D]">{job.description || 'Informasi pekerjaan belum ditambahkan oleh merchant.'}</p>
            </div>
            <div className="border-t border-[#E8EFF4] pt-4">
              <h2 className="text-base font-bold text-[#03045E]">Tanggung Jawab</h2>
              <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#536B82]">{responsibilities}</p>
            </div>
            <div className="border-t border-[#E8EFF4] pt-4">
              <h2 className="text-base font-bold text-[#03045E]">Kualifikasi</h2>
              <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#536B82]">{qualifications}</p>
            </div>
          </section>
          <aside className="space-y-4">
            <section className={cardClass}>
              <p className="text-[10px] font-semibold uppercase text-[#536B82]">Kenali tempat kerjamu</p>
              <div className="mt-3 flex items-center gap-3">
                  <Link to={merchantProfileUrl} className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#03045E] text-xs font-bold text-[#00B4D8]" aria-label={`Lihat profil ${merchant.merchant_name || 'merchant'}`}>
                    {merchantLogoUrl ? <img src={merchantLogoUrl} alt="" className="h-full w-full object-cover" /> : (merchant.merchant_name || 'PK').slice(0, 2).toUpperCase()}
                  </Link>
                  <div>
                    <Link to={merchantProfileUrl} className="text-sm font-bold text-[#03045E] hover:text-[#023E8A]">{merchant.merchant_name || 'Merchant'}</Link>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#536B82]"><BadgeCheck size={11} className="text-[#00A9CE]" />Usaha terverifikasi</p>
                  </div>
              </div>
                <Link to={merchantProfileUrl} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#D8E5EE] px-3 py-2.5 text-[11px] font-bold text-[#03045E] transition hover:bg-[#F6F9FC]">
                  <ArrowLeft size={13} className="rotate-180" /> Lihat Profil Lengkap
                </Link>
              <p className="mt-4 flex items-center gap-1 text-xs text-[#536B82]"><MapPin size={14} /> {job.location || merchant.address || 'Lokasi tidak dicantumkan'}</p>
            </section>
            <section className={cardClass}>
              <h2 className="text-base font-bold text-[#03045E]">Batas Akhir Lamaran</h2>
              <p className="mt-3 text-xs font-semibold text-[#102C4D]">{job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selama lowongan masih aktif'}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#536B82]">Siapkan dokumen wajib sebelum mengirim lamaran.</p>
            </section>
          </aside>
        </div>
        <ReviewMerchant jobPostId={job.id} merchantId={merchant.id} />
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#D8E5EE] bg-white px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="min-w-0"><p className="truncate text-xs font-bold text-[#03045E]">{job.title} · {merchant.merchant_name}</p><p className="text-[10px] text-[#536B82]">{job.wage} · {job.quota} tersedia</p></div>
          <button type="button" disabled={job.is_applied || deadlinePassed || quotaFull} onClick={() => navigate(`/lowongan/${job.id}/lamar`)} className="shrink-0 rounded-md bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-[#03045E] transition hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-60">
            {job.is_applied ? 'Sudah Dilamar' : quotaFull ? 'Kuota Penuh' : deadlinePassed ? 'Lamaran Ditutup' : 'Lamar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
