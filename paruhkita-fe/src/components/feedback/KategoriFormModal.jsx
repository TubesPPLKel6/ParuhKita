import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ModalShell from './ModalShell';

const SCORES = [1, 2, 3, 4, 5];

export default function KategoriFormModal({ mode = 'add', category, onClose, onSubmit, saving }) {
  const [name, setName] = useState('');
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(mode === 'edit' ? category?.name || '' : '');
    setScore(mode === 'edit' ? category?.score ?? null : null);
    setError('');
  }, [mode, category]);

  const isValid = name.trim().length > 0 && score !== null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || saving) return;

    try {
      await onSubmit({ name: name.trim(), score });
    } catch (submitError) {
      const response = submitError?.response;
      setError(
        response?.data?.errors?.name?.[0]
          || response?.data?.message
          || 'Kategori gagal disimpan. Coba lagi.'
      );
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-[680px]">
      <div className="relative px-8 pb-2 pt-7">
        <h2 className="text-[20px] font-extrabold tracking-tight text-pk-primary">
          {mode === 'edit' ? 'Ubah Kategori' : 'Tambah Kategori'}
        </h2>
        <p className="mt-2 pr-12 text-[12px] leading-relaxed text-pk-muted">
          {mode === 'edit'
            ? 'Perbarui nama atau skor kategori penilaian kandidat.'
            : 'Tambahkan aspek penilaian sesuai kebutuhan evaluasi kandidat.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-7 top-7 flex h-8 w-8 items-center justify-center rounded-lg bg-pk-soft text-pk-navy transition hover:bg-pk-border"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-8 pb-7">
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11.5px] text-rose-700">
            {error}
          </p>
        )}

        <label htmlFor="nama-kategori" className="text-[11.5px] font-semibold text-pk-navy">
          Nama kategori <span>*</span>
        </label>
        <textarea
          id="nama-kategori"
          rows={3}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tuliskan kategori yang ingin dinilai, misalnya Komunikasi"
          className="mt-2 w-full resize-none rounded-lg border border-pk-border bg-white px-4 py-3 text-[12px] leading-relaxed text-pk-body placeholder:text-pk-hint outline-none transition focus:border-pk-cyan focus:ring-2 focus:ring-pk-cyan/25"
        />
        <p className="mt-1.5 text-[10.5px] text-pk-hint">Gunakan nama kategori yang singkat dan jelas.</p>

        <p className="mt-5 text-[11.5px] font-semibold text-pk-navy">
          Skor penilaian (1–5) <span>*</span>
        </p>
        <div className="mt-2 grid grid-cols-5 gap-2.5">
          {SCORES.map((value) => {
            const selected = score === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setScore(value)}
                className={`h-11 rounded-md border text-[12px] font-semibold transition ${
                  selected
                    ? 'border-pk-primary bg-pk-primary text-white'
                    : 'border-pk-border bg-white text-pk-navy hover:bg-pk-soft'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg bg-pk-info px-4 py-3">
          <p className="text-[11.5px] text-pk-navy">
            Skor dipilih: <span className="font-bold">{score ?? '-'} / 5</span>
          </p>
        </div>

        <p className="mt-2 text-[10.5px] text-pk-hint">1 = Perlu peningkatan · 3 = Cukup · 5 = Sangat baik</p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-pk-border pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-pk-border bg-white px-5 py-2.5 text-[12px] font-semibold text-pk-muted transition hover:bg-pk-soft"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isValid || saving}
            className={`rounded-md px-5 py-2.5 text-[12px] font-bold transition ${
              isValid && !saving
                ? 'bg-pk-primary text-white hover:bg-pk-navy'
                : 'cursor-not-allowed bg-pk-border text-pk-hint'
            }`}
          >
            {saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
