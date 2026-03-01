import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getTimeOfDayGreeting,
  getFirstName,
  buildSummaryLine,
} from './greeting-helpers';
import { GreetingWidget } from './GreetingWidget';

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { name: string } }) => unknown) =>
    selector({ user: { name: 'María García López' } }),
}));

// ─── Pure function tests ─────────────────────

describe('getTimeOfDayGreeting', () => {
  it('returns morning greeting for hours 5-11', () => {
    expect(getTimeOfDayGreeting(5)).toBe('Buenos días');
    expect(getTimeOfDayGreeting(8)).toBe('Buenos días');
    expect(getTimeOfDayGreeting(11)).toBe('Buenos días');
  });

  it('returns afternoon greeting for hours 12-17', () => {
    expect(getTimeOfDayGreeting(12)).toBe('Buenas tardes');
    expect(getTimeOfDayGreeting(15)).toBe('Buenas tardes');
    expect(getTimeOfDayGreeting(17)).toBe('Buenas tardes');
  });

  it('returns evening greeting for hours 18-23 and 0-4', () => {
    expect(getTimeOfDayGreeting(18)).toBe('Buenas noches');
    expect(getTimeOfDayGreeting(22)).toBe('Buenas noches');
    expect(getTimeOfDayGreeting(0)).toBe('Buenas noches');
    expect(getTimeOfDayGreeting(4)).toBe('Buenas noches');
  });

  it('returns correct greeting at boundary hours', () => {
    expect(getTimeOfDayGreeting(4)).toBe('Buenas noches');
    expect(getTimeOfDayGreeting(5)).toBe('Buenos días');
    expect(getTimeOfDayGreeting(11)).toBe('Buenos días');
    expect(getTimeOfDayGreeting(12)).toBe('Buenas tardes');
    expect(getTimeOfDayGreeting(17)).toBe('Buenas tardes');
    expect(getTimeOfDayGreeting(18)).toBe('Buenas noches');
  });
});

describe('getFirstName', () => {
  it('extracts first name from a full name', () => {
    expect(getFirstName('María García López')).toBe('María');
  });

  it('returns single name when no spaces', () => {
    expect(getFirstName('Carlos')).toBe('Carlos');
  });

  it('returns null for undefined', () => {
    expect(getFirstName(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(getFirstName(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getFirstName('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(getFirstName('   ')).toBeNull();
  });

  it('trims leading whitespace', () => {
    expect(getFirstName('  Ana  ')).toBe('Ana');
  });
});

describe('buildSummaryLine', () => {
  it('shows zero reviews and zero sessions', () => {
    const result = buildSummaryLine(0, 0);
    expect(result).toBe('No tienes repasos pendientes · Sin sesiones hoy');
  });

  it('shows singular review (1) and singular session (1)', () => {
    const result = buildSummaryLine(1, 1);
    expect(result).toBe('Tienes 1 repaso pendiente · 1 sesión completada hoy');
  });

  it('shows plural reviews and plural sessions', () => {
    const result = buildSummaryLine(5, 3);
    expect(result).toBe('Tienes 5 repasos pendientes · 3 sesiones completadas hoy');
  });

  it('handles mixed counts', () => {
    const result = buildSummaryLine(0, 2);
    expect(result).toContain('No tienes repasos pendientes');
    expect(result).toContain('2 sesiones completadas hoy');
  });
});

// ─── Component rendering tests ───────────────

describe('GreetingWidget', () => {
  it('renders greeting with first name from auth store', () => {
    render(<GreetingWidget pendingReviewCount={3} sessionsToday={1} />);

    // Should show first name
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('María');
  });

  it('renders summary line with correct counts', () => {
    render(<GreetingWidget pendingReviewCount={3} sessionsToday={1} />);

    expect(screen.getByText(/3 repasos pendientes/)).toBeInTheDocument();
    expect(screen.getByText(/1 sesión completada hoy/)).toBeInTheDocument();
  });

  it('renders the current date in Spanish', () => {
    render(<GreetingWidget pendingReviewCount={0} sessionsToday={0} />);

    // The date line should exist — we can't assert exact date but it should contain month text
    const dateElements = screen.getAllByText(/de /);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
