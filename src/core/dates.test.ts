import { describe, expect, it } from 'vitest';
import { compareOptionalTimes, formatTime12, todayString } from './dates';

describe('date helpers', () => {
  it('formats midnight, morning and evening in 12-hour time', () => {
    expect(formatTime12('00:00')).toBe('12:00 AM');
    expect(formatTime12('07:05')).toBe('7:05 AM');
    expect(formatTime12('19:00')).toBe('7:00 PM');
  });

  it('sorts missing reminder times last', () => {
    expect(compareOptionalTimes('07:00', '20:00')).toBeLessThan(0);
    expect(compareOptionalTimes(null, '20:00')).toBeGreaterThan(0);
  });

  it('formats a local date without UTC shifting', () => {
    expect(todayString(new Date(2026, 6, 13))).toBe('2026-07-13');
  });
});
