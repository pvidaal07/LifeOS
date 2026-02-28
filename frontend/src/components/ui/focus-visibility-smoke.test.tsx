import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { Input } from './Input';

describe('Focus visibility smoke', () => {
  it('keeps controls focusable with focus-visible style hooks', () => {
    render(
      <div>
        <Button>Accion</Button>
        <Input aria-label="Correo" />
      </div>,
    );

    const button = screen.getByRole('button', { name: 'Accion' });
    const input = screen.getByRole('textbox', { name: 'Correo' });

    button.focus();
    expect(button).toHaveFocus();
    expect(button.className).toContain('focus-visible:outline-none');

    input.focus();
    expect(input).toHaveFocus();
    expect(input.className).toContain('focus-visible:ring-2');
  });
});
