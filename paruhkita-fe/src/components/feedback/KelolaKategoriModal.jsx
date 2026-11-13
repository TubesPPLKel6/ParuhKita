import React from 'react';
import { Plus, X } from 'lucide-react';
import ModalShell from './ModalShell';

export default function KelolaKategoriModal({ categories, message, onClose, onAdd, onEdit, onDelete }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="relative px-8 pb-2 pt-7">
        <h2 className="text-[20px] font-extrabold tracking-tight text-pk-primary">Kelola Kategori</h2>
        <p className="mt-2 pr-12 text-[12px] leading-relaxed text-pk-muted">
          Atur kategori penilaian dan skor kandidat. Perubahan disimpan sebagai draf sebelum feedback dikirim.
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

      <div className="px-8 pb-7">
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-[12.5px] font-bold text-pk-navy">Kategori penilaian</p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-pk-primary px-4 py-2.5 text-[11.5px] font-bold text-white transition hover:bg-pk-navy"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Kategori
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {categories.length === 0 && (
            <p className="rounded-lg border border-dashed border-pk-border px-4 py-6 text-center text-[11.5px] text-pk-muted">
              Belum ada kategori penilaian.
            </p>
          )}

          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-pk-border bg-white px-4 py-[18px]"
            >
              <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-pk-navy">{category.name}</p>
              <span className="rounded bg-pk-info px-2.5 py-1 text-[11px] font-semibold text-pk-navy">
                {category.score ?? '-'} / 5
              </span>
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="rounded-md border border-pk-border bg-white px-3.5 py-1.5 text-[11px] font-semibold text-pk-navy transition hover:bg-pk-soft"
              >
                Ubah
              </button>
              <button
                type="button"
                onClick={() => onDelete(category)}
                disabled={categories.length <= 1}
                title={categories.length <= 1 ? 'Minimal satu kategori penilaian harus tersisa.' : undefined}
                className="rounded-md border border-pk-border bg-white px-3.5 py-1.5 text-[11px] font-semibold text-[#C43224] transition hover:bg-[#FFF1F0] disabled:cursor-not-allowed disabled:border-pk-line disabled:text-pk-hint disabled:hover:bg-white"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>

        {message ? (
          <div className="mt-4 rounded-lg bg-[#EDF9F1] px-4 py-3">
            <p className="text-[11.5px] font-semibold text-[#157347]">{message.title}</p>
            <p className="mt-0.5 text-[11px] text-[#157347]/90">{message.detail}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-[#EDF7FC] px-4 py-3">
            <p className="text-[11.5px] font-semibold text-pk-navy">Perubahan hanya berlaku pada evaluasi ini</p>
            <p className="mt-0.5 text-[11px] text-pk-muted">Perubahan kategori tersimpan dalam draf evaluasi.</p>
          </div>
        )}

        <div className="mt-5 flex justify-end border-t border-pk-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-pk-primary px-6 py-2.5 text-[12px] font-bold text-white transition hover:bg-pk-navy"
          >
            Selesai
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
