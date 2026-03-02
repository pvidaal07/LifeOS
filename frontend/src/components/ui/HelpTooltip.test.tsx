import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HelpTooltip } from './HelpTooltip';

describe('HelpTooltip', () => {
  it('renders a help button with aria-label "Ayuda"', () => {
    render(<HelpTooltip content="Texto de ayuda" />);

    const button = screen.getByRole('button', { name: 'Ayuda' });
    expect(button).toBeInTheDocument();
  });

  it('does not show tooltip content by default', () => {
    render(<HelpTooltip content="Texto de ayuda" />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip content when button is clicked', () => {
    render(<HelpTooltip content="Texto de ayuda" />);

    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Texto de ayuda')).toBeInTheDocument();
  });

  it('hides tooltip when button is clicked again', () => {
    render(<HelpTooltip content="Texto de ayuda" />);

    const button = screen.getByRole('button', { name: 'Ayuda' });
    fireEvent.click(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('sets aria-expanded correctly', () => {
    render(<HelpTooltip content="Texto de ayuda" />);

    const button = screen.getByRole('button', { name: 'Ayuda' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes tooltip on Escape key press', () => {
    render(<HelpTooltip content="Texto de ayuda" />);

    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('closes tooltip on click outside', () => {
    render(
      <div>
        <HelpTooltip content="Texto de ayuda" />
        <button>Otro boton</button>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Otro boton' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders ReactNode content', () => {
    render(
      <HelpTooltip
        content={<span data-testid="custom-content">Contenido personalizado</span>}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }));
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <HelpTooltip content="Texto" className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
