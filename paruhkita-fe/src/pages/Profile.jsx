import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  User,
  Camera,
  Plus,
  X,
  Save,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Globe,
  Phone,
  BookOpen,
  FileText,
  Briefcase,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Trash2,
  Award,
  Download
} from 'lucide-react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Auto-dismiss floating toast notification after 4 seconds
  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  // Form states
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    bio: '',
    university: '',
    faculty: '',
    major: '',
    degree_level: 'S1',
    entry_year: '',
    graduation_year: '',
    is_currently_studying: true,
    gpa: '',
    linkedin_url: '',
    github_url: '',
    instagram_url: '',
  });

  const [photoUrl, setPhotoUrl] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [availabilities, setAvailabilities] = useState([]);

  // Pengalaman Kerja & Organisasi (untuk generate CV & Portofolio)
  const [experiences, setExperiences] = useState([]);
  const [newExp, setNewExp] = useState({
    role: '',
    company: '',
    period: '',
    description: '',
  });

  // Portofolio Aktivitas & Proyek Karya (untuk generate CV & Portofolio)
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [newProj, setNewProj] = useState({
    title: '',
    category: '',
    period: '',
    description: '',
    project_url: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/v1/profile');
      if (res.data.status) {
        const d = res.data.data;
        const p = d.profile || {};
        setProfile({
          name: d.name || '',
          phone: p.phone || '',
          bio: p.bio || '',
          university: p.university || '',
          faculty: p.faculty || '',
          major: p.major || '',
          degree_level: p.degree_level || 'S1',
          entry_year: p.entry_year || '',
          graduation_year: p.graduation_year || '',
          is_currently_studying: p.is_currently_studying !== undefined ? Boolean(p.is_currently_studying) : true,
          gpa: p.gpa || '',
          linkedin_url: p.linkedin_url || '',
          github_url: p.github_url || '',
          instagram_url: p.instagram_url || '',
        });
        setPhotoUrl(p.photo_url ? `http://127.0.0.1:8000${p.photo_url}` : '');
        setSkills(d.skills || []);
        setAvailabilities(d.availabilities || []);
        const expData = p.experiences;
        setExperiences(
          Array.isArray(expData) ? expData : (typeof expData === 'string' ? (() => { try { return JSON.parse(expData); } catch { return []; } })() : [])
        );
        const projData = p.portfolio_projects;
        setPortfolioProjects(
          Array.isArray(projData) ? projData : (typeof projData === 'string' ? (() => { try { return JSON.parse(projData); } catch { return []; } })() : [])
        );
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = {
        ...profile,
        experiences,
        portfolio_projects: portfolioProjects,
      };
      const res = await api.put('/v1/profile', payload);
      if (res.data.status) {
        setMessage({ 
          text: 'Data profil dan berkas berhasil disimpan! CV dan Portofolio kamu otomatis terperbarui.', 
          type: 'success' 
        });
      }
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Gagal menyimpan profil.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Ukuran foto maksimal 2MB', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await api.post('/v1/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status) {
        setPhotoUrl(`http://127.0.0.1:8000${res.data.photo_url}`);
        setMessage({ text: 'Foto profil berhasil diperbarui!', type: 'success' });
      }
    } catch {
      setMessage({ text: 'Gagal mengunggah foto.', type: 'error' });
    }
  };

  // --- Skill Handlers ---
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      const res = await api.post('/v1/profile/skills', { skill_name: newSkill.trim() });
      if (res.data.status) {
        setSkills([...skills, { id: res.data.data.id, name: res.data.data.skill_name }]);
        setNewSkill('');
        setMessage({ text: 'Keterampilan berhasil ditambahkan!', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Skill sudah ada atau tidak valid', type: 'error' });
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await api.delete(`/v1/profile/skills/${id}`);
      setSkills(skills.filter((s) => s.id !== id));
      setMessage({ text: 'Keterampilan berhasil dihapus.', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  // --- Pengalaman Handlers ---
  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExp.role || !newExp.company) {
      setMessage({ text: 'Mohon isi minimal Posisi/Peran dan Nama Tempat/Perusahaan.', type: 'error' });
      return;
    }

    const item = {
      id: Date.now(),
      ...newExp,
    };
    const updated = [...experiences, item];
    setExperiences(updated);
    setNewExp({ role: '', company: '', period: '', description: '' });
  };

  const handleDeleteExperience = (id) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  // --- Portofolio Proyek / Aktivitas Handlers ---
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProj.title) {
      setMessage({ text: 'Mohon isi Judul Karya atau Nama Aktivitas.', type: 'error' });
      return;
    }

    const item = {
      id: Date.now(),
      ...newProj,
    };
    const updated = [...portfolioProjects, item];
    setPortfolioProjects(updated);
    setNewProj({ title: '', category: '', period: '', description: '', project_url: '' });
  };

  const handleDeleteProject = (id) => {
    setPortfolioProjects(portfolioProjects.filter((proj) => proj.id !== id));
  };

  // --- Availability Handlers ---
  const handleToggleDay = (day) => {
    const exists = availabilities.find((a) => a.day_of_week === day);
    if (exists) {
      setAvailabilities(availabilities.filter((a) => a.day_of_week !== day));
    } else {
      setAvailabilities([
        ...availabilities,
        { day_of_week: day, start_time: '09:00', end_time: '14:00', hours_per_day: 5 },
      ]);
    }
  };

  const handleTimeChange = (day, field, value) => {
    setAvailabilities(
      availabilities.map((a) => {
        if (a.day_of_week === day) {
          return { ...a, [field]: value };
        }
        return a;
      })
    );
  };

  const handleSaveAvailability = async () => {
    if (availabilities.length === 0) {
      setMessage({ text: 'Pilih minimal 1 hari ketersediaan waktu.', type: 'error' });
      return;
    }

    setSavingAvailability(true);
    try {
      const payload = {
        availabilities: availabilities.map((a) => ({
          day_of_week: a.day_of_week,
          start_time: a.start_time.slice(0, 5),
          end_time: a.end_time.slice(0, 5),
          hours_per_day: a.hours_per_day || 4,
        })),
      };
      await api.put('/v1/profile/availability', payload);
      setMessage({ text: 'Jadwal ketersediaan waktu berhasil disimpan!', type: 'success' });
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Gagal menyimpan ketersediaan waktu.', 
        type: 'error' 
      });
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-[#536B82] font-medium">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb Back */}
      <div>
        <Link 
          to="/kesiapan-karier" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#023E8A] hover:text-[#00B4D8] mb-2 transition"
        >
          <span>&larr;</span>
          <span>Kembali ke Kesiapan Karier</span>
        </Link>
        <h1 className="text-2xl font-bold text-[#03045E]">Pengelolaan Profil Mahasiswa</h1>
        <p className="text-sm text-[#536B82] mt-1">
          Lengkapi data diri, akademik, keahlian, pengalaman, dan karya. Sistem ParuhKita akan meng-generate dokumen CV dan Portofolio secara otomatis.
        </p>
      </div>

      {/* Floating Toast Notification */}
      {message.text && (
        <div className="fixed top-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto transition-all transform duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl flex items-start gap-3 border backdrop-blur-md ${
              message.type === 'success'
                ? 'bg-white/95 border-emerald-200 text-emerald-900 shadow-emerald-500/15'
                : 'bg-white/95 border-rose-200 text-rose-900 shadow-rose-500/15'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                message.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold leading-tight">
                {message.type === 'success' ? 'Berhasil' : 'Perhatian'}
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {message.text}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMessage({ text: '', type: '' })}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition shrink-0 ml-1"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BANNER DOKUMEN GENERATE OTOMATIS (CV & PORTOFOLIO)           */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#03045E] via-[#023E8A] to-[#102C4D] rounded-2xl p-6 sm:p-7 shadow-lg text-white border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B4D8]/20 text-[#00B4D8] text-xs font-bold mb-3 border border-[#00B4D8]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Generate Otomatis (Tanpa Upload Berkas Manual)</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Dokumen CV &amp; Portofolio Kamu</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Kamu tidak perlu mengunggah berkas CV atau portofolio manual dari komputer. Isi data profil di bawah ini dengan lengkap, dan sistem akan langsung menyusunnya menjadi dokumen siap unduh (PDF) secara terpisah.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {/* Tombol Lihat & Unduh CV */}
            <Link
              to="/cv"
              className="flex items-center justify-between gap-3 px-4 py-3 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-xl shadow-md transition group text-left"
            >
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold">Lihat &amp; Unduh CV</p>
                <p className="text-[10px] text-white/80">Dokumen PDF Resmi</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform ml-1" />
            </Link>

            {/* Tombol Lihat & Unduh Portofolio */}
            <Link
              to="/portofolio"
              className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl shadow-md transition group text-left"
            >
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold">Lihat &amp; Unduh Portofolio</p>
                <p className="text-[10px] text-white/80">Showcase Karya Mahasiswa</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-8">

        {/* 1. Foto Profil Section */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-[#CAF0F8] text-[#023E8A] border-4 border-white shadow-md flex items-center justify-center font-bold text-2xl overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto Profil" className="w-full h-full object-cover" />
              ) : (
                profile.name ? profile.name.charAt(0) : 'M'
              )}
            </div>
            <label 
              htmlFor="photoUploadInput"
              className="absolute bottom-0 right-0 p-2 bg-[#00B4D8] text-white rounded-full shadow-md cursor-pointer hover:bg-[#023E8A] transition"
              title="Ganti Foto"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input 
              id="photoUploadInput"
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#102C4D]">Foto Profil</h2>
            <p className="text-xs text-[#536B82] mt-1">
              Gunakan foto formal atau semi-formal yang jelas untuk ditampilkan di CV digital (JPG, PNG, atau WEBP, maks 2MB).
            </p>
            <p className="text-[11px] text-[#00B4D8] font-semibold mt-2">
              Klik ikon kamera di atas untuk memilih foto.
            </p>
          </div>
        </div>

        {/* 2. Informasi Pribadi & Kontak */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-[#102C4D] flex items-center gap-2">
            <User className="w-5 h-5 text-[#023E8A]" />
            <span>Informasi Pribadi &amp; Kontak</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Nomor WhatsApp / HP</label>
              <input
                type="text"
                placeholder="081234567890"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#102C4D]">Bio / Ringkasan Tentang Saya</label>
              <span className="text-[10px] text-slate-400">{(profile.bio || '').length}/500 karakter</span>
            </div>
            <textarea
              rows="3"
              maxLength={500}
              placeholder="Ceritakan minat karier, kelebihan, atau etos kerjamu secara ringkas untuk ditampilkan di CV..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
            ></textarea>
          </div>

          {/* Academic Info */}
          <div className="pt-4 border-t border-[#D8E5EE]">
            <h3 className="text-xs font-bold text-[#023E8A] uppercase tracking-wider mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Data Perguruan Tinggi (Indonesia)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Universitas / Institut</label>
                <input
                  type="text"
                  placeholder="Contoh: Universitas Gadjah Mada"
                  value={profile.university}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Jenjang Pendidikan</label>
                <select
                  value={profile.degree_level || 'S1'}
                  onChange={(e) => setProfile({ ...profile, degree_level: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                >
                  <option value="D3">D3 - Diploma Tiga</option>
                  <option value="D4">D4 - Sarjana Terapan</option>
                  <option value="S1">S1 - Sarjana</option>
                  <option value="S2">S2 - Magister</option>
                  <option value="S3">S3 - Doktor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Fakultas</label>
                <input
                  type="text"
                  placeholder="Contoh: Teknik"
                  value={profile.faculty}
                  onChange={(e) => setProfile({ ...profile, faculty: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Program Studi / Jurusan</label>
                <input
                  type="text"
                  placeholder="Contoh: Informatika"
                  value={profile.major}
                  onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Tahun Masuk</label>
                <input
                  type="number"
                  placeholder="Contoh: 2024"
                  value={profile.entry_year}
                  onChange={(e) => setProfile({ ...profile, entry_year: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#102C4D]">
                    {profile.is_currently_studying ? 'Status Studi' : 'Tahun Lulus'}
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] font-medium text-[#023E8A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.is_currently_studying}
                      onChange={(e) => setProfile({ ...profile, is_currently_studying: e.target.checked })}
                      className="rounded border-[#D8E5EE] text-[#00B4D8] focus:ring-[#00B4D8]"
                    />
                    <span>Belum lulus</span>
                  </label>
                </div>
                {profile.is_currently_studying ? (
                  <div className="w-full bg-[#CAF0F8]/50 border border-[#00B4D8]/30 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#023E8A]">
                    Aktif / Sekarang (Belum Lulus)
                  </div>
                ) : (
                  <input
                    type="number"
                    placeholder="Contoh: 2026"
                    value={profile.graduation_year}
                    onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                    className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">IPK Terakhir (Skala 4.00)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="3.75"
                  value={profile.gpa}
                  onChange={(e) => setProfile({ ...profile, gpa: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-4 border-t border-[#D8E5EE]">
            <h3 className="text-xs font-bold text-[#023E8A] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Tautan Media Sosial &amp; Portofolio Eksternal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={profile.linkedin_url}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={profile.github_url}
                  onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">Instagram URL</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/username"
                  value={profile.instagram_url}
                  onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Pengalaman Kerja & Organisasi (BARU - Ditampilkan di CV) */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#102C4D] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#023E8A]" />
                <span>Pengalaman Kerja, Magang &amp; Organisasi</span>
              </h2>
              <p className="text-xs text-[#536B82] mt-1">
                Data ini akan otomatis disusun menjadi bagian <strong>Riwayat Pengalaman</strong> pada dokumen CV kamu.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#023E8A] bg-[#CAF0F8] px-3 py-1 rounded-full self-start">
              {experiences.length} Pengalaman Tercatat
            </span>
          </div>

          {/* Form Tambah Pengalaman Baru */}
          <div className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#03045E] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#00B4D8]" />
              <span>Tambah Pengalaman Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Posisi / Peran</label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Contoh: Crew Kasir / Staff Humas"
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Nama Tempat / Lembaga</label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Contoh: Roti Pagi Store / BEM Kampus"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Periode Waktu</label>
                <input
                  type="text"
                  maxLength={40}
                  placeholder="Contoh: Juni 2026 - Agustus 2026"
                  value={newExp.period}
                  onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[#102C4D]">Deskripsi Tugas &amp; Pencapaian</label>
                <span className="text-[10px] text-slate-400">{(newExp.description || '').length}/500 karakter</span>
              </div>
              <textarea
                rows="2"
                maxLength={500}
                placeholder="Jelaskan peran harian, tanggung jawab, dan hasil kerja kamu..."
                value={newExp.description}
                onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddExperience}
                className="px-4 py-2 bg-[#023E8A] hover:bg-[#03045E] text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan ke Daftar</span>
              </button>
            </div>
          </div>

          {/* List Pengalaman Tercatat */}
          <div className="space-y-3">
            {experiences.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-[#F6F9FC] rounded-xl border border-dashed border-[#D8E5EE]">
                Belum ada pengalaman tercatat. Tambahkan pengalaman di atas untuk melengkapi CV kamu.
              </p>
            ) : (
              experiences.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl border border-[#D8E5EE] bg-white flex items-start justify-between gap-4 hover:border-[#00B4D8] transition">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#03045E] break-words">{exp.role}</span>
                      <span className="text-[11px] text-[#536B82] break-words">&middot; {exp.company}</span>
                      {exp.period && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                          {exp.period}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-[#536B82] leading-relaxed pt-1 break-words [overflow-wrap:anywhere] whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition shrink-0"
                    title="Hapus Pengalaman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Portofolio Aktivitas & Proyek Karya (BARU - Ditampilkan di Portofolio) */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#102C4D] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                <span>Portofolio Karya, Aktivitas &amp; Proyek Mahasiswa</span>
              </h2>
              <p className="text-xs text-[#536B82] mt-1">
                Data ini akan otomatis disusun menjadi lembar <strong>Showcase Portofolio</strong> yang siap kamu unduh dan tunjukkan ke merchant.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full self-start">
              {portfolioProjects.length} Karya Tercatat
            </span>
          </div>

          {/* Form Tambah Proyek / Karya Baru */}
          <div className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#03045E] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#F59E0B]" />
              <span>Tambah Karya / Aktivitas Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Judul Karya / Proyek</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: Sistem POS Kafe / Desain Brosur Menu"
                  value={newProj.title}
                  onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Kategori / Peran</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Contoh: Desain Grafis / Web Dev / Fotografi"
                  value={newProj.category}
                  onChange={(e) => setNewProj({ ...newProj, category: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Waktu / Periode</label>
                <input
                  type="text"
                  maxLength={40}
                  placeholder="Contoh: April 2026"
                  value={newProj.period}
                  onChange={(e) => setNewProj({ ...newProj, period: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-[#102C4D]">Deskripsi Karya &amp; Dampak</label>
                  <span className="text-[10px] text-slate-400">{(newProj.description || '').length}/500 karakter</span>
                </div>
                <textarea
                  rows="2"
                  maxLength={500}
                  placeholder="Ceritakan proses pembuatan, alat yang digunakan, dan manfaat karya ini..."
                  value={newProj.description}
                  onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                ></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#102C4D] mb-1">Tautan / Link Karya Online (Opsional)</label>
                <input
                  type="url"
                  maxLength={255}
                  placeholder="https://github.com/... atau https://figma.com/..."
                  value={newProj.project_url}
                  onChange={(e) => setNewProj({ ...newProj, project_url: e.target.value })}
                  className="w-full bg-white border border-[#D8E5EE] rounded-lg px-3 py-2 text-xs text-[#102C4D]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Tautan Google Drive, Figma, GitHub, atau portfolio web.</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddProject}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan ke Portofolio</span>
              </button>
            </div>
          </div>

          {/* List Proyek Tercatat */}
          <div className="space-y-3">
            {portfolioProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-[#F6F9FC] rounded-xl border border-dashed border-[#D8E5EE]">
                Belum ada portofolio karya. Tambahkan proyek karya kamu di atas untuk meng-generate dokumen Portofolio.
              </p>
            ) : (
              portfolioProjects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-xl border border-[#D8E5EE] bg-white flex items-start justify-between gap-4 hover:border-[#F59E0B] transition">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#03045E] break-words">{proj.title}</span>
                      {proj.category && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium break-words">
                          {proj.category}
                        </span>
                      )}
                      {proj.period && (
                        <span className="text-[10px] text-slate-400 shrink-0">({proj.period})</span>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-xs text-[#536B82] leading-relaxed pt-1 break-words [overflow-wrap:anywhere] whitespace-pre-line">
                        {proj.description}
                      </p>
                    )}
                    {proj.project_url && (
                      <a
                        href={proj.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#023E8A] hover:text-[#00B4D8] mt-1 max-w-full truncate"
                        title={proj.project_url}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">Buka Tautan Karya</span>
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition shrink-0"
                    title="Hapus Karya"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Tombol Simpan Perubahan Profil */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#102C4D]">Simpan Semua Data Profil</p>
            <p className="text-[11px] text-[#536B82]">Menyimpan seluruh perubahan biodata, pengalaman, dan karya sekaligus.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-[#023E8A] hover:bg-[#03045E] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Sedang Menyimpan...' : 'Simpan Semua Data Profil'}</span>
          </button>
        </div>

      </form>

      {/* 6. Skills Section (Free-Text Tags) */}
      <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-bold text-[#102C4D] flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#023E8A]" />
          <span>Keterampilan &amp; Minat (Skill Tags)</span>
        </h2>
        <p className="text-xs text-[#536B82] mb-4">
          Tambahkan keahlian bebas yang kamu kuasai (misal: <em>Barista, POS Kasir, Graphic Design, Laravel, Excel, Komunikasi Pelanggan</em>).
        </p>

        {/* Input add skill */}
        <form onSubmit={handleAddSkill} className="flex gap-2 max-w-md mb-4">
          <input
            type="text"
            placeholder="Ketik skill baru lalu tekan Tambah..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </form>

        {/* Tags list */}
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada skill yang ditambahkan.</p>
          ) : (
            skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#CAF0F8] text-[#023E8A] font-semibold text-xs rounded-full border border-[#00B4D8]/20"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-[#023E8A]/60 hover:text-red-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* 7. Availability Section */}
      <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-bold text-[#102C4D] flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-[#023E8A]" />
          <span>Ketersediaan Waktu Kerja (Senin - Minggu)</span>
        </h2>
        <p className="text-xs text-[#536B82] mb-6">
          Tentukan hari dan rentang jam saat kamu tidak ada kuliah dan siap bekerja paruh waktu.
        </p>

        {/* Day Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-6">
          {DAYS.map((day) => {
            const isSelected = availabilities.some((a) => a.day_of_week === day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleToggleDay(day)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                  isSelected
                    ? 'bg-[#023E8A] text-white border-[#023E8A] shadow-xs'
                    : 'bg-[#F6F9FC] text-[#536B82] border-[#D8E5EE] hover:border-[#00B4D8]'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Time Inputs for selected days */}
        {availabilities.length > 0 && (
          <div className="space-y-3 bg-[#F6F9FC] p-4 rounded-xl border border-[#D8E5EE] mb-6">
            <p className="text-xs font-bold text-[#102C4D] mb-2">Atur Jam Kerja per Hari:</p>
            {availabilities.map((item) => (
              <div key={item.day_of_week} className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#D8E5EE]">
                <span className="w-24 text-xs font-bold text-[#023E8A]">{item.day_of_week}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span>Mulai:</span>
                  <input
                    type="time"
                    value={item.start_time.slice(0, 5)}
                    onChange={(e) => handleTimeChange(item.day_of_week, 'start_time', e.target.value)}
                    className="border border-[#D8E5EE] rounded-lg px-2 py-1 bg-[#F6F9FC] text-xs"
                  />
                  <span>Selesai:</span>
                  <input
                    type="time"
                    value={item.end_time.slice(0, 5)}
                    onChange={(e) => handleTimeChange(item.day_of_week, 'end_time', e.target.value)}
                    className="border border-[#D8E5EE] rounded-lg px-2 py-1 bg-[#F6F9FC] text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={savingAvailability}
            onClick={handleSaveAvailability}
            className="px-6 py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
          >
            {savingAvailability ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span>{savingAvailability ? 'Sedang Menyimpan...' : 'Simpan Ketersediaan Waktu'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
