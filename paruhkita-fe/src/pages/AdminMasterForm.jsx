import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../api/axios';

const EMPTY_PROGRAM = { name: '', code: '', campus_id: '', degree_level: '', status: '' };
const EMPTY_CATEGORY = { name: '', description: '', status: '' };
const LEVELS = ['D3', 'D4', 'S1', 'S2', 'S3'];

function errorText(error) {
  const validationErrors = error.response?.data?.errors;
  return (validationErrors && Object.values(validationErrors)[0]?.[0])
    || error.response?.data?.message
    || (error.request ? 'Tidak dapat terhubung ke server.' : error.message);
}

export default function AdminMasterForm({ type }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const isProgram = type === 'study_programs';
  const label = isProgram ? 'Program Studi' : 'Kategori Pekerjaan';
  const endpoint = isProgram ? 'study-programs' : 'job-categories';
  const listPath = '/admin/reference-data';
  const [form, setForm] = useState(isProgram ? EMPTY_PROGRAM : EMPTY_CATEGORY);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(Boolean(editId) || isProgram);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dataLoaded, setDataLoaded] = useState(!isProgram && !editId);

  useEffect(() => {
    let active = true;
    if (!isProgram && !editId) return undefined;

    api.get('/v1/admin/reference-data')
      .then(({ data }) => {
        if (!active) return;
        const availableCampuses = data.data.campuses;
        setCampuses(availableCampuses);
        if (isProgram && !editId) {
          setForm((current) => ({ ...current, campus_id: availableCampuses[0]?.id || '' }));
        }
        if (editId) {
          const records = isProgram ? data.data.study_programs : data.data.job_categories;
          const record = records.find((item) => String(item.id) === editId);
          if (!record) {
            setErrorMessage(`Data ${label.toLowerCase()} tidak ditemukan.`);
          } else if (isProgram) {
            setForm({
              name: record.name,
              code: record.code || '',
              campus_id: String(record.campus_id),
              degree_level: record.degree_level || 'S1',
              status: record.status || 'active',
            });
          } else {
            setForm({
              name: record.name,
              description: record.description || '',
              status: record.status || 'active',
            });
          }
        }
        setDataLoaded(true);
      })
      .catch((error) => {
        if (active) setErrorMessage(errorText(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [editId, isProgram, label]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const payload = isProgram ? { ...form, campus_id: Number(form.campus_id) } : form;
      const url = `/v1/admin/reference-data/${endpoint}`;
      const response = editId
        ? await api.put(`${url}/${editId}`, payload)
        : await api.post(url, payload);
      const message = response.data.message || `${label} berhasil ${editId ? 'diperbarui' : 'ditambahkan'}.`;
      navigate(listPath, { state: { notice: message } });
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const title = `${editId ? 'Ubah' : 'Tambah'} ${label}`;
  const description = isProgram
    ? 'Lengkapi informasi program studi dan hubungkan dengan kampus yang terdaftar.'
    : 'Lengkapi informasi kategori untuk mengelompokkan lowongan pekerjaan di platform.';
  const ready = dataLoaded && (!isProgram || campuses.length > 0);

  return (
    <section className="admin-page">
      <Link to={listPath} className="admin-back-link"><ChevronLeft size={14} /> Kembali</Link>
      <div className="admin-page-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {errorMessage && <div role="alert" className="admin-alert admin-alert-error">{errorMessage}</div>}
      {loading ? <div className="admin-panel admin-loading">Memuat data...</div> : (
        <form className={`campus-form-panel master-form-panel ${!isProgram ? 'category-form-panel' : ''}`} onSubmit={submit}>
          <div className="campus-form-fields">
            {isProgram ? (
              <>
                <label className="admin-field">
                  <span>Nama Prodi *</span>
                  <input required maxLength={255} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masukkan nama program studi" />
                </label>
                <label className="admin-field">
                  <span>Kode Prodi *</span>
                  <input required maxLength={50} value={form.code} onChange={(event) => setField('code', event.target.value.toUpperCase())} placeholder="Contoh: UGM-TI" />
                </label>
                <label className="admin-field">
                  <span>Pilih Kampus *</span>
                  <select required value={form.campus_id} onChange={(event) => setField('campus_id', event.target.value)} disabled={campuses.length === 0}>
                    <option value="">Pilih kampus</option>
                    {campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Jenjang *</span>
                  <select required value={form.degree_level} onChange={(event) => setField('degree_level', event.target.value)}>
                    <option value="">Pilih jenjang</option>
                    {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Status *</span>
                  <select required value={form.status} onChange={(event) => setField('status', event.target.value)}>
                    <option value="">Pilih status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak aktif</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="admin-field">
                  <span>Nama Kategori *</span>
                  <input required maxLength={255} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masukkan nama kategori" />
                </label>
                <label className="admin-field">
                  <span>Deskripsi Kategori *</span>
                  <textarea required maxLength={2000} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Tuliskan deskripsi kategori pekerjaan..." />
                </label>
                <label className="admin-field">
                  <span>Status *</span>
                  <select required value={form.status} onChange={(event) => setField('status', event.target.value)}>
                    <option value="">Pilih status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak aktif</option>
                  </select>
                </label>
              </>
            )}
            <p className="admin-required-note">* Kolom wajib diisi.</p>
          </div>
          <div className="campus-form-actions">
            <Link to={listPath} className="admin-button admin-button-outline">Batal</Link>
            <button type="submit" className="admin-button admin-button-primary" disabled={saving || loading || !ready}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
