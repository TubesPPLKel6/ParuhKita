import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, LockKeyhole, Upload, XCircle } from 'lucide-react';
import api from '../../api/axios';

const steps = ['Detail lowongan', 'Formulir pengajuan', 'Persyaratan', 'Konfirmasi'];
const requiredDocuments = [
  { key: 'cv', label: 'CV / Resume', formats: 'PDF', maxSize: 2, required: true },
  { key: 'student_id', label: 'KTM / Bukti Mahasiswa Aktif', formats: 'PDF, JPG, atau PNG', maxSize: 2, required: true },
  { key: 'portfolio', label: 'Portofolio', formats: 'PDF', maxSize: 5, required: false },
];
const cardClass = 'rounded-lg border border-[#D8E5EE] bg-white p-5';

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LamarLowongan() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [motivation, setMotivation] = useState('');
  const [consent, setConsent] = useState(false);
  const [documents, setDocuments] = useState({ cv: null, student_id: null, portfolio: null });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [application, setApplication] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/v1/jobs/${jobId}`), api.get('/v1/profile')])
      .then(([jobResponse, profileResponse]) => {
        if (!active) return;
        setJob(jobResponse.data.data);
        setProfile(profileResponse.data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat formulir lamaran.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId]);

  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(`application-draft-${jobId}`) || 'null');
      if (draft) {
        setMotivation(draft.motivation || '');
        setConsent(Boolean(draft.consent));
      }
    } catch {
      sessionStorage.removeItem(`application-draft-${jobId}`);
    }
  }, [jobId]);

  const merchant = job?.merchant_profile || {};
  const student = profile?.profile || {};
  const isStudentVerified = student.is_verified && student.verification_status === 'approved';
  const missingRequiredDocuments = useMemo(
    () => requiredDocuments.filter((document) => document.required && !documents[document.key]),
    [documents],
  );

  const saveDraft = () => {
    sessionStorage.setItem(`application-draft-${jobId}`, JSON.stringify({ motivation, consent }));
    setErrorMessage('Draft formulir disimpan di perangkat ini.');
  };

  const selectDocument = (key, file) => {
    setErrorMessage('');
    if (!file) return;
    const rules = requiredDocuments.find((item) => item.key === key);
    const extension = file.name.split('.').pop().toLowerCase();
    const allowed = key === 'student_id' ? ['pdf', 'jpg', 'jpeg', 'png'] : ['pdf'];
    if (!allowed.includes(extension) || file.size > rules.maxSize * 1024 * 1024) {
      setErrorMessage(`${rules.label}: format ${rules.formats}, maksimal ${rules.maxSize} MB.`);
      setDocuments((current) => ({ ...current, [key]: null }));
      return;
    }
    setDocuments((current) => ({ ...current, [key]: file }));
  };

  const submitApplication = async () => {
    setSending(true);
    setErrorMessage('');
    const payload = new FormData();
    payload.append('motivation', motivation.trim());
    Object.entries(documents).forEach(([key, file]) => { if (file) payload.append(key, file); });
    try {
      const { data } = await api.post(`/v1/jobs/${jobId}/applications`, payload);
      sessionStorage.removeItem(`application-draft-${jobId}`);
      setApplication(data.data);
      setStep(4);
    } catch (error) {
      const validationMessage = error.response?.data?.errors && Object.values(error.response.data.errors)[0]?.[0];
      setErrorMessage(validationMessage || error.response?.data?.message || 'Lamaran belum dapat dikirim. Coba kembali.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-[#536B82]">Menyiapkan formulir...</div>;
  if (!job) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-rose-700">{errorMessage}</div>;
  if (!isStudentVerified) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <section className="rounded-xl border border-amber-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 shrink-0 text-amber-600" size={22} />
          <div>
            <h1 className="text-lg font-extrabold text-[#03045E]">Verifikasi KTM diperlukan</h1>
            <p className="mt-2 text-sm leading-6 text-[#536B82]">
              {student.verification_status === 'pending'
                ? 'Dokumen KTM kamu sedang ditinjau admin. Kamu dapat melamar setelah verifikasi disetujui.'
                : student.verification_status === 'rejected' || student.verification_status === 'revision_required'
                  ? 'Dokumen KTM perlu diperbarui sebelum kamu dapat mengajukan lamaran.'
                  : 'Ajukan dokumen KTM untuk diverifikasi admin sebelum mengajukan lamaran.'}
            </p>
            {student.verification_note && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{student.verification_note}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/kesiapan-karier" className="rounded-lg bg-[#F59E0B] px-4 py-2.5 text-xs font-bold text-[#03045E]">Verifikasi KTM</Link>
              <Link to={`/lowongan/${job.id}`} className="rounded-lg border border-[#D8E5EE] px-4 py-2.5 text-xs font-bold text-[#03045E]">Kembali ke Lowongan</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F9FC]">
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
        <nav className="flex items-center gap-2 text-[11px] text-[#023E8A]"><Link to={`/lowongan/${jobId}`} className="inline-flex items-center gap-1"><ArrowLeft size={13} /> Detail Lowongan</Link><span>/</span><span>{steps[Math.min(step, 3)]}</span></nav>
        <div>
          <h1 className="text-2xl font-extrabold text-[#03045E]">{step === 2 ? 'Melengkapi Persyaratan Lamaran' : step === 3 ? 'Konfirmasi dan Pengiriman Lamaran' : step === 4 ? 'Lamaran Berhasil Dikirim!' : 'Formulir Pengajuan Lamaran'}</h1>
          <p className="mt-1 text-xs text-[#536B82]">{step === 4 ? 'Lamaranmu sudah diteruskan ke merchant.' : 'Periksa biodata dan lengkapi informasi untuk melamar lowongan ini.'}</p>
        </div>

        <div className="grid grid-cols-4 rounded-lg border border-[#D8E5EE] bg-white px-3 py-3 sm:px-5">
          {steps.map((label, index) => {
            const current = index + 1;
            const activeStep = step === 4 ? 4 : step + 1;
            const complete = step === 4 || activeStep > current;
            return <div key={label} className="flex min-w-0 items-center gap-2 text-[9px] sm:text-[11px]">
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${complete ? 'bg-[#0346C8] text-white' : activeStep === current ? 'bg-[#03045E] text-white' : 'bg-[#E4EDF4] text-[#536B82]'}`}>{complete ? <Check size={12} /> : current}</span>
              <span className={activeStep === current ? 'font-bold text-[#03045E]' : 'text-[#536B82]'}>{label}</span>
            </div>;
          })}
        </div>

        {errorMessage && <p role="alert" className={`rounded-md border p-3 text-xs ${errorMessage.startsWith('Draft') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{errorMessage}</p>}

        {step < 4 && <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(250px,0.85fr)]">
          <div className="space-y-4">
            {step === 1 && <>
              <section className={cardClass}>
                <h2 className="text-base font-bold text-[#03045E]">Data Diri Pelamar</h2>
                <span className="mt-2 inline-block rounded bg-[#EEF9FC] px-2 py-1 text-[9px] text-[#023E8A]">Otomatis dari profil</span>
                <p className="mt-3 text-[10px] text-[#536B82]">Data kontak dan pendidikan diambil dari profilmu.</p>
                <div className="mt-4 grid gap-3 text-[10px] sm:grid-cols-2">
                  {[['Nama lengkap', profile?.name], ['Email', profile?.email], ['Nomor telepon', student.phone], ['Universitas / institusi', student.university], ['Pendidikan / program studi', [student.degree_level, student.major].filter(Boolean).join(' · ')], ['Status studi', student.is_currently_studying === false ? 'Tidak aktif' : 'Mahasiswa aktif']].map(([label, value]) => <label key={label} className="space-y-1"><span className="font-semibold text-[#102C4D]">{label}</span><div className="flex min-h-9 items-center justify-between rounded-md border border-[#D8E5EE] bg-[#F6F9FC] px-3 py-2 text-[#536B82]">{value || 'Belum diisi di profil'}<LockKeyhole size={12} /></div></label>)}
                </div>
              </section>
              <section className={cardClass}>
                <h2 className="text-base font-bold text-[#03045E]">Motivasi / Alasan Melamar</h2>
                <textarea value={motivation} onChange={(event) => setMotivation(event.target.value)} rows={5} maxLength={3000} placeholder="Ceritakan motivasi dan pengalaman yang relevan untuk posisi ini..." className="mt-3 w-full resize-y rounded-md border border-[#D8E5EE] bg-[#F6F9FC] p-3 text-xs leading-5 text-[#102C4D] outline-none focus:border-[#00B4D8]" />
                <p className="mt-1 text-[10px] text-[#536B82]">Minimal 20 karakter · {motivation.length}/3000</p>
              </section>
              <label className="flex items-center gap-2 text-[11px] text-[#102C4D]"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="accent-[#0346C8]" />Saya bersedia bekerja sesuai jadwal yang tercantum.</label>
            </>}

            {step === 2 && <>
              {requiredDocuments.map((document) => <section key={document.key} className={cardClass}>
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-[#03045E]">{document.label}</h2><p className="mt-1 text-[10px] text-[#536B82]">{document.formats} · Maksimal {document.maxSize} MB</p></div><span className={`rounded px-2 py-1 text-[9px] ${document.required ? 'bg-[#EEF9FC] text-[#0346C8]' : 'bg-[#F4F7FA] text-[#536B82]'}`}>{document.required ? 'Wajib' : 'Opsional'}</span></div>
                <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3 ${documents[document.key] ? 'border-[#C9E7F5] bg-[#EFFAFF]' : 'border-dashed border-[#F3A3A3] bg-[#FFF6F6]'}`}>
                  <div className="flex items-center gap-2"><FileText size={17} className={documents[document.key] ? 'text-[#0346C8]' : 'text-rose-500'} /><div><p className="text-[11px] font-semibold text-[#102C4D]">{documents[document.key]?.name || `Unggah ${document.label}`}</p><p className="text-[9px] text-[#536B82]">{documents[document.key] ? `${formatSize(documents[document.key].size)} · Siap dikirim` : 'Pilih berkas dari perangkatmu'}</p></div></div>
                  <label className="cursor-pointer rounded-md border border-[#D8E5EE] bg-white px-3 py-2 text-[10px] font-bold text-[#03045E] hover:bg-slate-50">{documents[document.key] ? 'Ganti Berkas' : 'Pilih Berkas'}<input type="file" accept={document.key === 'student_id' ? '.pdf,.jpg,.jpeg,.png' : '.pdf'} className="sr-only" onChange={(event) => selectDocument(document.key, event.target.files?.[0])} /></label>
                </div>
                <p className={`mt-2 flex items-center gap-1 text-[10px] ${documents[document.key] ? 'text-emerald-700' : document.required ? 'text-rose-600' : 'text-[#536B82]'}`}>{documents[document.key] ? <CheckCircle2 size={12} /> : document.required ? <XCircle size={12} /> : null}{documents[document.key] ? 'Terunggah · Siap dikirim' : document.required ? 'Belum terunggah · Belum terpenuhi' : 'Portofolio opsional'}</p>
              </section>)}
            </>}

            {step === 3 && <>
              <section className={cardClass}>
                <h2 className="text-base font-bold text-[#03045E]">Biodata Pelamar</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 text-[11px]">{[['Nama lengkap', profile?.name], ['Status studi', student.is_currently_studying === false ? 'Tidak aktif' : 'Mahasiswa aktif'], ['Pendidikan / program studi', [student.degree_level, student.major, student.university].filter(Boolean).join(' · ')], ['Email', profile?.email], ['Nomor telepon', student.phone]].map(([label, value]) => <div key={label}><p className="text-[9px] text-[#536B82]">{label}</p><p className="mt-1 font-semibold text-[#102C4D]">{value || 'Belum diisi'}</p></div>)}</div>
              </section>
              <section className={cardClass}><h2 className="text-base font-bold text-[#03045E]">Motivasi dan Ketersediaan</h2><p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#536B82]">{motivation}</p><p className="mt-3 border-t border-[#E8EFF4] pt-3 text-[10px] text-[#102C4D]">{consent ? 'Persetujuan jadwal kerja terpenuhi.' : 'Persetujuan jadwal belum diberikan.'}</p></section>
              <section className={cardClass}><h2 className="text-base font-bold text-[#03045E]">Dokumen Terlampir</h2><div className="mt-3 space-y-2">{requiredDocuments.map((document) => <div key={document.key} className="flex items-center gap-2 rounded-md border border-[#D8E5EE] bg-[#EFFAFF] p-3"><FileText size={15} className="shrink-0 text-[#0346C8]" /><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold text-[#102C4D]">{documents[document.key]?.name || `${document.label} tidak disertakan`}</p><p className="text-[9px] text-[#536B82]">{documents[document.key] ? `${document.required ? 'Wajib' : 'Opsional'} · ${formatSize(documents[document.key].size)}` : document.required ? 'Dokumen wajib' : 'Opsional'}</p></div>{documents[document.key] ? <CheckCircle2 size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-rose-500" />}</div>)}</div></section>
            </>}

            <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D8E5EE] bg-white p-4">
              <div><p className="text-[11px] font-semibold text-[#03045E]">{step === 1 ? 'Biodata dan motivasi siap ditinjau.' : step === 2 ? `${missingRequiredDocuments.length ? `${missingRequiredDocuments.length} dokumen wajib belum lengkap.` : 'Seluruh dokumen wajib sudah lengkap.'}` : 'Periksa kembali sebelum mengirim.'}</p><p className="mt-1 text-[10px] text-[#536B82]">{step === 1 ? 'Lengkapi semua informasi untuk melanjutkan.' : step === 2 ? 'Dokumen dikirim hanya setelah kamu menekan tombol kirim.' : 'Lamaran akan diteruskan ke merchant setelah dikirim.'}</p></div>
              <div className="flex gap-2">
                {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-md border border-[#D8E5EE] px-4 py-2 text-[10px] font-bold text-[#03045E]">Kembali</button>}
                {step === 1 && <button type="button" onClick={saveDraft} className="rounded-md border border-[#D8E5EE] px-4 py-2 text-[10px] font-bold text-[#03045E]">Simpan Draft</button>}
                {step === 1 && <button type="button" disabled={motivation.trim().length < 20 || !consent} onClick={() => { setErrorMessage(''); setStep(2); }} className="inline-flex items-center gap-1 rounded-md bg-[#F59E0B] px-4 py-2 text-[10px] font-bold text-[#03045E] disabled:cursor-not-allowed disabled:opacity-50">Lanjutkan ke Persyaratan <ArrowRight size={13} /></button>}
                {step === 2 && <button type="button" disabled={missingRequiredDocuments.length > 0} onClick={() => { setErrorMessage(''); setStep(3); }} className="inline-flex items-center gap-1 rounded-md bg-[#F59E0B] px-4 py-2 text-[10px] font-bold text-[#03045E] disabled:cursor-not-allowed disabled:opacity-50">Lanjutkan <ArrowRight size={13} /></button>}
                {step === 3 && <button type="button" disabled={sending || missingRequiredDocuments.length > 0 || !consent} onClick={submitApplication} className="inline-flex items-center gap-1 rounded-md bg-[#F59E0B] px-4 py-2 text-[10px] font-bold text-[#03045E] disabled:cursor-not-allowed disabled:opacity-50">{sending ? 'Mengirim...' : 'Kirim Lamaran'} <ArrowRight size={13} /></button>}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg bg-[#CAF0F8] p-5">
              <p className="text-[9px] font-semibold uppercase text-[#023E8A]">Kamu melamar untuk</p>
              <h2 className="mt-4 text-sm font-bold text-[#03045E]">{merchant.merchant_name || 'Merchant'}</h2>
              <p className="mt-1 text-xl font-extrabold text-[#03045E]">{job.title}</p>
              <p className="mt-2 text-[10px] text-[#023E8A]">{merchant.address || 'Lokasi tidak dicantumkan'}</p>
              <div className="mt-4 space-y-3 border-t border-[#A9DCE8] pt-3 text-[10px]"><p><span className="block text-[#536B82]">Sistem kerja</span>Paruh waktu · Di lokasi</p><p><span className="block text-[#536B82]">Hari & jam kerja</span>{job.schedule}</p><p><span className="block text-[#536B82]">Estimasi gaji</span>{job.wage}</p><p><span className="block text-[#536B82]">Batas akhir lamaran</span>{job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('id-ID') : 'Selama lowongan aktif'}</p></div>
              <Link to={`/lowongan/${job.id}`} className="mt-4 inline-block rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#03045E]">Kembali ke Detail Lowongan</Link>
            </section>
            <section className={cardClass}><h2 className="text-sm font-bold text-[#03045E]">Berikutnya: Persyaratan</h2><p className="mt-2 text-[10px] leading-5 text-[#536B82]">CV dan KTM wajib dilampirkan. Portofolio bersifat opsional.</p></section>
          </aside>
        </div>}

        {step === 4 && <section className="mx-auto max-w-2xl rounded-lg border border-[#D8E5EE] bg-white p-6 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#CAF0F8]"><CheckCircle2 size={28} className="text-[#0346C8]" /></span>
          <h2 className="mt-4 text-2xl font-extrabold text-[#03045E]">Lamaran Berhasil Dikirim!</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#536B82]">Lamaranmu telah diteruskan kepada {merchant.merchant_name}. Pantau status dan perkembangan proses seleksi di Lamaran Saya.</p>
          <div className="mt-6 rounded-lg border border-[#D8E5EE] bg-[#EFFAFF] p-5 text-left"><p className="text-sm font-bold text-[#03045E]">{job.title}</p><p className="mt-1 text-[10px] text-[#536B82]">{merchant.merchant_name} · {merchant.address}</p><p className="mt-4 text-[10px] text-[#536B82]">ID Lamaran</p><p className="font-semibold text-[#102C4D]">PK-{application?.id}</p><p className="mt-3 text-[10px] text-emerald-700">Semua dokumen wajib berhasil disertakan.</p></div>
          <button type="button" onClick={() => navigate(`/lamaran/${application?.id}`)} className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-[#03045E]">Lihat Status Lamaran <ArrowRight size={14} /></button>
          <p className="mt-4"><Link to="/lamaran" className="text-[10px] font-semibold text-[#023E8A]">Lihat seluruh pengajuan di Lamaran Saya</Link></p>
        </section>}
      </main>
    </div>
  );
}
