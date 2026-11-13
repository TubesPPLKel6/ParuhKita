import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Upload, X } from 'lucide-react';
import api from '../../api/axios';

const requiredDocuments = [
  { key: 'ktp', label: 'KTP pemilik usaha' },
  { key: 'nib', label: 'NIB / bukti pendaftaran usaha' },
  { key: 'business_license', label: 'Izin usaha (SIUP atau setara)' },
  { key: 'store_photo', label: 'Foto lokasi usaha' },
  { key: 'npwp', label: 'NPWP' },
];

export default function ModalVerifikasiMerchant({ isOpen, onClose, onSubmitted }) {
  const [files, setFiles] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const formData = new FormData();
    requiredDocuments.forEach(({ key }) => formData.append(key, files[key]));

    try {
      const response = await api.post('/v1/merchant/verification', formData);
      onSubmitted(response.data.data);
      onClose();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;
      setErrorMessage(
        firstValidationError
          || error.response?.data?.message
          || (error.request
            ? 'Tidak dapat terhubung ke server. Silakan coba kembali.'
            : error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-[#D8E5EE] bg-white shadow-xl">
        <div className="flex items-center justify-between bg-[#03045E] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#00B4D8]" />
            <h2 className="text-sm font-extrabold">Verifikasi Data Usaha</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <p className="text-xs leading-relaxed text-[#536B82]">
            Unggah seluruh dokumen berikut agar tim ParuhKita dapat memverifikasi usaha. Format PDF, JPG, atau PNG, maksimal 5 MB per file.
          </p>

          {errorMessage && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            {requiredDocuments.map(({ key, label }) => (
              <label key={key} className="block rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-3">
                <span className="mb-2 block text-xs font-semibold text-[#03045E]">{label} *</span>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4 shrink-0 text-[#023E8A]" />
                  <input
                    type="file"
                    name={key}
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    required
                    onChange={(event) => {
                      setFiles((current) => ({ ...current, [key]: event.target.files?.[0] }));
                      setErrorMessage('');
                    }}
                    className="w-full text-xs text-[#536B82] file:mr-3 file:rounded-lg file:border-0 file:bg-[#CAF0F8] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#023E8A]"
                  />
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-[#D8E5EE] pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#D8E5EE] px-4 py-2 text-xs font-bold text-[#536B82] transition hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#023E8A] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#03045E] disabled:cursor-wait disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Mengirim...' : 'Kirim untuk Verifikasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
