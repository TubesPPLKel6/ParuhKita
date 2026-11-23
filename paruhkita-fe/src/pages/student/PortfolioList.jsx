import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { downloadElementAsPdf } from '../../utils/pdfGenerator';
import { 
  Briefcase, 
  Printer, 
  ArrowLeft, 
  Edit3, 
  ExternalLink, 
  Sparkles, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone,
  Globe, 
  FolderCheck,
  CheckCircle2,
  Calendar,
  Download,
  X
} from 'lucide-react';

export default function PortfolioList() {
  const [searchParams] = useSearchParams();
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
      console.error('Error fetching profile for Portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setDownloading(true);
    try {
      const sanitizedName = (profileData?.name || 'Mahasiswa').trim().replace(/[^a-zA-Z0-9]/g, '_');
      const saved = await downloadElementAsPdf(documentRef.current, `Portofolio_${sanitizedName}.pdf`);
      if (saved) {
        setToast(`Berkas Portofolio_${sanitizedName}.pdf berhasil disimpan!`);
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error('Error generating Portfolio PDF:', err);
      setToast('Gagal memproses dokumen. Silakan coba kembali.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setDownloading(false);
    }
  };

  // Jika URL memiliki parameter ?download=true atau ?print=true (misal diarahkan dari CV), langsung picu pengunduhan PDF otomatis
  useEffect(() => {
    if (!loading && profileData && (searchParams.get('download') === 'true' || searchParams.get('print') === 'true')) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, profileData, searchParams]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-medium text-[#536B82]">Menyiapkan dokumen portofolio otomatis...</p>
      </div>
    );
  }

  const user = profileData;
  const prof = profileData?.profile || {};
  const skills = profileData?.skills || [];
  const rawProjects = prof.portfolio_projects || [];
  const projects = Array.isArray(rawProjects)
    ? rawProjects
    : typeof rawProjects === 'string'
    ? (() => { try { return JSON.parse(rawProjects); } catch { return []; } })()
    : [];

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
              <Briefcase className="w-5 h-5 text-[#F59E0B]" />
              <span>Dokumen Portofolio Mahasiswa (Tergenerate Otomatis)</span>
            </h1>
            <p className="text-xs text-[#536B82] mt-0.5">
              Dokumen ini merangkum seluruh aktivitas, proyek, dan karya yang kamu isi pada profilmu.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/profil"
              className="px-4 py-2 border border-[#D8E5EE] hover:bg-[#F6F9FC] text-[#102C4D] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Karya di Profil</span>
            </Link>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-75 disabled:cursor-wait text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2"
              title="Unduh berkas Portofolio dan pilih folder simpan via File Explorer"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Portofolio (PDF)</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Info banner */}
        <div className="mt-3 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0" />
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
      {/* LEMBAR DOKUMEN PORTOFOLIO (STANDAR A4 PAPER VIEW)            */}
      {/* ============================================================ */}
      <div 
        ref={documentRef}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-[#D8E5EE] p-8 sm:p-12 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none text-[#102C4D]"
      >
        
        {/* Header Portofolio */}
        <div className="border-b-2 border-[#F59E0B] pb-6 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="inline-block px-3 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-full mb-1">
              SHOWCASE PORTOFOLIO &amp; KARYA MAHASISWA
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#03045E]">
              {user?.name || 'NAMA MAHASISWA'}
            </h2>
            
            <p className="text-sm font-semibold text-[#023E8A]">
              {prof.degree_level ? `${prof.degree_level} ` : ''}{prof.major ? `${prof.major}` : 'Mahasiswa'} &middot; {prof.university || 'Perguruan Tinggi Indonesia'}
            </p>

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
            </div>
          </div>

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

        {/* Ringkasan Profil */}
        {prof.bio && (
          <div className="py-5 border-b border-[#D8E5EE]">
            <p className="text-xs text-[#536B82] leading-relaxed italic">
              &ldquo;{prof.bio}&rdquo;
            </p>
          </div>
        )}

        {/* Daftar Showcase Karya & Proyek */}
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E]">
              Daftar Karya, Proyek &amp; Aktivitas Nyata
            </h3>
            <span className="text-xs text-[#536B82] font-semibold">
              Total: {projects.length} Karya
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 bg-[#F6F9FC] rounded-2xl border border-dashed border-[#D8E5EE]">
              <FolderCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#102C4D]">Belum ada proyek atau karya yang tercatat</p>
              <p className="text-[11px] text-[#536B82] mt-1 max-w-sm mx-auto">
                Silakan buka halaman Profil dan isi bagian <strong>Portofolio Karya &amp; Proyek</strong> untuk menampilkannya di dokumen ini.
              </p>
              <Link
                to="/profil"
                className="inline-block mt-4 px-4 py-2 bg-[#023E8A] text-white text-xs font-bold rounded-xl"
              >
                Isi Karya di Profil
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {projects.map((proj, index) => (
                <div 
                  key={proj.id || index}
                  className="p-5 rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] text-xs space-y-2.5 break-inside-avoid"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8E5EE] pb-2.5">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#00B4D8] uppercase tracking-wider block">
                        Karya #{index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-[#03045E] mt-0.5 break-words">
                        {proj.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {proj.category && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full break-words">
                          {proj.category}
                        </span>
                      )}
                      {proj.period && (
                        <span className="text-[11px] text-[#536B82] font-medium shrink-0">
                          {proj.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  {proj.description && (
                    <p className="text-xs text-[#536B82] leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                      {proj.description}
                    </p>
                  )}

                  {/* Link / URL */}
                  {proj.project_url && (
                    <div className="pt-1">
                      <a
                        href={proj.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#023E8A] hover:text-[#00B4D8] transition max-w-full break-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Lihat Bukti Karya Online ({proj.project_url})</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Kompetensi & Keterampilan Pendukung */}
          {skills.length > 0 && (
            <div className="pt-6 border-t border-[#D8E5EE]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#03045E] mb-3">
                Keahlian &amp; Tools Pendukung Karya
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 bg-[#CAF0F8] text-[#023E8A] text-xs font-semibold rounded-md"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Dokumen */}
        <div className="border-t border-[#D8E5EE] pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#536B82] gap-2">
          <span>Digenerate otomatis oleh Platform ParuhKita &middot; ID Akun: PK-{user?.id || '01'}</span>
          <span>Lembar Portofolio Resmi Mahasiswa Indonesia</span>
        </div>

      </div>

    </div>
  );
}
