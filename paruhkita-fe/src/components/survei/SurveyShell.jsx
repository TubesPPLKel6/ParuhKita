import React from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = ['Pengalaman Kerja', 'Penilaian', 'Review', 'Selesai'];

export default function SurveyShell({ step, title, description, children }) {
  return (
    <div className="min-h-screen bg-[#F6F9FC] pb-10">
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/komunitas" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#023E8A]">
          <ChevronLeft size={14} /> Komunitas / Survei Kelayakan Tempat Kerja
        </Link>

        <section className="mt-3 rounded-lg border border-[#D8E5EE] bg-white p-4 sm:p-5">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#00A9CE]">Dari mahasiswa, untuk mahasiswa · Langkah {Math.min(step, 4)} dari 4</p>
          <h1 className="mt-1 text-xl font-extrabold text-[#03458C] sm:text-2xl">{title}</h1>
          <p className="mt-1 text-[11px] text-[#536B82]">{description}</p>
          <div className="mt-4 grid grid-cols-4 border-t border-[#D8E5EE] pt-3 sm:mt-5 sm:pt-4">
            {steps.map((label, index) => {
              const number = index + 1;
              const completed = number < step || step === 4;
              const active = number === step;
              return (
                <div key={label} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold ${completed ? 'border-[#00B4D8] bg-[#00B4D8] text-white' : active ? 'border-[#00B4D8] bg-[#00B4D8] text-white' : 'border-[#D8E5EE] bg-[#F6F9FC] text-[#536B82]'}`}>
                    {completed ? <Check size={12} /> : number}
                  </span>
                  <span className={`truncate text-[9px] sm:text-[11px] ${active ? 'font-bold text-[#03458C]' : 'text-[#536B82]'}`}>{label}</span>
                  {index < steps.length - 1 && <span className="mr-1 hidden h-px flex-1 bg-[#D8E5EE] sm:block" />}
                </div>
              );
            })}
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}