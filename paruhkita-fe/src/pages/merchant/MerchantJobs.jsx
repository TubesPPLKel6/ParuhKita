import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import api from '../../api/axios';
import MerchantShell from '../../components/merchant/MerchantShell';

const EMPTY_FORM = {
  title: '',
  location: '',
  category: '',
  subcategory: '',
  schedule: '',
  wage: '',
  quota: '',
  application_deadline: '',
  description: '',
  responsibilities: '',
  qualifications: '',
  workDays: [],
  startTime: '16:00',
  endTime: '20:00',
};

const WORK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAY_ALIASES = { Senin: 'Sen', Selasa: 'Sel', Rabu: 'Rab', Kamis: 'Kam', Jumat: 'Jum', Sabtu: 'Sab', Minggu: 'Min' };

function parseSchedule(schedule) {
  const [daysPart = '', timesPart = ''] = (schedule || '').split(' · ');
  const workDays = daysPart
    .split(',')
    .map((day) => DAY_ALIASES[day.trim()] || day.trim())
    .filter((day) => WORK_DAYS.includes(day));
  const [startTime = '16:00', endTime = '20:00'] = timesPart.split(/\s*[-–]\s*/);

  return {
    workDays,
    startTime: /^\d{2}[:.]\d{2}$/.test(startTime) ? startTime.replace('.', ':') : '16:00',
    endTime: /^\d{2}[:.]\d{2}$/.test(endTime) ? endTime.replace('.', ':') : '20:00',
  };
}

function formFromJob(job) {
  const schedule = parseSchedule(job?.schedule);
  return {
    title: job?.title || '',
    location: job?.location || job?.merchant_profile?.address || '',
    category: job?.category || '',
    subcategory: job?.subcategory || '',
    wage: job?.wage || '',
    quota: job?.quota || '',
    application_deadline: job?.application_deadline?.slice(0, 10) || '',
    description: job?.description || '',
    responsibilities: job?.responsibilities || '',
    qualifications: job?.qualifications || '',
    ...schedule,
  };
}

function formatDate(value) {
  if (!value) return 'Tidak ditentukan';
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.errors
    ? Object.values(error.response.data.errors)[0]?.[0] || fallback
    : error.response?.data?.message || (error.request ? fallback : error.message);
}

export default function MerchantJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/v1/merchant/jobs'), api.get('/v1/reference/job-categories')])
      .then(([jobsResponse, categoriesResponse]) => {
        if (!active) return;
        const loadedJobs = jobsResponse.data.data || [];
        setJobs(loadedJobs);
        setSelectedJob(loadedJobs[0] || null);
        setCategories(categoriesResponse.data.data || []);
      })
      .catch((error) => {
        if (active) setErrorMessage(getErrorMessage(error, 'Tidak dapat memuat data lowongan.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setForm(formFromJob(selectedJob));
    setFormError('');
  }, [selectedJob]);

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.location || ''} ${job.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [jobs, search, statusFilter]);

  const activeJobs = jobs.filter((job) => job.status === 'active');
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0);
  const availablePositions = activeJobs.reduce((sum, job) => sum + Number(job.remaining_quota ?? job.quota ?? 0), 0);

  const startNewJob = () => {
    setSelectedJob(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' ? { subcategory: '' } : {}),
    }));
  };

  const toggleWorkDay = (day) => {
    setForm((current) => ({
      ...current,
      workDays: current.workDays.includes(day)
        ? current.workDays.filter((selectedDay) => selectedDay !== day)
        : [...current.workDays, day],
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (form.workDays.length === 0) {
      setFormError('Pilih minimal satu hari kerja.');
      return;
    }
    if (form.startTime >= form.endTime) {
      setFormError('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        quota: Number(form.quota),
        schedule: `${form.workDays.join(', ')} · ${form.startTime}–${form.endTime}`,
        subcategory: form.subcategory || null,
        application_deadline: form.application_deadline || null,
        description: form.description || null,
        responsibilities: form.responsibilities || null,
        qualifications: form.qualifications || null,
      };
      const response = selectedJob
        ? await api.put(`/v1/merchant/jobs/${selectedJob.id}`, payload)
        : await api.post('/v1/merchant/jobs', payload);
      const savedJob = response.data.data;
      setJobs((current) => selectedJob
        ? current.map((job) => job.id === savedJob.id ? { ...job, ...savedJob } : job)
        : [savedJob, ...current]);
      setSelectedJob(savedJob);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Tidak dapat menyimpan lowongan.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobToDelete = selectedJob) => {
    if (!jobToDelete) return;
    const hasApplicants = jobToDelete.applications_count > 0;
    const action = hasApplicants ? 'mengarsipkan' : 'menghapus';
    if (!window.confirm(`Yakin ingin ${action} lowongan "${jobToDelete.title}"?`)) return;

    try {
      const response = await api.delete(`/v1/merchant/jobs/${jobToDelete.id}`);
      const updatedJob = response.data.data;
      if (hasApplicants) {
        setJobs((current) => current.map((job) => job.id === updatedJob.id ? { ...job, ...updatedJob } : job));
        setSelectedJob({ ...jobToDelete, ...updatedJob });
      } else {
        const remainingJobs = jobs.filter((job) => job.id !== jobToDelete.id);
        setJobs(remainingJobs);
        setSelectedJob(remainingJobs[0] || null);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, `Tidak dapat ${action} lowongan.`));
    }
  };

  return (
    <MerchantShell
      active="Lowongan"
      activeTopNav="Lowongan"
      counts={{ jobs: activeJobs.length }}
      contentClassName="px-5 py-6 lg:px-8 lg:py-7"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-pk-muted">Ruang merchant / lowongan</p>
            <h1 className="mt-1 text-2xl font-extrabold text-pk-navy">Kelola lowongan</h1>
            <p className="mt-1 text-xs text-pk-muted">Atur lowongan Kopi Sela dan temukan talenta untuk shift berikutnya.</p>
          </div>
          <button type="button" onClick={startNewJob} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pk-gold px-4 py-2.5 text-xs font-bold text-pk-navy shadow-xs hover:bg-amber-400">
            <Plus className="h-4 w-4" /> Tambah Lowongan
          </button>
        </div>

        {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ['Lowongan aktif', activeJobs.length, 'Semua lowongan sedang tayang', BriefcaseBusiness],
            ['Posisi tersedia', availablePositions, 'Total kuota lowongan aktif', CheckCircle2],
            ['Total pelamar', totalApplicants, 'Dari seluruh lowonganmu', Users],
          ].map(([label, value, note, Icon]) => (
            <div key={label} className="rounded-2xl border border-pk-border bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pk-muted">{label}</span>
                <Icon className="h-4 w-4 text-pk-primary" />
              </div>
              <p className="mt-2 text-2xl font-black text-pk-navy">{value}</p>
              <p className="mt-1 text-[10px] text-pk-muted">{note}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-pk-border bg-white p-4 shadow-xs sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama lowongan..." className="w-full rounded-xl border border-pk-border bg-pk-canvas py-2.5 pl-9 pr-3 text-xs text-pk-navy outline-none focus:border-pk-cyan" />
            </label>
            <label className="relative">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-pk-border bg-white py-2.5 pl-3 pr-9 text-xs font-semibold text-pk-navy outline-none sm:w-40">
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="archived">Diarsipkan</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-muted" />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[690px] text-left">
              <thead className="border-y border-pk-border text-[10px] font-bold uppercase text-pk-muted">
                <tr>
                  <th className="px-3 py-3">Lowongan</th>
                  <th className="px-3 py-3">Jadwal & upah</th>
                  <th className="px-3 py-3">Pendaftar</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pk-border text-xs">
                {loading && <tr><td colSpan="5" className="px-3 py-8 text-center text-pk-muted">Memuat lowongan...</td></tr>}
                {!loading && filteredJobs.length === 0 && <tr><td colSpan="5" className="px-3 py-8 text-center text-pk-muted">Belum ada lowongan yang sesuai.</td></tr>}
                {filteredJobs.map((job) => (
                  <tr key={job.id} className={`transition hover:bg-pk-canvas ${selectedJob?.id === job.id ? 'bg-pk-pastel/40' : ''}`}>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setSelectedJob(job)} className="text-left">
                        <p className="font-bold text-pk-primary">{job.title}</p>
                        <p className="mt-1 text-[10px] text-pk-muted">{job.quota} posisi · {job.location || 'Lokasi belum diisi'}</p>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-pk-muted"><p>{job.schedule}</p><p className="mt-1 font-bold text-pk-navy">{job.wage}</p></td>
                    <td className="px-3 py-3 font-semibold text-pk-navy">{job.applications_count || 0} pelamar</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${job.status === 'active' ? 'bg-pk-cyan text-pk-navy' : 'bg-slate-100 text-pk-muted'}`}>{job.status === 'active' ? 'Aktif' : 'Diarsipkan'}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setSelectedJob(job)} className="rounded-lg border border-pk-border p-1.5 text-pk-primary hover:bg-pk-soft" title="Lihat detail"><Eye className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => { setSelectedJob(job); setForm(formFromJob(job)); }} className="rounded-lg border border-pk-border p-1.5 text-pk-primary hover:bg-pk-soft" title="Edit lowongan"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => handleDelete(job)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50" title={job.applications_count ? 'Arsipkan lowongan' : 'Hapus lowongan'}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
          <section className="rounded-2xl border border-pk-border bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-pk-border pb-3">
              <div>
                <h2 className="text-base font-bold text-pk-navy">Formulir lowongan</h2>
                <p className="mt-0.5 text-[10px] text-pk-muted">{selectedJob ? 'Ubah informasi lowongan yang dipilih.' : 'Buat lowongan baru untuk kandidat mahasiswa.'}</p>
              </div>
              <BriefcaseBusiness className="h-5 w-5 text-pk-primary" />
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nama lowongan" name="title" value={form.title} onChange={handleChange} required placeholder="Contoh: Barista paruh waktu" />
                <Field label="Lokasi kerja" name="location" value={form.location} onChange={handleChange} required placeholder="Contoh: Gejayan, Yogyakarta" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField label="Jenis pekerjaan" name="category" value={form.category} onChange={handleChange} required options={categories.map((category) => ({ value: category.name, label: category.name }))} />
                <SelectField label="Subkategori" name="subcategory" value={form.subcategory} onChange={handleChange} options={(categories.find((category) => category.name === form.category)?.subcategories || []).map((category) => ({ value: category.name, label: category.name }))} placeholder="Pilih subkategori (opsional)" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Jumlah posisi" name="quota" type="number" min="1" value={form.quota} onChange={handleChange} required placeholder="2" />
                <Field label="Upah per jam" name="wage" value={form.wage} onChange={handleChange} required placeholder="Rp25.000/jam" />
              </div>
              <div>
                <span className="mb-1.5 block text-[11px] font-semibold text-pk-navy">Hari kerja *</span>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {WORK_DAYS.map((day) => {
                    const selected = form.workDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkDay(day)}
                        className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition ${
                          selected
                            ? 'border-pk-cyan bg-pk-pastel text-pk-primary'
                            : 'border-pk-border bg-white text-pk-muted hover:border-pk-cyan'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-pk-muted">Pilih satu atau beberapa hari sesuai kebutuhan shift.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Jam mulai *" name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
                <Field label="Jam selesai *" name="endTime" type="time" value={form.endTime} onChange={handleChange} required />
              </div>
              <Field label="Tenggat pendaftaran" name="application_deadline" type="date" min={new Date().toISOString().slice(0, 10)} value={form.application_deadline} onChange={handleChange} />
              <TextAreaField label="Deskripsi pekerjaan" name="description" value={form.description} onChange={handleChange} required placeholder="Jelaskan gambaran pekerjaan..." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextAreaField label="Tanggung jawab" name="responsibilities" value={form.responsibilities} onChange={handleChange} placeholder="Tugas utama kandidat..." />
                <TextAreaField label="Kualifikasi" name="qualifications" value={form.qualifications} onChange={handleChange} required placeholder="Kriteria kandidat..." />
              </div>
              {formError && <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-[11px] text-rose-700">{formError}</p>}
              <div className="flex flex-wrap justify-end gap-2 border-t border-pk-border pt-4">
                {selectedJob && <button type="button" onClick={startNewJob} className="rounded-xl border border-pk-border px-4 py-2.5 text-xs font-bold text-pk-muted hover:bg-pk-canvas">Batal</button>}
                <button type="submit" disabled={saving} className="rounded-xl bg-pk-gold px-5 py-2.5 text-xs font-bold text-pk-navy hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Menyimpan...' : selectedJob ? 'Simpan perubahan' : 'Publikasikan lowongan'}</button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-pk-border bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-pk-navy">Detail lowongan</h2>
                <Eye className="h-4 w-4 text-pk-primary" />
              </div>
              {selectedJob ? (
                <div className="mt-3">
                  <div className="rounded-xl bg-pk-pastel p-4">
                    <span className="rounded-md bg-pk-cyan px-2 py-1 text-[10px] font-bold text-pk-navy">{selectedJob.status === 'active' ? 'Aktif' : 'Diarsipkan'}</span>
                    <h3 className="mt-3 text-base font-extrabold text-pk-navy">{selectedJob.title}</h3>
                    <p className="mt-1 text-[11px] text-pk-muted">{selectedJob.category} · {selectedJob.location || 'Lokasi belum diisi'}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                    <Info icon={Users} label="Posisi tersedia" value={`${selectedJob.quota} posisi`} />
                    <Info icon={Users} label="Total pelamar" value={`${selectedJob.applications_count || 0} pelamar`} />
                    <Info icon={CalendarDays} label="Tenggat" value={formatDate(selectedJob.application_deadline)} />
                    <Info icon={Clock3} label="Jadwal" value={selectedJob.schedule} />
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-pk-muted">{selectedJob.description || 'Belum ada deskripsi pekerjaan.'}</p>
                  <button type="button" onClick={() => navigate(`/merchant/jobs/${selectedJob.id}/applicants`)} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pk-primary hover:underline">Lihat pelamar <ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
                </div>
              ) : <p className="mt-4 rounded-xl bg-pk-canvas p-4 text-xs text-pk-muted">Pilih lowongan untuk melihat detailnya.</p>}
            </section>
            {selectedJob && (
              <section className="rounded-2xl border border-pk-border bg-white p-4 shadow-xs">
                <h2 className="text-sm font-bold text-pk-navy">{selectedJob.applications_count ? 'Arsipkan lowongan' : 'Hapus lowongan'}</h2>
                <p className="mt-1 text-[10px] leading-relaxed text-pk-muted">{selectedJob.applications_count ? 'Lowongan dengan lamaran tidak dihapus agar riwayat kandidat tetap aman.' : 'Lowongan yang dihapus tidak dapat dikembalikan.'}</p>
                <button type="button" onClick={handleDelete} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50">{selectedJob.applications_count ? <Archive className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}{selectedJob.applications_count ? 'Arsipkan lowongan' : 'Hapus lowongan'}</button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </MerchantShell>
  );
}

function Field({ label, name, value, onChange, type = 'text', required = false, ...props }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-pk-navy">{label}{required && ' *'}</span><input type={type} name={name} value={value} onChange={onChange} required={required} className="w-full rounded-lg border border-pk-border bg-pk-canvas px-3 py-2.5 text-xs text-pk-navy outline-none focus:border-pk-cyan" {...props} /></label>;
}

function SelectField({ label, name, value, onChange, options, placeholder = 'Pilih opsi', required = false }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-pk-navy">{label}{required && ' *'}</span><span className="relative block"><select name={name} value={value} onChange={onChange} required={required} className="w-full appearance-none rounded-lg border border-pk-border bg-pk-canvas px-3 py-2.5 pr-8 text-xs text-pk-navy outline-none focus:border-pk-cyan"><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pk-muted" /></span></label>;
}

function TextAreaField({ label, name, value, onChange, required = false, ...props }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold text-pk-navy">{label}{required && ' *'}</span><textarea name={name} value={value} onChange={onChange} required={required} rows="3" className="w-full resize-y rounded-lg border border-pk-border bg-pk-canvas px-3 py-2.5 text-xs text-pk-navy outline-none focus:border-pk-cyan" {...props} /></label>;
}

function Info({ icon: Icon, label, value }) {
  return <div><p className="text-[10px] text-pk-muted">{label}</p><p className="mt-1 flex items-start gap-1 font-bold text-pk-navy"><Icon className="mt-0.5 h-3 w-3 shrink-0 text-pk-primary" />{value}</p></div>;
}
