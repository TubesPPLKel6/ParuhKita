import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Star
} from 'lucide-react';
import api from '../../api/axios';

const FACILITY_CATEGORIES = {
  dining: 'Makan/minum',
  transportation: 'Transportasi',
  worship: 'Tempat ibadah',
  other: 'Lainnya'
};

function assetUrl(path) {
  if (!path) return null;
  const apiBase = api.defaults.baseURL || '';
  return `${apiBase.replace(/\/api\/?$/, '')}/storage/${path}`;
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PK';
}

function JobCard({ job }) {
  return (
    <article className="flex flex-col rounded-xl border border-[#D8E5EE] bg-[#CAF0F8]/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#03458C]">Paruh waktu</span>
        <span className="text-[10px] font-semibold text-[#536B82]">{job.remaining_quota ?? job.quota} posisi</span>
      </div>
      <h3 className="mt-3 text-sm font-extrabold text-[#03045E]">{job.title}</h3>
      <p className="mt-1 text-[11px] text-[#536B82]">{job.location || job.merchant_profile?.address || 'Lokasi tidak dicantumkan'}</p>
      <p className="mt-3 inline-flex w-fit rounded-md bg-[#03045E] px-2 py-1 text-[10px] font-bold text-white">{job.wage}</p>
      <div className="mt-3 space-y-1.5 text-[10px] text-[#536B82]">
        <p className="flex items-center gap-1.5"><Clock3 size={12} className="text-[#03458C]" />{job.schedule || 'Jadwal dibahas saat proses rekrutmen'}</p>
        {job.application_deadline && <p className="flex items-center gap-1.5"><BriefcaseBusiness size={12} className="text-[#03458C]" />Pendaftaran sampai {new Date(job.application_deadline).toLocaleDateString('id-ID')}</p>}
      </div>
      <Link to={`/lowongan/${job.id}`} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-3 py-2.5 text-xs font-bold text-[#03045E] transition hover:bg-[#D97706]">
        <ArrowRight size={14} /> Lihat Lowongan
      </Link>
    </article>
  );
}

export default function PublicMerchantProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setCompany(null);
    setJobs([]);
    setReview(null);
    setJobsError('');
    setReviewError('');
    api.get(`/v1/companies/${id}`)
      .then(({ data }) => {
        if (active) setCompany(data.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.status === 404
            ? 'Profil merchant tidak ditemukan.'
            : requestError.response?.data?.message || 'Gagal memuat profil merchant.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!company?.id) return undefined;
    let active = true;
    setJobsLoading(true);
    setJobsError('');
    setReviewError('');
    api.get('/v1/jobs')
      .then(({ data }) => {
        if (active) {
          setJobs((data.data || []).filter((job) => String(job.merchant_profile?.id) === String(company.id)));
        }
      })
      .catch((requestError) => {
        if (active) setJobsError(requestError.response?.data?.message || 'Lowongan merchant belum dapat dimuat.');
      })
      .finally(() => {
        if (active) setJobsLoading(false);
      });

    api.get('/v1/student/workplace-survey-reviews', { params: { merchant_ids: [company.id] } })
      .then(({ data }) => {
        if (active) setReview((data.data || [])[0] || null);
      })
      .catch((requestError) => {
        if (active) setReviewError(requestError.response?.data?.message || 'Ringkasan ulasan belum dapat dimuat.');
      });

    return () => {
      active = false;
    };
  }, [company?.id]);

  const facilities = company?.facilities || [];
  const logoUrl = assetUrl(company?.logo_path);
  const bannerUrl = assetUrl(company?.banner_path);
  const overallRating = review?.averages?.overall;

  return (
    <div className="min-h-screen bg-[#F6F9FC] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link to="/lowongan" className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#03458C] hover:underline">
          <ArrowLeft size={14} /> Cari lowongan <span className="text-[#8AA0B4]">/</span> Profil merchant
          {company?.merchant_name && <><span className="text-[#8AA0B4]">/</span>{company.merchant_name}</>}
        </Link>

        {loading && <p role="status" className="mt-8 rounded-xl border border-[#D8E5EE] bg-white p-6 text-sm text-[#536B82]">Memuat profil merchant...</p>}
        {!loading && error && (
          <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        {!loading && company && (
          <>
            <section className="mt-4 overflow-hidden rounded-2xl border border-[#D8E5EE] bg-white">
              <div
                className="relative flex h-36 items-end bg-gradient-to-r from-[#03045E] via-[#03458C] to-[#00B4D8] bg-cover bg-center sm:h-48"
                style={bannerUrl ? { backgroundImage: `linear-gradient(90deg, rgba(3,4,94,.76), rgba(3,4,94,.12)), url("${bannerUrl}")` } : undefined}
              >
                <span className="mb-4 ml-4 inline-flex items-center gap-2 rounded-full bg-[#03045E]/90 px-3 py-1.5 text-[10px] font-bold text-white sm:mb-5 sm:ml-5">
                  <BriefcaseBusiness size={12} /> Ruang untuk bekerja dan berkembang
                </span>
              </div>

              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div className="flex items-center gap-3 sm:gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`Logo ${company.merchant_name}`} className="-mt-10 h-16 w-16 rounded-xl border-4 border-white bg-white object-cover shadow-sm sm:-mt-12 sm:h-20 sm:w-20" />
                  ) : (
                    <div className="-mt-10 grid h-16 w-16 place-items-center rounded-xl border-4 border-white bg-[#03045E] text-sm font-extrabold text-[#00B4D8] shadow-sm sm:-mt-12 sm:h-20 sm:w-20">
                      {initials(company.merchant_name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-extrabold text-[#03045E] sm:text-2xl">{company.merchant_name}</h1>
                      {company.is_verified && <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F8FC] px-2 py-1 text-[9px] font-bold text-[#03458C]"><BadgeCheck size={12} /> Usaha terverifikasi</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-[#03458C]">
                      {company.category && <span className="rounded-full bg-[#F0F7FA] px-2.5 py-1">{company.category}</span>}
                      {company.address && <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F7FA] px-2.5 py-1"><MapPin size={11} />{company.address}</span>}
                    </div>
                    <p className="mt-2 text-[11px] text-[#536B82]">{company.description || 'Kenali lebih dekat tempat kerja dan peluang yang tersedia.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:pl-4">
                  <Star size={16} className="fill-[#FBB02D] text-[#FBB02D]" />
                  <span className="text-sm font-extrabold text-[#03045E]">{overallRating == null ? 'Belum ada ulasan' : `${Number(overallRating).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/5`}</span>
                  {review?.survey_count > 0 && <span className="text-[10px] text-[#536B82]">({review.survey_count} ulasan)</span>}
                </div>
              </div>
            </section>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(240px,.85fr)]">
              <section className="rounded-xl border border-[#D8E5EE] bg-white p-5 sm:p-6">
                <h2 className="text-sm font-bold text-[#03045E]">Tentang Kami</h2>
                <p className="mt-2 whitespace-pre-line text-[11px] leading-5 text-[#536B82]">{company.description || 'Merchant ini belum menambahkan deskripsi usaha.'}</p>
                {facilities.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {facilities.map((facility) => (
                      <span key={facility.id} className="rounded-full border border-[#D8E5EE] bg-[#F6F9FC] px-2.5 py-1 text-[10px] font-semibold text-[#03458C]">
                        {facility.name}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#D8E5EE] bg-white p-5">
                <h2 className="text-sm font-bold text-[#03045E]">Temukan Kami</h2>
                <div className="mt-3 space-y-3 text-[10px] leading-5 text-[#536B82]">
                  {company.address && <p className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0 text-[#03458C]" />{company.address}</p>}
                  {company.phone && <a className="flex items-center gap-2 hover:text-[#03458C]" href={`tel:${company.phone}`}><Phone size={13} className="shrink-0 text-[#03458C]" />{company.phone}</a>}
                  {company.email && <a className="flex items-center gap-2 break-all hover:text-[#03458C]" href={`mailto:${company.email}`}><Mail size={13} className="shrink-0 text-[#03458C]" />{company.email}</a>}
                </div>
              </section>
            </div>

            <section className="mt-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-[#03045E]">Temukan peranmu di {company.merchant_name}</h2>
                  <p className="mt-1 text-[11px] text-[#536B82]">{jobs.length} lowongan aktif</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#03458C]"><Clock3 size={12} /> Pilih jadwal yang cocok</span>
              </div>
              {jobsLoading && <p role="status" className="mt-3 rounded-xl border border-[#D8E5EE] bg-white p-5 text-center text-xs text-[#536B82]">Memuat lowongan aktif...</p>}
              {jobsError && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{jobsError}</p>}
              {!jobsLoading && !jobsError && jobs.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-[#D8E5EE] bg-white p-5 text-center text-xs text-[#536B82]">Belum ada lowongan aktif dari merchant ini.</p>}
              {jobs.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>}
              {reviewError && <p role="status" className="mt-3 text-[10px] text-amber-800">{reviewError}</p>}
            </section>

            {facilities.length > 0 && (
              <section className="mt-6">
                <div className="flex items-end justify-between gap-2">
                  <div><h2 className="text-base font-extrabold text-[#03045E]">Fasilitas tempat kerja</h2><p className="mt-1 text-[11px] text-[#536B82]">Informasi fasilitas dari merchant.</p></div>
                  <span className="text-[10px] text-[#536B82]">{facilities.length} fasilitas</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {facilities.map((facility) => (
                    <article key={facility.id} className="rounded-xl border border-[#D8E5EE] bg-white p-4">
                      <h3 className="text-xs font-bold text-[#03045E]">{facility.name}</h3>
                      <p className="mt-1 text-[10px] font-semibold text-[#03458C]">{FACILITY_CATEGORIES[facility.category] || FACILITY_CATEGORIES.other}</p>
                      {facility.description && <p className="mt-2 text-[10px] leading-5 text-[#536B82]">{facility.description}</p>}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
