import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Bookmark, 
  Image as ImageIcon, 
  BarChart2, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  ShieldAlert,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function Komunitas() {
  const [activeTopic, setActiveTopic] = useState('Semua Postingan');
  const [postContent, setPostContent] = useState('');
  const [likes, setLikes] = useState({ 1: 24, 2: 12, 3: 8, 4: 31 });

  const topics = [
    'Semua Postingan',
    'Review Tempat Kerja',
    'Tips Wawancara & CV',
    'Info Lowongan dari Teman',
    'Diskusi Upah & Hak Pekerja',
    'Pengalaman Kerja Pertama',
    'Keluhan & Solusi Masalah Kerja',
  ];

  const handleLike = (id) => {
    setLikes({ ...likes, [id]: likes[id] + 1 });
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] pb-16">
      
      {/* Header Banner */}
      <section className="bg-white border-b border-[#D8E5EE] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold text-[#00B4D8] uppercase tracking-wider block mb-1">
              DARI MAHASISWA, UNTUK MAHASISWA
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#03045E]">
              Ruang Diskusi &amp; Berbagi Pengalaman Kerja
            </h1>
            <p className="text-xs sm:text-sm text-[#536B82] mt-1.5 leading-relaxed">
              Tanya tips wawancara, review tempat kerja, bagikan info lowongan, atau sekadar curhat soal kerja paruh waktu.
            </p>
          </div>

          {/* Metrics */}
          <div className="bg-[#F6F9FC] border border-[#D8E5EE] rounded-2xl p-4 flex items-center justify-around gap-6 shrink-0 shadow-xs">
            <div className="text-center">
              <p className="text-lg font-black text-[#03045E]">1.240</p>
              <p className="text-[10px] text-[#536B82]">anggota aktif</p>
            </div>
            <div className="w-px h-8 bg-[#D8E5EE]"></div>
            <div className="text-center">
              <p className="text-lg font-black text-[#03045E]">86</p>
              <p className="text-[10px] text-[#536B82]">postingan minggu ini</p>
            </div>
            <div className="w-px h-8 bg-[#D8E5EE]"></div>
            <div className="text-center">
              <p className="text-lg font-black text-[#03045E]">328</p>
              <p className="text-[10px] text-[#536B82]">komentar</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Column Community Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Topik Diskusi (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-4 shadow-xs">
              <h3 className="text-xs font-bold text-[#03045E] uppercase tracking-wider mb-3 px-2">
                Topik Diskusi
              </h3>
              <nav className="space-y-1 text-xs">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTopic(t)}
                    className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition ${
                      activeTopic === t
                        ? 'bg-[#CAF0F8] text-[#023E8A]'
                        : 'text-[#536B82] hover:bg-[#F6F9FC] hover:text-[#102C4D]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </nav>
            </div>

            {/* Survei Kelayakan Widget */}
            <div className="bg-[#CAF0F8]/40 border border-[#00B4D8]/30 rounded-2xl p-4 text-xs text-[#023E8A] shadow-xs">
              <h4 className="font-bold flex items-center gap-1.5 mb-1 text-[#03045E]">
                <span>📊</span>
                <span>Isi Survei Kelayakan Kerja</span>
              </h4>
              <p className="text-[11px] text-[#536B82] leading-relaxed mb-3">
                Bantu kami memastikan semua tempat kerja di ParuhKita layak untuk mahasiswa.
              </p>
              <Link to="/komunitas/survei" className="font-bold text-[#00B4D8] hover:underline flex items-center gap-1 text-[11px]">
                <span>Isi survei</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* MIDDLE COLUMN: Post Feed (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Create Post Input */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00B4D8] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  NA
                </div>
                <input
                  type="text"
                  placeholder="Apa yang ingin kamu bagikan atau tanyakan, Nadia?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2 text-xs text-[#102C4D] focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-[#D8E5EE] flex items-center justify-between text-xs text-[#536B82]">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 hover:text-[#023E8A] transition text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Foto</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-[#023E8A] transition text-[11px]">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Polling</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-[#023E8A] transition text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tandai Lokasi</span>
                  </button>
                </div>

                <button 
                  onClick={() => {
                    if (postContent) {
                      alert('Postingan kamu berhasil diterbitkan di komunitas!');
                      setPostContent('');
                    }
                  }}
                  className="px-4 py-1.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Posting
                </button>
              </div>
            </div>

            {/* Post 1: Rizky Pratama */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#023E8A] text-white flex items-center justify-center font-bold text-xs">
                    RP
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102C4D]">Rizky Pratama</h4>
                    <p className="text-[10px] text-slate-400">UNY &middot; Pend. Ekonomi &middot; 2 jam lalu</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#CAF0F8] text-[#023E8A] text-[10px] font-bold rounded-full">
                    Review Tempat Kerja
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Shift Terverifikasi
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 text-xs text-[#102C4D]">
                <div className="flex text-[#FBB02D]">
                  {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                </div>
                <span className="font-bold">4.8/5</span>
                <span className="text-[#536B82]">untuk <strong className="text-[#102C4D]">Dapur Kampus, Bulaksumur</strong></span>
              </div>

              <p className="text-xs text-[#536B82] leading-relaxed">
                Sharing pengalaman 2 bulan kerja shift sore di Dapur Kampus. Tim-nya solid banget, owner-nya paham kalau kita mahasiswa jadi pas minggu UTS/UAS jadwal dikurangi tanpa potong insentif. Upah Rp24.000/jam + makan siang gratis setiap shift. Highly recommended buat yang cari kerja paruh waktu di sekitar kampus! 👍
              </p>

              {/* Actions */}
              <div className="pt-3 border-t border-[#D8E5EE] flex items-center justify-between text-xs text-[#536B82]">
                <button onClick={() => handleLike(1)} className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{likes[1]} Suka</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>8 Komentar</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>

            {/* Post 2: Salsa Maharani */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#03045E] text-white flex items-center justify-center font-bold text-xs">
                    SM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102C4D]">Salsa Maharani</h4>
                    <p className="text-[10px] text-slate-400">UNY &middot; Manajemen &middot; 5 jam lalu</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full">
                  Tips Wawancara
                </span>
              </div>

              <p className="text-xs text-[#536B82] leading-relaxed">
                Ada yang pernah wawancara untuk posisi kasir di toko buku daerah Sagan/Gejayan? Kira-kira pertanyaannya seputar apa ya? Ini wawancara pertama saya jadi agak nervous 😅 Tips-nya dong!
              </p>

              <div className="pt-3 border-t border-[#D8E5EE] flex items-center justify-between text-xs text-[#536B82]">
                <button onClick={() => handleLike(2)} className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{likes[2]} Suka</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>15 Komentar</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#00B4D8] transition">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Topik Hangat & Aturan (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Topik Hangat */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs">
              <h3 className="text-xs font-bold text-[#03045E] flex items-center gap-1.5 mb-3">
                <Flame className="w-4 h-4 text-orange-500 fill-current" />
                <span>Topik Hangat</span>
              </h3>
              <div className="space-y-2 text-xs">
                <p className="text-[#023E8A] font-semibold hover:underline cursor-pointer">
                  1. #ReviewTempatKerja <span className="text-slate-400 font-normal">&mdash; 42 diskusi</span>
                </p>
                <p className="text-[#023E8A] font-semibold hover:underline cursor-pointer">
                  2. #TipsWawancara <span className="text-slate-400 font-normal">&mdash; 28 diskusi</span>
                </p>
                <p className="text-[#023E8A] font-semibold hover:underline cursor-pointer">
                  3. #PengalamanBarista <span className="text-slate-400 font-normal">&mdash; 19 diskusi</span>
                </p>
                <p className="text-[#023E8A] font-semibold hover:underline cursor-pointer">
                  4. #HakPekerjaPartTime <span className="text-slate-400 font-normal">&mdash; 15 diskusi</span>
                </p>
                <p className="text-[#023E8A] font-semibold hover:underline cursor-pointer">
                  5. #LowonganSekitarUGM <span className="text-slate-400 font-normal">&mdash; 12 diskusi</span>
                </p>
              </div>
            </div>

            {/* Kontributor Teratas */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs">
              <h3 className="text-xs font-bold text-[#03045E] flex items-center gap-1.5 mb-3">
                <Trophy className="w-4 h-4 text-[#FBB02D]" />
                <span>Kontributor Teratas</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#023E8A] text-white flex items-center justify-center font-bold text-[10px]">RP</div>
                  <div>
                    <p className="font-bold text-[#102C4D]">Rizky Pratama</p>
                    <p className="text-[10px] text-slate-400">12 postingan &middot; 48 komentar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00B4D8] text-white flex items-center justify-center font-bold text-[10px]">DP</div>
                  <div>
                    <p className="font-bold text-[#102C4D]">Dinda Putri</p>
                    <p className="text-[10px] text-slate-400">8 postingan &middot; 35 komentar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aturan Komunitas */}
            <div className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs text-xs text-[#536B82] space-y-2">
              <h3 className="font-bold text-[#03045E] mb-2">Aturan Komunitas</h3>
              <p className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Berbagi pengalaman kerja nyata</span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Saling bantu dan hormati</span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-red-600">
                <span className="font-bold">&times;</span>
                <span>Dilarang promosi, spam, MLM</span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-red-600">
                <span className="font-bold">&times;</span>
                <span>Dilarang menyebarkan info palsu</span>
              </p>
              <a href="#" className="inline-block text-[#023E8A] font-bold hover:underline pt-1 text-[11px]">
                Baca ketentuan lengkap &rarr;
              </a>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
