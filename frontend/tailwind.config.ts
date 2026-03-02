import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        canvas: {
          DEFAULT: 'hsl(var(--bg-canvas))',
          muted: 'hsl(var(--bg-canvas-muted))',
        },
        surface: {
          DEFAULT: 'hsl(var(--bg-surface))',
          muted: 'hsl(var(--bg-surface-muted))',
        },
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          muted: 'hsl(var(--text-muted))',
          inverse: 'hsl(var(--text-inverse))',
        },
        state: {
          success: {
            DEFAULT: 'hsl(var(--state-success))',
            soft: 'hsl(var(--state-success-soft))',
            foreground: 'hsl(var(--state-success-fg))',
          },
          warning: {
            DEFAULT: 'hsl(var(--state-warning))',
            soft: 'hsl(var(--state-warning-soft))',
            foreground: 'hsl(var(--state-warning-fg))',
          },
          danger: {
            DEFAULT: 'hsl(var(--state-danger))',
            soft: 'hsl(var(--state-danger-soft))',
            foreground: 'hsl(var(--state-danger-fg))',
          },
          info: {
            DEFAULT: 'hsl(var(--state-info))',
            soft: 'hsl(var(--state-info-soft))',
            foreground: 'hsl(var(--state-info-fg))',
          },
        },
        brand: {
          primary: {
            100: 'hsl(var(--color-primary-100))',
            500: 'hsl(var(--color-primary-500))',
            700: 'hsl(var(--color-primary-700))',
            900: 'hsl(var(--color-primary-900))',
          },
          secondary: {
            100: 'hsl(var(--color-secondary-100))',
            500: 'hsl(var(--color-secondary-500))',
            700: 'hsl(var(--color-secondary-700))',
            900: 'hsl(var(--color-secondary-900))',
          },
          accent: {
            200: 'hsl(var(--color-accent-200))',
            500: 'hsl(var(--color-accent-500))',
            700: 'hsl(var(--color-accent-700))',
          },
        },

        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-bg-from))',
          to: 'hsl(var(--sidebar-bg-to))',
          foreground: 'hsl(var(--sidebar-text))',
          muted: 'hsl(var(--sidebar-text-muted))',
          active: 'hsl(var(--sidebar-active-bg))',
        },
      },
      borderRadius: {
        xl: 'var(--radius-lg)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        subtle: 'var(--shadow-xs)',
        soft: 'var(--shadow-sm)',
        float: 'var(--shadow-md)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
