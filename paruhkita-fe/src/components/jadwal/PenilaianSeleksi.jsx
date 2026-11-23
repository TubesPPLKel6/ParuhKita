import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Star, User } from 'lucide-react';

const DECISIONS = [
  { value: 'terima', label: 'Terima Langsung' },
  { value: 'tolak', label: 'Tolak dengan Feedback' },
  { value: 'tahan', label: 'Tahan / Pertimbangkan Nanti' },
];

function recommendationFor(total) {
  if (total >= 22) return 'Sangat Direkomendasikan';
  if (total >= 17) return 'Direkomendasikan';
  if (total >= 12) return 'Cukup';
  return 'Belum Direkomendasikan';
}

export default function PenilaianSeleksi({ schedule, criteria = [], evaluation, onSave, saving }) {
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [feedback, setFeedback] = useState('');
  const [sendFeedback, setSendFeedback] = useState(false);
  const [decision, setDecision] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const nextScores = {};
    const nextNotes = {};
    criteria.forEach((item) => {
      const saved = evaluation?.criteria?.[item.key];
      nextScores[item.key] = saved?.score || 0;
      nextNotes[item.key] = saved?.note || '';
    });
    setScores(nextScores);
    setNotes(nextNotes);
    setFeedback(evaluation?.feedback || '');
    setSendFeedback(Boolean(evaluation?.send_feedback));
    setDecision(evaluation?.decision || '');
    setError('');
  }, [criteria, evaluation, schedule?.id]);

  const total = useMemo(
    () => criteria.reduce((sum, item) => sum + (Number(scores[item.key]) || 0), 0),
    [criteria, scores]
  );

  const maxScore = criteria.length * 5;
  const candidate = schedule?.candidate;

  const save = async (status) => {
    setError('');

    if (status === 'final') {
      const incomplete = criteria.some((item) => !scores[item.key]);
      if (incomplete) {
        setError('Semua kriteria wajib diberi nilai sebelum penilaian dikirim.');
        return;
      }
      if (!decision) {
        setError('Pilih keputusan seleksi terlebih dahulu.');
        return;
      }
    }

    const payload = {
      criteria: Object.fromEntries(
        criteria.map((item) => [item.key, { score: Number(scores[item.key]) || 0, note: notes[item.key] || '' }])
      ),
      feedback,
      send_feedback: sendFeedback,
      decision: decision || null,
      status,
    };

    try {
      await onSave(payload);
    } catch (submitError) {
      const response = submitError?.response;
      setError(
        response?.data?.errors?.criteria?.[0]
          || response?.data?.errors?.decision?.[0]
          || response?.data?.message
          || 'Penilaian gagal disimpan. Coba lagi.'
      );
    }
  };

  if (!schedule) return null;

  return (
    <section className="rounded-xl border border-pk-border bg-white px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-pk-line pb-4">
        <div>
          <h2 className="text-[15px] font-bold text-pk-navy">Formulir Performa Wawancara</h2>
          <p className="mt-1 text-[11px] text-pk-muted">Berikan penilaian objektif terhadap performa wawancara kandidat.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-[#F1F7FA] px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pk-cyan text-[11px] font-bold text-white">
            {candidate?.initials || 'NA'}
          </span>
          <div>
            <p className="text-[12px] font-bold text-pk-navy">
              {candidate?.name} · {candidate?.university || '-'}
            </p>
            <p className="text-[10.5px] text-pk-muted">{schedule.job?.title}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-pk-line py-3 text-[11px] text-pk-muted">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-pk-cyan" />
          {schedule.type_label}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-pk-muted" />
          {schedule.date_label} · {schedule.start_time} WIB
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-pk-muted" />
          {schedule.location}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {criteria.map((item) => {
          const score = Number(scores[item.key]) || 0;
          return (
            <div key={item.key} className="rounded-lg border border-pk-line bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-pk-navy">{item.label}</h3>
                <span className="text-[11px] text-pk-muted">{score}/5</span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setScores((current) => ({ ...current, [item.key]: star }));
                      setError('');
                    }}
                    className="rounded p-0.5 transition hover:scale-110"
                    aria-label={`Beri ${star} bintang untuk ${item.label}`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= score ? 'fill-pk-gold text-pk-gold' : 'fill-pk-border text-pk-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={notes[item.key] || ''}
                onChange={(event) => setNotes((current) => ({ ...current, [item.key]: event.target.value }))}
                placeholder="Catatan penilaian..."
                className="mt-2 w-full resize-none rounded-md border border-pk-line bg-pk-canvas px-3 py-2 text-[11px] leading-relaxed text-[#102C4D] placeholder:text-pk-hint outline-none transition focus:border-pk-cyan focus:bg-white"
              />
            </div>
          );
        })}

        <div className="rounded-lg border border-pk-line bg-pk-canvas p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-pk-muted">Total Skor</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[30px] font-extrabold leading-none text-pk-navy">{total}</span>
            <span className="text-[13px] text-pk-muted">/ {maxScore}</span>
          </div>
          <span className="mt-1.5 inline-flex rounded bg-pk-pastel px-2 py-0.5 text-[10px] font-semibold text-pk-primary">
            {recommendationFor(total)}
          </span>
          <div className="mt-4 h-1.5 w-full rounded-full bg-[#E6F2F7]">
            <div
              className="h-full rounded-full bg-pk-cyan transition-all"
              style={{ width: `${maxScore ? (total / maxScore) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="feedback" className="text-[12px] font-semibold text-pk-navy">
          Masukan untuk kandidat <span className="font-normal text-pk-muted">(akan dikirim ke mahasiswa)</span>
        </label>
        <textarea
          id="feedback"
          rows={3}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Tulis masukan yang membangun untuk kandidat..."
          className="mt-2 w-full resize-none rounded-lg border border-pk-border bg-pk-canvas px-4 py-3 text-[11.5px] leading-relaxed text-[#102C4D] placeholder:text-pk-hint outline-none transition focus:border-pk-cyan focus:bg-white"
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-[11px] text-pk-muted">
        <input
          type="checkbox"
          checked={sendFeedback}
          onChange={(event) => setSendFeedback(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-pk-border text-pk-primary accent-pk-primary"
        />
        Kirim feedback ini ke kandidat meskipun tidak lolos seleksi
      </label>

      <div className="mt-5 border-t border-pk-line pt-4">
        <p className="text-[12px] font-semibold text-pk-navy">Keputusan Seleksi</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DECISIONS.map((option) => {
            const selected = decision === option.value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  setDecision(option.value);
                  setError('');
                }}
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-[11.5px] transition ${
                  selected
                    ? 'border-pk-cyan bg-[#EAF6FB] font-semibold text-pk-primary'
                    : 'border-pk-border bg-white text-pk-muted hover:bg-pk-soft'
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                    selected ? 'border-pk-cyan' : 'border-pk-border'
                  }`}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-pk-cyan" />}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => save('final')}
            className="rounded-lg bg-pk-cyan px-5 py-2.5 text-[11.5px] font-bold text-white transition hover:bg-[#0096b8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Penilaian & Kirim Feedback'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save('draft')}
            className="rounded-lg border border-pk-border bg-white px-5 py-2.5 text-[11.5px] font-semibold text-pk-muted transition hover:bg-pk-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            Simpan Draft
          </button>
          {evaluation?.status === 'final' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <User className="h-3.5 w-3.5" /> Penilaian sudah dikirim
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
