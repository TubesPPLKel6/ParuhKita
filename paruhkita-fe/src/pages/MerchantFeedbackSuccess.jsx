import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../api/axios';
import MerchantShell from '../components/merchant/MerchantShell';

export default function MerchantFeedbackSuccess() {
  const { applicationId } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    api.get(`/v1/merchant/applications/${applicationId}/feedback-report`)
      .then(({ data }) => {
        if (!active) return;
        setPayload(data.data);
        if (data.data.report?.status !== 'final') {
          setErrorMessage('Feedback belum dikirim untuk pelamar ini.');
        }
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat ringkasan feedback.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [applicationId]);

  if (loading) {
    return (
      <MerchantShell active="Kandidat" activeTopNav="Kandidat" showTips={false}
      contentClassName="px-6 py-7 lg:px-10">
        <div className="py-16 text-[13px] text-pk-muted">Memuat ringkasan feedback...</div>
      </MerchantShell>
    );
  }

  if (!payload || errorMessage) {
    return (
      <MerchantShell active="Kandidat" activeTopNav="Kandidat" showTips={false}
      contentClassName="px-6 py-7 lg:px-10">
        <p role="alert" className="py-10 text-[13px] text-rose-700">{errorMessage}</p>
        <Link to={`/merchant/applications/${applicationId}/feedback`} className="text-[12px] font-bold text-pk-primary">
          Kembali ke Input Evaluasi
        </Link>
      </MerchantShell>
    );
  }

  const { application, report, sidebar } = payload;
  const merchant = application.merchant;

  return (
    <MerchantShell
      active="Kandidat"
      activeTopNav="Kandidat"
      merchant={{ merchant_name: merchant?.name, address: merchant?.address, is_verified: true }}
      counts={sidebar}
      showTips={false}
      contentClassName="px-6 py-7 lg:px-10"
    >
      <div className="w-full">
        <Link
          to={`/merchant/applications/${application.id}`}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-pk-muted transition hover:text-pk-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </Link>

        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-pk-navy">
          Feedback Berhasil Dikirim
        </h1>
        <p className="mt-1.5 text-[12.5px] text-pk-muted">
          Masukan evaluasi telah tersimpan dan dikirim kepada kandidat untuk pengembangan diri.
        </p>

        <section className="mt-5 rounded-lg bg-[#EDF9F1] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#157347] text-white">
              <Check className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[12.5px] font-bold text-[#157347]">Feedback berhasil disimpan dan dikirim</p>
              <p className="mt-1 text-[11.5px] text-[#157347]/90">
                Kandidat menerima notifikasi untuk membaca evaluasi dan rekomendasi perbaikan.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-xl bg-[#EDF7FC] px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold text-pk-navy">{application.candidate.name}</h2>
              <p className="mt-1 text-[11.5px] text-pk-body">
                Pelamar {application.job.title} · {merchant?.name}
              </p>
              <p className="mt-1.5 text-[10.5px] text-pk-muted">{application.status_note}</p>
            </div>
            <span className="rounded bg-[#FFF1F0] px-2.5 py-1 text-[10.5px] font-semibold text-[#B42318]">
              {application.status_label}
            </span>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-pk-border bg-white px-6 py-6">
          <h2 className="text-[16px] font-bold text-pk-navy">Ringkasan feedback terkirim</h2>

          <div className="mt-4 divide-y divide-pk-line">
            {(report.categories || []).map((category) => (
              <div key={category.id} className="py-4 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[12.5px] font-bold text-pk-navy">{category.name}</p>
                  <p className="shrink-0 text-[12.5px] font-bold text-pk-navy">{category.score ?? '-'} / 5</p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-[1.7] text-pk-muted">{category.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 border-t border-pk-line pt-4">
            <h3 className="text-[12.5px] font-bold text-pk-navy">Rekomendasi Perbaikan Tertulis</h3>
            <ul className="mt-2 space-y-1.5">
              {(report.recommendations || []).map((recommendation, index) => (
                <li key={index} className="flex gap-2 text-[11.5px] leading-[1.7] text-pk-body">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-pk-body" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-[10.5px] text-pk-muted">
            Status pelamar tetap {application.status_label}. Feedback tidak mengubah keputusan seleksi.
          </p>
        </section>

        <div className="mt-6 flex justify-end pb-2">
          <Link
            to="/merchant/candidates?status=rejected"
            className="rounded-md bg-pk-primary px-6 py-2.5 text-[12px] font-bold text-white transition hover:bg-pk-navy"
          >
            Kembali ke Riwayat Pelamar
          </Link>
        </div>
      </div>
    </MerchantShell>
  );
}
