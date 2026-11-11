import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SURVEY_CATEGORIES, formatAverage } from './surveyData';

export default function ReviewStep({ company, values, ratings, comments, averages, onEdit, onSubmit, submitting }) {
  return (
    <div className="mt-3 space-y-3">
      <section className="grid gap-3 rounded-lg border border-[#D8E5EE] bg-white p-3 text-[10px] sm:grid-cols-3 sm:p-4">
        <div><p className="font-bold text-[#03458C]">{company?.merchant_name}</p><p className="text-[#536B82]">{company?.address || 'Lokasi tidak dicantumkan'}</p></div>
        <div className="border-[#D8E5EE] sm:border-l sm:pl-4"><p className="font-bold text-[#03458C]">{values.position}</p><p className="text-[#536B82]">{values.department}</p></div>
        <div className="border-[#D8E5EE] sm:border-l sm:pl-4"><p className="font-bold text-[#03458C]">Periode bekerja</p><p className="text-[#536B82]">{new Date(`${values.start_date}T00:00:00`).toLocaleDateString('id-ID')} – {new Date(`${values.end_date}T00:00:00`).toLocaleDateString('id-ID')}</p></div>
      </section>

      <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-[#03458C]">Review Jawaban Survei</h2><span className="text-[9px] text-[#536B82]">Semua jawaban wajib sudah terisi</span></div>
      <div className="space-y-3">
        {SURVEY_CATEGORIES.map((category) => <section key={category.id} className="rounded-lg border border-[#D8E5EE] bg-white p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3 border-b border-[#D8E5EE] pb-2"><div><h3 className="text-xs font-bold text-[#03458C]">{category.title}</h3><p className="text-[9px] text-[#536B82]">4 jawaban · {category.description}</p></div><div className="text-right"><p className="text-[9px] text-[#536B82]">Rata-rata kategori</p><p className="text-base font-extrabold text-[#03458C]">{formatAverage(averages[category.id])}<span className="text-[9px] font-medium"> / 5</span></p></div></div>
          <div className="mt-1">{category.questions.map((question, index) => <div key={question} className="grid grid-cols-[minmax(0,1fr)_52px_88px] items-center gap-2 border-b border-[#E7EEF3] py-2 last:border-b-0"><p className="text-[9px] leading-4 text-[#102C4D]"><span className="mr-2 text-[#536B82]">{String.fromCharCode(65 + SURVEY_CATEGORIES.indexOf(category))}{index + 1}</span>{question}</p><span className="rounded bg-[#DDF7FC] px-2 py-1 text-center text-[9px] font-bold text-[#03458C]">{ratings[category.id][index]} / 5</span><span className="text-[9px] text-[#536B82]">{['', 'Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'][ratings[category.id][index]]}</span></div>)}</div>
        </section>)}
      </div>

      {comments.trim() && <section className="rounded-lg border border-[#D8E5EE] bg-white p-4"><h2 className="text-xs font-bold text-[#03458C]">Komentar tambahan <span className="font-normal text-[#536B82]">(opsional)</span></h2><p className="mt-2 rounded-md bg-[#F6F9FC] p-3 text-[10px] leading-4 text-[#536B82]">{comments}</p></section>}

      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-md border border-[#D8E5EE] bg-white px-3 py-2 text-[10px] font-bold text-[#03458C]"><ArrowLeft size={13} /> Edit Jawaban</button><button type="button" onClick={onSubmit} disabled={submitting} className="inline-flex items-center gap-1 rounded-md bg-[#00B4D8] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#0096B4] disabled:cursor-wait disabled:opacity-60">{submitting ? 'Mengirim...' : 'Kirim Survei'} {submitting ? null : <ArrowRight size={13} />}</button></div>
    </div>
  );
}