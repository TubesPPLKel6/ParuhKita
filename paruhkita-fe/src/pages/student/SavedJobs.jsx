import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pk_bookmarked_jobs') || '[]').map(Number);
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    api.get('/v1/jobs')
      .then(({ data }) => setJobs(data.data || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Tidak dapat memuat lowongan tersimpan.'));
  }, []);

  const savedJobs = useMemo(() => jobs.filter((job) => {
    const query = search.trim().toLowerCase();
    return savedIds.includes(Number(job.id))
      && (!query || `${job.title} ${job.merchant_profile?.merchant_name || ''} ${job.location || ''}`.toLowerCase().includes(query));
  }), [jobs, savedIds, search]);

  const remove = (id) => {
    const next = savedIds.filter((savedId) => savedId !== Number(id));
    setSavedIds(next);
    localStorage.setItem('pk_bookmarked_jobs', JSON.stringify(next));
    window.dispatchEvent(new Event('pk-bookmarks-changed'));
  };

  const toggleSelected = (id) => {
    const numericId = Number(id);
    if (selectedIds.includes(numericId)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== numericId));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, numericId]);
    }
  };

  const selectedJobs = savedJobs.filter((job) => selectedIds.includes(Number(job.id)));

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pk-primary">Koleksi pribadi</p>
          <h1 className="mt-1 text-2xl font-bold text-pk-navy">Lowongan tersimpan</h1>
          <p className="mt-1 text-xs text-pk-muted">Simpan lowongan yang ingin kamu pertimbangkan dan pantau tenggatnya.</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-pk-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari lowongan tersimpan..." className="w-full rounded-xl border border-pk-border bg-white py-2.5 pl-10 pr-3 text-xs outline-none focus:border-pk-cyan" />
        </label>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      {!error && savedJobs.length === 0 && <div className="mt-6 rounded-2xl border border-pk-border bg-white p-10 text-center"><Bookmark className="mx-auto h-8 w-8 text-pk-cyan" /><p className="mt-3 text-sm font-bold text-pk-navy">Belum ada lowongan tersimpan</p><Link to="/lowongan" className="mt-3 inline-block text-xs font-bold text-pk-primary hover:underline">Cari lowongan</Link></div>}
      {savedJobs.length > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pk-border bg-white px-4 py-3"><p className="text-xs text-pk-muted">Pilih maksimal 3 lowongan untuk dibandingkan ({selectedIds.length}/3).</p><button type="button" disabled={selectedIds.length < 2} onClick={() => setShowComparison((current) => !current)} className="rounded-lg bg-pk-primary px-3 py-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{showComparison ? 'Tutup perbandingan' : 'Bandingkan pilihan'}</button></div>}
      {showComparison && selectedJobs.length >= 2 && <div className="mt-4 overflow-x-auto rounded-2xl border border-pk-border bg-white"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-pk-soft text-pk-navy"><tr><th className="px-4 py-3 font-bold">Aspek</th>{selectedJobs.map((job) => <th key={job.id} className="px-4 py-3 font-bold">{job.title}</th>)}</tr></thead><tbody className="divide-y divide-pk-border text-pk-muted">{[['Merchant', (job) => job.merchant_profile?.merchant_name || '-'], ['Upah', (job) => job.wage || '-'], ['Lokasi', (job) => job.location || job.merchant_profile?.address || '-'], ['Durasi', (job) => job.duration || '-'], ['Fleksibilitas', (job) => job.flexibility || job.schedule || '-'], ['Persyaratan', (job) => job.qualifications || '-']].map(([label, value]) => <tr key={label}><th className="px-4 py-3 font-semibold text-pk-navy">{label}</th>{selectedJobs.map((job) => <td key={job.id} className="px-4 py-3 align-top">{value(job)}</td>)}</tr>)}</tbody></table></div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {savedJobs.map((job) => (
          <article key={job.id} className="rounded-2xl border border-pk-border bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={selectedIds.includes(Number(job.id))} onChange={() => toggleSelected(job.id)} disabled={!selectedIds.includes(Number(job.id)) && selectedIds.length >= 3} aria-label={`Pilih ${job.title} untuk perbandingan`} className="mt-1 h-4 w-4 rounded border-pk-border text-pk-primary focus:ring-pk-cyan" /><div><p className="text-[10px] font-bold uppercase text-pk-primary">{job.merchant_profile?.merchant_name || 'Merchant'}</p><h2 className="mt-1 text-base font-bold text-pk-navy">{job.title}</h2><p className="mt-1 text-xs text-pk-muted">{job.location || job.merchant_profile?.address || 'Lokasi tidak dicantumkan'}</p></div></div>
              <button type="button" onClick={() => remove(job.id)} aria-label={`Hapus ${job.title}`} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-pk-border pt-3"><span className="text-[10px] text-pk-muted">Tenggat: {job.application_deadline || 'Tidak ditentukan'}</span><Link to={`/lowongan/${job.id}`} className="rounded-lg bg-pk-primary px-3 py-2 text-[10px] font-bold text-white">Lihat detail</Link></div>
          </article>
        ))}
      </div>
    </div>
  );
}
