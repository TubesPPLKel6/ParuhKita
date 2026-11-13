import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2, 
  Bell, 
  X, 
  AlertTriangle,
  LogOut 
} from 'lucide-react';

export default function MerchantSettings() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  // State Tab Utama Pengaturan ('keamanan' atau 'notifikasi')
  const [tabPengaturan, setTabPengaturan] = useState('keamanan');

  // Data Dinamis Merchant
  const merchantProfile = user?.merchant_profile;
  const namaMerchant = merchantProfile?.merchant_name || user?.name || 'Warung Bu Dewi';
  const lokasiMerchant = merchantProfile?.address || user?.location || 'Yogyakarta';
  const isVerified = merchantProfile?.is_verified === true;
  const inisialMerchant = namaMerchant.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const logoUrl = merchantProfile?.logo_path
    ? `${(api.defaults.baseURL || '').replace(/\/api\/?$/, '')}/storage/${merchantProfile.logo_path}`
    : null;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // State Informasi Login & Email
  const [emailOverride, setEmailOverride] = useState(null);
  const emailMerchant = emailOverride || user?.email || 'halo@warungbudewi.id';
  const [modalEmailBuka, setModalEmailBuka] = useState(false);
  const [inputEmailBaru, setInputEmailBaru] = useState('');

  // State Form Ubah Kata Sandi
  const [formSandi, setFormSandi] = useState({
    saatIni: '',
    baru: '',
    konfirmasi: ''
  });

  // State 2FA
  const [is2FAActive, setIs2FAActive] = useState(true);

  // State Modal Hapus Akun
  const [modalHapusBuka, setModalHapusBuka] = useState(false);
  const [konfirmasiTeksHapus, setKonfirmasiTeksHapus] = useState('');
  const [menghapusProfil, setMenghapusProfil] = useState(false);
  const [hapusError, setHapusError] = useState('');

  // State Preferensi Notifikasi
  const [notifState, setNotifState] = useState({
    pelamarBaru: true,
    pengingatWawancara: true,
    statusTrial: true,
    newsletter: false
  });

  // Handler Ubah Email
  const handleUbahEmail = (e) => {
    e.preventDefault();
    if (!inputEmailBaru.trim()) {
      alert('Mohon masukkan email baru yang valid.');
      return;
    }
    setEmailOverride(inputEmailBaru);
    setModalEmailBuka(false);
    setInputEmailBaru('');
    alert('Email login merchant berhasil diperbarui!');
  };

  // Handler Perbarui Kata Sandi
  const handlePerbaruiSandi = (e) => {
    e.preventDefault();
    if (!formSandi.saatIni || !formSandi.baru || !formSandi.konfirmasi) {
      alert('Mohon lengkapi semua kolom kata sandi.');
      return;
    }
    if (formSandi.baru.length < 8) {
      alert('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (formSandi.baru !== formSandi.konfirmasi) {
      alert('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    alert('Kata sandi berhasil diperbarui!');
    setFormSandi({ saatIni: '', baru: '', konfirmasi: '' });
  };

  // Handler Hapus Akun
  const handleHapusAkun = async (e) => {
    e.preventDefault();
    if (konfirmasiTeksHapus !== namaMerchant) {
      setHapusError(`Ketik "${namaMerchant}" untuk mengonfirmasi penghapusan profil usaha.`);
      return;
    }

    setMenghapusProfil(true);
    setHapusError('');
    try {
      await api.delete('/v1/merchant/profile');
      const updatedUser = { ...user, merchant_profile: null };
      setUser(updatedUser);
      localStorage.setItem('pk_user', JSON.stringify(updatedUser));
      navigate('/merchant/dashboard', { replace: true });
    } catch (error) {
      setHapusError(
        error.response?.data?.message
        || (error.request ? 'Tidak dapat terhubung ke server.' : error.message)
      );
    } finally {
      setMenghapusProfil(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC]">
      
      {/* Header Utama Figma */}
      <header className="bg-[#03045E] text-white px-6 py-3.5 flex justify-between items-center relative shadow-sm shrink-0">
        <div className="flex items-center gap-2.5 z-10 cursor-pointer" onClick={() => navigate('/merchant/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-[#00B4D8] flex items-center justify-center text-white shadow-xs">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/>
              <path d="M12 3a9 9 0 0 0-9 9c0 3.1 1.57 5.83 3.97 7.46l2.1-3.64A5 5 0 0 1 7 12a5 5 0 0 1 5-5c1.68 0 3.17.83 4.07 2.1l2.84-2.13A8.96 8.96 0 0 0 12 3z"/>
              <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D"/>
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight">ParuhKita</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold absolute left-1/2 -translate-x-1/2">
          <button onClick={() => navigate('/merchant/dashboard')} className="text-slate-300 hover:text-white transition">Dashboard</button>
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
            {logoUrl ? (
              <img src={logoUrl} alt={`Logo ${namaMerchant}`} className="h-7 w-7 rounded-full bg-white object-cover shadow-xs" />
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

      {/* Body Utama */}
      <div className="flex flex-1 min-h-0">
        
        {/* Sidebar Kiri Merchant (Pengaturan AKTIF / BOLD BLUE PILL) */}
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
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left transition"
              >
                <span>Ringkasan</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left transition"
              >
                <span>Lowongan</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left transition"
              >
                <span>Kandidat</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left transition"
              >
                <span>Jadwal</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left transition"
              >
                <span>Pesan</span>
              </button>
              {/* TOMBOL PENGATURAN AKTIF/BOLD */}
              <button 
                onClick={() => navigate('/merchant/settings')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#023E8A] text-white font-bold text-left shadow-xs transition"
              >
                <span>Pengaturan</span>
              </button>
            </nav>
          </div>
          
          <div className="p-4 m-4 bg-[#CAF0F8]/30 rounded-2xl border border-[#00B4D8]/20">
            <p className="text-xs font-bold text-[#03045E]">Butuh bantuan?</p>
            <p className="text-[11px] text-[#536B82] mt-1">Tim ParuhKita siap membantu rekrutmenmu.</p>
            <span className="text-xs font-bold text-[#023E8A] mt-2 inline-block cursor-pointer hover:underline">Hubungi kami &rarr;</span>
          </div>
        </aside>

        {/* Konten Halaman Pengaturan */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header Title */}
            <div>
              <p className="text-xs font-bold text-[#536B82] uppercase tracking-wider">RUANG MERCHANT / PENGATURAN</p>
              <h1 className="text-2xl font-extrabold text-[#03045E] mt-1">Pengaturan profil merchant</h1>
              <p className="text-xs text-[#536B82] mt-0.5">Perkenalkan {namaMerchant} dan bangun kepercayaan calon anggota timmu.</p>
            </div>

            {/* Tab Header Pengaturan */}
            <div className="flex border-b border-[#D8E5EE] gap-8 text-xs font-semibold text-[#536B82]">
              <button 
                onClick={() => setTabPengaturan('keamanan')}
                className={`pb-3 border-b-2 transition ${tabPengaturan === 'keamanan' ? 'border-[#023E8A] text-[#023E8A] font-bold' : 'border-transparent hover:text-[#03045E]'}`}
              >
                Akun & keamanan
              </button>
              <button 
                onClick={() => setTabPengaturan('notifikasi')}
                className={`pb-3 border-b-2 transition ${tabPengaturan === 'notifikasi' ? 'border-[#023E8A] text-[#023E8A] font-bold' : 'border-transparent hover:text-[#03045E]'}`}
              >
                Notifikasi
              </button>
            </div>

            {/* Grid Konten Pengaturan + Preview Sisi Kanan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Kolom Kiri: Form & Opsi Pengaturan */}
              <div className="lg:col-span-2 space-y-6">
                
                {tabPengaturan === 'keamanan' ? (
                  <>
                    {/* Card 1: Informasi Login */}
                    <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                        <Mail className="w-4 h-4 text-[#023E8A]" />
                        <h3 className="text-sm font-bold text-[#03045E]">Informasi login</h3>
                      </div>
                      <p className="text-[11px] text-[#536B82]">Kelola akses akun merchant dan pastikan informasi login tetap aman.</p>
                      
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#03045E]">Email saat ini</label>
                        <div className="flex items-center justify-between gap-4 bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-4 py-2.5">
                          <span className="text-xs text-[#03045E] font-medium">{emailMerchant}</span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Terverifikasi
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#536B82]">Gunakan email aktif untuk menerima notifikasi dan pemulihan akun.</span>
                        <button 
                          type="button"
                          onClick={() => setModalEmailBuka(true)}
                          className="px-4 py-2 border border-[#D8E5EE] hover:bg-slate-50 text-[#03045E] font-bold text-xs rounded-xl transition shadow-xs"
                        >
                          Ubah Email
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Ubah Kata Sandi */}
                    <form onSubmit={handlePerbaruiSandi} className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                        <KeyRound className="w-4 h-4 text-[#023E8A]" />
                        <h3 className="text-sm font-bold text-[#03045E]">Ubah kata sandi</h3>
                      </div>
                      <p className="text-[11px] text-[#536B82]">Gunakan kata sandi yang kuat dan bedakan dari akun lain.</p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#03045E] mb-1">Kata Sandi Saat Ini *</label>
                          <input 
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={formSandi.saatIni}
                            onChange={(e) => setFormSandi({ ...formSandi, saatIni: e.target.value })}
                            className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#03045E] mb-1">Kata Sandi Baru *</label>
                          <input 
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={formSandi.baru}
                            onChange={(e) => setFormSandi({ ...formSandi, baru: e.target.value })}
                            className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#03045E] mb-1">Konfirmasi *</label>
                          <input 
                            type="password"
                            required
                            placeholder="••••••••••••"
                            value={formSandi.konfirmasi}
                            onChange={(e) => setFormSandi({ ...formSandi, konfirmasi: e.target.value })}
                            className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-[#536B82]">Minimal 8 karakter dan gunakan kombinasi huruf, angka, serta simbol.</span>
                        <button 
                          type="submit"
                          className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition"
                        >
                          Perbarui Kata Sandi
                        </button>
                      </div>
                    </form>

                    {/* Card 3: Autentikasi Dua Langkah (2FA) */}
                    <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                        <ShieldCheck className="w-4 h-4 text-[#023E8A]" />
                        <h3 className="text-sm font-bold text-[#03045E]">Autentikasi dua langkah (2FA)</h3>
                      </div>
                      <p className="text-[11px] text-[#536B82]">Tambahkan lapisan keamanan ekstra untuk setiap akses akun merchant.</p>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs font-bold text-[#03045E]">Aktifkan 2FA</p>
                          <p className="text-[11px] text-[#536B82] mt-0.5">Gunakan kode autentikator untuk memastikan hanya kamu yang dapat masuk.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIs2FAActive(!is2FAActive)}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${is2FAActive ? 'bg-[#00B4D8] justify-end' : 'bg-slate-300 justify-start'}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </button>
                      </div>
                    </div>

                    {/* Card 4: Zona Berbahaya */}
                    <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-rose-200">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <h3 className="text-sm font-bold text-rose-900">Zona berbahaya</h3>
                      </div>
                      <p className="text-[11px] text-rose-700">Tindakan ini menghapus profil usaha, tetapi akun login tetap aktif.</p>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-800">
                          {user?.merchant_profile ? 'Profil usaha dan dokumen verifikasi akan dihapus.' : 'Profil usaha tidak ditemukan.'}
                        </p>
                        <p className="text-[11px] text-rose-600">
                          {user?.merchant_profile
                            ? 'Kamu dapat membuat ulang profil usaha dari halaman Profil Merchant.'
                            : 'Akun login tetap aktif dan kamu dapat membuat profil usaha baru dari halaman Profil Merchant.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-rose-500 font-medium">Penghapusan profil tidak dapat dibatalkan.</span>
                        <button 
                          type="button"
                          disabled={!user?.merchant_profile}
                          onClick={() => {
                            setHapusError('');
                            setKonfirmasiTeksHapus('');
                            setModalHapusBuka(true);
                          }}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Hapus Profil Usaha
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Tab Notifikasi */
                  <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                      <Bell className="w-4 h-4 text-[#023E8A]" />
                      <h3 className="text-sm font-bold text-[#03045E]">Pengaturan Notifikasi Rekrutmen</h3>
                    </div>
                    <p className="text-[11px] text-[#536B82]">Atur bagaimana kamu ingin menerima pembaruan tentang pelamar dan shift kerja.</p>

                    <div className="space-y-4 divide-y divide-[#D8E5EE]">
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-xs font-bold text-[#03045E]">Pelamar Baru Masuk</p>
                          <p className="text-[11px] text-[#536B82]">Kirim notifikasi email setiap ada mahasiswa yang melamar lowonganmu.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNotifState({ ...notifState, pelamarBaru: !notifState.pelamarBaru })}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${notifState.pelamarBaru ? 'bg-[#00B4D8] justify-end' : 'bg-slate-300 justify-start'}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <p className="text-xs font-bold text-[#03045E]">Pengingat Wawancara</p>
                          <p className="text-[11px] text-[#536B82]">Pengingat otomatis 1 jam sebelum jadwal wawancara kandidat dimulai.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNotifState({ ...notifState, pengingatWawancara: !notifState.pengingatWawancara })}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${notifState.pengingatWawancara ? 'bg-[#00B4D8] justify-end' : 'bg-slate-300 justify-start'}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div>
                          <p className="text-xs font-bold text-[#03045E]">Pembaruan Trial Shift</p>
                          <p className="text-[11px] text-[#536B82]">Dapatkan laporan harian status kehadiran trial shift mahasiswa.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNotifState({ ...notifState, statusTrial: !notifState.statusTrial })}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${notifState.statusTrial ? 'bg-[#00B4D8] justify-end' : 'bg-slate-300 justify-start'}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Kolom Kanan: Preview Card Profil Publik Figma */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs text-center space-y-4 sticky top-6">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`Logo ${namaMerchant}`} className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#03045E] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-sm">
                      {inisialMerchant}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-[#03045E]">{namaMerchant}</h3>
                    {merchantProfile?.category && (
                      <p className="mt-1 text-[11px] text-[#536B82]">{merchantProfile.category}</p>
                    )}
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full ${isVerified ? 'bg-[#CAF0F8] text-[#023E8A]' : 'bg-amber-100 text-amber-800'}`}>
                      {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{isVerified ? 'Usaha terverifikasi' : 'Menunggu verifikasi'}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#536B82] leading-relaxed text-left border-t border-b border-[#D8E5EE] py-3">
                    {isVerified
                      ? 'Identitas usaha telah ditinjau oleh tim ParuhKita. Profilmu tampil dengan tanda verifikasi.'
                      : 'Lengkapi dokumen verifikasi agar usaha dapat ditinjau oleh tim ParuhKita.'}
                  </p>
                  <div className="text-left text-xs text-[#03045E] font-semibold">
                    <span>3 lowongan aktif &middot; 5 posisi</span>
                  </div>

                  <div className="bg-[#CAF0F8]/40 border border-[#00B4D8]/30 rounded-2xl p-4 text-left space-y-1.5 mt-4">
                    <h4 className="text-xs font-bold text-[#03045E]">Profil yang baik, kesan yang tepat.</h4>
                    <p className="text-[11px] text-[#536B82] leading-relaxed">
                      Tampilkan suasana kerja yang nyata dan ceritakan budaya timmu. Mahasiswa ingin tahu tempat mereka akan bertumbuh.
                    </p>
                    <p className="text-[10px] text-[#023E8A] font-semibold pt-2">
                      Perubahan akan terlihat di profil publik setelah kamu memilih Simpan Perubahan.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* FOOTER DARK NAVY SESUAI FIGMA */}
      <footer className="bg-[#03045E] text-white px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#00B4D8] flex items-center justify-center text-white shadow-xs">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/>
              <path d="M12 3a9 9 0 0 0-9 9c0 3.1 1.57 5.83 3.97 7.46l2.1-3.64A5 5 0 0 1 7 12a5 5 0 0 1 5-5c1.68 0 3.17.83 4.07 2.1l2.84-2.13A8.96 8.96 0 0 0 12 3z"/>
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

      {/* Modal 1: Ubah Email */}
      {modalEmailBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#D8E5EE] overflow-hidden">
            <div className="p-5 border-b border-[#D8E5EE] flex items-center justify-between bg-[#F6F9FC]">
              <h3 className="text-sm font-bold text-[#03045E] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00B4D8]" />
                Ubah Email Login Merchant
              </h3>
              <button onClick={() => setModalEmailBuka(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUbahEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#03045E] mb-1.5">Email Baru *</label>
                <input 
                  type="email"
                  required
                  placeholder="contoh@domain.com"
                  value={inputEmailBaru}
                  onChange={(e) => setInputEmailBaru(e.target.value)}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalEmailBuka(false)}
                  className="px-4 py-2 border border-[#D8E5EE] hover:bg-slate-50 text-[#03045E] font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#023E8A] hover:bg-[#03045E] text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Simpan Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Konfirmasi Hapus Profil Usaha */}
      {modalHapusBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-rose-200 overflow-hidden">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50">
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Konfirmasi Hapus Profil Usaha
              </h3>
              <button onClick={() => setModalHapusBuka(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleHapusAkun} className="p-5 space-y-4">
              <p className="text-xs text-[#536B82] leading-relaxed">
                Profil usaha dan dokumen verifikasinya akan dihapus. Akun login dan akses merchant tetap aktif.
              </p>
              {hapusError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {hapusError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#03045E] mb-1.5">
                  Ketik <strong className="text-rose-600">{namaMerchant}</strong> untuk mengonfirmasi:
                </label>
                <input 
                  type="text"
                  required
                  disabled={menghapusProfil}
                  placeholder={namaMerchant}
                  value={konfirmasiTeksHapus}
                  onChange={(e) => setKonfirmasiTeksHapus(e.target.value)}
                  className="w-full bg-[#F6F9FC] border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  disabled={menghapusProfil}
                  onClick={() => setModalHapusBuka(false)}
                  className="px-4 py-2 border border-[#D8E5EE] hover:bg-slate-50 text-[#03045E] font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={menghapusProfil}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:cursor-wait disabled:opacity-50"
                >
                  {menghapusProfil ? 'Menghapus...' : 'Hapus Profil Usaha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
