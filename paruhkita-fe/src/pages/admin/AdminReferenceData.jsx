import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BriefcaseBusiness, Building2, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Download, GraduationCap, Pencil, Plus, Search, Tags, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const TABS = [
  { id: 'campuses', label: 'Kampus' },
  { id: 'study_programs', label: 'Program Studi' },
  { id: 'job_categories', label: 'Kategori Pekerjaan' },
];
const PAGE_SIZE = 8;

function errorText(error) {
  const validationErrors = error.response?.data?.errors;
  return (validationErrors && Object.values(validationErrors)[0]?.[0])
    || error.response?.data?.message
    || (error.request ? 'Tidak dapat terhubung ke server.' : error.message);
}

function MasterModal({ modal, campuses, categories, onClose, onSaved }) {
  const { type, record, categoryId } = modal;
  const [form, setForm] = useState(() => {
    if (type === 'study_programs') return { campus_id: record?.campus_id || campuses[0]?.id || '', name: record?.name || '', code: record?.code || '', degree_level: record?.degree_level || 'S1', status: record?.status || 'active' };
    if (type === 'job_categories') return { name: record?.name || '', description: record?.description || '' };
    return { job_category_id: record?.job_category_id || categoryId || categories[0]?.id || '', name: record?.name || '' };
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fields = {
    study_programs: { endpoint: 'study-programs', title: 'Program Studi', noun: 'program studi' },
    job_categories: { endpoint: 'job-categories', title: 'Kategori Pekerjaan', noun: 'kategori pekerjaan' },
    subcategory: { endpoint: 'job-subcategories', title: 'Subkategori Pekerjaan', noun: 'subkategori pekerjaan' },
  }[type];
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    const endpoint = `/v1/admin/reference-data/${fields.endpoint}`;
    const payload = type === 'study_programs' ? { ...form, campus_id: Number(form.campus_id) } : type === 'subcategory' ? { ...form, job_category_id: Number(form.job_category_id) } : form;
    try {
      const { data } = record
        ? await api.put(`${endpoint}/${record.id}`, payload)
        : await api.post(endpoint, payload);
      onSaved(data.message || `${fields.title} berhasil disimpan.`);
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="master-modal-title" className="admin-modal">
        <div className="admin-modal-heading">
          <div><h2 id="master-modal-title">{record ? `Ubah ${fields.title}` : `Tambah ${fields.title}`}</h2><p>Lengkapi informasi {fields.noun}.</p></div>
          <button type="button" className="admin-icon-button" aria-label="Tutup" onClick={onClose}><X size={18} /></button>
        </div>
        {errorMessage && <div role="alert" className="admin-alert admin-alert-error">{errorMessage}</div>}
        <form className="admin-modal-form" onSubmit={submit}>
          {type === 'study_programs' && (
            <>
              <label className="admin-field"><span>Kampus *</span><select required value={form.campus_id} onChange={(event) => setField('campus_id', event.target.value)}><option value="">Pilih kampus</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name} — {campus.city}</option>)}</select></label>
              <label className="admin-field"><span>Nama program studi *</span><input required maxLength={255} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masukkan nama program studi" /></label>
              <label className="admin-field"><span>Kode prodi</span><input maxLength={50} value={form.code} onChange={(event) => setField('code', event.target.value.toUpperCase())} placeholder="Contoh: UGM-TI" /></label>
              <label className="admin-field"><span>Jenjang *</span><select required value={form.degree_level} onChange={(event) => setField('degree_level', event.target.value)}>{['D3', 'D4', 'S1', 'S2', 'S3'].map((level) => <option key={level}>{level}</option>)}</select></label>
              <label className="admin-field"><span>Status *</span><select required value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="active">Aktif</option><option value="inactive">Tidak aktif</option></select></label>
            </>
          )}
          {type === 'job_categories' && (
            <>
              <label className="admin-field"><span>Nama kategori *</span><input required maxLength={255} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masukkan nama kategori" /></label>
              <label className="admin-field"><span>Deskripsi singkat *</span><textarea required maxLength={2000} rows={4} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Jelaskan kategori pekerjaan" /></label>
            </>
          )}
          {type === 'subcategory' && (
            <>
              <label className="admin-field"><span>Kategori pekerjaan *</span><select required value={form.job_category_id} onChange={(event) => setField('job_category_id', event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="admin-field"><span>Nama subkategori *</span><input required maxLength={255} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masukkan nama subkategori" /></label>
            </>
          )}
          <div className="admin-modal-actions"><button type="button" className="admin-button admin-button-outline" onClick={onClose}>Batal</button><button type="submit" className="admin-button admin-button-primary" disabled={saving || (type === 'study_programs' && campuses.length === 0) || (type === 'subcategory' && categories.length === 0)}>{saving ? 'Menyimpan...' : record ? 'Simpan perubahan' : 'Simpan'}</button></div>
        </form>
      </section>
    </div>
  );
}

export default function AdminReferenceData() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('campuses');
  const [records, setRecords] = useState({ campuses: [], study_programs: [], job_categories: [], job_subcategories: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState(() => location.state?.notice || '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accreditationFilter, setAccreditationFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const loadRecords = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.get('/v1/admin/reference-data');
      setRecords(data.data);
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/v1/admin/reference-data')
      .then(({ data }) => {
        if (active) setRecords(data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(errorText(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const activeRecords = records[activeTab];
  const filteredRecords = activeRecords.filter((record) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [
      record.name,
      record.code,
      record.city,
      record.description,
      record.campus?.name,
    ].some((value) => String(value || '').toLowerCase().includes(term));
    const matchesStatus = !statusFilter || record.status === statusFilter;
    const matchesAccreditation = !accreditationFilter || (accreditationFilter === 'yes' ? Boolean(record.accreditation) : !record.accreditation);
    const matchesCity = !cityFilter || record.city === cityFilter;
    const matchesCampus = !campusFilter || String(record.campus_id) === campusFilter;
    return matchesText && matchesStatus && matchesAccreditation && matchesCity && matchesCampus;
  });
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.updated_at || 0) - new Date(b.updated_at || 0);
    if (sort === 'name_asc') return a.name.localeCompare(b.name, 'id');
    if (sort === 'name_desc') return b.name.localeCompare(a.name, 'id');
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
  });
  const lastPage = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const visibleRecords = sortedRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalSubcategories = records.job_subcategories.length;
  const activeCampuses = records.campuses.filter((campus) => campus.status === 'active').length;
  const activePrograms = records.study_programs.filter((program) => program.status === 'active').length;
  const cities = [...new Set(records.campuses.map((campus) => campus.city))];
  const topCategory = records.job_categories.reduce((top, item) => item.subcategories_count > (top?.subcategories_count || 0) ? item : top, null);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAccreditationFilter('');
    setCityFilter('');
    setCampusFilter('');
    setPage(1);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    clearFilters();
    setSelectedCategory(null);
  };

  const deleteRecord = async (type, record) => {
    if (!window.confirm(`Hapus "${record.name}"?${type === 'job_categories' ? ' Semua subkategori di dalamnya juga akan dihapus.' : ''}`)) return;
    const endpoints = { campuses: 'campuses', study_programs: 'study-programs', job_categories: 'job-categories', subcategory: 'job-subcategories' };
    setBusyId(record.id);
    setErrorMessage('');
    setNotice('');
    try {
      const { data } = await api.delete(`/v1/admin/reference-data/${endpoints[type]}/${record.id}`);
      setNotice(data.message || 'Data berhasil dihapus.');
      if (type === 'job_categories' && selectedCategory?.id === record.id) setSelectedCategory(null);
      await loadRecords();
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setBusyId(null);
    }
  };

  const saved = async (message) => {
    setModal(null);
    setNotice(message);
    await loadRecords();
  };

  const exportCsv = () => {
    const columns = activeTab === 'campuses' ? ['Nama kampus', 'Kode', 'Kota', 'Akreditasi', 'Status'] : activeTab === 'study_programs' ? ['Program studi', 'Kode prodi', 'Kampus', 'Jenjang', 'Status'] : ['Kategori', 'Deskripsi', 'Status', 'Jumlah subkategori'];
    const rows = filteredRecords.map((record) => activeTab === 'campuses'
      ? [record.name, record.code, record.city, record.accreditation, record.status]
      : activeTab === 'study_programs'
        ? [record.name, record.code, record.campus?.name, record.degree_level, record.status]
        : [record.name, record.description, record.status, record.subcategories_count]);
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const content = [columns, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-master-${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = activeTab === 'campuses'
    ? [
      { label: 'Total Kampus Terdaftar', value: records.campuses.length, note: `${activeCampuses} kampus aktif`, icon: Building2 },
      { label: 'Total Program Studi', value: records.study_programs.length, note: `dari ${records.campuses.length} kampus`, icon: BookOpen },
      { label: 'Kota Terjangkau', value: cities.length, note: 'berdasarkan lokasi kampus', icon: BriefcaseBusiness },
      { label: 'Akreditasi Terisi', value: records.campuses.filter((item) => item.accreditation).length, note: 'kampus dengan akreditasi', icon: CircleCheck },
    ]
    : activeTab === 'study_programs'
      ? [
        { label: 'Total Program Studi', value: records.study_programs.length, note: `dari ${records.campuses.length} kampus`, icon: BookOpen },
        { label: 'Kampus Terintegrasi', value: records.campuses.length, note: 'seluruh kampus terdaftar', icon: Building2 },
        { label: 'Prodi Aktif', value: activePrograms, note: `${records.study_programs.length - activePrograms} prodi tidak aktif`, icon: CircleCheck },
        { label: 'Jenjang Terdaftar', value: new Set(records.study_programs.map((item) => item.degree_level)).size, note: 'jenjang program studi', icon: GraduationCap },
      ]
      : [
        { label: 'Total Kategori Utama', value: records.job_categories.length, note: 'kategori pekerjaan', icon: BriefcaseBusiness },
        { label: 'Total Subkategori', value: totalSubcategories, note: 'subkategori terdaftar', icon: Tags },
        { label: 'Kategori Terpopuler', value: topCategory?.name || '—', note: `${topCategory?.subcategories_count || 0} subkategori`, icon: BookOpen },
        { label: 'Kategori Aktif', value: records.job_categories.filter((item) => item.status === 'active').length, note: 'tersedia untuk lowongan', icon: CircleCheck },
      ];

  return (
    <section className="admin-page">
      <div className="admin-page-heading admin-heading-row">
        <div><h1>Pengelolaan Data Master</h1><p>Kelola data kampus, program studi, dan kategori pekerjaan yang menjadi referensi utama platform.</p></div>
        {activeTab === 'campuses'
          ? <Link className="admin-button admin-button-primary" to="/admin/reference-data/campuses/new"><Plus size={16} /> Tambah Data Baru</Link>
          : <Link className="admin-button admin-button-primary" to={`/admin/reference-data/${activeTab === 'study_programs' ? 'study-programs' : 'job-categories'}/new`}><Plus size={16} /> Tambah {activeTab === 'study_programs' ? 'Program Studi' : 'Kategori'}</Link>}
      </div>
      {errorMessage && <div role="alert" className="admin-alert admin-alert-error">{errorMessage}</div>}
      {notice && <div role="status" className="admin-alert admin-alert-success"><CircleCheck size={16} /> {notice}<button type="button" aria-label="Tutup notifikasi" onClick={() => setNotice('')}><X size={15} /></button></div>}

      <div className="admin-stats-grid master-stats-grid">
        {statCards.map(({ label, value, note, icon: Icon }) => <article key={label} className="admin-stat-card"><Icon size={20} /><span>{label}</span><strong className={typeof value === 'string' && value.length > 14 ? 'stat-text-value' : ''}>{typeof value === 'number' ? value.toLocaleString('id-ID') : value}</strong><small>{note}</small></article>)}
      </div>

      <div className="admin-filter-tabs">
        {TABS.map((tab) => <button key={tab.id} type="button" onClick={() => changeTab(tab.id)} className={activeTab === tab.id ? 'is-selected' : ''}>{tab.label}</button>)}
      </div>

      <div className="admin-toolbar master-toolbar">
        <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={activeTab === 'campuses' ? 'Cari nama kampus...' : activeTab === 'study_programs' ? 'Cari nama atau kode program studi...' : 'Cari nama kategori...'} /></label>
        <select aria-label="Filter status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">Status: Semua</option><option value="active">Aktif</option><option value="inactive">Tidak aktif</option></select>
        {activeTab === 'campuses' && <select aria-label="Filter kota" value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setPage(1); }}><option value="">Kota: Semua</option>{cities.map((city) => <option key={city}>{city}</option>)}</select>}
        {activeTab === 'study_programs' && <select aria-label="Filter kampus" value={campusFilter} onChange={(event) => { setCampusFilter(event.target.value); setPage(1); }}><option value="">Pilih Kampus</option>{records.campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select>}
        {activeTab === 'campuses' && <select aria-label="Filter akreditasi" value={accreditationFilter} onChange={(event) => { setAccreditationFilter(event.target.value); setPage(1); }}><option value="">Akreditasi: Semua</option><option value="yes">Sudah terakreditasi</option><option value="no">Belum terakreditasi</option></select>}
        <select aria-label="Urutkan data" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">Urutkan: Terbaru</option><option value="oldest">Urutkan: Terlama</option><option value="name_asc">Nama: A–Z</option><option value="name_desc">Nama: Z–A</option></select>
        <button type="button" className="admin-export-button" onClick={exportCsv}><Download size={15} /> Ekspor CSV</button>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-scroll">
          <table className={`admin-table master-table ${activeTab}`}>
            {activeTab === 'campuses' && <>
              <thead><tr><th>No</th><th>Nama Kampus</th><th>Kode</th><th>Kota</th><th>Jml Prodi</th><th>Mahasiswa Terdaftar</th><th>Status</th><th>Terakhir Diubah</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="9" className="admin-table-message">Memuat data kampus...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan="9" className="admin-table-message">Tidak ada kampus yang cocok dengan pencarian.</td></tr> : visibleRecords.map((record, index) => <tr key={record.id}><td>{(page - 1) * PAGE_SIZE + index + 1}</td><td><strong>{record.name}</strong><small className="admin-cell-subtitle">Akreditasi {record.accreditation || 'belum diisi'}</small></td><td><span className="admin-code-pill">{record.code || '—'}</span></td><td>{record.city}</td>                <td>{record.study_programs_count || 0}</td><td>{record.students_count || 0}</td><td><span className={`admin-status-pill ${record.status === 'active' ? 'status-active' : 'status-blocked'}`}>{record.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td><td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString('id-ID') : '—'}</td><td><div className="admin-inline-actions"><Link to={`/admin/reference-data/campuses/new?edit=${record.id}`} className="admin-icon-button" title="Ubah kampus"><Pencil size={14} /></Link><button type="button" className="admin-icon-button is-delete" disabled={busyId === record.id} onClick={() => deleteRecord('campuses', record)} title="Hapus kampus"><Trash2 size={14} /></button></div></td></tr>)}
              </tbody>
            </>}
            {activeTab === 'study_programs' && <>
              <thead><tr><th>No</th><th>Nama Program Studi</th><th>Kode Prodi</th><th>Kampus</th><th>Jenjang</th><th>Mahasiswa</th><th>Status</th><th>Terakhir Diubah</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="9" className="admin-table-message">Memuat program studi...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan="9" className="admin-table-message">Tidak ada program studi yang cocok.</td></tr> : visibleRecords.map((record, index) => <tr key={record.id}><td>{(page - 1) * PAGE_SIZE + index + 1}</td><td><strong>{record.name}</strong></td><td><span className="admin-code-pill">{record.code || '—'}</span></td><td>{record.campus?.name || '—'}</td><td>{record.degree_level || 'S1'}</td><td>{record.students_count || 0}</td><td><span className={`admin-status-pill ${record.status === 'active' ? 'status-active' : 'status-blocked'}`}>{record.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td><td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString('id-ID') : '—'}</td><td><div className="admin-inline-actions"><Link to={`/admin/reference-data/study-programs/new?edit=${record.id}`} className="admin-icon-button" title="Ubah program studi"><Pencil size={14} /></Link><button type="button" className="admin-icon-button is-delete" disabled={busyId === record.id} onClick={() => deleteRecord('study_programs', record)} title="Hapus program studi"><Trash2 size={14} /></button></div></td></tr>)}
              </tbody>
            </>}
            {activeTab === 'job_categories' && <>
              <thead><tr><th>No</th><th>Nama Kategori</th><th>Deskripsi Singkat</th><th>Jumlah Subkategori</th><th>Lowongan Terkait</th><th>Status</th><th>Terakhir Diubah</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="8" className="admin-table-message">Memuat kategori pekerjaan...</td></tr> : visibleRecords.length === 0 ? <tr><td colSpan="8" className="admin-table-message">Tidak ada kategori yang cocok.</td></tr> : visibleRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td><strong>{record.name}</strong></td>
                    <td>{record.description}</td>
                    <td><button type="button" className="admin-subcategory-toggle" onClick={() => setSelectedCategory(record)}>{record.subcategories_count || 0} <ChevronDown size={13} /></button></td>
                    <td>—</td>
                    <td><span className={`admin-status-pill ${record.status === 'active' ? 'status-active' : 'status-blocked'}`}>{record.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString('id-ID') : '—'}</td>
                    <td><div className="admin-inline-actions"><Link to={`/admin/reference-data/job-categories/new?edit=${record.id}`} className="admin-icon-button" title="Ubah kategori"><Pencil size={14} /></Link><button type="button" className="admin-icon-button is-delete" disabled={busyId === record.id} onClick={() => deleteRecord('job_categories', record)} title="Hapus kategori"><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </>}
          </table>
        </div>
        <div className="admin-table-footer">
          <span>Menampilkan {filteredRecords.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filteredRecords.length)} dari {filteredRecords.length.toLocaleString('id-ID')} {activeTab === 'campuses' ? 'kampus' : activeTab === 'study_programs' ? 'program studi' : 'kategori'}</span>
          <div className="admin-pagination"><button type="button" disabled={page <= 1} aria-label="Halaman sebelumnya" onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button><button type="button" className="page-current">{page}</button>{lastPage > 1 && <><button type="button" disabled={page >= lastPage} onClick={() => setPage((current) => current + 1)}>{Math.min(page + 1, lastPage)}</button>{lastPage > 2 && <><span>…</span><button type="button" onClick={() => setPage(lastPage)}>{lastPage}</button></>}</>}<button type="button" disabled={page >= lastPage} aria-label="Halaman berikutnya" onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button></div>
        </div>
      </div>
      {activeTab === 'job_categories' && selectedCategory && (
        <section className="admin-subcategory-card">
          <div className="admin-subcategory-heading">
            <div><h2>Subkategori — {selectedCategory.name}</h2><p>Kelola subkategori untuk kategori pekerjaan ini.</p></div>
            <div className="admin-inline-actions"><button type="button" className="admin-button admin-button-small" onClick={() => setModal({ type: 'subcategory', categoryId: selectedCategory.id })}><Plus size={14} /> Tambah subkategori</button><button type="button" className="admin-icon-button" aria-label="Tutup pengelolaan subkategori" onClick={() => setSelectedCategory(null)}><X size={15} /></button></div>
          </div>
          {records.job_subcategories.filter((item) => item.job_category_id === selectedCategory.id).length > 0
            ? <ul>{records.job_subcategories.filter((item) => item.job_category_id === selectedCategory.id).map((subcategory) => <li key={subcategory.id}><span>{subcategory.name}</span><div className="admin-inline-actions"><button type="button" className="admin-icon-button" aria-label={`Ubah ${subcategory.name}`} onClick={() => setModal({ type: 'subcategory', record: subcategory })}><Pencil size={13} /></button><button type="button" className="admin-icon-button is-delete" aria-label={`Hapus ${subcategory.name}`} onClick={() => deleteRecord('subcategory', subcategory)}><Trash2 size={13} /></button></div></li>)}</ul>
            : <p className="admin-empty-note">Belum ada subkategori untuk kategori ini.</p>}
        </section>
      )}
      {modal && <MasterModal modal={modal} campuses={records.campuses} categories={records.job_categories} onClose={() => setModal(null)} onSaved={saved} />}
    </section>
  );
}
