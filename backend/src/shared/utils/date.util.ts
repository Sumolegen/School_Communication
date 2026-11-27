export function toDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const isoDate = value.includes('T') ? value.split('T')[0] : value;
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function getMonthRange(monthInput?: string): { start: Date; end: Date } {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;

  if (monthInput && /^\d{4}-\d{2}$/.test(monthInput)) {
    const [y, m] = monthInput.split('-').map(Number);
    year = y;
    month = m;
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
