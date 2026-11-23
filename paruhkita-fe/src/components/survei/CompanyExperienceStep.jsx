import React from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardList, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SURVEY_CATEGORIES } from './surveyData';

const fieldClass = 'mt-1 w-full rounded-md border border-[#D8E5EE] bg-white px-3 py-2.5 text-[11px] text-[#102C4D] outline-none focus:border-[#00B4D8]';

export default function CompanyExperienceStep({ companies, loading, values, onChange, onNext, canContinue }) {
  return (
    <div className="mt-3 grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(230px,0.9fr)]">
      <div className="space-y-3">
        <section className="rounded-lg border border-[#D8E5EE] bg-[#EEF9FC] p-3">
          <div className="flex gap-2 text-[10px] text-[#03458C]"><Info size={14} className="mt-0.5 shrink-0" /><div><p className="font-bold">Sudah pernah bekerja di perusahaan ini?</p><p className="mt-0.5 text-[#536B82]">Survei ditujukan bagi mahasiswa yang telah bekerja di perusahaan terkait. Isi berdasarkan pengalamanmu sendiri.</p></div></div>
        </section>

        <section className="rounded-lg border border-[#D8E5EE] bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#03458C]">Informasi Perusahaan dan Pengalaman Kerja</h2>
          <p className="mt-1 text-[10px] text-[#536B82]">Lengkapi tempat dan periode kamu pernah bekerja. Tanda * wajib diisi.</p>
          <div className="mt-4 space-y-3">
            <label className="block text-[10px] font-semibold text-[#102C4D]">Pilih perusahaan *
              <select value={values.merchant_profile_id} onChange={(event) => onChange('merchant_profile_id', event.target.value)} className={fieldClass} required>
                <option value="">{loading ? 'Memuat perusahaan...' : 'Pilih perusahaan'}</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.merchant_name}{company.address ? ` · ${company.address}` : ''}</option>)}
              </select>
              {!loading && companies.length === 0 && <span className="mt-1 block font-normal text-amber-700">Belum ada perusahaan terverifikasi untuk dipilih.</span>}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[10px] font-semibold text-[#102C4D]">Posisi yang pernah ditempati *
                <input value={values.position} onChange={(event) => onChange('position', event.target.value)} className={fieldClass} placeholder="Contoh: Barista" maxLength={120} />
              </label>
              <label className="block text-[10px] font-semibold text-[#102C4D]">Departemen / bidang *
                <input value={values.department} onChange={(event) => onChange('department', event.target.value)} className={fieldClass} placeholder="Contoh: Operasional Kedai" maxLength={120} />
              </label>
            </div>

            <div className="border-t border-[#E6EDF2] pt-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#03458C]"><CalendarDays size={13} /> Periode bekerja</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-[10px] font-semibold text-[#102C4D]">Tanggal mulai *
                  <input type="date" value={values.start_date} onChange={(event) => onChange('start_date', event.target.value)} max={values.end_date || undefined} className={fieldClass} />
                </label>
                <label className="block text-[10px] font-semibold text-[#102C4D]">Tanggal selesai *
                  <input type="date" value={values.end_date} onChange={(event) => onChange('end_date', event.target.value)} min={values.start_date || undefined} max={new Date().toISOString().slice(0, 10)} className={fieldClass} />
                </label>
              </div>
              <p className="mt-1 text-[9px] text-[#536B82]">Gunakan periode saat kamu benar-benar bekerja di perusahaan tersebut.</p>
            </div>

            <label className="flex items-start gap-2 border-t border-[#E6EDF2] pt-3 text-[10px] leading-4 text-[#102C4D]">
              <input type="checkbox" checked={values.confirmed} onChange={(event) => onChange('confirmed', event.target.checked)} className="mt-0.5 accent-[#00A9CE]" />
              <span>Saya pernah bekerja di perusahaan yang saya pilih dan memberikan penilaian berdasarkan pengalaman nyata saya.</span>
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/komunitas" className="inline-flex items-center gap-1 rounded-md border border-[#D8E5EE] bg-white px-3 py-2 text-[10px] font-bold text-[#03458C]"><ArrowLeft size={13} /> Kembali ke Komunitas</Link>
          <button type="button" onClick={onNext} disabled={!canContinue} className="inline-flex items-center gap-1 rounded-md bg-[#00B4D8] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#0096B4] disabled:cursor-not-allowed disabled:opacity-50">Lanjutkan <ArrowRight size={13} /></button>
        </div>
      </div>

      <aside className="space-y-3">
        <section className="rounded-lg border border-[#D8E5EE] bg-white p-4">
          <h2 className="flex items-center gap-2 text-xs font-bold text-[#03458C]"><ClipboardList size={14} /> Yang akan kamu nilai</h2>
          <p className="mt-2 text-[10px] leading-4 text-[#536B82]">Ada 16 pernyataan dalam empat kategori. Pilih skala 1–5 sesuai pengalamanmu.</p>
          <div className="mt-3 space-y-2">{SURVEY_CATEGORIES.map((category) => <div key={category.id} className="flex justify-between gap-3 text-[10px]"><span className="text-[#102C4D]">{category.title.slice(3)}</span><span className="shrink-0 text-[#536B82]">4 pernyataan</span></div>)}</div>
        </section>
        <section className="px-3 py-2"><h3 className="text-[10px] font-bold text-[#03458C]">Pengalamanmu berarti</h3><p className="mt-1 text-[9px] leading-4 text-[#536B82]">Beri jawaban jujur dan objektif. Survei membantu mahasiswa lain memilih tempat kerja.</p></section>
      </aside>
    </div>
  );
}