import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, MapPin, Plus, Search, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import MerchantShell from '../components/merchant/MerchantShell';
import JadwalCalendar, { parseDate, startOfWeek, toISO } from '../components/jadwal/JadwalCalendar';
import JadwalModal from '../components/jadwal/JadwalModal';
import PenilaianSeleksi from '../components/jadwal/PenilaianSeleksi';

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Status: Semua' },
  { value: 'terjadwal', label: 'Status: Terjadwal' },
  { value: 'dikonfirmasi', label: 'Status: Dikonfirmasi' },
  { value: 'selesai', label: 'Status: Selesai' },
  { value: 'dibatalkan', label: 'Status: Dibatalkan' },
];

function candidateMeta(candidate) {
  return [candidate?.university, candidate?.degree_level, candidate?.major].filter(Boolean).join(' · ');
}

export default function MerchantJadwal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [weekStart, setWeekStart] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = useState('minggu');
  const [tab, setTab] = useState('semua');
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [modal, setModal] = useState({ open: false, mode: 'create', schedule: null, defaultDate: '' });
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationSaving, setEvaluationSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const weekInitialized = useRef(false);
  const evaluationRef = useRef(null);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const params = {};
        if (weekStart) params.week_start = toISO(weekStart);
        if (jobFilter) params.job_post_id = jobFilter;
        if (statusFilter && statusFilter !== 'semua') params.status = statusFilter;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (tab === 'wawancara') params.type = 'wawancara';

        const response = await api.get('/v1/merchant/schedules', { params });
        if (cancelled) return;

        const payload = response.data.data;
        setData(payload);

        if (!weekInitialized.current) {
          weekInitialized.current = true;
          const anchor = payload.upcoming?.[0]?.scheduled_date
            ? parseDate(payload.upcoming[0].scheduled_date)
            : new Date();
          setWeekStart(startOfWeek(anchor));
          setMonthCursor(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
        }
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.response?.data?.message || 'Gagal memuat jadwal. Periksa koneksi backend.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [weekStart, jobFilter, statusFilter, debouncedSearch, tab, refreshKey]);

  const loadCandidates = async () => {
    if (candidates.length > 0) return;
    setCandidatesLoading(true);
    try {
      const response = await api.get('/v1/merchant/schedules/candidates');
      setCandidates(response.data.data.candidates || []);
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Gagal memuat daftar kandidat.' });
    } finally {
      setCandidatesLoading(false);
    }
  };

  const openCreate = (date = '') => {
    loadCandidates();
    setModal({ open: true, mode: 'create', schedule: null, defaultDate: date });
  };

  const openEdit = (schedule) => {
    loadCandidates();
    setModal({ open: true, mode: 'edit', schedule, defaultDate: '' });
  };

  const submitSchedule = async (payload) => {
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        const response = await api.put(`/v1/merchant/schedules/${modal.schedule.id}`, payload);
        setToast({ type: 'success', message: response.data.message });
      } else {
        const response = await api.post('/v1/merchant/schedules', payload);
        setToast({ type: 'success', message: response.data.message });
      }
      setModal({ open: false, mode: 'create', schedule: null, defaultDate: '' });
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const openEvaluation = async (schedule) => {
    setSelectedSchedule(schedule);
    setEvaluation(null);
    setEvaluationLoading(true);

    try {
      const response = await api.get(`/v1/merchant/schedules/${schedule.id}/evaluation`);
      setSelectedSchedule(response.data.data.schedule);
      setEvaluation(response.data.data.evaluation);
      setCriteria(response.data.data.criteria || []);

      setTimeout(() => {
        evaluationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (error) {
      setToast({ type: 'error', message: error?.response?.data?.message || 'Gagal memuat formulir penilaian.' });
    } finally {
      setEvaluationLoading(false);
    }
  };

  const saveEvaluation = async (payload) => {
    if (!selectedSchedule) return;
    setEvaluationSaving(true);
    try {
      const response = await api.post(`/v1/merchant/schedules/${selectedSchedule.id}/evaluation`, payload);
      setEvaluation(response.data.data.evaluation);
      setSelectedSchedule(response.data.data.schedule);
      setToast({ type: 'success', message: response.data.message });
      refresh();
    } finally {
      setEvaluationSaving(false);
    }
  };

  const schedules = data?.schedules || [];
  const upcoming = data?.upcoming || [];
  const counts = data?.counts || { all: 0, wawancara: 0, upcoming: 0 };
  const jobPosts = data?.job_posts || [];
  const merchant = data?.merchant;
  const today = data?.today || toISO(new Date());

  const shellCounts = {
    jobs: merchant?.job_count || 0,
    candidates: merchant?.candidate_count || 0,
    messages: 0,
  };

  return (
    <MerchantShell active="Jadwal" merchant={merchant} counts={shellCounts}>
      <div className="mx-auto max-w-[1120px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[27px] font-extrabold leading-tight tracking-tight text-pk-navy">
              Jadwal Seleksi &amp; Penilaian Kandidat
            </h1>
            <p className="mt-1 text-[12.5px] text-pk-muted">
              Atur jadwal wawancara dan berikan feedback terstruktur untuk setiap kandidat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-pk-cyan px-5 py-3 text-[12.5px] font-bold text-white shadow-xs transition hover:bg-[#0096b8]"
          >
            <Plus className="h-4 w-4" />
            Buat Jadwal Baru
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTab('semua')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
              tab === 'semua'
                ? 'bg-pk-cyan text-white shadow-xs'
                : 'border border-pk-border bg-white text-pk-muted hover:bg-pk-soft'
            }`}
          >
            Semua Jadwal ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setTab('wawancara')}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
              tab === 'wawancara'
                ? 'bg-pk-cyan text-white shadow-xs'
                : 'border border-pk-border bg-white text-pk-muted hover:bg-pk-soft'
            }`}
          >
            Wawancara ({counts.wawancara})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              className="h-9 appearance-none rounded-lg border border-pk-border bg-white pl-3 pr-9 text-[12px] text-pk-body outline-none transition focus:border-pk-cyan"
            >
              <option value="">Lowongan: Semua Posisi</option>
              {jobPosts.map((job) => (
                <option key={job.id} value={job.id}>
                  Lowongan: {job.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-muted" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 appearance-none rounded-lg border border-pk-border bg-white pl-3 pr-9 text-[12px] text-pk-body outline-none transition focus:border-pk-cyan"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-muted" />
          </div>

          <div className="relative w-full sm:w-[300px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-muted" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kandidat..."
              className="h-9 w-full rounded-lg border border-pk-border bg-white pl-9 pr-3 text-[12px] text-pk-body placeholder:text-pk-hint outline-none transition focus:border-pk-cyan"
            />
          </div>
        </div>

        {loadError && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
            {loadError}
          </p>
        )}

        <div className={loading ? 'pointer-events-none opacity-60 transition' : 'transition'}>
          <JadwalCalendar
            weekStart={weekStart || startOfWeek(new Date())}
            monthCursor={monthCursor}
            schedules={schedules}
            view={view}
            today={today}
            onChangeWeek={(next) => setWeekStart(next)}
            onChangeMonth={(next) => setMonthCursor(next)}
            onToday={() => {
              const now = new Date();
              setWeekStart(startOfWeek(now));
              setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
            onChangeView={setView}
            onSelectSchedule={openEdit}
            onCreate={openCreate}
          />
        </div>

        <section className="rounded-xl border border-pk-border bg-white">
          <div className="flex items-center justify-between border-b border-pk-line px-6 py-4">
            <h2 className="text-[15px] font-bold text-pk-navy">Jadwal Mendatang</h2>
            <span className="text-[11px] text-pk-hint">{upcoming.length} jadwal terdekat</span>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-pk-border" />
              <p className="mt-2 text-[12px] font-semibold text-pk-navy">Belum ada jadwal mendatang</p>
              <p className="mt-1 text-[11px] text-pk-muted">Buat jadwal wawancara untuk kandidat pilihanmu.</p>
              <button
                type="button"
                onClick={() => openCreate()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pk-cyan px-4 py-2 text-[11.5px] font-bold text-white transition hover:bg-[#0096b8]"
              >
                <Plus className="h-3.5 w-3.5" /> Buat Jadwal Baru
              </button>
            </div>
          ) : (
            upcoming.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-col gap-4 border-b border-pk-line px-6 py-5 last:border-b-0 md:flex-row md:items-start"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${
                    schedule.id % 2 === 1 ? 'bg-pk-primary' : 'bg-pk-cyan'
                  }`}
                >
                  {schedule.candidate?.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded bg-pk-pastel px-2 py-0.5 text-[10px] font-semibold text-pk-primary">
                    {schedule.type_label}
                  </span>
                  <p className="mt-1.5 text-[12px] text-pk-navy">
                    <span className="font-bold">{schedule.candidate?.name}</span>
                    {candidateMeta(schedule.candidate) && (
                      <span className="text-pk-muted"> · {candidateMeta(schedule.candidate)}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-pk-body">Posisi: {schedule.job?.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-pk-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {schedule.date_label} · {schedule.start_time} – {schedule.end_time} WIB
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-pk-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {schedule.location}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                  {schedule.status === 'dikonfirmasi' && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-pk-cyan">
                      Dikonfirmasi <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEvaluation(schedule)}
                      className="rounded-lg bg-pk-cyan px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#0096b8]"
                    >
                      Mulai Penilaian
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(schedule)}
                      className="rounded-lg border border-pk-border bg-white px-4 py-2 text-[11px] font-semibold text-pk-body transition hover:bg-pk-soft"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {evaluationLoading && (
          <p className="rounded-xl border border-pk-border bg-white p-4 text-[12px] text-pk-muted">
            Memuat formulir penilaian...
          </p>
        )}

        {selectedSchedule && !evaluationLoading && (
          <div ref={evaluationRef}>
            <PenilaianSeleksi
              schedule={selectedSchedule}
              criteria={criteria}
              evaluation={evaluation}
              onSave={saveEvaluation}
              saving={evaluationSaving}
            />
          </div>
        )}
      </div>

      <JadwalModal
        open={modal.open}
        mode={modal.mode}
        schedule={modal.schedule}
        defaultDate={modal.defaultDate}
        candidates={candidatesLoading ? [] : candidates}
        onClose={() => setModal({ open: false, mode: 'create', schedule: null, defaultDate: '' })}
        onSubmit={submitSchedule}
        saving={saving}
      />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[60] rounded-lg px-5 py-3 text-[12px] font-semibold shadow-lg ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-pk-navy text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </MerchantShell>
  );
}
