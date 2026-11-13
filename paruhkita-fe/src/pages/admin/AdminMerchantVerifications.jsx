import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, RefreshCw, XCircle } from 'lucide-react';
import api from '../../api/axios';

const documentLabels = {
  ktp: 'KTP pemilik usaha',
  nib: 'NIB / pendaftaran usaha',
  business_license: 'Izin usaha',
  store_photo: 'Foto lokasi usaha',
  npwp: 'NPWP',
};

export default function AdminMerchantVerifications() {
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const fetchApplications = () => api.get('/v1/admin/merchant-verifications');

  const loadApplications = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchApplications();
      setApplications(response.data.data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message
        || 'Gagal memuat permohonan verifikasi merchant.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchApplications()
      .then((response) => {
        if (active) setApplications(response.data.data);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error.response?.data?.message
            || 'Gagal memuat permohonan verifikasi merchant.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDownload = async (document) => {
    setErrorMessage('');
    try {
      const response = await api.get(
        `/v1/admin/merchant-verifications/documents/${document.id}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(response.data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || `Gagal mengunduh ${document.original_name}.`);
    }
  };

  const handleReview = async (profile, approved) => {
    setErrorMessage('');
    setNotice('');
    if (!approved && !notes[profile.id]?.trim()) {
      setErrorMessage(`Masukkan alasan penolakan untuk ${profile.merchant_name}.`);
      return;
    }

    setProcessingId(profile.id);
    try {
      const url = `/v1/admin/merchant-verifications/${profile.id}/${approved ? 'approve' : 'reject'}`;
      await api.post(url, approved ? {} : { note: notes[profile.id].trim() });
      setApplications((current) => current.filter((application) => application.id !== profile.id));
      setNotice(`Permohonan ${profile.merchant_name} ${approved ? 'disetujui' : 'ditolak'}.`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Gagal menyimpan keputusan verifikasi.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      <main className="mx-auto max-w-5xl space-y-5 p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#03045E]">Verifikasi Merchant</h1>
            <p className="mt-1 text-xs text-[#536B82]">Tinjau kelengkapan dokumen sebelum menyetujui usaha.</p>
          </div>
          <button type="button" onClick={loadApplications} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#D8E5EE] bg-white px-4 py-2.5 text-xs font-bold text-[#023E8A] transition hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Muat ulang
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center text-sm text-[#536B82]">
            Memuat permohonan...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-[#03045E]">Tidak ada permohonan yang menunggu.</p>
          </div>
        ) : applications.map((profile) => (
          <section key={profile.id} className="space-y-5 rounded-2xl border border-[#D8E5EE] bg-white p-5 shadow-xs sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D8E5EE] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#03045E]">{profile.merchant_name}</h2>
                <p className="mt-1 text-xs text-[#536B82]">{profile.user?.name} · {profile.user?.email}</p>
                <p className="mt-1 text-[11px] text-[#536B82]">
                  Dikirim: {profile.verification_submitted_at
                    ? new Date(profile.verification_submitted_at).toLocaleString('id-ID')
                    : '-'}
                </p>
              </div>
              <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-[10px] font-bold text-amber-800">Menunggu verifikasi</span>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#536B82]">Dokumen</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {(profile.verification_documents || []).map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => handleDownload(document)}
                    className="flex items-center gap-3 rounded-xl border border-[#D8E5EE] p-3 text-left transition hover:border-[#00B4D8] hover:bg-[#F6F9FC]"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-[#023E8A]" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[#03045E]">{documentLabels[document.document_type] || document.document_type}</span>
                      <span className="block truncate text-[10px] text-[#536B82]">{document.original_name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-[#D8E5EE] pt-4">
              <label className="block text-xs font-semibold text-[#03045E]" htmlFor={`rejection-note-${profile.id}`}>
                Alasan penolakan (wajib jika menolak)
              </label>
              <textarea
                id={`rejection-note-${profile.id}`}
                rows="2"
                value={notes[profile.id] || ''}
                onChange={(event) => setNotes((current) => ({ ...current, [profile.id]: event.target.value }))}
                placeholder="Jelaskan dokumen yang perlu diperbaiki..."
                className="w-full rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] px-3.5 py-2.5 text-xs text-[#03045E] focus:border-[#00B4D8] focus:outline-none"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={processingId === profile.id}
                  onClick={() => handleReview(profile, false)}
                  className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Tolak
                </button>
                <button
                  type="button"
                  disabled={processingId === profile.id}
                  onClick={() => handleReview(profile, true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {processingId === profile.id ? 'Menyimpan...' : 'Setujui Verifikasi'}
                </button>
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
