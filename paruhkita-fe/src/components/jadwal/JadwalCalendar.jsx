import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HOURS = Array.from({ length: 12 }, (_, index) => 8 + index);
const ROW_HEIGHT = 57;

export function parseDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function toISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (copy.getDay() + 6) % 7; // Senin = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function addDays(date, amount) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function addMonths(date, amount) {
  const copy = new Date(date.getFullYear(), date.getMonth(), 1);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}

function minutesOf(time) {
  const [hour, minute] = String(time).split(':').map(Number);
  return hour * 60 + (minute || 0);
}

function weekLabel(weekStart) {
  const weekNumber = Math.ceil(weekStart.getDate() / 7);
  return `Minggu ke-${weekNumber} ${MONTH_FULL[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
}

function rangeLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const month = MONTH_FULL[weekStart.getMonth()];
  const endMonth = MONTH_FULL[weekEnd.getMonth()];
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()} – ${weekEnd.getDate()} ${month} ${weekStart.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${month} – ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
}

export default function JadwalCalendar({
  weekStart,
  monthCursor,
  schedules = [],
  view = 'minggu',
  today,
  onChangeWeek,
  onChangeMonth,
  onToday,
  onChangeView,
  onSelectSchedule,
  onCreate,
}) {
  const todayISO = today || toISO(new Date());
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const eventsByDate = useMemo(() => {
    const map = {};
    schedules.forEach((schedule) => {
      const key = schedule.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(schedule);
    });
    Object.values(map).forEach((list) => {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [schedules]);

  const monthGrid = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [monthCursor]);

  const monthEventsByDate = useMemo(() => {
    const map = {};
    schedules.forEach((schedule) => {
      const key = schedule.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(schedule);
    });
    return map;
  }, [schedules]);

  const rangeText = view === 'minggu' ? rangeLabel(weekStart) : `${MONTH_FULL[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;
  const titleText = view === 'minggu' ? weekLabel(weekStart) : `Kalender ${MONTH_FULL[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;

  const step = (direction) => {
    if (view === 'minggu') {
      onChangeWeek(addDays(weekStart, direction * 7));
    } else {
      onChangeMonth(addMonths(monthCursor, direction));
    }
  };

  return (
    <section className="rounded-xl border border-pk-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pk-line px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[16px] font-bold text-pk-navy">{titleText}</h2>
          <span className="text-[12px] text-pk-muted">{rangeText}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-pk-border text-pk-muted transition hover:bg-pk-soft hover:text-pk-navy"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-pk-border text-pk-muted transition hover:bg-pk-soft hover:text-pk-navy"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="ml-1 h-8 rounded-md border border-pk-border px-3 text-[12px] font-semibold text-pk-navy transition hover:bg-pk-soft"
          >
            Hari ini
          </button>
          <div className="ml-1 flex items-center rounded-md border border-pk-border bg-white p-0.5">
            <button
              type="button"
              onClick={() => onChangeView('minggu')}
              className={`h-7 rounded px-4 text-[12px] font-semibold transition ${
                view === 'minggu' ? 'bg-pk-cyan text-white shadow-xs' : 'text-pk-muted hover:text-pk-navy'
              }`}
            >
              Minggu
            </button>
            <button
              type="button"
              onClick={() => onChangeView('bulan')}
              className={`h-7 rounded px-4 text-[12px] font-semibold transition ${
                view === 'bulan' ? 'bg-pk-cyan text-white shadow-xs' : 'text-pk-muted hover:text-pk-navy'
              }`}
            >
              Bulan
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {view === 'minggu' ? (
          <div className="min-w-[860px]">
            {/* Header hari */}
            <div
              className="grid border-b border-pk-line"
              style={{ gridTemplateColumns: '56px repeat(7, minmax(0, 1fr))' }}
            >
              <div />
              {days.map((day, index) => {
                const iso = toISO(day);
                const isToday = iso === todayISO;
                return (
                  <div key={iso} className={`border-l border-pk-line py-2 text-center ${isToday ? 'bg-[#F5FAFD]' : ''}`}>
                    <p className={`text-[11px] font-semibold ${isToday ? 'text-pk-cyan' : 'text-pk-muted'}`}>
                      {DAY_SHORT[index]}
                    </p>
                    <p className={`text-[11px] ${isToday ? 'font-semibold text-pk-cyan' : 'text-pk-hint'}`}>
                      {day.getDate()} {MONTH_SHORT[day.getMonth()]}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Grid jam */}
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, minmax(0, 1fr))' }}>
              <div>
                {HOURS.map((hour) => (
                  <div key={hour} className="relative" style={{ height: ROW_HEIGHT }}>
                    <span className="absolute right-2 top-1 text-[10px] text-pk-hint">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {days.map((day) => {
                const iso = toISO(day);
                const isToday = iso === todayISO;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const events = eventsByDate[iso] || [];

                return (
                  <div
                    key={iso}
                    className={`relative border-l border-pk-line ${isToday ? 'bg-[#F5FAFD]' : isWeekend ? 'bg-[#FAFCFD]' : 'bg-white'}`}
                    style={{ height: ROW_HEIGHT * HOURS.length }}
                    onDoubleClick={() => onCreate?.(iso)}
                  >
                    {HOURS.map((hour) => (
                      <div key={hour} className="border-b border-pk-line" style={{ height: ROW_HEIGHT }} />
                    ))}

                    {events.map((schedule) => {
                      const start = minutesOf(schedule.start_time);
                      const end = minutesOf(schedule.end_time);
                      const top = ((start - 8 * 60) / 60) * ROW_HEIGHT;
                      const height = Math.max(20, ((end - start) / 60) * ROW_HEIGHT - 8);

                      return (
                        <button
                          type="button"
                          key={schedule.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectSchedule?.(schedule);
                          }}
                          title={`${schedule.candidate?.name} · ${schedule.time_label}`}
                          className="absolute left-1 right-1 overflow-hidden rounded-[3px] border-l-2 border-pk-cyan bg-pk-event px-1.5 py-0.5 text-left transition hover:brightness-[0.97]"
                          style={{ top: top + 1, height }}
                        >
                          <span className="line-clamp-2 block text-[9.5px] font-medium leading-[1.15] text-pk-primary">
                            Wawancara — {schedule.candidate?.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-w-[860px]">
            <div className="grid grid-cols-7 border-b border-pk-line">
              {DAY_SHORT.map((day) => (
                <div key={day} className="border-l border-pk-line py-2 text-center text-[11px] font-semibold text-pk-muted first:border-l-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthGrid.map((day) => {
                const iso = toISO(day);
                const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
                const isToday = iso === todayISO;
                const events = monthEventsByDate[iso] || [];

                return (
                  <div
                    key={iso}
                    className={`min-h-[104px] border-b border-l border-pk-line p-2 first:border-l-0 ${
                      isCurrentMonth ? 'bg-white' : 'bg-[#FAFCFD]'
                    } ${isToday ? 'bg-[#F5FAFD]' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold ${isToday ? 'text-pk-cyan' : isCurrentMonth ? 'text-pk-navy' : 'text-pk-hint'}`}>
                        {day.getDate()}
                      </span>
                      {events.length > 2 && <span className="text-[9px] text-pk-hint">+{events.length - 2}</span>}
                    </div>
                    <div className="mt-1 space-y-1">
                      {events.slice(0, 2).map((schedule) => (
                        <button
                          type="button"
                          key={schedule.id}
                          onClick={() => onSelectSchedule?.(schedule)}
                          className="block w-full truncate rounded-[3px] border-l-2 border-pk-cyan bg-pk-event px-1 py-0.5 text-left text-[9px] font-medium text-pk-primary"
                          title={`${schedule.candidate?.name} · ${schedule.time_label}`}
                        >
                          {schedule.start_label} {schedule.candidate?.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-6 py-3">
        <span className="h-2.5 w-2.5 rounded-sm bg-pk-cyan" />
        <span className="text-[11px] text-pk-muted">Wawancara</span>
      </div>
    </section>
  );
}
