import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Building, 
  Upload, 
  Phone, 
  CheckCircle2, 
  Bell,
  LogOut
} from 'lucide-react';

export default function MerchantProfile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const namaMerchant = user?.name || 'Warung Bu Dewi';
  const emailMerchant = user?.email || 'merchant@paruhkita.test';
  const lokasiMerchant = user?.location || 'Yogyakarta';
  const isVerified = user?.merchant_profile?.is_verified === true;
  const inisialMerchant = namaMerchant.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const [formData, setFormData] = useState({
    namaUsaha: user?.merchant_profile?.merchant_name || namaMerchant,
    kategori: user?.merchant_profile?.category || 'Makanan & Minuman',
    deskripsi: user?.merchant_profile?.description || '',
    telepon: user?.merchant_profile?.phone || user?.phone || '',
    email: emailMerchant,
    alamat: user?.merchant_profile?.address || ''
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [brandingFiles, setBrandingFiles] = useState({ logo: null, banner: null });
  const [brandingPaths, setBrandingPaths] = useState({ logo: null, banner: null });
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const logoPreviewUrlRef = useRef(null);
  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState({
    name: '',
    category: 'dining',
    description: ''
  });

  useEffect(() => {
    let active = true;
    api.get('/v1/merchant/profile')
      .then(({ data }) => {
        if (!active) return;
        const profile = data.data;
        setFormData({
          namaUsaha: profile.merchant_name || '',
          kategori: profile.category || 'Makanan & Minuman',
          deskripsi: profile.description || '',
          telepon: profile.phone || '',
          email: profile.user?.email || emailMerchant,
          alamat: profile.address || ''
        });
        setBrandingPaths({
          logo: profile.logo_path || null,
          banner: profile.banner_path || null
        });
        setFacilities((profile.facilities || []).map((facility) => ({
          ...facility,
          clientId: `saved-${facility.id}`
        })));
      })
      .catch((error) => {
        if (active && error.response?.status !== 404) {
          setProfileError(error.response?.data?.message || 'Gagal memuat profil usaha.');
        }
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [emailMerchant]);

  useEffect(() => () => {
    if (logoPreviewUrlRef.current) URL.revokeObjectURL(logoPreviewUrlRef.current);
  }, []);

  const handleFormChange = (e) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
    setProfileError('');
    setProfileNotice('');
  };

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (logoPreviewUrlRef.current) URL.revokeObjectURL(logoPreviewUrlRef.current);
    const previewUrl = file ? URL.createObjectURL(file) : null;
    logoPreviewUrlRef.current = previewUrl;
    setLogoPreviewUrl(previewUrl);
    setBrandingFiles((current) => ({ ...current, logo: file }));
  };

  const assetUrl = (path) => {
    if (!path) return null;
    const apiBase = api.defaults.baseURL || '';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    return `${serverBase}/storage/${path}`;
  };

  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileNotice('');

    try {
      const payload = new FormData();
      payload.append('merchant_name', formData.namaUsaha.trim());
      payload.append('category', formData.kategori);
      payload.append('description', formData.deskripsi.trim());
      payload.append('phone', formData.telepon.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('address', formData.alamat.trim());
      payload.append('facilities', JSON.stringify(facilities.map(({ name, category, description }) => ({
        name: name.trim(),
        category,
        description: description.trim()
      }))));
      if (brandingFiles.logo) payload.append('logo', brandingFiles.logo);
      if (brandingFiles.banner) payload.append('banner', brandingFiles.banner);

      payload.append('_method', 'PUT');
      const { data } = await api.post('/v1/merchant/profile', payload);
      const profile = data.data;
      setBrandingPaths({
        logo: profile.logo_path || null,
        banner: profile.banner_path || null
      });
      if (logoPreviewUrlRef.current) URL.revokeObjectURL(logoPreviewUrlRef.current);
      logoPreviewUrlRef.current = null;
      setLogoPreviewUrl(null);
      setBrandingFiles({ logo: null, banner: null });
      setFacilities((profile.facilities || []).map((facility) => ({
        ...facility,
        clientId: `saved-${facility.id}`
      })));
      const updatedUser = {
        ...user,
        name: profile.merchant_name,
        email: profile.user?.email || formData.email.trim().toLowerCase(),
        phone: profile.phone,
        merchant_profile: profile
      };

      setUser(updatedUser);
      localStorage.setItem('pk_user', JSON.stringify(updatedUser));
      setFormData((current) => ({
        ...current,
        namaUsaha: profile.merchant_name,
        email: updatedUser.email
      }));
      setProfileNotice(data.message || 'Profil usaha berhasil disimpan.');
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;
      setProfileError(
        firstValidationError
        || error.response?.data?.message
        || (error.request ? 'Tidak dapat terhubung ke server.' : error.message)
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const addFacility = () => {
    if (!newFacility.name.trim()) {
      setProfileError('Nama fasilitas wajib diisi.');
      return;
    }

    setFacilities((current) => [...current, {
      ...newFacility,
      name: newFacility.name.trim(),
      clientId: `new-${Date.now()}-${current.length}`
    }]);
    setNewFacility({ name: '', category: 'dining', description: '' });
    setProfileError('');
    setProfileNotice('');
  };

  const updateFacility = (clientId, field, value) => {
    setFacilities((current) => current.map((facility) => (
      facility.clientId === clientId ? { ...facility, [field]: value } : facility
    )));
    setProfileError('');
    setProfileNotice('');
  };

  const removeFacility = (clientId) => {
    setFacilities((current) => current.filter((facility) => facility.clientId !== clientId));
    setProfileError('');
    setProfileNotice('');
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
          <button onClick={() => navigate('/merchant/candidates')} className="text-slate-300 hover:text-white transition">Kandidat</button>
          <button onClick={() => navigate('/merchant/dashboard')} className="text-slate-300 hover:text-white transition">Lowongan</button>
        </nav>

        <div className="flex items-center gap-4 z-10">
          <button className="text-slate-300 hover:text-white transition relative">
            <Bell className="w-5 h-5" />
          </button>
          <div 
            onClick={() => navigate('/merchant/profile')}
            className="flex items-center gap-2.5 cursor-pointer bg-white/20 border border-[#00B4D8] px-3 py-1.5 rounded-2xl transition"
          >
            {logoPreviewUrl || assetUrl(brandingPaths.logo) ? (
              <img
                src={logoPreviewUrl || assetUrl(brandingPaths.logo)}
                alt={`Logo ${formData.namaUsaha}`}
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
        
        {/* Sidebar Kiri Merchant (Pengaturan Tidak Bold) */}
        <aside className="w-64 bg-white border-r border-[#D8E5EE] flex flex-col justify-between hidden lg:flex shrink-0">
          <div>
            <div className="p-6 border-b border-[#D8E5EE]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#536B82]">Ruang Merchant</span>
              <h2 className="text-base font-bold text-[#03045E] mt-0.5">{namaMerchant}</h2>
              <p className="text-xs text-[#536B82]">{lokasiMerchant}</p>
              <div className={`mt-3 inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg ${isVerified ? 'bg-[#CAF0F8] text-[#023E8A]' : 'bg-amber-100 text-amber-800'}`}>
                {!user?.merchant_profile ? 'Profil usaha belum dibuat' : isVerified ? 'Usaha terverifikasi' : 'Menunggu verifikasi'}
              </div>
            </div>
            <nav className="p-4 space-y-1.5 text-xs font-semibold">
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left"
              >
                <span>Ringkasan</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left"
              >
                <span>Lowongan</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/candidates')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left"
              >
                <span>Kandidat</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/jadwal')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left"
              >
                <span>Jadwal</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left"
              >
                <span>Pesan</span>
              </button>
              <button 
                onClick={() => navigate('/merchant/settings')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#536B82] hover:bg-slate-50 text-left"
              >
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

        {/* Form Profil Usaha Merchant */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          <form onSubmit={handleSimpanProfil} className="max-w-5xl mx-auto space-y-6">
            
            <div>
              <p className="text-xs font-bold text-[#536B82] uppercase tracking-wider">RUANG MERCHANT / PROFIL</p>
              <h1 className="text-2xl font-extrabold text-[#03045E] mt-1">Profil Usaha Merchant</h1>
              <p className="text-xs text-[#536B82] mt-0.5">
                {loadingProfile ? 'Memuat profil usaha...' : 'Kelola informasi publik usaha untuk calon pelamar.'}
              </p>
            </div>

            {profileError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {profileError}
              </div>
            )}
            {profileNotice && (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                {profileNotice}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Information Card */}
                <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                    <Building className="w-4 h-4 text-[#023E8A]" />
                    <h3 className="text-sm font-bold text-[#03045E]">Informasi usaha</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#03045E] mb-1">Nama Usaha *</label>
                      <input 
                        type="text" 
                        name="namaUsaha"
                        required
                        disabled={loadingProfile || savingProfile}
                        value={formData.namaUsaha} 
                        onChange={handleFormChange}
                        className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#03045E] mb-1">Kategori Industri *</label>
                      <select 
                        name="kategori"
                        required
                        disabled={loadingProfile || savingProfile}
                        value={formData.kategori}
                        onChange={handleFormChange}
                        className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                      >
                        <option>Makanan & Minuman</option>
                        <option>Retail & Toko</option>
                        <option>Jasa & Layanan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#03045E] mb-1">Deskripsi Perusahaan *</label>
                    <textarea 
                      name="deskripsi"
                      rows="4"
                      required
                      disabled={loadingProfile || savingProfile}
                      value={formData.deskripsi}
                      onChange={handleFormChange}
                      className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                    ></textarea>
                  </div>
                </div>

                {/* Logo & Banner Card */}
                <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                    <Upload className="w-4 h-4 text-[#023E8A]" />
                    <h3 className="text-sm font-bold text-[#03045E]">Logo & banner</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#03045E] mb-1">Logo usaha</label>
                      <div className="border border-dashed border-[#D8E5EE] rounded-xl p-4 text-center bg-[#F6F9FC]">
                        {logoPreviewUrl || assetUrl(brandingPaths.logo) ? (
                          <img src={logoPreviewUrl || assetUrl(brandingPaths.logo)} alt="Logo usaha" className="mx-auto mb-2 h-12 w-12 rounded-xl object-cover" />
                        ) : (
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#03045E] text-sm font-bold text-white shadow-xs">
                            {inisialMerchant}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={loadingProfile || savingProfile}
                          onChange={handleLogoFileChange}
                          className="w-full text-[10px] text-[#536B82] file:mr-2 file:rounded-lg file:border-0 file:bg-[#CAF0F8] file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-[#023E8A]"
                        />
                        {brandingFiles.logo && <p className="mt-1 truncate text-[10px] text-[#536B82]">{brandingFiles.logo.name}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#03045E] mb-1">Banner usaha</label>
                      <div className="border border-dashed border-[#D8E5EE] rounded-xl p-4 text-center bg-[#F6F9FC] flex flex-col items-center justify-center">
                        {assetUrl(brandingPaths.banner) ? (
                          <img src={assetUrl(brandingPaths.banner)} alt="Banner usaha" className="mb-2 h-12 w-full rounded-lg object-cover" />
                        ) : (
                          <div className="mb-2 flex h-12 w-full items-center justify-center rounded-lg bg-slate-200 text-[10px] text-slate-500">Preview Banner</div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={loadingProfile || savingProfile}
                          onChange={(event) => setBrandingFiles((current) => ({ ...current, banner: event.target.files?.[0] || null }))}
                          className="w-full text-[10px] text-[#536B82] file:mr-2 file:rounded-lg file:border-0 file:bg-[#CAF0F8] file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-[#023E8A]"
                        />
                        {brandingFiles.banner && <p className="mt-1 truncate text-[10px] text-[#536B82]">{brandingFiles.banner.name}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Kontak Card */}
                <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#D8E5EE]">
                    <Phone className="w-4 h-4 text-[#023E8A]" />
                    <h3 className="text-sm font-bold text-[#03045E]">Info kontak</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#03045E] mb-1">Telepon *</label>
                      <input 
                        type="tel" 
                        name="telepon"
                        required
                        disabled={loadingProfile || savingProfile}
                        value={formData.telepon}
                        onChange={handleFormChange}
                        className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#03045E] mb-1">Email *</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        disabled={loadingProfile || savingProfile}
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#03045E] mb-1">Alamat lengkap *</label>
                    <textarea 
                      name="alamat"
                      rows="2"
                      required
                      disabled={loadingProfile || savingProfile}
                      value={formData.alamat}
                      onChange={handleFormChange}
                      className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                    ></textarea>
                  </div>
                </div>

                <section className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-[#D8E5EE]">
                    <h3 className="text-sm font-bold text-[#03045E]">Fasilitas tempat kerja</h3>
                    <p className="mt-1 text-xs text-[#536B82]">Tambahkan fasilitas yang tersedia untuk calon pekerja.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      aria-label="Nama fasilitas"
                      placeholder="Nama fasilitas"
                      value={newFacility.name}
                      disabled={loadingProfile || savingProfile}
                      onChange={(event) => setNewFacility((current) => ({ ...current, name: event.target.value }))}
                      className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E]"
                    />
                    <select
                      aria-label="Kategori fasilitas"
                      value={newFacility.category}
                      disabled={loadingProfile || savingProfile}
                      onChange={(event) => setNewFacility((current) => ({ ...current, category: event.target.value }))}
                      className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E]"
                    >
                      <option value="dining">Makan/minum</option>
                      <option value="transportation">Transportasi</option>
                      <option value="worship">Tempat ibadah</option>
                      <option value="other">Lainnya</option>
                    </select>
                    <button
                      type="button"
                      onClick={addFacility}
                      disabled={loadingProfile || savingProfile}
                      className="rounded-xl bg-[#CAF0F8] px-4 py-2.5 text-xs font-bold text-[#023E8A] disabled:opacity-50"
                    >
                      Tambah fasilitas
                    </button>
                    <input
                      aria-label="Keterangan fasilitas baru"
                      placeholder="Keterangan (opsional)"
                      value={newFacility.description}
                      disabled={loadingProfile || savingProfile}
                      onChange={(event) => setNewFacility((current) => ({ ...current, description: event.target.value }))}
                      className="sm:col-span-3 bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E]"
                    />
                  </div>

                  <div className="space-y-3">
                    {facilities.map((facility) => (
                      <div key={facility.clientId} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-center">
                        <input
                          aria-label="Nama fasilitas"
                          required
                          value={facility.name}
                          disabled={loadingProfile || savingProfile}
                          onChange={(event) => updateFacility(facility.clientId, 'name', event.target.value)}
                          className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3 py-2 text-xs text-[#03045E]"
                        />
                        <select
                          aria-label="Kategori fasilitas"
                          value={facility.category}
                          disabled={loadingProfile || savingProfile}
                          onChange={(event) => updateFacility(facility.clientId, 'category', event.target.value)}
                          className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3 py-2 text-xs text-[#03045E]"
                        >
                          <option value="dining">Makan/minum</option>
                          <option value="transportation">Transportasi</option>
                          <option value="worship">Tempat ibadah</option>
                          <option value="other">Lainnya</option>
                        </select>
                        <input
                          aria-label="Keterangan fasilitas"
                          value={facility.description || ''}
                          disabled={loadingProfile || savingProfile}
                          onChange={(event) => updateFacility(facility.clientId, 'description', event.target.value)}
                          placeholder="Keterangan (opsional)"
                          className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3 py-2 text-xs text-[#03045E]"
                        />
                        <button
                          type="button"
                          onClick={() => removeFacility(facility.clientId)}
                          disabled={loadingProfile || savingProfile}
                          className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                    {facilities.length === 0 && (
                      <p className="text-xs text-[#536B82]">Belum ada fasilitas. Daftar kosong akan tersimpan.</p>
                    )}
                  </div>
                </section>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    {loadingProfile ? 'Memuat data...' : user?.merchant_profile ? 'Perubahan tersimpan di akun usaha' : 'Profil baru akan dibuat saat disimpan'}
                  </span>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => navigate('/merchant/dashboard')}
                      disabled={savingProfile}
                      className="px-5 py-2.5 border border-[#D8E5EE] hover:bg-slate-50 text-[#03045E] font-bold text-xs rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={loadingProfile || savingProfile}
                      className="px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:cursor-wait disabled:opacity-50"
                    >
                      {savingProfile ? 'Menyimpan...' : user?.merchant_profile ? 'Simpan Perubahan' : 'Buat Profil Usaha'}
                    </button>
                  </div>
                </div>

              </div>

              {/* Preview Card */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs text-center space-y-4 sticky top-6">
                  {logoPreviewUrl || assetUrl(brandingPaths.logo) ? (
                    <img
                      src={logoPreviewUrl || assetUrl(brandingPaths.logo)}
                      alt={`Logo ${formData.namaUsaha}`}
                      className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#03045E] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-sm">
                      {inisialMerchant}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-[#03045E]">{formData.namaUsaha}</h3>
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full ${isVerified ? 'bg-[#CAF0F8] text-[#023E8A]' : 'bg-amber-100 text-amber-800'}`}>
                      {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{!user?.merchant_profile ? 'Profil usaha belum dibuat' : isVerified ? 'Usaha terverifikasi' : 'Menunggu verifikasi'}</span>
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
                </div>
              </div>

            </div>
          </form>
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

    </div>
  );
}