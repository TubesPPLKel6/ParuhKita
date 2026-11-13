import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { downloadElementAsPdf } from '../../utils/pdfGenerator';
import { 
  FileText, 
  Printer, 
  ArrowLeft, 
  Edit3, 
  CheckCircle2, 
  GraduationCap, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Sparkles,
  Calendar,
  ShieldCheck,
  Download,
  X
} from 'lucide-react';

export default function CvList() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState('');
  const documentRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/v1/profile');
      if (res.data.status) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching profile for CV:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setDownloading(true);
    try {
      const sanitizedName = (profileData?.name || 'Mahasiswa').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const saved = await downloadElementAsPdf(documentRef.current, `CV_${sanitizedName}.pdf`);
      if (saved) {
        setToast(`Berkas CV_${sanitizedName}.pdf berhasil disimpan!`);
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setToast('Gagal memproses dokumen. Silakan coba kembali.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-medium text-[#536B82]">Menyiapkan dokumen CV otomatis...</p>
      </div>
    );
  }

  const user = profileData;
  const prof = profileData?.profile || {};
  const skills = profileData?.skills || [];
  const rawExperiences = prof.experiences || [];
  const experiences = Array.isArray(rawExperiences)
    ? rawExperiences
    : typeof rawExperiences === 'string'
    ? (() => { try { return JSON.parse(rawExperiences); } catch { return []; } })()
    : [];
  const rawProjects = prof.portfolio_projects || [];
  const projects = Array.isArray(rawProjects)
    ? rawProjects
    : typeof rawProjects === 'string'
    ? (() => { try { return JSON.parse(rawProjects); } catch { return []; } })()
    : [];
  const availabilities = profileData?.availabilities || [];

  return (
    <div className="min-h-screen bg-[#F6F9FC] py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:bg-white print:min-h-0">
      
      {/* Action Bar (Hidden saat di-print) */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#D8E5EE] shadow-xs">
          
          <div>
            <Link
              to="/profil"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#023E8A] hover:text-[#00B4D8] mb-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pengelolaan Profil</span>
            </Link>
            <h1 className="text-lg font-bold text-[#03045E] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00B4D8]" />
              <span>Dokumen CV Mahasiswa (Tergenerate Otomatis)</span>
            </h1>
            <p className="text-xs text-[#536B82] mt-0.5">
              Dokumen ini disusun otomatis dari data profil. Siap diunduh/dicetak sebagai PDF.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/profil"
              className="px-4 py-2 border border-[#D8E5EE] hover:bg-[#F6F9FC] text-[#102C4D] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </Link>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-5 py-2.5 bg-[#023E8A] hover:bg-[#03045E] disabled:opacity-75 disabled:cursor-wait text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
              title="Unduh berkas CV dan pilih folder simpan via File Explorer"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh CV (PDF)</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Info banner */}
        <div className="mt-3 bg-[#CAF0F8]/50 border border-[#00B4D8]/30 rounded-xl p-3 flex items-center gap-2 text-xs text-[#023E8A]">
          <Sparkles className="w-4 h-4 text-[#00B4D8] shrink-0" />
          <span>
            <strong>Unduh Otomatis:</strong> Berkas <em>.pdf</em> resmi akan langsung terunduh ke komputermu tanpa perlu dialog print browser.
          </span>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl shadow-2xl flex items-center gap-3 border bg-white/95 border-emerald-200 text-emerald-900 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{toast}</span>
            <button
              onClick={() => setToast('')}
              className="text-slate-400 hover:text-slate-600 ml-2"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LEMBAR DOKUMEN CV (STANDAR A4 PAPER VIEW)                    */}
      {/* ============================================================ */}
      <div 
        ref={documentRef}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-[#D8E5EE] p-8 sm:p-12 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none text-[#102C4D]"
      >
        
        {/* Header CV: Nama, Kontak & Foto */}
        <div className="border-b-2 border-[#03045E] pb-6 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#03045E]">
                {user?.name || 'NAMA LENGKAP MAHASISWA'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#CAF0F8] text-[#023E8A] text-[10px] font-bold rounded-full">
                <ShieldCheck className="w-3 h-3 text-[#00B4D8]" />
                <span>Terverifikasi ParuhKita</span>
              </span>
            </div>
            
            <p className="text-sm font-semibold text-[#023E8A]">
              {prof.degree_level ? `${prof.degree_level} ` : ''}{prof.major ? `${prof.major}` : 'Mahasiswa Aktif'} &middot; {prof.university || 'Perguruan Tinggi Indonesia'}
            </p>

            {/* Kontak Baris */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#536B82] pt-2">
              {user?.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#023E8A]" />
                  <span>{user.email}</span>
                </div>
              )}
              {prof.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#023E8A]" />
                  <span>{prof.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#023E8A]" />
                <span>Indonesia</span>
              </div>
              {prof.linkedin_url && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#023E8A]" />
                  <span>LinkedIn Profile</span>
                </div>
              )}
            </div>
          </div>

          {/* Foto Profil (jika ada) */}
          {(prof.photo_base64 || prof.photo_url) && (
            <div className="w-24 h-24 rounded-xl border-2 border-[#D8E5EE] overflow-hidden shrink-0 shadow-xs">
              <img 
                src={prof.photo_base64 || prof.photo_url}
                alt="Foto Profil" 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
        </div>

        {/* Body CV: Multi-Sections */}
        <div className="py-6 space-y-6">

          {/* 1. Tentang Saya / Ringkasan Pribadi */}
          {prof.bio && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E] border-b border-[#D8E5EE] pb-1 mb-2">
                Tentang Saya
              </h3>
              <p className="text-xs text-[#536B82] leading-relaxed">
                {prof.bio}
              </p>
            </div>
          )}

          {/* 2. Pendidikan */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E] border-b border-[#D8E5EE] pb-1 mb-3">
              Pendidikan
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-xs">
              <div>
                <p className="font-bold text-[#102C4D]">
                  {prof.university || 'Belum mengisi data universitas'}
                </p>
                <p className="text-[#536B82]">
                  {prof.degree_level ? `${prof.degree_level} ` : ''}{prof.major || 'Program Studi'}{prof.faculty ? ` · Fakultas ${prof.faculty}` : ''}
                </p>
                {prof.gpa && (
                  <p className="text-[11px] text-[#023E8A] font-medium mt-0.5">
                    Indeks Prestasi Kumulatif (IPK): {prof.gpa} / 4.00
                  </p>
                )}
              </div>
              {/* Tahun Masuk & Kelulusan */}
              {(prof.entry_year || prof.graduation_year) && (
                <span className="text-[11px] font-semibold text-[#536B82] self-start bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {prof.entry_year ? prof.entry_year : ''}
                  {prof.entry_year && ' - '}
                  {prof.is_currently_studying ? 'Sekarang' : (prof.graduation_year || 'Sekarang')}
                </span>
              )}
            </div>
          </div>

          {/* 3. Riwayat Pengalaman Kerja & Organisasi */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E] border-b border-[#D8E5EE] pb-1 mb-3">
              Pengalaman Kerja, Magang &amp; Organisasi
            </h3>
            {experiences.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Belum ada pengalaman yang diisi di profil.
              </p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="text-xs space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="font-bold text-[#102C4D] text-xs break-words">
                        {exp.role} <span className="font-normal text-[#536B82]">&middot; {exp.company}</span>
                      </p>
                      {exp.period && (
                        <span className="text-[11px] text-[#536B82] font-medium shrink-0">
                          {exp.period}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-[#536B82] leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Portofolio & Proyek Unggulan (Format Grid 2 Kolom Ringkas + line-clamp-3) */}
          {projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between border-b border-[#D8E5EE] pb-1 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E]">
                  Aktivitas &amp; Portofolio Karya
                </h3>
                <span className="text-[10px] text-[#536B82]">
                  {projects.length} Karya Unggulan
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl bg-[#F6F9FC] border border-[#D8E5EE] text-xs flex flex-col justify-between space-y-2 hover:border-[#00B4D8] transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#03045E] break-words flex-1 min-w-0">
                          {proj.title}
                        </span>
                        {proj.period && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {proj.period}
                          </span>
                        )}
                      </div>
                      {proj.category && (
                        <div>
                          <span className="inline-block text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium break-words">
                            {proj.category}
                          </span>
                        </div>
                      )}
                      {proj.description && (
                        <p className="text-[11px] text-[#536B82] line-clamp-3 leading-relaxed break-words [overflow-wrap:anywhere] pt-0.5">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Keterampilan & Kompetensi */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E] border-b border-[#D8E5EE] pb-1 mb-2.5">
              Keahlian &amp; Kompetensi
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada keahlian yang ditambahkan.</p>
              ) : (
                skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 bg-[#CAF0F8] text-[#023E8A] text-xs font-semibold rounded-md border border-[#00B4D8]/20"
                  >
                    {s.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 6. Ketersediaan Waktu Bekerja Paruh Waktu */}
          {availabilities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E] border-b border-[#D8E5EE] pb-1 mb-2">
                Ketersediaan Waktu (Jadwal Siap Kerja)
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {availabilities.map((a) => (
                  <span key={a.id} className="px-2 py-0.5 bg-slate-100 text-[#102C4D] rounded font-medium text-[11px]">
                    <strong>{a.day_of_week}:</strong> {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer CV: Otentikasi ParuhKita */}
        <div className="border-t border-[#D8E5EE] pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#536B82] gap-2">
          <span>Digenerate otomatis oleh Platform ParuhKita &middot; ID Akun: PK-{user?.id || '01'}</span>
          <span>Dokumen Resmi Validasi Kesiapan Kerja Mahasiswa Indonesia</span>
        </div>

      </div>

    </div>
  );
}
