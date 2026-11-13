import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  CheckCircle2,
  Circle,
  Upload,
  Download,
  Edit3,
  GraduationCap,
  MapPin,
  Mail,
  Lock,
  Award,
  Star,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Coffee,
  ShieldCheck,
} from 'lucide-react';

export default function KesiapanKarier() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nim, setNim] = useState('');
  const [ktmFile, setKtmFile] = useState(null);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profRes, cvRes] = await Promise.all([
          api.get('/v1/profile'),
          api.get('/v1/cv')
        ]);
        if (profRes.data.status) setProfileData(profRes.data.data);
        if (cvRes.data.status) setCvList(cvRes.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-medium text-[#536B82]">Menyiapkan halaman kesiapan karier...</p>
      </div>
    );
  }

  const primaryCv = cvList.find(c => c.is_primary) || cvList[0];
  const prof = profileData?.profile;
  const skills = profileData?.skills || [];
  const verificationStatus = prof?.verification_status || 'not_submitted';

  const submitVerification = async (event) => {
    event.preventDefault();
    const submittedNim = nim.trim() || prof?.nim || '';
    if (!submittedNim || !ktmFile) {
      setVerificationMessage('NIM dan file KTM wajib diisi.');
      return;
    }
    setVerificationBusy(true);
    setVerificationMessage('');
    try {
      const formData = new FormData();
      formData.append('nim', submittedNim);
      formData.append('ktm_file', ktmFile);
      await api.post('/v1/student/verification', formData);
      setProfileData((current) => ({ ...current, profile: { ...current.profile, nim: submittedNim, verification_status: 'pending', verification_note: null } }));
      setKtmFile(null);
      setVerificationMessage('Dokumen KTM berhasil dikirim dan sedang ditinjau admin.');
    } catch (error) {
      setVerificationMessage(error.response?.data?.message || 'Gagal mengirim dokumen KTM.');
    } finally {
      setVerificationBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] pb-16">

      {/* ==================================================== */}
      {/* 1. HERO BANNER: KESIAPAN KARIER & VERIFIKASI (NAVY) */}
      {/* ==================================================== */}
      <section className="bg-[#03045E] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          <div className="max-w-2xl">
            <span className="text-[11px] font-bold text-[#00B4D8] uppercase tracking-wider block mb-2">
              Kesiapan Karier &amp; Verifikasi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Bukan sekadar profil. Bukti kamu siap.
            </h1>
            <p className="mt-2.5 text-sm text-slate-300">
              Tunjukkan identitas terverifikasi, pengalaman, dan kemampuanmu kepada merchant.
            </p>
          </div>

          {/* Right: Kesiapan Profil Progress Card */}
          <div className="bg-[#023E8A]/60 border border-[#00B4D8]/30 backdrop-blur-sm rounded-2xl p-5 w-full lg:w-80 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Kesiapan profil</span>
              <span className="text-2xl font-black text-white">85%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-[#00B4D8] h-full rounded-full" style={{ width: '85%' }}></div>
            </div>

            <p className="text-[11px] text-slate-300 mt-3 font-medium">
              Tinggal latihan wawancara. Kamu hampir siap!
            </p>
          </div>

        </div>
      </section>

      {/* ==================================================== */}
      {/* 2. MAIN 3-COLUMN LAYOUT                              */}
      {/* ==================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ------------------------------------------------ */}
          {/* KOLOM KIRI (3 Cols): Profil & Verifikasi Mahasiswa */}
          {/* ------------------------------------------------ */}
          <div className="lg:col-span-3 space-y-5">

            {/* Card Profil */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs text-center">

              {/* Avatar — klik langsung ke halaman /profil */}
              <Link
                to="/profil"
                className="w-20 h-20 rounded-full bg-[#03045E] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md mb-3 border-2 border-[#00B4D8] hover:scale-105 transition cursor-pointer relative group"
                title="Klik untuk membuka halaman Pengelolaan Profil"
              >
                {prof?.photo_url ? (
                  <img src={`http://127.0.0.1:8000${prof.photo_url}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'NA'
                )}
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] text-white font-bold">
                  Edit
                </div>
              </Link>

              <h2 className="text-base font-bold text-[#102C4D]">{user?.name || 'Nama Mahasiswa'}</h2>
              <p className="text-xs text-[#536B82] mt-0.5">Mahasiswa &middot; Semester 5</p>

              {/* Badge KTM Terverifikasi */}
              <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${verificationStatus === 'approved' ? 'bg-[#00B4D8] text-white' : verificationStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-[#536B82]'}`}>
                {verificationStatus === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{verificationStatus === 'approved' ? 'KTM terverifikasi' : verificationStatus === 'pending' ? 'Sedang diverifikasi' : 'Belum terverifikasi'}</span>
              </div>

              {/* Detail Info */}
              <div className="mt-5 text-left text-xs text-[#536B82] space-y-2.5 pt-4 border-t border-[#D8E5EE]">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#023E8A] shrink-0" />
                  <span className="truncate">{prof?.university || 'Universitas'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center font-bold text-[#023E8A]">📖</span>
                  <span className="truncate">{prof?.major || 'Program Studi'} &middot; Angkatan {prof?.graduation_year ? prof.graduation_year - 4 : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#023E8A] shrink-0" />
                  <span className="truncate">Indonesia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#023E8A] shrink-0" />
                  <span className="truncate">{user?.email || '-'}</span>
                </div>
              </div>

              {/* Stats: Rating / Shift / Kehadiran */}
              <div className="mt-5 pt-4 border-t border-[#D8E5EE] grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-[#102C4D]">4,8/5</p>
                  <p className="text-[10px] text-[#536B82]">6 ulasan</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#102C4D]">18</p>
                  <p className="text-[10px] text-[#536B82]">shift selesai</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#102C4D]">100%</p>
                  <p className="text-[10px] text-[#536B82]">kehadiran</p>
                </div>
              </div>

              {/* Tombol Kelola Profil — langsung ke /profil */}
              <Link
                to="/profil"
                className="mt-5 w-full py-2 px-3 border border-[#D8E5EE] hover:bg-[#F6F9FC] text-[#102C4D] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Kelola Profil &amp; Berkas</span>
              </Link>
            </div>

            {/* Card Verifikasi Mahasiswa & Visual KTM */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#023E8A]" />
                <h3 className="text-xs font-bold text-[#102C4D]">Verifikasi mahasiswa</h3>
              </div>

              {/* Digital KTM Card */}
              <div className="bg-[#03045E] rounded-xl p-3.5 text-white shadow-sm relative overflow-hidden">
                <div className="text-[9px] font-bold tracking-wider text-slate-300 uppercase mb-2">
                  KARTU TANDA MAHASISWA
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-[#00B4D8]">
                    {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'NA'}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{user?.name || 'Nama Mahasiswa'}</p>
                    <p className="text-[10px] text-slate-300">{prof?.university || 'Universitas'}</p>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-mono">
                  NIM {prof?.nim || 'belum diisi'} &middot; {prof?.is_currently_studying === false ? 'Tidak aktif' : 'Aktif'}
                </p>
              </div>

              {/* Status pill */}
              <div className={`mt-3 inline-block px-2.5 py-0.5 font-bold text-[10px] rounded-full ${verificationStatus === 'approved' ? 'bg-[#00B4D8] text-white' : verificationStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-[#536B82]'}`}>
                {verificationStatus === 'approved' ? 'Identitas terverifikasi' : verificationStatus === 'pending' ? 'Menunggu pemeriksaan admin' : 'Identitas belum diverifikasi'}
              </div>

              <p className="text-[11px] text-[#536B82] mt-2 leading-relaxed">
                {prof?.verification_note || 'Dokumen hanya digunakan untuk validasi akun.'}
              </p>

              {verificationStatus !== 'approved' && verificationStatus !== 'pending' && <form className="mt-3 space-y-2 border-t border-[#D8E5EE] pt-3" onSubmit={submitVerification}>
                <input value={nim || prof?.nim || ''} onChange={(event) => setNim(event.target.value)} placeholder="Nomor Induk Mahasiswa (NIM)" className="w-full rounded-lg border border-[#D8E5EE] bg-[#F6F9FC] px-2.5 py-2 text-[10px] outline-none focus:border-[#00B4D8]" />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#D8E5EE] bg-[#F6F9FC] px-2.5 py-2 text-[10px] text-[#536B82]"><Upload className="h-3.5 w-3.5 text-[#00B4D8]" /><span className="min-w-0 flex-1 truncate">{ktmFile?.name || 'Unggah KTM (PDF/JPG/PNG, maks. 3MB)'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => setKtmFile(event.target.files?.[0] || null)} /></label>
                <button type="submit" disabled={verificationBusy} className="w-full rounded-lg bg-[#00B4D8] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#023E8A] disabled:opacity-50">{verificationBusy ? 'Mengirim...' : verificationStatus === 'revision_required' ? 'Unggah Ulang KTM' : 'Ajukan Verifikasi KTM'}</button>
                {verificationMessage && <p className="text-[10px] font-medium text-[#536B82]">{verificationMessage}</p>}
              </form>}

              <button className="mt-2 text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8] inline-flex items-center gap-1 transition">
                <span>Lihat detail verifikasi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* ------------------------------------------------ */}
          {/* KOLOM TENGAH (6 Cols): CV & Pratinjau Dokumen     */}
          {/* ------------------------------------------------ */}
          <div className="lg:col-span-6 space-y-4">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#102C4D]">CV &amp; kesiapan kerja</h2>
                <p className="text-xs text-[#536B82]">
                  Digenerate otomatis dari profil &middot; Siap diunduh sebagai PDF
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/profil"
                  className="px-3 py-1.5 border border-[#D8E5EE] hover:bg-white text-[#102C4D] font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </Link>

                <Link
                  to="/cv"
                  className="px-3.5 py-1.5 bg-[#023E8A] hover:bg-[#03045E] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh CV (PDF)</span>
                </Link>
              </div>
            </div>

            {/* Paper Document Preview (White Card) */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-sm text-[#102C4D] space-y-5">

              {/* Document Header */}
              <div className="border-b border-[#D8E5EE] pb-4">
                <h3 className="text-xl font-extrabold uppercase tracking-wide text-[#03045E]">
                  {user?.name || 'NAMA MAHASISWA'}
                </h3>
                <p className="text-xs font-semibold text-[#023E8A] mt-0.5">
                  {prof?.major || 'Program Studi'} &middot; {prof?.university || 'Perguruan Tinggi'}
                </p>
                <p className="text-[11px] text-[#536B82] mt-0.5">
                  {user?.email || ''} {prof?.phone ? `· ${prof.phone}` : ''}
                </p>
              </div>

              {/* Tentang Saya */}
              <div>
                <h4 className="text-xs font-bold text-[#03045E] uppercase tracking-wider mb-1.5">
                  TENTANG SAYA
                </h4>
                <p className="text-xs text-[#536B82] leading-relaxed">
                  {prof?.bio || 'Mahasiswa aktif yang siap berkontribusi kerja paruh waktu secara profesional.'}
                </p>
              </div>

              {/* Pendidikan */}
              <div>
                <h4 className="text-xs font-bold text-[#03045E] uppercase tracking-wider mb-1.5">
                  PENDIDIKAN
                </h4>
                <p className="text-xs font-bold text-[#102C4D]">
                  {prof?.university || 'Perguruan Tinggi'}
                </p>
                <p className="text-[11px] text-[#536B82]">
                  {prof?.faculty ? `${prof.faculty} - ` : ''}{prof?.major || 'Program Studi'} &middot; IPK {prof?.gpa || '-'}/4,00
                </p>
              </div>

              {/* Pengalaman */}
              {prof?.experiences && prof.experiences.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#03045E] uppercase tracking-wider mb-1.5">
                    PENGALAMAN KERJA &amp; ORGANISASI
                  </h4>
                  <div className="space-y-2">
                    {prof.experiences.slice(0, 2).map((exp, idx) => (
                      <div key={idx} className="text-xs">
                        <p className="font-bold text-[#102C4D]">{exp.role} <span className="font-normal text-[#536B82]">&middot; {exp.company}</span></p>
                        <p className="text-[11px] text-[#536B82] line-clamp-1">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keterampilan */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[#03045E] uppercase tracking-wider mb-2">
                  KETERAMPILAN
                </h4>
                <div className="flex flex-wrap gap-1.5 text-xs text-[#536B82]">
                  {skills.length > 0 ? (
                    skills.map((s, i) => (
                      <span key={s.id || i} className="px-2.5 py-0.5 bg-[#CAF0F8] text-[#023E8A] rounded-md text-[11px] font-semibold">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Tambahkan skill di halaman profil</span>
                  )}
                </div>
              </div>

              {/* Bottom Document Info */}
              <div className="border-t border-[#D8E5EE] pt-4 flex items-center justify-between text-xs text-[#536B82]">
                <span className="text-[11px]">Format Standar &middot; Tergenerate Otomatis</span>
                <Link
                  to="/cv"
                  className="font-bold text-[#023E8A] hover:text-[#00B4D8] inline-flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Buka Lembar CV Lengkap &rarr;</span>
                </Link>
              </div>

            </div>

          </div>

          {/* ------------------------------------------------ */}
          {/* KOLOM KANAN (3 Cols): Checklist Kesiapanmu        */}
          {/* ------------------------------------------------ */}
          <div className="lg:col-span-3 space-y-4">

            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#102C4D] mb-4">Checklist kesiapanmu</h3>

              <div className="space-y-3.5 text-xs">

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#102C4D]">Profil &amp; kontak</p>
                    <p className="text-[11px] text-[#536B82]">Lengkap di halaman profil</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#102C4D]">Verifikasi identitas</p>
                    <p className="text-[11px] text-[#536B82]">Terverifikasi ParuhKita</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#102C4D]">Dokumen CV</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Tergenerate otomatis</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#102C4D]">Dokumen Portofolio</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Tergenerate otomatis</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#102C4D]">Latihan wawancara</p>
                    <p className="text-[11px] text-slate-400">Belum selesai</p>
                  </div>
                </div>

              </div>

              {/* Helper CTA */}
              <div className="mt-6 pt-4 border-t border-[#D8E5EE]">
                <p className="text-[11px] text-[#536B82] leading-relaxed mb-3">
                  Satu langkah lagi: latih jawabanmu sebelum wawancara!
                </p>
                <button className="w-full py-2.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5">
                  <span>Mulai latihan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Privacy Box */}
            <div className="bg-[#CAF0F8]/50 border border-[#00B4D8]/30 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-[#023E8A]">
              <Lock className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                CV hanya dibagikan kepada merchant yang kamu lamar.
              </p>
            </div>

          </div>

        </div>

        {/* ==================================================== */}
        {/* 3. BAGIAN BAWAH: SERTIFIKAT & DIPERCAYA MERCHANT    */}
        {/* ==================================================== */}

        {/* Sertifikat & Kemampuan */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#102C4D]">Sertifikat &amp; kemampuan</h2>
            <a href="#" className="text-xs font-bold text-[#023E8A] hover:text-[#00B4D8] flex items-center gap-1 transition">
              <span>Jelajahi kursus</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Kursus 1 */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-[#CAF0F8] text-[#023E8A]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#00B4D8] text-white text-[10px] font-bold rounded-full">
                    Terverifikasi
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#102C4D] mt-3">Komunikasi Pelanggan</h3>
                <p className="text-xs text-[#536B82] mt-0.5">ParuhKita Academy &middot; 28 Sep 2026</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">ID sertifikat: PK-2026-0918</p>
              </div>
              <button className="mt-4 pt-3 border-t border-[#D8E5EE] text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8] flex items-center justify-center gap-1.5 transition">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lihat sertifikat</span>
              </button>
            </div>

            {/* Kursus 2 */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#00B4D8] text-white text-[10px] font-bold rounded-full">
                    Terverifikasi
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#102C4D] mt-3">Dasar Barista</h3>
                <p className="text-xs text-[#536B82] mt-0.5">ParuhKita Academy &middot; 2 Okt 2026</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">ID sertifikat: PK-2026-1024</p>
              </div>
              <button className="mt-4 pt-3 border-t border-[#D8E5EE] text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8] flex items-center justify-center gap-1.5 transition">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lihat sertifikat</span>
              </button>
            </div>

          </div>
        </section>

        {/* Dipercaya Merchant Lokal (Testimoni & Reputasi) */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#102C4D]">Dipercaya merchant lokal</h2>
            <div className="flex items-center gap-1 text-xs font-bold text-[#102C4D]">
              <Star className="w-3.5 h-3.5 text-[#FBB02D] fill-current" />
              <span>4,8/5 &middot; 6 ulasan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102C4D]">Roti Pagi</span>
                <div className="flex text-[#FBB02D]">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                </div>
              </div>
              <p className="text-xs text-[#536B82] mt-2 italic leading-relaxed">
                &ldquo;Cepat belajar, tepat waktu, dan ramah dengan pelanggan.&rdquo;
              </p>
              <p className="text-[10px] text-slate-400 mt-3">31 Agustus 2026 &middot; Shift terverifikasi</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#102C4D]">Dapur Kampus</span>
                <div className="flex text-[#FBB02D]">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                </div>
              </div>
              <p className="text-xs text-[#536B82] mt-2 italic leading-relaxed">
                &ldquo;Komunikasinya baik dan selalu siap membantu tim saat ramai.&rdquo;
              </p>
              <p className="text-[10px] text-slate-400 mt-3">30 September 2026 &middot; Shift terverifikasi</p>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}
