import React from 'react';
import { CalendarDays, Check, CheckCircle2, Clock3, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatAverage, SURVEY_CATEGORIES } from './surveyData';

const icons = [Wallet, Clock3, ShieldCheck, CalendarDays];

export default function SuccessStep({ company, values, averages, submittedAt }) {
  return (
    <section className="mx-auto mt-4 max-w-5xl rounded-lg border border-[#D8E5EE] bg-white p-5 sm:p-8">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#DDF7FC] text-[#00A9CE]"><CheckCircle2 size={26} /></span>
        <h2 className="mt-3 text-lg font-extrabold text-[#03458C] sm:text-xl">Survei Berhasil Dikirim</h2>
        <p className="mx-auto mt-1 max-w-xl text-[10px] leading-4 text-[#536B82]">Terima kasih telah berbagi pengalaman kerja nyata dengan mahasiswa lain di ParuhKita.</p>
        {submittedAt && <p className="mt-2 inline-flex items-center gap-1 text-[9px] text-[#536B82]"><Check size={12} /> Dikirim pada {new Date(submittedAt).toLocaleString('id-ID')}</p>}
      </div>

      <div className="mt-5 grid gap-3 rounded-lg border border-[#D8E5EE] p-3 text-[10px] sm:grid-cols-3 sm:p-4">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-md bg-[#03045E] text-[9px] font-bold text-white">{company?.merchant_name?.slice(0, 2).toUpperCase() || 'PK'}</span><div><p className="font-bold text-[#03458C]">{company?.merchant_name}</p><p className="text-[#536B82]">{company?.address}</p></div></div>
        <div className="sm:border-l sm:border-[#D8E5EE] sm:pl-4"><p className="font-bold text-[#03458C]">{values.position}</p><p className="text-[#536B82]">{values.department}</p></div>
        <div className="sm:border-l sm:border-[#D8E5EE] sm:pl-4"><p className="font-bold text-[#03458C]">Periode bekerja</p><p className="text-[#536B82]">{new Date(`${values.start_date}T00:00:00`).toLocaleDateString('id-ID')} – {new Date(`${values.end_date}T00:00:00`).toLocaleDateString('id-ID')}</p></div>
      </div>

      <h3 className="mt-5 text-xs font-bold text-[#03458C]">Empat kategori yang kamu nilai</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SURVEY_CATEGORIES.map((category, index) => {
          const Icon = icons[index];
          return <div key={category.id} className="rounded-md border border-[#D8E5EE] bg-[#F6F9FC] p-3"><p className="flex items-center gap-1.5 text-[9px] font-semibold text-[#03458C]"><Icon size={12} />{category.title.slice(3)}</p><p className="mt-1 text-xl font-extrabold text-[#03458C]">{formatAverage(averages[category.id])} <span className="text-[10px] font-semibold">/ 5</span></p><p className="text-[9px] text-[#536B82]">Rata-rata dari 4 pernyataan</p></div>;
        })}
      </div>
      <p className="mt-3 text-[9px] text-[#536B82]">Nilai ini merangkum pengalaman kerjamu per kategori dan dapat membantu mahasiswa lain mempertimbangkan tempat kerja.</p>
      <div className="mt-5 text-center"><Link to="/komunitas" className="inline-flex items-center gap-1 rounded-md bg-[#00B4D8] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#0096B4]">Kembali ke Komunitas <Check size={13} /></Link></div>
    </section>
  );
}