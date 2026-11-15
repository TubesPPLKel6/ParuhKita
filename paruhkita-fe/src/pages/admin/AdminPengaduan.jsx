import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  User,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Menunggu Tinjauan' },
  { value: 'investigating', label: 'Sedang Diinvestigasi' },
  { value: 'resolved', label: 'Selesai Ditindaklanjuti' },
  { value: 'dismissed', label: 'Ditutup / Tidak Terbukti' },
];

const STATUS_BADGE = {
  submitted: 'bg-amber-100 text-amber-800 border-amber-200',
  investigating: 'bg-sky-100 text-sky-800 border-sky-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  dismissed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function AdminPengaduan() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [status, setStatus] = useState('investigating');
  const [adminNote, setAdminNote] = useState('');
  const [notifyMerchant, setNotifyMerchant] = useState(true);
  const [merchantMessage, setMerchantMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSelectReport = (rep) => {
    setErrorMessage('');
    setSuccessMessage('');
    setSelectedReport(rep);
    setStatus(rep.status === 'submitted' ? 'investigating' : rep.status);
    setAdminNote(rep.admin_note || '');
    setNotifyMerchant(Boolean(rep.merchant_profile_id || rep.job_post?.merchant_profile_id));
    setMerchantMessage('');
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/v1/admin/reports')
      .then(({ data }) => {
        if (!active) return;
        const list = data?.data || [];
        setReports(list);
        if (list.length > 0) {
          handleSelectReport(list[0]);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error.response?.data?.message || 'Gagal memuat daftar pengaduan.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setErrorMessage('');
    setSuccessMessage('');

    if (adminNote.trim().length < 5) {
      setErrorMessage('Catatan tindak lanjut admin minimal 5 karakter.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch(`/v1/admin/reports/${selectedReport.id}`, {
        status,
        admin_note: adminNote.trim(),
        notify_merchant: notifyMerchant,
        merchant_message: merchantMessage.trim() || adminNote.trim(),
      });
      setSuccessMessage(data.message || 'Tindak lanjut berhasil disimpan.');
      const updated = data.data;
      setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedReport(updated);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Gagal menyimpan tindak lanjut.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#03045E]">Pengaduan &amp; Laporan Mahasiswa</h1>
        <p className="text-xs text-[#536B82] mt-1">
          Tinjau laporan pelanggaran proses rekrutmen maupun pekerjaan, lalu kirimkan notifikasi tindak lanjut ke Merchant terkait.
        </p>
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daftar Laporan Masuk */}
        <section className="bg-white rounded-2xl border border-[#D8E5EE] p-5 space-y-3">
          <h2 className="text-sm font-extrabold text-[#03045E]">Daftar Laporan Masuk ({reports.length})</h2>
          {loading ? (
            <p className="text-xs text-[#536B82]">Memuat laporan...</p>
          ) : reports.length === 0 ? (
            <p className="text-xs text-[#536B82]">Belum ada pengaduan dari mahasiswa.</p>
          ) : (
            <div className="space-y-2.5">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                const label = STATUS_OPTIONS.find((s) => s.value === rep.status)?.label || rep.status;
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => handleSelectReport(rep)}
                    className={`w-full text-left rounded-xl border p-3.5 transition space-y-1.5 ${
                      isSelected
                        ? 'border-[#023E8A] bg-[#CAF0F8]/30'
                        : 'border-[#D8E5EE] bg-[#F6F9FC] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[rep.status] || ''}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-[#536B82] inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#03045E] line-clamp-1">{rep.title}</p>
                    <p className="text-[11px] text-[#536B82] flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{rep.reporter?.name || 'Mahasiswa'}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Panel Detail & Tindak Lanjut Admin */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#D8E5EE] p-6">
          {!selectedReport ? (
            <p className="text-xs text-[#536B82]">Pilih salah satu laporan di sebelah kiri untuk ditindaklanjuti.</p>
          ) : (
            <div className="space-y-5">
              <div className="border-b border-[#D8E5EE] pb-4 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{selectedReport.category}</span>
                </span>
                <h2 className="text-lg font-extrabold text-[#03045E]">{selectedReport.title}</h2>
                <div className="flex flex-wrap gap-4 text-xs text-[#536B82]">
                  <span>Pelapor: <strong>{selectedReport.reporter?.name}</strong> ({selectedReport.reporter?.email})</span>
                  {selectedReport.merchant_profile && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#0077B6]" />
                      Merchant: <strong>{selectedReport.merchant_profile.merchant_name}</strong>
                    </span>
                  )}
                </div>
                <div className="rounded-xl bg-[#F6F9FC] border border-[#D8E5EE] p-3.5 text-xs text-[#03045E] whitespace-pre-line">
                  {selectedReport.description}
                </div>
              </div>

              <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                    Status Penanganan Laporan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-[#D8E5EE] px-3 py-2.5 text-xs font-semibold text-[#03045E]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#03045E] mb-1.5">
                    Catatan Tindak Lanjut Admin (Tampil ke Mahasiswa) <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Contoh: Laporan telah kami terima dan tim kami sedang menghubungi pihak merchant untuk klarifikasi..."
                    className="w-full rounded-xl border border-[#D8E5EE] p-3 text-xs text-[#03045E]"
                  />
                </div>

                {selectedReport.merchant_profile && (
                  <div className="rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-4 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#03045E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyMerchant}
                        onChange={(e) => setNotifyMerchant(e.target.checked)}
                        className="rounded border-[#D8E5EE]"
                      />
                      <Bell className="w-4 h-4 text-[#0077B6]" />
                      <span>Kirim notifikasi peringatan/tindak lanjut ke Merchant ({selectedReport.merchant_profile.merchant_name})</span>
                    </label>

                    {notifyMerchant && (
                      <textarea
                        rows={2}
                        value={merchantMessage}
                        onChange={(e) => setMerchantMessage(e.target.value)}
                        placeholder="Pesan khusus untuk Merchant (kosongkan jika ingin menyamakan dengan catatan tindak lanjut di atas)..."
                        className="w-full rounded-xl border border-[#D8E5EE] bg-white p-2.5 text-xs text-[#03045E]"
                      />
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#023E8A] hover:bg-[#03045E] disabled:opacity-60 text-white px-5 py-2.5 text-xs font-bold transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}</span>
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
