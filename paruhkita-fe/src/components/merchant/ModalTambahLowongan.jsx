import React, { useEffect, useState } from 'react';
import { X, Briefcase, PlusCircle } from 'lucide-react';
import api from '../../api/axios';

const WORK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAY_ALIASES = { Senin: 'Sen', Selasa: 'Sel', Rabu: 'Rab', Kamis: 'Kam', Jumat: 'Jum', Sabtu: 'Sab', Minggu: 'Min' };

function parseSchedule(schedule) {
  const [daysPart = '', timesPart = ''] = (schedule || '').split(' · ');
  const [jamMulai = '16:00', jamSelesai = '20:00'] = timesPart.split(/\s*[-–]\s*/);
  return {
    hariKerja: daysPart.split(',').map((day) => DAY_ALIASES[day.trim()] || day.trim()).filter((day) => WORK_DAYS.includes(day)),
    jamMulai: /^\d{2}[:.]\d{2}$/.test(jamMulai) ? jamMulai.replace('.', ':') : '16:00',
    jamSelesai: /^\d{2}[:.]\d{2}$/.test(jamSelesai) ? jamSelesai.replace('.', ':') : '20:00',
  };
}

export default function ModalTambahLowongan({ isOpen, onClose, onTambahLowongan, job }) {
  const schedule = parseSchedule(job?.schedule);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => ({
    judul: job?.title || '',
    lokasi: job?.location || '',
    kategori: job?.category || '',
    subkategori: job?.subcategory || '',
    hariKerja: schedule.hariKerja,
    jamMulai: schedule.jamMulai,
    jamSelesai: schedule.jamSelesai,
    upah: job?.wage || 'Rp18.000 / jam',
    kuota: job?.quota || '2 orang',
    deskripsi: job?.description || '',
    responsibilities: job?.responsibilities || '',
    qualifications: job?.qualifications || '',
    application_deadline: job?.application_deadline || '',
  }));

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    setCategoriesLoading(true);
    setCategoryError('');
    api.get('/v1/reference/job-categories')
      .then(({ data }) => {
        if (!active) return;
        const availableCategories = data.data || [];
        setCategories(availableCategories);
        setFormData((current) => ({
          ...current,
          kategori: availableCategories.some((category) => category.name === current.kategori)
            ? current.kategori
            : availableCategories[0]?.name || '',
          subkategori: '',
        }));
      })
      .catch((error) => {
        if (active) {
          setCategories([]);
          setCategoryError(error.response?.data?.message || (error.request ? 'Tidak dapat memuat kategori pekerjaan.' : error.message));
        }
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => { active = false; };
  }, [isOpen, job?.id]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'kategori' ? { subkategori: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.judul.trim()) return alert('Mohon isi judul lowongan.');
    if (formData.hariKerja.length === 0) return alert('Pilih minimal satu hari kerja.');
    if (formData.jamMulai >= formData.jamSelesai) return alert('Jam selesai harus lebih akhir dari jam mulai.');

    setSaving(true);
    setCategoryError('');
    try {
      await onTambahLowongan({
        title: formData.judul.trim(),
        location: formData.lokasi.trim(),
        category: formData.kategori,
        subcategory: formData.subkategori || null,
        quota: formData.kuota.trim(),
        schedule: `${formData.hariKerja.join(', ')} · ${formData.jamMulai}–${formData.jamSelesai}`,
        wage: formData.upah.trim(),
        description: formData.deskripsi.trim() || null,
        responsibilities: formData.responsibilities.trim() || null,
        qualifications: formData.qualifications.trim() || null,
        application_deadline: formData.application_deadline || null,
      });
      onClose();
    } catch (error) {
      setCategoryError(error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0]?.[0]
        : error.response?.data?.message || (error.request ? 'Tidak dapat menyimpan lowongan.' : error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-[#D8E5EE] overflow-hidden my-8">
        
        <div className="bg-[#03045E] text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#00B4D8]" />
            <h3 className="font-extrabold text-sm tracking-tight">{job ? 'Ubah Lowongan Pekerjaan' : 'Buat Lowongan Pekerjaan Baru'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Judul Posisi Pekerjaan *</label>
            <input 
              type="text"
              required
              name="judul"
              placeholder="Contoh: Barista Paruh Waktu / Kasir Shift Sore"
              value={formData.judul}
              onChange={handleChange}
              className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Lokasi kerja *</label>
              <input
                type="text"
                required
                name="lokasi"
                placeholder="Contoh: Gejayan, Yogyakarta"
                value={formData.lokasi}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Kategori Pekerjaan *</label>
              <select
                required
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                disabled={categoriesLoading || categories.length === 0}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              >
                <option value="">{categoriesLoading ? 'Memuat kategori...' : 'Pilih kategori'}</option>
                {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
              {categoryError && <p role="alert" className="mt-1 text-[10px] text-rose-600">{categoryError}</p>}
              {!categoriesLoading && !categoryError && categories.length === 0 && <p className="mt-1 text-[10px] text-amber-700">Belum ada kategori. Tambahkan melalui Data Master.</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Subkategori</label>
              <select
                name="subkategori"
                value={formData.subkategori}
                onChange={handleChange}
                disabled={!categories.find((category) => category.name === formData.kategori)?.subcategories?.length}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              >
                <option value="">Pilih subkategori (opsional)</option>
                {(categories.find((category) => category.name === formData.kategori)?.subcategories || []).map((subcategory) => <option key={subcategory.id} value={subcategory.name}>{subcategory.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Jumlah Kuota Pekerja *</label>
              <input 
                type="number"
                min="1"
                required
                name="kuota"
                placeholder="Contoh: 2"
                value={formData.kuota}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Hari kerja *</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {WORK_DAYS.map((day) => {
                const selected = formData.hariKerja.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setFormData((current) => ({
                      ...current,
                      hariKerja: selected
                        ? current.hariKerja.filter((selectedDay) => selectedDay !== day)
                        : [...current.hariKerja, day],
                    }))}
                    className={`rounded-lg border px-2 py-2 text-[10px] font-bold transition ${
                      selected ? 'border-[#00B4D8] bg-[#CAF0F8] text-[#023E8A]' : 'border-[#D8E5EE] bg-white text-[#536B82] hover:border-[#00B4D8]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-[#536B82]">Pilih satu atau beberapa hari sesuai kebutuhan shift.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Jam mulai *</label>
              <input 
                type="time"
                name="jamMulai"
                required
                value={formData.jamMulai}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Jam selesai *</label>
              <input
                type="time"
                name="jamSelesai"
                required
                value={formData.jamSelesai}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Estimasi Upah / Gaji *</label>
            <input
              type="text"
              name="upah"
              placeholder="Rp18.000 / jam"
              value={formData.upah}
              onChange={handleChange}
              className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Deskripsi Tugas</label>
            <textarea 
              name="deskripsi"
              rows="2"
              placeholder="Jelaskan tanggung jawab utama pekerjaan..."
              value={formData.deskripsi}
              onChange={handleChange}
              className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl px-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Tanggung Jawab</label>
              <textarea
                name="responsibilities"
                rows="3"
                value={formData.responsibilities}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] px-3.5 py-2.5 text-xs text-[#03045E] focus:border-[#00B4D8] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Kualifikasi</label>
              <textarea
                name="qualifications"
                rows="3"
                value={formData.qualifications}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] px-3.5 py-2.5 text-xs text-[#03045E] focus:border-[#00B4D8] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Batas Akhir Lamaran</label>
            <input
              type="date"
              name="application_deadline"
              min={new Date().toISOString().slice(0, 10)}
              value={formData.application_deadline ? formData.application_deadline.slice(0, 10) : ''}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] px-3.5 py-2.5 text-xs text-[#03045E] focus:border-[#00B4D8] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#D8E5EE]">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D8E5EE] text-[#536B82] font-bold text-xs rounded-xl hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={categoriesLoading || categories.length === 0 || saving}
              className="px-5 py-2 bg-[#023E8A] hover:bg-[#03045E] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : job ? 'Simpan Perubahan' : 'Publikasikan Lowongan'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
