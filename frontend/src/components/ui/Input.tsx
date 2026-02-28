import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-muted-foreground transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-state-danger focus-visible:ring-2 focus-visible:ring-state-danger/30'
            : 'border-input focus-visible:ring-2 focus-visible:ring-ring/30',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
