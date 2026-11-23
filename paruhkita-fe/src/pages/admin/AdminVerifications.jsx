import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, CheckSquare, Clock3, Download, Eye, FileText, GraduationCap, RefreshCw, Search, ShieldCheck, Store, X, XCircle } from 'lucide-react';
import api from '../../api/axios';

const STATUS_LABELS = { all: 'Semua Status', pending: 'Menunggu Verifikasi', approved: 'Terverifikasi', revision_required: 'Perlu Revisi', rejected: 'Ditolak' };
const TYPE_LABELS = { all: 'Semua Pengajuan', student: 'Mahasiswa / KTM', merchant: 'Merchant / Legalitas' };
const emptyStats = { total_pending: 0, verified_students: 0, verified_merchants: 0, total_rejected_or_revision: 0 };

function errorText(error) { return error.response?.data?.message || (error.request ? 'Tidak dapat terhubung ke server.' : error.message); }
function dateText(value) { return value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'; }
function statusClass(status) { return `verification-status verification-status-${status}`; }

function StatCards({ stats }) {
  return <section className="verification-stat-grid">
    <article><div><span>Menunggu Review</span><strong>{stats.total_pending.toLocaleString('id-ID')}</strong><small>Antrean aktif</small></div><Clock3 /></article>
    <article><div><span>KTM Terverifikasi</span><strong>{stats.verified_students.toLocaleString('id-ID')}</strong><small>Mahasiswa resmi</small></div><GraduationCap /></article>
    <article><div><span>Merchant Terverifikasi</span><strong>{stats.verified_merchants.toLocaleString('id-ID')}</strong><small>Mitra legal</small></div><Store /></article>
    <article><div><span>Revisi / Ditolak</span><strong>{stats.total_rejected_or_revision.toLocaleString('id-ID')}</strong><small>Perlu perhatian</small></div><AlertCircle /></article>
  </section>;
}

function DecisionModal({ item, onClose, onDone }) {
  const [note, setNote] = useState(item.verification_note || '');
  const [checked, setChecked] = useState([false, false, false, false]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isStudent = item.entity_type === 'student';
  const isPending = item.status === 'pending';
  const checks = isStudent
    ? ['Scan dokumen terbaca jelas tanpa blur', 'Nama dan NIM sesuai profil', 'Status mahasiswa masih aktif', 'Kampus tercatat di data master']
    : ['Dokumen legalitas lengkap', 'Nomor dan identitas usaha sesuai', 'Lokasi operasional dapat diverifikasi', 'Komitmen kerja layak mahasiswa'];
  const setDecision = async (decision) => {
    if (decision === 'approve' && checked.some((value) => !value)) { setError('Centang seluruh checklist sebelum menyetujui.'); return; }
    if (decision !== 'approve' && !note.trim()) { setError(decision === 'reject' ? 'Alasan penolakan wajib diisi.' : 'Catatan revisi wajib diisi.'); return; }
    setBusy(true); setError('');
    try {
      const endpoint = decision === 'approve' ? 'approve' : decision === 'revision' ? 'request-revision' : 'reject';
      await api.post(`/v1/admin/verifications/${item.entity_type}/${item.profile_id}/${endpoint}`, decision === 'revision' ? { notes: note.trim() } : decision === 'reject' ? { reason: note.trim() } : {});
      onDone(decision === 'approve' ? 'Dokumen berhasil diverifikasi.' : decision === 'revision' ? 'Permintaan revisi berhasil dikirim.' : 'Permohonan berhasil ditolak.');
    } catch (requestError) { setError(errorText(requestError)); } finally { setBusy(false); }
  };
  const openDocument = async (document) => {
    try {
      const response = await api.get(document.preview_url.replace('/api', ''), { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (requestError) { setError(errorText(requestError)); }
  };

  return <div className="verification-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="verification-modal" role="dialog" aria-modal="true" aria-labelledby="verification-modal-title">
      <header><div className="verification-modal-icon">{isStudent ? <GraduationCap size={20} /> : <Store size={20} />}</div><div><h2 id="verification-modal-title">{isStudent ? 'Pemeriksaan Identitas Mahasiswa' : 'Pemeriksaan Legalitas Merchant'}</h2><p>{item.name} · {item.email}</p></div><button type="button" onClick={onClose} aria-label="Tutup"><X size={19} /></button></header>
      <div className="verification-modal-body">
        <div className="verification-document-panel"><div className="verification-detail-heading"><div><span>Detail Pengajuan</span><strong>{item.institution_or_category || '-'}</strong></div><span className={statusClass(item.status)}>{STATUS_LABELS[item.status]}</span></div><div className="verification-detail-grid"><div><small>{isStudent ? 'NIM' : 'Kategori Usaha'}</small><strong>{item.identifier_number || item.institution_or_category || '-'}</strong></div><div><small>Dikirim pada</small><strong>{dateText(item.submitted_at)}</strong></div><div><small>Program / Keterangan</small><strong>{item.major || item.institution_or_category || '-'}</strong></div></div><h3>Dokumen Diajukan</h3><div className="verification-documents">{item.documents.map((document) => <button type="button" key={`${document.type}-${document.id}`} onClick={() => openDocument(document)}><FileText size={18} /><span><strong>{document.name}</strong><small>{document.type.toUpperCase()}</small></span><Eye size={15} /></button>)}</div></div>
        <div className="verification-decision-panel"><h3>{isPending ? 'Checklist Validasi' : 'Riwayat Keputusan'}</h3>{isPending ? <><div className="verification-checklist">{checks.map((label, index) => <label key={label}><input type="checkbox" checked={checked[index]} onChange={() => setChecked((current) => current.map((value, currentIndex) => currentIndex === index ? !value : value))} /><span>{label}</span></label>)}</div><label className="verification-note-field"><span>Catatan keputusan</span><textarea rows="4" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Wajib diisi untuk revisi atau penolakan..." /></label>{error && <p className="verification-form-error"><AlertCircle size={14} />{error}</p>}<div className="verification-decision-actions"><button type="button" className="verification-approve" disabled={busy} onClick={() => setDecision('approve')}><CheckCircle2 size={15} /> Setujui</button><button type="button" className="verification-revision" disabled={busy} onClick={() => setDecision('revision')}><RefreshCw size={15} /> Minta Revisi</button><button type="button" className="verification-reject" disabled={busy} onClick={() => setDecision('reject')}><XCircle size={15} /> Tolak</button></div></> : <div className="verification-readonly-state"><ShieldCheck size={24} /><strong>Permohonan sudah diproses</strong><span>{item.verification_note || 'Tidak ada catatan tambahan dari admin.'}</span></div>}</div>
      </div>
    </section>
  </div>;
}

export default function AdminVerifications() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [tab, setTab] = useState('all');
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/v1/admin/verifications', { params: { type: tab, status, search, per_page: 50 } });
      setItems(response.data.data || []); setStats(response.data.meta?.stats || emptyStats); setSelected([]);
    } catch (requestError) { setError(errorText(requestError)); } finally { setLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [tab, status, search]);
  const refresh = () => load();
  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id));
  const toggleAll = () => setSelected(allSelected ? [] : items.filter((item) => item.status === 'pending').map((item) => item.id));
  const toggleItem = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const decisionDone = (message) => { setModal(null); setNotice(message); load(); };
  const batchApprove = async () => {
    const batchItems = items.filter((item) => selected.includes(item.id)).map((item) => ({ type: item.entity_type, id: item.profile_id }));
    if (!batchItems.length) return;
    setBatchBusy(true); setError('');
    try { const response = await api.post('/v1/admin/verifications/batch-approve', { items: batchItems }); setNotice(response.data.message); load(); } catch (requestError) { setError(errorText(requestError)); } finally { setBatchBusy(false); }
  };

  return <section className="admin-page verification-page">
    <section className="verification-hero"><div><span className="admin-eyebrow">Kepatuhan & integritas pengguna</span><h1>Verifikasi Identitas & Legalitas Usaha</h1><p>Pemeriksaan KTM mahasiswa dan dokumen legalitas merchant dalam satu pusat kerja admin.</p></div><div className="verification-hero-actions"><button type="button" className="verification-batch-button" disabled={!selected.length || batchBusy} onClick={batchApprove}><CheckSquare size={16} /> Setuju Semua ({selected.length})</button><button type="button" className="verification-refresh-button" onClick={refresh}><RefreshCw size={15} /> Muat ulang</button></div></section>
    {error && <div className="admin-alert admin-alert-error" role="alert"><AlertCircle size={16} />{error}</div>}{notice && <div className="admin-alert admin-alert-success" role="status"><Check size={16} />{notice}<button type="button" onClick={() => setNotice('')}><X size={14} /></button></div>}
    <StatCards stats={stats} />
    <section className="verification-filter-panel"><div className="verification-tabs">{Object.entries(TYPE_LABELS).map(([key, label]) => <button type="button" key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{key === 'student' ? <GraduationCap size={15} /> : key === 'merchant' ? <Store size={15} /> : <ShieldCheck size={15} />}{label}</button>)}</div><div className="verification-filter-row"><label className="verification-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, NIM, email, kampus, atau kategori..." /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status">{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></section>
    <section className="verification-table-card"><div className="verification-table-scroll"><table className="verification-table"><thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Pilih semua" /></th><th>Pengguna</th><th>Role & Identitas</th><th>Dokumen</th><th>Dikirim</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="verification-table-empty">Memuat pengajuan...</td></tr> : !items.length ? <tr><td colSpan="7" className="verification-table-empty"><CheckCircle2 size={25} />Tidak ada pengajuan pada filter ini.</td></tr> : items.map((item) => <tr key={item.id}><td><input type="checkbox" checked={selected.includes(item.id)} disabled={item.status !== 'pending'} onChange={() => toggleItem(item.id)} aria-label={`Pilih ${item.name}`} /></td><td><strong>{item.name}</strong><small>{item.email}</small></td><td><span className={`verification-type ${item.entity_type}`}><span>{item.entity_type === 'student' ? 'Mahasiswa' : 'Merchant'}</span></span><small>{item.identifier_number || item.institution_or_category || '-'}</small></td><td><span className="verification-file-count"><FileText size={14} />{item.documents.length} berkas</span><small>{item.documents.map((document) => document.type.toUpperCase()).join(' · ')}</small></td><td>{dateText(item.submitted_at)}</td><td><span className={statusClass(item.status)}>{STATUS_LABELS[item.status]}</span></td><td><button type="button" className="verification-review-button" onClick={() => setModal(item)}><Eye size={14} /> Periksa</button></td></tr>)}</tbody></table></div><div className="verification-table-footer">Menampilkan {items.length} pengajuan{selected.length > 0 && ` · ${selected.length} dipilih`}<span><Download size={13} /> Data private hanya dapat diakses admin</span></div></section>
    {modal && <DecisionModal item={modal} onClose={() => setModal(null)} onDone={decisionDone} />}
  </section>;
}
