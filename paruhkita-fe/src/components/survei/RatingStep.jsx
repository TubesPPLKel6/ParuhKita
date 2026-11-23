import React from 'react';
import { ArrowLeft, ArrowRight, Clock3, ClipboardList, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatAverage, SCALE_LABELS, SURVEY_CATEGORIES } from './surveyData';

const iconByCategory = { wage: Wallet, hours: Clock3, safety: ShieldCheck, tasks: ClipboardList };

export default function RatingStep({ company, values, ratings, comments, setScore, setComments, onBack, onNext, canContinue }) {
  const answeredCount = Object.values(ratings).flat().filter(Boolean).length;
  const averages = SURVEY_CATEGORIES.map((category) => {
    const scores = ratings[category.id];
    return scores.filter(Boolean).length ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.filter(Boolean).length : 0;
  });
  return (
    <div className="mt-3 space-y-3">
      <section className="grid gap-3 rounded-lg border border-[#D8E5EE] bg-white p-3 text-[10px] sm:grid-cols-3 sm:p-4">
        <div><p className="font-bold text-[#03458C]">{company?.merchant_name || 'Perusahaan'}</p><p className="text-[#536B82]">{company?.address || 'Lokasi tidak dicantumkan'}</p></div>
        <div className="border-[#D8E5EE] sm:border-l sm:pl-4"><p className="font-bold text-[#03458C]">{values.position}</p><p className="text-[#536B82]">{values.department}</p></div>
        <div className="border-[#D8E5EE] sm:border-l sm:pl-4"><p className="font-bold text-[#03458C]">Periode bekerja</p><p className="text-[#536B82]">{new Date(`${values.start_date}T00:00:00`).toLocaleDateString('id-ID')} – {new Date(`${values.end_date}T00:00:00`).toLocaleDateString('id-ID')}</p></div>
      </section>

      <section className="rounded-lg border border-[#D8E5EE] bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-bold text-[#03458C]">Penilaian pengalaman kerja</h2><span className="rounded bg-[#DDF7FC] px-2 py-1 text-[9px] font-bold text-[#03458C]">{answeredCount}/16 terisi · {Math.round(answeredCount / 16 * 100)}%</span></div>
        <div className="mt-2 h-1 rounded-full bg-[#E8F0F5]"><div className="h-1 rounded-full bg-[#00B4D8] transition-all" style={{ width: `${answeredCount / 16 * 100}%` }} /></div>
        <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-[#536B82]">{SCALE_LABELS.map((label, index) => <span key={label} className="inline-flex items-center gap-1"><b className="grid h-4 w-4 place-items-center rounded border border-[#D8E5EE] font-semibold text-[#03458C]">{index + 1}</b>{label}</span>)}</div>
      </section>

      {SURVEY_CATEGORIES.map((category, categoryIndex) => {
        const Icon = iconByCategory[category.id];
        const answered = ratings[category.id].filter(Boolean).length;
        return <section key={category.id} className="rounded-lg border border-[#D8E5EE] bg-white p-3 sm:p-4">
          <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[#D8E5EE] pb-3">
            <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#DDF7FC] text-[#03458C]"><Icon size={14} /></span><div><h2 className="text-xs font-bold text-[#03458C]">{category.title}</h2><p className="text-[9px] text-[#536B82]">{category.description}</p></div></div>
            <div className="text-right"><span className="rounded bg-[#DDF7FC] px-2 py-1 text-[9px] font-semibold text-[#03458C]">{answered}/4 terisi</span><p className="mt-1 text-[9px] text-[#536B82]">Rata-rata {answered ? formatAverage(averages[categoryIndex]) : '0,00'} / 5</p></div>
          </header>
          <div className="mt-2 flex items-center justify-between text-[8px] uppercase text-[#536B82]"><span>Pernyataan · semua wajib diisi</span><span>Pilih satu jawaban (1–5)</span></div>
          <div className="mt-1">
            {category.questions.map((question, questionIndex) => <fieldset key={question} className="grid gap-2 border-t border-[#E7EEF3] py-2.5 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
              <legend className="sr-only">{question}</legend>
              <p className="text-[10px] leading-4 text-[#102C4D]"><span className="mr-2 text-[9px] text-[#536B82]">{String.fromCharCode(65 + categoryIndex)}{questionIndex + 1}</span>{question}<span className="ml-1 text-[#00A9CE]">*</span></p>
              <div className="flex justify-end gap-1.5">{[1, 2, 3, 4, 5].map((score) => <label key={score} className={`grid h-7 w-8 cursor-pointer place-items-center rounded border text-[9px] transition ${ratings[category.id][questionIndex] === score ? 'border-[#03458C] bg-[#03458C] font-bold text-white' : 'border-[#D8E5EE] bg-white text-[#536B82] hover:border-[#00B4D8]'}`} title={SCALE_LABELS[score - 1]}><input type="radio" name={`${category.id}-${questionIndex}`} value={score} checked={ratings[category.id][questionIndex] === score} onChange={() => setScore(category.id, questionIndex, score)} className="sr-only" />{ratings[category.id][questionIndex] === score ? `✓ ${score}` : score}</label>)}</div>
            </fieldset>)}
          </div>
          <p className="pt-1 text-[8px] text-[#536B82]">1 Sangat Tidak Setuju · 2 Tidak Setuju · 3 Netral · 4 Setuju · 5 Sangat Setuju</p>
        </section>;
      })}

      <section className="rounded-lg border border-[#D8E5EE] bg-white p-4">
        <label className="block text-xs font-bold text-[#03458C]">Komentar tambahan <span className="font-normal text-[#536B82]">(opsional)</span><span className="mt-1 block text-[9px] font-normal text-[#536B82]">Ceritakan hal yang membantu mahasiswa lain memahami pengalaman kerja.</span>
          <textarea value={comments} onChange={(event) => setComments(event.target.value)} rows={3} maxLength={2000} className="mt-2 w-full resize-y rounded-md border border-[#D8E5EE] bg-white p-3 text-[10px] leading-4 text-[#102C4D] outline-none focus:border-[#00B4D8]" placeholder="Tulis komentar tambahan..." />
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-md border border-[#D8E5EE] bg-white px-3 py-2 text-[10px] font-bold text-[#03458C]"><ArrowLeft size={13} /> Kembali</button>
        <button type="button" onClick={onNext} disabled={!canContinue} className="inline-flex items-center gap-1 rounded-md bg-[#00B4D8] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#0096B4] disabled:cursor-not-allowed disabled:opacity-50">Review Jawaban <ArrowRight size={13} /></button>
      </div>
    </div>
  );
}