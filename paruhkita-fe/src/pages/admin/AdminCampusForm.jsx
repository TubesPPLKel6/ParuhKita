import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../api/axios';

const EMPTY_CAMPUS = { name: '', code: '', city: '', status: 'active', accreditation: '' };
const ACCREDITATIONS = ['Unggul', 'A', 'B', 'C', 'Baik Sekali', 'Baik'];

function errorText(error) {
  const validationErrors = error.response?.data?.errors;
  return (validationErrors && Object.values(validationErrors)[0]?.[0])
    || error.response?.data?.message
    || (error.request ? 'Tidak dapat terhubung ke server.' : error.message);
}

export default function AdminCampusForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editId = params.get('edit');
  const [form, setForm] = useState(EMPTY_CAMPUS);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!editId) return undefined;
    let active = true;
    api.get('/v1/admin/reference-data')
      .then(({ data }) => {
        const campus = data.data.campuses.find((item) => String(item.id) === editId);
        if (!campus) throw new Error('Data kampus tidak ditemukan.');
        if (active) setForm({
          name: campus.name,
          code: campus.code || '',
          city: campus.city,
          status: campus.status,
          accreditation: campus.accreditation || '',
        });
      })
      .catch((error) => {
        if (active) setErrorMessage(errorText(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [editId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const request = editId
        ? api.put(`/v1/admin/reference-data/campuses/${editId}`, form)
        : api.post('/v1/admin/reference-data/campuses', form);
      await request;
      navigate('/admin/reference-data', { state: { notice: editId ? 'Data kampus berhasil diperbarui.' : 'Kampus berhasil ditambahkan.' } });
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-page">
      <Link to="/admin/reference-data" className="admin-back-link"><ChevronLeft size={14} /> Kembali</Link>
      <div className="admin-page-heading">
        <h1>{editId ? 'Ubah Data Kampus' : 'Tambah Data Kampus'}</h1>
        <p>Lengkapi informasi kampus untuk menambahkannya ke data master platform.</p>
      </div>

      {errorMessage && <div role="alert" className="admin-alert admin-alert-error">{errorMessage}</div>}
      {loading ? <div className="admin-panel admin-loading">Memuat data kampus...</div> : (
        <form className="campus-form-panel" onSubmit={submit}>
          <div className="campus-form-fields">
            <label className="admin-field">
              <span>Nama Kampus *</span>
              <input required maxLength={255} value={form.name} placeholder="Masukkan nama kampus" onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="admin-field">
              <span>Kode Kampus *</span>
              <input required maxLength={20} value={form.code} placeholder="Contoh: UGM" onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
            </label>
            <label className="admin-field">
              <span>Kota *</span>
              <input required maxLength={255} value={form.city} placeholder="Masukkan kota" onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </label>
            <label className="admin-field">
              <span>Status *</span>
              <select required value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak aktif</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Akreditasi *</span>
              <select required value={form.accreditation} onChange={(event) => setForm({ ...form, accreditation: event.target.value })}>
                <option value="">Pilih akreditasi</option>
                {ACCREDITATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <p className="admin-required-note">* Kolom wajib diisi.</p>
          </div>
          <div className="campus-form-actions">
            <Link to="/admin/reference-data" className="admin-button admin-button-outline">Batal</Link>
            <button type="submit" className="admin-button admin-button-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      )}
    </section>
  );
}
