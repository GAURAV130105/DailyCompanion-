import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDuration, todayISO } from './lib/utils';

describe('Utility Formatters', () => {
  it('formats currency correctly in INR', () => {
    const formatted = formatCurrency(2500);
    expect(formatted).toContain('2,500');
  });

  it('formats duration under 60 minutes correctly', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats duration over 60 minutes with hours and minutes', () => {
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(120)).toBe('2h');
  });

  it('todayISO returns YYYY-MM-DD pattern', () => {
    const iso = todayISO();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
