import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArrowLeft, Check, CheckCheck, ChevronDown, ChevronUp, Download, FileText, Image, MessageCircle, MessageSquareText, MoreHorizontal, Paperclip, Plus, Search, Send, Trash2, Undo2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getRealtimeClient } from '../api/realtime';
import MerchantShell from '../components/merchant/MerchantShell';
import StudentShell from '../components/student/StudentShell';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'archived', label: 'Diarsipkan' },
];

const STUDENT_QUICK_REPLIES = [
  'Terima kasih atas informasinya!',
  'Baik, saya siap mengikuti proses selanjutnya.',
  'Boleh diinformasikan jadwal selanjutnya?',
];

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PK';
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatListTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatTime(value);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function shortMessage(message) {
  if (!message) return 'Mulai percakapan terkait lamaran ini.';
  return message.body || message.attachment_name || 'Lampiran';
}

function resolveTemplateVariables(body, conversation) {
  if (!body || !conversation) return body || '';
  const applicantName = conversation.other_user?.name || '';
  const jobTitle = conversation.job_title || '';
  const merchantName = conversation.merchant_name || '';

  return body
    .replace(/\{\s*nama[_\s]+pelamar\s*\}/gi, applicantName)
    .replace(/\{\s*posisi[_\s]+lowongan\s*\}/gi, jobTitle)
    .replace(/\{\s*nama[_\s]+usaha\s*\}/gi, merchantName);
}

function MessagesContent({ isMerchant }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedApplicationId = searchParams.get('applicationId');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const fileInput = useRef(null);
  const messagesContainerRef = useRef(null);
  const templatePopoverRef = useRef(null);
  const draftTextareaRef = useRef(null);
  const selectedConversation = conversations.find((item) => item.id === selectedId);

  const refreshList = useCallback(async (preferredId = null, selectFirst = true) => {
    setLoadingList(true);
    try {
      const response = await api.get('/v1/messages', { params: { filter } });
      const items = response.data.data || [];
      setConversations(items);
      setSelectedId((current) => {
        if (!selectFirst) return null;
        if (preferredId && items.some((item) => item.id === preferredId)) return preferredId;
        if (requestedApplicationId) {
          const requestedConversation = items.find((item) => String(item.application_id) === requestedApplicationId);
          if (requestedConversation) return requestedConversation.id;
        }
        if (current && items.some((item) => item.id === current)) return current;
        return items[0]?.id ?? null;
      });
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal memuat percakapan.');
    } finally {
      setLoadingList(false);
    }
  }, [filter, requestedApplicationId]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const fetchActiveTemplates = useCallback(async () => {
    if (!isMerchant) return;
    setLoadingTemplates(true);
    try {
      const response = await api.get('/v1/merchant/quick-reply-templates/active');
      setActiveTemplates(response.data?.data || []);
    } catch {
      setActiveTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [isMerchant]);

  useEffect(() => {
    fetchActiveTemplates();
  }, [fetchActiveTemplates]);

  useEffect(() => {
    if (!templateOpen) return undefined;
    const handleClickOutside = (event) => {
      if (templatePopoverRef.current && !templatePopoverRef.current.contains(event.target)) {
        setTemplateOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setTemplateOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [templateOpen]);

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLocaleLowerCase('id');
    if (!q) return activeTemplates;
    return activeTemplates.filter((item) => {
      const resolved = resolveTemplateVariables(item.body, selectedConversation);
      return `${item.title} ${item.category} ${resolved}`.toLocaleLowerCase('id').includes(q);
    });
  }, [activeTemplates, templateSearch, selectedConversation]);

  const handleSelectTemplate = (template) => {
    const resolvedBody = resolveTemplateVariables(template.body, selectedConversation);
    setDraft(resolvedBody);
    setError('');
    setTemplateOpen(false);
    setTemplateSearch('');
    window.requestAnimationFrame(() => {
      draftTextareaRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let active = true;
    setLoadingRoom(true);
    api.get(`/v1/messages/${selectedId}`)
      .then((response) => {
        if (active) {
          const room = response.data.data;
          setMessages(room.messages || []);
          setConversations((current) => current.map((conversation) =>
            conversation.id === selectedId ? room.conversation : conversation,
          ));
          setError('');
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Gagal memuat isi percakapan.');
      })
      .finally(() => {
        if (active) setLoadingRoom(false);
      });
    return () => { active = false; };
  }, [selectedId, refreshList]);

  useEffect(() => {
    if (!selectedId || !token) {
      setRealtimeConnected(false);
      return undefined;
    }

    const echo = getRealtimeClient(token);
    if (!echo) return undefined;

    const channelName = `conversations.${selectedId}`;
    const channel = echo.private(channelName);
    const connection = echo.connector.pusher.connection;
    const updateConnection = () => setRealtimeConnected(connection.state === 'connected');
    const handleMessage = (message) => {
      setMessages((current) => current.some((item) => item.id === message.id)
        ? current
        : [...current, message]);
      setConversations((current) => current.map((item) => {
        if (item.id !== selectedId) return item;
        const incoming = String(message.sender_id) !== String(user?.id);
        return {
          ...item,
          last_message: message,
          updated_at: message.created_at,
          unread_count: incoming ? 0 : item.unread_count,
          is_unread: incoming ? false : item.is_unread,
        };
      }));

      if (String(message.sender_id) !== String(user?.id)) {
        api.patch(`/v1/messages/${selectedId}/read`)
          .catch((requestError) => setError(requestError.response?.data?.message || 'Status pesan belum dapat diperbarui.'));
      }
    };

    connection.bind('state_change', updateConnection);
    updateConnection();
    channel.listen('.message.sent', handleMessage);

    return () => {
      connection.unbind('state_change', updateConnection);
      channel.stopListening('.message.sent', handleMessage);
      echo.leave(channelName);
      setRealtimeConnected(false);
    };
  }, [selectedId, token, user?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, selectedId]);

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id');
    if (!query) return conversations;
    return conversations.filter((item) =>
      `${item.other_user.name} ${item.merchant_name} ${item.job_title}`.toLocaleLowerCase('id').includes(query),
    );
  }, [conversations, search]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const manageConversation = async (conversation, action) => {
    try {
      if (action === 'delete' && !window.confirm('Hapus riwayat percakapan ini dari kotak pesan Anda?')) return;
      if (action === 'archive' || action === 'unarchive') {
        await api.patch(`/v1/messages/${conversation.id}/archive`, { archived: action === 'archive' });
        showNotice(action === 'archive' ? 'Percakapan berhasil diarsipkan.' : 'Percakapan dikembalikan ke kotak masuk.');
      } else if (action === 'unread') {
        await api.patch(`/v1/messages/${conversation.id}/unread`);
        showNotice('Percakapan ditandai belum dibaca.');
      } else {
        await api.delete(`/v1/messages/${conversation.id}`);
        showNotice('Riwayat percakapan berhasil dihapus.');
      }
      await refreshList(null, action !== 'unread');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Tindakan pada percakapan gagal.');
    }
    setMenuId(null);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body && !attachment) {
      setError('Tulis pesan atau pilih lampiran sebelum mengirim.');
      return;
    }
    if (!selectedId) return;
    const formData = new FormData();
    if (body) formData.append('body', body);
    if (attachment) formData.append('attachment', attachment);

    setSending(true);
    try {
      const response = await api.post(`/v1/messages/${selectedId}/messages`, formData);
      const sentMessage = response.data.data;
      setMessages((current) => current.some((message) => message.id === sentMessage.id)
        ? current
        : [...current, sentMessage]);
      setConversations((current) => {
        const conversation = current.find((item) => item.id === selectedId);
        if (!conversation) return current;

        return [
          {
            ...conversation,
            last_message: sentMessage,
            updated_at: sentMessage.created_at,
            unread_count: 0,
            is_unread: false,
          },
          ...current.filter((item) => item.id !== selectedId),
        ];
      });
      setDraft('');
      setAttachment(null);
      if (fileInput.current) fileInput.current.value = '';
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.errors?.body?.[0] || 'Pesan gagal dikirim.');
    } finally {
      setSending(false);
    }
  };

  const downloadAttachment = async (message) => {
    try {
      const response = await api.get(message.attachment_url, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = message.attachment_name || 'lampiran';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Lampiran gagal diunduh. Silakan coba kembali.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-pk-muted">Pesan / {filter === 'archived' ? 'Arsip Percakapan' : 'Pesan & Komunikasi'}</p>
          <h1 className="mt-1 text-[25px] font-extrabold leading-tight tracking-tight text-pk-navy">
            {filter === 'archived' ? 'Arsip Percakapan' : isMerchant ? 'Pesan & Rekrutmen' : 'Pesan & Komunikasi'}
          </h1>
          <p className="mt-1 text-[12px] text-pk-muted">Lanjutkan percakapan terkait proses lamaran dan pekerjaan secara langsung.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {isMerchant && (
            <button
              type="button"
              onClick={() => navigate('/merchant/messages/templates')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-pk-border bg-white px-3 py-1.5 text-[11px] font-bold text-pk-primary shadow-2xs transition hover:bg-pk-soft"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              <span>Kelola Templat</span>
            </button>
          )}
          <span className="rounded-md bg-pk-soft px-2.5 py-1 text-[10px] font-bold uppercase text-pk-primary">
            {isMerchant ? 'Merchant' : 'Mahasiswa'}
          </span>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-pk-border bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama pengguna, usaha, atau posisi..."
              aria-label="Cari percakapan"
              className="h-10 w-full rounded-lg border border-pk-border bg-pk-canvas pl-9 pr-3 text-[12px] outline-none focus:border-pk-cyan"
            />
          </label>
          <div className="flex gap-1 rounded-lg bg-pk-canvas p-1" role="tablist" aria-label="Filter percakapan">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={filter === item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-md px-3 py-2 text-[11px] font-semibold transition ${filter === item.key ? 'bg-pk-navy text-white' : 'text-pk-muted hover:bg-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12px] text-rose-700">{error}</p>}

      <div className="grid h-[calc(100vh-260px)] min-h-[480px] max-h-[820px] overflow-hidden rounded-xl border border-pk-border bg-white lg:grid-cols-[minmax(270px,34%)_1fr]">
        <section className={`min-h-0 min-w-0 overflow-y-auto border-r border-pk-border ${selectedId ? 'hidden lg:block' : ''}`} aria-label="Daftar percakapan">
          <div className="border-b border-pk-border px-4 py-3">
            <h2 className="text-[13px] font-bold text-pk-navy">Percakapan <span className="ml-1 rounded bg-pk-soft px-1.5 py-0.5 text-[10px] text-pk-muted">{visibleConversations.length}</span></h2>
          </div>
          {loadingList ? (
            <p className="px-4 py-8 text-center text-[12px] text-pk-muted">Memuat percakapan...</p>
          ) : visibleConversations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-pk-hint" />
              <p className="mt-3 text-[12px] font-semibold text-pk-navy">Belum ada percakapan</p>
              <p className="mt-1 text-[11px] leading-relaxed text-pk-muted">Percakapan akan muncul di sini saat Anda memiliki lamaran yang terhubung.</p>
            </div>
          ) : visibleConversations.map((conversation) => (
            <article key={conversation.id} className={`group relative border-b border-pk-border/70 transition ${selectedId === conversation.id ? 'bg-[#E4F3FF]' : 'hover:bg-pk-canvas'}`}>
              <button type="button" onClick={() => setSelectedId(conversation.id)} className="flex w-full gap-3 px-4 py-3.5 pr-14 text-left">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pk-soft text-[11px] font-bold text-pk-primary">
                  {initialsOf(conversation.other_user.name)}
                  {conversation.is_unread && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[12px] ${conversation.is_unread ? 'font-bold text-pk-navy' : 'font-semibold text-pk-body'}`}>{conversation.other_user.name}</span>
                    <span className="shrink-0 text-[9px] text-pk-hint">{formatListTime(conversation.last_message?.created_at || conversation.updated_at)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-semibold text-pk-primary">{conversation.job_title} · {conversation.merchant_name}</span>
                  <span className="mt-1 block truncate text-[10px] text-pk-muted">{shortMessage(conversation.last_message)}</span>
                </span>
                {conversation.unread_count > 0 && <span className="absolute bottom-3 right-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-pk-primary px-1 text-[9px] font-bold text-white">{conversation.unread_count}</span>}
              </button>
              <button type="button" onClick={() => setMenuId(menuId === conversation.id ? null : conversation.id)} aria-label="Kelola percakapan" className="absolute right-2 top-7 rounded p-1 text-pk-muted opacity-0 hover:bg-white group-hover:opacity-100 focus:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuId === conversation.id && (
                <div className="absolute right-2 top-14 z-10 w-48 rounded-lg border border-pk-border bg-white p-1 shadow-lg">
                  <button type="button" onClick={() => manageConversation(conversation, 'unread')} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[11px] hover:bg-pk-soft"><MessageCircle className="h-3.5 w-3.5" />Tandai belum dibaca</button>
                  <button type="button" onClick={() => manageConversation(conversation, conversation.is_archived ? 'unarchive' : 'archive')} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[11px] hover:bg-pk-soft">{conversation.is_archived ? <Undo2 className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{conversation.is_archived ? 'Kembalikan ke inbox' : 'Arsipkan percakapan'}</button>
                  <button type="button" onClick={() => manageConversation(conversation, 'delete')} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[11px] text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Hapus riwayat</button>
                </div>
              )}
            </article>
          ))}
        </section>

        <section className={`flex min-h-0 min-w-0 flex-col overflow-hidden ${!selectedId ? 'hidden lg:flex' : ''}`} aria-label="Ruang obrolan">
          {selectedConversation ? (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-pk-border px-4 py-3">
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Kembali ke daftar pesan" className="rounded p-1 text-pk-muted hover:bg-pk-soft lg:hidden"><ArrowLeft className="h-4 w-4" /></button>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pk-soft text-[11px] font-bold text-pk-primary">{initialsOf(selectedConversation.other_user.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-pk-navy">{selectedConversation.other_user.name}</p>
                  <p className="truncate text-[10px] text-pk-muted">{selectedConversation.job_title} · {selectedConversation.merchant_name}</p>
                </div>
                <span className={`shrink-0 text-[9px] font-semibold ${realtimeConnected ? 'text-emerald-600' : 'text-pk-hint'}`}>
                  {realtimeConnected ? 'Live' : 'Menghubungkan'}
                </span>
                <button type="button" onClick={() => manageConversation(selectedConversation, selectedConversation.is_archived ? 'unarchive' : 'archive')} title={selectedConversation.is_archived ? 'Kembalikan ke inbox' : 'Arsipkan percakapan'} className="rounded-lg border border-pk-border p-2 text-pk-muted hover:bg-pk-soft"><Archive className="h-4 w-4" /></button>
              </header>

              <div className="shrink-0 border-b border-pk-border bg-pk-canvas/70 px-4 py-2 text-[10px] text-pk-muted">
                Percakapan terkait lamaran <span className="font-semibold text-pk-body">#{selectedConversation.application_id}</span> untuk posisi <span className="font-semibold text-pk-body">{selectedConversation.job_title}</span>
              </div>

              <div ref={messagesContainerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] px-4 py-5 sm:px-6">
                {loadingRoom ? <p className="py-8 text-center text-[11px] text-pk-muted">Memuat pesan...</p> : messages.length === 0 ? (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                    <MessageCircle className="h-8 w-8 text-pk-hint" />
                    <p className="mt-3 text-[12px] font-semibold text-pk-navy">Mulai percakapan</p>
                    <p className="mt-1 text-[11px] text-pk-muted">Kirim pesan terkait lamaran pekerjaan ini.</p>
                  </div>
                ) : messages.map((message) => {
                  const mine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <article className={`max-w-[85%] rounded-xl px-3.5 py-2.5 sm:max-w-[75%] ${mine ? 'rounded-br-sm bg-pk-navy text-white' : 'rounded-bl-sm border border-pk-border bg-white text-pk-body'}`}>
                        {message.body && <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">{message.body}</p>}
                        {message.attachment_url && (
                          <button type="button" onClick={() => downloadAttachment(message)} className={`mt-2 flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left ${mine ? 'border-white/20 bg-white/10' : 'border-pk-border bg-pk-canvas'}`}>
                            {message.attachment_mime?.startsWith('image/') ? <Image className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                            <span className="min-w-0 truncate text-[10px]">{message.attachment_name}</span>
                            <Download className="h-3.5 w-3.5 shrink-0" />
                          </button>
                        )}
                        <div className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${mine ? 'text-white/60' : 'text-pk-hint'}`}>
                          <span>{formatTime(message.created_at)}</span>
                          {mine && (message.read_at ? <CheckCheck className="h-3 w-3 text-pk-cyan" /> : <Check className="h-3 w-3" />)}
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="shrink-0 border-t border-pk-border bg-white p-3 sm:p-4">
                {isMerchant && (
                  <div ref={templatePopoverRef} className="relative mb-2.5 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextOpen = !templateOpen;
                        setTemplateOpen(nextOpen);
                        if (nextOpen) fetchActiveTemplates();
                      }}
                      aria-expanded={templateOpen}
                      aria-haspopup="dialog"
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                        templateOpen
                          ? 'border-pk-cyan bg-[#EFF6FF] text-pk-primary'
                          : 'border-pk-border bg-pk-soft/70 text-pk-primary hover:bg-pk-soft'
                      }`}
                    >
                      <MessageSquareText className="h-3.5 w-3.5" />
                      <span>Templat</span>
                      {templateOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-[10.5px] text-pk-muted">
                      Variabel terisi otomatis sesuai pelamar
                    </span>

                    {templateOpen && (
                      <div
                        role="dialog"
                        aria-label="Pilih Templat Balasan Cepat"
                        className="absolute bottom-full left-0 z-30 mb-2 w-full max-w-[420px] overflow-hidden rounded-xl border border-pk-border bg-white shadow-xl"
                      >
                        <div className="flex items-center justify-between border-b border-pk-border px-4 py-3">
                          <h3 className="text-[13px] font-extrabold text-pk-navy">Pilih Templat Balasan Cepat</h3>
                          <button
                            type="button"
                            onClick={() => navigate('/merchant/messages/templates')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-pk-primary transition hover:underline"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Kelola Templat</span>
                          </button>
                        </div>

                        <div className="border-b border-pk-border/70 p-2.5">
                          <label className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-hint" />
                            <input
                              type="text"
                              value={templateSearch}
                              onChange={(event) => setTemplateSearch(event.target.value)}
                              placeholder="Cari templat..."
                              aria-label="Cari templat balasan cepat"
                              className="h-9 w-full rounded-lg border border-pk-border bg-pk-canvas/60 pl-8.5 pr-3 text-[11.5px] text-pk-body placeholder:text-pk-placeholder outline-none focus:border-pk-cyan focus:bg-white"
                            />
                          </label>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-pk-border/60">
                          {loadingTemplates ? (
                            <p className="px-4 py-6 text-center text-[11.5px] text-pk-muted">Memuat templat aktif...</p>
                          ) : filteredTemplates.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                              <p className="text-[12px] font-semibold text-pk-navy">
                                {activeTemplates.length === 0 ? 'Belum ada templat aktif' : 'Templat tidak ditemukan'}
                              </p>
                              <p className="mt-1 text-[11px] text-pk-muted">
                                {activeTemplates.length === 0
                                  ? 'Buat templat berstatus Aktif melalui menu Kelola Templat.'
                                  : 'Coba kata kunci pencarian lain.'}
                              </p>
                            </div>
                          ) : (
                            filteredTemplates.map((template) => {
                              const resolvedPreview = resolveTemplateVariables(template.body, selectedConversation);
                              return (
                                <button
                                  key={template.id}
                                  type="button"
                                  onClick={() => handleSelectTemplate(template)}
                                  className="block w-full px-4 py-3 text-left transition hover:bg-[#EFF6FF]"
                                >
                                  <p className="text-[12px] font-bold text-pk-navy">{template.title}</p>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-pk-muted">
                                    {resolvedPreview}
                                  </p>
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div className="border-t border-pk-border bg-pk-canvas/60 px-4 py-2 text-[10.5px] text-pk-muted">
                          {activeTemplates.length} templat aktif · Variabel menyesuaikan penerima
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!isMerchant && (
                  <div className="mb-3">
                    <p className="mb-1.5 text-[10px] font-semibold text-pk-muted">Balasan cepat</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STUDENT_QUICK_REPLIES.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => { setDraft(reply); setError(''); }}
                          className="rounded-full border border-pk-border bg-white px-2.5 py-1.5 text-left text-[10px] text-pk-primary transition hover:border-pk-cyan hover:bg-pk-soft"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {attachment && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-pk-soft px-3 py-2 text-[10px] text-pk-body">
                    <span className="truncate">{attachment.name} · {(attachment.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button type="button" onClick={() => { setAttachment(null); if (fileInput.current) fileInput.current.value = ''; }} className="ml-3 font-bold text-rose-600">Hapus</button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input ref={fileInput} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && file.size > 10 * 1024 * 1024) {
                      setError('Ukuran lampiran maksimal 10 MB.');
                      event.target.value = '';
                      return;
                    }
                    setAttachment(file || null);
                    setError('');
                  }} />
                  <button type="button" onClick={() => fileInput.current?.click()} title="Lampirkan dokumen atau gambar" className="mb-1 rounded-lg p-2 text-pk-muted hover:bg-pk-soft hover:text-pk-primary"><Paperclip className="h-4 w-4" /></button>
                  <textarea
                    ref={draftTextareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={2}
                    maxLength={5000}
                    placeholder="Tulis pesan untuk lawan bicara..."
                    aria-label="Tulis pesan"
                    className="max-h-28 min-h-10 flex-1 resize-y rounded-lg border border-pk-border bg-pk-canvas px-3 py-2.5 text-[11px] outline-none focus:border-pk-cyan"
                  />
                  <button disabled={sending || (!draft.trim() && !attachment)} type="submit" className="mb-0.5 flex items-center gap-1.5 rounded-lg bg-[#FF6B00] px-3.5 py-2.5 text-[11px] font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">{sending ? 'Mengirim...' : 'Kirim'}</span>
                  </button>
                </div>
                <p className="mt-1.5 pl-1 text-[9px] text-pk-hint">Lampiran PDF, Word, JPG, atau PNG · Maks. 10 MB · Enter untuk mengirim</p>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="h-10 w-10 text-pk-hint" />
              <p className="mt-3 text-[13px] font-semibold text-pk-navy">Pilih percakapan</p>
              <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-pk-muted">Pilih pesan di daftar untuk melihat isi obrolan dan membalasnya.</p>
            </div>
          )}
        </section>
      </div>

      {notice && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-[12px] font-semibold text-white shadow-lg">{notice}</div>}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const isMerchant = user?.role === 'merchant';
  const [merchant, setMerchant] = useState(null);

  useEffect(() => {
    if (!isMerchant) return;
    api.get('/v1/merchant/profile')
      .then((response) => setMerchant(response.data.data))
      .catch(() => setMerchant(null));
  }, [isMerchant]);

  if (isMerchant) {
    return (
      <MerchantShell
        active="Pesan"
        activeTopNav="Pesan"
        merchant={merchant}
        showTips={false}
        contentClassName="px-6 py-7 lg:px-8"
      >
        <MessagesContent isMerchant />
      </MerchantShell>
    );
  }

  return (
    <StudentShell active="Pesan">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <MessagesContent isMerchant={false} />
      </div>
    </StudentShell>
  );
}
