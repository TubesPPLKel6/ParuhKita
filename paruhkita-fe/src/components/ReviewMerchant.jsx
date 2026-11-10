import React, { useEffect, useState } from 'react';
import { AlertCircle, MessageSquareQuote, Star } from 'lucide-react';
import api from '../api/axios';
import { SURVEY_CATEGORIES } from './survei/surveyData';

const categoryLabels = [
  ['wage', 'Upah'],
  ['hours', 'Jam Kerja'],
  ['safety', 'Keamanan'],
  ['tasks', 'Kejelasan Tugas'],
];

function Score({ value, large = false }) {
  return <span className={`inline-flex items-center gap-1 font-bold text-[#03458C] ${large ? 'text-lg' : 'text-xs'}`}>
    <Star size={large ? 15 : 12} className="fill-[#FBB02D] text-[#FBB02D]" />
    {value == null ? 'Belum ada nilai' : `${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/5`}
  </span>;
}

export default function ReviewMerchant({ jobPostId, merchantId }) {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!jobPostId || !merchantId) {
      setLoading(false);
      setErrorMessage('Informasi tempat kerja belum tersedia.');
      return undefined;
    }

    let active = true;
    setLoading(true);
    setErrorMessage('');
    api.get(`/v1/job-posts/${jobPostId}/merchant-reviews`)
      .then(({ data }) => {
        if (!active) return;
        if (String(data.data?.merchant?.id) !== String(merchantId)) {
          setErrorMessage('Ulasan tempat kerja tidak cocok dengan lowongan ini.');
          return;
        }
        setReviewData(data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Ulasan tempat kerja gagal dimuat.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [jobPostId, merchantId]);

  return (
    <section className="rounded-lg border border-[#D8E5EE] bg-white p-5 sm:p-6" aria-labelledby="merchant-reviews-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="merchant-reviews-heading" className="text-base font-bold text-[#03045E]">Ulasan Tempat Kerja</h2>
          <p className="mt-1 text-[11px] text-[#536B82]">Pengalaman mahasiswa yang pernah bekerja di {reviewData?.merchant?.merchant_name || 'tempat ini'}.</p>
        </div>
        {!loading && reviewData?.survey_count > 0 && <div className="text-right"><Score value={reviewData.averages?.overall} large /><p className="text-[9px] text-[#536B82]">{reviewData.survey_count} survei mahasiswa</p></div>}
      </div>

      {loading && <div role="status" className="mt-4 rounded-md bg-[#F6F9FC] p-4 text-xs text-[#536B82]">Memuat ulasan tempat kerja...</div>}
      {!loading && errorMessage && <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={14} />{errorMessage}</div>}
      {!loading && !errorMessage && reviewData?.survey_count === 0 && <div className="mt-4 rounded-md border border-dashed border-[#D8E5EE] bg-[#F6F9FC] p-5 text-center"><MessageSquareQuote size={20} className="mx-auto text-[#00A9CE]" /><p className="mt-2 text-xs font-semibold text-[#03458C]">Belum ada ulasan</p><p className="mt-1 text-[10px] text-[#536B82]">Belum ada mahasiswa yang mengirimkan survei untuk tempat kerja ini.</p></div>}
      {!loading && !errorMessage && reviewData?.survey_count > 0 && <>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {categoryLabels.map(([key, label]) => {
            const score = reviewData.averages?.[key];
            return <div key={key} className="rounded-md border border-[#D8E5EE] bg-[#F6F9FC] p-3"><p className="text-[9px] text-[#536B82]">{label}</p><p className="mt-1 text-sm font-extrabold text-[#03458C]">{score == null ? '—' : Number(score).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}<span className="text-[9px] font-medium"> / 5</span></p></div>;
          })}
        </div>
        <div className="mt-4 space-y-3">
          {(reviewData.reviews || []).map((review) => <article key={review.id} className="rounded-md border border-[#D8E5EE] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-xs font-bold text-[#102C4D]">{review.position}</h3><p className="mt-0.5 text-[10px] text-[#536B82]">{review.department} · {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div><Score value={review.overall_average} /></div>
            {review.comments && <p className="mt-3 border-l-2 border-[#00B4D8] pl-3 text-xs leading-5 text-[#536B82]">“{review.comments}”</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">{categoryLabels.map(([key, label]) => <span key={key} className="text-[9px] text-[#536B82]">{label}: <b className="text-[#03458C]">{review.ratings?.[key] == null ? '—' : `${Number(review.ratings[key]).toLocaleString('id-ID', { maximumFractionDigits: 2 })}/5`}</b></span>)}</div>
            <details className="mt-3 border-t border-[#E7EEF3] pt-2">
              <summary className="cursor-pointer text-[10px] font-semibold text-[#03458C]">Lihat rincian penilaian</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SURVEY_CATEGORIES.map((category) => <div key={category.id} className="rounded-md bg-[#F6F9FC] p-2.5"><h4 className="text-[9px] font-bold text-[#03458C]">{category.title}</h4><div className="mt-1 space-y-1">{category.questions.map((question, index) => <div key={question} className="flex justify-between gap-2 text-[9px]"><span className="text-[#536B82]">{question}</span><b className="shrink-0 text-[#03458C]">{review.question_scores?.[category.id]?.[index] ?? '—'}/5</b></div>)}</div></div>)}
              </div>
            </details>
          </article>)}
        </div>
      </>}
    </section>
  );
}