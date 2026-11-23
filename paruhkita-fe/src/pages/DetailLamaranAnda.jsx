import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import api from '../api/axios';
import StudentShell from '../components/student/StudentShell';

function ScoreBox({ label, score }) {
  return (
    <div>
      <p className="text-[10px] text-pk-muted">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold leading-none text-pk-navy">
        {score ?? '-'} <span className="text-[13px] font-semibold text-pk-primary">/ 5</span>
      </p>
    </div>
  );
}

export default function DetailLamaranAnda() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');

    Promise.all([
      api.get(`/v1/student/applications/${applicationId}`),
      api.get(`/v1/student/applications/${applicationId}/feedback-report`).catch((error) => {
        if (error.response?.status === 404) return null;
        throw error;
      }),
    ])
      .then(([detailResponse, reportResponse]) => {
        if (!active) return;
        setApplication(detailResponse.data.data);
        setReport(reportResponse?.data?.data || null);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat detail lamaran.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [applicationId]);

  if (loading) {
    return (
      <StudentShell active="Lamaran saya">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-16 text-[13px] text-pk-muted">Memuat detail lamaran...</div>
      </StudentShell>
    );
  }

  if (!application) {
    return (
      <StudentShell active="Lamaran saya">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-16">
          <p role="alert" className="mb-4 text-[13px] text-rose-700">{errorMessage}</p>
          <Link to="/lamaran" className="inline-flex items-center gap-2 text-[12px] font-bold text-pk-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Lamaran Saya
          </Link>
        </div>
      </StudentShell>
    );
  }

  const { merchant, job, student } = application;
  const decisionLabel = report?.decision?.label || 'Belum Diterima / Ditolak';
  const decidedAt = report?.decision?.decided_at_label;

  const summaryScores = report?.summary_scores?.length
    ? report.summary_scores
    : [
        { key: 'cv', label: 'Dokumen CV', score: report?.scores?.cv },
        { key: 'portfolio', label: 'Portofolio', score: report?.scores?.portfolio },
        { key: 'skills', label: 'Keterampilan (Skills)', score: report?.scores?.skills },
      ];

  return (
    <StudentShell active="Lamaran saya">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-7">
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium text-pk-muted">
          <Link to="/lamaran" className="inline-flex items-center gap-1.5 transition hover:text-pk-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Lamaran saya
          </Link>
          <span className="text-pk-border">/</span>
          <span>{merchant.merchant_name}</span>
          <span className="text-pk-border">/</span>
          <Link to={`/lamaran/${application.id}`} className="transition hover:text-pk-primary">
            Detail Status Lamaran
          </Link>
          <span className="text-pk-border">/</span>
          <span className="text-pk-primary">Rekomendasi Perbaikan</span>
        </div>

        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-pk-navy">Detail Lamaran Anda</h1>
        <p className="mt-1.5 text-[12.5px] text-pk-muted">Informasi lamaran dan hasil seleksi akhir dari merchant.</p>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
            {errorMessage}
          </p>
        )}

        {/* Pemberitahuan hasil */}
        <section className="mt-5 rounded-lg bg-[#FDECEC] px-6 py-5">
          <h2 className="text-[16px] font-bold text-[#B42318]">{decisionLabel}</h2>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-[#7A3B36]">
            Terima kasih atas minat Anda untuk bergabung dengan {merchant.merchant_name}. Lamaran ini belum dapat
            dilanjutkan. Proses seleksi telah selesai.
          </p>
          {decidedAt && <p className="mt-2 text-[11px] text-[#A05A54]">Keputusan seleksi · {decidedAt}</p>}
        </section>

        {/* Ringkasan lamaran */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-extrabold text-pk-navy">{job.title}</h2>
              <p className="mt-1 text-[12px] text-pk-primary">
                {merchant.merchant_name} · {merchant.address}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-pk-muted">
              <Lock className="h-3.5 w-3.5" /> Hanya baca
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <p className="text-[11px]">
              <span className="block text-pk-muted">Pelamar</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">{student.name}</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Keputusan akhir</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">{decisionLabel}</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Proses seleksi</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">Selesai</span>
            </p>
          </div>

          <p className="mt-5 text-[11px] text-pk-muted">
            Informasi lamaran tersimpan dan tidak dapat diubah setelah seleksi berakhir.
          </p>
        </section>

        {/* Status & tindak lanjut */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <h2 className="text-[16px] font-bold text-pk-navy">Status &amp; Tindak Lanjut</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <p className="text-[11px]">
              <span className="block text-pk-muted">Status lamaran</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">Seleksi selesai</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Dokumen masukan</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">
                {report ? 'Sudah tersedia' : 'Belum tersedia'}
              </span>
            </p>
          </div>

          <p className="mt-4 text-[12px] leading-[1.7] text-pk-body/85">
            {report
              ? 'Merchant telah menyelesaikan penilaian CV, portofolio, dan keterampilan Anda. Baca dokumen masukan untuk melihat skor akhir serta saran pengembangan.'
              : 'Merchant belum mengirimkan dokumen masukan untuk lamaran ini. Kamu tetap dapat memantau status lamaran kapan saja.'}
          </p>

          {report && (
            <div className={`mt-4 grid gap-4 rounded-md bg-[#EFF7FB] px-5 py-4 ${summaryScores.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
              {summaryScores.map((item) => (
                <ScoreBox key={item.key} label={item.label} score={item.score} />
              ))}
            </div>
          )}
        </section>

        {/* Dokumen masukan */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-pk-navy">Dokumen Masukan (Feedback Report)</h2>
              <p className="mt-2 max-w-3xl text-[12px] leading-[1.7] text-pk-muted">
                Penilaian lengkap dari tim rekrutmen {merchant.merchant_name}, termasuk catatan evaluasi dan
                rekomendasi perbaikan tertulis.
              </p>
            </div>
            {report && (
              <span className="rounded bg-[#E9F9F1] px-2.5 py-1 text-[10.5px] font-semibold text-[#1F9D63]">
                Final · Hanya baca
              </span>
            )}
          </div>

          {report ? (
            <Link
              to={`/lamaran/${application.id}/dokumen-masukan`}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-pk-primary px-5 py-3 text-[12px] font-bold text-white transition hover:bg-pk-navy"
            >
              Lihat Dokumen Masukan <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <p className="mt-4 rounded-md bg-pk-soft px-4 py-3 text-[11.5px] text-pk-muted">
              Dokumen masukan belum tersedia.
            </p>
          )}

          <p className="mt-4 text-[10.5px] leading-4 text-pk-muted">
            Feedback membantu persiapan Anda untuk rekrutmen berikutnya dan tidak mengubah keputusan seleksi.
          </p>
        </section>

        <div className="mt-6 pb-2">
          <Link
            to="/lamaran"
            className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-pk-navy transition hover:text-pk-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Lamaran Saya
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
