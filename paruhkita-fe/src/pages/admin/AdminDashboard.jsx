import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, BellRing, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Download, FileText, Search, ShieldCheck, Store, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const EMPTY_DATA = {
  stats: { total_users: 0, new_users: 0, active_jobs: 0, new_jobs: 0, applications: 0, acceptance_rate: 0 },
  application_status: { accepted: 0, pending: 0, in_process: 0, rejected: 0 },
  trend: [],
  activities: [],
  alerts: { pending_merchants: 0, pending_complaints: 0, expired_jobs: 0 },
};

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');
const formatTime = (value) => value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
const formatError = (error) => error.response?.data?.message || (error.request ? 'Tidak dapat terhubung ke server.' : error.message);

function TrendChart({ data }) {
  const width = 720;
  const height = 250;
  const padding = { top: 20, right: 12, bottom: 28, left: 34 };
  const max = Math.max(1, ...data.flatMap((item) => [item.users, item.jobs, item.applications]));
  const x = (index) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(1, data.length - 1);
  const y = (value) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);
  const points = (key) => data.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');

  return <div className="admin-chart-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafik tren aktivitas platform">
      {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={padding.left} x2={width - padding.right} y1={y(max * ratio)} y2={y(max * ratio)} stroke="#D8E5EE" strokeDasharray="3 4" /><text x="2" y={y(max * ratio) + 4} fill="#536B82" fontSize="10">{formatNumber(Math.round(max * ratio))}</text></g>)}
      {data.map((item, index) => <text key={`${item.label}-${index}`} x={x(index)} y={height - 5} textAnchor="middle" fill="#536B82" fontSize="10">{item.label}</text>)}
      <polyline points={points('users')} fill="none" stroke="#00B4D8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={points('jobs')} fill="none" stroke="#FBB02D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={points('applications')} fill="none" stroke="#023E8A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {['users', 'jobs', 'applications'].map((key) => data.map((item, index) => <circle key={`${key}-${index}`} cx={x(index)} cy={y(item[key])} r="3" fill={{ users: '#00B4D8', jobs: '#FBB02D', applications: '#023E8A' }[key]} />))}
    </svg>
  </div>;
}

function StatusDonut({ status }) {
  const total = Object.values(status).reduce((sum, value) => sum + Number(value || 0), 0);
  const accepted = total ? (status.accepted / total) * 100 : 0;
  const pending = total ? (status.pending / total) * 100 : 0;
  const inProcess = total ? (status.in_process / total) * 100 : 0;
  const gradient = `conic-gradient(#00B4D8 0 ${accepted}%, #FBB02D ${accepted}% ${accepted + pending}%, #023E8A ${accepted + pending}% ${accepted + pending + inProcess}%, #536B82 ${accepted + pending + inProcess}% 100%)`;
  const rows = [
    ['Diterima', status.accepted, '#00B4D8'],
    ['Menunggu review', status.pending, '#FBB02D'],
    ['Dalam proses', status.in_process, '#023E8A'],
    ['Ditolak', status.rejected, '#536B82'],
  ];
  return <>
    <div className="admin-donut" style={{ background: gradient }}><div><strong>{formatNumber(total)}</strong><span>Lamaran</span></div></div>
    <div className="admin-status-list">{rows.map(([label, value, color]) => <div key={label}><span><i style={{ background: color }} />{label}</span><strong>{total ? Math.round((value / total) * 100) : 0}%</strong></div>)}</div>
  </>;
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(EMPTY_DATA);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/v1/admin/dashboard', { params: { period } })
      .then(({ data: response }) => { if (active) setData({ ...EMPTY_DATA, ...response.data }); })
      .catch((error) => { if (active) setErrorMessage(formatError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const statCards = [
    { label: 'Total Pengguna', value: data.stats.total_users, note: `+${formatNumber(data.stats.new_users)} periode ini`, icon: Users },
    { label: 'Lowongan Aktif', value: data.stats.active_jobs, note: `+${formatNumber(data.stats.new_jobs)} lowongan baru`, icon: BriefcaseBusiness },
    { label: 'Lamaran Diproses', value: data.stats.applications, note: 'Dalam periode terpilih', icon: FileText },
    { label: 'Tingkat Penerimaan', value: `${data.stats.acceptance_rate}%`, note: 'Dari lamaran periode ini', icon: CheckCircle2 },
  ];
  const filteredActivities = data.activities.filter((item) => [item.actor, item.action, item.detail, item.actor_type].join(' ').toLowerCase().includes(search.toLowerCase()));
  const downloadReport = () => {
    const rows = [['Waktu', 'Pengguna', 'Tipe', 'Aktivitas', 'Detail'], ...data.activities.map((item) => [item.at, item.actor, item.actor_type, item.action, item.detail])];
    const csv = rows.map((row) => row.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-dashboard-paruhkita.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <section className="admin-page admin-dashboard-page">
    <section className="admin-hero-card">
      <div><span className="admin-eyebrow">Overview platform</span><h1>Dashboard Admin ParuhKita</h1><p><CalendarDays size={14} /> Data operasional platform dan aktivitas terbaru.</p></div>
      <div className="admin-dashboard-actions"><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Periode dashboard"><option value="month">Bulan ini</option><option value="week">Minggu ini</option><option value="30-days">30 hari terakhir</option></select><button type="button" className="admin-button admin-button-primary" onClick={downloadReport}><Download size={15} /> Unduh Laporan</button></div>
    </section>

    {errorMessage && <div className="admin-alert admin-alert-error" role="alert"><AlertTriangle size={16} />{errorMessage}</div>}
    {loading && <div className="admin-loading-line"><span /> Memuat data dashboard...</div>}

    <section className="admin-dashboard-stats">{statCards.map(({ label, value, note, icon: Icon }) => <article className="admin-dashboard-stat" key={label}><div className="admin-stat-top"><div><span>{label}</span><strong>{typeof value === 'number' ? formatNumber(value) : value}</strong></div><Icon size={23} /></div><small>{note}</small></article>)}</section>

    <section className="admin-dashboard-chart-grid">
      <article className="admin-dashboard-panel admin-trend-panel"><div className="admin-panel-heading"><div><h2>Tren Aktivitas Platform</h2><p>Aktivitas pengguna, lowongan, dan lamaran selama 10 bulan terakhir.</p></div><div className="admin-legend"><span><i className="cyan" /> Pengguna baru</span><span><i className="amber" /> Lowongan</span><span><i className="navy" /> Lamaran</span></div></div>{data.trend.length ? <TrendChart data={data.trend} /> : <div className="admin-chart-empty">Belum ada data tren.</div>}</article>
      <article className="admin-dashboard-panel"><div className="admin-panel-heading"><div><h2>Distribusi Status Lamaran</h2><p>Proporsi lamaran pada periode terpilih.</p></div><BarChart3 size={20} /></div><StatusDonut status={data.application_status} /></article>
    </section>

    <section className="admin-dashboard-panel admin-activity-panel"><div className="admin-panel-heading"><div><h2>Aktivitas Terbaru</h2><p>Catatan aktivitas terkini di platform.</p></div><label className="admin-activity-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari aktivitas..." /></label></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Detail</th></tr></thead><tbody>{filteredActivities.length ? filteredActivities.map((item) => <tr key={item.id}><td>{formatTime(item.at)}</td><td><strong>{item.actor}</strong><small>{item.actor_type}</small></td><td>{item.action}</td><td>{item.detail}</td></tr>) : <tr><td className="admin-table-message" colSpan="4">Belum ada aktivitas yang cocok.</td></tr>}</tbody></table></div></section>

    <section className="admin-sdg-card"><div><span className="admin-eyebrow">Dampak platform</span><h2>Kontribusi terhadap SDG 8</h2><p>Mendukung pekerjaan layak dan pertumbuhan ekonomi berkelanjutan bagi mahasiswa serta UMKM lokal.</p></div><div className="admin-sdg-grid"><div><Users size={18} /><strong>{formatNumber(data.stats.acceptance_rate ? Math.round(data.stats.applications * data.stats.acceptance_rate / 100) : 0)}</strong><span>Lamaran berhasil</span></div><div><Clock3 size={18} /><strong>{formatNumber(data.stats.applications * 4)}</strong><span>Jam kerja difasilitasi</span></div><div><Store size={18} /><strong>{formatNumber(data.alerts.pending_merchants)}</strong><span>Merchant antre verifikasi</span></div></div></section>

    <section className="admin-dashboard-panel admin-alert-panel"><div className="admin-panel-heading"><div><h2><BellRing size={18} /> Quick Alerts & Tindakan</h2><p>Hal yang membutuhkan perhatian admin.</p></div></div><div className="admin-alert-grid"><Link to="/admin/verifikasi-dokumen" className="admin-quick-alert cyan-border"><ShieldCheck size={19} /><div><strong>{formatNumber(data.alerts.pending_merchants)} merchant menunggu verifikasi</strong><span>Pemeriksaan legalitas usaha</span></div><ArrowUpRight size={16} /></Link><div className="admin-quick-alert amber-border"><AlertTriangle size={19} /><div><strong>{formatNumber(data.alerts.pending_complaints)} pengaduan belum ditangani</strong><span>Modul pengaduan belum terhubung</span></div><ArrowDownRight size={16} /></div><div className="admin-quick-alert navy-border"><Clock3 size={19} /><div><strong>{formatNumber(data.alerts.expired_jobs)} lowongan melewati deadline</strong><span>Perlu diperpanjang atau diarsipkan</span></div><ArrowUpRight size={16} /></div></div></section>
  </section>;
}
