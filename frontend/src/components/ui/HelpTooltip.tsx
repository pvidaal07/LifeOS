import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  className?: string;
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ayuda"
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-3 text-sm text-text-primary shadow-md"
        >
          {content}
        </div>
      )}
    </div>
  );
}
