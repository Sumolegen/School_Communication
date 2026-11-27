import React from 'react';

export interface CalendarDayMarker {
  dateIso: string; // YYYY-MM-DD
  label: string;
  tone: 'success' | 'danger' | 'warning' | 'info' | 'accent';
}

const TONE_MAP: Record<CalendarDayMarker['tone'], { bg: string; color: string }> = {
  success: { bg: 'var(--success-bg)', color: 'var(--success-text)' },
  danger: { bg: 'var(--danger-bg)', color: 'var(--danger-text)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning-text)' },
  info: { bg: 'var(--info-bg)', color: 'var(--info-text)' },
  accent: { bg: 'var(--brand-accent-soft)', color: 'var(--brand-accent-hover)' },
};

export const MonthCalendar: React.FC<{
  month: string; // YYYY-MM
  markers: CalendarDayMarker[];
}> = ({ month, markers }) => {
  const [yearNum, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(yearNum, monthNum - 1, 1));
  const daysInMonth = new Date(Date.UTC(yearNum, monthNum, 0)).getUTCDate();
  const startWeekday = firstDay.getUTCDay(); // 0=Sun

  const markerMap = new Map<string, CalendarDayMarker[]>();
  for (const m of markers) {
    const existing = markerMap.get(m.dateIso) ?? [];
    existing.push(m);
    markerMap.set(m.dateIso, existing);
  }

  const cells: Array<number | null> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card" style={{ padding: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 6,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        {dayHeaders.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} style={{ minHeight: 62 }} />;
          }
          const iso = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayMarkers = markerMap.get(iso) ?? [];
          const primaryTone = dayMarkers[0]?.tone;
          const styleColors = primaryTone ? TONE_MAP[primaryTone] : null;

          return (
            <div
              key={iso}
              style={{
                minHeight: 64,
                padding: 6,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: styleColors ? styleColors.bg : 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: styleColors?.color ?? 'var(--text-primary)' }}>
                {day}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayMarkers.slice(0, 2).map((m, i) => (
                  <span
                    key={`${iso}-${i}`}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: TONE_MAP[m.tone].color,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={m.label}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
