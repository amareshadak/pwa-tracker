export const TIMEZONE = 'Asia/Kolkata';

export function todayString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime12(time24?: string | null): string {
  if (!time24) return 'No time';
  const [hour, minute] = time24.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return 'No time';
  }
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function compareOptionalTimes(a?: string | null, b?: string | null): number {
  return (a || '99:99').localeCompare(b || '99:99');
}
