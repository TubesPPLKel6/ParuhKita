export const SURVEY_CATEGORIES = [
  {
    id: 'wage',
    title: 'A. Upah',
    description: 'Kesesuaian upah dan kejelasan pembayaran.',
    icon: 'wallet',
    questions: [
      'Upah sesuai dengan pekerjaan yang saya lakukan.',
      'Sistem pembayaran upah dijelaskan dengan jelas.',
      'Upah dibayarkan tepat waktu.',
      'Upah yang diterima sesuai dengan kesepakatan kerja.',
    ],
  },
  {
    id: 'hours',
    title: 'B. Jam Kerja',
    description: 'Jadwal, durasi kerja, dan waktu istirahat.',
    icon: 'clock',
    questions: [
      'Jadwal kerja disampaikan dengan jelas.',
      'Jam kerja sesuai dengan kesepakatan.',
      'Saya memperoleh waktu istirahat yang cukup.',
      'Beban kerja sesuai dengan waktu kerja yang tersedia.',
    ],
  },
  {
    id: 'safety',
    title: 'C. Keamanan',
    description: 'Rasa aman dan perlindungan selama bekerja.',
    icon: 'shield',
    questions: [
      'Lingkungan kerja terasa aman.',
      'Fasilitas keselamatan kerja tersedia.',
      'Prosedur keselamatan dijelaskan dengan jelas.',
      'Saya mendapatkan perlindungan selama bekerja.',
    ],
  },
  {
    id: 'tasks',
    title: 'D. Kejelasan Tugas',
    description: 'Pemahaman peran, tanggung jawab, dan instruksi.',
    icon: 'clipboard',
    questions: [
      'Deskripsi pekerjaan disampaikan dengan jelas.',
      'Tanggung jawab saya dijelaskan dengan jelas.',
      'Pekerjaan sesuai dengan posisi yang saya tempati.',
      'Instruksi dari atasan mudah dipahami.',
    ],
  },
];

export const SCALE_LABELS = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju'];

export function categoryAverage(ratings, categoryId) {
  const scores = ratings[categoryId] || [];
  if (!scores.length) return 0;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function formatAverage(value) {
  return value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}