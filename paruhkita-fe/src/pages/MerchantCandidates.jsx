import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';
import MerchantShell from '../components/merchant/MerchantShell';

const STATUS_LABELS = {
  pending: 'Menunggu Review',
  reviewing: 'Dalam Seleksi',
  interview: 'Wawancara',
  trial: 'Trial Shift',
  accepted: 'Diterima',
  rejected: 'Ditolak',
};

const STATUS_STYLES = {
  pending: 'bg-[#FFF7E6] text-[#B7791F] border-[#FDE7C3]',
  reviewing: 'bg-[#EAF6FB] text-[#0E7FA8] border-[#CBE9F5]',
  interview: 'bg-[#EFEAFE] text-[#6D4AC7] border-[#E0D6FB]',
  trial: 'bg-[#EFEAFE] text-[#6D4AC7] border-[#E0D6FB]',
  accepted: 'bg-[#E9F9F1] text-[#1F9D63] border-[#C9EEDD]',
  rejected: 'bg-[#FFF1F0] text-[#B42318] border-[#FBD5D1]',
};

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Review', statuses: ['pending'] },
  { key: 'reviewing', label: 'Dalam Seleksi', statuses: ['reviewing'] },
  { key: 'interview', label: 'Wawancara', statuses: ['interview', 'trial'] },
  { key: 'accepted', label: 'Diterima', statuses: ['accepted'] },
  { key: 'rejected', label: 'Ditolak', statuses: ['rejected'] },
];

function initialsOf(name) {
  if (!name) return 'NA';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MerchantCandidates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');

  const activeTab = searchParams.get('status') || 'all';

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get('/v1/merchant/jobs'),
      api.get('/v1/merchant/profile').catch(() => null),
    ])
      .then(([jobsResponse, profileResponse]) => {
        if (!active) return;
        setJobs(jobsResponse.data.data || []);
        setProfile(profileResponse?.data?.data || null);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Gagal memuat daftar kandidat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const candidates = useMemo(() => {
    return jobs.flatMap((job) => (job.applications || []).map((application) => ({
      ...application,
      job_title: job.title,
      job_id: job.id,
    }))).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [jobs]);

  const counts = useMemo(() => {
    const result = { all: candidates.length };
    TABS.forEach((tab) => {
      if (tab.key === 'all') return;
      result[tab.key] = candidates.filter((candidate) => tab.statuses.includes(candidate.status)).length;
    });
    return result;
  }, [candidates]);

  const visible = useMemo(() => {
    const tab = TABS.find((item) => item.key === activeTab);
    const query = search.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesTab = !tab?.statuses || tab.statuses.includes(candidate.status);
      const haystack = `${candidate.student?.name || ''} ${candidate.job_title || ''}`.toLowerCase();
      return matchesTab && (!query || haystack.includes(query));
    });
  }, [candidates, activeTab, search]);

  const changeTab = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'all') next.delete('status');
    else next.set('status', key);
    setSearchParams(next, { replace: true });
  };

  const shellCounts = {
    jobs: jobs.length,
    candidates: candidates.length,
    messages: 0,
  };

  return (
    <MerchantShell
      active="Kandidat"
      activeTopNav="Kandidat"
      merchant={{ merchant_name: profile?.merchant_name, address: profile?.address, is_verified: profile?.is_verified }}
      counts={shellCounts}
      showTips={false}
      contentClassName="px-6 py-7 lg:px-10"
    >
      <div className="w-full">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-pk-navy">Kandidat</h1>
            <p className="mt-1.5 text-[12.5px] text-pk-muted">
              Pantau seluruh pelamar dan berikan masukan untuk kandidat yang belum diterima.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => changeTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
                  active
                    ? 'bg-pk-cyan text-white shadow-xs'
                    : 'border border-pk-border bg-white text-pk-muted hover:bg-pk-soft'
                }`}
              >
                {tab.label} ({counts[tab.key] || 0})
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-muted" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kandidat atau posisi..."
              className="h-10 w-full rounded-lg border border-pk-border bg-white pl-9 pr-3 text-[12px] text-pk-body placeholder:text-pk-hint outline-none transition focus:border-pk-cyan"
            />
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <p className="mt-6 rounded-xl border border-pk-border bg-white px-5 py-8 text-[12px] text-pk-muted">
            Memuat daftar kandidat...
          </p>
        ) : visible.length === 0 ? (
          <div className="mt-6 rounded-xl border border-pk-border bg-white px-6 py-12 text-center">
            <p className="text-[13px] font-semibold text-pk-navy">Tidak ada kandidat pada filter ini</p>
            <p className="mt-1 text-[11.5px] text-pk-muted">Coba ubah status atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visible.map((candidate) => (
              <article
                key={candidate.id}
                className="flex flex-col gap-4 rounded-xl border border-pk-border bg-white px-5 py-4 md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                      candidate.id % 2 === 1 ? 'bg-pk-primary' : 'bg-pk-cyan'
                    }`}
                  >
                    {initialsOf(candidate.student?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-pk-navy">{candidate.student?.name}</p>
                    <p className="truncate text-[11px] text-pk-muted">
                      {[candidate.student?.student_profile?.degree_level, candidate.student?.student_profile?.major].filter(Boolean).join(' ')}
                      {candidate.student?.student_profile?.university ? ` · ${candidate.student.student_profile.university}` : ''}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-pk-body">
                      Posisi: {candidate.job_title} · Dilamar {formatDate(candidate.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${STATUS_STYLES[candidate.status] || STATUS_STYLES.pending}`}>
                    {STATUS_LABELS[candidate.status] || candidate.status}
                  </span>

                  {candidate.status === 'rejected' && candidate.feedback_report?.status === 'final' && (
                    <span className="text-[10px] font-medium text-pk-muted">Feedback terkirim</span>
                  )}

                  <Link
                    to={`/merchant/applications/${candidate.id}`}
                    className="rounded-md border border-pk-border bg-white px-3.5 py-2 text-[11px] font-semibold text-pk-navy transition hover:bg-pk-soft"
                  >
                    Lihat Detail
                  </Link>

                  {candidate.status === 'rejected' && (
                    <Link
                      to={`/merchant/applications/${candidate.id}/feedback`}
                      className="rounded-md bg-pk-primary px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-pk-navy"
                    >
                      Beri Masukan
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </MerchantShell>
  );
}
