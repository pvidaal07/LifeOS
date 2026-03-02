import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import type { WeeklyTrendItem } from '../../types';

// Mock recharts to avoid rendering canvas/SVG in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="grid" />,
}));

const SAMPLE_DATA: WeeklyTrendItem[] = [
  { date: '2026-02-23', totalMinutes: 30, sessionCount: 2 },
  { date: '2026-02-24', totalMinutes: 45, sessionCount: 3 },
  { date: '2026-02-25', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-02-26', totalMinutes: 60, sessionCount: 4 },
  { date: '2026-02-27', totalMinutes: 15, sessionCount: 1 },
  { date: '2026-02-28', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-03-01', totalMinutes: 20, sessionCount: 1 },
];

const EMPTY_DATA: WeeklyTrendItem[] = [
  { date: '2026-02-23', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-02-24', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-02-25', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-02-26', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-02-27', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-02-28', totalMinutes: 0, sessionCount: 0 },
  { date: '2026-03-01', totalMinutes: 0, sessionCount: 0 },
];

describe('WeeklyTrendChart', () => {
  it('renders chart title with correct diacritics', () => {
    render(<WeeklyTrendChart data={SAMPLE_DATA} />);

    expect(screen.getByText('Minutos de estudio (7 días)')).toBeInTheDocument();
  });

  it('renders chart when data has activity', () => {
    render(<WeeklyTrendChart data={SAMPLE_DATA} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.queryByText('Sin actividad esta semana')).not.toBeInTheDocument();
  });

  it('shows empty state message when all days have zero minutes', () => {
    render(<WeeklyTrendChart data={EMPTY_DATA} />);

    expect(screen.getByText('Sin actividad esta semana')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('shows empty state for empty array', () => {
    render(<WeeklyTrendChart data={[]} />);

    expect(screen.getByText('Sin actividad esta semana')).toBeInTheDocument();
  });
});
