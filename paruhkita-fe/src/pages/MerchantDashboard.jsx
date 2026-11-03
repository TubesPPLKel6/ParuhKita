import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Calendar, 
  MessageSquare,
  Plus,
  MoreHorizontal,
  Pencil,
  X,
  Bell,
  ChevronDown,
  LogOut
} from 'lucide-react';
import ModalTambahLowongan from "./ModalTambahLowongan";
import ModalVerifikasiMerchant from './ModalVerifikasiMerchant';

export default function MerchantDashboard() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [tabAktif, setTabAktif] = useState('Melamar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  const [modalFeedback, setModalFeedback] = useState({ sedangBuka: false, pelamar: null });
  const [teksFeedback, setTeksFeedback] = useState('');

  const namaMerchant = user?.name || 'Warung Bu Dewi';
  const lokasiMerchant = user?.location || 'Yogyakarta';
  const merchantProfile = user?.merchant_profile;
  const merchantLogoUrl = merchantProfile?.logo_path
    ? `${(api.defaults.baseURL || '').replace(/\/api\/?$/, '')}/storage/${merchantProfile.logo_path}`
    : null;
  const isVerified = merchantProfile?.is_verified === true;
  const verificationStatus = merchantProfile?.verification_status
    || (isVerified ? 'approved' : 'not_submitted');
  const inisialMerchant = namaMerchant.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleVerificationSubmitted = (updatedProfile) => {
    setUser((currentUser) => {
      const updatedUser = { ...currentUser, merchant_profile: updatedProfile };
      localStorage.setItem('pk_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const [kandidatList, setKandidatList] = useState([]);
  const [lowonganList, setLowonganList] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (!isVerified) return undefined;

    let active = true;
    api.get('/v1/merchant/jobs')
      .then(({ data }) => {
        if (!active) return;
        const jobs = data.data || [];
        setLowonganList(jobs.map((job) => ({
          ...job,
          judul: job.title,
          kuota: `${job.quota} · ${job.applications_count || 0} pelamar`,
          jadwal: job.schedule,
          upah: job.wage,
          kategori: job.category,
          subkategori: job.subcategory,
        })));
        setKandidatList(jobs.flatMap((job) => (job.applications || []).map((application) => {
          const student = application.student || {};
          const profile = student.student_profile || {};
          const statusLabels = {
            pending: 'Melamar',
            reviewing: 'Melamar',
            interview: 'Jadwal wawancara',
            trial: 'Trial shift',
            accepted: 'Diterima',
            rejected: 'Ditolak',
          };
          return {
            id: application.id,
            job_post_id: job.id,
            nama: student.name || 'Mahasiswa',
            univ: [profile.university, profile.major].filter(Boolean).join(' · ') || 'Profil mahasiswa belum dilengkapi',
            lowongan: job.title,
            tahap: statusLabels[application.status] || 'Melamar',
            status: application.status,
            pembaruan: new Date(application.created_at).toLocaleDateString('id-ID'),
          };
        })));
      })
      .catch((error) => {
        if (active) setDashboardError(error.response?.data?.message || (error.request ? 'Tidak dapat memuat lowongan dan pelamar.' : error.message));
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });

    return () => { active = false; };
  }, [isVerified]);

  const totalMelamar = kandidatList.filter(k => k.tahap === 'Melamar').length;
  const totalWawancara = kandidatList.filter(k => k.tahap === 'Jadwal wawancara').length;
  const totalTrial = kandidatList.filter(k => k.tahap === 'Trial shift').length;
  const totalDiterima = kandidatList.filter(k => k.tahap === 'Diterima').length;
  const totalPelamar = kandidatList.length;

  const handleTambahLowongan = async (lowonganBaru) => {
    if (!isVerified) return;
    const { data } = editingJob
      ? await api.put(`/v1/merchant/jobs/${editingJob.id}`, lowonganBaru)
      : await api.post('/v1/merchant/jobs', lowonganBaru);
    const job = data.data;
    const formattedJob = {
      ...job,
      judul: job.title,
      kuota: `${job.quota} · ${job.applications_count || 0} pelamar`,
      jadwal: job.schedule,
      upah: job.wage,
      kategori: job.category,
      subkategori: job.subcategory,
    };
    setLowonganList((current) => editingJob
      ? current.map((item) => item.id === job.id ? formattedJob : item)
      : [formattedJob, ...current]);
    if (editingJob) {
      setKandidatList((current) => current.map((candidate) => candidate.job_post_id === job.id
        ? { ...candidate, lowongan: job.title }
        : candidate));
    }
  };

  const handleTolak = async (e) => {
    e.preventDefault();
    if (!teksFeedback.trim()) {
      alert('Mohon isi feedback agar mahasiswa dapat memperbaiki CV/Portofolio.');
      return;
    }
    try {
      await api.patch(`/v1/merchant/applications/${modalFeedback.pelamar.id}`, {
        status: 'rejected',
        merchant_note: teksFeedback.trim(),
      });
      setKandidatList((current) => current.map((candidate) => candidate.id === modalFeedback.pelamar.id
        ? { ...candidate, tahap: 'Ditolak', status: 'rejected' }
        : candidate));
      setModalFeedback({ sedangBuka: false, pelamar: null });
      setTeksFeedback('');
    } catch (error) {
      setDashboardError(error.response?.data?.message || (error.request ? 'Tidak dapat memperbarui status lamaran.' : error.message));
    }
  };

  const handleApplicationStatus = async (applicationId, status) => {
    try {
      await api.patch(`/v1/merchant/applications/${applicationId}`, { status });
      const labels = { pending: 'Melamar', reviewing: 'Melamar', interview: 'Jadwal wawancara', trial: 'Trial shift', accepted: 'Diterima' };
      setKandidatList((current) => current.map((candidate) => candidate.id === applicationId
        ? { ...candidate, tahap: labels[status], status }
        : candidate));
    } catch (error) {
      setDashboardError(error.response?.data?.message || (error.request ? 'Tidak dapat memperbarui status lamaran.' : error.message));
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Hapus lowongan "${job.judul}"? Semua lamaran terkait juga akan dihapus.`)) return;
    try {
      await api.delete(`/v1/merchant/jobs/${job.id}`);
      setLowonganList((current) => current.filter((item) => item.id !== job.id));
      setKandidatList((current) => current.filter((candidate) => candidate.job_post_id !== job.id));
    } catch (error) {
      setDashboardError(error.response?.data?.message || (error.request ? 'Tidak dapat menghapus lowongan.' : error.message));
    }
  };

  const filteredKandidat = kandidatList.filter(k => {
    if (tabAktif === 'Melamar') return k.tahap === 'Melamar';
    if (tabAktif === 'Jadwal wawancara') return k.tahap === 'Jadwal wawancara';
    if (tabAktif === 'Trial shift') return k.tahap === 'Trial shift';
    if (tabAktif === 'Diterima') return k.tahap === 'Diterima';
    return tabAktif === 'Ditolak' ? k.tahap === 'Ditolak' : true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC]">
      
      {/* Header Utama Figma */}
      <header className="bg-[#03045E] text-white px-6 py-3.5 flex justify-between items-center relative shadow-sm shrink-0">
        <div className="flex items-center gap-2.5 z-10 cursor-pointer" onClick={() => navigate('/merchant/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-[#00B4D8] flex items-center justify-center text-white shadow-xs">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/>
              <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D"/>
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight">ParuhKita</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold absolute left-1/2 -translate-x-1/2">
          <button onClick={() => navigate('/merchant/dashboard')} className="text-[#00B4D8] font-bold">Dashboard</button>
          <button onClick={() => navigate('/merchant/dashboard')} className="text-slate-300 hover:text-white transition">Kandidat</button>
          <button onClick={() => navigate('/merchant/dashboard')} className="text-slate-300 hover:text-white transition">Lowongan</button>
        </nav>

        <div className="flex items-center gap-4 z-10">
          <button className="text-slate-300 hover:text-white transition relative">
            <Bell className="w-5 h-5" />
          </button>
          <div 
            onClick={() => navigate('/merchant/profile')}
            className="flex items-center gap-2.5 cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-2xl transition"
          >
            {merchantLogoUrl ? (
              <img
                src={merchantLogoUrl}
                alt={`Logo ${namaMerchant}`}
                className="h-7 w-7 rounded-full bg-white object-cover shadow-xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#CAF0F8] text-[#023E8A] flex items-center justify-center font-bold text-xs shadow-xs">
                {inisialMerchant}
              </div>
            )}
            <span className="text-xs font-semibold text-white">{namaMerchant}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 min-h-0">
        
        <aside className="w-64 bg-white border-r border-[#D8E5EE] flex flex-col justify-between hidden lg:flex shrink-0">
          <div>
            <div className="p-6 border-b border-[#D8E5EE]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#536B82]">Ruang Merchant</span>
              <h2 className="text-base font-bold text-[#03045E] mt-0.5">{namaMerchant}</h2>
              <p className="text-xs text-[#536B82]">{lokasiMerchant}</p>
              <div className={`mt-3 inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg ${isVerified ? 'bg-[#CAF0F8] text-[#023E8A]' : 'bg-amber-100 text-amber-800'}`}>
                {isVerified ? 'Usaha terverifikasi' : 'Menunggu verifikasi'}
              </div>
            </div>
            <nav className="p-4 space-y-1.5 text-xs font-semibold">
              <button onClick={() => navigate('/merchant/dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#023E8A] text-white font-bold text-left">
                <span>Ringkasan</span>
              </button>
              <button onClick={() => navigate('/merchant/dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left">
                <span>Lowongan</span>
              </button>
              <button onClick={() => navigate('/merchant/dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left">
                <span>Kandidat</span>
              </button>
              <button onClick={() => navigate('/merchant/dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left">
                <span>Jadwal</span>
              </button>
              <button onClick={() => navigate('/merchant/dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left">
                <span>Pesan</span>
              </button>
              <button onClick={() => navigate('/merchant/settings')} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left">
                <span>Pengaturan</span>
              </button>
            </nav>
          </div>
          
          <div className="p-4 m-4 bg-[#CAF0F8]/30 rounded-2xl border border-[#00B4D8]/20">
            <p className="text-xs font-bold text-[#03045E]">Butuh bantuan?</p>
            <p className="text-[11px] text-[#536B82] mt-1">Tim ParuhKita siap membantu rekrutmenmu.</p>
            <span className="text-xs font-bold text-[#023E8A] mt-2 inline-block cursor-pointer">Hubungi kami &rarr;</span>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto">
          {dashboardError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{dashboardError}</p>}
          {isVerified && dashboardLoading && <p className="rounded-xl border border-[#D8E5EE] bg-white p-3 text-xs text-[#536B82]">Memuat lowongan dan pelamar...</p>}
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#536B82] uppercase tracking-wider">Sabtu, 10 Oktober 2026</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#03045E] mt-0.5">
                Selamat pagi, tim {namaMerchant}.
              </h1>
              <p className="text-xs text-[#536B82] mt-1">
                {!merchantProfile
                  ? 'Buat kembali profil usaha sebelum mengajukan verifikasi.'
                  : isVerified
                    ? 'Talenta kampus terbaik untuk shift berikutnya.'
                    : 'Verifikasi usaha diperlukan sebelum kamu dapat menambahkan lowongan.'}
              </p>
              {verificationStatus === 'rejected' && merchantProfile?.verification_note && (
                <p className="mt-2 text-xs font-medium text-rose-700">
                  Catatan verifikasi: {merchantProfile.verification_note}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!merchantProfile ? (
                <button
                  type="button"
                  onClick={() => navigate('/merchant/profile')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#023E8A] px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#03045E]"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Buat Profil Usaha</span>
                </button>
              ) : isVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingJob(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Lowongan</span>
                </button>
              ) : (
                <>
                  {verificationStatus !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#023E8A] px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#03045E]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{verificationStatus === 'rejected' ? 'Ajukan Verifikasi Ulang' : 'Verifikasi Data'}</span>
                    </button>
                  )}
                  <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                    {verificationStatus === 'pending' ? 'Menunggu Verifikasi' : 'Belum Terverifikasi'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#536B82]">Lowongan aktif</span>
                <Briefcase className="w-4 h-4 text-[#023E8A]" />
              </div>
              <span className="text-3xl font-black text-[#03045E]">{lowonganList.length}</span>
              <span className="text-[11px] text-[#536B82] mt-1">{lowonganList.length} lowongan tersimpan</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#536B82]">Total pelamar</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-black text-[#03045E]">{totalPelamar}</span>
              <span className="text-[11px] text-[#536B82] mt-1">Dari lowonganmu</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#536B82]">Wawancara terjadwal</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-3xl font-black text-[#03045E]">{totalWawancara}</span>
              <span className="text-[11px] text-[#536B82] mt-1">2 berikutnya: 14 Oktober</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#536B82]">Kandidat diterima</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-3xl font-black text-[#03045E]">{totalDiterima}</span>
              <span className="text-[11px] text-[#536B82] mt-1">Siap bergabung bulan ini</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#03045E]">Pantau proses rekrutmen</h2>
                <p className="text-xs text-[#536B82]">{totalPelamar} kandidat &middot; Semua lowongan {namaMerchant}</p>
              </div>
              <button className="px-4 py-2 border border-[#D8E5EE] text-xs font-semibold text-[#03045E] rounded-xl hover:bg-slate-50 flex items-center gap-2">
                <span>Semua lowongan</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Melamar', count: totalMelamar },
                { label: 'Jadwal wawancara', count: totalWawancara },
                { label: 'Trial shift', count: totalTrial },
                { label: 'Diterima', count: totalDiterima },
                { label: 'Ditolak', count: kandidatList.filter((candidate) => candidate.tahap === 'Ditolak').length }
              ].map(tab => (
                <button
                  key={tab.label}
                  onClick={() => setTabAktif(tab.label)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                    tabAktif === tab.label 
                      ? 'bg-[#CAF0F8]/50 border-[#00B4D8] text-[#023E8A]' 
                      : 'bg-[#F6F9FC] border-[#D8E5EE] text-[#536B82] hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold">{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-extrabold ${tabAktif === tab.label ? 'bg-[#023E8A] text-white' : 'bg-white text-[#03045E]'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D8E5EE] text-[11px] font-bold text-[#536B82] uppercase">
                    <th className="py-3 px-4">KANDIDAT</th>
                    <th className="py-3 px-4">LOWONGAN</th>
                    <th className="py-3 px-4">TAHAP</th>
                    <th className="py-3 px-4">JADWAL / COCOK</th>
                    <th className="py-3 px-4">PEMBARUAN</th>
                    <th className="py-3 px-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E5EE] text-xs">
                  {filteredKandidat.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">Tidak ada kandidat pada tahap ini.</td>
                    </tr>
                  ) : (
                    filteredKandidat.map(k => (
                      <tr key={k.id} className="hover:bg-[#F6F9FC] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#CAF0F8] text-[#023E8A] flex items-center justify-center font-bold text-xs shrink-0">
                              {k.nama.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-[#03045E]">{k.nama}</p>
                              <p className="text-[11px] text-[#536B82]">{k.univ}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#536B82]">{k.lowongan}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-[#00B4D8] text-white font-bold rounded-lg text-[11px]">
                            {k.tahap}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#03045E]">{k.cocok}</td>
                        <td className="py-3.5 px-4 text-[#536B82]">{k.pembaruan}</td>
                        <td className="py-3.5 px-4 text-right">
                          {k.status !== 'rejected' && (
                            <div className="inline-flex items-center gap-2">
                              <select
                                aria-label={`Perbarui tahap lamaran ${k.nama}`}
                                value={k.status}
                                onChange={(event) => handleApplicationStatus(k.id, event.target.value)}
                                className="max-w-36 rounded-lg border border-[#D8E5EE] bg-white px-2 py-1.5 text-[10px]"
                              >
                                <option value="pending">Melamar</option>
                                <option value="reviewing">Meninjau</option>
                                <option value="interview">Jadwalkan wawancara</option>
                                <option value="trial">Trial shift</option>
                                <option value="accepted">Terima</option>
                              </select>
                              <button 
                                onClick={() => setModalFeedback({ sedangBuka: true, pelamar: k })}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[11px] transition shadow-xs">
                                Tolak
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#03045E]">Lowongan aktif</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {lowonganList.length === 0 && !dashboardLoading ? <p className="col-span-full rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center text-sm text-[#536B82]">Belum ada lowongan. Publikasikan lowongan pertamamu.</p> : lowonganList.map((l) => (
                <div key={l.id} className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-lg">Aktif</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { setEditingJob(l); setIsModalOpen(true); }} aria-label={`Ubah lowongan ${l.judul}`} title="Ubah lowongan" className="text-slate-400 hover:text-[#023E8A]"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleDeleteJob(l)} aria-label={`Hapus lowongan ${l.judul}`} title="Hapus lowongan" className="text-slate-400 hover:text-rose-600"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#03045E]">{l.judul}</h3>
                    {(l.kategori || l.subkategori) && <p className="mt-1 text-[10px] text-[#536B82]">{[l.kategori, l.subkategori].filter(Boolean).join(' · ')}</p>}
                    <p className="text-xs text-[#536B82] mt-0.5">{l.kuota}</p>
                    <p className="text-xs text-[#536B82] mt-2">&#128197; {l.jadwal}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#D8E5EE] flex items-center justify-between">
                    <span className="text-xs font-black text-[#023E8A]">{l.upah}</span>
                    <span className="text-xs font-bold text-[#023E8A] cursor-pointer">Kelola &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      <footer className="bg-[#03045E] text-white px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#00B4D8] flex items-center justify-center text-white shadow-xs">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/>
              <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D"/>
            </svg>
          </div>
          <span className="font-extrabold text-sm tracking-tight">ParuhKita</span>
        </div>
        
        <p className="text-slate-200 text-center">
          Langkah kecil, masa depan besar. &copy; 2026 ParuhKita
        </p>

        <div className="flex items-center gap-3 text-slate-200">
          <a href="#" className="hover:text-white transition">Pusat bantuan</a>
          <span>&middot;</span>
          <a href="#" className="hover:text-white transition">Privasi</a>
          <span>&middot;</span>
          <a href="#" className="hover:text-white transition">Ketentuan</a>
        </div>
      </footer>

      <ModalTambahLowongan 
        key={editingJob?.id || 'new-job'}
        isOpen={isVerified && isModalOpen}
        job={editingJob}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onTambahLowongan={handleTambahLowongan}
      />
      <ModalVerifikasiMerchant
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onSubmitted={handleVerificationSubmitted}
      />

      {modalFeedback.sedangBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-[#D8E5EE] overflow-hidden">
            <div className="p-5 border-b border-[#D8E5EE] flex items-center justify-between bg-[#F6F9FC]">
              <h3 className="text-sm font-bold text-[#03045E] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
                Berikan Feedback Penolakan
              </h3>
              <button onClick={() => setModalFeedback({ sedangBuka: false, pelamar: null })} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTolak} className="p-5 space-y-4">
              <p className="text-xs text-[#536B82] leading-relaxed">
                Kamu akan menolak pelamar <strong className="text-[#03045E]">{modalFeedback.pelamar.nama}</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#03045E] mb-1.5">Alasan & Feedback</label>
                <textarea 
                  rows="4" 
                  required
                  placeholder="Contoh: Jadwal kuliah berbenturan dengan shift..."
                  value={teksFeedback}
                  onChange={(e) => setTeksFeedback(e.target.value)}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalFeedback({ sedangBuka: false, pelamar: null })}
                  className="px-4 py-2 border border-[#D8E5EE] hover:bg-slate-50 text-[#03045E] font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Kirim Feedback & Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}