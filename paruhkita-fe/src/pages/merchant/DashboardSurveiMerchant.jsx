import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BriefcaseBusiness, CalendarDays, ClipboardList, LogOut, MessageSquare, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { SURVEY_CATEGORIES } from '../../components/survei/surveyData';

function formattedScore(score) {
  return score == null ? '—' : Number(score).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

const questionLabels = {
  wage: ['Kesesuaian upah dengan pekerjaan', 'Kejelasan sistem pembayaran', 'Ketepatan waktu pembayaran', 'Kesesuaian dengan kesepakatan kerja'],
  hours: ['Kejelasan jadwal kerja', 'Kesesuaian jam kerja', 'Ketersediaan waktu istirahat', 'Beban kerja sesuai waktu kerja'],
  safety: ['Keamanan lingkungan kerja', 'Fasilitas keselamatan tersedia', 'Kejelasan prosedur keselamatan', 'Perlindungan selama bekerja'],
  tasks: ['Kejelasan deskripsi pekerjaan', 'Kejelasan tanggung jawab', 'Pekerjaan sesuai posisi', 'Kejelasan instruksi dari atasan'],
};

function averageQuestion(surveys, categoryId, questionIndex) {
  const scores = surveys
    .map((survey) => Number(survey.question_scores?.[categoryId]?.[questionIndex]))
    .filter((score) => Number.isFinite(score) && score >= 1 && score <= 5);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}

export default function DashboardSurveiMerchant() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/v1/merchant/profile')
      .then(async ({ data }) => {
        if (!active) return;
        const profile = data.data;
        setMerchant(profile);
        const surveyResponse = await api.get(`/v1/merchants/${profile.id}/surveys`);
        if (active) setSurveyData(surveyResponse.data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat hasil survei.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const surveys = surveyData?.surveys || [];
  const questionResults = SURVEY_CATEGORIES.flatMap((category) => category.questions.map((question, index) => ({
    categoryId: category.id,
    categoryTitle: category.title,
    question: questionLabels[category.id][index],
    score: averageQuestion(surveys, category.id, index),
  })));
  const lowestQuestion = questionResults.filter((item) => item.score != null).sort((left, right) => left.score - right.score)[0];
  const latestComment = surveys.find((survey) => survey.comments?.trim());
  const initials = (merchant?.merchant_name || user?.name || 'PK').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#102C4D]">
      <header className="flex items-center justify-between bg-[#03045E] px-6 py-3.5 text-white shadow-sm">
        <button type="button" onClick={() => navigate('/merchant/dashboard')} className="flex items-center gap-2.5 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00B4D8] text-white shadow-xs"><svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/><circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D"/></svg></span><span className="text-lg font-extrabold tracking-tight">ParuhKita</span></button>
        <nav className="hidden items-center gap-6 text-xs font-semibold md:flex"><button onClick={() => navigate('/merchant/dashboard')} className="text-slate-300 hover:text-white">Dashboard</button><button onClick={() => navigate('/merchant/candidates')} className="text-slate-300 hover:text-white">Kandidat</button><button onClick={() => navigate('/merchant/dashboard')} className="text-slate-300 hover:text-white">Lowongan</button><span className="text-[#00B4D8]">Ulasan</span></nav>
        <div className="flex items-center gap-4"><Bell size={18} className="hidden sm:block" /><button type="button" onClick={() => navigate('/merchant/profile')} className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#CAF0F8] text-[10px] font-bold text-[#023E8A]">{initials}</span><span className="hidden sm:inline">{merchant?.merchant_name || user?.name}</span></button><button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10"><LogOut size={14} /> Keluar</button></div>
      </header>

      <div className="flex min-h-[calc(100vh-124px)]">
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#D8E5EE] bg-white lg:flex">
          <div>
            <div className="border-b border-[#D8E5EE] p-6"><p className="text-[10px] font-bold uppercase tracking-wider text-[#536B82]">Ruang Merchant</p><h2 className="mt-0.5 text-base font-bold text-[#03045E]">{merchant?.merchant_name || 'Merchant'}</h2><p className="text-xs text-[#536B82]">{merchant?.address || 'Lokasi usaha'}</p><span className="mt-3 inline-block rounded-lg bg-[#CAF0F8] px-2.5 py-1 text-[10px] font-bold text-[#023E8A]">Usaha terverifikasi</span></div>
            <nav className="space-y-1.5 p-4 text-xs font-semibold">
              <button type="button" onClick={() => navigate('/merchant/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[#536B82] hover:bg-slate-50"><BriefcaseBusiness size={14} /> Ringkasan</button>
              <button type="button" onClick={() => navigate('/merchant/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[#536B82] hover:bg-slate-50"><BriefcaseBusiness size={14} /> Lowongan</button>
              <button type="button" onClick={() => navigate('/merchant/candidates')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[#536B82] hover:bg-slate-50"><Users size={14} /> Kandidat</button>
              <button type="button" className="flex w-full items-center gap-3 rounded-xl bg-[#023E8A] px-3.5 py-2.5 text-left font-bold text-white"><ClipboardList size={14} /> Survei Kelayakan</button>
              <button type="button" onClick={() => navigate('/merchant/jadwal')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[#536B82] hover:bg-slate-50"><CalendarDays size={14} /> Jadwal</button>
              <button type="button" onClick={() => navigate('/merchant/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[#536B82] hover:bg-slate-50"><MessageSquare size={14} /> Pesan</button>
              <button type="button" onClick={() => navigate('/merchant/settings')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[#536B82] hover:bg-slate-50"><Settings size={14} /> Pengaturan</button>
            </nav>
            </div>
        </aside>

        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <p className="text-[8px] text-[#536B82]">Dashboard / Hasil survei kelayakan kerja</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-[#03045E] sm:text-3xl">Hasil Survei Kelayakan Kerja</h1><p className="mt-1 text-xs text-[#536B82]">{merchant?.merchant_name || 'Merchant'}{merchant?.address ? ` · ${merchant.address}` : ''}</p><p className="mt-2 text-[11px] text-[#536B82]">Lihat pengalaman mahasiswa tentang upah, jam kerja, keamanan, dan kejelasan tugas di tempat kerjamu.</p></div>{!loading && surveyData && <span className="rounded-full bg-[#DDF7FC] px-2.5 py-1.5 text-[9px] font-bold text-[#03458C]">{surveyData.survey_count} survei diterima</span>}</div>

          {loading && <div role="status" className="mt-4 rounded-lg border border-[#D8E5EE] bg-white p-5 text-xs text-[#536B82]">Memuat hasil survei...</div>}
          {!loading && errorMessage && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{errorMessage}</div>}
          {!loading && !errorMessage && surveyData && <>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[8px] text-[#73869A]"><span>Contoh data · {surveyData.survey_count} responden</span>{surveys[0] && <span>Pengiriman terakhir: {new Date(surveys[0].created_at).toLocaleString('id-ID')}</span>}</div>
            <section className="mt-3"><h2 className="mb-3 text-base font-bold text-[#03045E]">Ringkasan penilaian</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{SURVEY_CATEGORIES.map((category) => <article key={category.id} className="rounded-lg border border-[#D8E5EE] bg-white p-5"><p className="text-xs text-[#536B82]">{category.title.slice(3)}</p><p className="mt-2 text-2xl font-extrabold text-[#03458C]">{formattedScore(surveyData.averages?.[category.id])}<span className="ml-1 text-xs font-medium text-[#536B82]">/ 5</span></p><div className="mt-3 h-1 rounded-full bg-[#DDF7FC]"><div className="h-1 rounded-full bg-[#03458C]" style={{ width: `${Math.min(100, (surveyData.averages?.[category.id] || 0) * 20)}%` }} /></div><p className="mt-2 text-[9px] text-[#73869A]">4 pernyataan · {surveyData.survey_count} responden</p></article>)}</div></section>

            <section className="mt-4"><div className="flex flex-wrap items-end justify-between gap-1"><h2 className="text-xs font-bold text-[#03045E]">Rincian empat aspek tempat kerja</h2><p className="text-[8px] text-[#73869A]">Skala: 1 Sangat Tidak Setuju · 2 Tidak Setuju · 3 Netral · 4 Setuju · 5 Sangat Setuju</p></div>
              {surveys.length === 0 ? <div className="mt-2 rounded-lg border border-dashed border-[#D8E5EE] bg-white p-8 text-center text-xs text-[#536B82]">Belum ada survei yang dikirim untuk tempat kerja ini.</div> : <div className="mt-2 grid gap-2 sm:grid-cols-2">{SURVEY_CATEGORIES.map((category) => <article key={category.id} className="rounded-lg border border-[#D8E5EE] bg-white p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-[11px] font-bold text-[#03045E]">{category.title.slice(3)}</h3><span className="text-xs font-extrabold text-[#03458C]">{formattedScore(surveyData.averages?.[category.id])} / 5</span></div><p className="mt-1 text-[8px] text-[#73869A]">Rata-rata dari 4 pernyataan · {surveyData.survey_count} responden</p><div className="mt-2 divide-y divide-[#E7EEF3]">{category.questions.map((question, index) => { const score = averageQuestion(surveys, category.id, index); return <div key={question} className="flex items-center justify-between gap-2 py-2"><span className="text-[9px] leading-4 text-[#102C4D]">{questionLabels[category.id][index]}</span><span className={`shrink-0 rounded px-1.5 py-1 text-[8px] font-bold ${score !== null && score < 3.5 ? 'bg-amber-50 text-amber-800' : 'bg-[#F4F8FB] text-[#03458C]'}`}>{score === null ? '—' : `${formattedScore(score)} / 5`}</span></div>; })}</div></article>)}</div>}
            </section>

            {surveys.length > 0 && <section className="mt-3 grid gap-2 sm:grid-cols-2"><article className="rounded-lg border border-[#D8E5EE] bg-white p-3"><h2 className="text-[11px] font-bold text-[#03045E]">Komentar mahasiswa</h2>{latestComment ? <><p className="mt-2 text-[9px] font-semibold text-[#03458C]">{latestComment.position} · {latestComment.department}</p><p className="mt-1 text-[8px] text-[#73869A]">Periode bekerja: {new Date(`${latestComment.start_date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – {new Date(`${latestComment.end_date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="mt-2 text-[9px] leading-4 text-[#536B82]">“{latestComment.comments}”</p><p className="mt-2 text-[8px] text-[#73869A]">Dikirim {new Date(latestComment.created_at).toLocaleString('id-ID')}</p></> : <p className="mt-2 text-[9px] text-[#536B82]">Belum ada komentar tambahan.</p>}</article><article className="rounded-lg border border-[#BDEAF4] bg-[#DDF7FC] p-3"><h2 className="text-[11px] font-bold text-[#03045E]">Perhatian utama</h2>{lowestQuestion ? <><p className="mt-2 text-[9px] font-semibold text-[#03458C]">{lowestQuestion.question} mendapat nilai {formattedScore(lowestQuestion.score)} / 5.</p><p className="mt-1 text-[9px] leading-4 text-[#536B82]">Berdasarkan {surveyData.survey_count} survei yang masuk. Perhatikan masukan mahasiswa pada aspek {lowestQuestion.categoryTitle.slice(3).toLowerCase()}.</p><p className="mt-2 text-[9px] font-bold text-[#03458C]">Saran: tinjau kembali pengalaman kerja pada aspek tersebut.</p></> : <p className="mt-2 text-[9px] text-[#536B82]">Belum ada jawaban untuk dihitung.</p>}</article></section>}

            <section className="mt-3 rounded-lg border border-[#D8E5EE] bg-white p-3"><h2 className="text-[9px] font-bold text-[#03045E]">Tentang hasil survei ini</h2><p className="mt-1 text-[8px] leading-4 text-[#73869A]">Hasil berasal dari {surveyData.survey_count} tanggapan mahasiswa. Nilai tiap kategori adalah rata-rata dari 4 pernyataan; bukan jaminan kelayakan seluruh pekerja. Pengalaman dapat menjadi bahan pertimbangan bagi mahasiswa lain.</p></section>
          </>}
        </main>
      </div>

      <footer className="flex flex-col items-center justify-between gap-4 bg-[#03045E] px-8 py-4 text-xs text-slate-200 sm:flex-row"><span className="font-extrabold text-white">ParuhKita</span><span>Langkah kecil, masa depan besar. © 2026 ParuhKita</span><span className="hidden sm:inline">Pusat bantuan · Privasi · Ketentuan</span></footer>
    </div>
  );
}
