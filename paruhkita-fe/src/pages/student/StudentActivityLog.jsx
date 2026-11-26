import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Calendar, ChevronDown, ChevronLeft, ChevronRight, History, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getRealtimeClient } from '../../api/realtime';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function ActionBadge({ type }) {
  const cfg = {
    create: { bg: '#DCFCE7', text: '#15803D', label: 'Create' },
    update: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Update' },
    delete: { bg: '#FEE2E2', text: '#B91C1C', label: 'Delete' },
  };
  const c = cfg[type?.toLowerCase()] || { bg: '#F1F5F9', text: '#64748B', label: type };
  return (
    <span
      style={{ background: c.bg, color: c.text }}
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
    >
      {c.label}
    </span>
  );
}

function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page, last_page, total, from, to } = meta;

  const pages = [];
  if (last_page <= 7) {
    for (let i = 1; i <= last_page; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current_page > 3) pages.push('...');
    for (let i = Math.max(2, current_page - 1); i <= Math.min(last_page - 1, current_page + 1); i++) pages.push(i);
    if (current_page < last_page - 2) pages.push('...');
    pages.push(last_page);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
      <span className="text-xs text-[#64748B]">
        Menampilkan {from}–{to} dari {total} aktivitas
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] disabled:opacity-40 hover:bg-[#F1F5F9] transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-sm text-[#64748B]">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                p === current_page
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] disabled:opacity-40 hover:bg-[#F1F5F9] transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentActivityLog() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateOpen, setDateOpen] = useState(false);
  const datePopoverRef = useRef(null);
  const [page, setPage] = useState(1);
  const echoRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePopoverRef.current && !datePopoverRef.current.contains(e.target)) {
        setDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLogs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/v1/activity-logs', {
        params: {
          search: params.search ?? search,
          action_type: params.actionType ?? actionType,
          start_date: params.startDate ?? startDate,
          end_date: params.endDate ?? endDate,
          page: params.page ?? page,
        },
      });
      if (data.status) {
        setLogs(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, actionType, startDate, endDate, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time WebSocket subscription
  useEffect(() => {
    if (!token || !user?.id) return;
    const echo = getRealtimeClient(token);
    if (!echo) return;
    echoRef.current = echo;

    const channel = echo.private(`activity-logs.${user.id}`);
    channelRef.current = channel;

    channel.listen('.activity-log.created', (event) => {
      // Check active filters
      if (actionType && event.action_type !== actionType) return;
      if (search && !event.description?.toLowerCase().includes(search.toLowerCase())) return;
      const eventDate = event.created_at ? new Date(event.created_at).toISOString().slice(0, 10) : '';
      if (startDate && eventDate < startDate) return;
      if (endDate && eventDate > endDate) return;

      setPage((currentPage) => {
        if (currentPage !== 1) return currentPage;

        setLogs((prev) => [event, ...prev.slice(0, 9)]);
        setMeta((prev) => prev ? { ...prev, total: prev.total + 1, to: Math.min((prev.to || 0) + 1, 10) } : prev);
        return currentPage;
      });
    });

    return () => {
      channel.stopListening('.activity-log.created');
    };
  }, [token, user?.id, actionType, search, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs({ page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    if (key === 'actionType') setActionType(value);
    if (key === 'startDate') setStartDate(value);
    if (key === 'endDate') setEndDate(value);
    fetchLogs({ page: 1, [key]: value, actionType: key === 'actionType' ? value : actionType });
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchLogs({ page: p });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A2540]">Log Aktivitas Saya</h1>
        </div>

        {/* ── Filter Card ── */}
        <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white px-5 py-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_220px]">
            {/* Search */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#64748B]">Pencarian</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari aktivitas saya..."
                  className="h-[42px] w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-3 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20"
                />
              </div>
            </div>

            {/* Action Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#64748B]">Jenis Aktivitas</label>
              <div className="relative">
                <select
                  value={actionType}
                  onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  className="h-[42px] w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white pl-3.5 pr-9 text-sm text-[#1E293B] focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20"
                >
                  <option value="">Semua Aktivitas</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              </div>
            </div>

            {/* Date range */}
            <div className="relative" ref={datePopoverRef}>
              <label className="mb-1.5 block text-xs font-medium text-[#64748B]">Filter Tanggal</label>
              <button
                type="button"
                onClick={() => setDateOpen((prev) => !prev)}
                className="flex h-[42px] w-full items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-left text-sm transition hover:border-[#CBD5E1] focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20"
              >
                <Calendar className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                <span className={`flex-1 truncate ${startDate || endDate ? 'text-[#1E293B]' : 'text-[#64748B]'}`}>
                  {startDate && endDate
                    ? `${formatDate(startDate)} – ${formatDate(endDate)}`
                    : startDate
                    ? `Dari ${formatDate(startDate)}`
                    : endDate
                    ? `Sampai ${formatDate(endDate)}`
                    : 'Pilih rentang tanggal'}
                </span>
                {(startDate || endDate) && (
                  <X
                    className="h-3.5 w-3.5 shrink-0 text-[#94A3B8] hover:text-[#475569]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                      fetchLogs({ page: 1, startDate: '', endDate: '' });
                    }}
                  />
                )}
              </button>

              {dateOpen && (
                <div className="absolute right-0 top-[74px] z-30 w-72 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#64748B]">Dari Tanggal</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5 text-sm text-[#1E293B] focus:border-[#0EA5E9] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#64748B]">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] px-2.5 text-sm text-[#1E293B] focus:border-[#0EA5E9] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setPage(1);
                          fetchLogs({ page: 1, startDate: '', endDate: '' });
                          setDateOpen(false);
                        }}
                        className="text-xs font-semibold text-[#64748B] hover:text-[#1E293B]"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateOpen(false)}
                        className="rounded-lg bg-[#0EA5E9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0284C7]"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[140px_160px_1fr] border-b border-[#E2E8F0] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Waktu</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Jenis Aktivitas</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Keterangan Aktivitas</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0EA5E9] border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="mb-3 h-10 w-10 text-[#CBD5E1]" />
              <p className="text-sm font-semibold text-[#1E293B]">Belum ada aktivitas</p>
              <p className="mt-1 text-xs text-[#64748B]">Aktivitas Anda akan muncul di sini secara otomatis.</p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={log.id}
                className={`grid grid-cols-[140px_160px_1fr] items-center px-4 py-3.5 ${
                  idx < logs.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                } hover:bg-[#F8FAFC] transition`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{formatDate(log.created_at)}</p>
                  <p className="text-xs text-[#64748B]">{formatTime(log.created_at)}</p>
                </div>
                <div>
                  <ActionBadge type={log.action_type} />
                </div>
                <div className="text-sm text-[#334155]">{log.description}</div>
              </div>
            ))
          )}

          <Pagination meta={meta} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  );
}
