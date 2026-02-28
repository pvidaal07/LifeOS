import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-surface-muted text-muted-foreground',
        secondary: 'border-brand-secondary-100 bg-brand-secondary-100 text-brand-secondary-700',
        success: 'border-state-success/25 bg-state-success-soft text-state-success-foreground',
        warning: 'border-state-warning/25 bg-state-warning-soft text-state-warning-foreground',
        danger: 'border-state-danger/25 bg-state-danger-soft text-state-danger-foreground',
        outline: 'border-border bg-transparent text-text-primary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
