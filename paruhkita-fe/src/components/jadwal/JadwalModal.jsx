import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { addDays, toISO } from './JadwalCalendar';

const DAY_INDEX = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 0 };

function buildTimeSlots() {
  const slots = [];
  for (let hour = 8; hour < 20; hour += 1) {
    for (const minute of [0, 30]) {
      const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const endMinutes = hour * 60 + minute + 30;
      const end = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
      slots.push({ value: start, end, label: `${start.replace(':', '.')} – ${end.replace(':', '.')}` });
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

function addMinutes(time, minutes) {
  const [hour, minute] = time.split(':').map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function nextDateForDay(dayName) {
  const target = DAY_INDEX[dayName];
  if (target === undefined) return toISO(new Date());
  const today = new Date();
  const current = today.getDay();
  let diff = (target - current + 7) % 7;
  if (diff === 0) diff = 7;
  return toISO(addDays(today, diff));
}

const EMPTY_FORM = {
  application_id: '',
  availability_id: '',
  scheduled_date: '',
  start_time: '',
  end_time: '',
  location: '',
};

export default function JadwalModal({ open, mode = 'create', schedule, defaultDate = '', candidates, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && schedule) {
      setForm({
        application_id: String(schedule.job_application_id || ''),
        availability_id: schedule.availability_label || '',
        scheduled_date: schedule.scheduled_date || '',
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        location: schedule.location || '',
      });
    } else {
      setForm({ ...EMPTY_FORM, scheduled_date: defaultDate || '' });
    }
    setErrors({});
    setSubmitError('');
  }, [open, mode, schedule, defaultDate]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => String(candidate.application_id) === String(form.application_id)),
    [candidates, form.application_id]
  );

  const availabilityOptions = useMemo(() => {
    const options = [...(selectedCandidate?.availability || [])];
    if (form.availability_id && !options.some((item) => item.label === form.availability_id)) {
      options.unshift({
        id: 'tersimpan',
        day_of_week: '',
        start_time: '',
        end_time: '',
        label: form.availability_id,
      });
    }
    return options;
  }, [selectedCandidate, form.availability_id]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError('');
  };

  const handleCandidateChange = (value) => {
    setForm((current) => ({
      ...current,
      application_id: value,
      availability_id: '',
      location: current.location,
    }));
    setErrors({});
    setSubmitError('');
  };

  const handleAvailabilityChange = (value) => {
    const availability = availabilityOptions.find((item) => item.label === value);
    setForm((current) => {
      if (!availability) return { ...current, availability_id: value };
      return {
        ...current,
        availability_id: value,
        scheduled_date: current.scheduled_date || nextDateForDay(availability.day_of_week),
        start_time: availability.start_time,
        end_time: addMinutes(availability.start_time, 30),
      };
    });
    setErrors((current) => ({ ...current, availability_id: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.application_id) nextErrors.application_id = 'Nama kandidat wajib dipilih.';
    if (!form.availability_id) nextErrors.availability_id = 'Ketersediaan jadwal wajib dipilih.';
    if (!form.scheduled_date) nextErrors.scheduled_date = 'Tanggal seleksi wajib diisi.';
    if (!form.start_time) nextErrors.start_time = 'Waktu seleksi wajib dipilih.';
    if (!form.location.trim()) nextErrors.location = 'Lokasi atau link pertemuan wajib diisi.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!validate()) return;

    const isOnline = /^https?:\/\//i.test(form.location.trim());

    try {
      await onSubmit({
        job_application_id: Number(form.application_id),
        availability_label: form.availability_id,
        scheduled_date: form.scheduled_date,
        start_time: form.start_time,
        end_time: form.end_time || addMinutes(form.start_time, 30),
        location: form.location.trim(),
        interview_type: isOnline ? 'online' : 'tatap_muka',
      });
    } catch (error) {
      const response = error?.response;
      if (response?.status === 422 && response.data?.errors) {
        const fieldMap = {
          job_application_id: 'application_id',
          scheduled_date: 'scheduled_date',
          start_time: 'start_time',
          end_time: 'start_time',
          location: 'location',
        };
        const mapped = {};
        Object.entries(response.data.errors).forEach(([field, messages]) => {
          const key = fieldMap[field] || field;
          mapped[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors((current) => ({ ...current, ...mapped }));
        setSubmitError(mapped.start_time || mapped.application_id || 'Periksa kembali data jadwal.');
      } else {
        setSubmitError(response?.data?.message || 'Jadwal gagal disimpan. Coba lagi.');
      }
    }
  };

  if (!open) return null;

  const locationIsOnline = /^https?:\/\//i.test(form.location.trim());

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#040F21]/60 px-4 py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="mx-auto w-full max-w-[700px] rounded-2xl bg-white shadow-2xl">
        <div className="relative border-b border-pk-border px-8 py-6">
          <h2 className="text-[22px] font-extrabold tracking-tight text-pk-primary">
            {mode === 'edit' ? 'Ubah jadwal wawancara' : 'Tambah jadwal wawancara'}
          </h2>
          <p className="mt-1.5 text-[13px] text-pk-muted">Atur pertemuan seleksi untuk kandidat pilihanmu.</p>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-lg bg-pk-soft text-pk-navy transition hover:bg-pk-border"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-8 py-6">
            {submitError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
                {submitError}
              </p>
            )}

            <div>
              <label htmlFor="kandidat" className="text-[13px] font-semibold text-pk-navy">
                Nama kandidat <span className="text-pk-navy">*</span>
              </label>
              <div className="relative mt-2">
                <select
                  id="kandidat"
                  value={form.application_id}
                  onChange={(event) => handleCandidateChange(event.target.value)}
                  className={`h-[52px] w-full appearance-none rounded-lg border bg-white px-4 pr-11 text-[13px] outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/30 ${
                    errors.application_id ? 'border-rose-300' : 'border-pk-border'
                  } ${form.application_id ? 'text-[#102C4D]' : 'text-pk-placeholder'}`}
                >
                  <option value="">Pilih kandidat</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.application_id} value={candidate.application_id}>
                      {candidate.candidate.name} — {candidate.job_title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
              </div>
              {errors.application_id ? (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.application_id}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-pk-hint">Pilih kandidat yang akan mengikuti wawancara.</p>
              )}
            </div>

            <div>
              <label htmlFor="ketersediaan" className="text-[13px] font-semibold text-pk-navy">
                Ketersediaan jadwal <span className="text-pk-navy">*</span>
              </label>
              <div className="relative mt-2">
                <select
                  id="ketersediaan"
                  value={form.availability_id}
                  onChange={(event) => handleAvailabilityChange(event.target.value)}
                  disabled={!selectedCandidate}
                  className={`h-[52px] w-full appearance-none rounded-lg border bg-white px-4 pr-11 text-[13px] outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/30 disabled:bg-pk-soft disabled:text-pk-hint ${
                    errors.availability_id ? 'border-rose-300' : 'border-pk-border'
                  } ${form.availability_id ? 'text-[#102C4D]' : 'text-pk-placeholder'}`}
                >
                  <option value="">Pilih jadwal tersedia kandidat</option>
                  {availabilityOptions.map((availability) => (
                    <option key={availability.id} value={availability.label}>
                      {availability.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
              </div>
              {errors.availability_id ? (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.availability_id}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-pk-hint">
                  Sesuaikan ketersediaan waktu kerja kandidat yang dipilih.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tanggal" className="text-[13px] font-semibold text-pk-navy">
                  Tanggal seleksi <span className="text-pk-navy">*</span>
                </label>
                <div className="relative mt-2">
                  <input
                    id="tanggal"
                    type="date"
                    value={form.scheduled_date}
                    onChange={(event) => update('scheduled_date', event.target.value)}
                    className={`h-[52px] w-full rounded-lg border bg-white px-4 text-[13px] text-[#102C4D] outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/30 ${
                      errors.scheduled_date ? 'border-rose-300' : 'border-pk-border'
                    }`}
                  />
                </div>
                {errors.scheduled_date && <p className="mt-1.5 text-[11px] text-rose-600">{errors.scheduled_date}</p>}
              </div>

              <div>
                <label htmlFor="waktu" className="text-[13px] font-semibold text-pk-navy">
                  Waktu seleksi <span className="text-pk-navy">*</span>
                </label>
                <div className="relative mt-2">
                  <select
                    id="waktu"
                    value={form.start_time}
                    onChange={(event) => {
                      const slot = TIME_SLOTS.find((item) => item.value === event.target.value);
                      setForm((current) => ({
                        ...current,
                        start_time: event.target.value,
                        end_time: slot ? slot.end : current.end_time,
                      }));
                      setErrors((current) => ({ ...current, start_time: undefined }));
                    }}
                    className={`h-[52px] w-full appearance-none rounded-lg border bg-white px-4 pr-11 text-[13px] outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/30 ${
                      errors.start_time ? 'border-rose-300' : 'border-pk-border'
                    } ${form.start_time ? 'text-[#102C4D]' : 'text-pk-placeholder'}`}
                  >
                    <option value="">09.00 – 09.30</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
                </div>
                <p className="mt-1.5 text-[11px] text-pk-hint">Zona waktu: WIB (UTC+7)</p>
                {errors.start_time && <p className="text-[11px] text-rose-600">{errors.start_time}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="lokasi" className="text-[13px] font-semibold text-pk-navy">
                Lokasi / link pertemuan <span className="text-pk-navy">*</span>
              </label>
              <input
                id="lokasi"
                type="text"
                value={form.location}
                onChange={(event) => update('location', event.target.value)}
                placeholder="Masukkan alamat atau link pertemuan"
                className={`mt-2 h-[52px] w-full rounded-lg border bg-white px-4 text-[13px] text-[#102C4D] placeholder:text-pk-placeholder outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/30 ${
                  errors.location ? 'border-rose-300' : 'border-pk-border'
                }`}
              />
              {errors.location ? (
                <p className="mt-1.5 text-[11px] text-rose-600">{errors.location}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-pk-hint">
                  {locationIsOnline ? 'Online: link Google Meet atau Zoom.' : 'Tatap muka: alamat lengkap. Online: link Google Meet atau Zoom.'}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-pk-info px-4 py-3">
              <p className="text-[11.5px] text-pk-primary">Jadwal sesuai waktu luang kandidat dan langsung dikonfirmasi.</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-pk-border px-8 py-5">
            <p className="text-[11px] text-pk-hint">* Wajib diisi</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-pk-border bg-white px-6 py-2.5 text-[12px] font-semibold text-pk-muted transition hover:bg-pk-soft"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-pk-primary px-6 py-2.5 text-[12px] font-bold text-white transition hover:bg-pk-navy disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : mode === 'edit' ? 'Ubah jadwal' : 'Buat jadwal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
