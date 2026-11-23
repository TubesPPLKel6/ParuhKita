import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import CompanyExperienceStep from '../../components/survei/CompanyExperienceStep';
import RatingStep from '../../components/survei/RatingStep';
import ReviewStep from '../../components/survei/ReviewStep';
import SuccessStep from '../../components/survei/SuccessStep';
import SurveyShell from '../../components/survei/SurveyShell';
import { categoryAverage, SURVEY_CATEGORIES } from '../../components/survei/surveyData';

const initialValues = { merchant_profile_id: '', position: '', department: '', start_date: '', end_date: '', confirmed: false };
const initialRatings = Object.fromEntries(SURVEY_CATEGORIES.map((category) => [category.id, [null, null, null, null]]));

const stepCopy = {
  1: ['Survei Kelayakan Tempat Kerja', 'Bantu mahasiswa lain mempertimbangkan tempat kerja melalui pengalaman kerja nyata yang kamu bagikan.'],
  2: ['Formulir Survei Kelayakan Tempat Kerja', 'Nilai setiap pernyataan sesuai pengalamanmu selama bekerja. Semua 16 pernyataan wajib diisi.'],
  3: ['Review Jawaban Survei', 'Cek kembali informasi pengalaman kerja dan seluruh jawabanmu sebelum survei dikirim.'],
  4: ['Survei Berhasil Dikirim', 'Terima kasih atas kontribusimu untuk komunitas mahasiswa ParuhKita.'],
};

export default function SurveiKelayakan() {
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [values, setValues] = useState(initialValues);
  const [ratings, setRatings] = useState(initialRatings);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/v1/student/workplace-surveys/companies')
      .then(({ data }) => { if (active) setCompanies(data.data || []); })
      .catch((error) => { if (active) setErrorMessage(error.response?.data?.message || 'Tidak dapat memuat daftar perusahaan.'); })
      .finally(() => { if (active) setCompaniesLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedCompany = companies.find((company) => String(company.id) === String(values.merchant_profile_id));
  const canContinueCompany = Boolean(values.merchant_profile_id && values.position.trim() && values.department.trim() && values.start_date && values.end_date && values.end_date >= values.start_date && values.end_date <= new Date().toISOString().slice(0, 10) && values.confirmed);
  const canContinueRatings = SURVEY_CATEGORIES.every((category) => ratings[category.id].length === 4 && ratings[category.id].every((score) => Number.isInteger(score) && score >= 1 && score <= 5));
  const averages = useMemo(() => Object.fromEntries(SURVEY_CATEGORIES.map((category) => [category.id, categoryAverage(ratings, category.id)])), [ratings]);

  const changeValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrorMessage('');
  };

  const setScore = (categoryId, questionIndex, score) => {
    setRatings((current) => ({
      ...current,
      [categoryId]: current[categoryId].map((currentScore, index) => index === questionIndex ? score : currentScore),
    }));
  };

  const submitSurvey = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const { data } = await api.post('/v1/student/workplace-surveys', {
        merchant_profile_id: Number(values.merchant_profile_id),
        position: values.position.trim(),
        department: values.department.trim(),
        start_date: values.start_date,
        end_date: values.end_date,
        confirmed: values.confirmed,
        ratings,
        comments: comments.trim() || null,
      });
      setSubmittedAt(data.data?.created_at || new Date().toISOString());
      setStep(4);
    } catch (error) {
      const validationMessage = error.response?.data?.errors && Object.values(error.response.data.errors)[0]?.[0];
      setErrorMessage(validationMessage || error.response?.data?.message || 'Survei belum dapat dikirim. Coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const [title, description] = stepCopy[step];

  return (
    <SurveyShell step={step} title={title} description={description}>
      {errorMessage && <p role="alert" className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-700">{errorMessage}</p>}
      {step === 1 && <CompanyExperienceStep companies={companies} loading={companiesLoading} values={values} onChange={changeValue} canContinue={canContinueCompany} onNext={() => { setErrorMessage(''); setStep(2); }} />}
      {step === 2 && <RatingStep company={selectedCompany} values={values} ratings={ratings} comments={comments} setScore={setScore} setComments={setComments} canContinue={canContinueRatings} onBack={() => setStep(1)} onNext={() => { setErrorMessage(''); setStep(3); }} />}
      {step === 3 && <ReviewStep company={selectedCompany} values={values} ratings={ratings} comments={comments} averages={averages} submitting={submitting} onEdit={() => { setErrorMessage(''); setStep(2); }} onSubmit={submitSurvey} />}
      {step === 4 && <SuccessStep company={selectedCompany} values={values} averages={averages} submittedAt={submittedAt} />}
    </SurveyShell>
  );
}
