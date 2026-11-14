import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Clock3, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function deadlineMessage(job) {
  if (!job.application_deadline) return null;
  const end = new Date(`${job.application_deadline}T23:59:59`);
  const minutes = Math.round((end - new Date()) / 60000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDay = new Date(`${job.application_deadline}T00:00:00`);
  const daysUntilDeadline = Math.round((deadlineDay - today) / 86400000);
  if (minutes > 0 && minutes <= 60) return { key: 'h-1-jam', label: 'akan ditutup dalam kurang dari 1 jam' };
  if (daysUntilDeadline === 1) return { key: 'h-1', label: 'akan ditutup besok' };
  if (daysUntilDeadline === 7) return { key: 'h-7', label: 'akan ditutup dalam 7 hari' };
  return null;
}

export default function Notifikasi() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [read, setRead] = useState(() => JSON.parse(localStorage.getItem('pk_read_notifications') || '[]'));

  useEffect(() => {
    Promise.all([api.get('/v1/jobs'), api.get('/v1/student/applications')])
      .then(([jobsResponse, applicationsResponse]) => {
        setJobs(jobsResponse.data.data || []);
        setApplications(applicationsResponse.data.data || []);
      })
      .catch(() => {});
  }, []);

  const notifications = useMemo(() => {
    const savedIds = JSON.parse(localStorage.getItem('pk_bookmarked_jobs') || '[]').map(Number);
    const appliedIds = applications.map((application) => Number(application.job_post_id || application.job_post?.id));
    const relevant = jobs.filter((job) => savedIds.includes(Number(job.id)) || appliedIds.includes(Number(job.id)));
    return relevant.map((job) => {
      const message = deadlineMessage(job);
      return message ? { id: `${job.id}-${message.key}`, job, message: message.label } : null;
    }).filter(Boolean);
  }, [jobs, applications]);

  const visible = notifications.filter(({ job, message }) => {
    const query = search.trim().toLowerCase();
    return !query || `${job.title} ${job.merchant_profile?.merchant_name || ''} ${message}`.toLowerCase().includes(query);
  });

  const markRead = (id) => {
    const next = [...new Set([...read, id])];
    setRead(next);
    localStorage.setItem('pk_read_notifications', JSON.stringify(next));
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-pk-primary">Pusat informasi</p><h1 className="mt-1 text-2xl font-bold text-pk-navy">Notifikasi</h1><p className="mt-1 text-xs text-pk-muted">Pengingat lowongan tersimpan dan lamaranmu.</p></div><Link to="/lowongan" className="rounded-lg border border-pk-border bg-white px-3 py-2 text-xs font-bold text-pk-navy">Cari lowongan</Link></div>
      <label className="relative mt-5 block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-pk-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari riwayat notifikasi..." className="w-full rounded-xl border border-pk-border bg-white py-2.5 pl-10 pr-3 text-xs outline-none focus:border-pk-cyan" /></label>
      {visible.length === 0 && <div className="mt-5 rounded-2xl border border-pk-border bg-white p-10 text-center text-xs text-pk-muted"><Bell className="mx-auto h-8 w-8 text-pk-cyan" /><p className="mt-3 font-semibold text-pk-navy">{notifications.length ? 'Tidak ada notifikasi yang sesuai.' : 'Belum ada notifikasi tenggat.'}</p></div>}
      <div className="mt-5 space-y-3">{visible.map(({ id, job, message }) => { const isRead = read.includes(id); return <button key={id} type="button" onClick={() => { markRead(id); navigate(`/lowongan/${job.id}`); }} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left hover:border-pk-cyan ${isRead ? 'border-pk-border bg-white' : 'border-pk-cyan bg-[#F0FBFD]'}`}><span className="rounded-xl bg-pk-soft p-2 text-pk-primary"><Bell className="h-4 w-4" /></span><span className="flex-1"><span className="flex items-center justify-between gap-2"><strong className="text-sm text-pk-navy">Tenggat lowongan hampir habis</strong>{!isRead && <span className="rounded-full bg-pk-gold px-2 py-0.5 text-[9px] font-bold text-pk-navy">Baru</span>}</span><span className="mt-1 block text-xs text-pk-muted">{job.title} {message}.</span><span className="mt-2 flex items-center gap-1 text-[10px] text-pk-muted"><Clock3 className="h-3 w-3" />{job.application_deadline}{isRead && <><Check className="ml-2 h-3 w-3 text-emerald-600" />Sudah dibaca</>}</span></span></button>; })}</div>
    </div>
  );
}
