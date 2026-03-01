import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakWidget } from './StreakWidget';

describe('StreakWidget', () => {
  it('displays current streak count with plural "días"', () => {
    render(<StreakWidget streak={{ currentStreak: 5, studiedToday: true }} />);

    expect(screen.getByText('5 días')).toBeInTheDocument();
  });

  it('displays singular "día" for streak of 1', () => {
    render(<StreakWidget streak={{ currentStreak: 1, studiedToday: true }} />);

    expect(screen.getByText('1 día')).toBeInTheDocument();
  });

  it('displays zero streak with encouragement message', () => {
    render(<StreakWidget streak={{ currentStreak: 0, studiedToday: false }} />);

    expect(screen.getByText('0 días')).toBeInTheDocument();
    expect(screen.getByText('Empieza a estudiar para iniciar tu racha')).toBeInTheDocument();
  });

  it('shows "Has estudiado hoy" when studied today', () => {
    render(<StreakWidget streak={{ currentStreak: 3, studiedToday: true }} />);

    expect(screen.getByText('Has estudiado hoy')).toBeInTheDocument();
  });

  it('shows "Estudia hoy para mantener la racha" when not studied today but streak > 0', () => {
    render(<StreakWidget streak={{ currentStreak: 3, studiedToday: false }} />);

    expect(screen.getByText('Estudia hoy para mantener la racha')).toBeInTheDocument();
  });

  it('renders fire emoji with accessible label', () => {
    render(<StreakWidget streak={{ currentStreak: 5, studiedToday: true }} />);

    expect(screen.getByRole('img', { name: 'racha' })).toBeInTheDocument();
  });

  it('renders fire emoji with reduced opacity when streak is zero', () => {
    render(<StreakWidget streak={{ currentStreak: 0, studiedToday: false }} />);

    const fireEmoji = screen.getByRole('img', { name: 'racha' });
    expect(fireEmoji).toHaveClass('grayscale', 'opacity-50');
  });

  it('renders fire emoji without grayscale when streak is active', () => {
    render(<StreakWidget streak={{ currentStreak: 2, studiedToday: true }} />);

    const fireEmoji = screen.getByRole('img', { name: 'racha' });
    expect(fireEmoji).not.toHaveClass('grayscale');
  });
});
