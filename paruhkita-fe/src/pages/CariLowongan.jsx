import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  Calendar, 
  Clock, 
  Bookmark, 
  CheckCircle2, 
  ChevronDown, 
  ArrowUpRight
} from 'lucide-react';

export default function CariLowongan() {
  const [bookmarked, setBookmarked] = useState([]);
  const [filterJadwal, setFilterJadwal] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/v1/jobs')
      .then(({ data }) => {
        if (active) setJobs(data.data || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || (error.request ? 'Tidak dapat memuat lowongan. Coba lagi.' : error.message));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const applyForJob = async (job) => {
    setApplyingId(job.id);
    setErrorMessage('');
    setNotice('');
    try {
      await api.post(`/v1/jobs/${job.id}/applications`);
      setJobs((current) => current.map((item) => item.id === job.id
        ? { ...item, is_applied: true, applications_count: (item.applications_count || 0) + 1 }
        : item));
      setNotice(`Lamaran untuk "${job.title}" berhasil dikirim.`);
    } catch (error) {
      setErrorMessage(error.response?.data?.errors?.job?.[0] || error.response?.data?.message || (error.request ? 'Lamaran gagal dikirim. Coba lagi.' : error.message));
    } finally {
      setApplyingId(null);
    }
  };

  const toggleBookmark = (id) => {
    if (bookmarked.includes(id)) {
      setBookmarked(bookmarked.filter(b => b !== id));
    } else {
      setBookmarked([...bookmarked, id]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] pb-16">
      
      {/* ==================================================== */}
      {/* 1. HERO HEADER                                       */}
      {/* ==================================================== */}
      <section className="bg-[#03045E] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold text-[#00B4D8] uppercase tracking-wider block mb-2">
              DARI KAMPUS, UNTUK MASA DEPANMU
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Kuliah tetap jalan.<br />Pengalaman terus bertambah.
            </h1>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Temukan kerja paruh waktu di sekitar kampus yang benar-benar cocok dengan jadwal kuliahmu.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold text-slate-200">
              <span className="px-2 py-0.5 bg-[#00B4D8] text-white text-[10px] font-bold rounded-full">
                KTM terverifikasi
              </span>
              <span>Nadia Aulia &middot; Universitas Gadjah Mada</span>
            </div>
          </div>

          {/* Hero Decorative Card */}
          <div className="w-full lg:w-96 rounded-2xl overflow-hidden border border-white/20 shadow-xl relative bg-gradient-to-tr from-[#023E8A] to-[#00B4D8] p-1">
            <div className="bg-[#03045E] rounded-xl p-6 text-white text-center">
              <p className="text-xs font-bold text-[#00B4D8] uppercase">Peluang Lokal</p>
              <h3 className="text-lg font-bold mt-1">Selangkah dari Kampus</h3>
              <p className="text-xs text-slate-300 mt-2">
                Ribuan UMKM dan merchant terkurasi siap menerima mahasiswa part-time di berbagai kota di Indonesia.
              </p>
              <Link 
                to="/kesiapan-karier"
                className="mt-4 inline-block px-4 py-2 bg-[#F59E0B] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#D97706] transition"
              >
                Cek Profil Kesiapan
              </Link>
            </div>
          </div>

        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* ==================================================== */}
        {/* 2. SYNCHRONIZED SCHEDULE BANNER                     */}
        {/* ==================================================== */}
        <div className="bg-[#CAF0F8]/50 border border-[#00B4D8]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-white text-[#00B4D8] rounded-xl shadow-xs shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#03045E]">
                Jadwalmu sudah tersinkron. Cari kerja tanpa bentrok.
              </h2>
              <p className="text-xs text-[#536B82] mt-0.5">
                Sen, Rab, Jum: bebas setelah 15.00 &middot; Sel, Kam: setelah 14.00 &middot; Akhir pekan: bebas
              </p>
            </div>
          </div>

          <Link
            to="/profil"
            className="px-4 py-2 bg-white hover:bg-[#F6F9FC] text-[#023E8A] border border-[#D8E5EE] font-bold text-xs rounded-xl transition shadow-xs inline-flex items-center gap-1.5 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span>Atur jadwal kuliah</span>
          </Link>
        </div>

        {/* ==================================================== */}
        {/* 3. MAIN CONTENT: SIDEBAR FILTER + JOB CARDS GRID    */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SIDEBAR FILTER (3 Cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs space-y-5 text-xs text-[#102C4D]">
            
            <div className="flex items-center justify-between border-b border-[#D8E5EE] pb-3">
              <span className="font-bold text-sm text-[#03045E]">Filter</span>
              <button className="text-[11px] font-semibold text-[#00B4D8] hover:underline">
                Reset
              </button>
            </div>

            {/* Jadwal kuliah toggle */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#102C4D]">Jadwal kuliah</span>
                <input 
                  type="checkbox" 
                  checked={filterJadwal} 
                  onChange={() => setFilterJadwal(!filterJadwal)}
                  className="rounded text-[#00B4D8] focus:ring-[#00B4D8]" 
                />
              </div>
              <p className="text-[11px] text-[#536B82] mt-1">
                Hanya yang cocok. Otomatis mengikuti jam kosong di jadwal kuliahmu.
              </p>
            </div>

            {/* Lokasi */}
            <div className="pt-3 border-t border-[#D8E5EE] space-y-2">
              <span className="font-bold block text-[#102C4D]">Lokasi</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#00B4D8]" />
                <span>Sekitar Kampus (3 km)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#00B4D8]" />
                <span>Satu Kota / Wilayah (5 km)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#00B4D8]" />
                <span>Kerja Jarak Jauh (Remote)</span>
              </label>
            </div>

            {/* Durasi Shift */}
            <div className="pt-3 border-t border-[#D8E5EE] space-y-2">
              <span className="font-bold block text-[#102C4D]">Durasi shift</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#00B4D8]" />
                <span>Maksimal 4 jam</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#00B4D8]" />
                <span>4–6 jam</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#00B4D8]" />
                <span>Lebih dari 8 jam</span>
              </label>
            </div>

            {/* Upah per Jam */}
            <div className="pt-3 border-t border-[#D8E5EE] space-y-2">
              <span className="font-bold block text-[#102C4D]">Upah per jam</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-[#00B4D8]" />
                <span>Rp20.000 ke atas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#00B4D8]" />
                <span>Rp25.000 ke atas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#00B4D8]" />
                <span>Rp30.000 ke atas</span>
              </label>
            </div>

            <p className="pt-3 border-t border-[#D8E5EE] text-[10px] text-slate-400 leading-relaxed">
              Semua usaha telah ditinjau. Tidak ada biaya untuk melamar.
            </p>

          </div>

          {/* JOBS GRID (9 Cols) */}
          <div className="lg:col-span-9 space-y-5">
            
            {/* Header list */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#03045E]">Peluang yang pas untukmu</h2>
                <p className="text-xs text-[#536B82]">{jobs.length} lowongan aktif dari merchant terverifikasi</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-white border border-[#D8E5EE] rounded-xl text-xs font-semibold text-[#102C4D] flex items-center gap-1.5 shadow-xs">
                  <span>Paling relevan</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#536B82]" />
                </button>
              </div>
            </div>

            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}
            {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}
            {loading && <div className="rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center text-sm text-[#536B82]">Memuat lowongan...</div>}
            {!loading && jobs.length === 0 && !errorMessage && <div className="rounded-2xl border border-[#D8E5EE] bg-white p-8 text-center text-sm text-[#536B82]">Belum ada lowongan aktif saat ini.</div>}

            {/* Active filter pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-[#03045E] text-white font-bold rounded-full">
                Jadwal cocok
              </span>
              <span className="px-3 py-1 bg-[#03045E] text-white font-bold rounded-full">
                &le; 3 km
              </span>
              <span className="px-3 py-1 bg-[#03045E] text-white font-bold rounded-full">
                &le; 4 jam
              </span>
            </div>

            {/* Cards 3x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-[#CAF0F8]/40 border border-[#00B4D8]/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {/* Top row: Company & Bookmark */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#D8E5EE] flex items-center justify-center font-bold text-xs text-[#023E8A] shadow-2xs">
                          {(job.merchant_profile?.merchant_name || 'PK').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-[#102C4D]">{job.merchant_profile?.merchant_name || 'Merchant'}</span>
                      </div>

                      <button 
                        onClick={() => toggleBookmark(job.id)}
                        className="text-[#536B82] hover:text-[#023E8A] transition p-1"
                        title="Simpan Lowongan"
                      >
                        <Bookmark className={`w-4 h-4 ${bookmarked.includes(job.id) ? 'fill-[#00B4D8] text-[#00B4D8]' : ''}`} />
                      </button>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-sm font-extrabold text-[#03045E] mt-3">{job.title}</h3>
                    <p className="text-[11px] text-[#536B82] mt-0.5">{job.merchant_profile?.address || 'Lokasi tidak dicantumkan'}</p>
                    <p className="text-[10px] text-[#536B82] mt-1">{[job.category, job.subcategory].filter(Boolean).join(' · ')}</p>

                    {/* Wage & Positions Pill */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="px-2.5 py-1 bg-[#03045E] text-white text-xs font-bold rounded-lg">
                        {job.wage}
                      </span>
                      <span className="text-[11px] text-[#536B82] font-semibold">{job.quota}</span>
                    </div>

                    {/* Schedule Details */}
                    <div className="mt-3.5 space-y-1 text-[11px] text-[#536B82]">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#023E8A]" />
                        <span>{job.schedule}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#023E8A]" />
                        <span>{job.description || 'Informasi pekerjaan dari merchant'}</span>
                      </p>
                    </div>

                    {/* Match Badge */}
                    <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#023E8A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8]" />
                      <span>{job.is_applied ? 'Kamu sudah melamar' : 'Dari merchant terverifikasi'}</span>
                    </div>
                  </div>

                  {/* Lamar Sekarang Button (Orange) */}
                  <button 
                    onClick={() => applyForJob(job)}
                    disabled={job.is_applied || applyingId === job.id}
                    className="mt-4 w-full py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {job.is_applied ? 'Sudah Dilamar' : applyingId === job.id ? 'Mengirim...' : 'Lamar Sekarang'}
                  </button>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* ==================================================== */}
        {/* 4. BOTTOM BANNER                                     */}
        {/* ==================================================== */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#03045E]">Bikin lamaranmu lebih meyakinkan.</h3>
            <p className="text-xs text-[#536B82] mt-0.5">
              Lengkapi CV dan sertifikatmu. Profil terverifikasi lebih mudah dipercaya merchant.
            </p>
          </div>

          <Link
            to="/kesiapan-karier"
            className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition shrink-0"
          >
            <span>Cek kesiapan karier</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

    </div>
  );
}
