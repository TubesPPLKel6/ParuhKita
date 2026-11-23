import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  FileText, 
  Briefcase, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Award,
  ChevronRight,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/v1/dashboard/summary');
        if (res.data.status) {
          setSummary(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-[#536B82] font-medium">Memuat ringkasan dashboard...</p>
      </div>
    );
  }

  const completion = summary?.profile_completion || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Welcome banner */}
      <div className="bg-[#03045E] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00B4D8]/20 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[#CAF0F8] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#FBB02D]" />
            <span>Dashboard Mahasiswa ParuhKita</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Halo, {user?.name || 'Mahasiswa'}! 👋
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Kelola profil profesional, CV, dan portofolio karyamu untuk menarik minat merchant terbaik di sekitar kampusmu.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/profil"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              <User className="w-4 h-4" />
              <span>Perbarui Profil</span>
            </Link>
            <Link
              to="/cv"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition border border-white/20"
            >
              <FileText className="w-4 h-4" />
              <span>Kelola CV</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#CAF0F8] text-[#023E8A] flex items-center justify-center font-black text-lg shrink-0">
              {completion}%
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#102C4D]">Kelengkapan Profil</h2>
              <p className="text-xs text-[#536B82] mt-0.5">
                {completion >= 80 
                  ? 'Profilmu sudah sangat lengkap! Peluang dilirik merchant meningkat drastis.' 
                  : 'Lengkapi foto, keterampilan, dan ketersediaan waktu agar profilmu lebih menarik.'}
              </p>
            </div>
          </div>

          <Link
            to="/profil"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8] transition shrink-0"
          >
            <span>Lengkapi sekarang</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#F6F9FC] border border-[#D8E5EE] h-2.5 rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#00B4D8] to-[#023E8A] rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* CV Card */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#536B82] uppercase tracking-wider">Berkas CV</span>
              <div className="p-2 bg-[#CAF0F8] text-[#023E8A] rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#102C4D]">{summary?.cv?.total || 0}</span>
              <span className="text-xs text-[#536B82]">/ 5 versi tersimpan</span>
            </div>
            <p className="text-xs text-[#536B82] mt-2">
              CV Utama: <strong className="text-[#102C4D]">{summary?.cv?.primary_cv?.title || 'Belum ditentukan'}</strong>
            </p>
          </div>
          <Link
            to="/cv"
            className="mt-4 pt-3 border-t border-[#D8E5EE] flex items-center justify-between text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8]"
          >
            <span>Buka manajer CV</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Portfolio Card */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#536B82] uppercase tracking-wider">Portofolio Karya</span>
              <div className="p-2 bg-amber-50 text-[#F59E0B] rounded-xl">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#102C4D]">{summary?.portfolio?.total || 0}</span>
              <span className="text-xs text-[#536B82]">/ 20 item karya</span>
            </div>
            <p className="text-xs text-[#536B82] mt-2">
              Lampirkan sertifikat, foto hasil kerja, atau proyek terbaikmu.
            </p>
          </div>
          <Link
            to="/portofolio"
            className="mt-4 pt-3 border-t border-[#D8E5EE] flex items-center justify-between text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8]"
          >
            <span>Buka portofolio</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#536B82] uppercase tracking-wider">Status Profil</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold text-[#102C4D]">Terbuka untuk Peluang</span>
            </div>
            <p className="text-xs text-[#536B82] mt-2">
              Profil dan CV dapat dilihat oleh merchant terverifikasi di seluruh Indonesia.
            </p>
          </div>
          <Link
            to="/profil"
            className="mt-4 pt-3 border-t border-[#D8E5EE] flex items-center justify-between text-xs font-semibold text-[#023E8A] hover:text-[#00B4D8]"
          >
            <span>Edit data profil</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Widgets Jadwal & Reputasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget: Lamaran & Jadwal Mendatang */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#023E8A]" />
              <h2 className="text-sm font-bold text-[#102C4D]">Jadwal Kerja & Wawancara Mendatang</h2>
            </div>
            <span className="text-[10px] font-bold bg-[#CAF0F8] text-[#023E8A] px-2 py-0.5 rounded-full">
              Terjadwal
            </span>
          </div>

          <div className="p-6 bg-[#F6F9FC] border border-dashed border-[#D8E5EE] rounded-xl text-center">
            <Clock className="w-8 h-8 text-[#536B82]/50 mx-auto mb-2" />
            <p className="text-xs font-medium text-[#102C4D]">Belum ada jadwal kerja mendatang</p>
            <p className="text-[11px] text-[#536B82] mt-1">
              Jadwal wawancara atau shift kerja paruh waktu akan muncul di sini setelah kamu melamar lowongan.
            </p>
          </div>
        </div>

        {/* Widget: Lencana & Reputasi */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-sm font-bold text-[#102C4D]">Lencana & Reputasi Mahasiswa</h2>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Pencapaian
            </span>
          </div>

          <div className="p-6 bg-[#F6F9FC] border border-dashed border-[#D8E5EE] rounded-xl text-center">
            <Star className="w-8 h-8 text-[#FBB02D]/60 mx-auto mb-2" />
            <p className="text-xs font-medium text-[#102C4D]">Reputasi & Ulasan Merchant</p>
            <p className="text-[11px] text-[#536B82] mt-1">
              Selesaikan pekerjaan pertamamu dengan baik untuk mendapatkan bintang rating dan lencana keahlian!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
