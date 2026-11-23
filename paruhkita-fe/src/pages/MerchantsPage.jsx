import { useMemo, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react';

const initialApplicants = [
  { id: 1, name: 'Aulia Adi', initials: 'NA', job: 'Barista paruh waktu', stage: 'Jadwal wawancara', date: '14 Okt ┬╖ 10.00' },
  { id: 2, name: 'Rizky Pratama', initials: 'RP', job: 'Kasir sore', stage: 'Melamar', date: '13 Okt ┬╖ 09.12' },
  { id: 3, name: 'Dinda Putri', initials: 'DP', job: 'Kasir sore', stage: 'Trial shift', date: '12 Okt ┬╖ 13.30' },
  { id: 4, name: 'Fajar Ramadhan', initials: 'FR', job: 'Crew outlet', stage: 'Diterima', date: '12 Okt ┬╖ 11.00' },
  { id: 5, name: 'Salsa Maharani', initials: 'SM', job: 'Kasir sore', stage: 'Melamar', date: '11 Okt ┬╖ 08.45' },
];

const stages = ['Semua', 'Melamar', 'Jadwal wawancara', 'Trial shift', 'Diterima'];

const jobs = [
  { title: 'Barista paruh waktu', applicants: 8, schedule: 'SeninΓÇôJumat ┬╖ 16.00ΓÇô20.00', pay: 'Rp25.000/jam' },
  { title: 'Kasir sore', applicants: 10, schedule: 'SeninΓÇôSabtu ┬╖ 15.00ΓÇô21.00', pay: 'Rp22.000/jam' },
  { title: 'Crew akhir pekan', applicants: 6, schedule: 'SabtuΓÇôMinggu ┬╖ 08.00ΓÇô12.00', pay: 'Rp23.000/jam' },
];

function StatCard({ label, value, note, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <Icon size={17} className="text-sky-700" />
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

export default function MerchantsPage() {
  const [activeStage, setActiveStage] = useState('Semua');
  const [search, setSearch] = useState('');

  const visibleApplicants = useMemo(() => {
    return initialApplicants.filter((applicant) => {
      const matchesStage = activeStage === 'Semua' || applicant.stage === activeStage;
      const matchesSearch =
        applicant.name.toLowerCase().includes(search.toLowerCase()) ||
        applicant.job.toLowerCase().includes(search.toLowerCase());

      return matchesStage && matchesSearch;
    });
  }, [activeStage, search]);

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-slate-800 lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-[#07105F] p-5 text-white lg:flex">
        <div className="mb-8 flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-400">P</span>
          ParuhKita
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kopi Sela</p>
        <p className="mb-6 mt-1 text-xs text-slate-300">Merchant terverifikasi</p>

        <nav className="space-y-2 text-sm">
          {[
            ['Dashboard', LayoutDashboard],
            ['Lowongan', BriefcaseBusiness],
            ['Kandidat', Users],
            ['Jadwal', CalendarDays],
            ['Pesan', MessageSquare],
            ['Pengaturan', Settings],
          ].map(([label, Icon], index) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                index === 0 ? 'bg-blue-800 text-white' : 'text-slate-300 hover:bg-blue-900'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
          <nav className="hidden gap-6 text-sm md:flex">
            <span className="font-semibold text-blue-800">Dashboard</span>
            <span className="text-slate-500">Kandidat</span>
            <span className="text-slate-500">Lowongan</span>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Bell size={18} className="text-slate-600" />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-blue-900">KS</span>
            <span className="hidden text-sm font-medium sm:inline">Kopi Sela</span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard Merchant</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Selamat pagi, tim Kopi Sela.</h1>
              <p className="mt-1 text-sm text-slate-500">Pantau lowongan dan proses rekrutmen kandidat.</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900">
              <Plus size={16} />
              Tambah lowongan
            </button>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Lowongan aktif" value="3" note="2 posisi tersedia" icon={BriefcaseBusiness} />
            <StatCard label="Total pelamar" value="24" note="Di semua lowongan" icon={Users} />
            <StatCard label="Wawancara terjadwal" value="6" note="Minggu ini" icon={CalendarDays} />
            <StatCard label="Kandidat diterima" value="3" note="Sepanjang bulan ini" icon={CheckCircle2} />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="font-bold text-slate-900">Pantau proses rekrutmen</h2>
                <p className="mt-1 text-xs text-slate-500">Tinjau pelamar dan perkembangan seleksi.</p>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <Search size={15} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kandidat atau lowongan"
                  className="w-44 text-xs outline-none"
                />
              </label>
            </div>

            <div className="flex gap-2 overflow-x-auto px-5 pb-4">
              {stages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                    activeStage === stage ? 'bg-cyan-100 text-blue-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Kandidat</th>
                    <th className="px-5 py-3">Lowongan</th>
                    <th className="px-5 py-3">Tahap</th>
                    <th className="px-5 py-3">Pembaruan</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleApplicants.map((applicant) => (
                    <tr key={applicant.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-blue-900">
                            {applicant.initials}
                          </span>
                          <span className="font-medium">{applicant.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{applicant.job}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-blue-900">
                          {applicant.stage}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{applicant.date}</td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-blue-800" aria-label={`Tinjau ${applicant.name}`}>
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleApplicants.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-500">
                        Tidak ada pelamar yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Lowongan aktif</h2>
              <span className="text-xs font-semibold text-blue-800">Semua lowongan ΓåÆ</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {jobs.map((job) => (
                <article key={job.title} className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                  <span className="rounded-full bg-cyan-200 px-2 py-1 text-[10px] font-bold text-blue-900">AKTIF</span>
                  <h3 className="mt-3 font-bold text-slate-900">{job.title}</h3>
                  <p className="mt-2 text-xs text-slate-600">{job.schedule}</p>
                  <div className="mt-4 flex justify-between text-xs">
                    <span>{job.pay}</span>
                    <span className="font-semibold">{job.applicants} pelamar</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="flex items-center gap-3 rounded-xl bg-[#07105F] p-4 text-white">
            <Clock3 size={20} className="text-cyan-300" />
            <p className="flex-1 text-sm">Berikutnya: wawancara kandidat untuk posisi Barista.</p>
            <button className="text-xs font-semibold text-amber-300">Lihat jadwal</button>
          </section>
        </main>
      </div>
    </div>
  );
}
