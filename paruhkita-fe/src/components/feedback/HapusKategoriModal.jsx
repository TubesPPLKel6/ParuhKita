import React from 'react';
import { X } from 'lucide-react';
import ModalShell from './ModalShell';

export default function HapusKategoriModal({ category, onClose, onConfirm, deleting }) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-[600px]">
      <div className="relative px-7 pb-2 pt-7">
        <h2 className="text-[19px] font-extrabold tracking-tight text-pk-primary">Hapus Kategori?</h2>
        <p className="mt-2 pr-12 text-[12px] leading-relaxed text-pk-muted">
          Kategori ini akan dihapus dari draf evaluasi beserta nilai skornya.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-lg bg-pk-soft text-pk-navy transition hover:bg-pk-border"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-7 pb-6">
        <div className="mt-3 rounded-lg bg-pk-canvas px-4 py-3.5">
          <p className="text-[12px] font-bold text-pk-navy">{category?.name}</p>
          <p className="mt-1 text-[11px] text-pk-muted">Skor: {category?.score ?? '-'} / 5</p>
        </div>

        <div className="mt-4 rounded-lg bg-[#FFF1F0] px-4 py-3">
          <p className="text-[11.5px] font-semibold text-[#B42318]">Tindakan ini tidak dapat dibatalkan.</p>
          <p className="mt-0.5 text-[11px] text-[#B42318]/90">Status lamaran dan kategori lain tidak berubah.</p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-pk-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-pk-border bg-white px-5 py-2.5 text-[12px] font-semibold text-pk-muted transition hover:bg-pk-soft"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-[#C43224] px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#a5281d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Menghapus...' : 'Ya, Hapus Kategori'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
