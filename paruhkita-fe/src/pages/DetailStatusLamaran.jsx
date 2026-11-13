import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  X,
} from 'lucide-react';
import api from '../api/axios';
import StudentShell from '../components/student/StudentShell';

const BADGE_STYLES = {
  done: 'bg-[#E9F9F1] text-[#1F9D63]',
  active: 'bg-[#E8F7FC] text-[#0E7FA8]',
  pending: 'bg-[#F4F7FA] text-[#6B7F90]',
  danger: 'bg-[#FDECEC] text-[#C0392B]',
};

function StatusPill({ status, label }) {
  if (status === 'accepted' || status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-[11px] font-semibold text-pk-navy shadow-xs">
        <span className={`h-2 w-2 rounded-full ${status === 'accepted' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-[11px] font-semibold text-pk-navy shadow-xs">
      <Clock3 className="h-3.5 w-3.5 text-pk-primary" />
      {label}
    </span>
  );
}

function TimelineMarker({ stage, index }) {
  const isDanger = stage.tone === 'danger';

  if (stage.state === 'done') {
    return (
      <span
        className={`z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-white ${
          isDanger ? 'bg-rose-500' : 'bg-pk-primary'
        }`}
      >
        {isDanger ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </span>
    );
  }

  if (stage.state === 'active') {
    return (
      <span className="z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-pk-cyan bg-white text-pk-primary">
        <Clock3 className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className="z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-pk-border bg-white text-[10px] font-semibold text-pk-hint">
      {index + 1}
    </span>
  );
}

function InterviewDetails({ details }) {
  return (
    <div className="mt-3 space-y-1">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-pk-primary">Jadwal Wawancara</p>
      <p className="text-[11.5px] text-pk-body">
        <span className="font-semibold text-pk-muted">Tanggal:</span> {details.date_label}
      </p>
      <p className="text-[11.5px] text-pk-body">
        <span className="font-semibold text-pk-muted">Waktu:</span> {details.time_label}
      </p>
      <p className="text-[11.5px] text-pk-body">
        <span className="font-semibold text-pk-muted">Metode:</span> {details.method}
      </p>
      <p className="break-words text-[11.5px] text-pk-body">
        <span className="font-semibold text-pk-muted">Alamat / Tautan:</span> {details.location}
      </p>
    </div>
  );
}

export default function DetailStatusLamaran() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage('');

    api.get(`/v1/student/applications/${applicationId}`)
      .then(({ data }) => {
        if (active) setApplication(data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat detail lamaran.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [applicationId]);

  const downloadDocument = async (document) => {
    try {
      const { data } = await api.get(
        `/v1/student/applications/${application.id}/documents/${document.id}`,
        { responseType: 'blob' }
      );
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

  if (loading) {
    return (
      <StudentShell active="Lamaran saya">
        <div className="mx-auto w-full max-w-[1232px] px-6 py-16 text-[13px] text-pk-muted">
          Memuat perkembangan lamaran...
        </div>
      </StudentShell>
    );
  }

  if (!application) {
    return (
      <StudentShell active="Lamaran saya">
        <div className="mx-auto w-full max-w-[1232px] px-6 py-16">
          <p role="alert" className="mb-4 text-[13px] text-rose-700">{errorMessage}</p>
          <Link to="/lamaran" className="inline-flex items-center gap-2 text-[12px] font-bold text-pk-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Lamaran Saya
          </Link>
        </div>
      </StudentShell>
    );
  }

  const { merchant, job, student, documents, completeness, timeline, follow_up: followUp, histories } = application;

  return (
    <StudentShell active="Lamaran saya">
      <div className="mx-auto w-full max-w-[1232px] px-6 py-7">
        <Link to="/lamaran" className="inline-flex items-center gap-2 text-[11.5px] font-medium text-pk-muted transition hover:text-pk-primary">
          <ArrowLeft className="h-4 w-4" />
          Lamaran Saya <span className="text-pk-border">/</span> {merchant.merchant_name}
          <span className="text-pk-border">/</span> <span className="text-pk-primary">Detail Status Lamaran</span>
        </Link>

        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-pk-navy">
          Detail Status dan Perkembangan Seleksi
        </h1>
        <p className="mt-1.5 text-[12.5px] text-pk-muted">
          Ikuti setiap perkembangan lamaranmu, dari terkirim hingga keputusan akhir.
        </p>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
            {errorMessage}
          </p>
        )}

        {/* Kartu ringkasan lamaran */}
        <section className="mt-5 rounded-xl bg-pk-pastel px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-[13px] font-bold text-pk-primary">
                {merchant.initials}
              </span>
              <div>
                <h2 className="text-[22px] font-extrabold leading-tight text-pk-navy">{job.title}</h2>
                <p className="mt-1 text-[12px] text-pk-primary">
                  {merchant.merchant_name} · {merchant.address}
                </p>
              </div>
            </div>
            <StatusPill status={application.status} label={application.status_label} />
          </div>

          <div className="mt-5 grid gap-4 border-t border-[#A9DCE8] pt-4 sm:grid-cols-3">
            <p className="text-[11px]">
              <span className="block text-pk-muted">ID lamaran</span>
              <span className="mt-0.5 block text-[12px] font-semibold text-pk-body">{application.code}</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Dikirim pada</span>
              <span className="mt-0.5 block text-[12px] font-semibold text-pk-body">{application.submitted_label}</span>
            </p>
            <p className="text-[11px]">
              <span className="block text-pk-muted">Status terakhir</span>
              <span className="mt-0.5 block text-[12px] font-semibold text-pk-body">
                {application.status_label} sejak {application.status_since_label}
              </span>
            </p>
          </div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.62fr_1fr]">
          <div className="space-y-5">
            {/* Perkembangan seleksi */}
            <section className="rounded-xl border border-pk-border bg-white px-6 py-6">
              <h2 className="text-[16px] font-bold text-pk-navy">Perkembangan Seleksi</h2>
              <p className="mt-2 text-[12px] text-pk-muted">{timeline.caption}</p>

              <div className="mt-5 space-y-0 border-t border-pk-line pt-5">
                {timeline.stages.map((stage, index) => {
                  const isLast = index === timeline.stages.length - 1;
                  const lineDone = stage.state === 'done';
                  const badgeStyle = stage.tone === 'danger'
                    ? BADGE_STYLES.danger
                    : BADGE_STYLES[stage.state] || BADGE_STYLES.pending;

                  return (
                    <div key={stage.key} className={`relative flex gap-4 ${isLast ? '' : 'pb-6'}`}>
                      {!isLast && (
                        <span
                          className={`absolute left-[10.5px] top-6 w-px ${lineDone ? 'bg-pk-primary' : 'bg-pk-border'}`}
                          style={{ bottom: 0 }}
                        />
                      )}
                      <TimelineMarker stage={stage} index={index} />

                      <div className="min-w-0 flex-1 pb-0">
                        <h3 className="text-[14px] font-bold text-pk-navy">
                          {stage.title}
                        </h3>
                        <span className={`mt-1.5 inline-flex rounded px-2 py-[3px] text-[10px] font-semibold ${badgeStyle}`}>
                          {stage.badge}
                        </span>
                        <p className="mt-2 text-[12px] leading-[1.65] text-pk-muted">{stage.description}</p>

                        {stage.details && <InterviewDetails details={stage.details} />}

                        {stage.time_label && (
                          <p className="mt-2 text-[11px] font-semibold text-pk-primary">{stage.time_label}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tindak lanjut */}
            <section className={`rounded-xl px-6 py-5 ${followUp.tone === 'danger' ? 'bg-[#FDECEC]' : 'bg-[#D9F3F8]'}`}>
              <div className="flex items-start gap-3">
                <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${followUp.tone === 'danger' ? 'text-rose-600' : 'text-pk-primary'}`} />
                <div>
                  <h2 className="text-[13px] font-bold text-pk-navy">{followUp.title}</h2>
                  <p className={`mt-1.5 text-[11.5px] leading-[1.7] ${followUp.tone === 'danger' ? 'text-[#8A3B36]' : 'text-pk-body/85'}`}>
                    {followUp.body}
                  </p>
                  {followUp.action && (
                    <Link
                      to={`/lamaran/${application.id}/rekomendasi`}
                      className="mt-3 inline-flex rounded-md bg-pk-primary px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-pk-navy"
                    >
                      {followUp.action}
                    </Link>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            {/* Dokumen terkirim */}
            <section className="rounded-xl border border-pk-border bg-white px-5 py-5">
              <h2 className="text-[15px] font-bold text-pk-navy">Dokumen Terkirim</h2>
              <p className="mt-1.5 text-[11px] text-pk-muted">Dokumen berikut disertakan saat kamu mengirim lamaran.</p>

              <div className="mt-3.5 space-y-2.5">
                {documents.length === 0 && (
                  <p className="rounded-lg border border-dashed border-pk-border px-3 py-4 text-center text-[11px] text-pk-muted">
                    Belum ada dokumen yang diunggah.
                  </p>
                )}
                {documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => downloadDocument(document)}
                    className="flex w-full items-center gap-3 rounded-lg border border-[#CFEAF5] bg-[#EFF9FD] px-3.5 py-3 text-left transition hover:bg-[#E3F6FC]"
                    title={`Unduh ${document.original_name}`}
                  >
                    <FileText className="h-5 w-5 shrink-0 text-pk-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-pk-navy">{document.original_name}</span>
                      <span className="mt-0.5 block text-[10px] text-pk-muted">
                        {document.required ? 'Wajib' : 'Opsional'} · Terlampir · {document.format} · {document.size_label}
                      </span>
                    </span>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-pk-primary" />
                  </button>
                ))}
              </div>
            </section>

            {/* Kelengkapan lamaran */}
            <section className="rounded-xl border border-pk-border bg-white px-5 py-5">
              <h2 className="text-[15px] font-bold text-pk-navy">Kelengkapan Lamaran</h2>

              <span
                className={`mt-3 inline-flex rounded px-2 py-1 text-[10.5px] font-semibold ${
                  completeness.complete ? 'bg-[#E9F9F1] text-[#1F9D63]' : 'bg-[#FFF5E5] text-[#B7791F]'
                }`}
              >
                {completeness.badge}
              </span>

              <div className="mt-3.5 space-y-2.5">
                {completeness.items.map((item) => (
                  <p key={item.key} className="flex items-center gap-2.5 text-[11.5px] text-pk-body">
                    {item.done ? (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-pk-primary text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-[3px] border border-pk-border bg-white" />
                    )}
                    {item.label}
                  </p>
                ))}
              </div>

              <p className="mt-3 text-[10.5px] leading-4 text-pk-muted">{completeness.note}</p>

              <div className="mt-4 border-t border-pk-line pt-3.5">
                <p className="text-[10.5px] text-pk-muted">Jadwal kerja yang disetujui</p>
                <p className="mt-1 text-[11.5px] font-semibold text-pk-body">{completeness.work_schedule}</p>
              </div>
            </section>

            {/* Pelamar */}
            <section className="rounded-xl border border-pk-border bg-white px-5 py-5">
              <h2 className="text-[15px] font-bold text-pk-navy">Pelamar</h2>
              <p className="mt-3.5 text-[10.5px] text-pk-muted">Nama lengkap</p>
              <p className="mt-0.5 text-[12px] font-bold text-pk-navy">{student.name}</p>
              <p className="mt-2.5 text-[11.5px] text-pk-body">
                {[student.degree_level, student.major].filter(Boolean).join(' ')}
                {student.university ? ` · ${student.university}` : ''}
              </p>
              <p className="mt-0.5 text-[11.5px] text-pk-body">
                {student.is_currently_studying ? 'Mahasiswa aktif' : 'Alumni'}
              </p>
              <p className="mt-0.5 text-[11.5px] text-pk-body">{student.email}</p>
              <p className="mt-0.5 text-[11.5px] text-pk-body">{student.phone}</p>
            </section>
          </aside>
        </div>

        {/* Riwayat perubahan status */}
        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <h2 className="text-[16px] font-bold text-pk-navy">Riwayat Perubahan Status</h2>
          <p className="mt-1.5 text-[11.5px] text-pk-muted">
            {application.submitted_date_label} · Catatan perubahan yang sudah terjadi pada lamaran ini.
          </p>

          <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {histories.map((history) => (
              <div key={history.id}>
                <p className="text-[10.5px] font-semibold text-pk-primary">{history.time_label}</p>
                <h3 className={`mt-1 text-[12.5px] font-bold ${history.tone === 'danger' ? 'text-rose-600' : 'text-pk-navy'}`}>
                  {history.title}
                </h3>
                <p className="mt-1 text-[11px] leading-[1.6] text-pk-muted">{history.note}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-2">
          <Link
            to="/lamaran"
            className="inline-flex items-center gap-2 rounded-md border border-pk-border bg-white px-4 py-2.5 text-[11px] font-bold text-pk-navy transition hover:bg-pk-soft"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Lamaran Saya
          </Link>
          <p className="text-[11px] text-pk-muted">Status diperbarui saat ada perkembangan dari merchant.</p>
        </div>
      </div>
    </StudentShell>
  );
}
