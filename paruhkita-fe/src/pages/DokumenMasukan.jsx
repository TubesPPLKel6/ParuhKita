import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import api from '../api/axios';
import StudentShell from '../components/student/StudentShell';

function ScoreSummary({ label, score }) {
  return (
    <div>
      <p className="text-[10px] text-pk-muted">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold leading-none text-pk-navy">
        {score ?? '-'} <span className="text-[13px] font-semibold text-pk-primary">/ 5</span>
      </p>
    </div>
  );
}

function SectionCard({ section }) {
  return (
    <section className="rounded-xl border border-pk-border bg-white px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-[15px] font-bold text-pk-navy">
          <span className="text-pk-primary">{section.number}</span> {section.title}
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-pk-muted">
          <Lock className="h-3.5 w-3.5" /> Hanya baca
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="w-full shrink-0 rounded-md bg-[#EFF7FB] px-5 py-3.5 sm:w-[132px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-pk-muted">Skor Final</p>
          <p className="mt-1.5 text-[24px] font-extrabold leading-none text-pk-navy">
            {section.score ?? '-'} <span className="text-[14px] font-semibold text-pk-primary">/ 5</span>
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10.5px] text-pk-muted">Catatan evaluasi</p>
          <p className="mt-1 text-[12px] leading-[1.7] text-pk-body">{section.note}</p>
        </div>
      </div>
    </section>
  );
}

export default function DokumenMasukan() {
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
      api.get(`/v1/student/applications/${applicationId}/feedback-report`),
    ])
      .then(([detailResponse, reportResponse]) => {
        if (!active) return;
        setApplication(detailResponse.data.data);
        setReport(reportResponse.data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Dokumen masukan belum tersedia.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [applicationId]);

  if (loading) {
    return (
      <StudentShell active="Lamaran saya">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-16 text-[13px] text-pk-muted">Memuat dokumen masukan...</div>
      </StudentShell>
    );
  }

  if (!application || !report) {
    return (
      <StudentShell active="Lamaran saya">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-16">
          <p role="alert" className="mb-4 text-[13px] text-rose-700">{errorMessage || 'Dokumen masukan belum tersedia.'}</p>
          <Link to={`/lamaran/${applicationId}/rekomendasi`} className="inline-flex items-center gap-2 text-[12px] font-bold text-pk-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Detail Lamaran
          </Link>
        </div>
      </StudentShell>
    );
  }

  const { merchant, job } = application;
  const decisionLabel = report.decision?.label || 'Belum Diterima / Ditolak';
  const summaryScores = report.summary_scores?.length
    ? report.summary_scores
    : [
        { key: 'cv', label: 'Dokumen CV', score: report.scores?.cv },
        { key: 'portfolio', label: 'Portofolio', score: report.scores?.portfolio },
        { key: 'skills', label: 'Keterampilan (Skills)', score: report.scores?.skills },
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
          <Link to={`/lamaran/${application.id}/rekomendasi`} className="transition hover:text-pk-primary">
            Rekomendasi Perbaikan
          </Link>
          <span className="text-pk-border">/</span>
          <span className="text-pk-primary">Dokumen Masukan</span>
        </div>

        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-pk-navy">
          Dokumen Masukan (Feedback Report)
        </h1>
        <p className="mt-1.5 text-[12.5px] text-pk-muted">
          Hasil evaluasi final dari merchant untuk mendukung pengembangan diri Anda.
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-lg bg-pk-info px-5 py-4">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-pk-primary" />
          <p className="text-[11.5px] leading-[1.7] text-pk-body">
            <span className="font-bold text-pk-navy">Hanya baca.</span> Dokumen ini telah difinalisasi oleh{' '}
            {merchant.merchant_name}. Skor, catatan evaluasi, dan rekomendasi tidak dapat diubah oleh mahasiswa.
          </p>
        </div>

        {/* Identitas kandidat */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-extrabold text-pk-navy">{report.candidate?.name}</h2>
              <p className="mt-1 text-[12px] text-pk-primary">
                {job.title} · {merchant.merchant_name} · {merchant.address}
              </p>
            </div>
            <span className="rounded bg-[#FDECEC] px-2.5 py-1 text-[10.5px] font-semibold text-[#C0392B]">
              {decisionLabel}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <p className="text-[11px]">
              <span className="block text-pk-muted">Pemberi evaluasi</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">{report.decision?.evaluator}</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Keputusan seleksi</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">{report.decision?.decided_at_label}</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Status dokumen</span>
              <span className="mt-1 block text-[12px] font-bold text-pk-navy">{report.document_status_label}</span>
            </p>
          </div>
        </section>

        {/* Ringkasan penilaian */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-[16px] font-bold text-pk-navy">Ringkasan Penilaian Final</h2>
            <span className="inline-flex items-center gap-1.5 text-[10.5px] text-pk-muted">
              <Lock className="h-3.5 w-3.5" /> Hanya baca
            </span>
          </div>

          <div className={`mt-4 grid gap-4 rounded-md bg-[#EFF7FB] px-5 py-4 ${summaryScores.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
            {summaryScores.map((item) => (
              <ScoreSummary key={item.key} label={item.label} score={item.score} />
            ))}
          </div>

          <p className="mt-3.5 text-[10.5px] text-pk-muted">Skala 1–5: 1 = Perlu peningkatan · 3 = Cukup · 5 = Sangat baik.</p>
        </section>

        <div className="mt-5 space-y-4">
          {(report.sections || []).map((section) => (
            <SectionCard key={section.key} section={section} />
          ))}
        </div>

        {/* Rekomendasi perbaikan */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-pk-navy">Rekomendasi Perbaikan Tertulis</h2>
              <p className="mt-1.5 text-[11px] text-pk-muted">Dari tim rekrutmen {merchant.merchant_name}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10.5px] text-pk-muted">
              <Lock className="h-3.5 w-3.5" /> Hanya baca
            </span>
          </div>

          <div className="mt-4 rounded-lg bg-pk-soft px-5 py-4">
            <ul className="space-y-2.5">
              {(report.recommendations || []).map((recommendation, index) => (
                <li key={index} className="flex gap-2 text-[12px] leading-[1.7] text-pk-body">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-pk-body" />
                  {recommendation}
                </li>
              ))}
              {(report.recommendations || []).length === 0 && (
                <li className="text-[12px] text-pk-muted">Belum ada rekomendasi tertulis.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="mt-5 rounded-xl bg-pk-info px-6 py-5">
          <h2 className="text-[13px] font-bold text-pk-navy">Masukan untuk langkah berikutnya</h2>
          <p className="mt-1.5 text-[11.5px] leading-[1.7] text-pk-body/85">
            Status lamaran tetap {decisionLabel === 'Belum Diterima / Ditolak' ? 'Belum Diterima / Ditolak' : decisionLabel}. Feedback tidak mengubah
            keputusan seleksi. Gunakan masukan ini sebagai panduan untuk mempersiapkan rekrutmen berikutnya.
          </p>
        </section>

        <div className="mt-6 pb-2">
          <Link
            to={`/lamaran/${application.id}/rekomendasi`}
            className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-pk-navy transition hover:text-pk-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Detail Lamaran
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
