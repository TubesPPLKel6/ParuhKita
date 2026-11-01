import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';

export default function LamaranSaya() {
  const dummyApplications = [
    {
      id: 1,
      jobTitle: 'Barista paruh waktu',
      company: 'Kopi Sela',
      location: 'Gejayan · 1,2 km dari UGM',
      appliedAt: '28 Oktober 2026',
      status: 'Wawancara Dijadwalkan',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      note: 'Wawancara: Rabu, 14 Oktober 2026 jam 16.00 WIB.',
    },
    {
      id: 2,
      jobTitle: 'Kasir toko buku',
      company: 'Aksara Bookshop',
      location: 'Caturtunggal · 1,8 km dari UGM',
      appliedAt: '24 Oktober 2026',
      status: 'Menunggu Review Merchant',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      note: 'CV dan profilmu sudah dikirim ke pemilik usaha.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-[#03045E]">Pelacakan Lamaran Saya</h1>
        <p className="text-xs sm:text-sm text-[#536B82] mt-1">
          Pantau perkembangan status berkas lamaran, jadwal seleksi, dan feedback dari merchant.
        </p>
      </div>

      <div className="space-y-4">
        {dummyApplications.map((app) => (
          <div 
            key={app.id} 
            className="bg-white rounded-2xl border border-[#D8E5EE] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#023E8A]">{app.company}</span>
                <span className="text-slate-300">&middot;</span>
                <span className="text-xs text-[#536B82]">{app.location}</span>
              </div>
              <h3 className="text-base font-extrabold text-[#102C4D]">{app.jobTitle}</h3>
              <p className="text-xs text-[#536B82]">{app.note}</p>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${app.statusColor}`}>
                {app.status}
              </span>
              <span className="text-[10px] text-slate-400">Diajukan: {app.appliedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
